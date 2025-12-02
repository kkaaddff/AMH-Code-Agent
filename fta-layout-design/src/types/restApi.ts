/**
 * REST API 接口相关类型定义
 */
import type { HttpMethod } from '@fta/shared-types';

// 重新导出共享类型
export type { HttpMethod };

/**
 * REST API 接口组
 */
export interface RestApiGroup {
  /** 唯一标识 */
  id: string;
  /** 关联的项目 ID */
  projectId: string;
  /** 组名称 */
  name: string;
  /** 组描述 */
  description?: string;
  /** 远程同步 URL（OpenAPI/Swagger 文档地址） */
  syncUrl?: string;
  /** 最后同步时间 */
  lastSyncAt?: string;
  /** 同步状态 */
  syncStatus?: 'idle' | 'syncing' | 'success' | 'failed';
  /** 同步错误信息 */
  syncError?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 用户 ID */
  userId: string;
}

/**
 * REST API 接口
 */
export interface RestApi {
  /** 唯一标识 */
  id: string;
  /** 关联的项目 ID */
  projectId: string;
  /** 关联的接口组 ID */
  groupId?: string;
  /** 接口名称 */
  name: string;
  /** 接口描述 */
  description?: string;
  /** API 地址 */
  url?: string;
  /** HTTP 请求方法 */
  method?: HttpMethod;
  /** 请求参数关联的数据模型 ID 列表 */
  requestModelIds: string[];
  /** 响应数据关联的数据模型 ID 列表 */
  responseModelIds: string[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 用户 ID */
  userId: string;
}

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

/**
 * HTTP 方法选项（用于下拉选择）
 */
export const HTTP_METHOD_OPTIONS: { value: HttpMethod; label: string; color: string }[] = [
  { value: 'GET', label: 'GET', color: 'blue' },
  { value: 'POST', label: 'POST', color: 'green' },
  { value: 'PUT', label: 'PUT', color: 'orange' },
  { value: 'DELETE', label: 'DELETE', color: 'red' },
  { value: 'PATCH', label: 'PATCH', color: 'purple' },
  { value: 'HEAD', label: 'HEAD', color: 'default' },
  { value: 'OPTIONS', label: 'OPTIONS', color: 'default' },
];

/**
 * HTTP 方法对应的颜色
 */
export const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
  HEAD: 'default',
  OPTIONS: 'default',
};

