import { DSLNode } from '@/types/dsl';
import { AnnotationNode } from '../types/componentDetectionV2';

// 中间层级节点信息（既不是根节点，也不是叶子节点）
export interface IntermediateNodeInfo {
  id: string;
  node: DSLNode;
  name?: string;
  type: string;
  // 绝对位置
  absoluteX: number;
  absoluteY: number;
  width: number;
  height: number;
  // 父节点信息
  parentId?: string;
  parentPath: string[];
  // 子节点 IDs
  childrenIds: string[];
  depth: number; // 节点深度，从根节点算起
}

/**
 * 提取所有中间层级节点（非叶子、非根节点）
 */
export function extractIntermediateNodes(rootNode: DSLNode): IntermediateNodeInfo[] {
  const intermediateNodes: IntermediateNodeInfo[] = [];

  // 递归遍历节点树
  function traverse(
    node: DSLNode,
    parentX: number = 0,
    parentY: number = 0,
    parentPath: string[] = [],
    depth: number = 0
  ) {
    const absoluteX = parentX + (node.layoutStyle?.relativeX || 0);
    const absoluteY = parentY + (node.layoutStyle?.relativeY || 0);
    const width = node.layoutStyle?.width || 0;
    const height = node.layoutStyle?.height || 0;

    const hasChildren = node.children && node.children.length > 0;
    const isRoot = depth === 0;

    // 如果有子节点且不是根节点，则是中间层级节点
    if (hasChildren && !isRoot) {
      const childrenIds = node.children!.map((child) => child.id);

      intermediateNodes.push({
        id: node.id,
        node,
        name: node.name,
        type: node.type,
        absoluteX,
        absoluteY,
        width,
        height,
        parentId: parentPath.length > 0 ? parentPath[parentPath.length - 1] : undefined,
        parentPath: [...parentPath],
        childrenIds,
        depth,
      });
    }

    // 递归处理子节点
    if (hasChildren) {
      node.children!.forEach((child) => {
        traverse(child, absoluteX, absoluteY, [...parentPath, node.id], depth + 1);
      });
    }
  }

  traverse(rootNode);
  return intermediateNodes;
}

/**
 * 根据ID查找中间节点
 */
export function findIntermediateNodeById(
  intermediateNodes: IntermediateNodeInfo[],
  nodeId: string
): IntermediateNodeInfo | undefined {
  return intermediateNodes.find((node) => node.id === nodeId);
}

/**
 * 获取指定节点下的所有叶子节点IDs
 */
export function getLeafNodeIdsUnderNode(node: DSLNode): string[] {
  const leafIds: string[] = [];

  function traverse(currentNode: DSLNode) {
    if (!currentNode.children || currentNode.children.length === 0) {
      // 叶子节点
      leafIds.push(currentNode.id);
    } else {
      // 继续遍历子节点
      currentNode.children.forEach((child) => traverse(child));
    }
  }

  traverse(node);
  return leafIds;
}

// 辅助函数：查找父节点
export function findParent(root: AnnotationNode, childId: string): AnnotationNode | null {
  for (const child of root.children) {
    if (child.id === childId) {
      return root;
    }
    const found = findParent(child, childId);
    if (found) return found;
  }
  return null;
}
