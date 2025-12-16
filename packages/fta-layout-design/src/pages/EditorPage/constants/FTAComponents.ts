/**
 * 组件库配置（从 component-schemas.json 的 type 字段动态生成）
 *
 * 分类规则：
 * - 基础原子组件：Button、Icon、Text、Avatar、Badge 等基础 UI 元素
 * - 带有插槽的复杂组件：Card、Modal、Form 等需要子内容的容器组件
 * - 复杂整体业务组件：AddressPicker、Calendar、Cascader 等完整业务功能组件
 * - 基础容器：View、Flex、Grid 等纯布局容器
 *
 * 排序规则：按 weight 字段升序排列（权重越小越靠前）
 */

import { ComponentCategory, CATEGORY_TO_LABEL, getComponentsByCategory } from '@fta/shared';
import { FTA_COMPONENT_SCHEMAS, ComponentSchema } from './FTAComponentSchemas';

// 使用 shared 包的工具函数按类别分组组件，并转换为中文标签格式
const groupedByCategory = getComponentsByCategory(FTA_COMPONENT_SCHEMAS);

// 转换为中文标签格式以保持向后兼容
export const FTA_COMPONENTS: Record<string, string[]> = {
  [CATEGORY_TO_LABEL[ComponentCategory.CONTAINER]]: groupedByCategory[ComponentCategory.CONTAINER],
  [CATEGORY_TO_LABEL[ComponentCategory.ATOMIC]]: groupedByCategory[ComponentCategory.ATOMIC],
  [CATEGORY_TO_LABEL[ComponentCategory.SLOT]]: groupedByCategory[ComponentCategory.SLOT],
  [CATEGORY_TO_LABEL[ComponentCategory.BUSINESS]]: groupedByCategory[ComponentCategory.BUSINESS],
};

/**
 * 获取指定组件的 schema 信息
 */
export function getComponentSchemaInfo(componentName: string): ComponentSchema | undefined {
  return FTA_COMPONENT_SCHEMAS[componentName];
}
