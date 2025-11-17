import React, { useEffect, useRef, useCallback, useState } from 'react';
import confetti, { ConfettiInstance, ConfettiOptions } from 'canvas-confetti';
import './styles.css';

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

interface SmartDetectionAnimationProps {
  isDetecting: boolean;
  onComplete: () => void;
}

const SmartDetectionAnimation: React.FC<SmartDetectionAnimationProps> = ({ isDetecting, onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiInstanceRef = useRef<ConfettiInstance | null>(null);
  const timeoutsRef = useRef<number[]>([]);
  const onCompleteRef = useRef(onComplete);
  const [showLoading, setShowLoading] = useState(false);
  const [loadingExploding, setLoadingExploding] = useState(false);
  const [showFireworks, setShowFireworks] = useState(false);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

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
      onCompleteRef.current?.();
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
      // 开始检测
      console.log('Detection started');
      setShowLoading(true);
      setLoadingExploding(false);
      setShowFireworks(false);
      cleanupAll();
    } else if (showLoading) {
      // 检测结束，开始爆炸动画（只在 isDetecting 从 true 变为 false 时执行一次）
      console.log('Detection ended, starting explosion animation');
      setLoadingExploding(true);

      const explosionTimeout = window.setTimeout(() => {
        console.log('Explosion complete, starting fireworks');
        setShowLoading(false);
        setShowFireworks(true);

        // 使用双重 requestAnimationFrame 确保 DOM 完全更新

        requestAnimationFrame(() => {
          const canvas = canvasRef.current;
          if (canvas) {
            console.log('Canvas ready, size:', canvas.width, 'x', canvas.height);
            startConfettiSequence();
          } else {
            console.error('Canvas not found!');
            // 如果还是找不到，再等一帧
            requestAnimationFrame(() => {
              const retryCanvas = canvasRef.current;
              if (retryCanvas) {
                console.log('Canvas ready on retry, size:', retryCanvas.width, 'x', retryCanvas.height);
                startConfettiSequence();
              } else {
                console.error('Canvas still not found after retry!');
                setShowFireworks(false);
                cleanupAll();
                onCompleteRef.current?.();
              }
            });
          }
        });
      }, 600); // Loading 爆炸动画 600ms

      timeoutsRef.current.push(explosionTimeout);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDetecting]); // 只依赖 isDetecting，其他依赖通过 ref 访问

  if (!showLoading && !showFireworks) return null;

  return (
    <div className='smart-detection-animation'>
      {/* 加载状态遮罩 */}
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

      {/* 烟花画布 */}
      {showFireworks && <canvas ref={canvasRef} className='fireworks-canvas' />}
    </div>
  );
};

export default SmartDetectionAnimation;
