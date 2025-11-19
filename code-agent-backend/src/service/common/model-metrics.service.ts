import { Config, Destroy, Init, Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import axios from 'axios';
import { RedisService } from '@midwayjs/redis';
import { randomUUID } from 'crypto';
import { ModelMetricsSnapshot } from '../../types/model-metrics';
import { ModelGatewayConfig } from './model-gateway';

const METRICS_CACHE_KEY = 'model:metrics:latest';
const METRICS_LOCK_KEY = 'model:metrics:poller-lock';
const CACHE_TTL_SECONDS = 15;
const POLL_INTERVAL_MS = 10 * 1000;
const LOCK_TTL_SECONDS = 10;

@Provide()
@Scope(ScopeEnum.Singleton)
export class ModelMetricsService {
  @Inject()
  private redisService: RedisService;

  @Config('modelGateway.default')
  private modelGatewayConfig: ModelGatewayConfig;

  private pollTimer?: NodeJS.Timeout;
  private readonly instanceId = randomUUID();

  @Init()
  async init(): Promise<void> {
    if (['bigmodel', 'volces'].some((provider) => this.modelGatewayConfig?.baseURL.includes(provider))) {
      return;
    }
    // 立即执行一次，确保缓存尽快可用
    await this.runPollingCycle();
    this.startLoop();
  }

  @Destroy()
  async destroy(): Promise<void> {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = undefined;
    }
  }

  /**
   * 提供给 controller 使用的缓存读取方法
   */
  public async getCachedSnapshot(): Promise<ModelMetricsSnapshot | null> {
    try {
      const cached = await this.redisService.get(METRICS_CACHE_KEY);
      if (!cached) {
        return null;
      }
      return JSON.parse(cached) as ModelMetricsSnapshot;
    } catch (error) {
      console.warn('[ModelMetricsService] failed to parse cached metrics', error);
      return null;
    }
  }

  public getCacheTTLSeconds(): number {
    return CACHE_TTL_SECONDS;
  }

  public getPollIntervalSeconds(): number {
    return Math.floor(POLL_INTERVAL_MS / 1000);
  }

  private startLoop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
    this.pollTimer = setInterval(() => {
      this.runPollingCycle().catch((error) => {
        console.warn('[ModelMetricsService] polling cycle failed', error);
      });
    }, POLL_INTERVAL_MS);

    if (typeof this.pollTimer.unref === 'function') {
      this.pollTimer.unref();
    }
  }

  private async runPollingCycle(): Promise<void> {
    const lockAcquired = await this.tryAcquireLock();
    if (!lockAcquired) {
      return;
    }

    try {
      const snapshot = await this.fetchAndParseMetrics();
      if (snapshot) {
        await this.cacheSnapshot(snapshot);
      }
    } catch (error) {
      console.warn('[ModelMetricsService] polling execution error', error);
    } finally {
      await this.releaseLock();
    }
  }

  private async fetchAndParseMetrics(): Promise<ModelMetricsSnapshot | null> {
    const metricsUrl = this.buildMetricsUrl();
    if (!metricsUrl) {
      console.warn('[ModelMetricsService] metrics endpoint is not configured');
      return null;
    }

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (this.modelGatewayConfig?.apiKey) {
        headers.Authorization = `Bearer ${this.modelGatewayConfig.apiKey}`;
      }

      const response = await axios.get(metricsUrl, {
        headers,
        timeout: this.modelGatewayConfig?.timeout ?? 15000,
      });

      const payload =
        typeof response.data === 'string'
          ? response.data
          : Buffer.isBuffer(response.data)
          ? response.data.toString('utf-8')
          : JSON.stringify(response.data);
      return this.parsePrometheusPayload(payload);
    } catch (error) {
      const status = (error as any)?.response?.status;
      console.warn(
        `[ModelMetricsService] failed to pull metrics from ${metricsUrl}${status ? `, status=${status}` : ''}`,
        error
      );
      return null;
    }
  }

  private async cacheSnapshot(snapshot: ModelMetricsSnapshot): Promise<void> {
    try {
      await this.redisService.set(METRICS_CACHE_KEY, JSON.stringify(snapshot), 'EX', CACHE_TTL_SECONDS);
    } catch (error) {
      console.warn('[ModelMetricsService] failed to cache metrics snapshot', error);
    }
  }

  private buildMetricsUrl(): string | null {
    const baseURL = this.modelGatewayConfig?.baseURL;
    if (!baseURL) {
      return null;
    }

    const trimmed = baseURL.replace(/\/+$/, '');
    const sanitized = trimmed.replace(/\/v1\/?$/i, '');
    const normalized = sanitized || trimmed;
    return `${normalized}/metrics`;
  }

  private async tryAcquireLock(): Promise<boolean> {
    try {
      const result = await (this.redisService as any).set(
        METRICS_LOCK_KEY,
        this.instanceId,
        'NX',
        'EX',
        LOCK_TTL_SECONDS
      );
      return result === 'OK';
    } catch (error) {
      console.warn('[ModelMetricsService] failed to acquire redis lock', error);
      return false;
    }
  }

  private async releaseLock(): Promise<void> {
    try {
      const existing = await this.redisService.get(METRICS_LOCK_KEY);
      if (existing === this.instanceId) {
        await this.redisService.del(METRICS_LOCK_KEY);
      }
    } catch (error) {
      console.warn('[ModelMetricsService] failed to release redis lock', error);
    }
  }

  private parsePrometheusPayload(payload: string): ModelMetricsSnapshot | null {
    if (!payload || typeof payload !== 'string') {
      return null;
    }

    const snapshot: ModelMetricsSnapshot = {
      fetchedAt: Date.now(),
    };

    let prefixCacheHits: number | undefined;
    let prefixCacheQueries: number | undefined;
    let decodeTimeSum: number | undefined;
    let prefillTimeSum: number | undefined;
    let prefillTimeCount: number | undefined;
    const successBreakdown: Record<string, number> = {};

    const lines = payload.split('\n');
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('#')) {
        continue;
      }

      const match = line.match(/^([a-zA-Z_:][a-zA-Z0-9_:]*)(?:\{([^}]*)\})?\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/);
      if (!match) {
        continue;
      }

      const [, metricName, labelSegment, valueStr] = match;
      const value = Number(valueStr);
      if (!Number.isFinite(value)) {
        continue;
      }
      const labels = this.parseLabelSegment(labelSegment);
      if (!snapshot.modelName && labels.model_name) {
        snapshot.modelName = labels.model_name;
      }

      switch (metricName) {
        case 'vllm:num_requests_running':
          snapshot.numRequestsRunning = (snapshot.numRequestsRunning ?? 0) + value;
          break;
        case 'vllm:num_requests_waiting':
          snapshot.numRequestsWaiting = (snapshot.numRequestsWaiting ?? 0) + value;
          break;
        case 'vllm:kv_cache_usage_perc':
          snapshot.kvCacheUsagePerc =
            snapshot.kvCacheUsagePerc !== undefined ? Math.max(snapshot.kvCacheUsagePerc, value) : value;
          break;
        case 'vllm:prompt_tokens_total':
          snapshot.promptTokensTotal = (snapshot.promptTokensTotal ?? 0) + value;
          break;
        case 'vllm:generation_tokens_total':
          snapshot.generationTokensTotal = (snapshot.generationTokensTotal ?? 0) + value;
          break;
        case 'vllm:request_success_total': {
          const reason = labels.finished_reason || 'unknown';
          successBreakdown[reason] = (successBreakdown[reason] ?? 0) + value;
          snapshot.requestSuccessTotal = (snapshot.requestSuccessTotal ?? 0) + value;
          break;
        }
        case 'vllm:prefix_cache_hits_total':
          prefixCacheHits = (prefixCacheHits ?? 0) + value;
          break;
        case 'vllm:prefix_cache_queries_total':
          prefixCacheQueries = (prefixCacheQueries ?? 0) + value;
          break;
        case 'vllm:request_decode_time_seconds_sum':
          decodeTimeSum = (decodeTimeSum ?? 0) + value;
          break;
        case 'vllm:request_prefill_time_seconds_sum':
          prefillTimeSum = (prefillTimeSum ?? 0) + value;
          break;
        case 'vllm:request_prefill_time_seconds_count':
          prefillTimeCount = (prefillTimeCount ?? 0) + value;
          break;
        default:
          break;
      }
    }

    if (Object.keys(successBreakdown).length > 0) {
      snapshot.requestSuccessByReason = successBreakdown;
    }
    if (prefixCacheHits !== undefined) {
      snapshot.prefixCacheHitsTotal = prefixCacheHits;
    }
    if (prefixCacheQueries !== undefined) {
      snapshot.prefixCacheQueriesTotal = prefixCacheQueries;
    }
    if (prefixCacheHits !== undefined && prefixCacheQueries !== undefined && prefixCacheQueries > 0) {
      snapshot.prefixCacheHitRate = prefixCacheHits / prefixCacheQueries;
    }
    if (
      snapshot.generationTokensTotal !== undefined &&
      snapshot.generationTokensTotal > 0 &&
      decodeTimeSum !== undefined &&
      decodeTimeSum > 0
    ) {
      snapshot.throughput = snapshot.generationTokensTotal / decodeTimeSum;
      snapshot.tpot = decodeTimeSum / snapshot.generationTokensTotal;
    }
    if (prefillTimeSum !== undefined && prefillTimeCount !== undefined && prefillTimeCount > 0) {
      snapshot.ttft = prefillTimeSum / prefillTimeCount;
    }
    if (!snapshot.modelName && this.modelGatewayConfig?.model) {
      snapshot.modelName = this.modelGatewayConfig.model;
    }

    return snapshot;
  }

  private parseLabelSegment(labelSegment?: string): Record<string, string> {
    const labels: Record<string, string> = {};
    if (!labelSegment) {
      return labels;
    }
    const regex = /([\w]+)="([^"]*)"/g;
    let match: RegExpExecArray | null;
    while ((match = regex.exec(labelSegment)) !== null) {
      labels[match[1]] = match[2];
    }
    return labels;
  }
}
