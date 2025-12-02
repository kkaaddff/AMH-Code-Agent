import { modelOptions, prop, Severity } from '@typegoose/typegoose';
import { EntityModel } from '@midwayjs/typegoose';

/**
 * REST API 接口组实体
 * 用于对 REST API 接口进行分组管理，支持从远程 URL 同步接口
 */
@EntityModel()
@modelOptions({
  schemaOptions: {
    collection: 'code_agent_rest_api_group',
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class RestApiGroup {
  _id: any;

  /** 唯一标识 */
  @prop({ required: true })
  id: string;

  /** 关联的项目 ID */
  @prop({ required: true })
  projectId: string;

  /** 组名称 */
  @prop({ required: true })
  name: string;

  /** 组描述 */
  @prop()
  description?: string;

  /** 远程同步 URL（OpenAPI/Swagger 文档地址） */
  @prop()
  syncUrl?: string;

  /** 最后同步时间 */
  @prop()
  lastSyncAt?: Date;

  /** 同步状态：idle | syncing | success | failed */
  @prop({ default: 'idle' })
  syncStatus?: 'idle' | 'syncing' | 'success' | 'failed';

  /** 同步错误信息 */
  @prop()
  syncError?: string;

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

