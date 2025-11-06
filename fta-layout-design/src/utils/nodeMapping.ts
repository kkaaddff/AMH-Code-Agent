import { LayoutTreeNode } from '../types/layout';
import { DSLData, DSLNode } from '../types/dsl';

export interface NodeMapping {
  layoutToDS: Map<string, string>;
  dslToLayout: Map<string, string>;
}

const collectNodeIds = (node: LayoutTreeNode | DSLNode, isLayout = true): Set<string> => {
  const ids = new Set<string>();
  const id = isLayout ? (node as LayoutTreeNode).nodeId : (node as DSLNode).id;

  if (id) ids.add(id);

  const children = (node as any).children;
  if (children) {
    children.forEach((child: LayoutTreeNode | DSLNode) => {
      collectNodeIds(child, isLayout).forEach((id) => ids.add(id));
    });
  }

  return ids;
};

/**
 * 基于布局树与 DSL 数据生成节点 ID 的初步映射。
 * @param layoutData 布局树根节点
 * @param dslData DSL 数据集合
 * @returns 布局与 DSL 间的节点映射关系
 */
export const createNodeMapping = (layoutData: LayoutTreeNode, dslData: DSLData): NodeMapping => {
  const mapping: NodeMapping = {
    layoutToDS: new Map(),
    dslToLayout: new Map(),
  };

  const layoutNodeIds = collectNodeIds(layoutData, true);
  const dslNodeIds = dslData.dsl.nodes.length > 0 ? collectNodeIds(dslData.dsl.nodes[0], false) : new Set();

  layoutNodeIds.forEach((layoutId) => {
    if (dslNodeIds.has(layoutId)) {
      mapping.layoutToDS.set(layoutId, layoutId);
      mapping.dslToLayout.set(layoutId, layoutId);
    }
  });

  return mapping;
};

/**
 * 根据布局树节点 ID 获取对应的 DSL 节点 ID。
 * @param mapping 节点映射表
 * @param layoutNodeId 布局树节点 ID
 * @returns 匹配的 DSL 节点 ID 或 null
 */
export const getDSLNodeId = (mapping: NodeMapping, layoutNodeId: string): string | null => {
  return mapping.layoutToDS.get(layoutNodeId) || null;
};

/**
 * 根据 DSL 节点 ID 获取对应的布局树节点 ID。
 * @param mapping 节点映射表
 * @param dslNodeId DSL 节点 ID
 * @returns 匹配的布局树节点 ID 或 null
 */
export const getLayoutNodeId = (mapping: NodeMapping, dslNodeId: string): string | null => {
  return mapping.dslToLayout.get(dslNodeId) || null;
};

/**
 * 在 DSL 数据中查找指定 ID 的节点。
 * @param dslData DSL 数据集合
 * @param nodeId 目标节点 ID
 * @returns 找到的节点，未命中时返回 null
 */
export const findDSLNodeById = (dslData: DSLData, nodeId: string): DSLNode | null => {
  const searchNode = (node: DSLNode): DSLNode | null => {
    if (node.id === nodeId) return node;

    if ((node as any).children) {
      for (const child of (node as any).children) {
        const found = searchNode(child);
        if (found) return found;
      }
    }
    return null;
  };

  for (const rootNode of dslData.dsl.nodes) {
    const found = searchNode(rootNode);
    if (found) return found;
  }

  return null;
};
