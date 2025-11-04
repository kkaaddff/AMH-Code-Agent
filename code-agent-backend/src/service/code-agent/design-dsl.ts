import { Inject, Provide } from "@midwayjs/decorator";
import fs from "fs/promises";
import * as path from "path";
import * as crypto from "crypto";
import sharp from "sharp";
import { Redis, RedisService } from "@midwayjs/redis";
import { InjectEntityModel } from "@midwayjs/typegoose";
import { ReturnModelType } from "@typegoose/typegoose";
import {
  DesignDSL,
  DesignNode,
  PathNode,
  LayerNode,
  DSLData,
  LayerStyle,
} from "../../types/design-dsl";
import { DesignPathAssetEntity } from "../../entity/code-agent/design-dsl/path-asset";

@Provide()
export class DesignDSLService {
  @Inject()
  private redisClient: RedisService;

  @InjectEntityModel(DesignPathAssetEntity)
  private designPathAssetModel: ReturnModelType<typeof DesignPathAssetEntity>;

  private tempDir = path.join(process.cwd(), "temp");
  private readonly pathCachePrefix = "design-dsl:path:";
  private readonly defaultCacheTTLSeconds = 7 * 24 * 60 * 60;
  private readonly redisRedirectClients = new Map<string, Redis>();

  constructor() {
    // 确保 temp 文件夹存在
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.access(this.tempDir);
    } catch {
      await fs.mkdir(this.tempDir, { recursive: true });
    }
  }

  /**
   * 生成随机ID
   */
  private generateId(prefix: string = "paint_1"): string {
    const randomNum = Math.floor(Math.random() * 99999);
    return `${prefix}:${randomNum.toString().padStart(5, "0")}`;
  }

  /**
   * 生成随机文件名
   */
  private generateFileName(): string {
    return crypto.randomBytes(16).toString("hex");
  }

  /**
   * 计算路径数据摘要
   */
  private getPathDigest(pathData: string): string {
    return crypto.createHash("sha256").update(pathData).digest("hex");
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
  private parseRedirectTarget(
    error: any
  ): { host: string; port: number; type: "MOVED" | "ASK" } | null {
    const message = typeof error?.message === "string" ? error.message : "";
    if (!message.startsWith("MOVED") && !message.startsWith("ASK")) {
      return null;
    }
    const parts = message.split(" ");
    const target = parts[2];
    if (!target) {
      return null;
    }
    const [host, portStr] = target.split(":");
    const port = Number(portStr);
    if (!host || !Number.isFinite(port)) {
      return null;
    }
    const type = message.startsWith("ASK") ? "ASK" : "MOVED";
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
    action: "get" | "set",
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
      if (target.type === "ASK") {
        await client.asking();
      }
      if (action === "get") {
        return await client.get(key);
      }

      if (action === "set") {
        if (value === undefined) {
          return false;
        }
        if (ttl !== undefined && Number.isFinite(ttl) && ttl > 0) {
          await client.set(key, value, "EX", ttl);
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
      return action === "get" ? null : false;
    }

    return undefined;
  }

  /**
   * Redis get 接口
   */
  public async redisGet(key: string): Promise<string | null> {
    try {
      return await this.redisClient.get(key);
    } catch (error) {
      const redirectResult = await this.tryHandleRedisRedirect(
        "get",
        key,
        undefined,
        error
      );
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
  public async redisSet(
    key: string,
    value: string,
    ttlSeconds?: number
  ): Promise<void> {
    const ttl =
      typeof ttlSeconds === "number" ? ttlSeconds : this.getPathCacheTTL();
    try {
      if (Number.isFinite(ttl) && ttl > 0) {
        await this.redisClient.set(key, value, "EX", ttl);
      } else {
        await this.redisClient.set(key, value);
      }
    } catch (error) {
      const redirected = await this.tryHandleRedisRedirect(
        "set",
        key,
        value,
        error,
        ttl
      );
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
      const record = await this.designPathAssetModel
        .findOne({ digest })
        .select("imageUrl")
        .lean();
      if (record?.imageUrl) {
        void this.redisSet(cacheKey, record.imageUrl);
        return record.imageUrl;
      }
    } catch (error) {
      console.warn(
        `Failed to read design DSL cache from mongodb for digest ${digest}`,
        error
      );
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
      console.warn(
        `Failed to persist design DSL path asset for digest ${digest}`,
        error
      );
    }
  }

  /**
   * 将SVG路径数据转换为PNG图片
   * 使用 sharp 直接从内存 Buffer 转换，避免创建临时 SVG 文件
   */
  private async convertSvgPathToPng(
    pathData: string,
    fillStyle: string
  ): Promise<string> {
    const digest = this.getPathDigest(pathData);
    const cachedUrl = await this.getCachedImageUrl(digest);
    if (cachedUrl) {
      return cachedUrl;
    }

    // 创建SVG内容
    const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="48" height="48" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
  <path d="${pathData}" fill="${this.getColorFromFillStyle(fillStyle)}" />
</svg>`;

    // 将SVG字符串转换为Buffer
    const svgBuffer = Buffer.from(svgContent);

    const pngFileName = `${this.generateFileName()}.png`;
    const pngPath = path.join(this.tempDir, pngFileName);

    try {
      // 直接从Buffer转换为PNG并保存到文件
      await sharp(svgBuffer).png().toFile(pngPath);

      console.log(`PNG saved to: ${pngPath}`);

      // 模拟图片URL（实际项目中应该是真实的可访问URL）
      const imageUrl = `https://example.com/temp/${pngFileName}`;
      await this.persistConversionResult({
        digest,
        imageUrl,
        pathData,
        fillStyle,
      });
      return imageUrl;
    } catch (error) {
      console.error("Error converting SVG to PNG with sharp:", error);
      throw error;
    }
  }

  /**
   * 从填充样式获取颜色值
   */
  private getColorFromFillStyle(fillStyle: string): string {
    // 这里应该从DSL的styles中解析实际颜色
    // 暂时返回一些默认颜色
    const colorMap: Record<string, string> = {
      "paint_1:0020": "#FF7000", // 品牌橙色
      "paint_1:890": "#FFFFFF", // 白色
      "paint_1:796": "#1A1A1A", // 深灰色
    };
    return colorMap[fillStyle] || "#000000";
  }

  /**
   * 递归遍历节点并转换PATH为LAYER
   */
  private async processNode(
    node: DesignNode,
    dslData: DSLData
  ): Promise<DesignNode> {
    if (node.type === "PATH") {
      const pathNode = node as PathNode;

      // 检查是否有路径数据
      if (pathNode.path && pathNode.path.length > 0) {
        const pathItem = pathNode.path[0];

        if (pathItem.data && pathItem.fill) {
          try {
            // 转换SVG路径为PNG
            const imageUrl = await this.convertSvgPathToPng(
              pathItem.data,
              pathItem.fill
            );

            // 生成新的样式ID
            const newStyleId = this.generateId();

            // 更新DSL数据中的样式
            dslData.styles[newStyleId] = {
              value: [
                {
                  url: imageUrl,
                  filters: "",
                },
              ],
              token: `转换的SVG图像/${pathNode.name}`,
            } as LayerStyle;

            // 返回新的LAYER节点
            const layerNode: LayerNode = {
              type: "LAYER",
              id: node.id,
              name: node.name,
              layoutStyle: node.layoutStyle,
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

    if (node.type === "GROUP" || node.type === "FRAME") {
      // 递归处理子节点
      const processedNode = { ...node };
      if (node.children) {
        processedNode.children = await Promise.all(
          node.children.map((child) => this.processNode(child, dslData))
        );
      }
      return processedNode;
    }

    return node;
  }

  /**
   * 处理DesignDSL数据
   */
  public async processDesignDSL(dslData: DesignDSL): Promise<DesignDSL> {
    const processedDSL = JSON.parse(JSON.stringify(dslData)) as DesignDSL;

    // 递归处理所有节点
    processedDSL.dsl.nodes = await Promise.all(
      processedDSL.dsl.nodes.map((node) =>
        this.processNode(node, processedDSL.dsl)
      )
    );

    return processedDSL;
  }

  /**
   * 读取DesignDSL文件
   */
  public async readDesignDSLFile(filePath: string): Promise<DesignDSL> {
    try {
      const fileContent = await fs.readFile(filePath, "utf-8");
      return JSON.parse(fileContent) as DesignDSL;
    } catch (error) {
      console.error("Error reading DesignDSL file:", error);
      throw error;
    }
  }

  /**
   * 公共方法：转换单个SVG路径
   */
  public async convertSinglePath(
    pathData: string,
    fillStyle: string,
    iconName?: string
  ): Promise<{
    imageUrl: string;
    styleId: string;
    svgPath: string;
  }> {
    const imageUrl = await this.convertSvgPathToPng(pathData, fillStyle);
    const styleId = this.generateId();
    const svgPath = path.join(this.tempDir, `${this.generateFileName()}.svg`);

    return {
      imageUrl,
      styleId,
      svgPath,
    };
  }

  /**
   * 获取DesignDSL的统计信息
   */
  public async getDSLStats(dslData: DesignDSL): Promise<{
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
        if (node.type === "PATH") {
          pathNodes++;
          const pathNode = node as PathNode;
          if (
            pathNode.path &&
            pathNode.path.length > 0 &&
            pathNode.path[0].data
          ) {
            convertedNodes++;
          }
        }
        if ((node.type === "GROUP" || node.type === "FRAME") && node.children) {
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
