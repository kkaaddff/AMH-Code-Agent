import { DSLData, DSLNode } from '@/types/dsl';
import { App } from 'antd';
import confetti from 'canvas-confetti';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';
import { designDetectionActions, designDetectionStore, findDSLNodeById } from '../../contexts/DesignDetectionContext';
import { editorPageStore } from '../../contexts/EditorPageContext';
import { smartDetection } from '../../services/SmartDetection';
import { CONFETTI_BURSTS, SMART_DETECTION_COMPONENT_REGEX } from './config';
import './styles.css';

type SmartDetectionEntry = {
  nodeId: string;
  component: string;
  name?: string;
};

export type SmartDetectionHandle = {
  runDetection: () => Promise<void>;
  isDetecting: boolean;
};

export type SmartDetectionProps = {
  onDetectingChange?: (isDetecting: boolean) => void;
};

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
      const parts = line.split(';').map((part) => part.trim());

      if (parts.length < 2) {
        return;
      }

      const nodeId = parts[0].replace(/^['"]+|['"]+$/g, '');
      const component = parts[1];
      const businessName = parts[2] || undefined;

      if (!nodeId || !SMART_DETECTION_COMPONENT_REGEX.test(component)) {
        return;
      }

      resultMap.set(nodeId, {
        nodeId,
        component: component.match(SMART_DETECTION_COMPONENT_REGEX)![0],
        name: businessName,
      });
    });

  return Array.from(resultMap.values());
};

const SmartDetection = forwardRef<SmartDetectionHandle, SmartDetectionProps>(
  ({ onDetectingChange }, ref: React.Ref<SmartDetectionHandle>) => {
    const { modal } = App.useApp();

    const { designData, rootAnnotation, dslRootNode } = useSnapshot(designDetectionStore);
    const editorPageStoreSnapshot = useSnapshot(editorPageStore);
    const selectedDocumentId =
      editorPageStoreSnapshot.selectedDocument?.type === 'design'
        ? editorPageStoreSnapshot.selectedDocument.id
        : undefined;

    const { message } = App.useApp();
    const [isDetecting, setIsDetecting] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const confettiInstanceRef = useRef<ReturnType<typeof confetti.create> | null>(null);
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

      CONFETTI_BURSTS.forEach(({ delay, options }) => {
        scheduleTimeout(() => instance(options), delay);
      });
    }, [scheduleTimeout]);

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

      if (!designData?.dsl || !rootAnnotation) {
        message.error('当前文档的 DSL 或标注数据尚未加载完成');
        return;
      }

      setIsDetecting(true);
      onDetectingChange?.(true);

      try {
        const dslData = designData.dsl as DSLData;
        const detectionEvents = await smartDetection(dslData);
        const parsedEntries = parseSmartDetectionEvents(detectionEvents);
        setIsDetecting(false);

        if (!parsedEntries.length) {
          message.warning('未能从智能识别中解析出有效的标注结果');
          return;
        }

        let createdCount = 0;
        let skippedCount = 0;
        let missingCount = 0;

        for (const entry of parsedEntries) {
          const dslNode = findDSLNodeById(entry.nodeId, dslRootNode as DSLNode);
          if (!dslNode) {
            missingCount += 1;
            continue;
          }

          const created = await designDetectionActions.createAnnotation(
            dslNode,
            entry.component,
            entry.name ? { name: entry.name, force: true, modal } : { modal }
          );
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
        designDetectionActions.saveAnnotations(selectedDocumentId!);
      } catch (error: any) {
        console.error('智能识别失败:', error);
        message.error(error?.message || '智能识别失败');
      } finally {
        setIsDetecting(false);
        onDetectingChange?.(false);
      }
    }, [designData, isDetecting, rootAnnotation, selectedDocumentId]);

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

SmartDetection.displayName = 'SmartDetection';

export default SmartDetection;
