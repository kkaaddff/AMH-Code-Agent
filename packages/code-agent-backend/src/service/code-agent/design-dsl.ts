import { Inject, Provide } from '@midwayjs/decorator';
import { Redis, RedisService } from '@midwayjs/redis';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import axios from 'axios';
import * as crypto from 'crypto';
import { DesignPathAssetEntity } from '../../entity/code-agent/design-dsl/path-asset';
import { applyTransformToBoundingBox, getPathBoundingBox, normalizeTransform } from '@fta/shared';
import type { DesignData, DesignNode, DSLData, LayerNode, LayerStyle, PathItem, PathNode } from '@fta/shared';
import { normalizeNumericValues } from '../../utils/design/dsl';
import { OssManagement } from '../oss';

@Provide()
export class DesignDSLService {
  @Inject()
  private redisClient: RedisService;

  @InjectEntityModel(DesignPathAssetEntity)
  private designPathAssetModel: ReturnModelType<typeof DesignPathAssetEntity>;

  @Inject()
  private ossManagement: OssManagement;

  private readonly pathCachePrefix = 'design-dsl:path:';
  private readonly defaultCacheTTLSeconds = 12 * 60 * 60; // 12小时
  private readonly redisRedirectClients = new Map<string, Redis>();

  /**
   * 生成随机ID
   */
  private generateId(prefix = 'paint_1'): string {
    const randomNum = Math.floor(Math.random() * 99999);
    return `${prefix}:${randomNum.toString().padStart(5, '0')}`;
  }

  /**
   * 统一 pathItems 的 transform，并计算 viewBox（包含 translate/rotate 带来的 bbox 扩展）
   */
  private normalizePathItems(
    pathItems: PathItem[],
    width?: number,
    height?: number
  ): {
    normalizedPathItems: PathItem[];
    viewBox: string;
    width: number;
    height: number;
  } {
    const effectiveWidth = typeof width === 'number' && width > 0 ? width : 100;
    const effectiveHeight = typeof height === 'number' && height > 0 ? height : 100;

    const normalizedPathItems = pathItems.map((item) => ({
      ...item,
      transform: normalizeTransform(item.transform),
    }));

    const boundingBoxes = normalizedPathItems
      .filter((item) => item.data)
      .map((item) => applyTransformToBoundingBox(getPathBoundingBox(item.data), item.transform));

    if (boundingBoxes.length === 0) {
      return {
        normalizedPathItems,
        viewBox: `0 0 ${effectiveWidth} ${effectiveHeight}`,
        width: effectiveWidth,
        height: effectiveHeight,
      };
    }

    const minX = Math.min(...boundingBoxes.map((b) => b.minX));
    const minY = Math.min(...boundingBoxes.map((b) => b.minY));
    const maxX = Math.max(...boundingBoxes.map((b) => b.maxX));
    const maxY = Math.max(...boundingBoxes.map((b) => b.maxY));

    return {
      normalizedPathItems,
      viewBox: `${minX} ${minY} ${maxX - minX} ${maxY - minY}`,
      width: effectiveWidth,
      height: effectiveHeight,
    };
  }

  private getPathDigest(
    pathItems: PathItem[],
    extra?: {
      width?: number;
      height?: number;
      viewBox?: string;
    }
  ): string {
    const combined = pathItems
      .map((item) => {
        const transform = normalizeTransform(item.transform);
        return `${item.data || ''}:${item.fill || ''}:${transform.x}:${transform.y}:${transform.rotate}`;
      })
      .join('|');
    const sizePart = `${extra?.width ?? ''}:${extra?.height ?? ''}:${extra?.viewBox ?? ''}`;
    // 取 sha256 前 16 字符, 保持唯一性和长度要求
    return crypto.createHash('sha256').update(`${combined}|${sizePart}`).digest('hex').slice(0, 16);
  }

  /**
   * 缓存键名
   */
  private getPathCacheKey(digest: string): string {
    return `${this.pathCachePrefix}${digest}`;
  }

  /**
   * 缓存有效期（秒）
   */
  private getPathCacheTTL(): number {
    const ttl = Number(process.env.DESIGN_DSL_PATH_CACHE_TTL);
    if (Number.isFinite(ttl) && ttl > 0) {
      return ttl;
    }
    return this.defaultCacheTTLSeconds;
  }

  /**
   * 解析Redis MOVED/ASK错误中的目标节点
   */
  private parseRedirectTarget(error: any): { host: string; port: number; type: 'MOVED' | 'ASK' } | null {
    const message = typeof error?.message === 'string' ? error.message : '';
    if (!message.startsWith('MOVED') && !message.startsWith('ASK')) {
      return null;
    }
    const parts = message.split(' ');
    const target = parts[2];
    if (!target) {
      return null;
    }
    const [host, portStr] = target.split(':');
    const port = Number(portStr);
    if (!host || !Number.isFinite(port)) {
      return null;
    }
    const type = message.startsWith('ASK') ? 'ASK' : 'MOVED';
    return { host, port, type };
  }

  /**
   * 获取或创建重定向Redis客户端
   */
  private getRedirectClient(host: string, port: number): Redis {
    const key = `${host}:${port}`;
    const cached = this.redisRedirectClients.get(key);
    if (cached) {
      return cached;
    }

    const baseOptions = (this.redisClient as any)?.options || {};
    const redirectClient = new Redis({
      host,
      port,
      password: baseOptions.password,
      db: baseOptions.db,
      tls: baseOptions.tls,
    });
    this.redisRedirectClients.set(key, redirectClient);
    return redirectClient;
  }

  /**
   * 处理Redis集群重定向
   */
  private async tryHandleRedisRedirect(
    action: 'get' | 'set',
    key: string,
    value: string | undefined,
    error: any,
    ttl?: number
  ): Promise<string | null | boolean | undefined> {
    const target = this.parseRedirectTarget(error);
    if (!target) {
      return undefined;
    }

    const client = this.getRedirectClient(target.host, target.port);
    try {
      if (target.type === 'ASK') {
        await client.asking();
      }
      if (action === 'get') {
        return await client.get(key);
      }

      if (action === 'set') {
        if (value === undefined) {
          return false;
        }
        if (ttl !== undefined && Number.isFinite(ttl) && ttl > 0) {
          await client.set(key, value, 'EX', ttl);
        } else {
          await client.set(key, value);
        }
        return true;
      }
    } catch (redirectError) {
      console.warn(
        `Failed to ${action} redis key ${key} after redirect to ${target.host}:${target.port}`,
        redirectError
      );
      return action === 'get' ? null : false;
    }

    return undefined;
  }

  /**
   * Redis get 接口
   */
  private async redisGet(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      const redirectResult = await this.tryHandleRedisRedirect('get', key, undefined, error);
      if (redirectResult !== undefined) {
        return redirectResult as string;
      }
      console.warn(`Failed to get redis key ${key}`, error);
      return null;
    }
  }

  /**
   * Redis set 接口
   */
  private async redisSet(key: string, value: string, ttlSeconds?: number): Promise<void> {
    const ttl = typeof ttlSeconds === 'number' ? ttlSeconds : this.getPathCacheTTL();
    try {
      if (Number.isFinite(ttl) && ttl > 0) {
        await this.redisClient.set(key, value, 'EX', ttl);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      const redirected = await this.tryHandleRedisRedirect('set', key, value, error, ttl);
      if (!redirected) {
        console.warn(`Failed to set redis key ${key}`, error);
      }
    }
  }

  /**
   * 从缓存或数据库读取已转换的图片地址
   */
  private async getCachedImageUrl(digest: string): Promise<string | null> {
    const cacheKey = this.getPathCacheKey(digest);
    const cached = await this.redisGet(cacheKey);
    if (cached) {
      return cached;
    }

    try {
      const record = await this.designPathAssetModel.findOne({ digest }).select('imageUrl').lean();
      if (record?.imageUrl) {
        void this.redisSet(cacheKey, record.imageUrl);
        return record.imageUrl;
      }
    } catch (error) {
      console.warn(`Failed to read design DSL cache from mongodb for digest ${digest}`, error);
    }

    return null;
  }

  /**
   * 写入Redis缓存
   */
  private async setCache(cacheKey: string, imageUrl: string): Promise<void> {
    await this.redisSet(cacheKey, imageUrl);
  }

  /**
   * 将转换结果持久化
   */
  private async persistConversionResult(params: {
    digest: string;
    imageUrl: string;
    pathData: string;
    fillStyle: string;
  }): Promise<void> {
    const { digest, imageUrl, pathData, fillStyle } = params;
    const cacheKey = this.getPathCacheKey(digest);

    void this.setCache(cacheKey, imageUrl);

    try {
      await this.designPathAssetModel.updateOne(
        { digest },
        { digest, imageUrl, pathData, fillStyle },
        { upsert: true }
      );
    } catch (error) {
      console.warn(`Failed to persist design DSL path asset for digest ${digest}`, error);
    }
  }

  /**
   * 将SVG路径数据转换为PNG图片并上传到OSS
   * 支持多个 path 项合并到一个 SVG 中
   */
  private async convertSvgPathToPng(
    pathItems: PathItem[],
    width: number,
    height: number,
    dslData: DSLData
  ): Promise<string> {
    if (!pathItems || pathItems.length === 0) {
      throw new Error('Path items cannot be empty');
    }

    const {
      normalizedPathItems,
      viewBox,
      width: effectiveWidth,
      height: effectiveHeight,
    } = this.normalizePathItems(pathItems, width, height);

    // 计算摘要（包含所有 path 项 + 尺寸信息）
    const digest = this.getPathDigest(normalizedPathItems, {
      width: effectiveWidth,
      height: effectiveHeight,
      viewBox,
    });
    const cachedUrl = await this.getCachedImageUrl(digest);
    if (cachedUrl) {
      console.log(`✅ cached image url: ${cachedUrl}`);
      return cachedUrl;
    }
    console.log(`❌ ${digest} not cached image url, convert to png`);

    try {
      const response = await axios({
        method: 'POST',
        url: 'https://qa-fta-server.amh-group.com/design/convert-svg-path-to-png',
        data: {
          pathItems: normalizedPathItems,
          width: effectiveWidth,
          height: effectiveHeight,
          styles: dslData.styles,
          viewBox,
        },
        responseType: 'arraybuffer',
        timeout: 600_000,
      });

      const pngBuffer = Buffer.from(response.data);

      // 上传到 OSS
      const ossService = this.ossManagement.getOssService('fta-snapshot');
      if (!ossService) {
        throw new Error('OSS service not available');
      }

      const fileName = `design-dsl/path/${digest}.png`;
      const uploadResult = await ossService.uploadFile(pngBuffer, fileName);

      if (!uploadResult || 'error' in uploadResult || !uploadResult.url) {
        throw new Error('Failed to upload to OSS');
      }

      const imageUrl = uploadResult.url;

      // 持久化转换结果（使用第一个 path 项的 data 作为 pathData）
      const pathData = normalizedPathItems.map((item) => item.data || '').join('|');
      const fillStyle = normalizedPathItems.map((item) => item.fill || '').join('|');
      await this.persistConversionResult({
        digest,
        imageUrl,
        pathData,
        fillStyle,
      });

      // 设置缓存（12小时）
      const cacheKey = this.getPathCacheKey(digest);
      await this.redisSet(cacheKey, imageUrl, this.defaultCacheTTLSeconds);

      return imageUrl;
    } catch (error) {
      console.error('Error converting SVG to PNG with sharp:', error);
      throw error;
    }
  }

  /**
   * 递归遍历节点并转换 PATH 为 LAYER
   */
  private async processNode(node: DesignNode, dslData: DSLData): Promise<DesignNode> {
    if (node.type === 'PATH') {
      const pathNode = node as PathNode;

      // 检查是否有路径数据
      if (pathNode.path && pathNode.path.length > 0) {
        // 过滤出有效的 path 项（有 data 的）
        const validPathItems = pathNode.path.filter((item) => item.data);

        if (validPathItems.length > 0) {
          try {
            // 获取节点的宽高，如果没有则使用默认值（与前端渲染保持一致）
            const width = pathNode.layoutStyle?.width || 100;
            const height = pathNode.layoutStyle?.height || 100;

            // 转换SVG路径为PNG（处理所有 path 项）
            const imageUrl = await this.convertSvgPathToPng(validPathItems, width, height, dslData);

            // 生成新的样式ID
            const newStyleId = this.generateId();

            // 更新DSL数据中的样式
            dslData.styles[newStyleId] = {
              value: [
                {
                  url: imageUrl,
                  filters: '',
                },
              ],
              token: `SVG-${pathNode.name}`,
            } as LayerStyle;

            // 返回新的LAYER节点
            const layerNode: LayerNode = {
              type: 'LAYER',
              id: node.id,
              name: node.name,
              layoutStyle: pathNode.layoutStyle,
              fill: newStyleId,
            };

            return layerNode;
          } catch (error) {
            console.error(`Error processing PATH node ${node.id}:`, error);
            // 如果转换失败，返回原节点
            return node;
          }
        }
      }

      // 如果没有路径数据，返回原节点
      return node;
    }

    if (node.type === 'GROUP' || node.type === 'FRAME' || (node as any).type === 'INSTANCE') {
      // 递归处理子节点
      const processedNode = { ...node };
      if ((node as any).children) {
        (processedNode as any).children = await Promise.all(
          ((node as any).children as DesignNode[]).map((child) => this.processNode(child, dslData))
        );
      }
      return processedNode;
    }

    return node;
  }

  /**
   * 处理DesignDSL数据
   */
  public async processDesignDSL(dslData: DesignData): Promise<DesignData> {
    // 深拷贝数据
    const processedDSL = JSON.parse(JSON.stringify(dslData)) as DesignData;

    // 1. 先进行数值精度处理
    const normalizedDSL = normalizeNumericValues(processedDSL);

    // 2. 再进行 PATH 节点转换
    normalizedDSL.dsl.nodes = await Promise.all(
      normalizedDSL.dsl.nodes.map((node) => this.processNode(node, normalizedDSL.dsl))
    );

    return normalizedDSL;
  }

  /**
   * 获取DesignDSL的统计信息
   */
  public async getDSLStats(dslData: DesignData): Promise<{
    totalNodes: number;
    pathNodes: number;
    convertedNodes: number;
    styleCount: number;
  }> {
    let totalNodes = 0;
    let pathNodes = 0;
    let convertedNodes = 0;

    const countNodes = (nodes: DesignNode[]) => {
      nodes.forEach((node) => {
        totalNodes++;
        if (node.type === 'PATH') {
          pathNodes++;
          const pathNode = node as PathNode;
          if (pathNode.path && pathNode.path.length > 0 && pathNode.path[0].data) {
            convertedNodes++;
          }
        }
        if ((node.type === 'GROUP' || node.type === 'FRAME') && node.children) {
          countNodes(node.children);
        }
      });
    };

    countNodes(dslData.dsl.nodes);

    return {
      totalNodes,
      pathNodes,
      convertedNodes,
      styleCount: Object.keys(dslData.dsl.styles).length,
    };
  }
}
