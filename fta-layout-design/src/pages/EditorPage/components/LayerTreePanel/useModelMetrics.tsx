import { useEffect, useMemo, useState, type ReactElement } from 'react';
import { Tag, Tooltip } from 'antd';
import { modelMetricsService } from '@/services/modelMetricsService';
import type { ModelMetricsSnapshot } from '@/types/modelMetrics';

export type ModelStatus = 'busy' | 'idle' | 'unknown' | 'error';

const evaluateModelStatus = (snapshot: ModelMetricsSnapshot | null): ModelStatus => {
  if (!snapshot) {
    return 'unknown';
  }
  const running = snapshot.numRequestsRunning ?? 0;
  const waiting = snapshot.numRequestsWaiting ?? 0;
  const kvUsage = snapshot.kvCacheUsagePerc ?? 0;

  if (waiting > 0 || running > 0 || kvUsage >= 0.85) {
    return 'busy';
  }
  return 'idle';
};

const formatPercent = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) {
    return '未知';
  }
  return `${Math.round(value * 1000) / 10}%`;
};

const formatTimestamp = (value?: number) => {
  if (!value) {
    return '未采集';
  }
  return new Date(value).toLocaleTimeString();
};

export const useModelMetrics = () => {
  const [modelMetrics, setModelMetrics] = useState<ModelMetricsSnapshot | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('unknown');
  const [modelStatusMessage, setModelStatusMessage] = useState<string>('');

  useEffect(() => {
    let isMounted = true;
    let polling = false;

    const pollMetrics = async () => {
      if (polling) {
        return;
      }
      polling = true;
      try {
        const response = await modelMetricsService.getLatest();
        if (!isMounted) {
          return;
        }
        const snapshot = response.data ?? null;
        setModelMetrics(snapshot);
        setModelStatus(evaluateModelStatus(snapshot));
        const nextMessage = response.message && response.message !== 'Success' ? response.message : '';
        setModelStatusMessage(nextMessage);
      } catch (error: any) {
        if (!isMounted) {
          return;
        }
        setModelStatus('error');
        setModelStatusMessage(error?.message ?? '无法获取模型指标');
      } finally {
        polling = false;
      }
    };

    // pollMetrics();
    // const timerId = window.setInterval(pollMetrics, 5000);
    return () => {
      isMounted = false;
      // clearInterval(timerId);
    };
  }, []);

  const modelStatusTag = useMemo(() => {
    const colorMap: Record<ModelStatus, string> = {
      busy: 'orange',
      idle: 'green',
      unknown: 'default',
      error: 'red',
    };
    const textMap: Record<ModelStatus, string> = {
      busy: '模型繁忙',
      idle: '模型空闲',
      unknown: '模型状态未知',
      error: '模型状态异常',
    };
    const running = modelMetrics?.numRequestsRunning ?? 0;
    const waiting = modelMetrics?.numRequestsWaiting ?? 0;
    const kvUsage = modelMetrics?.kvCacheUsagePerc;

    return (
      <Tooltip
        placement='topRight'
        title={
          <div className='layer-tree-panel__tooltip-content'>
            <div>{textMap[modelStatus]}</div>
            <div>运行中请求：{running}</div>
            <div>排队中请求：{waiting}</div>
            <div>KV 缓存使用率：{formatPercent(kvUsage)}</div>
            <div>最近采集时间：{formatTimestamp(modelMetrics?.fetchedAt)}</div>
            {modelStatusMessage && <div>提示：{modelStatusMessage}</div>}
          </div>
        }>
        <Tag color={colorMap[modelStatus]} className='layer-tree-panel__model-status-tag'>
          {textMap[modelStatus]}
        </Tag>
      </Tooltip>
    );
  }, [modelMetrics, modelStatus, modelStatusMessage]);

  return {
    modelStatusTag,
  };
};
