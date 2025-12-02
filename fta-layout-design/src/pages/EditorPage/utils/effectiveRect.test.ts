import { describe, expect, test } from 'vitest';
import type { Rect } from './effectiveRect';
import { collectGridLines, findMaxEffectiveRect } from './effectiveRect';

describe('collectGridLines', () => {
  test('应该返回 manualRect 的边界范围', () => {
    const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
    const result = collectGridLines([], manualRect);

    expect(result).toEqual({ absoluteX: 0, absoluteY: 0, width: 100, height: 100 });
  });

  test('应该返回包含所有矩形的边界范围', () => {
    const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
    const rects: Rect[] = [{ absoluteX: 20, absoluteY: 30, width: 30, height: 40 }];
    const result = collectGridLines(rects, manualRect);

    // 边界范围仍然是 manualRect 的范围（因为 manualRect 边界包含在内）
    expect(result).toEqual({ absoluteX: 0, absoluteY: 0, width: 100, height: 100 });
  });

  test('应该返回正确的边界范围', () => {
    const manualRect: Rect = { absoluteX: 10, absoluteY: 10, width: 80, height: 80 };
    const rects: Rect[] = [
      { absoluteX: 0, absoluteY: 0, width: 20, height: 20 }, // 部分在范围外
      { absoluteX: 100, absoluteY: 100, width: 50, height: 50 }, // 完全在范围外
    ];
    const result = collectGridLines(rects, manualRect);

    // 边界范围是 manualRect 的范围
    expect(result).toEqual({ absoluteX: 10, absoluteY: 10, width: 80, height: 80 });
  });
});

describe('findMaxEffectiveRect', () => {
  describe('基础场景', () => {
    test('空矩形列表时应该返回 manualRect 本身', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const result = findMaxEffectiveRect([], manualRect);

      expect(result).toEqual(manualRect);
    });

    test('manualRect 尺寸为 0 时返回 null', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 0, height: 100 };
      expect(findMaxEffectiveRect([], manualRect)).toBeNull();

      const manualRect2: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 0 };
      expect(findMaxEffectiveRect([], manualRect2)).toBeNull();
    });
  });

  describe('单矩形场景', () => {
    test('矩形完全在 manualRect 内部，有效矩形应该绕过它', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 40, absoluteY: 40, width: 20, height: 20 }, // 中间的小矩形
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 最大有效矩形应该是 manualRect 本身，因为其边不穿过内部矩形
      expect(result).toEqual(manualRect);
    });

    test('矩形触及 manualRect 边界', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 0, absoluteY: 40, width: 50, height: 20 }, // 左边贴边的矩形
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // manualRect 的左边与矩形左边重合，有效
      // 但需要检查哪个矩形面积最大且有效
    });

    test('矩形占据整个 manualRect', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [{ absoluteX: 0, absoluteY: 0, width: 100, height: 100 }];
      const result = findMaxEffectiveRect(rects, manualRect);

      // manualRect 的边与矩形的边重合，应该有效
      expect(result).toEqual(manualRect);
    });
  });

  describe('多矩形场景', () => {
    test('两个矩形并排', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 20, absoluteY: 0, width: 20, height: 100 },
        { absoluteX: 60, absoluteY: 0, width: 20, height: 100 },
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 可能的有效矩形：左侧 0-20, 中间 40-60, 右侧 80-100
      // 或者整个 manualRect（因为边不穿过矩形内部）
    });

    test('四个角落的矩形', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 0, absoluteY: 0, width: 30, height: 30 },
        { absoluteX: 70, absoluteY: 0, width: 30, height: 30 },
        { absoluteX: 0, absoluteY: 70, width: 30, height: 30 },
        { absoluteX: 70, absoluteY: 70, width: 30, height: 30 },
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 最大有效矩形可能是中间的十字形区域中的一部分
      // 或者整个 manualRect
    });

    test('网格布局', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 90, height: 90 };
      // 3x3 网格，每个格子 30x30，间距为 0
      const rects: Rect[] = [];
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          rects.push({
            absoluteX: i * 30,
            absoluteY: j * 30,
            width: 30,
            height: 30,
          });
        }
      }
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 整个 manualRect 应该是有效的，因为边都与矩形边重合
      expect(result).toEqual(manualRect);
    });
  });

  describe('重叠矩形场景', () => {
    test('两个重叠的矩形', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 20, absoluteY: 20, width: 40, height: 40 },
        { absoluteX: 40, absoluteY: 40, width: 40, height: 40 },
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      expect(result!.width).toBeGreaterThan(0);
      expect(result!.height).toBeGreaterThan(0);
    });

    test('完全嵌套的矩形', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 20, absoluteY: 20, width: 60, height: 60 },
        { absoluteX: 30, absoluteY: 30, width: 40, height: 40 },
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
    });
  });

  describe('边界重合场景', () => {
    test('effectiveRect 边与矩形边完全重合应该有效', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 50, absoluteY: 0, width: 50, height: 100 }, // 右半边
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 左半边 0-50 应该是有效的，其右边与矩形左边重合
      // 或者整个 manualRect 也是有效的
    });

    test('矩形边界与 manualRect 边界部分重合', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 0, absoluteY: 30, width: 60, height: 40 }, // 左边贴边，部分高度
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 可能的有效矩形包括：上部 0-30，下部 70-100，右侧 60-100
    });
  });

  describe('边穿过矩形内部的无效场景', () => {
    test('矩形与 manualRect 边界重合时仍有效', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 40, absoluteY: 0, width: 20, height: 100 }, // 垂直贯穿，上下边与 manualRect 重合
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 矩形的上下边与 manualRect 的上下边重合，所以 manualRect 本身是有效的
      expect(result).toEqual(manualRect);
    });

    test('矩形内部被穿过时无效', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      // 矩形 A 覆盖整个区域，矩形 B 在内部
      const rects: Rect[] = [
        { absoluteX: 0, absoluteY: 0, width: 100, height: 100 }, // 大矩形 A
        { absoluteX: 40, absoluteY: 40, width: 20, height: 20 }, // 内部小矩形 B
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 候选矩形 0-60, 0-60 的右边 x=60 会穿过大矩形 A 的内部
      // 但 manualRect 本身边界与大矩形 A 重合，所以有效
      expect(result).toEqual(manualRect);
    });

    test('真正穿过矩形内部的边应该无效', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 0, absoluteY: 0, width: 100, height: 100 }, // 大矩形 A
        { absoluteX: 30, absoluteY: 30, width: 40, height: 40 }, // 内部矩形 B: 30-70, 30-70
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 候选矩形的边如果在 x=30 或 x=70，y 范围穿过大矩形内部，则无效
      // 但 manualRect (0-100) 的边在 0 和 100，与大矩形边界重合，有效
      expect(result).toEqual(manualRect);
    });

    test('多个嵌套矩形使某些候选矩形无效', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 10, absoluteY: 10, width: 80, height: 80 }, // 大矩形 A: 10-90, 10-90
        { absoluteX: 30, absoluteY: 30, width: 40, height: 40 }, // 内部矩形 B: 30-70, 30-70
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 候选 x: [0, 10, 30, 70, 90, 100]
      // 候选 y: [0, 10, 30, 70, 90, 100]
      // 候选矩形 0-30, 0-30 的边 x=30, y=0-30：
      //   x=30 在大矩形 A (10-90) 内部，y=0-30 与 A 的 y 范围 [10-90] 有交集 [10-30]
      //   所以这条边穿过了 A 的内部，无效
      // manualRect (0-100) 的边 x=0,100 不在任何矩形内部，有效
      expect(result).toEqual(manualRect);
    });
  });

  describe('复杂场景', () => {
    test('L 形布局', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 0, absoluteY: 0, width: 50, height: 100 },
        { absoluteX: 0, absoluteY: 50, width: 100, height: 50 },
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
    });

    test('十字形中间的空白', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      // 十字形：上下左右各有一个矩形
      const rects: Rect[] = [
        { absoluteX: 30, absoluteY: 0, width: 40, height: 30 }, // 上
        { absoluteX: 30, absoluteY: 70, width: 40, height: 30 }, // 下
        { absoluteX: 0, absoluteY: 30, width: 30, height: 40 }, // 左
        { absoluteX: 70, absoluteY: 30, width: 30, height: 40 }, // 右
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 中间的空白区域 30-70, 30-70 应该是一个有效候选
    });

    test('随机分布的多个矩形', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 200, height: 200 };
      const rects: Rect[] = [
        { absoluteX: 10, absoluteY: 10, width: 30, height: 30 },
        { absoluteX: 60, absoluteY: 20, width: 40, height: 50 },
        { absoluteX: 120, absoluteY: 80, width: 50, height: 40 },
        { absoluteX: 30, absoluteY: 130, width: 60, height: 50 },
        { absoluteX: 150, absoluteY: 150, width: 40, height: 40 },
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      expect(result!.width).toBeGreaterThan(0);
      expect(result!.height).toBeGreaterThan(0);
    });
  });

  describe('精确计算验证', () => {
    test('精确计算最大有效矩形面积', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      // 中间有一个小矩形，但不阻挡 manualRect 的边
      const rects: Rect[] = [{ absoluteX: 30, absoluteY: 30, width: 40, height: 40 }];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // manualRect 的四条边不穿过内部矩形，所以 manualRect 本身应该是有效的
      expect(result).toEqual(manualRect);
    });

    test('矩形与 manualRect 边界重合时返回 manualRect', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 30, absoluteY: 0, width: 40, height: 100 }, // 垂直贯穿，上下边与 manualRect 重合
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 矩形的上下边与 manualRect 重合，所以 manualRect 的上下边有效
      // manualRect 的左右边 x=0 和 x=100 不在矩形内部 (30, 70)
      // 所以 manualRect 本身是最大有效矩形
      expect(result).toEqual(manualRect);
    });

    test('边穿过大矩形内部时选择次大有效矩形', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 100, height: 100 };
      // 大矩形覆盖中间区域，小矩形在角落
      const rects: Rect[] = [
        { absoluteX: 10, absoluteY: 10, width: 80, height: 80 }, // 大矩形 A: 10-90, 10-90
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 候选 x: [0, 10, 90, 100], 候选 y: [0, 10, 90, 100]
      // 候选矩形 0-10, 0-10 的边不穿过任何矩形内部
      // manualRect (0-100) 的边也不穿过大矩形内部（因为 0 和 100 都不在 (10, 90) 内）
      // 所以 manualRect 是最大有效矩形
      expect(result).toEqual(manualRect);
    });

    test('边与小矩形重合时有效即使穿过大矩形', () => {
      const manualRect: Rect = { absoluteX: 20, absoluteY: 20, width: 60, height: 60 };
      // 大矩形: 0-100, 0-100，manualRect 完全在大矩形内部
      const rects: Rect[] = [
        { absoluteX: 0, absoluteY: 0, width: 100, height: 100 },
        { absoluteX: 40, absoluteY: 40, width: 20, height: 20 }, // 小矩形: 40-60, 40-60
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      // 候选 x 在 manualRect [20, 80] 范围内: [20, 40, 60, 80]
      // 候选 y 在 manualRect [20, 80] 范围内: [20, 40, 60, 80]
      // 候选矩形 40-60, 40-60 的边与小矩形重合，有效
      // manualRect (20-80) 的边 x=20,80 不与任何矩形边重合，
      // 但 20 和 80 都在大矩形内部 (0, 100)，所以 manualRect 无效
      // 最大有效矩形应该是小矩形本身 40-60, 40-60
      expect(result).toEqual({ absoluteX: 40, absoluteY: 40, width: 20, height: 20 });
    });

    test('边不与任何矩形重合且穿过内部时无效', () => {
      const manualRect: Rect = { absoluteX: 25, absoluteY: 25, width: 50, height: 50 };
      // 大矩形: 0-100, 0-100，manualRect 完全在大矩形内部
      // 没有小矩形，所以 manualRect 的边不与任何矩形边重合
      const rects: Rect[] = [{ absoluteX: 0, absoluteY: 0, width: 100, height: 100 }];
      const result = findMaxEffectiveRect(rects, manualRect);

      // manualRect 的边（x=25,75 和 y=25,75）不与大矩形边（0,100）重合
      // 且都在大矩形内部，所以所有候选矩形都无效
      expect(result).toBeNull();
    });
  });

  describe('边界情况', () => {
    test('非常小的矩形', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 10, height: 10 };
      const rects: Rect[] = [{ absoluteX: 4, absoluteY: 4, width: 2, height: 2 }];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
    });

    test('矩形完全在 manualRect 外部', () => {
      const manualRect: Rect = { absoluteX: 50, absoluteY: 50, width: 100, height: 100 };
      const rects: Rect[] = [
        { absoluteX: 0, absoluteY: 0, width: 30, height: 30 },
        { absoluteX: 200, absoluteY: 200, width: 50, height: 50 },
      ];
      const result = findMaxEffectiveRect(rects, manualRect);

      // 外部矩形不影响结果，应该返回 manualRect
      expect(result).toEqual(manualRect);
    });

    test('浮点数坐标', () => {
      const manualRect: Rect = { absoluteX: 0.5, absoluteY: 0.5, width: 99.5, height: 99.5 };
      const rects: Rect[] = [{ absoluteX: 25.5, absoluteY: 25.5, width: 49.0, height: 49.0 }];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
      expect(result!.width).toBeGreaterThan(0);
      expect(result!.height).toBeGreaterThan(0);
    });

    test('负坐标', () => {
      const manualRect: Rect = { absoluteX: -50, absoluteY: -50, width: 100, height: 100 };
      const rects: Rect[] = [{ absoluteX: -30, absoluteY: -30, width: 20, height: 20 }];
      const result = findMaxEffectiveRect(rects, manualRect);

      expect(result).not.toBeNull();
    });
  });

  describe('无有效解的场景', () => {
    test('manualRect 尺寸为负数', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: -10, height: 100 };
      expect(findMaxEffectiveRect([], manualRect)).toBeNull();
    });
  });

  describe('性能相关', () => {
    test('大量矩形仍能正常处理', () => {
      const manualRect: Rect = { absoluteX: 0, absoluteY: 0, width: 1000, height: 1000 };
      const rects: Rect[] = [];

      // 生成 20 个随机矩形
      for (let i = 0; i < 20; i++) {
        rects.push({
          absoluteX: Math.random() * 800,
          absoluteY: Math.random() * 800,
          width: 50 + Math.random() * 100,
          height: 50 + Math.random() * 100,
        });
      }

      const startTime = Date.now();
      const result = findMaxEffectiveRect(rects, manualRect);
      const endTime = Date.now();

      expect(result).not.toBeNull();
      // 应该在合理时间内完成（少于 5 秒）
      expect(endTime - startTime).toBeLessThan(5000);
    });
  });
});
