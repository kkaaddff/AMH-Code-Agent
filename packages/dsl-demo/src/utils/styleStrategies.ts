import type { DSLStyles } from '@fta/shared';

export enum StyleCategory {
  Paint = 'paint',
  Font = 'font',
  Effect = 'effect',
  Unknown = 'unknown',
}

export interface ResolvedPaintStyle {
  category: StyleCategory.Paint;
  rawId: string;
  color?: string;
  gradient?: string;
  imageUrl?: string;
  token?: string;
}

export interface ResolvedFontStyle {
  category: StyleCategory.Font;
  rawId: string;
  fontSize?: number;
  lineHeight?: number;
  fontWeight?: string;
  decoration?: string;
  fontStyle?: string;
}

export interface ResolvedEffectStyle {
  category: StyleCategory.Effect;
  rawId: string;
  boxShadow?: string;
}

export type ResolvedStyle = ResolvedPaintStyle | ResolvedFontStyle | ResolvedEffectStyle;

const styleCache = new Map<string, ResolvedStyle>();

function normalizeShadow(value?: unknown): string | undefined {
  if (!Array.isArray(value) || value.length === 0) return undefined;
  return value
    .map((v) => (typeof v === 'string' ? v.trim() : ''))
    .filter(Boolean)
    .join(' ');
}

function normalizePaintValue(value: unknown): Pick<ResolvedPaintStyle, 'color' | 'gradient' | 'imageUrl'> {
  if (typeof value === 'string') {
    if (value.startsWith('linear-gradient')) {
      return { gradient: value };
    }
    return { color: value };
  }

  if (Array.isArray(value) && value.length > 0) {
    const first = value[0] as any;
    if (first && typeof first === 'object' && 'url' in first && typeof first.url === 'string') {
      return { imageUrl: first.url };
    }
  }

  return {};
}

function normalizeFontValue(
  value: unknown
): Pick<ResolvedFontStyle, 'fontSize' | 'lineHeight' | 'fontWeight' | 'decoration' | 'fontStyle'> {
  if (!value || typeof value !== 'object') return {};
  const obj = value as Record<string, unknown>;
  const fontSize = typeof obj.fontSize === 'number' ? obj.fontSize : undefined;
  const lineHeight = typeof obj.lineHeight === 'number' ? obj.lineHeight : undefined;
  const fontWeight = typeof obj.style === 'string' ? obj.style : undefined;
  const decoration = typeof obj.decoration === 'string' ? obj.decoration : undefined;
  const fontStyle = typeof obj.fontStyle === 'string' ? obj.fontStyle : undefined;
  return { fontSize, lineHeight, fontWeight, decoration, fontStyle };
}

function detectCategory(styleId: string): StyleCategory {
  if (styleId.startsWith('paint')) return StyleCategory.Paint;
  if (styleId.startsWith('font')) return StyleCategory.Font;
  if (styleId.startsWith('effect')) return StyleCategory.Effect;
  return StyleCategory.Unknown;
}

export function resolveStyle(styleId: string, styles: DSLStyles): ResolvedStyle | null {
  if (!styles || !styles[styleId]) return null;
  const cached = styleCache.get(styleId);
  if (cached) return cached;

  const category = detectCategory(styleId);
  const styleValue = styles[styleId];

  let resolved: ResolvedStyle | null = null;

  switch (category) {
    case StyleCategory.Paint: {
      const paint = normalizePaintValue(styleValue.value ?? styleValue);
      resolved = {
        category,
        rawId: styleId,
        token: typeof styleValue.token === 'string' ? styleValue.token : undefined,
        ...paint,
      };
      break;
    }
    case StyleCategory.Font: {
      const font = normalizeFontValue(styleValue.value ?? styleValue);
      resolved = {
        category,
        rawId: styleId,
        ...font,
      };
      break;
    }
    case StyleCategory.Effect: {
      const boxShadow = normalizeShadow(styleValue.value ?? styleValue);
      resolved = {
        category,
        rawId: styleId,
        boxShadow,
      };
      break;
    }
    default: {
      resolved = null;
      break;
    }
  }

  if (resolved) {
    // 合并相同值，使用 JSON 字符串作为 key，减少重复引用
    const dedupKey = JSON.stringify(resolved);
    if (styleCache.has(dedupKey)) {
      return styleCache.get(dedupKey)!;
    }
    styleCache.set(dedupKey, resolved);
  }

  return resolved;
}

export function resetStyleCache() {
  styleCache.clear();
}
