import { LayoutTreeNode } from '../types/layout';
import { DSLNode } from '../types/dsl';

// 创建LayoutTree nodeId 到 DSL nodeId 的映射关系
export interface NodeIdMapping {
  layoutToDS: Map<string, string>;
  dslToLayout: Map<string, string>;
}

// 递归构建nodeId映射关系
const buildNodeIdMapping = (
  layoutNode: LayoutTreeNode, 
  dslNode: DSLNode,
  mapping: NodeIdMapping,
  layoutPath: string = '',
  dslPath: string = ''
): void => {
  // 建立当前节点的映射关系
  const layoutNodeId = layoutNode.nodeId || `${layoutPath}_${layoutNode.componentName}`;
  const dslNodeId = dslNode.id;
  
  mapping.layoutToDS.set(layoutNodeId, dslNodeId);
  mapping.dslToLayout.set(dslNodeId, layoutNodeId);
  
  // 递归处理子节点
  if (layoutNode.children && 'children' in dslNode && dslNode.children) {
    const layoutChildren = layoutNode.children;
    const dslChildren = dslNode.children as DSLNode[];
    
    // 按照同样的顺序遍历子节点
    for (let i = 0; i < Math.min(layoutChildren.length, dslChildren.length); i++) {
      buildNodeIdMapping(
        layoutChildren[i],
        dslChildren[i],
        mapping,
        `${layoutPath}/${i}`,
        `${dslPath}/${i}`
      );
    }
  }
};

// 创建nodeId映射
export const createNodeIdMapping = (
  layoutData: LayoutTreeNode,
  dslData: { dsl: { nodes: DSLNode[] } }
): NodeIdMapping => {
  const mapping: NodeIdMapping = {
    layoutToDS: new Map(),
    dslToLayout: new Map()
  };
  
  if (dslData.dsl.nodes.length > 0) {
    buildNodeIdMapping(layoutData, dslData.dsl.nodes[0], mapping);
  }
  
  return mapping;
};

// 根据LayoutTree的nodeId获取对应的DSL nodeId
export const getDSLNodeId = (mapping: NodeIdMapping, layoutNodeId: string): string | null => {
  return mapping.layoutToDS.get(layoutNodeId) || null;
};

// 根据DSL的nodeId获取对应的LayoutTree nodeId  
export const getLayoutNodeId = (mapping: NodeIdMapping, dslNodeId: string): string | null => {
  return mapping.dslToLayout.get(dslNodeId) || null;
};