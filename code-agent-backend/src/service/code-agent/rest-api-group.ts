import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { Context } from '@midwayjs/web';
import { ReturnModelType } from '@typegoose/typegoose';
import { RestApiGroup } from '../../entity/code-agent/rest-api-group';
import { RestApi } from '../../entity/code-agent/rest-api';
import { Project } from '../../entity/code-agent/project';
import type { HttpMethod, SchemaField } from '@fta/shared-types';

/**
 * 创建 REST API 组请求
 */
export interface CreateRestApiGroupRequest {
  projectId: string;
  name: string;
  description?: string;
  syncUrl?: string;
}

/**
 * 更新 REST API 组请求
 */
export interface UpdateRestApiGroupRequest {
  name?: string;
  description?: string;
  syncUrl?: string;
}

/**
 * 同步结果
 */
export interface SyncResult {
  syncedCount: number;
  apis: RestApi[];
}

/**
 * OpenAPI 路径信息
 */
interface OpenApiPathInfo {
  method: HttpMethod;
  path: string;
  summary?: string;
  description?: string;
  operationId?: string;
  parameters?: any[];
  requestBody?: any;
  responses?: any;
}

@Provide()
export class RestApiGroupService {
  @InjectEntityModel(RestApiGroup)
  groupEntity: ReturnModelType<typeof RestApiGroup>;

  @InjectEntityModel(RestApi)
  restApiEntity: ReturnModelType<typeof RestApi>;

  @InjectEntityModel(Project)
  projectEntity: ReturnModelType<typeof Project>;

  @Inject()
  ctx: Context;

  private resolveUserId(): string {
    const userId = this.ctx.get('user-id');
    if (userId) {
      return userId;
    }
    const user = this.ctx.state?.user;
    if (user) {
      return user.id;
    }
    return undefined;
  }

  private generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
  }

  /**
   * 创建 REST API 组
   */
  async create(data: CreateRestApiGroupRequest): Promise<RestApiGroup> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    // 验证项目是否存在
    const project = await this.projectEntity.findOne({ id: data.projectId, userId });
    if (!project) {
      throw new Error('项目不存在');
    }

    const timestamp = new Date();
    const newGroup: Partial<RestApiGroup> = {
      id: this.generateId('rag'),
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      syncUrl: data.syncUrl,
      syncStatus: 'idle',
      createdAt: timestamp,
      updatedAt: timestamp,
      userId,
    };

    const createdGroup = await this.groupEntity.create(newGroup);
    return createdGroup;
  }

  /**
   * 更新 REST API 组
   */
  async update(id: string, data: UpdateRestApiGroupRequest): Promise<RestApiGroup> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const timestamp = new Date();
    const updateData: Partial<RestApiGroup> = {
      updatedAt: timestamp,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.syncUrl !== undefined) updateData.syncUrl = data.syncUrl;

    const updatedGroup = await this.groupEntity.findOneAndUpdate(
      { id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      throw new Error('REST API 组不存在');
    }

    return updatedGroup;
  }

  /**
   * 删除 REST API 组
   */
  async delete(id: string): Promise<boolean> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const group = await this.groupEntity.findOne({ id, userId });
    if (!group) {
      throw new Error('REST API 组不存在');
    }

    // 同时删除组下的所有接口
    await this.restApiEntity.deleteMany({ groupId: id, userId });
    await this.groupEntity.deleteOne({ id, userId });
    return true;
  }

  /**
   * 获取项目的所有 REST API 组
   */
  async getByProjectId(projectId: string): Promise<RestApiGroup[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const groups = await this.groupEntity
      .find({ projectId, userId })
      .sort({ createdAt: -1 })
      .lean();

    return groups as RestApiGroup[];
  }

  /**
   * 获取单个 REST API 组
   */
  async getById(id: string): Promise<RestApiGroup | null> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const group = await this.groupEntity.findOne({ id, userId }).lean();
    return group as RestApiGroup | null;
  }

  /**
   * 同步远程 OpenAPI/Swagger 文档
   */
  async sync(id: string, syncUrl?: string): Promise<SyncResult> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const group = await this.groupEntity.findOne({ id, userId });
    if (!group) {
      throw new Error('REST API 组不存在');
    }

    const urlToSync = syncUrl || group.syncUrl;
    if (!urlToSync) {
      throw new Error('请提供同步 URL 或在组中配置 syncUrl');
    }

    // 更新同步状态
    await this.groupEntity.updateOne(
      { id, userId },
      { syncStatus: 'syncing', syncError: undefined, updatedAt: new Date() }
    );

    try {
      // 获取远程文档
      const response = await fetch(urlToSync, {
        headers: {
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const openApiDoc = await response.json();

      // 解析 OpenAPI 文档并创建/更新接口
      const apis = await this.parseAndSaveApis(openApiDoc, group);

      // 更新同步状态为成功
      await this.groupEntity.updateOne(
        { id, userId },
        {
          syncStatus: 'success',
          lastSyncAt: new Date(),
          syncUrl: urlToSync,
          updatedAt: new Date(),
        }
      );

      return { syncedCount: apis.length, apis };
    } catch (error: any) {
      // 更新同步状态为失败
      await this.groupEntity.updateOne(
        { id, userId },
        {
          syncStatus: 'failed',
          syncError: error.message || '同步失败',
          updatedAt: new Date(),
        }
      );
      throw new Error(`同步失败: ${error.message}`);
    }
  }

  /**
   * 解析 OpenAPI 文档并保存接口
   */
  private async parseAndSaveApis(openApiDoc: any, group: RestApiGroup): Promise<RestApi[]> {
    const userId = this.resolveUserId();
    const paths = openApiDoc.paths || {};
    const apis: RestApi[] = [];
    const timestamp = new Date();

    // 支持的 HTTP 方法
    const httpMethods: HttpMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];

    for (const [pathUrl, pathItem] of Object.entries(paths)) {
      if (!pathItem || typeof pathItem !== 'object') continue;

      for (const method of httpMethods) {
        const operation = (pathItem as any)[method.toLowerCase()];
        if (!operation) continue;

        const name = operation.summary || operation.operationId || `${method} ${pathUrl}`;
        const description = operation.description || '';

        // 检查是否已存在相同的接口（通过 URL + 方法 + 组 ID 匹配）
        const existingApi = await this.restApiEntity.findOne({
          groupId: group.id,
          url: pathUrl,
          method,
          userId,
        });

        if (existingApi) {
          // 更新已有接口
          const updatedApi = await this.restApiEntity.findOneAndUpdate(
            { id: existingApi.id },
            {
              name,
              description,
              updatedAt: timestamp,
            },
            { new: true }
          );
          if (updatedApi) apis.push(updatedApi);
        } else {
          // 创建新接口
          const newApi: Partial<RestApi> = {
            id: this.generateId('api'),
            projectId: group.projectId,
            groupId: group.id,
            name,
            description,
            url: pathUrl,
            method,
            requestModelIds: [],
            responseModelIds: [],
            createdAt: timestamp,
            updatedAt: timestamp,
            userId,
          };

          const createdApi = await this.restApiEntity.create(newApi);
          apis.push(createdApi);
        }
      }
    }

    return apis;
  }
}

