import { modelOptions, prop, Severity } from '@typegoose/typegoose';
import { EntityModel } from '@midwayjs/typegoose';

/**
 * 数据模型实体
 * 使用 TypeScript Interfaces 作为单一事实来源
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

  /** TypeScript 接口定义内容 */
  @prop({ default: '' })
  tsContent: string;

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
