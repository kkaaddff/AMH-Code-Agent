import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { Context } from '@midwayjs/web';
import { ReturnModelType } from '@typegoose/typegoose';
import { DataModelGroup } from '../../entity/code-agent/data-model-group';
import { Project } from '../../entity/code-agent/project';

/**
 * 创建数据模型组请求
 */
export interface CreateDataModelGroupRequest {
  projectId: string;
  name: string;
  description?: string;
}

/**
 * 更新数据模型组请求
 */
export interface UpdateDataModelGroupRequest {
  name?: string;
  description?: string;
}

@Provide()
export class DataModelGroupService {
  @InjectEntityModel(DataModelGroup)
  groupEntity: ReturnModelType<typeof DataModelGroup>;

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
   * 创建数据模型组
   */
  async create(data: CreateDataModelGroupRequest): Promise<DataModelGroup> {
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
    const newGroup: Partial<DataModelGroup> = {
      id: this.generateId('dmg'),
      projectId: data.projectId,
      name: data.name,
      description: data.description,
      createdAt: timestamp,
      updatedAt: timestamp,
      userId,
    };

    const createdGroup = await this.groupEntity.create(newGroup);
    return createdGroup;
  }

  /**
   * 更新数据模型组
   */
  async update(id: string, data: UpdateDataModelGroupRequest): Promise<DataModelGroup> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const timestamp = new Date();
    const updateData: Partial<DataModelGroup> = {
      updatedAt: timestamp,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;

    const updatedGroup = await this.groupEntity.findOneAndUpdate(
      { id, userId },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedGroup) {
      throw new Error('数据模型组不存在');
    }

    return updatedGroup;
  }

  /**
   * 删除数据模型组
   */
  async delete(id: string): Promise<boolean> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const group = await this.groupEntity.findOne({ id, userId });
    if (!group) {
      throw new Error('数据模型组不存在');
    }

    await this.groupEntity.deleteOne({ id, userId });
    return true;
  }

  /**
   * 获取项目的所有数据模型组
   */
  async getByProjectId(projectId: string): Promise<DataModelGroup[]> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const groups = await this.groupEntity
      .find({ projectId, userId })
      .sort({ createdAt: -1 })
      .lean();

    return groups as DataModelGroup[];
  }

  /**
   * 获取单个数据模型组
   */
  async getById(id: string): Promise<DataModelGroup | null> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    const group = await this.groupEntity.findOne({ id, userId }).lean();
    return group as DataModelGroup | null;
  }
}

