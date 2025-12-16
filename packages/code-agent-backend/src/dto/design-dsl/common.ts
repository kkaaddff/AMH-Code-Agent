import { ApiProperty } from '@midwayjs/swagger';

export class DSLProcessingOptions {
  @ApiProperty({ example: true, description: '是否转换PATH为LAYER' })
  public convertPaths: boolean;

  @ApiProperty({ example: false, description: '是否保留原始PATH数据' })
  public keepOriginalPaths: boolean;

  @ApiProperty({ example: 'png', description: '输出图片格式' })
  public outputFormat: 'png' | 'jpg' | 'svg';

  constructor(
    convertPaths: boolean = true,
    keepOriginalPaths: boolean = false,
    outputFormat: 'png' | 'jpg' | 'svg' = 'png'
  ) {
    this.convertPaths = convertPaths;
    this.keepOriginalPaths = keepOriginalPaths;
    this.outputFormat = outputFormat;
  }
}
