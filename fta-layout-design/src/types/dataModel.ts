/**
 * 数据模型相关类型定义
 */
import type { SchemaField, SchemaFieldType, ParseSchemaRequest } from '@fta/shared-types';

// 重新导出共享类型
export type { SchemaField, SchemaFieldType, ParseSchemaRequest };

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
 * 数据模型
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
  /** 数据结构 Schema */
  schema: SchemaField[];
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
 * 创建数据模型请求
 */
export interface CreateDataModelRequest {
  projectId: string;
  groupId?: string;
  name: string;
  description?: string;
  schema?: SchemaField[];
}

/**
 * 更新数据模型请求
 */
export interface UpdateDataModelRequest {
  groupId?: string | null;
  name?: string;
  description?: string;
  schema?: SchemaField[];
}

/**
 * Schema 字段类型选项
 */
export const SCHEMA_FIELD_TYPE_OPTIONS: { value: SchemaFieldType; label: string }[] = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔' },
  { value: 'object', label: '对象' },
  { value: 'array', label: '数组' },
];

/**
 * 空的 Schema 字段模板
 */
export const EMPTY_SCHEMA_FIELD: SchemaField = {
  name: '',
  type: 'string',
  description: '',
  required: false,
};
