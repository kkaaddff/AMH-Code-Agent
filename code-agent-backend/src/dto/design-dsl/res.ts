import { ApiProperty } from '@midwayjs/swagger';
import { AsyncResponse } from '../../types';
import { DesignData, DSLData } from '../../types/design-dsl';

export class GetDSLDataResponse extends AsyncResponse {
  @ApiProperty({ description: 'DSLData数据' })
  public data: DSLData;

  constructor(data: DSLData) {
    super();
    this.data = data;
  }
}

export class ProcessDSLDataResponse extends AsyncResponse {
  @ApiProperty({ description: '处理后的DSLData数据' })
  public data: DesignData;

  @ApiProperty({ description: '处理统计信息' })
  public stats: {
    totalNodes: number;
    pathNodes: number;
    convertedNodes: number;
    styleCount: number;
  };

  constructor(data: DesignData, stats: any) {
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
