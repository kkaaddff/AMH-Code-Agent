import { proxy } from 'valtio';
import { DSLNode } from '../../../types/dsl';
import { designDetectionStore } from './DesignDetectionContext';

interface DSLDataState {
  designId: string | null;
  loading: boolean;
  error: Error | null;
}

interface DSLDataActions {
  updateNodeVisibility: (nodeId: string, hidden: boolean) => void;
  resetAllNodeVisibility: () => void;
}

const updateNodeInTree = (
  nodes: DSLNode[],
  targetId: string,
  updater: (node: DSLNode) => DSLNode
): {
  nodes: DSLNode[];
  changed: boolean;
} => {
  let hasChanged = false;

  const nextNodes = nodes.map((node) => {
    let nextNode = node;

    if (node.id === targetId) {
      const updatedNode = updater(node);
      if (updatedNode !== node) {
        nextNode = updatedNode;
        hasChanged = true;
      }
    }

    if (nextNode.children && nextNode.children.length > 0) {
      const { nodes: updatedChildren, changed: childrenChanged } = updateNodeInTree(
        nextNode.children,
        targetId,
        updater
      );

      if (childrenChanged) {
        nextNode = {
          ...nextNode,
          children: updatedChildren,
        };
        hasChanged = true;
      }
    }

    return nextNode;
  });

  return {
    nodes: hasChanged ? nextNodes : nodes,
    changed: hasChanged,
  };
};

const resetVisibilityInTree = (nodes: DSLNode[]): { nodes: DSLNode[]; changed: boolean } => {
  let hasChanged = false;

  const nextNodes = nodes.map((node) => {
    let nodeChanged = false;
    let nextChildren = node.children;

    if (node.children && node.children.length > 0) {
      const { nodes: updatedChildren, changed: childrenChanged } = resetVisibilityInTree(node.children);
      if (childrenChanged) {
        nodeChanged = true;
        nextChildren = updatedChildren;
      }
    }

    const hiddenChanged = Boolean(node.hidden);
    if (hiddenChanged) {
      nodeChanged = true;
    }

    if (!nodeChanged) {
      return node;
    }

    const updatedNode: DSLNode = {
      ...node,
      ...(nextChildren && nextChildren !== node.children ? { children: nextChildren } : {}),
      ...(hiddenChanged ? { hidden: false } : {}),
    };

    hasChanged = true;
    return updatedNode;
  });

  return {
    nodes: hasChanged ? nextNodes : nodes,
    changed: hasChanged,
  };
};

export const dslDataStore = proxy<DSLDataState>({
  designId: null,
  loading: false,
  error: null,
});

export const dslDataActions: DSLDataActions = {
  updateNodeVisibility: (nodeId: string, hidden: boolean) => {
    if (!designDetectionStore?.dslData?.dsl?.nodes) {
      return;
    }

    const { nodes: updatedNodes, changed } = updateNodeInTree(
      designDetectionStore.dslData?.dsl?.nodes,
      nodeId,
      (node) => {
        if (node.hidden === hidden) {
          return node;
        }
        return {
          ...node,
          hidden,
        };
      }
    );

    if (!changed) {
      return;
    }

    designDetectionStore.dslData = {
      ...designDetectionStore.dslData,
      dsl: {
        ...designDetectionStore.dslData.dsl,
        nodes: updatedNodes,
      },
    };
  },

  resetAllNodeVisibility: () => {
    if (!designDetectionStore?.dslData?.dsl?.nodes) {
      return;
    }

    const { nodes: resetNodes, changed } = resetVisibilityInTree(designDetectionStore.dslData?.dsl?.nodes);

    if (!changed) {
      return;
    }
    designDetectionStore.dslData = {
      ...designDetectionStore.dslData,
      dsl: {
        ...designDetectionStore.dslData.dsl,
        nodes: resetNodes,
      },
    };
  },
};
