/**
 * 接口数据模型类型定义
 */

/**
 * HTTP 请求方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

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
 * 接口数据模型
 */
export interface InterfaceDataModel {
  /** 唯一标识 */
  id: string;
  /** 关联的页面 ID */
  pageId: string;
  /** 数据模型名称 */
  name: string;
  /** 数据模型描述 */
  description?: string;
  /** API 地址（可选，仅作参考） */
  url?: string;
  /** HTTP 请求方法 */
  method?: HttpMethod;
  /** 请求参数 Schema */
  requestSchema: SchemaField[];
  /** 响应参数 Schema */
  responseSchema: SchemaField[];
  /** 创建时间 */
  createdAt: string;
  /** 更新时间 */
  updatedAt: string;
  /** 用户 ID */
  userId: string;
}

/**
 * 创建数据模型请求
 */
export interface CreateDataModelRequest {
  pageId: string;
  name: string;
  description?: string;
  url?: string;
  method?: HttpMethod;
  requestSchema?: SchemaField[];
  responseSchema?: SchemaField[];
}

/**
 * 更新数据模型请求
 */
export interface UpdateDataModelRequest {
  name?: string;
  description?: string;
  url?: string;
  method?: HttpMethod;
  requestSchema?: SchemaField[];
  responseSchema?: SchemaField[];
}

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
