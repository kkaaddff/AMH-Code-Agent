import { proxy } from 'valtio';
import { DSLData, DSLNode } from '../../../types/dsl';
import { api } from '@/utils/apiService';

interface DSLDataState {
  designId: string | null;
  data: DSLData | null;
  loading: boolean;
  error: Error | null;
}

interface DSLDataActions {
  loadDesign: (designId: string) => Promise<void>;
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
  data: null,
  loading: false,
  error: null,
});

let latestRequestId = 0;

export const dslDataActions: DSLDataActions = {
  updateNodeVisibility: (nodeId: string, hidden: boolean) => {
    if (!dslDataStore.data?.dsl?.nodes) {
      return;
    }

    const { nodes: updatedNodes, changed } = updateNodeInTree(dslDataStore.data.dsl.nodes, nodeId, (node) => {
      if (node.hidden === hidden) {
        return node;
      }
      return {
        ...node,
        hidden,
      };
    });

    if (!changed) {
      return;
    }

    dslDataStore.data = {
      ...dslDataStore.data,
      dsl: {
        ...dslDataStore.data.dsl,
        nodes: updatedNodes,
      },
    };
  },

  resetAllNodeVisibility: () => {
    if (!dslDataStore.data?.dsl?.nodes) {
      return;
    }

    const { nodes: resetNodes, changed } = resetVisibilityInTree(dslDataStore.data.dsl.nodes);

    if (!changed) {
      return;
    }

    dslDataStore.data = {
      ...dslDataStore.data,
      dsl: {
        ...dslDataStore.data.dsl,
        nodes: resetNodes,
      },
    };
  },

  loadDesign: async (designId: string) => {
    if (designId === dslDataStore.designId && dslDataStore.data && !dslDataStore.error) {
      return;
    }

    const requestId = ++latestRequestId;
    dslDataStore.designId = designId;

    if (!designId) {
      dslDataStore.data = null;
      dslDataStore.error = null;
      dslDataStore.loading = false;
      return;
    }

    dslDataStore.loading = true;
    dslDataStore.error = null;

    try {
      const response = await api.project.document.getContent({ documentId: designId });

      if (requestId !== latestRequestId || dslDataStore.designId !== designId) {
        return;
      }

      if (!response?.data?.data) {
        throw new Error('Invalid response format from API');
      }

      dslDataStore.data = response.data.data;
    } catch (err) {
      if (requestId !== latestRequestId || dslDataStore.designId !== designId) {
        return;
      }

      const error = err instanceof Error ? err : new Error('Failed to fetch DSL data');
      console.error('Failed to fetch DSL data:', err);
      dslDataStore.error = error;
      dslDataStore.data = null;
    } finally {
      if (requestId === latestRequestId && dslDataStore.designId === designId) {
        dslDataStore.loading = false;
      }
    }
  },
};
