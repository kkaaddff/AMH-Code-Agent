/**
 * Tree-based DSL 格式转换器
 *
 * 将 DSL + Annotation 合并后输出为缩进表示的树状结构文本，
 * 适用于生成前端代码 (React/Vue/HTML)。
 *
 * 格式定义：
 * - 有业务名时：BaseName#BusinessName (x, y, w, h)
 * - 无业务名时：BaseName (x, y, w, h)
 * - ExtraVisuals 作为 @v: 属性挂载
 */

import type { DesignData, DSLFlexContainerInfo, DSLNode, DSLTextNode } from '@fta/shared';
import { isNodeVisible } from '@fta/shared';
import { resolveStyle, StyleCategory, resetStyleCache } from '../styleStrategies';
import type { ResolvedPaintStyle } from '../styleStrategies';

// ============= Types =============

interface AnnotationNode {
  id: string;
  ftaComponent: string;
  name?: string;
  comment?: string;
  dataType?: string;
  absoluteX: number;
  absoluteY: number;
  width: number;
  height: number;
  children?: AnnotationNode[];
  props?: Record<string, unknown>;
}

interface VisualNode {
  id: string;
  type: 'TEXT' | 'LAYER' | 'PATH' | 'INSTANCE' | 'FRAME' | 'GROUP';
  width: number;
  height: number;
  absoluteX: number;
  absoluteY: number;
  fillId?: string;
  strokeColorId?: string;
  textColorId?: string;
  text?: string;
  fontId?: string;
  flexInfo?: DSLFlexContainerInfo;
  effectId?: string;
}

interface TreeExtraVisual {
  type: 'Rect' | 'Text' | 'Vector' | 'Image';
  x: number;
  y: number;
  w: number;
  h: number;
  content?: string;
  styles: string[];
}

interface TreeNode {
  baseName: string;
  bizName?: string;
  x: number;
  y: number;
  w: number;
  h: number;
  comment?: string;
  extraVisuals: TreeExtraVisual[];
  children: TreeNode[];
}

// ============= Helpers =============

function normalizeAnnotationNode(raw: any, fallback?: { width: number; height: number }): AnnotationNode {
  const width = Math.round(typeof raw.width === 'number' ? raw.width : fallback?.width ?? 0);
  const height = Math.round(typeof raw.height === 'number' ? raw.height : fallback?.height ?? 0);
  const absoluteX = Math.round(typeof raw.absoluteX === 'number' ? raw.absoluteX : 0);
  const absoluteY = Math.round(typeof raw.absoluteY === 'number' ? raw.absoluteY : 0);
  const children = Array.isArray(raw.children)
    ? raw.children.map((child: any) => normalizeAnnotationNode(child, undefined))
    : [];

  return {
    id: raw.id,
    ftaComponent: raw.ftaComponent || 'View',
    name: raw.name || '',
    comment: raw.comment,
    dataType: raw.dataType,
    absoluteX,
    absoluteY,
    width,
    height,
    children,
    props: raw.props || {},
  };
}

const isWithin = (parent: AnnotationNode, visual: VisualNode): boolean => {
  return (
    visual.absoluteX >= parent.absoluteX &&
    visual.absoluteY >= parent.absoluteY &&
    visual.absoluteX + visual.width <= parent.absoluteX + parent.width &&
    visual.absoluteY + visual.height <= parent.absoluteY + parent.height
  );
};

const toleranceEquals = (a: number, b: number, tolerance = 1.5) => Math.abs(a - b) <= tolerance;

function collectVisualNodes(node: DSLNode, offsetX: number, offsetY: number, visuals: VisualNode[]) {
  if (!isNodeVisible(node)) return;

  const layout = node.layoutStyle || {};
  const absoluteX = Math.round((layout.relativeX || 0) + offsetX);
  const absoluteY = Math.round((layout.relativeY || 0) + offsetY);
  const width = Math.round(layout.width || 0);
  const height = Math.round(layout.height || 0);

  const base: VisualNode = {
    id: node.id,
    type: node.type as VisualNode['type'],
    width,
    height,
    absoluteX,
    absoluteY,
    fillId: 'fill' in node ? (node as any).fill : undefined,
    flexInfo: 'flexContainerInfo' in node ? (node as any).flexContainerInfo : undefined,
    effectId: 'effect' in node ? (node as any).effect : undefined,
  };

  if (node.type === 'TEXT') {
    const textNode = node as DSLTextNode;
    base.text = (textNode.text || []).map((t) => t.text).join('');
    base.textColorId = (textNode.textColor && textNode.textColor[0]?.color) || undefined;
    base.fontId = (textNode.text && textNode.text[0]?.font) || undefined;
    visuals.push(base);
  } else if (node.type === 'LAYER' || node.type === 'PATH') {
    visuals.push(base);
  }

  if ('children' in node && Array.isArray((node as any).children)) {
    (node as any).children.forEach((child: DSLNode) => {
      collectVisualNodes(child, absoluteX, absoluteY, visuals);
    });
  }
}

function resolvePaintStyle(
  styleId: string | undefined,
  styles: DesignData['dsl']['styles']
): ResolvedPaintStyle | null {
  if (!styleId || typeof styleId !== 'string') return null;
  const resolved = resolveStyle(styleId, styles);
  if (resolved?.category === StyleCategory.Paint) {
    return resolved as ResolvedPaintStyle;
  }
  return null;
}

// Font style resolution - reserved for future text styling enhancements
// function resolveFontStyle(styleId: string | undefined, styles: DesignData['dsl']['styles']): ResolvedFontStyle | null {
//   if (!styleId || typeof styleId !== 'string') return null;
//   const resolved = resolveStyle(styleId, styles);
//   if (resolved?.category === StyleCategory.Font) {
//     return resolved as ResolvedFontStyle;
//   }
//   return null;
// }

// ============= Visual to Compact String =============

function formatStylesCompact(styles: Record<string, unknown>): string[] {
  const result: string[] = [];
  if (styles.backgroundColor) {
    result.push(`bg:${styles.backgroundColor}`);
  }
  if (styles.backgroundImage) {
    const img = String(styles.backgroundImage);
    if (img.startsWith('url(')) {
      result.push('img:...');
    } else {
      result.push('grad');
    }
  }
  if (styles.color) {
    result.push(`color:${styles.color}`);
  }
  if (styles.boxShadow) {
    result.push('shadow');
  }
  return result;
}

function toTreeExtraVisual(visual: VisualNode, styles: DesignData['dsl']['styles']): TreeExtraVisual {
  const paint = resolvePaintStyle(visual.fillId, styles);
  const stylePayload: Record<string, unknown> = {};
  if (paint?.color) stylePayload.backgroundColor = paint.color;
  if (paint?.gradient) stylePayload.backgroundImage = paint.gradient;
  if (paint?.imageUrl) stylePayload.backgroundImage = `url(${paint.imageUrl})`;

  // Text color
  if (visual.type === 'TEXT' && visual.textColorId) {
    const textPaint = resolvePaintStyle(visual.textColorId, styles);
    if (textPaint?.color) stylePayload.color = textPaint.color;
  }

  let type: TreeExtraVisual['type'] = 'Vector';
  if (visual.type === 'TEXT') type = 'Text';
  else if (visual.type === 'LAYER') type = 'Rect';
  else if (visual.type === 'PATH') type = 'Vector';

  return {
    type,
    x: Math.round(visual.absoluteX),
    y: Math.round(visual.absoluteY),
    w: Math.round(visual.width),
    h: Math.round(visual.height),
    content: visual.text,
    styles: formatStylesCompact(stylePayload),
  };
}

function formatExtraVisual(ev: TreeExtraVisual): string {
  const parts: string[] = [`${ev.x},${ev.y},${ev.w},${ev.h}`];

  if (ev.content) {
    // 截断过长的文本
    const truncated = ev.content.length > 20 ? ev.content.slice(0, 17) + '...' : ev.content;
    parts.push(`"${truncated}"`);
  }

  if (ev.styles.length > 0) {
    parts.push(ev.styles.join(';'));
  }

  return `${ev.type}(${parts.join('|')})`;
}

// ============= Distribution Logic =============

function pickBackground(visuals: VisualNode[], node: AnnotationNode, styles: DesignData['dsl']['styles']) {
  const bgCandidate = visuals.find((v) => {
    const widthMatch = toleranceEquals(v.width, node.width);
    const heightMatch = toleranceEquals(v.height, node.height);
    const xMatch = toleranceEquals(v.absoluteX, node.absoluteX);
    const yMatch = toleranceEquals(v.absoluteY, node.absoluteY);
    return widthMatch && heightMatch && xMatch && yMatch && v.fillId;
  });

  if (!bgCandidate) return { consumedId: null, bgStyles: [] };

  const paint = resolvePaintStyle(bgCandidate.fillId, styles);
  const stylePayload: Record<string, unknown> = {};
  if (paint?.color) stylePayload.backgroundColor = paint.color;
  if (paint?.gradient) stylePayload.backgroundImage = paint.gradient;
  if (paint?.imageUrl) stylePayload.backgroundImage = `url(${paint.imageUrl})`;

  const effect = bgCandidate.effectId ? resolveStyle(bgCandidate.effectId, styles) : null;
  if (effect && effect.category === StyleCategory.Effect && effect.boxShadow) {
    stylePayload.boxShadow = effect.boxShadow;
  }

  return { consumedId: bgCandidate.id, bgStyles: formatStylesCompact(stylePayload) };
}

function distributeVisualsToTree(
  annotation: AnnotationNode,
  visuals: VisualNode[],
  styles: DesignData['dsl']['styles']
): { node: TreeNode; usedIds: Set<string> } {
  const inside = visuals.filter((v) => isWithin(annotation, v));
  const usedIds = new Set<string>();
  const childAssignments = new Map<string, VisualNode[]>();
  const extras: VisualNode[] = [];

  for (const visual of inside) {
    const candidateChildren = (annotation.children || []).filter((child) => isWithin(child, visual));
    if (candidateChildren.length === 0) {
      extras.push(visual);
      continue;
    }
    const target = candidateChildren.reduce((smallest, child) => {
      const area = child.width * child.height;
      const smallestArea = smallest.width * smallest.height;
      return area < smallestArea ? child : smallest;
    });
    const bucket = childAssignments.get(target.id) || [];
    bucket.push(visual);
    childAssignments.set(target.id, bucket);
  }

  const { consumedId, bgStyles } = pickBackground(extras, annotation, styles);
  if (consumedId) usedIds.add(consumedId);

  // Convert remaining extras to TreeExtraVisual
  const extraVisuals: TreeExtraVisual[] = extras
    .filter((v) => !usedIds.has(v.id))
    .map((v) => toTreeExtraVisual(v, styles));

  // If we have bg styles from consumed background, add as first extra visual with Rect type
  if (bgStyles.length > 0 && consumedId) {
    // Don't add as separate visual, just note that the node has these styles
    // The background is implicitly part of the node
  }

  const children: TreeNode[] = [];
  (annotation.children || []).forEach((child) => {
    const childVisuals = childAssignments.get(child.id) || [];
    const { node: mergedChild, usedIds: usedByChild } = distributeVisualsToTree(child, childVisuals, styles);
    childVisuals.forEach((v) => usedIds.add(v.id));
    usedByChild.forEach((id) => usedIds.add(id));
    children.push(mergedChild);
  });

  // Determine baseName and bizName
  const baseName = annotation.ftaComponent;
  // bizName: use annotation.name if it's different from baseName and non-empty
  const rawName = annotation.name || '';
  const bizName = rawName && rawName !== baseName ? rawName : undefined;

  return {
    node: {
      baseName,
      bizName,
      x: Math.round(annotation.absoluteX),
      y: Math.round(annotation.absoluteY),
      w: Math.round(annotation.width),
      h: Math.round(annotation.height),
      comment: annotation.comment,
      extraVisuals,
      children,
    },
    usedIds,
  };
}

// ============= Tree to String =============

function renderTreeNode(node: TreeNode, depth: number, indentStr = '  '): string[] {
  const lines: string[] = [];
  const indent = indentStr.repeat(depth);

  // Node header: BaseName#BizName (x, y, w, h) or BaseName (x, y, w, h)
  const nameStr = node.bizName ? `${node.baseName}#${node.bizName}` : node.baseName;
  let headerLine = `${indent}${nameStr} (${node.x}, ${node.y}, ${node.w}, ${node.h})`;

  // Add comment if present (as inline comment)
  if (node.comment) {
    headerLine += `  # ${node.comment}`;
  }

  lines.push(headerLine);

  // Extra visuals as @v: attribute
  if (node.extraVisuals.length > 0) {
    const visualsStr = node.extraVisuals.map(formatExtraVisual).join(', ');
    lines.push(`${indent}${indentStr}@v: [${visualsStr}]`);
  }

  // Children
  for (const child of node.children) {
    lines.push(...renderTreeNode(child, depth + 1, indentStr));
  }

  return lines;
}

// ============= Main Export =============

export interface TreeDslResult {
  treeText: string;
  treeNode: TreeNode;
  visualCount: number;
}

/**
 * 将 DSL + Annotation 合并为树状结构文本
 *
 * @param design - 设计数据 (包含 dsl.styles 和 dsl.nodes)
 * @param annotationRoot - 标注根节点
 * @returns TreeDslResult - 包含树状文本、树节点对象和视觉节点数量
 */
export function mergeDslWithAnnotation(design: DesignData, annotationRoot: any): TreeDslResult {
  resetStyleCache();

  const visualNodes: VisualNode[] = [];
  const rootDsl = design.dsl.nodes[0];
  collectVisualNodes(rootDsl as DSLNode, 0, 0, visualNodes);

  const fallbackSize = {
    width: (rootDsl.layoutStyle as any)?.width || 0,
    height: (rootDsl.layoutStyle as any)?.height || 0,
  };
  const normalizedAnnotation = normalizeAnnotationNode(annotationRoot, fallbackSize);

  const { node: treeNode } = distributeVisualsToTree(normalizedAnnotation, visualNodes, design.dsl.styles);

  // Render to text
  const lines = renderTreeNode(treeNode, 0);

  // Add header comment
  const header = [
    '# Tree-based DSL Format',
    '# 格式: BaseType#BizName (x, y, w, h)',
    '#       @v: [VisualType(x,y,w,h|"content"|styles), ...]',
    '#       ChildComponent...',
    '',
  ];

  return {
    treeText: [...header, ...lines].join('\n'),
    treeNode,
    visualCount: visualNodes.length,
  };
}

export type { TreeNode, TreeExtraVisual };
