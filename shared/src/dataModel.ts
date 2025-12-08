/**
 * 数据模型相关共享类型定义
 * 用于 backend、frontend 和 agent-core 之间的类型共享
 * 
 * 数据模型使用 TypeScript Interfaces 作为单一事实来源
 */

/**
 * 数据模型定义
 */
export interface DataModelDefinition {
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
  createdAt: Date | string;
  /** 更新时间 */
  updatedAt: Date | string;
  /** 用户 ID */
  userId: string;
}

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
