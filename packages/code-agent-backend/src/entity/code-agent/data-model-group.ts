import { modelOptions, prop, Severity } from '@typegoose/typegoose';
import { EntityModel } from '@midwayjs/typegoose';

/**
 * 数据模型组实体
 * 用于对数据模型进行分组管理，项目级别共享
 */
@EntityModel()
@modelOptions({
  schemaOptions: {
    collection: 'code_agent_data_model_group',
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
export class DataModelGroup {
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

