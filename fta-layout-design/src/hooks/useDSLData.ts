import { useState, useEffect, useCallback } from 'react';
import { DSLData, DSLNode } from '../types/dsl';
import { api } from '@/utils/apiService';

interface UseDSLDataOptions {
  designId?: string | null;
}

interface UseDSLDataResult {
  data: DSLData | null;
  loading: boolean;
  error: Error | null;
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

export const useDSLData = (options?: UseDSLDataOptions): UseDSLDataResult => {
  const { designId } = options || {};
  const [data, setData] = useState<DSLData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const updateNodeVisibility = useCallback((nodeId: string, hidden: boolean) => {
    setData((prev) => {
      if (!prev) return prev;

      const originalNodes = prev.dsl.nodes || [];
      const { nodes: updatedNodes, changed } = updateNodeInTree(originalNodes, nodeId, (node) => {
        if (node.hidden === hidden) {
          return node;
        }
        return {
          ...node,
          hidden,
        };
      });

      if (!changed) {
        return prev;
      }

      return {
        ...prev,
        dsl: {
          ...prev.dsl,
          nodes: updatedNodes,
        },
      };
    });
  }, []);

  const resetAllNodeVisibility = useCallback(() => {
    setData((prev) => {
      if (!prev) return prev;

      const originalNodes = prev.dsl.nodes || [];
      const { nodes: resetNodes, changed } = resetVisibilityInTree(originalNodes);

      if (!changed) {
        return prev;
      }

      return {
        ...prev,
        dsl: {
          ...prev.dsl,
          nodes: resetNodes,
        },
      };
    });
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      if (!designId) {
        // 没有提供 designId，直接返回
        setLoading(false);
        return;
      }

      try {
        // 根据 designId 从 API 获取数据
        const response = await api.project.document.getContent({ documentId: designId });
        if (response?.data?.data) {
          setData(response.data.data);
        } else {
          console.error('Invalid response format from API');
          setError(new Error('Invalid response format from API'));
        }
      } catch (err) {
        console.error('Failed to fetch DSL data:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch DSL data'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [designId]);

  return { data, loading, error, updateNodeVisibility, resetAllNodeVisibility };
};
