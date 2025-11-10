import { ApiProperty } from '@midwayjs/swagger';
import { EntityModel } from '@midwayjs/typegoose';
import { index, modelOptions, prop, Severity } from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: {
    collection: 'design_task_logs',
    timestamps: true,
  },
  options: { allowMixed: Severity.ALLOW },
})
@index({ taskId: 1, createdAt: -1 }, { name: 'design_task_logs_task_idx' })
@EntityModel()
export class DesignTaskLogEntity {
  @ApiProperty({ type: 'string', description: '日志记录 ID' })
  public _id?: string;

  @ApiProperty({ type: 'string', description: '任务 ID' })
  @prop({ required: true })
  public taskId: string;

  @ApiProperty({ example: '解析组件结构', description: '日志信息' })
  @prop({ required: true })
  public message: string;

  @ApiProperty({ example: 'info', description: '日志级别' })
  @prop({ default: 'info' })
  public level: 'info' | 'warn' | 'error';

  @ApiProperty({ description: '额外上下文' })
  @prop({ type: () => Object })
  public context?: Record<string, unknown>;

  @ApiProperty({ type: 'string', description: '创建时间' })
  public createdAt?: Date;
}
