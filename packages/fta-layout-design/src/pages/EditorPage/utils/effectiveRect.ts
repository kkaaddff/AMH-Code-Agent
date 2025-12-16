/**
 * 最大有效矩形算法
 * 在给定的手动框选范围内，找到由现有矩形边界线构成的最大有效矩形
 */

export interface Rect {
  width: number;
  height: number;
  absoluteX: number;
  absoluteY: number;
}

/** 边的类型：水平或垂直 */
type EdgeType = 'horizontal' | 'vertical';

/** 边的定义 */
interface Edge {
  type: EdgeType;
  /** 对于水平边是 y 坐标，对于垂直边是 x 坐标 */
  position: number;
  /** 边的起点（对于水平边是 x，对于垂直边是 y） */
  start: number;
  /** 边的终点 */
  end: number;
}

/**
 * 内部函数：从矩形列表中收集所有网格线坐标数组
 */
function collectGridLinesInternal(rects: Rect[], manualRect: Rect): { xLines: number[]; yLines: number[] } {
  const xSet = new Set<number>();
  const ySet = new Set<number>();

  // 添加 manualRect 的边界
  const manualLeft = manualRect.absoluteX;
  const manualRight = manualRect.absoluteX + manualRect.width;
  const manualTop = manualRect.absoluteY;
  const manualBottom = manualRect.absoluteY + manualRect.height;

  xSet.add(manualLeft);
  xSet.add(manualRight);
  ySet.add(manualTop);
  ySet.add(manualBottom);

  // 从所有矩形收集边界坐标
  for (const rect of rects) {
    const left = rect.absoluteX;
    const right = rect.absoluteX + rect.width;
    const top = rect.absoluteY;
    const bottom = rect.absoluteY + rect.height;

    // 只添加在 manualRect 范围内的坐标
    if (left >= manualLeft && left <= manualRight) xSet.add(left);
    if (right >= manualLeft && right <= manualRight) xSet.add(right);
    if (top >= manualTop && top <= manualBottom) ySet.add(top);
    if (bottom >= manualTop && bottom <= manualBottom) ySet.add(bottom);
  }

  // 转换为排序数组
  const xLines = Array.from(xSet).sort((a, b) => a - b);
  const yLines = Array.from(ySet).sort((a, b) => a - b);

  return { xLines, yLines };
}

/**
 * 从矩形列表中收集网格线并返回其覆盖的边界范围
 * @param rects 矩形列表
 * @param manualRect 手动框选的范围
 * @returns 网格线覆盖的边界矩形
 */
export function collectGridLines(rects: Rect[], manualRect: Rect): Rect {
  const { xLines, yLines } = collectGridLinesInternal(rects, manualRect);

  const minX = Math.min(...xLines);
  const maxX = Math.max(...xLines);
  const minY = Math.min(...yLines);
  const maxY = Math.max(...yLines);

  return {
    absoluteX: minX,
    absoluteY: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * 检查一条边是否与某个矩形的边重合
 * 重合意味着边的位置坐标与矩形的边界坐标相同
 */
function doesEdgeCoincideWithRect(edge: Edge, rect: Rect): boolean {
  const rectLeft = rect.absoluteX;
  const rectRight = rect.absoluteX + rect.width;
  const rectTop = rect.absoluteY;
  const rectBottom = rect.absoluteY + rect.height;

  if (edge.type === 'vertical') {
    // 垂直边的 x 坐标与矩形的左边或右边重合
    return edge.position === rectLeft || edge.position === rectRight;
  } else {
    // 水平边的 y 坐标与矩形的上边或下边重合
    return edge.position === rectTop || edge.position === rectBottom;
  }
}

/**
 * 检查一条边是否穿过某个矩形的内部
 * 穿过内部 = 无效，与边重合 = 有效
 */
function doesEdgeCrossRectInterior(edge: Edge, rect: Rect): boolean {
  const rectLeft = rect.absoluteX;
  const rectRight = rect.absoluteX + rect.width;
  const rectTop = rect.absoluteY;
  const rectBottom = rect.absoluteY + rect.height;

  if (edge.type === 'vertical') {
    const x = edge.position;
    const yStart = edge.start;
    const yEnd = edge.end;

    // 垂直边：检查 x 是否在矩形内部（不含边界）
    if (x <= rectLeft || x >= rectRight) {
      return false; // x 不在矩形内部
    }

    // x 在矩形内部，检查 y 范围是否与矩形 y 范围有交集
    // 交集存在且不为空则穿过内部
    const overlapStart = Math.max(yStart, rectTop);
    const overlapEnd = Math.min(yEnd, rectBottom);

    return overlapStart < overlapEnd; // 有实际交集
  } else {
    // 水平边
    const y = edge.position;
    const xStart = edge.start;
    const xEnd = edge.end;

    // 水平边：检查 y 是否在矩形内部（不含边界）
    if (y <= rectTop || y >= rectBottom) {
      return false; // y 不在矩形内部
    }

    // y 在矩形内部，检查 x 范围是否与矩形 x 范围有交集
    const overlapStart = Math.max(xStart, rectLeft);
    const overlapEnd = Math.min(xEnd, rectRight);

    return overlapStart < overlapEnd; // 有实际交集
  }
}

/**
 * 检查一条边是否有效
 * 有效条件：边与至少一个矩形的边重合，或者不穿过任何矩形的内部
 */
function isEdgeValid(edge: Edge, rects: Rect[]): boolean {
  // 如果边与任何一个矩形的边重合，则有效
  for (const rect of rects) {
    if (doesEdgeCoincideWithRect(edge, rect)) {
      return true;
    }
  }

  // 如果边不与任何矩形边重合，检查是否穿过某个矩形内部
  for (const rect of rects) {
    if (doesEdgeCrossRectInterior(edge, rect)) {
      return false;
    }
  }

  return true;
}

/**
 * 检查候选矩形的所有边是否都有效
 */
function isRectValid(candidate: Rect, rects: Rect[]): boolean {
  const left = candidate.absoluteX;
  const right = candidate.absoluteX + candidate.width;
  const top = candidate.absoluteY;
  const bottom = candidate.absoluteY + candidate.height;

  // 定义四条边
  const edges: Edge[] = [
    { type: 'vertical', position: left, start: top, end: bottom }, // 左边
    { type: 'vertical', position: right, start: top, end: bottom }, // 右边
    { type: 'horizontal', position: top, start: left, end: right }, // 上边
    { type: 'horizontal', position: bottom, start: left, end: right }, // 下边
  ];

  // 检查每条边是否有效
  for (const edge of edges) {
    if (!isEdgeValid(edge, rects)) {
      return false;
    }
  }

  return true;
}

/**
 * 找到最大有效矩形
 *
 * 有效矩形的定义：
 * 1. 包含在 manualRect 范围内（可以等于）
 * 2. 边由 rects 中矩形的边、边的延长线或边的一部分构成
 * 3. 每条边长度大于 0
 * 4. 每条边都不能穿过 rects 中矩形的内部（可以与边重合）
 *
 * @param rects 矩形列表
 * @param manualRect 手动框选的范围
 * @returns 最大有效矩形，如果不存在则返回 null
 */
export function findMaxEffectiveRect(rects: Rect[], manualRect: Rect): Rect | null {
  // 边界检查
  if (manualRect.width <= 0 || manualRect.height <= 0) {
    return null;
  }

  // 收集网格线
  const { xLines, yLines } = collectGridLinesInternal(rects, manualRect);

  // 如果没有足够的线来形成矩形
  if (xLines.length < 2 || yLines.length < 2) {
    return null;
  }

  let maxArea = 0;
  let maxRect: Rect | null = null;

  // 枚举所有可能的矩形（由 4 条网格线围成）
  for (let i = 0; i < xLines.length; i++) {
    for (let j = i + 1; j < xLines.length; j++) {
      for (let k = 0; k < yLines.length; k++) {
        for (let l = k + 1; l < yLines.length; l++) {
          const left = xLines[i];
          const right = xLines[j];
          const top = yLines[k];
          const bottom = yLines[l];

          const width = right - left;
          const height = bottom - top;

          // 跳过无效尺寸
          if (width <= 0 || height <= 0) continue;

          const candidate: Rect = {
            absoluteX: left,
            absoluteY: top,
            width,
            height,
          };

          // 检查是否有效
          if (isRectValid(candidate, rects)) {
            const area = width * height;
            if (area > maxArea) {
              maxArea = area;
              maxRect = candidate;
            }
          }
        }
      }
    }
  }

  return maxRect;
}
