import fs from 'node:fs/promises';
import path from 'node:path';
import { DSLCleaner, isNodeVisible } from '@fta/shared';
import annotation from '../src/data/rootAnnotation.json' with { type: 'json' };
import dslRawData from '../src/data/dsl.json' with { type: 'json' };

function resolveStyle(styleId, styles) {
  if (!styleId || !styles || !styles[styleId]) return null;
  const value = styles[styleId];
  const payload = value.value ?? value;
  if (styleId.startsWith('paint')) {
    if (typeof payload === 'string') {
      if (payload.startsWith('linear-gradient')) return { backgroundImage: payload };
      return { backgroundColor: payload };
    }
    if (Array.isArray(payload) && payload[0]?.url) {
      return { backgroundImage: `url(${payload[0].url})` };
    }
  }
  if (styleId.startsWith('font')) {
    if (payload && typeof payload === 'object') {
      return {
        fontSize: payload.fontSize,
        lineHeight: payload.lineHeight,
        fontWeight: payload.style,
        decoration: payload.decoration,
        fontStyle: payload.fontStyle,
      };
    }
  }
  if (styleId.startsWith('effect') && Array.isArray(payload)) {
    return { boxShadow: payload.map((v) => (typeof v === 'string' ? v.trim() : '')).filter(Boolean).join(' ') };
  }
  return null;
}

function collectVisualNodes(node, offsetX, offsetY, visuals) {
  if (!isNodeVisible(node)) return;
  const layout = node.layoutStyle || {};
  const absoluteX = (layout.relativeX || 0) + offsetX;
  const absoluteY = (layout.relativeY || 0) + offsetY;
  const width = layout.width || 0;
  const height = layout.height || 0;

  const base = {
    id: node.id,
    type: node.type,
    width,
    height,
    absoluteX,
    absoluteY,
    fillId: node.fill,
    effectId: node.effect,
  };

  if (node.type === 'TEXT') {
    base.text = (node.text || []).map((t) => t.text).join('');
    base.textColorId = node.textColor?.[0]?.color;
    base.fontId = node.text?.[0]?.font;
    visuals.push(base);
  } else if (node.type === 'LAYER' || node.type === 'PATH') {
    visuals.push(base);
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child) => collectVisualNodes(child, absoluteX, absoluteY, visuals));
  }
}

const isWithin = (parent, visual) =>
  visual.absoluteX >= parent.absoluteX &&
  visual.absoluteY >= parent.absoluteY &&
  visual.absoluteX + visual.width <= parent.absoluteX + parent.width &&
  visual.absoluteY + visual.height <= parent.absoluteY + parent.height;

const toleranceEquals = (a, b, tolerance = 1.5) => Math.abs(a - b) <= tolerance;

function normalizeAnnotationNode(raw, fallback) {
  const width = typeof raw.width === 'number' ? raw.width : fallback?.width || 0;
  const height = typeof raw.height === 'number' ? raw.height : fallback?.height || 0;
  const absoluteX = typeof raw.absoluteX === 'number' ? raw.absoluteX : 0;
  const absoluteY = typeof raw.absoluteY === 'number' ? raw.absoluteY : 0;
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
    children: Array.isArray(raw.children) ? raw.children.map((c) => normalizeAnnotationNode(c)) : [],
  };
}

function pickBackground(extras, node, styles) {
  const bg = extras.find(
    (v) =>
      toleranceEquals(v.width, node.width) &&
      toleranceEquals(v.height, node.height) &&
      toleranceEquals(v.absoluteX, node.absoluteX) &&
      toleranceEquals(v.absoluteY, node.absoluteY) &&
      v.fillId
  );
  if (!bg) return { style: {}, consumed: null };
  const style = resolveStyle(bg.fillId, styles) || {};
  return { style, consumed: bg.id };
}

function pickTypography(extras, styles) {
  const textVisual = extras.find((v) => v.type === 'TEXT' && v.text);
  if (!textVisual) return null;
  const font = resolveStyle(textVisual.fontId, styles);
  const color = resolveStyle(textVisual.textColorId, styles);
  if (!font?.fontSize || !font.lineHeight) return null;
  return {
    typography: {
      fontSize: font.fontSize,
      lineHeight: font.lineHeight,
      fontWeight: font.fontWeight,
      decoration: font.decoration,
      content: textVisual.text,
    },
    color: color?.backgroundColor,
    consumed: textVisual.id,
  };
}

function toExtraVisual(visual, styles) {
  const style = resolveStyle(visual.fillId, styles) || {};
  let type = 'Vector';
  if (visual.type === 'TEXT') type = 'Text';
  if (visual.type === 'LAYER') type = 'Rect';
  return {
    id: visual.id,
    type,
    layout: {
      width: visual.width,
      height: visual.height,
      absoluteX: visual.absoluteX,
      absoluteY: visual.absoluteY,
    },
    styles: style,
    content: visual.text,
  };
}

function distribute(annotation, visuals, styles) {
  const inside = visuals.filter((v) => isWithin(annotation, v));
  const childAssignments = new Map();
  const extras = [];

  for (const visual of inside) {
    const candidates = (annotation.children || []).filter((child) => isWithin(child, visual));
    if (candidates.length === 0) {
      extras.push(visual);
      continue;
    }
    const target = candidates.reduce((smallest, child) => {
      const area = child.width * child.height;
      const smallestArea = smallest.width * smallest.height;
      return area < smallestArea ? child : smallest;
    });
    const bucket = childAssignments.get(target.id) || [];
    bucket.push(visual);
    childAssignments.set(target.id, bucket);
  }

  const { style, consumed } = pickBackground(extras, annotation, styles);
  const typography = pickTypography(extras, styles);
  const used = new Set();
  if (consumed) used.add(consumed);
  if (typography?.consumed) used.add(typography.consumed);

  const extraVisuals = extras.filter((v) => !used.has(v.id)).map((v) => toExtraVisual(v, styles));

  const children = (annotation.children || []).map((child) => {
    const childVisuals = childAssignments.get(child.id) || [];
    return distribute(child, childVisuals, styles);
  });

  return {
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
    typography: typography?.typography,
    extraVisuals,
    children,
  };
}

async function main() {
  const cleanerConfig = {
    removeEmptyNodes: true,
    removeMaskLayers: true,
    removeOutOfBounds: true,
    removeInvisibleNodes: true,
    detectIcons: true,
    mergeIconLayers: true,
    iconMergeMaxSize: 40,
    iconMinLayers: 2,
    iconProximityThreshold: 10,
    buildZIndex: true,
    checkOverlapping: true,
    removeCompletelyHidden: true,
    flattenSingleChild: true,
    optimizeDepth: true,
    preserveSemantics: true,
    verbose: false,
    dryRun: false,
  };

  const dslData = {
    dsl: {
      styles: dslRawData.styles,
      nodes: dslRawData.nodes,
    },
  };

  const cleaner = new DSLCleaner(cleanerConfig);
  const cleaned = cleaner.clean(dslData.dsl.nodes[0]);
  const cleanedDsl = { dsl: { styles: dslData.dsl.styles, nodes: [cleaned.root] } };

  const visuals = [];
  collectVisualNodes(cleanedDsl.dsl.nodes[0], 0, 0, visuals);

  const fallbackSize = {
    width: cleanedDsl.dsl.nodes[0].layoutStyle?.width || 0,
    height: cleanedDsl.dsl.nodes[0].layoutStyle?.height || 0,
  };

  const normalizedAnnotation = normalizeAnnotationNode(annotation, fallbackSize);
  const merged = distribute(normalizedAnnotation, visuals, cleanedDsl.dsl.styles);

  const outputPath = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../src/data/merged.json');
  await fs.writeFile(outputPath, JSON.stringify(merged, null, 2), 'utf-8');
  console.log(`Merged JSON written to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

