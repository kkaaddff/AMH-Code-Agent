export interface ModelMetricsSnapshot {
  modelName?: string;
  fetchedAt?: number;
  throughput?: number;
  tpot?: number;
  ttft?: number;
  numRequestsRunning?: number;
  numRequestsWaiting?: number;
  kvCacheUsagePerc?: number;
  promptTokensTotal?: number;
  generationTokensTotal?: number;
  requestSuccessTotal?: number;
  requestSuccessByReason?: Record<string, number>;
  prefixCacheHitRate?: number;
  prefixCacheHitsTotal?: number;
  prefixCacheQueriesTotal?: number;
}

export interface ModelMetricsApiResponse {
  success?: boolean;
  message?: string;
  data: ModelMetricsSnapshot | null;
  pollIntervalSeconds?: number;
  cacheTTLSeconds?: number;
}
