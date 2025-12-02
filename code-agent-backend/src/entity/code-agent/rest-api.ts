import { modelOptions, prop, Severity } from '@typegoose/typegoose';
import { EntityModel } from '@midwayjs/typegoose';
import type { HttpMethod } from '@fta/shared-types';

/**
 * REST API 接口实体
 * 用于存储 REST API 接口定义，关联数据模型
 */
@EntityModel()
@modelOptions({
  schemaOptions: {
    collection: 'code_agent_rest_api',
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class RestApi {
  _id: any;

  /** 唯一标识 */
  @prop({ required: true })
  id: string;

  /** 关联的项目 ID */
  @prop({ required: true })
  projectId: string;

  /** 关联的接口组 ID */
  @prop()
  groupId?: string;

  /** 接口名称 */
  @prop({ required: true })
  name: string;

  /** 接口描述 */
  @prop()
  description?: string;

  /** API 地址 */
  @prop()
  url?: string;

  /** HTTP 请求方法 */
  @prop({ enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'] })
  method?: HttpMethod;

  /** 请求参数关联的数据模型 ID 列表 */
  @prop({ type: () => [String], default: () => [] })
  requestModelIds: string[];

  /** 响应数据关联的数据模型 ID 列表 */
  @prop({ type: () => [String], default: () => [] })
  responseModelIds: string[];

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

