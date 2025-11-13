export interface ModelMetricsSnapshot {
  modelName?: string;
  fetchedAt: number;
  /**
   * 解码阶段的整体吞吐（tokens/s）
   */
  throughput?: number;
  /**
   * 每个输出token耗时（seconds/token）
   */
  tpot?: number;
  /**
   * 首token耗时（seconds）
   */
  ttft?: number;
  /**
   * 当前运行中的请求数量
   */
  numRequestsRunning?: number;
  /**
   * 等待调度的请求数量
   */
  numRequestsWaiting?: number;
  /**
   * KV cache 的使用率（0-1）
   */
  kvCacheUsagePerc?: number;
  /**
   * 已处理的前缀 tokens 总量
   */
  promptTokensTotal?: number;
  /**
   * 已生成 tokens 总量
   */
  generationTokensTotal?: number;
  /**
   * 成功请求数量（含不同 finish reason 的总和）
   */
  requestSuccessTotal?: number;
  /**
   * 不同 finish reason 对应的成功请求数量
   */
  requestSuccessByReason?: Record<string, number>;
  /**
   * 前缀缓存命中率（0-1）
   */
  prefixCacheHitRate?: number;
  /**
   * 前缀缓存命中次数
   */
  prefixCacheHitsTotal?: number;
  /**
   * 前缀缓存查询次数
   */
  prefixCacheQueriesTotal?: number;
}
