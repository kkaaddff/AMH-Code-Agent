import { ApiProperty } from '@midwayjs/swagger';
import { EntityModel } from '@midwayjs/typegoose';
import { index, modelOptions, prop, Severity } from '@typegoose/typegoose';

@EntityModel()
@modelOptions({
  schemaOptions: { timestamps: true },
  options: { allowMixed: Severity.ALLOW },
})
@index({ digest: 1 }, { unique: true })
export class DesignPathAssetEntity {
  @ApiProperty({ example: '665f1f054b6b3f1b42ed12cb', description: '主键 id' })
  public _id?: string;

  @ApiProperty({ example: '2024-06-01T10:00:00.000Z', description: '创建时间' })
  public createdAt?: Date;

  @ApiProperty({ example: '2024-06-01T10:00:00.000Z', description: '更新时间' })
  public updatedAt?: Date;

  @ApiProperty({ example: 'sha256:abcdef...', description: '路径数据摘要' })
  @prop({ required: true, unique: true })
  public digest: string;

  @ApiProperty({
    example: 'https://example.com/temp/converted.png',
    description: 'PNG 图片地址',
  })
  @prop({ required: true })
  public imageUrl: string;

  @ApiProperty({ example: 'M10 10H20V20H10Z', description: '原始路径数据' })
  @prop({ required: true })
  public pathData: string;

  @ApiProperty({ example: 'paint_1:0020', description: '填充样式' })
  @prop()
  public fillStyle?: string;
}
