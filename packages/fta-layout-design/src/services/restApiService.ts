/**
 * REST API 服务
 * 封装 REST API 接口相关的 API 调用
 */

import { api } from '@/utils/apiService';
import type {
  RestApi,
  RestApiGroup,
  CreateRestApiRequest,
  UpdateRestApiRequest,
  CreateRestApiGroupRequest,
  UpdateRestApiGroupRequest,
} from '@/types/restApi';

/**
 * REST API 组服务
 */
export const restApiGroupService = {
  /**
   * 创建 REST API 组
   */
  async create(data: CreateRestApiGroupRequest): Promise<RestApiGroup> {
    const response = await api.restApiGroup.create(data);
    return response.data;
  },

  /**
   * 更新 REST API 组
   */
  async update(id: string, data: UpdateRestApiGroupRequest): Promise<RestApiGroup> {
    const response = await api.restApiGroup.update(id, data);
    return response.data;
  },

  /**
   * 删除 REST API 组
   */
  async delete(id: string): Promise<void> {
    await api.restApiGroup.delete(id);
  },

  /**
   * 获取项目的所有 REST API 组
   */
  async getByProjectId(projectId: string): Promise<RestApiGroup[]> {
    const response = await api.restApiGroup.list(projectId);
    return response.data || [];
  },

  /**
   * 获取单个 REST API 组详情
   */
  async getById(id: string): Promise<RestApiGroup | null> {
    try {
      const response = await api.restApiGroup.detail(id);
      return response.data;
    } catch {
      return null;
    }
  },

  /**
   * 同步远程 OpenAPI 文档
   */
  async sync(id: string, syncUrl?: string): Promise<{ syncedCount: number; apis: RestApi[] }> {
    const response = await api.restApiGroup.sync(id, syncUrl);
    return response.data;
  },
};

/**
 * REST API 服务
 */
export const restApiService = {
  /**
   * 创建 REST API
   */
  async create(data: CreateRestApiRequest): Promise<RestApi> {
    const response = await api.restApi.create(data);
    return response.data;
  },

  /**
   * 更新 REST API
   */
  async update(id: string, data: UpdateRestApiRequest): Promise<RestApi> {
    const response = await api.restApi.update(id, data);
    return response.data;
  },

  /**
   * 删除 REST API
   */
  async delete(id: string): Promise<void> {
    await api.restApi.delete(id);
  },

  /**
   * 获取项目的所有 REST API
   */
  async getByProjectId(projectId: string): Promise<RestApi[]> {
    const response = await api.restApi.list(projectId);
    return response.data || [];
  },

  /**
   * 获取组内的所有 REST API
   */
  async getByGroupId(groupId: string): Promise<RestApi[]> {
    const response = await api.restApi.listByGroup(groupId);
    return response.data || [];
  },

  /**
   * 获取项目内未分组的 REST API
   */
  async getUngrouped(projectId: string): Promise<RestApi[]> {
    const response = await api.restApi.listUngrouped(projectId);
    return response.data || [];
  },

  /**
   * 获取单个 REST API 详情
   */
  async getById(id: string): Promise<RestApi | null> {
    try {
      const response = await api.restApi.detail(id);
      return response.data;
    } catch {
      return null;
    }
  },
};

export default restApiService;

