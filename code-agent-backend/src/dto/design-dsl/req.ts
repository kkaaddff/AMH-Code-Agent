import { ApiProperty } from '@midwayjs/swagger';

export class ProcessDesignDSLRequest {
  @ApiProperty({
    example: 'search-result',
    description: 'DSL文件的名称或标识',
    required: false,
  })
  public name?: string;

  @ApiProperty({
    example: true,
    description: '是否转换PATH为LAYER',
    required: false,
    default: true,
  })
  public convertPaths?: boolean;

  @ApiProperty({
    example: false,
    description: '是否保留原始PATH数据',
    required: false,
    default: false,
  })
  public keepOriginalPaths?: boolean;
}

export class ConvertPathRequest {
  @ApiProperty({
    example: 'paint_1:0020',
    description: '填充样式ID',
    required: true,
  })
  public fillStyle: string;

  @ApiProperty({
    example: 'M0 24C0 10.7452 10.7452 0 24 0...',
    description: 'SVG路径数据',
    required: true,
  })
  public pathData: string;

  @ApiProperty({
    example: 'circle-icon',
    description: '图标名称',
    required: false,
  })
  public iconName?: string;
}

export class RedisSetRequest {
  @ApiProperty({
    example: 'design-dsl:path:abc123',
    description: 'Redis缓存键',
    required: true,
  })
  public key: string;

  @ApiProperty({
    example: 'https://example.com/temp/icon.png',
    description: 'Redis缓存值',
    required: true,
  })
  public value: string;

  @ApiProperty({
    example: 3600,
    description: '缓存过期时间（秒）',
    required: false,
  })
  public ttlSeconds?: number;
}
