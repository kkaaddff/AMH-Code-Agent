import { ApiProperty } from '@midwayjs/swagger';
import { AsyncResponse } from '../../types';
import { DesignDSL } from '../../types/design-dsl';

export class GetDesignDSLResponse extends AsyncResponse {
  @ApiProperty({ description: 'DesignDSL数据' })
  public data: DesignDSL;

  constructor(data: DesignDSL) {
    super();
    this.data = data;
  }
}

export class ProcessDesignDSLResponse extends AsyncResponse {
  @ApiProperty({ description: '处理后的DesignDSL数据' })
  public data: DesignDSL;

  @ApiProperty({ description: '处理统计信息' })
  public stats: {
    totalNodes: number;
    pathNodes: number;
    convertedNodes: number;
    styleCount: number;
  };

  constructor(data: DesignDSL, stats: any) {
    super();
    this.data = data;
    this.stats = stats;
  }
}

export class ConvertPathResponse extends AsyncResponse {
  @ApiProperty({ description: '转换后的图片URL' })
  public imageUrl: string;

  @ApiProperty({ description: '生成的样式ID' })
  public styleId: string;

  @ApiProperty({ description: 'SVG文件路径' })
  public svgPath: string;

  constructor(imageUrl: string, styleId: string, svgPath: string) {
    super();
    this.imageUrl = imageUrl;
    this.styleId = styleId;
    this.svgPath = svgPath;
  }
}

export class GetDesignDSLStatsResponse extends AsyncResponse {
  @ApiProperty({ description: 'DSL统计信息' })
  public data: {
    totalNodes: number;
    pathNodes: number;
    convertedNodes: number;
    styleCount: number;
  };

  constructor(data: any) {
    super();
    this.data = data;
  }
}

export class RedisGetResponse extends AsyncResponse {
  @ApiProperty({ description: 'Redis返回值', required: false })
  public value: string | null;

  constructor(value: string | null) {
    super();
    this.value = value;
  }
}

export class RedisSetResponse extends AsyncResponse {
  @ApiProperty({ description: '设置是否成功' })
  public success: boolean;

  constructor(success: boolean) {
    super();
    this.success = success;
  }
}
