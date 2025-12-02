/**
 * 基础数据模型类型定义
 */
import type { SchemaField, SchemaFieldType, HttpMethod } from '@fta/shared-types';

// 重新导出共享类型
export type { SchemaField, SchemaFieldType, HttpMethod };

/**
 * 空的 Schema 字段模板
 */
export const EMPTY_SCHEMA_FIELD: SchemaField = {
  name: '',
  type: 'string',
  description: '',
  required: false,
};

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
 * Schema 字段类型选项
 */
export const SCHEMA_FIELD_TYPE_OPTIONS: { value: SchemaFieldType; label: string }[] = [
  { value: 'string', label: '字符串' },
  { value: 'number', label: '数字' },
  { value: 'boolean', label: '布尔' },
  { value: 'object', label: '对象' },
  { value: 'array', label: '数组' },
];
