import { ApiProperty } from "@midwayjs/swagger";
import { EntityModel } from "@midwayjs/typegoose";
import { index, modelOptions, prop, Severity } from "@typegoose/typegoose";

export type RequirementDocumentStatus = "draft" | "published" | "archived";

@modelOptions({
  schemaOptions: {
    collection: "design_requirement_documents",
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
@index(
  { designId: 1, status: 1 },
  { name: "design_requirement_docs_design_status_idx" }
)
@index({ title: "text" }, { name: "design_requirement_docs_title_text_idx" })
@EntityModel()
export class DesignRequirementDocumentEntity {
  @ApiProperty({ type: "string", description: "文档 ID" })
  public _id?: string;

  @ApiProperty({ type: "string", description: "所属设计稿 ID" })
  @prop({ required: true })
  public designId: string;

  @ApiProperty({ example: "用户登录页需求规格说明", description: "文档标题" })
  @prop({ required: true })
  public title: string;

  @ApiProperty({ description: "Markdown 文本内容" })
  @prop({ type: () => String, required: true })
  public content: string;

  @ApiProperty({
    example: "draft",
    enum: ["draft", "published", "archived"],
    description: "文档状态",
  })
  @prop({ default: "draft" })
  public status: RequirementDocumentStatus;

  @ApiProperty({
    example: "oss://bucket/path/to/doc.md",
    description: "导出文件 OSS Key",
  })
  @prop()
  public ossObjectKey?: string;

  @ApiProperty({
    example: ["md", "pdf"],
    description: "可用导出格式",
    type: [String],
  })
  @prop({ type: () => [String], default: [] })
  public exportFormats?: string[];

  @ApiProperty({ example: "Y0001234", description: "创建人" })
  @prop({ required: true })
  public createdBy: string;

  @ApiProperty({ example: "Y0001234", description: "最后修改人" })
  @prop()
  public updatedBy?: string;

  @ApiProperty({ example: "2024-05-01T10:00:00Z", description: "发布时间" })
  @prop()
  public publishedAt?: Date;

  @ApiProperty({ example: "2024-06-01T10:00:00Z", description: "归档时间" })
  @prop()
  public archivedAt?: Date;

  @ApiProperty({ type: "string", description: "创建时间" })
  public createdAt?: Date;

  @ApiProperty({ type: "string", description: "更新时间" })
  public updatedAt?: Date;
}
