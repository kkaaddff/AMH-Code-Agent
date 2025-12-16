import { StyleMap } from './types';

// Helper to generate short IDs
const generateId = (prefix: string, index: number) => `${prefix}${index}`;

// Helper to hash style values for deduplication
const hashValue = (value: any): string => {
  return JSON.stringify(value);
};

export const minifyStyles = (
  styles: Record<string, any>
): { minifiedStyles: Record<string, any>; styleMap: StyleMap } => {
  const minifiedStyles: Record<string, any> = {};
  const idMap = new Map<string, string>();
  const valueMap = new Map<string, string>(); // Hash -> New ID

  // Counters for different style types
  let paintCount = 0;
  let fontCount = 0;
  let effectCount = 0;
  let otherCount = 0;

  for (const [oldId, style] of Object.entries(styles)) {
    // 1. Clean the style value first
    const cleanedStyle = cleanStyle(style, oldId);

    // 2. Deduplication check
    const valueHash = hashValue(cleanedStyle.value);

    if (valueMap.has(valueHash)) {
      // Found duplicate
      const existingNewId = valueMap.get(valueHash)!;
      idMap.set(oldId, existingNewId);
      continue;
    }

    // 3. Generate new ID
    let newId = '';
    if (oldId.startsWith('paint')) {
      newId = generateId('paint', paintCount++);
    } else if (oldId.startsWith('font')) {
      newId = generateId('font', fontCount++);
    } else if (oldId.startsWith('effect')) {
      newId = generateId('effect', effectCount++);
    } else {
      newId = generateId('style', otherCount++);
    }

    // 4. Store mappings and result
    idMap.set(oldId, newId);
    valueMap.set(valueHash, newId);
    minifiedStyles[newId] = cleanedStyle;
  }

  return {
    minifiedStyles,
    styleMap: { idMap, valueMap },
  };
};

const cleanStyle = (style: any, oldId: string): any => {
  const newStyle = { ...style };

  if (oldId.startsWith('font') && newStyle.value) {
    newStyle.value = cleanFont(newStyle.value);
  } else if (oldId.startsWith('paint') && newStyle.value) {
    newStyle.value = cleanPaint(newStyle.value);
  }

  // Keep 'token' field as requested
  return newStyle;
};

const cleanFont = (font: any): any => {
  const newFont = { ...font };

  if (newFont.family) delete newFont.family;
  if (newFont.decoration === 'none') delete newFont.decoration;
  if (newFont.size) {
    newFont.fontSize = newFont.size;
    delete newFont.size;
  }
  if (newFont.case === 'none') delete newFont.case;
  if (newFont.letterSpacing === 'auto') delete newFont.letterSpacing;
  if (newFont.style === '常规体' || newFont.style === 'Regular') delete newFont.style;

  // Convert numeric strings to numbers
  if (typeof newFont.lineHeight === 'string' && !isNaN(Number(newFont.lineHeight))) {
    newFont.lineHeight = Number(newFont.lineHeight);
  }
  if (typeof newFont.size === 'string' && !isNaN(Number(newFont.size))) {
    newFont.size = Number(newFont.size);
  }

  return newFont;
};

const cleanPaint = (paints: any): any => {
  if (!Array.isArray(paints)) return paints;

  const cleaned = paints.map((paint) => {
    if (typeof paint === 'string') {
      // "rgba(r,g,b, 1)" → "rgb(r,g,b)" (only when alpha is 1)
      // Match rgba with alpha = 1, then convert to rgb
      const rgbaWithAlpha1 = /rgba\(([^)]+),\s*1\)/g;
      if (rgbaWithAlpha1.test(paint)) {
        return paint.replace(rgbaWithAlpha1, 'rgb($1)');
      }
      // Otherwise keep as is (including rgba with alpha != 1)
      return paint;
    } else if (typeof paint === 'object' && paint !== null) {
      const newPaint = { ...paint };
      if (newPaint.filters === '') {
        delete newPaint.filters;
      }
      return newPaint;
    }
    return paint;
  });

  // 如果数组长度为1，拆箱返回单个元素，否则返回数组
  return cleaned.length === 1 ? cleaned[0] : cleaned;
};
