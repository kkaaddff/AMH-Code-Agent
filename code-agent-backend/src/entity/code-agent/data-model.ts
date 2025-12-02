import { modelOptions, prop, Severity } from '@typegoose/typegoose';
import { EntityModel } from '@midwayjs/typegoose';
import type { SchemaField } from '@fta/shared-types';

/**
 * 数据模型实体
 * 用于存储数据结构定义，与 API 接口解耦
 */
@EntityModel()
@modelOptions({
  schemaOptions: {
    collection: 'code_agent_data_model',
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class DataModel {
  _id: any;

  /** 唯一标识 */
  @prop({ required: true })
  id: string;

  /** 关联的项目 ID */
  @prop({ required: true })
  projectId: string;

  /** 所属分组 ID（可选，未分组时为空） */
  @prop()
  groupId?: string;

  /** 数据模型名称 */
  @prop({ required: true })
  name: string;

  /** 数据模型描述 */
  @prop()
  description?: string;

  /** 数据结构 Schema */
  @prop({ type: () => [Object], default: () => [] })
  schema: SchemaField[];

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
