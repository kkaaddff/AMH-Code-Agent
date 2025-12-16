/**
 * 组件类型分类定义
 */

// 组件类别枚举
export enum ComponentCategory {
  ATOMIC = 'atomic', // 基础原子组件（完整组件）
  SLOT = 'slot', // 带插槽组件（容器组件）
  BUSINESS = 'business', // 业务组件（完整组件）
  CONTAINER = 'container', // 基础容器（容器组件）
}

// Schema type 字段到 ComponentCategory 的映射
export const SCHEMA_TYPE_TO_CATEGORY: Record<string, ComponentCategory> = {
  基础容器: ComponentCategory.CONTAINER,
  基础原子组件: ComponentCategory.ATOMIC,
  带有插槽的复杂组件: ComponentCategory.SLOT,
  复杂整体业务组件: ComponentCategory.BUSINESS,
};

// ComponentCategory 到中文描述的映射（用于显示）
export const CATEGORY_TO_LABEL: Record<ComponentCategory, string> = {
  [ComponentCategory.CONTAINER]: '基础容器',
  [ComponentCategory.ATOMIC]: '基础原子组件',
  [ComponentCategory.SLOT]: '带有插槽的复杂组件',
  [ComponentCategory.BUSINESS]: '复杂整体业务组件',
};
