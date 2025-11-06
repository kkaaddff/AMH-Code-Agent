/**
 * 组件库配置（从 component-schemas.json 的 type 字段动态生成）
 *
 * 分类规则：
 * - 基础原子组件：Button、Icon、Text、Avatar、Badge 等基础 UI 元素
 * - 带有插槽的复杂组件：Card、Modal、Form 等需要子内容的容器组件
 * - 复杂整体业务组件：AddressPicker、Calendar、Cascader 等完整业务功能组件
 * - 基础容器：View、Flex、Grid 等纯布局容器
 */

import { FTA_COMPONENT_SCHEMAS } from './FTAComponentSchemas';

// 从 schemas 中按 type 字段分组
const groupByType = () => {
  const groups: Record<string, string[]> = {
    基础容器: [],
    基础原子组件: [],
    带有插槽的复杂组件: [],
    复杂整体业务组件: [],
  };

  for (const [name, schema] of Object.entries(FTA_COMPONENT_SCHEMAS)) {
    if (name === '_default') continue;
    const type = schema.type || '基础原子组件'; // 默认归为基础原子组件
    if (type in groups) {
      groups[type].push(name);
    }
  }

  // 按字母排序各分组
  for (const key of Object.keys(groups)) {
    groups[key].sort();
  }

  return groups;
};

export const FTA_COMPONENTS = groupByType();
