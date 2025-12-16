import { Controller, Get, Inject } from '@midwayjs/decorator';
import { Context } from '@midwayjs/web';
import { ModelMetricsResponse } from '../../dto/model-metrics';
import { ModelMetricsService } from '../../service/common/model-metrics.service';

@Controller('/code-agent/metrics')
export class ModelMetricsController {
  @Inject()
  private ctx: Context;

  @Inject()
  private modelMetricsService: ModelMetricsService;

  @Get('/')
  async getLatestMetrics(): Promise<ModelMetricsResponse> {
    const data = await this.modelMetricsService.getCachedSnapshot();
    const response = new ModelMetricsResponse(
      data,
      this.modelMetricsService.getPollIntervalSeconds(),
      this.modelMetricsService.getCacheTTLSeconds()
    );

    if (!data) {
      response.success = false;
      response.message = 'Model metrics cache is not ready yet';
      this.ctx.status = 503;
    }

    return response;
  }
}
