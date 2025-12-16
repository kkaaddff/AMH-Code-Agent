import type { DesignData, DSLFlexContainerInfo, DSLNode, DSLTextNode } from '@fta/shared';
import { isNodeVisible } from '@fta/shared';
import type { ResolvedFontStyle, ResolvedPaintStyle } from './styleStrategies';
import { resolveStyle, StyleCategory, resetStyleCache } from './styleStrategies';
import type { MergedExtraVisual, MergedPageNode } from '../types/merged';

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

function normalizeAnnotationNode(raw: any, fallback?: { width: number; height: number }): AnnotationNode {
  const width = typeof raw.width === 'number' ? raw.width : fallback?.width ?? 0;
  const height = typeof raw.height === 'number' ? raw.height : fallback?.height ?? 0;
  const absoluteX = typeof raw.absoluteX === 'number' ? raw.absoluteX : 0;
  const absoluteY = typeof raw.absoluteY === 'number' ? raw.absoluteY : 0;
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
  const absoluteX = (layout.relativeX || 0) + offsetX;
  const absoluteY = (layout.relativeY || 0) + offsetY;
  const width = layout.width || 0;
  const height = layout.height || 0;

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
  } else if (node.type === 'INSTANCE' || node.type === 'FRAME' || node.type === 'GROUP') {
    // 容器本身不视为额外可视元素，但继续递归
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

function toMergedExtraVisual(visual: VisualNode, styles: DesignData['dsl']['styles']): MergedExtraVisual {
  const paint = resolvePaintStyle(visual.fillId, styles);
  const stylePayload: Record<string, unknown> = {};
  if (paint?.color) stylePayload.backgroundColor = paint.color;
  if (paint?.gradient) stylePayload.backgroundImage = paint.gradient;
  if (paint?.imageUrl) stylePayload.backgroundImage = `url(${paint.imageUrl})`;

  let type: MergedExtraVisual['type'] = 'Vector';
  if (visual.type === 'TEXT') type = 'Text';
  else if (visual.type === 'LAYER') type = 'Rect';
  else if (visual.type === 'PATH') type = 'Vector';

  return {
    id: visual.id,
    type,
    layout: {
      width: visual.width,
      height: visual.height,
      absoluteX: visual.absoluteX,
      absoluteY: visual.absoluteY,
    },
    styles: stylePayload,
    content: visual.text,
  };
}

function pickBackground(visuals: VisualNode[], node: AnnotationNode, styles: DesignData['dsl']['styles']) {
  const bgCandidate = visuals.find((v) => {
    const widthMatch = toleranceEquals(v.width, node.width);
    const heightMatch = toleranceEquals(v.height, node.height);
    const xMatch = toleranceEquals(v.absoluteX, node.absoluteX);
    const yMatch = toleranceEquals(v.absoluteY, node.absoluteY);
    return widthMatch && heightMatch && xMatch && yMatch && v.fillId;
  });

  const style: Record<string, unknown> = {};
  if (!bgCandidate) return { style, consumedId: null };

  const paint = resolvePaintStyle(bgCandidate.fillId, styles);
  const effect = bgCandidate.effectId ? resolveStyle(bgCandidate.effectId, styles) : null;

  if (paint?.color) style.backgroundColor = paint.color;
  if (paint?.gradient) style.backgroundImage = paint.gradient;
  if (paint?.imageUrl) style.backgroundImage = `url(${paint.imageUrl})`;
  if (effect && effect.category === StyleCategory.Effect && effect.boxShadow) style.boxShadow = effect.boxShadow;
  return { style, consumedId: bgCandidate.id };
}

function pickTypography(visuals: VisualNode[], styles: DesignData['dsl']['styles']) {
  const textVisual = visuals.find((v) => v.type === 'TEXT' && v.text);
  if (!textVisual) return null;
  const font = resolveFontStyle(textVisual.fontId, styles);
  const colorStyle = resolvePaintStyle(textVisual.textColorId, styles);
  if (!font || !font.fontSize || !font.lineHeight) return null;
  return {
    typography: {
      fontSize: font.fontSize,
      lineHeight: font.lineHeight,
      fontWeight: font.fontWeight,
      decoration: font.decoration,
      textAlign: undefined,
      content: textVisual.text || '',
    },
    color: colorStyle?.color,
  };
}

function distributeVisuals(
  annotation: AnnotationNode,
  visuals: VisualNode[],
  styles: DesignData['dsl']['styles']
): { node: MergedPageNode; usedIds: Set<string> } {
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

  const { style, consumedId } = pickBackground(extras, annotation, styles);
  if (consumedId) usedIds.add(consumedId);

  const typographyResult = pickTypography(extras, styles);
  if (typographyResult) {
    if (typographyResult.color) {
      style.color = typographyResult.color;
    }
    usedIds.add(extras.find((v) => v.type === 'TEXT' && v.text === typographyResult.typography.content)?.id || '');
  }

  const extraVisuals: MergedExtraVisual[] = extras
    .filter((v) => !usedIds.has(v.id))
    .map((v) => toMergedExtraVisual(v, styles));

  const children: MergedPageNode[] = [];
  (annotation.children || []).forEach((child) => {
    const childVisuals = childAssignments.get(child.id) || [];
    const { node: mergedChild, usedIds: usedByChild } = distributeVisuals(child, childVisuals, styles);
    childVisuals.forEach((v) => usedIds.add(v.id));
    usedByChild.forEach((id) => usedIds.add(id));
    children.push(mergedChild);
  });

  return {
    node: {
      nodeId: annotation.id,
      type: annotation.ftaComponent,
      componentName: annotation.name,
      dataType: annotation.dataType,
      comment: annotation.comment,
      layout: {
        width: annotation.width,
        height: annotation.height,
        absoluteX: annotation.absoluteX,
        absoluteY: annotation.absoluteY,
      },
      styles: style,
      typography: typographyResult?.typography,
      extraVisuals,
      children,
    },
    usedIds,
  };
}

export function mergeDslWithAnnotation(
  design: DesignData,
  annotationRoot: AnnotationNode
): { merged: MergedPageNode; visuals: number } {
  resetStyleCache();
  const visualNodes: VisualNode[] = [];
  const rootDsl = design.dsl.nodes[0];
  collectVisualNodes(rootDsl as DSLNode, 0, 0, visualNodes);
  const fallbackSize = {
    width: (rootDsl.layoutStyle as any)?.width || 0,
    height: (rootDsl.layoutStyle as any)?.height || 0,
  };
  const normalizedAnnotation = normalizeAnnotationNode(annotationRoot, fallbackSize);
  const { node } = distributeVisuals(normalizedAnnotation, visualNodes, design.dsl.styles);
  return { merged: node, visuals: visualNodes.length };
}
