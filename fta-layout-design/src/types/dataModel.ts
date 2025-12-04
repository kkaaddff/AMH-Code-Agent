/**
 * 数据模型相关类型定义
 * 使用 TypeScript Interfaces 作为单一事实来源
 */
import type {
  DataModelDefinition,
  CreateDataModelRequest as SharedCreateDataModelRequest,
  UpdateDataModelRequest as SharedUpdateDataModelRequest,
} from '@fta/shared-types';

// 重新导出共享类型
export type { DataModelDefinition };
export type CreateDataModelRequest = SharedCreateDataModelRequest;
export type UpdateDataModelRequest = SharedUpdateDataModelRequest;

/**
 * 数据模型组
 */
export interface DataModelGroup {
  /** 唯一标识 */
  id: string;
  /** 关联的项目 ID */
  projectId: string;
  /** 组名称 */
  name: string;
  /** 组描述 */
  description?: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 用户 ID */
  userId: string;
}

/**
 * 数据模型（使用 TypeScript Interfaces）
 */
export interface DataModel {
  /** 唯一标识 */
  id: string;
  /** 关联的项目 ID */
  projectId: string;
  /** 所属分组 ID（可选） */
  groupId?: string;
  /** 数据模型名称 */
  name: string;
  /** 数据模型描述 */
  description?: string;
  /** TypeScript 接口定义内容 */
  tsContent: string;
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 用户 ID */
  userId: string;
}

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

/**
 * 默认的 TypeScript 接口模板
 */
export const DEFAULT_TS_TEMPLATE = `/**
 * 数据模型定义
 * 请在此处定义您的 TypeScript 接口
 */
export interface DataModel {
  id: string;
  // 在此处添加其他字段...
}
`;
