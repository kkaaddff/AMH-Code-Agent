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
      collectNodeIds(child, isLayout).forEach(id => ids.add(id));
    });
  }

  return ids;
};

export const createNodeMapping = (layoutData: LayoutTreeNode, dslData: DSLData): NodeMapping => {
  const mapping: NodeMapping = {
    layoutToDS: new Map(),
    dslToLayout: new Map()
  };

  const layoutNodeIds = collectNodeIds(layoutData, true);
  const dslNodeIds = dslData.dsl.nodes.length > 0 ? collectNodeIds(dslData.dsl.nodes[0], false) : new Set();

  layoutNodeIds.forEach(layoutId => {
    if (dslNodeIds.has(layoutId)) {
      mapping.layoutToDS.set(layoutId, layoutId);
      mapping.dslToLayout.set(layoutId, layoutId);
    }
  });

  return mapping;
};

export const getDSLNodeId = (mapping: NodeMapping, layoutNodeId: string): string | null => {
  return mapping.layoutToDS.get(layoutNodeId) || null;
};

export const getLayoutNodeId = (mapping: NodeMapping, dslNodeId: string): string | null => {
  return mapping.dslToLayout.get(dslNodeId) || null;
};

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