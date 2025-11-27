import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { Context } from '@midwayjs/web';
import { ReturnModelType } from '@typegoose/typegoose';
import type { HttpMethod } from '@fta/shared-types';
import { RestApi } from '../../entity/code-agent/rest-api';
import { Project } from '../../entity/code-agent/project';

/**
 * 创建 REST API 请求
 */
export interface CreateRestApiRequest {
  projectId: string;
  groupId?: string;
  name: string;
  description?: string;
  url?: string;
  method?: HttpMethod;
  requestModelIds?: string[];
  responseModelIds?: string[];
}

/**
 * 更新 REST API 请求
 */
export interface UpdateRestApiRequest {
  groupId?: string;
  name?: string;
  description?: string;
  url?: string;
  method?: HttpMethod;
  requestModelIds?: string[];
  responseModelIds?: string[];
}

@Provide()
export class RestApiService {
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
   * 创建 REST API
   */
  async create(data: CreateRestApiRequest): Promise<RestApi> {
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
    const newRestApi: Partial<RestApi> = {
      id: this.generateId('api'),
      projectId: data.projectId,
      groupId: data.groupId,
      name: data.name,
      description: data.description,
      url: data.url,
      method: data.method,
      requestModelIds: data.requestModelIds || [],
      responseModelIds: data.responseModelIds || [],
      createdAt: timestamp,
      updatedAt: timestamp,
      userId,
    };

    const createdRestApi = await this.restApiEntity.create(newRestApi);
    return createdRestApi;
  }

  /**
   * 更新 REST API
   */
  async update(id: string, data: UpdateRestApiRequest): Promise<RestApi> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const timestamp = new Date();
    const updateData: Partial<RestApi> = {
      updatedAt: timestamp,
    };

    if (data.groupId !== undefined) updateData.groupId = data.groupId;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.method !== undefined) updateData.method = data.method;
    if (data.requestModelIds !== undefined) updateData.requestModelIds = data.requestModelIds;
    if (data.responseModelIds !== undefined) updateData.responseModelIds = data.responseModelIds;

    const updatedRestApi = await this.restApiEntity.findOneAndUpdate(
      { id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedRestApi) {
      throw new Error('REST API 不存在');
    }

    return updatedRestApi;
  }

  /**
   * 删除 REST API
   */
  async delete(id: string): Promise<boolean> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const restApi = await this.restApiEntity.findOne({ id, userId });
    if (!restApi) {
      throw new Error('REST API 不存在');
    }

    await this.restApiEntity.deleteOne({ id, userId });
    return true;
  }

  /**
   * 获取项目的所有 REST API
   */
  async getByProjectId(projectId: string): Promise<RestApi[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const restApis = await this.restApiEntity
      .find({ projectId, userId })
      .sort({ createdAt: -1 })
      .lean();

    return restApis as RestApi[];
  }

  /**
   * 获取单个 REST API
   */
  async getById(id: string): Promise<RestApi | null> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const restApi = await this.restApiEntity.findOne({ id, userId }).lean();
    return restApi as RestApi | null;
  }

  /**
   * 批量获取 REST API
   */
  async getByIds(ids: string[]): Promise<RestApi[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    if (!ids || ids.length === 0) {
      return [];
    }

    const restApis = await this.restApiEntity
      .find({ id: { $in: ids }, userId })
      .lean();

    return restApis as RestApi[];
  }

  /**
   * 获取组内的所有 REST API
   */
  async getByGroupId(groupId: string): Promise<RestApi[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const restApis = await this.restApiEntity
      .find({ groupId, userId })
      .sort({ createdAt: -1 })
      .lean();

    return restApis as RestApi[];
  }

  /**
   * 获取项目内未分组的 REST API
   */
  async getUngrouped(projectId: string): Promise<RestApi[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const restApis = await this.restApiEntity
      .find({
        projectId,
        userId,
        $or: [{ groupId: null }, { groupId: { $exists: false } }],
      })
      .sort({ createdAt: -1 })
      .lean();

    return restApis as RestApi[];
  }
}

