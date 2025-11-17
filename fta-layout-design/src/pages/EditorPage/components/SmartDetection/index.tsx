import type { DSLData } from '@/types/dsl';
import confetti, { ConfettiInstance, ConfettiOptions } from 'canvas-confetti';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { designDetectionActions, findDSLNodeById } from '../../contexts/DesignDetectionContext';
import { smartDetection } from '../../services/SmartDetection';
import type { AnnotationNode } from '../../types/componentDetection';
import './styles.css';
import { App } from 'antd';

const COLOR_PALETTE = [
  '#667eea',
  '#764ba2',
  '#5a67d8',
  '#6b46c1',
  '#805ad5',
  '#4c51bf',
  '#553c9a',
  '#6366f1',
  '#8b5cf6',
  '#a78bfa',
  '#60a5fa',
  '#818cf8',
  '#a78bfa',
  '#c084fc',
  '#e879f9',
  '#fbbf24',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#f97316',
];

type SmartDetectionEntry = {
  nodeId: string;
  component: string;
};

export type SmartDetectionHandle = {
  runDetection: () => Promise<void>;
  isDetecting: boolean;
};

interface SmartDetectionProps {
  dslData: DSLData | null;
  rootAnnotation: AnnotationNode | null;
  selectedDocumentId?: string;
}

const SMART_DETECTION_COMPONENT_REGEX = /^[A-Za-z][A-Za-z0-9.]*/;

const parseSmartDetectionEvents = (events: Array<{ type: string; text?: string }>): SmartDetectionEntry[] => {
  if (!Array.isArray(events) || events.length === 0) {
    return [];
  }

  const textPayload = events
    .filter((event) => event.type === 'text' && typeof event.text === 'string' && event.text.trim().length > 0)
    .map((event) => event.text as string)
    .join('\n');

  if (!textPayload.trim()) {
    return [];
  }

  const resultMap = new Map<string, SmartDetectionEntry>();

  textPayload
    .split(/\r?\n/)
    .map((line) =>
      line
        .replace(/```/g, '')
        .replace(/^\s*[-*]\s*/, '')
        .replace(/^\s*\d+\.\s*/, '')
        .replace(/^\s*\d+\)\s*/, '')
        .replace(/^['"]+/, '')
        .replace(/['"]+$/, '')
        .trim()
    )
    .filter((line) => line.length > 0)
    .forEach((line) => {
      const lastColonIndex = line.lastIndexOf(':');
      if (lastColonIndex === -1) {
        return;
      }

      const rawNodeId = line.slice(0, lastColonIndex).trim();
      const rawComponent = line.slice(lastColonIndex + 1).trim();

      if (!rawNodeId || !rawComponent) {
        return;
      }

      const componentMatch = rawComponent.match(SMART_DETECTION_COMPONENT_REGEX);
      if (!componentMatch) {
        return;
      }

      const normalizedNodeId = rawNodeId.replace(/^['"]+|['"]+$/g, '');
      if (!normalizedNodeId) {
        return;
      }

      resultMap.set(normalizedNodeId, {
        nodeId: normalizedNodeId,
        component: componentMatch[0],
      });
    });

  return Array.from(resultMap.values());
};

const SmartDetection = forwardRef<SmartDetectionHandle, SmartDetectionProps>(
  ({ dslData, rootAnnotation, selectedDocumentId }, ref) => {
    const { message } = App.useApp();
    const [isDetecting, setIsDetecting] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const confettiInstanceRef = useRef<ConfettiInstance | null>(null);
    const timeoutsRef = useRef<number[]>([]);
    const [showLoading, setShowLoading] = useState(false);
    const [loadingExploding, setLoadingExploding] = useState(false);
    const [showFireworks, setShowFireworks] = useState(false);

    const cleanupAll = () => {
      timeoutsRef.current.forEach((timeoutId) => {
        clearTimeout(timeoutId);
      });
      timeoutsRef.current = [];
      if (confettiInstanceRef.current?.reset) {
        confettiInstanceRef.current.reset();
      }
      confettiInstanceRef.current = null;
    };

    const scheduleTimeout = useCallback((callback: () => void, delay: number) => {
      const timeoutId = window.setTimeout(() => {
        callback();
      }, delay);
      timeoutsRef.current.push(timeoutId);
    }, []);

    const startConfettiSequence = useCallback(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      cleanupAll();

      const instance = confetti.create(canvas, { resize: true, useWorker: true });
      confettiInstanceRef.current = instance;

      const baseOptions: ConfettiOptions = {
        gravity: 1,
        decay: 0.92,
        spread: 80,
        colors: COLOR_PALETTE,
        scalar: 1.4,
      };

      const shoot = (options: ConfettiOptions) => {
        instance({ ...baseOptions, ...options });
      };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const bursts: Array<{ delay: number; options: ConfettiOptions }> = [
        {
          delay: 0,
          options: {
            particleCount: 180,
            spread: 140,
            scalar: 1.6,
            origin: { x: 0.5, y: 0.55 },
            startVelocity: 58,
          },
        },
        {
          delay: 450,
          options: {
            particleCount: 120,
            spread: 70,
            angle: 60,
            origin: { x: 0.2, y: 0.75 },
            scalar: 1.5,
            startVelocity: 50,
          },
        },
        {
          delay: 900,
          options: {
            particleCount: 120,
            spread: 70,
            angle: 120,
            origin: { x: 0.8, y: 0.75 },
            scalar: 1.5,
            startVelocity: 50,
          },
        },
      ];

      bursts.forEach(({ delay, options }) => {
        scheduleTimeout(() => shoot(options), delay);
      });

      for (let i = 0; i < 4; i++) {
        scheduleTimeout(() => {
          shoot({
            particleCount: 50,
            spread: 90,
            startVelocity: 35,
            scalar: randomInRange(1.1, 1.4),
            origin: { x: randomInRange(0.2, 0.8), y: randomInRange(0.2, 0.55) },
          });
        }, 500 + i * 250);
      }

      const finaleDelay = 2000;
      scheduleTimeout(() => {
        shoot({
          particleCount: 240,
          spread: 160,
          origin: { x: 0.5, y: 0.45 },
          scalar: 1.7,
          startVelocity: 60,
        });
      }, finaleDelay);

      scheduleTimeout(() => {
        setShowFireworks(false);
        cleanupAll();
      }, finaleDelay + 1800);
    }, [cleanupAll, scheduleTimeout]);

    // 初始化画布
    useEffect(() => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const resizeCanvas = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };

      resizeCanvas();
      window.addEventListener('resize', resizeCanvas);

      return () => {
        window.removeEventListener('resize', resizeCanvas);
      };
    }, []);

    // 处理检测状态变化
    useEffect(() => {
      if (isDetecting) {
        setShowLoading(true);
        setLoadingExploding(false);
        setShowFireworks(false);
        cleanupAll();
      } else if (showLoading) {
        setLoadingExploding(true);

        const explosionTimeout = window.setTimeout(() => {
          setShowLoading(false);
          setShowFireworks(true);

          requestAnimationFrame(() => {
            const canvas = canvasRef.current;
            if (canvas) {
              startConfettiSequence();
            } else {
              requestAnimationFrame(() => {
                const retryCanvas = canvasRef.current;
                if (retryCanvas) {
                  startConfettiSequence();
                } else {
                  setShowFireworks(false);
                  cleanupAll();
                }
              });
            }
          });
        }, 600);

        timeoutsRef.current.push(explosionTimeout);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isDetecting]);

    const runDetection = useCallback(async () => {
      if (isDetecting) {
        message.info('智能识别进行中，请稍候');
        return;
      }

      if (!selectedDocumentId) {
        message.error('请先选择需要识别的设计稿');
        return;
      }

      if (!dslData || !rootAnnotation) {
        message.error('当前文档的 DSL 或标注数据尚未加载完成');
        return;
      }

      setIsDetecting(true);

      try {
        const detectionEvents = await smartDetection(dslData);
        const parsedEntries = parseSmartDetectionEvents(detectionEvents);

        if (!parsedEntries.length) {
          message.warning('未能从智能识别中解析出有效的标注结果');
          return;
        }

        let createdCount = 0;
        let skippedCount = 0;
        let missingCount = 0;

        for (const entry of parsedEntries) {
          const dslNode = findDSLNodeById(entry.nodeId);
          if (!dslNode) {
            missingCount += 1;
            continue;
          }

          const created = await designDetectionActions.createAnnotation(dslNode, entry.component);
          if (created) {
            createdCount += 1;
          } else {
            skippedCount += 1;
          }
        }

        const summaryParts: string[] = [];
        summaryParts.push(`新增 ${createdCount} 条标注`);
        if (skippedCount) {
          summaryParts.push(`${skippedCount} 条已存在或创建被中断`);
        }
        if (missingCount) {
          summaryParts.push(`${missingCount} 条未找到对应节点`);
        }

        const summaryMessage = `智能识别完成，${summaryParts.join('，')}`;
        if (createdCount > 0) {
          message.success(summaryMessage);
        } else {
          message.warning(summaryMessage);
        }
      } catch (error: any) {
        console.error('智能识别失败:', error);
        message.error(error?.message || '智能识别失败');
      } finally {
        setIsDetecting(false);
      }
    }, [dslData, isDetecting, rootAnnotation, selectedDocumentId]);

    useImperativeHandle(ref, () => ({
      runDetection,
      isDetecting,
    }));

    if (!showLoading && !showFireworks) return null;

    return (
      <div className='smart-detection-animation'>
        {showLoading && (
          <div className={`loading-overlay ${loadingExploding ? 'exploding' : ''}`}>
            <div className={`loading-content ${loadingExploding ? 'exploding' : ''}`}>
              {!loadingExploding && (
                <div className='loading-spinner'>
                  <div className='spinner-ring'></div>
                  <div className='spinner-ring'></div>
                  <div className='spinner-ring'></div>
                </div>
              )}
              <div className='loading-text'>{loadingExploding ? '识别完成！' : '智能识别中...'}</div>
            </div>
          </div>
        )}

        {showFireworks && <canvas ref={canvasRef} className='fireworks-canvas' />}
      </div>
    );
  }
);

export default SmartDetection;
