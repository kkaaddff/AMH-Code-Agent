/**
 * 数据模型服务
 * 封装数据模型和数据模型组相关的 API 调用
 */

import { api } from '@/utils/apiService';
import type {
  DataModel,
  DataModelGroup,
  CreateDataModelGroupRequest,
  UpdateDataModelGroupRequest,
} from '@/types/dataModel';
import { CreateDataModelRequest, UpdateDataModelRequest } from '@fta/shared';

/**
 * 数据模型组服务
 */
export const dataModelGroupService = {
  /**
   * 创建数据模型组
   */
  async create(data: CreateDataModelGroupRequest): Promise<DataModelGroup> {
    const response = await api.dataModelGroup.create(data);
    return response.data;
  },

  /**
   * 更新数据模型组
   */
  async update(id: string, data: UpdateDataModelGroupRequest): Promise<DataModelGroup> {
    const response = await api.dataModelGroup.update(id, data);
    return response.data;
  },

  /**
   * 删除数据模型组
   */
  async delete(id: string): Promise<void> {
    await api.dataModelGroup.delete(id);
  },

  /**
   * 获取项目的所有数据模型组
   */
  async getByProjectId(projectId: string): Promise<DataModelGroup[]> {
    const response = await api.dataModelGroup.list(projectId);
    return response.data || [];
  },

  /**
   * 获取单个数据模型组详情
   */
  async getById(id: string): Promise<DataModelGroup | null> {
    try {
      const response = await api.dataModelGroup.detail(id);
      return response.data;
    } catch {
      return null;
    }
  },
};

/**
 * 数据模型服务
 */
export const dataModelService = {
  /**
   * 创建数据模型
   */
  async create(data: CreateDataModelRequest): Promise<DataModel> {
    const response = await api.dataModel.create(data);
    return response.data;
  },

  /**
   * 更新数据模型
   */
  async update(id: string, data: UpdateDataModelRequest): Promise<DataModel> {
    const response = await api.dataModel.update(id, data);
    return response.data;
  },

  /**
   * 删除数据模型
   */
  async delete(id: string): Promise<void> {
    await api.dataModel.delete(id);
  },

  /**
   * 获取项目的所有数据模型
   */
  async getByProjectId(projectId: string): Promise<DataModel[]> {
    const response = await api.dataModel.list(projectId);
    return response.data || [];
  },

  /**
   * 获取分组内的数据模型
   */
  async getByGroupId(groupId: string): Promise<DataModel[]> {
    const response = await api.dataModel.listByGroup(groupId);
    return response.data || [];
  },

  /**
   * 获取未分组的数据模型
   */
  async getUngrouped(projectId: string): Promise<DataModel[]> {
    const response = await api.dataModel.listUngrouped(projectId);
    return response.data || [];
  },

  /**
   * 获取单个数据模型详情
   */
  async getById(id: string): Promise<DataModel | null> {
    try {
      const response = await api.dataModel.detail(id);
      return response.data;
    } catch {
      return null;
    }
  },
};

export default {
  group: dataModelGroupService,
  model: dataModelService,
};
