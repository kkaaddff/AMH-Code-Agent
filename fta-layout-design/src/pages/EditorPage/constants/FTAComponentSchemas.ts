/**
 * FTA组件属性Schema定义（由 component-schemas.json 驱动）
 */

export type PropertyType = 'string' | 'number' | 'boolean' | 'color' | 'select' | 'textarea' | 'json';

export interface PropertySchema {
  name: string;
  label: string;
  type: PropertyType;
  required?: boolean;
  defaultValue?: any;
  placeholder?: string;
  options?: { label: string; value: any }[];
  description?: string;
}

export interface ComponentSchema {
  component: string;
  properties: PropertySchema[];
  summary?: string;
  sourcePath?: string;
  type?: string;
}

// 引入自动生成的大型schema JSON
// 注意：仅使用必要字段，保持运行时轻量映射
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import rawSchemas from './component-schemas.json';

type RawProperty = {
  name: string;
  label?: string;
  type?: string;
  defaultValue?: any;
  description?: string;
};

type RawComponentSchema = {
  component: string;
  properties: RawProperty[];
  summary?: string;
  sourcePath?: string;
  type?: string;
};

const SUPPORTED_TYPES: PropertyType[] = ['string', 'number', 'boolean', 'color', 'select', 'textarea', 'json'];

function normalizePropertyType(input?: string): PropertyType {
  const t = (input || '').toLowerCase();
  if ((SUPPORTED_TYPES as string[]).includes(t)) return t as PropertyType;
  // 将未知类型回退为 string，复杂结构回退为 json
  if (t.includes('json') || t.includes('object') || t.includes('{}')) return 'json';
  return 'string';
}

function toPropertySchema(raw: RawProperty): PropertySchema {
  return {
    name: raw.name,
    label: raw.label || raw.name,
    type: normalizePropertyType(raw.type),
    defaultValue: raw.defaultValue,
    description: raw.description,
  };
}

function toComponentSchema(name: string, raw: RawComponentSchema): ComponentSchema {
  const properties = Array.isArray(raw.properties) ? raw.properties.map(toPropertySchema) : [];
  return {
    component: raw.component || name,
    properties,
    summary: raw.summary,
    sourcePath: raw.sourcePath,
    type: raw.type,
  };
}

// 将原始 JSON 映射为内部使用的 Schema 结构
const mappedEntries = Object.entries(rawSchemas as Record<string, RawComponentSchema>)
  .map(([key, value]) => [key, toComponentSchema(key, value)] as const);

// 注入默认schema占位，便于兜底
const defaultSchema: ComponentSchema = { component: '_default', properties: [] };

export const FTA_COMPONENT_SCHEMAS: Record<string, ComponentSchema> = Object.fromEntries([
  ...mappedEntries,
  ['_default', defaultSchema],
]);

export function getComponentSchema(componentName: string): ComponentSchema {
  return FTA_COMPONENT_SCHEMAS[componentName] || defaultSchema;
}
