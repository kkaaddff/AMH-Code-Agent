import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { Context } from '@midwayjs/web';
import { ReturnModelType } from '@typegoose/typegoose';
import { InterfaceDataModel, SchemaField } from '../../entity/code-agent/interface-data-model';
import { Page } from '../../entity/code-agent/project';

/**
 * 创建数据模型请求
 */
export interface CreateDataModelRequest {
  pageId: string;
  name: string;
  description?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  requestSchema?: SchemaField[];
  responseSchema?: SchemaField[];
}

/**
 * 更新数据模型请求
 */
export interface UpdateDataModelRequest {
  name?: string;
  description?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  requestSchema?: SchemaField[];
  responseSchema?: SchemaField[];
}

@Provide()
export class InterfaceDataModelService {
  @InjectEntityModel(InterfaceDataModel)
  dataModelEntity: ReturnModelType<typeof InterfaceDataModel>;

  @InjectEntityModel(Page)
  pageEntity: ReturnModelType<typeof Page>;

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

  /**
   * Generate a unique ID with prefix
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
  }

  /**
   * 创建数据模型
   */
  async createDataModel(data: CreateDataModelRequest): Promise<InterfaceDataModel> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    // 验证页面是否存在
    const page = await this.pageEntity.findOne({ id: data.pageId });
    if (!page) {
      throw new Error('页面不存在');
    }

    const timestamp = new Date();
    const newDataModel: Partial<InterfaceDataModel> = {
      id: this.generateId('dm'),
      pageId: data.pageId,
      name: data.name,
      description: data.description,
      url: data.url,
      method: data.method,
      requestSchema: data.requestSchema || [],
      responseSchema: data.responseSchema || [],
      createdAt: timestamp,
      updatedAt: timestamp,
      userId,
    };

    const createdDataModel = await this.dataModelEntity.create(newDataModel);

    // 添加数据模型引用到页面
    await this.pageEntity.updateOne(
      { id: data.pageId },
      {
        $push: { interfaceDataModels: createdDataModel._id },
        updatedAt: timestamp,
      }
    );

    return createdDataModel;
  }

  /**
   * 更新数据模型
   */
  async updateDataModel(id: string, data: UpdateDataModelRequest): Promise<InterfaceDataModel> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const timestamp = new Date();
    const updateData: Partial<InterfaceDataModel> = {
      updatedAt: timestamp,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.url !== undefined) updateData.url = data.url;
    if (data.method !== undefined) updateData.method = data.method;
    if (data.requestSchema !== undefined) updateData.requestSchema = data.requestSchema;
    if (data.responseSchema !== undefined) updateData.responseSchema = data.responseSchema;

    const updatedDataModel = await this.dataModelEntity.findOneAndUpdate(
      { id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedDataModel) {
      throw new Error('数据模型不存在');
    }

    return updatedDataModel;
  }

  /**
   * 删除数据模型
   */
  async deleteDataModel(id: string): Promise<boolean> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const dataModel = await this.dataModelEntity.findOne({ id, userId });
    if (!dataModel) {
      throw new Error('数据模型不存在');
    }

    const timestamp = new Date();

    // 从页面中移除数据模型引用
    await this.pageEntity.updateOne(
      { id: dataModel.pageId },
      {
        $pull: { interfaceDataModels: dataModel._id },
        updatedAt: timestamp,
      }
    );

    // 删除数据模型
    await this.dataModelEntity.deleteOne({ id, userId });

    return true;
  }

  /**
   * 获取页面的所有数据模型
   */
  async getDataModels(pageId: string): Promise<InterfaceDataModel[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const dataModels = await this.dataModelEntity
      .find({ pageId, userId })
      .sort({ createdAt: -1 })
      .lean();

    return dataModels as InterfaceDataModel[];
  }

  /**
   * 获取单个数据模型
   */
  async getDataModelById(id: string): Promise<InterfaceDataModel | null> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const dataModel = await this.dataModelEntity.findOne({ id, userId }).lean();

    return dataModel as InterfaceDataModel | null;
  }

  /**
   * 批量获取数据模型（根据 ID 列表）
   */
  async getDataModelsByIds(ids: string[]): Promise<InterfaceDataModel[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    if (!ids || ids.length === 0) {
      return [];
    }

    const dataModels = await this.dataModelEntity
      .find({ id: { $in: ids }, userId })
      .lean();

    return dataModels as InterfaceDataModel[];
  }
}

