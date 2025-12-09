import type { DSLNode } from '@fta/shared';

/**
 * 判断节点是否为隐藏节点
 * @param node DSL节点
 * @returns 如果节点为 hidden 或 mask 为 'outline' 则返回 true
 */
export const isNodeHidden = (node: DSLNode): boolean => {
  return node.hidden || node.mask === 'outline';
};

/**
 * 判断节点是否为可见节点
 * @param node DSL节点
 * @returns 如果节点不为 hidden 且 mask 不为 'outline' 则返回 true
 */
export const isNodeVisible = (node: DSLNode): boolean => {
  return !isNodeHidden(node);
};
