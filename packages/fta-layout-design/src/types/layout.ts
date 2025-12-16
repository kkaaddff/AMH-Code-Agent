// Layout Tree 数据类型定义
export interface LayoutTreeNode {
  nodeId?: string;

  componentName: string;
  comment?: string;
  layout?: {
    flexDirection?: 'row' | 'column';
    width?: number;
    borderRadius?: string;
    height?: number;
    backgroundColorToken?: string;
    backgroundColor?: string;
    alignItems?: string;
    flex?: number;
    margin?: string;
    position?: string;
    bottom?: number;
    // Additional layout properties for component detection
    padding?: string;
    justifyContent?: string;
    gap?: number;
    top?: number;
    left?: number;
    right?: number;
  };
  props?: {
    content?: string;
    fontSize?: number;
    color?: string;
    name?: string;
    placeholder?: string;
    selected?: boolean;
  };
  children?: LayoutTreeNode[];
  
  // Component detection related fields
  ftaComponentId?: string; // FTA component mapping ID
  dslNodeId?: string; // Original DSL node ID
  confidence?: number; // AI recognition confidence (0-1)
  originChildren?: any[]; // Original leaf nodes for grouped components
}

export interface LayoutTreeData {
  nodeId?: string;
  componentName: string;
  layout?: LayoutTreeNode['layout'];
  children?: LayoutTreeNode[];
}

// 选择状态管理
export interface SelectionState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
}
