/**
 * Tree-based DSL 格式转换器
 *
 * 将 DSL + Annotation 合并后输出为缩进表示的树状结构文本，
 * 适用于生成前端代码 (React/Vue/HTML)。
 *
 * 格式定义：
 * - 有业务名时：BaseName#BusinessName (x, y, w, h)
 * - 无业务名时：BaseName (x, y, w, h)
 * - @type: dataModelId (mock 数据类型，用于与 mock 数据 merge)
 * - @v: [VisualType(x,y,w,h|"content"|styles), ...] (ExtraVisuals)
 *
 * 特殊处理：
 * - 当组件是原子组件或业务组件 (isContainer=false) 时，收集所有子内容为 extraVisuals
 * - styles 支持: bg, color, fs(fontSize), lh(lineHeight), fw(fontWeight), radius, border, bw, opacity, shadow, grad, img
 */

import type { DesignData, DSLFlexContainerInfo, DSLNode, DSLTextNode, DSLLayerNode, DSLFrameNode } from '@fta/shared';
import { isNodeVisible } from '@fta/shared';
import { resolveStyle, StyleCategory, resetStyleCache } from '../styleStrategies';
import type { ResolvedPaintStyle, ResolvedEffectStyle, ResolvedFontStyle } from '../styleStrategies';

// ============= Types =============

interface AnnotationNode {
  id: string;
  ftaComponent: string;
  name?: string;
  comment?: string;
  dataType?: string;
  isContainer?: boolean;
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
  strokeWidth?: string;
  strokeType?: string;
  textColorId?: string;
  text?: string;
  fontId?: string;
  flexInfo?: DSLFlexContainerInfo;
  effectId?: string;
  borderRadius?: string;
  opacity?: number;
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
  dataType?: string; // Mock 数据的 TS type，用于与 mock 数据 merge
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

  // 问题3: 从 props.dataModelId 获取 dataType
  const props = raw.props || {};
  const dataType = raw.dataType || props.dataModelId;

  return {
    id: raw.id,
    ftaComponent: raw.ftaComponent || 'View',
    name: raw.name || '',
    comment: raw.comment,
    dataType,
    isContainer: raw.isContainer ?? true, // 默认为容器
    absoluteX,
    absoluteY,
    width,
    height,
    children,
    props,
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
    opacity: typeof node.opacity === 'number' ? node.opacity : undefined,
  };

  // 收集 LAYER 和 FRAME 节点的样式信息
  if (node.type === 'LAYER') {
    const layerNode = node as DSLLayerNode;
    base.borderRadius = layerNode.borderRadius;
    base.strokeColorId = layerNode.strokeColor;
    base.strokeWidth = layerNode.strokeWidth;
    base.strokeType = layerNode.strokeType;
  } else if (node.type === 'FRAME') {
    const frameNode = node as DSLFrameNode;
    base.borderRadius = frameNode.borderRadius;
    base.strokeColorId = frameNode.strokeColor;
    base.strokeWidth = frameNode.strokeWidth;
    base.strokeType = frameNode.strokeType;
  }

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

function resolveFontStyle(styleId: string | undefined, styles: DesignData['dsl']['styles']): ResolvedFontStyle | null {
  if (!styleId || typeof styleId !== 'string') return null;
  const resolved = resolveStyle(styleId, styles);
  if (resolved?.category === StyleCategory.Font) {
    return resolved as ResolvedFontStyle;
  }
  return null;
}

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
  // 字体样式
  if (styles.fontSize) {
    result.push(`fs:${styles.fontSize}`);
  }
  if (styles.lineHeight) {
    result.push(`lh:${styles.lineHeight}`);
  }
  if (styles.fontWeight && styles.fontWeight !== '常规体' && styles.fontWeight !== 'Regular') {
    // 只输出非默认字重
    result.push(`fw:${styles.fontWeight}`);
  }
  if (styles.boxShadow) {
    result.push('shadow');
  }
  if (styles.borderRadius) {
    result.push(`radius:${styles.borderRadius}`);
  }
  if (styles.borderColor) {
    result.push(`border:${styles.borderColor}`);
  }
  if (styles.borderWidth) {
    result.push(`bw:${styles.borderWidth}`);
  }
  if (styles.opacity !== undefined && styles.opacity !== 1) {
    result.push(`opacity:${styles.opacity}`);
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

  // Font styles (fontSize, lineHeight, fontWeight)
  if (visual.type === 'TEXT' && visual.fontId) {
    const font = resolveFontStyle(visual.fontId, styles);
    if (font) {
      if (font.fontSize) stylePayload.fontSize = font.fontSize;
      if (font.lineHeight) stylePayload.lineHeight = font.lineHeight;
      if (font.fontWeight) stylePayload.fontWeight = font.fontWeight;
    }
  }

  // Border radius
  if (visual.borderRadius) {
    stylePayload.borderRadius = visual.borderRadius;
  }

  // Stroke/Border
  if (visual.strokeColorId) {
    const strokePaint = resolvePaintStyle(visual.strokeColorId, styles);
    if (strokePaint?.color) stylePayload.borderColor = strokePaint.color;
  }
  if (visual.strokeWidth) {
    stylePayload.borderWidth = visual.strokeWidth;
  }

  // Opacity
  if (visual.opacity !== undefined && visual.opacity !== 1) {
    stylePayload.opacity = visual.opacity;
  }

  // Effect (shadow)
  if (visual.effectId) {
    const effect = resolveStyle(visual.effectId, styles);
    if (effect && effect.category === StyleCategory.Effect && (effect as ResolvedEffectStyle).boxShadow) {
      stylePayload.boxShadow = (effect as ResolvedEffectStyle).boxShadow;
    }
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

// 简化格式：当节点类型与视觉内容类型一致时，只输出内容和样式
function formatExtraVisualSimplified(ev: TreeExtraVisual): string {
  const parts: string[] = [];

  if (ev.content) {
    const truncated = ev.content.length > 20 ? ev.content.slice(0, 17) + '...' : ev.content;
    parts.push(`"${truncated}"`);
  }

  if (ev.styles.length > 0) {
    parts.push(ev.styles.join(';'));
  }

  // 如果没有任何内容，返回空字符串
  if (parts.length === 0) return '';

  return parts.join('|');
}

// 节点类型到视觉类型的映射
const NODE_TO_VISUAL_TYPE: Record<string, TreeExtraVisual['type'] | undefined> = {
  Text: 'Text',
  RichText: 'Text',
  Image: 'Vector', // Image 通常对应 Vector 或 Rect
  Icon: 'Vector',
};

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

  // Determine baseName and bizName
  const baseName = annotation.ftaComponent;
  const rawName = annotation.name || '';
  const bizName = rawName && rawName !== baseName ? rawName : undefined;

  // 问题1修复: 当组件不是容器时（原子组件/业务组件），收集所有子内容为 extraVisuals
  // isContainer 为 false 表示这是一个完整组件，不应该有子级结构
  const isTerminalComponent = annotation.isContainer === false;

  if (isTerminalComponent) {
    // 终端组件：所有内部视觉节点都作为 extraVisuals，不递归子级
    const { consumedId } = pickBackground(inside, annotation, styles);
    if (consumedId) usedIds.add(consumedId);

    const extraVisuals: TreeExtraVisual[] = inside
      .filter((v) => !usedIds.has(v.id))
      .map((v) => toTreeExtraVisual(v, styles));

    inside.forEach((v) => usedIds.add(v.id));

    return {
      node: {
        baseName,
        bizName,
        x: Math.round(annotation.absoluteX),
        y: Math.round(annotation.absoluteY),
        w: Math.round(annotation.width),
        h: Math.round(annotation.height),
        comment: annotation.comment,
        dataType: annotation.dataType,
        extraVisuals,
        children: [], // 终端组件没有子级
      },
      usedIds,
    };
  }

  // 容器组件：正常分配视觉节点到子级
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

  const { consumedId } = pickBackground(extras, annotation, styles);
  if (consumedId) usedIds.add(consumedId);

  // Convert remaining extras to TreeExtraVisual
  const extraVisuals: TreeExtraVisual[] = extras
    .filter((v) => !usedIds.has(v.id))
    .map((v) => toTreeExtraVisual(v, styles));

  const children: TreeNode[] = [];
  (annotation.children || []).forEach((child) => {
    const childVisuals = childAssignments.get(child.id) || [];
    const { node: mergedChild, usedIds: usedByChild } = distributeVisualsToTree(child, childVisuals, styles);
    childVisuals.forEach((v) => usedIds.add(v.id));
    usedByChild.forEach((id) => usedIds.add(id));
    children.push(mergedChild);
  });

  return {
    node: {
      baseName,
      bizName,
      x: Math.round(annotation.absoluteX),
      y: Math.round(annotation.absoluteY),
      w: Math.round(annotation.width),
      h: Math.round(annotation.height),
      comment: annotation.comment,
      dataType: annotation.dataType,
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

  // 问题3: 输出 dataType (mock 数据类型) - 作为 @type 属性
  if (node.dataType) {
    lines.push(`${indent}${indentStr}@type: ${node.dataType}`);
  }

  // Extra visuals as @v: attribute
  // 对于 Text/RichText/Image/Icon 等原子类型，使用简化格式（只输出内容和样式）
  if (node.extraVisuals.length > 0) {
    const expectedVisualType = NODE_TO_VISUAL_TYPE[node.baseName];
    const canSimplify = expectedVisualType && node.extraVisuals.every((ev) => ev.type === expectedVisualType);

    if (canSimplify) {
      // 简化格式：只输出内容和样式
      const simplifiedParts = node.extraVisuals.map(formatExtraVisualSimplified).filter((s) => s.length > 0);
      if (simplifiedParts.length > 0) {
        lines.push(`${indent}${indentStr}@v: [${simplifiedParts.join(', ')}]`);
      }
    } else {
      // 完整格式：包含类型和位置
      const visualsStr = node.extraVisuals.map(formatExtraVisual).join(', ');
      lines.push(`${indent}${indentStr}@v: [${visualsStr}]`);
    }
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
    '#       @type: dataModelId (mock 数据类型)',
    '#       @v: [VisualType(x,y,w,h|"content"|styles), ...]',
    '#       ChildComponent...',
    '# styles: bg, color, fs(fontSize), lh(lineHeight), fw(fontWeight), radius, border, bw, opacity, shadow, grad, img',
    '',
  ];

  return {
    treeText: [...header, ...lines].join('\n'),
    treeNode,
    visualCount: visualNodes.length,
  };
}

export type { TreeNode, TreeExtraVisual };
