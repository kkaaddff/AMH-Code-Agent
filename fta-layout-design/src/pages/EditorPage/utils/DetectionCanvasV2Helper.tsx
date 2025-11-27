import type { DSLNode, DesignData, AnnotationNode } from '@/types/dsl';
import { useState, useEffect, useCallback } from 'react';
import { GRID_CONFIG, COLORS } from '../constants/CanvasConstant';

/**
 * 带绝对坐标的扁平化 DSL 节点类型。
 * 用于扁平化遍历 DSL 树后的节点列表，包含预计算的绝对坐标。
 */
export type FlattenedDSLNode = DSLNode & {
  absoluteX: number;
  absoluteY: number;
};

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
 * 根据坐标命中查找面积最小的 DSL 节点。
 * @param x 相对于根节点的 X 坐标。
 * @param y 相对于根节点的 Y 坐标。
 * @param flatList 扁平化后的 DSL 节点列表（包含绝对坐标）。
 * @returns 命中的面积最小 DSL 节点，未命中时返回 null。
 */
export const findDSLNodeAtPosition = (x: number, y: number, flatList: FlattenedDSLNode[]): FlattenedDSLNode | null => {
  // 过滤出包含 (x, y) 的所有节点，排除 hidden 节点
  const hits = flatList.filter((node) => {
    if (node.hidden) return false;
    const width = node.layoutStyle?.width || 0;
    const height = node.layoutStyle?.height || 0;
    const right = node.absoluteX + width;
    const bottom = node.absoluteY + height;
    return x >= node.absoluteX && x <= right && y >= node.absoluteY && y <= bottom;
  });

  if (hits.length === 0) return null;

  // 按面积升序排序，返回面积最小的节点
  hits.sort((a, b) => {
    const areaA = (a.layoutStyle?.width || 0) * (a.layoutStyle?.height || 0);
    const areaB = (b.layoutStyle?.width || 0) * (b.layoutStyle?.height || 0);
    return areaA - areaB;
  });

  return hits[0];
};

/**
 * 根据坐标命中查找面积最小的 Annotation 节点。
 * @param x 相对于根节点的 X 坐标。
 * @param y 相对于根节点的 Y 坐标。
 * @param flatList 扁平化后的 Annotation 节点列表。
 * @returns 命中的面积最小 Annotation 节点，未命中时返回 null。
 */
export const findAnnotationNodeAtPosition = (
  x: number,
  y: number,
  flatList: AnnotationNode[]
): AnnotationNode | null => {
  // 过滤出包含 (x, y) 的所有节点
  const hits = flatList.filter((node) => {
    const right = node.absoluteX + node.width;
    const bottom = node.absoluteY + node.height;
    return x >= node.absoluteX && x <= right && y >= node.absoluteY && y <= bottom;
  });

  if (hits.length === 0) return null;

  // 按面积升序排序，返回面积最小的节点
  hits.sort((a, b) => {
    const areaA = a.width * a.height;
    const areaB = b.width * b.height;
    return areaA - areaB;
  });

  return hits[0];
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

//#region ==================== 工具函数 ====================

// 排序 AnnotationNode 的 children，按照坐标顺序：从上到下，从左到右
export const sortAnnotationChildren = (node: AnnotationNode): AnnotationNode => {
  const sortedChildren = [...node.children].sort((a, b) => {
    const yDiff = a.absoluteY - b.absoluteY;
    if (Math.abs(yDiff) > 1) {
      return yDiff;
    }
    return a.absoluteX - b.absoluteX;
  });

  return {
    ...node,
    children: sortedChildren.map(sortAnnotationChildren),
  };
};

// 扁平化 Annotation 树
export const flattenAnnotationTree = (root: AnnotationNode): AnnotationNode[] => {
  const result: AnnotationNode[] = [];
  const traverse = (node: AnnotationNode) => {
    result.push(node);
    node.children.forEach(traverse);
  };
  traverse(root);
  return result;
};

// 查找标注节点
export const findAnnotationById = (id: string, rootAnnotation: AnnotationNode | null): AnnotationNode | null => {
  const search = (node: AnnotationNode): AnnotationNode | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = search(child);
      if (found) return found;
    }
    return null;
  };

  if (rootAnnotation) {
    return search(rootAnnotation);
  }
  return null;
};

// 通过DSL节点ID查找标注
export const findAnnotationByDSLNodeId = (
  dslNodeId: string,
  rootAnnotation: AnnotationNode | null
): AnnotationNode | null => {
  const search = (node: AnnotationNode): AnnotationNode | null => {
    if (node.id === dslNodeId) return node;
    for (const child of node.children) {
      const found = search(child);
      if (found) return found;
    }
    return null;
  };

  if (rootAnnotation) {
    return search(rootAnnotation);
  }
  return null;
};

// 统一的DSL节点查找函数
export const findDSLNodeById = (id: string, dslRootNode: DSLNode | null): DSLNode | null => {
  if (!dslRootNode) return null;

  const search = (node: DSLNode | null): DSLNode | null => {
    if (!node) return null;
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  };

  return search(dslRootNode);
};

/** 扁平化 DSLNode 树，同时计算每个节点的绝对坐标 */
export const flattenDSLNodeTree = (root: DSLNode | null, hidden = false): FlattenedDSLNode[] => {
  if (!root) return [];
  const result: FlattenedDSLNode[] = [];
  const traverse = (node: DSLNode, parentX = 0, parentY = 0) => {
    if (hidden && (node.hidden || node.mask === 'outline')) return;
    const absoluteX = parentX + (node.layoutStyle?.relativeX || 0);
    const absoluteY = parentY + (node.layoutStyle?.relativeY || 0);
    result.push({ ...node, absoluteX, absoluteY });
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => traverse(child, absoluteX, absoluteY));
    }
  };
  traverse(root);
  return result;
};

// 计算DSL节点的绝对坐标
export const calculateDSLNodeAbsolutePosition = (
  targetNode: DSLNode,
  flatDSLNodeList: FlattenedDSLNode[]
): { x: number; y: number; width: number; height: number } => {
  if (flatDSLNodeList.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  const node = flatDSLNodeList.find((node) => node.id === targetNode.id);
  if (!node) return { x: 0, y: 0, width: 0, height: 0 };

  return {
    x: node.absoluteX,
    y: node.absoluteY,
    width: node.layoutStyle?.width || 0,
    height: node.layoutStyle?.height || 0,
  };
};

/** 基于矩形包含关系，查找目标节点的最近父级容器 */
export const findNearestParentContainer = (
  targetNode: AnnotationNode,
  flatAnnotationList: AnnotationNode[]
): AnnotationNode | null => {
  const targetX = targetNode.absoluteX;
  const targetY = targetNode.absoluteY;
  const targetWidth = targetNode.width;
  const targetHeight = targetNode.height;

  let bestParent: AnnotationNode | null = null;
  let smallestArea = Infinity;

  for (const node of flatAnnotationList) {
    // 排除目标节点自身
    if (node.id === targetNode.id) continue;
    // TODO！！！ 只考虑容器节点
    // if (!node.isContainer) continue;

    // 判断 node 是否完全包含 targetNode
    const isContaining =
      targetX >= node.absoluteX &&
      targetY >= node.absoluteY &&
      targetX + targetWidth <= node.absoluteX + node.width &&
      targetY + targetHeight <= node.absoluteY + node.height;

    if (isContaining) {
      const area = node.width * node.height;
      if (area < smallestArea) {
        smallestArea = area;
        bestParent = node;
      }
    }
  }

  return bestParent;
};

// 边界计算辅助函数
export const calculateContainerBounds = (
  children: AnnotationNode[]
): { minX: number; minY: number; maxX: number; maxY: number } => {
  if (children.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const bounds = children.map((child) => ({
    x1: child.absoluteX,
    y1: child.absoluteY,
    x2: child.absoluteX + child.width,
    y2: child.absoluteY + child.height,
  }));

  return {
    minX: Math.min(...bounds.map((b) => b.x1)),
    minY: Math.min(...bounds.map((b) => b.y1)),
    maxX: Math.max(...bounds.map((b) => b.x2)),
    maxY: Math.max(...bounds.map((b) => b.y2)),
  };
};

// 查找父节点
export const findParentAnnotation = (childId: string, rootAnnotation: AnnotationNode | null): AnnotationNode | null => {
  if (!rootAnnotation) return null;

  const search = (node: AnnotationNode): AnnotationNode | null => {
    for (const child of node.children) {
      if (child.id === childId) {
        return node;
      }
      const found = search(child);
      if (found) return found;
    }
    return null;
  };

  return search(rootAnnotation);
};

/** 从 selectedAnnotations 或 selectedDSLNodes 中找到那个能够包含所有其他选中节点的节点 */
export const findContainingDSLNode = (
  selectedAnnotations: AnnotationNode[],
  selectedDSLNodes: DSLNode[],
  flatDSLNodeList: FlattenedDSLNode[]
): DSLNode | null => {
  // 构建所有候选节点的边界信息
  type CandidateNode = {
    type: 'annotation' | 'dslNode';
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
  };

  const candidates: CandidateNode[] = [
    ...selectedAnnotations.map((a) => ({
      type: 'annotation' as const,
      id: a.id,
      x: a.absoluteX,
      y: a.absoluteY,
      width: a.width,
      height: a.height,
    })),
    ...selectedDSLNodes.map((node) => {
      const pos = calculateDSLNodeAbsolutePosition(node, flatDSLNodeList);
      return {
        type: 'dslNode' as const,
        id: node.id,
        x: pos.x,
        y: pos.y,
        width: node.layoutStyle?.width || 0,
        height: node.layoutStyle?.height || 0,
      };
    }),
  ];

  if (candidates.length === 0) return null;

  // 遍历每个候选节点，检查它是否能包含所有其他节点
  for (const candidate of candidates) {
    const candidateRight = candidate.x + candidate.width;
    const candidateBottom = candidate.y + candidate.height;

    const containsAll = candidates.every((other) => {
      if (other.id === candidate.id) return true; // 跳过自身
      const otherRight = other.x + other.width;
      const otherBottom = other.y + other.height;
      return (
        other.x >= candidate.x &&
        other.y >= candidate.y &&
        otherRight <= candidateRight &&
        otherBottom <= candidateBottom
      );
    });

    if (containsAll) {
      return null;
    }
  }

  return null;
};

/** 提取统一的绝对边界信息，兼容标注节点与扁平化 DSL 节点 */
export const getNodeAbsoluteBounds = (node: AnnotationNode | FlattenedDSLNode | null) => {
  if (!node) return null;
  const width = 'width' in node ? node.width : node.layoutStyle?.width || 0;
  const height = 'height' in node ? node.height : node.layoutStyle?.height || 0;

  return {
    id: node.id,
    x: node.absoluteX || 0,
    y: node.absoluteY || 0,
    right: (node.absoluteX || 0) + width,
    bottom: (node.absoluteY || 0) + height,
  };
};

/**
 * 判断一个节点是否包含其他一个或多个节点（支持标注与 DSL 混合）
 *
 * @remarks
 * - 采用矩形包含逻辑，需容器完全覆盖子节点范围
 * - 同一节点不会被视为包含关系（ID 相同直接返回 false）
 */
export const isAnnotationContaining = (
  containerAnnotation: AnnotationNode | FlattenedDSLNode,
  ...innerAnnotations: Array<AnnotationNode | FlattenedDSLNode>
): boolean => {
  if (innerAnnotations.length === 0) return false;

  const containerBounds = getNodeAbsoluteBounds(containerAnnotation);
  if (!containerBounds) return false;

  return innerAnnotations.every((inner) => {
    const innerBounds = getNodeAbsoluteBounds(inner);
    if (!innerBounds || containerBounds.id === innerBounds.id) return false;

    return (
      containerBounds.x <= innerBounds.x &&
      containerBounds.y <= innerBounds.y &&
      containerBounds.right >= innerBounds.right &&
      containerBounds.bottom >= innerBounds.bottom
    );
  });
};
