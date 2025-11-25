import { modelOptions, prop, Severity } from '@typegoose/typegoose';
import { EntityModel } from '@midwayjs/typegoose';

/**
 * HTTP 请求方法类型
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

/**
 * Schema 字段定义
 */
export interface SchemaField {
  /** 字段名 */
  name: string;
  /** 字段类型 (string, number, boolean, object, array 等) */
  type: string;
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
 * 接口数据模型实体
 * 用于存储手动定义的 API 接口数据结构
 */
@EntityModel()
@modelOptions({
  schemaOptions: {
    collection: 'code_agent_interface_data_model',
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class InterfaceDataModel {
  _id: any;

  /** 唯一标识 */
  @prop({ required: true })
  id: string;

  /** 关联的页面 ID */
  @prop({ required: true })
  pageId: string;

  /** 数据模型名称 */
  @prop({ required: true })
  name: string;

  /** 数据模型描述 */
  @prop()
  description?: string;

  /** API 地址（可选，仅作参考） */
  @prop()
  url?: string;

  /** HTTP 请求方法 */
  @prop({ enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] })
  method?: HttpMethod;

  /** 请求参数 Schema */
  @prop({ type: () => [Object], default: () => [] })
  requestSchema: SchemaField[];

  /** 响应参数 Schema */
  @prop({ type: () => [Object], default: () => [] })
  responseSchema: SchemaField[];

  /** 创建时间 */
  @prop({ required: true })
  createdAt: Date;

  /** 更新时间 */
  @prop({ required: true })
  updatedAt: Date;

  /** 用户 ID */
  @prop({ required: true })
  userId: string;
}

