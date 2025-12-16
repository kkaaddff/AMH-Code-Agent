/**
 * 组件分类工具函数
 *
 * 注意：schemas 参数为必传，调用者需自行加载 component-schemas.json
 * 前端可通过 import 加载，后端可通过 require 或 fs.readFileSync 加载
 */

import { ComponentCategory, SCHEMA_TYPE_TO_CATEGORY } from '../types/component.js';

// ComponentSchema 接口定义（与 FTAComponentSchemas.ts 中的一致）
export interface ComponentSchema {
  component: string;
  properties: any[];
  summary?: string;
  sourcePath?: string;
  type?: string;
  weight?: number;
}

/**
 * 根据 schema 的 type 字段判断组件类别
 */
export function getComponentCategory(
  componentName: string,
  schemas: Record<string, ComponentSchema>
): ComponentCategory {
  const schema = schemas[componentName];
  if (!schema || !schema.type) {
    return ComponentCategory.ATOMIC; // 默认返回 ATOMIC
  }

  const category = SCHEMA_TYPE_TO_CATEGORY[schema.type];
  return category || ComponentCategory.ATOMIC;
}

/**
 * 判断是否为容器组件（SLOT + CONTAINER）
 */
export function isContainerComponent(componentName: string, schemas: Record<string, ComponentSchema>): boolean {
  const category = getComponentCategory(componentName, schemas);
  return category === ComponentCategory.SLOT || category === ComponentCategory.CONTAINER;
}

/**
 * 按类别分组组件列表
 */
export function getComponentsByCategory(schemas: Record<string, ComponentSchema>): Record<ComponentCategory, string[]> {
  const result: Record<ComponentCategory, string[]> = {
    [ComponentCategory.ATOMIC]: [],
    [ComponentCategory.SLOT]: [],
    [ComponentCategory.BUSINESS]: [],
    [ComponentCategory.CONTAINER]: [],
  };

  for (const [name, schema] of Object.entries(schemas)) {
    if (name === '_default') continue;
    const category = getComponentCategory(name, schemas);
    result[category].push(name);
  }

  // 按 weight 排序（如果有的话）
  for (const category of Object.values(ComponentCategory)) {
    result[category].sort((a, b) => {
      const weightA = schemas[a]?.weight ?? 999;
      const weightB = schemas[b]?.weight ?? 999;
      return weightA - weightB;
    });
  }

  return result;
}

/**
 * 获取所有 FTA 组件列表（排除 _default）
 */
export function getAllFTAComponents(schemas: Record<string, ComponentSchema>): string[] {
  return Object.keys(schemas).filter((name) => name !== '_default');
}

/**
 * 获取指定类别的组件列表
 */
export function getComponentsByCategoryName(
  category: ComponentCategory,
  schemas: Record<string, ComponentSchema>
): string[] {
  const grouped = getComponentsByCategory(schemas);
  return grouped[category] || [];
}
