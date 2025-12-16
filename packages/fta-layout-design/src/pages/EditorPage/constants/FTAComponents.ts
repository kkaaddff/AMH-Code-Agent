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

import { FTA_COMPONENT_SCHEMAS, ComponentSchema } from './FTAComponentSchemas';

// 从 schemas 中按 type 字段分组，并按 weight 排序
const groupByType = () => {
  const groups: Record<string, Array<{ name: string; weight: number }>> = {
    基础容器: [],
    基础原子组件: [],
    带有插槽的复杂组件: [],
    复杂整体业务组件: [],
  };

  for (const [name, schema] of Object.entries(FTA_COMPONENT_SCHEMAS)) {
    if (name === '_default') continue;
    const type = schema.type || '基础原子组件'; // 默认归为基础原子组件
    if (type in groups) {
      groups[type].push({
        name,
        weight: schema.weight ?? 999, // 无权重时排在最后
      });
    }
  }

  // 按 weight 升序排序各分组
  const result: Record<string, string[]> = {};
  for (const key of Object.keys(groups)) {
    groups[key].sort((a, b) => a.weight - b.weight);
    result[key] = groups[key].map((item) => item.name);
  }

  return result;
};

export const FTA_COMPONENTS = groupByType();

/**
 * 获取指定组件的 schema 信息
 */
export function getComponentSchemaInfo(componentName: string): ComponentSchema | undefined {
  return FTA_COMPONENT_SCHEMAS[componentName];
}
