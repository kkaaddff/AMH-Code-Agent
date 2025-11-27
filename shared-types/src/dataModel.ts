/**
 * 数据模型相关共享类型定义
 * 用于 backend、frontend 和 agent-core 之间的类型共享
 */

/**
 * Schema 字段类型
 */
export type SchemaFieldType = 'string' | 'number' | 'boolean' | 'object' | 'array';

/**
 * Schema 字段定义
 */
export interface SchemaField {
  /** 字段名 */
  name: string;
  /** 字段类型 */
  type: SchemaFieldType;
  /** 字段描述 */
  description?: string;
  /** 是否必填 */
  required?: boolean;
  /** 示例值 */
  example?: any;
  /** 枚举值（如果是枚举类型） */
  enum?: string[];
  /** 子字段（如果是 object 类型） */
  properties?: SchemaField[];
  /** 数组元素类型（如果是 array 类型） */
  items?: SchemaField;
}

/**
 * AI 解析 Schema 请求
 */
export interface ParseSchemaRequest {
  text: string;
  hint?: 'json' | 'typescript' | 'text';
}
