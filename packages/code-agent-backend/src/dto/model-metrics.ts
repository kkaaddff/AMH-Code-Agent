import { ApiProperty } from '@midwayjs/swagger';
import { AsyncResponse, ModelMetricsSnapshot } from '../types';

export class ModelMetricsResponse extends AsyncResponse {
  @ApiProperty({ description: '最新一次成功采集的模型指标', required: false, type: 'object' })
  public data: ModelMetricsSnapshot | null;

  @ApiProperty({ description: '指标采集间隔（秒）' })
  public pollIntervalSeconds: number;

  @ApiProperty({ description: 'Redis 缓存有效期（秒）' })
  public cacheTTLSeconds: number;

  constructor(data: ModelMetricsSnapshot | null, pollIntervalSeconds: number, cacheTTLSeconds: number) {
    super();
    this.data = data;
    this.pollIntervalSeconds = pollIntervalSeconds;
    this.cacheTTLSeconds = cacheTTLSeconds;
  }
}
