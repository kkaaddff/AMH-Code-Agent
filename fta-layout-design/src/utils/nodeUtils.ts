import type { DSLNode } from '../types/dsl';
import type { LayoutTreeNode } from '../types/layout';

export const generateNodeKey = (node: LayoutTreeNode, index = 0, parentPath = ''): string => {
  return node.nodeId || `${parentPath ? `${parentPath}/` : ''}${node.componentName}-${index}`;
};

export const findNodeById = (node: LayoutTreeNode, targetId: string): LayoutTreeNode | null => {
  const search = (current: LayoutTreeNode, index = 0, parentPath = ''): LayoutTreeNode | null => {
    const currentId = generateNodeKey(current, index, parentPath);
    if (currentId === targetId) return current;

    return current.children?.find((child, i) => search(child, i, currentId)) || null;
  };

  return search(node);
};
export const ensureNodeIds = (node: DSLNode): DSLNode => {
  const usedIds = new Set<string>();
  let idCounter = 1;

  const collectExistingIds = (current: DSLNode): void => {
    current.id && usedIds.add(current.id);
    current.children?.forEach(collectExistingIds);
  };

  const generateUniqueId = (): string => {
    let id = `${Math.floor(Math.random() * 9000) + 1000}:${String(idCounter).padStart(5, '0')}`;
    while (usedIds.has(id)) {
      idCounter++;
      id = `${Math.floor(Math.random() * 9000) + 1000}:${String(idCounter).padStart(5, '0')}`;
    }
    usedIds.add(id);
    idCounter++;
    return id;
  };

  const processNode = (current: DSLNode): DSLNode => ({
    ...current,
    id: current.id || generateUniqueId(),
    children: current.children?.map(processNode),
  });

  collectExistingIds(node);
  return processNode(node);
};

export const assignNodeIndexes = (node: LayoutTreeNode): Map<string, number> => {
  const indexMap = new Map<string, number>();
  let globalIndex = 0;

  const traverse = (current: LayoutTreeNode): void => {
    indexMap.set(generateNodeKey(current, globalIndex), globalIndex++);
    current.children?.forEach(traverse);
  };

  traverse(node);
  return indexMap;
};

export const updateNodeById = (
  node: LayoutTreeNode,
  targetId: string,
  updates: Partial<LayoutTreeNode>
): LayoutTreeNode => {
  const updateNode = (currentNode: LayoutTreeNode): LayoutTreeNode => {
    if (currentNode.nodeId === targetId) {
      return { ...currentNode, ...updates };
    }

    return currentNode.children
      ? { ...currentNode, children: currentNode.children.map(updateNode) }
      : currentNode;
  };

  return updateNode(node);
};
