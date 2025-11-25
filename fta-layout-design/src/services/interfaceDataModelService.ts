/**
 * 接口数据模型服务
 * 封装接口数据模型相关的 API 调用
 */

import { api } from '@/utils/apiService';
import type {
  InterfaceDataModel,
  CreateDataModelRequest,
  UpdateDataModelRequest,
} from '@/types/interfaceDataModel';

/**
 * 接口数据模型服务
 */
export const interfaceDataModelService = {
  /**
   * 创建接口数据模型
   * @param data 创建请求数据
   * @returns 创建的数据模型
   */
  async create(data: CreateDataModelRequest): Promise<InterfaceDataModel> {
    const response = await api.interfaceDataModel.create(data);
    return response.data;
  },

  /**
   * 更新接口数据模型
   * @param id 数据模型 ID
   * @param data 更新请求数据
   * @returns 更新后的数据模型
   */
  async update(id: string, data: UpdateDataModelRequest): Promise<InterfaceDataModel> {
    const response = await api.interfaceDataModel.update(id, data);
    return response.data;
  },

  /**
   * 删除接口数据模型
   * @param id 数据模型 ID
   */
  async delete(id: string): Promise<void> {
    await api.interfaceDataModel.delete(id);
  },

  /**
   * 获取页面的所有接口数据模型
   * @param pageId 页面 ID
   * @returns 数据模型列表
   */
  async getByPageId(pageId: string): Promise<InterfaceDataModel[]> {
    const response = await api.interfaceDataModel.list(pageId);
    return response.data || [];
  },

  /**
   * 获取单个接口数据模型详情
   * @param id 数据模型 ID
   * @returns 数据模型详情
   */
  async getById(id: string): Promise<InterfaceDataModel | null> {
    try {
      const response = await api.interfaceDataModel.detail(id);
      return response.data;
    } catch (error) {
      console.error('获取数据模型详情失败:', error);
      return null;
    }
  },
};

export default interfaceDataModelService;

