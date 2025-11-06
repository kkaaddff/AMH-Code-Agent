import { LayoutTreeNode } from '../types/layout';
import { DSLNode } from '../types/dsl';

// 创建LayoutTree nodeId 到 DSL nodeId 的映射关系
export interface NodeIdMapping {
  layoutToDS: Map<string, string>;
  dslToLayout: Map<string, string>;
}

// 递归构建nodeId映射关系
const buildNodeIdMapping = (
  layoutNode: LayoutTreeNode,
  dslNode: DSLNode,
  mapping: NodeIdMapping,
  layoutPath: string = '',
  dslPath: string = ''
): void => {
  // 建立当前节点的映射关系
  const layoutNodeId = layoutNode.nodeId || `${layoutPath}_${layoutNode.componentName}`;
  const dslNodeId = dslNode.id;

  mapping.layoutToDS.set(layoutNodeId, dslNodeId);
  mapping.dslToLayout.set(dslNodeId, layoutNodeId);

  // 递归处理子节点
  if (layoutNode.children && 'children' in dslNode && dslNode.children) {
    const layoutChildren = layoutNode.children;
    const dslChildren = dslNode.children as DSLNode[];

    // 按照同样的顺序遍历子节点
    for (let i = 0; i < Math.min(layoutChildren.length, dslChildren.length); i++) {
      buildNodeIdMapping(layoutChildren[i], dslChildren[i], mapping, `${layoutPath}/${i}`, `${dslPath}/${i}`);
    }
  }
};

/**
 * 基于布局树与 DSL 树构建节点 ID 映射关系。
 * @param layoutData 布局树根节点
 * @param dslData DSL 数据结构
 * @returns 双向节点 ID 映射
 */
export const createNodeIdMapping = (
  layoutData: LayoutTreeNode,
  dslData: { dsl: { nodes: DSLNode[] } }
): NodeIdMapping => {
  const mapping: NodeIdMapping = {
    layoutToDS: new Map(),
    dslToLayout: new Map(),
  };

  if (dslData.dsl.nodes.length > 0) {
    buildNodeIdMapping(layoutData, dslData.dsl.nodes[0], mapping);
  }

  return mapping;
};

/**
 * 根据布局树节点 ID 查找对应的 DSL 节点 ID。
 * @param mapping 节点映射表
 * @param layoutNodeId 布局树节点 ID
 * @returns 关联的 DSL 节点 ID，未找到时返回 null
 */
export const getDSLNodeId = (mapping: NodeIdMapping, layoutNodeId: string): string | null => {
  return mapping.layoutToDS.get(layoutNodeId) || null;
};

/**
 * 根据 DSL 节点 ID 查找对应的布局树节点 ID。
 * @param mapping 节点映射表
 * @param dslNodeId DSL 节点 ID
 * @returns 关联的布局树节点 ID，未找到时返回 null
 */
export const getLayoutNodeId = (mapping: NodeIdMapping, dslNodeId: string): string | null => {
  return mapping.dslToLayout.get(dslNodeId) || null;
};
