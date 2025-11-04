import { ApiProperty } from "@midwayjs/swagger";
import { EntityModel } from "@midwayjs/typegoose";
import { index, modelOptions, prop, Severity } from "@typegoose/typegoose";

export type CodeGenerationTaskStatus =
  | "pending"
  | "processing"
  | "completed"
  | "failed"
  | "canceled";

@EntityModel()
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
export class CodeGenerationTaskResult {
  @ApiProperty({
    example: "oss://bucket/zip/task-001.zip",
    description: "生成结果 ZIP 的 OSS Key",
  })
  @prop()
  public outputZipKey?: string;

  @ApiProperty({ example: 12, description: "生成的文件数量" })
  @prop()
  public fileCount?: number;

  @ApiProperty({ example: 102400, description: "生成文件总大小（字节）" })
  @prop()
  public totalSize?: number;

  @ApiProperty({ example: "v1.2.0", description: "使用的模板版本号" })
  @prop()
  public templateVersion?: string;

  @ApiProperty({ description: "额外的结果元信息" })
  @prop({ type: () => Object })
  public metadata?: Record<string, unknown>;
}

@EntityModel()
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
export class CodeGenerationTaskError {
  @ApiProperty({ example: "Failed to generate code", description: "错误信息" })
  @prop()
  public message?: string;

  @ApiProperty({ example: "Error: ...", description: "堆栈信息" })
  @prop()
  public stack?: string;

  @ApiProperty({ example: 1, description: "已重试次数" })
  @prop()
  public retryCount?: number;

  @ApiProperty({ description: "额外的错误上下文" })
  @prop({ type: () => Object })
  public context?: Record<string, unknown>;
}

@modelOptions({
  schemaOptions: {
    collection: "design_code_generation_tasks",
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
@index(
  { designId: 1, status: 1 },
  { name: "design_code_tasks_design_status_idx" }
)
@index({ createdAt: -1 }, { name: "design_code_tasks_created_at_idx" })
@EntityModel()
export class DesignCodeGenerationTaskEntity {
  @ApiProperty({ type: "string", description: "任务 ID" })
  public _id?: string;

  @ApiProperty({ type: "string", description: "设计稿 ID" })
  @prop({ required: true })
  public designId: string;

  @ApiProperty({ type: "string", description: "需求文档 ID" })
  @prop()
  public requirementDocId?: string;

  @ApiProperty({ example: "react", description: "任务类型/生成框架" })
  @prop({ required: true })
  public taskType: string;

  @ApiProperty({
    example: "pending",
    enum: ["pending", "processing", "completed", "failed", "canceled"],
    description: "任务状态",
  })
  @prop({ default: "pending" })
  public status: CodeGenerationTaskStatus;

  @ApiProperty({ example: 0, description: "任务进度 0-100" })
  @prop({ default: 0 })
  public progress: number;

  @ApiProperty({ description: "任务处理日志片段", type: [String] })
  @prop({ type: () => [String], default: [] })
  public logs: string[];

  @ApiProperty({ description: "任务选项配置" })
  @prop({ type: () => Object, default: {} })
  public options: Record<string, unknown>;

  @ApiProperty({ description: "任务结果" })
  @prop({ _id: false, type: () => CodeGenerationTaskResult })
  public result?: CodeGenerationTaskResult;

  @ApiProperty({ description: "错误信息" })
  @prop({ _id: false, type: () => CodeGenerationTaskError })
  public error?: CodeGenerationTaskError;

  @ApiProperty({ example: "Y0001234", description: "任务创建人" })
  @prop({ required: true })
  public createdBy: string;

  @ApiProperty({ example: "Y0001234", description: "最后操作人" })
  @prop()
  public updatedBy?: string;

  @ApiProperty({ type: "string", description: "任务完成时间" })
  @prop()
  public completedAt?: Date;

  @ApiProperty({ type: "string", description: "创建时间" })
  public createdAt?: Date;

  @ApiProperty({ type: "string", description: "更新时间" })
  public updatedAt?: Date;
}
