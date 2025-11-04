import { ApiProperty } from "@midwayjs/swagger";
import { EntityModel } from "@midwayjs/typegoose";
import { index, modelOptions, prop, Severity } from "@typegoose/typegoose";

export type DesignAnnotationStatus = "active" | "archived";

@modelOptions({
  schemaOptions: {
    collection: "design_component_annotations",
    timestamps: true,
  },
  options: {
    allowMixed: Severity.ALLOW,
  },
})
@index(
  { designId: 1, version: -1 },
  { unique: true, name: "design_annotations_design_version_idx" }
)
@index({ createdBy: 1 }, { name: "design_annotations_creator_idx" })
@EntityModel()
export class DesignComponentAnnotationEntity {
  @ApiProperty({ type: "string", description: "标注记录 ID" })
  public _id?: string;

  @ApiProperty({ type: "string", description: "设计稿 ID" })
  @prop({ required: true })
  public designId: string;

  @ApiProperty({ example: 1, description: "标注版本号，自增" })
  @prop({ required: true })
  public version: number;

  @ApiProperty({ description: "根节点标注树结构" })
  @prop({ type: () => Object, required: true })
  public rootAnnotation: Record<string, unknown>;

  @ApiProperty({ description: "展开节点 ID 列表", type: [String] })
  @prop({ type: () => [String], default: [] })
  public expandedKeys: string[];

  @ApiProperty({ example: "1.0.0", description: "标注协议版本号" })
  @prop()
  public schemaVersion?: string;

  @ApiProperty({
    example: "active",
    enum: ["active", "archived"],
    description: "状态",
  })
  @prop({ default: "active" })
  public status: DesignAnnotationStatus;

  @ApiProperty({ example: "Y0001234", description: "创建人" })
  @prop({ required: true })
  public createdBy: string;

  @ApiProperty({ example: "Y0001234", description: "最后修改人" })
  @prop()
  public updatedBy?: string;

  @ApiProperty({ type: "string", description: "创建时间" })
  public createdAt?: Date;

  @ApiProperty({ type: "string", description: "更新时间" })
  public updatedAt?: Date;
}
