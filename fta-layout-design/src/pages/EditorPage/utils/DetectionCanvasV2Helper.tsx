import type { DSLNode, DesignData, AnnotationNode } from '@/types/dsl';
import { useState, useEffect, useCallback } from 'react';
import { GRID_CONFIG, COLORS } from '../constants/CanvasConstant';

/**
 * DetectionCanvasV2 组件的 props 类型。
 * @property dslData DSL 数据结构，包含根节点等信息。
 * @property scale 当前缩放比例，默认为 1。
 * @property onScaleChange 缩放变更回调函数。
 */
export interface DetectionCanvasV2Props {
  designData: DesignData;
  scale?: number;
  onScaleChange?: (scale: number) => void;
  highlightedNodeId?: string | null;
  hoveredNodeId?: string | null;
}

/**
 * 获取容器尺寸 Hook。
 * @param ref 需要监听尺寸变化的 HTMLElement 引用。
 * @returns 当前容器的宽高（width、height）。
 */
export const useContainerSize = <T extends HTMLElement>(ref: { current: T | null }) => {
  const [size, setSize] = useState({ width: 0, height: 0 });

  const updateSize = useCallback(() => {
    const node = ref.current as T | null;
    if (!node) return;
    const nextWidth = node.clientWidth;
    const nextHeight = node.clientHeight;

    setSize((prev) => {
      if (prev.width === nextWidth && prev.height === nextHeight) {
        return prev;
      }
      return { width: nextWidth, height: nextHeight };
    });
  }, [ref]);

  useEffect(() => {
    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(updateSize);
      const node = ref.current;
      if (node) {
        observer.observe(node);
      }
      return () => observer.disconnect();
    }

    window.addEventListener('resize', updateSize);
    return () => {
      window.removeEventListener('resize', updateSize);
    };
  }, [updateSize, ref]);

  return size;
};

function deepSortObject(obj: Record<string, any>): Record<string, any> {
  if (Array.isArray(obj)) {
    return obj.map(deepSortObject);
  } else if (obj && typeof obj === 'object') {
    const sortedKeys = Object.keys(obj).sort();
    const result: any = {};
    for (const key of sortedKeys) {
      result[key] = deepSortObject(obj[key]);
    }
    return result;
  }
  return obj;
}

// 简易哈希实现（可替换为更强hash），这里用 DJB2 算法
function hashString(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) + hash + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * 创建稳定的节点 ID 生成器，通过对 node 取递归有序的 stringify 后再哈希，保证每次生成一致。
 * 根 ID 用于区分不同页面。
 */
export const createStableNodeIdGenerator = (rootNodeId: string, node: DSLNode) => {
  // 对 node 递归 sort key 和 stringify，再 hash
  const sorted = deepSortObject(node);
  const jsonStr = JSON.stringify(sorted);
  const hash = hashString(jsonStr);

  return `${rootNodeId}::${hash}`;
};

/**
 * 计算 DSL 节点的绝对边界。
 * @param node 目标 DSL 节点。
 * @param parentX 父节点在 X 方向的偏移量。
 * @param parentY 父节点在 Y 方向的偏移量。
 * @returns 节点的位置信息（x、y、width、height、right、bottom）。
 */
export const getNodeBounds = (node: DSLNode, parentX = 0, parentY = 0) => {
  const x = parentX + (node.layoutStyle?.relativeX || 0);
  const y = parentY + (node.layoutStyle?.relativeY || 0);
  const width = node.layoutStyle?.width || 0;
  const height = node.layoutStyle?.height || 0;

  return { x, y, width, height, right: x + width, bottom: y + height };
};

/**
 * 根据坐标命中查找最内层 DSL 节点。
 * @param x 相对于根节点的 X 坐标。
 * @param y 相对于根节点的 Y 坐标。
 * @param node 当前遍历的树节点。
 * @param parentX 父节点 X 偏移。
 * @param parentY 父节点 Y 偏移。
 * @returns 命中的 DSL 节点，未命中时返回 null。
 */
export const findDSLNodeAtPosition = (
  x: number,
  y: number,
  node: DSLNode,
  parentX = 0,
  parentY = 0
): DSLNode | null => {
  const bounds = getNodeBounds(node, parentX, parentY);

  if (x < bounds.x || x > bounds.right || y < bounds.y || y > bounds.bottom) {
    return null;
  }
  if (node.hidden) {
    return null;
  }
  if (node.children?.length) {
    for (const child of node.children) {
      const found = findDSLNodeAtPosition(x, y, child, bounds.x, bounds.y);
      if (found) return found;
    }
  }

  return node;
};

/**
 * 根据坐标命中查找最内层 Annotation 节点。
 * @param x 相对于根节点的 X 坐标。
 * @param y 相对于根节点的 Y 坐标。
 * @param node 当前遍历的 Annotation 树节点。
 * @returns 命中的 Annotation 节点，未命中时返回 null。
 */
export const findAnnotationNodeAtPosition = (x: number, y: number, node: AnnotationNode): AnnotationNode | null => {
  const right = node.absoluteX + node.width;
  const bottom = node.absoluteY + node.height;

  if (x < node.absoluteX || x > right || y < node.absoluteY || y > bottom) {
    return null;
  }

  if (node.children?.length) {
    for (const child of node.children) {
      const found = findAnnotationNodeAtPosition(x, y, child);
      if (found) return found;
    }
  }

  return node;
};

/**
 * 计算框选区域的标准化边界。
 * @param box 框选开始点与当前点的坐标集合。
 * @returns 框选的位置信息以及方向标记。
 */
export const getSelectionBounds = (box: { startX: number; startY: number; currentX: number; currentY: number }) => {
  const x = Math.min(box.startX, box.currentX);
  const y = Math.min(box.startY, box.currentY);
  const width = Math.abs(box.currentX - box.startX);
  const height = Math.abs(box.currentY - box.startY);
  const isLeftToRight = box.currentX >= box.startX;

  return { x, y, width, height, right: x + width, bottom: y + height, isLeftToRight };
};

/**
 * 判断元素是否处于框选区域内。
 * @param itemBounds 元素边界（x、y、right、bottom）。
 * @param selectionBounds 框选边界（由 getSelectionBounds 返回）。
 * @returns 是否命中框选。
 */
export const isItemInSelection = (
  itemBounds: { x: number; y: number; right: number; bottom: number },
  selectionBounds: ReturnType<typeof getSelectionBounds>
) => {
  const { x, y, right, bottom } = itemBounds;
  const { x: sx, y: sy, right: sRight, bottom: sBottom, isLeftToRight } = selectionBounds;

  if (isLeftToRight) {
    return x >= sx && right <= sRight && y >= sy && bottom <= sBottom;
  }

  return !(right < sx || x > sRight || bottom < sy || y > sBottom);
};

/**
 * 在 Canvas 上绘制可选圆角的带样式矩形边框。
 * @param ctx Canvas 2D 上下文。
 * @param x 起始 X 坐标。
 * @param y 起始 Y 坐标。
 * @param width 矩形宽度。
 * @param height 矩形高度。
 * @param style 绘制样式（颜色、线宽、虚线样式、阴影、圆角半径）。
 */
export const drawBorder = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  style: { color: string; width: number; dash?: number[]; shadow?: boolean; radius?: number }
) => {
  if (width <= 0 || height <= 0) {
    return;
  }
  ctx.strokeStyle = style.color;
  ctx.lineWidth = style.width;

  if (style.dash) {
    ctx.setLineDash(style.dash);
  }

  if (style.shadow) {
    ctx.shadowBlur = 4;
    ctx.shadowColor = style.color;
  }

  // 支持可选的圆角绘制
  if (style.radius && style.radius > 0) {
    const r = Math.min(style.radius, width / 2, height / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
    ctx.stroke();
  } else {
    ctx.strokeRect(x, y, width, height);
  }

  ctx.setLineDash([]);
  ctx.shadowBlur = 0;
};

/**
 * 将鼠标事件转换为 Canvas 内的坐标。
 * @param event 鼠标事件对象，需提供 clientX/clientY。
 * @param rect Canvas 的 DOMRect。
 * @param scale 当前缩放比例。
 * @param paddingX Canvas 在 X 方向的内边距。
 * @param paddingY Canvas 在 Y 方向的内边距。
 * @returns Canvas 内部坐标（x、y）。
 */
export const getCanvasPoint = (
  event: { clientX: number; clientY: number },
  rect: DOMRect,
  scale: number,
  paddingX: number,
  paddingY: number
) => ({
  x: (event.clientX - rect.left) / scale - paddingX,
  y: (event.clientY - rect.top) / scale - paddingY,
});

/**
 * 创建背景栅格图案。
 * @param ctx Canvas 2D 上下文。
 * @param gridSize 栅格大小。
 * @param backgroundColor 背景颜色。
 * @param lineColor 栅格线颜色。
 * @param lineWidth 栅格线宽度。
 * @returns 图案对象，创建失败时返回 null。
 */
const createGridPattern = (
  ctx: CanvasRenderingContext2D,
  gridSize: number,
  backgroundColor: string,
  lineColor: string,
  lineWidth: number
): CanvasPattern | null => {
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = gridSize;
  patternCanvas.height = gridSize;

  const patternContext = patternCanvas.getContext('2d');
  if (!patternContext) return null;

  patternContext.fillStyle = backgroundColor;
  patternContext.fillRect(0, 0, gridSize, gridSize);

  patternContext.strokeStyle = lineColor;
  patternContext.lineWidth = lineWidth;

  const offset = lineWidth / 2;

  patternContext.beginPath();
  patternContext.moveTo(0, offset);
  patternContext.lineTo(gridSize, offset);
  patternContext.stroke();

  patternContext.beginPath();
  patternContext.moveTo(offset, 0);
  patternContext.lineTo(offset, gridSize);
  patternContext.stroke();

  return ctx.createPattern(patternCanvas, 'repeat');
};

/**
 * 绘制背景栅格。
 * @param ctx Canvas 2D 上下文。
 * @param width 画布宽度。
 * @param height 画布高度。
 * @param hole 可选的洞区域，用于在背景上挖洞。
 */
export const drawGridBackground = (
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  hole?: { x: number; y: number; width: number; height: number }
) => {
  const pattern = createGridPattern(
    ctx,
    GRID_CONFIG.SIZE,
    COLORS.CANVAS_BACKGROUND,
    COLORS.GRID_LINE,
    GRID_CONFIG.LINE_WIDTH
  );

  if (pattern) {
    ctx.fillStyle = pattern;
    ctx.fillRect(0, 0, width, height);
  } else {
    ctx.fillStyle = COLORS.CANVAS_BACKGROUND;
    ctx.fillRect(0, 0, width, height);
  }

  if (hole) {
    ctx.clearRect(hole.x, hole.y, hole.width, hole.height);
  }
};
