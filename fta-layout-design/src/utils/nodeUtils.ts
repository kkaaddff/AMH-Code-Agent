import type { DSLNode } from '../types/dsl';
import type { LayoutTreeNode } from '../types/layout';

/**
 * 为布局节点生成唯一键，拼接父路径及组件名以标识层级位置。
 * @param node 目标布局节点
 * @param index 节点在当前层级中的索引，默认 0
 * @param parentPath 父节点路径字符串
 * @returns 节点的唯一键值
 */
export const generateNodeKey = (node: LayoutTreeNode, index = 0, parentPath = ''): string => {
  return node.nodeId || `${parentPath ? `${parentPath}/` : ''}${node.componentName}-${index}`;
};

/**
 * 根据节点 ID 在布局树中查找对应节点。
 * @param node 用于搜索的根节点
 * @param targetId 需要查找的目标节点 ID
 * @returns 匹配到的节点，未找到时返回 null
 */
export const findNodeById = (node: LayoutTreeNode, targetId: string): LayoutTreeNode | null => {
  const search = (current: LayoutTreeNode, index = 0, parentPath = ''): LayoutTreeNode | null => {
    const currentId = generateNodeKey(current, index, parentPath);
    if (currentId === targetId) return current;

    return current.children?.find((child, i) => search(child, i, currentId)) || null;
  };

  return search(node);
};

/**
 * 确保 DSL 树中的每个节点拥有唯一 ID，缺失时自动生成。
 * @param node 需要补全 ID 的 DSL 根节点
 * @returns 包含完整 ID 的 DSL 树
 */
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

/**
 * 为布局树中的节点分配全局索引，便于通过键值快速定位。
 * @param node 布局树根节点
 * @returns 键值到索引的映射表
 */
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

/**
 * 根据节点 ID 更新布局树中的节点属性。
 * @param node 布局树根节点
 * @param targetId 需要更新的目标节点 ID
 * @param updates 要合并的节点属性
 * @returns 更新后的布局树
 */
export const updateNodeById = (
  node: LayoutTreeNode,
  targetId: string,
  updates: Partial<LayoutTreeNode>
): LayoutTreeNode => {
  const updateNode = (currentNode: LayoutTreeNode): LayoutTreeNode => {
    if (currentNode.nodeId === targetId) {
      return { ...currentNode, ...updates };
    }
    return currentNode.children ? { ...currentNode, children: currentNode.children.map(updateNode) } : currentNode;
  };

  return updateNode(node);
};
