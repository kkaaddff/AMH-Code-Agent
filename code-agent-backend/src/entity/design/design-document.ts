import { ApiProperty } from "@midwayjs/swagger";
import { EntityModel } from "@midwayjs/typegoose";
import { index, modelOptions, prop, Severity } from "@typegoose/typegoose";

export type DesignDocumentStatus = "active" | "archived" | "deleted";

@modelOptions({
  schemaOptions: {
    collection: "design_documents",
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
@index({ name: 1 }, { name: "design_documents_name_idx" })
@index({ createdBy: 1 }, { name: "design_documents_creator_idx" })
@index({ status: 1 }, { name: "design_documents_status_idx" })
@EntityModel()
export class DesignDocumentEntity {
  @ApiProperty({ type: "string", description: "文档唯一标识" })
  public _id?: string;

  @ApiProperty({ type: "string", description: "创建时间" })
  public createdAt?: Date;

  @ApiProperty({ type: "string", description: "最后更新时间" })
  public updatedAt?: Date;

  @ApiProperty({ example: "用户登录页", description: "设计稿名称" })
  @prop({ required: true })
  public name: string;

  @ApiProperty({
    example: "登录页交互稿",
    required: false,
    description: "描述信息",
  })
  @prop()
  public description?: string;

  @ApiProperty({
    example: "https://mastergo.com/goto/LhGgBAK",
    description: "MasterGo 设计稿链接",
  })
  @prop()
  public mastergoUrl?: string;

  @ApiProperty({ description: "DSL 原始数据" })
  @prop({ type: () => Object })
  public dslData?: Record<string, unknown>;

  @ApiProperty({ example: 1, description: "DSL 版本号，自增" })
  @prop({ default: 1 })
  public dslRevision: number;

  @ApiProperty({
    example: "active",
    enum: ["active", "archived", "deleted"],
    description: "状态",
  })
  @prop({ default: "active" })
  public status: DesignDocumentStatus;

  @ApiProperty({
    example: "oss://bucket/path/to/file.json",
    description: "原始设计稿 OSS 对象 Key",
  })
  @prop()
  public ossObjectKey?: string;

  @ApiProperty({ example: 102400, description: "设计稿文件大小（字节）" })
  @prop()
  public fileSize?: number;

  @ApiProperty({ example: "application/json", description: "设计稿文件类型" })
  @prop()
  public fileType?: string;

  @ApiProperty({ example: "md5:abc123", description: "DSL 摘要" })
  @prop()
  public dslDigest?: string;

  @ApiProperty({ description: "自定义标签信息", type: [String] })
  @prop({ type: () => [String], default: [] })
  public tags?: string[];

  @ApiProperty({ example: "Y0001234", description: "创建人 JobId/UID" })
  @prop({ required: true })
  public createdBy: string;

  @ApiProperty({ example: "Y0005678", description: "最后更新人 JobId/UID" })
  @prop()
  public updatedBy?: string;

  @ApiProperty({ description: "额外元信息" })
  @prop({ type: () => Object })
  public metadata?: Record<string, unknown>;
}
