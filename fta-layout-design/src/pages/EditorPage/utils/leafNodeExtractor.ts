import { DSLNode } from '@/types/dsl';
import { LeafNodeInfo } from '../types/componentDetectionV2';

/**
 * Check if a node is a leaf node (no children or empty children)
 */
export function isLeafNode(node: DSLNode): boolean {
  return !node.children || node.children.length === 0;
}

/**
 * Calculate absolute position from relative coordinates
 */
function calculateAbsolutePosition(
  node: DSLNode,
  parentX: number = 0,
  parentY: number = 0
): { x: number; y: number; width: number; height: number } {
  const relativeX = node.layoutStyle?.relativeX || 0;
  const relativeY = node.layoutStyle?.relativeY || 0;
  const width = node.layoutStyle?.width || 0;
  const height = node.layoutStyle?.height || 0;

  return {
    x: parentX + relativeX,
    y: parentY + relativeY,
    width,
    height,
  };
}

/**
 * Extract all leaf nodes from DSL tree with calculated absolute positions
 */
export function extractLeafNodes(rootNode: DSLNode): LeafNodeInfo[] {
  const leafNodes: LeafNodeInfo[] = [];

  function traverse(
    node: DSLNode,
    parentX: number = 0,
    parentY: number = 0,
    parentPath: string[] = [],
    parentId?: string
  ): void {
    const position = calculateAbsolutePosition(node, parentX, parentY);

    // If this is a leaf node, add it to the list
    if (isLeafNode(node)) {
      leafNodes.push({
        id: node.id,
        node,
        name: node.name,
        type: node.type,
        absoluteX: position.x,
        absoluteY: position.y,
        width: position.width,
        height: position.height,
        parentId,
        parentPath: [...parentPath],
      });
    } else {
      // Recursively process children
      node.children?.forEach((child) => {
        traverse(
          child,
          position.x,
          position.y,
          [...parentPath, node.id],
          node.id
        );
      });
    }
  }

  // Start traversal from root
  traverse(rootNode);

  return leafNodes;
}

/**
 * Calculate bounding box that encompasses multiple leaf nodes
 */
export function calculateBoundingBox(nodes: LeafNodeInfo[]): {
  x: number;
  y: number;
  width: number;
  height: number;
} {
  if (nodes.length === 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  if (nodes.length === 1) {
    const node = nodes[0];
    return {
      x: node.absoluteX,
      y: node.absoluteY,
      width: node.width,
      height: node.height,
    };
  }

  // Calculate min/max bounds
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  nodes.forEach((node) => {
    minX = Math.min(minX, node.absoluteX);
    minY = Math.min(minY, node.absoluteY);
    maxX = Math.max(maxX, node.absoluteX + node.width);
    maxY = Math.max(maxY, node.absoluteY + node.height);
  });

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

/**
 * Find a leaf node by its ID
 */
export function findLeafNodeById(
  leafNodes: LeafNodeInfo[],
  nodeId: string
): LeafNodeInfo | undefined {
  return leafNodes.find((node) => node.id === nodeId);
}

