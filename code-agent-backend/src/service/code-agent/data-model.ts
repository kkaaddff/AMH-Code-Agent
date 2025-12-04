import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { Context } from '@midwayjs/web';
import { ReturnModelType } from '@typegoose/typegoose';
import { DataModel } from '../../entity/code-agent/data-model';
import { Project } from '../../entity/code-agent/project';

/**
 * 创建数据模型请求
 */
export interface CreateDataModelRequest {
  projectId: string;
  groupId?: string;
  name: string;
  description?: string;
  /** TypeScript 接口定义内容 */
  tsContent?: string;
}

/**
 * 更新数据模型请求
 */
export interface UpdateDataModelRequest {
  groupId?: string | null;
  name?: string;
  description?: string;
  /** TypeScript 接口定义内容 */
  tsContent?: string;
}

@Provide()
export class DataModelService {
  @InjectEntityModel(DataModel)
  dataModelEntity: ReturnModelType<typeof DataModel>;

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
   * 创建数据模型
   */
  async create(data: CreateDataModelRequest): Promise<DataModel> {
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
    const newDataModel: Partial<DataModel> = {
      id: this.generateId('dm'),
      projectId: data.projectId,
      groupId: data.groupId,
      name: data.name,
      description: data.description,
      tsContent: data.tsContent || '',
      createdAt: timestamp,
      updatedAt: timestamp,
      userId,
    };

    const createdDataModel = await this.dataModelEntity.create(newDataModel);
    return createdDataModel;
  }

  /**
   * 更新数据模型
   */
  async update(id: string, data: UpdateDataModelRequest): Promise<DataModel> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const timestamp = new Date();
    const updateData: Partial<DataModel> = {
      updatedAt: timestamp,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.tsContent !== undefined) updateData.tsContent = data.tsContent;
    // groupId 支持设为 null（移出分组）
    if (data.groupId !== undefined) updateData.groupId = data.groupId || undefined;

    const updatedDataModel = await this.dataModelEntity.findOneAndUpdate({ id, userId }, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedDataModel) {
      throw new Error('数据模型不存在');
    }

    return updatedDataModel;
  }

  /**
   * 删除数据模型
   */
  async delete(id: string): Promise<boolean> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const dataModel = await this.dataModelEntity.findOne({ id, userId });
    if (!dataModel) {
      throw new Error('数据模型不存在');
    }

    await this.dataModelEntity.deleteOne({ id, userId });
    return true;
  }

  /**
   * 获取项目的所有数据模型
   */
  async getByProjectId(projectId: string): Promise<DataModel[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const dataModels = await this.dataModelEntity.find({ projectId, userId }, null, {
      sort: { createdAt: -1 },
      lean: true,
    });
    return dataModels as DataModel[];
  }

  /**
   * 获取分组内的数据模型
   */
  async getByGroupId(groupId: string): Promise<DataModel[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const dataModels = await this.dataModelEntity.find({ groupId, userId }, null, {
      sort: { createdAt: -1 },
      lean: true,
    });

    return dataModels as DataModel[];
  }

  /**
   * 获取未分组的数据模型
   */
  async getUngrouped(projectId: string): Promise<DataModel[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const dataModels = await this.dataModelEntity.find({ projectId, userId, groupId: { $exists: false } }, null, {
      sort: { createdAt: -1 },
      lean: true,
    });

    return dataModels as DataModel[];
  }

  /**
   * 获取单个数据模型
   */
  async getById(id: string): Promise<DataModel | null> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const dataModel = await this.dataModelEntity.findOne({ id, userId }, null, { lean: true });
    return dataModel as DataModel | null;
  }

  /**
   * 批量获取数据模型
   */
  async getByIds(ids: string[]): Promise<DataModel[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    if (!ids || ids.length === 0) {
      return [];
    }

    const dataModels = await this.dataModelEntity.find({ id: { $in: ids }, userId }, null, { lean: true });

    return dataModels as DataModel[];
  }
}
