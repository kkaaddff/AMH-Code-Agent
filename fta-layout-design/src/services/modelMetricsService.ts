import { ApiError, api } from '@/utils/apiService';
import { ModelMetricsApiResponse, ModelMetricsSnapshot } from '@/types/modelMetrics';

export const modelMetricsService = {
  async getLatest(): Promise<ModelMetricsApiResponse> {
    try {
      const response = await api.metrics.latest<ModelMetricsSnapshot | null>();
      return {
        success: response.success,
        message: response.message,
        data: response.data,
        pollIntervalSeconds: (response as any).pollIntervalSeconds,
        cacheTTLSeconds: (response as any).cacheTTLSeconds,
      };
    } catch (error) {
      if (error instanceof ApiError && error.response) {
        try {
          const fallback = await error.response.clone().json();
          return {
            success: false,
            message: fallback?.message ?? error.message,
            data: fallback?.data ?? null,
            pollIntervalSeconds: fallback?.pollIntervalSeconds,
            cacheTTLSeconds: fallback?.cacheTTLSeconds,
          };
        } catch {
          // ignore parse failure and rethrow
        }
      }
      throw error;
    }
  },
};
