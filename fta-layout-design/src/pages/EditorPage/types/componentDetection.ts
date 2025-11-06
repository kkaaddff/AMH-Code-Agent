import { DSLNode } from '@/types/dsl';
import { LABEL_STYLES } from '../constants/CanvasConstant';
import { LayoutTreeNode } from '@/types/layout';

// 节点类型枚举
export enum NodeType {
  ANNOTATION = 'annotation', // 已标注节点
  DSL = 'dsl', // DSL节点（未标注）
}

// 选择节点项
export interface SelectedNodeItem {
  id: string;
  type: NodeType;
}

// 布局属性
export interface LayoutProperties {
  width?: number;
  height?: number;
  position?: string;
  flexDirection?: string;
  alignItems?: string;
  justifyContent?: string;
  flex?: number;
  gap?: number;
  padding?: string;
  margin?: string;
  backgroundColor?: string;
  borderRadius?: string;
}

// 标注节点结构
export interface AnnotationNode {
  id: string;
  dslNodeId: string; // 对应的DSL节点ID
  dslNode: DSLNode | null; // DSL节点引用
  ftaComponent: string; // FTA组件类型
  isRoot: boolean; // 是否为根节点
  isMainPage: boolean; // 是否为主页面
  isContainer: boolean; // 是否为容器组件
  name?: string; // 组件实例名称
  comment?: string; // 组件说明
  children: AnnotationNode[]; // 子组件
  absoluteX: number;
  absoluteY: number;
  width: number;
  height: number;
  layout?: LayoutProperties;
  props?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

// Context状态
export interface AnnotationState {
  rootAnnotation: AnnotationNode | null; // 页面根节点
  annotations: AnnotationNode[]; // 所有标注（扁平化列表，方便查找）
  selectedAnnotationId: string | null; // 选中的标注ID
  hoveredAnnotationId: string | null; // hover的标注ID
  selectedDSLNodeId: string | null; // 选中的DSL节点ID（未标注的）
  hoveredDSLNodeId: string | null; // hover的DSL节点ID
  expandedKeys: string[]; // Tree展开的节点keys
  isLoading: boolean;
}

// 组件类型分类
export enum ComponentCategory {
  ATOMIC = 'atomic', // 基础原子组件（完整组件）
  SLOT = 'slot', // 带插槽组件（容器组件）
  BUSINESS = 'business', // 业务组件（完整组件）
  CONTAINER = 'container', // 基础容器（容器组件）
}

// 判断是否为容器组件的辅助函数
export function isContainerComponent(ftaComponent: string): boolean {
  const containerComponents = [
    'Card',
    'ListItem',
    'NavBar',
    'FormItem',
    'Input',
    'Search',
    'Collapse',
    'Timeline.Item',
    'Result',
    'Modal',
    'Container',
    'Flex',
    'Grid',
  ];
  return containerComponents.includes(ftaComponent);
}

// 获取组件类型分类
export function getComponentCategory(ftaComponent: string): ComponentCategory {
  const atomicComponents = [
    'Button',
    'Icon',
    'Text',
    'Avatar',
    'Badge',
    'Tag',
    'Image',
    'ProgressBar',
    'CircularProgress',
    'InputNumber',
    'Radio',
    'Toggle',
    'Divider',
    'Loading',
  ];

  const slotComponents = [
    'Card',
    'ListItem',
    'NavBar',
    'FormItem',
    'Input',
    'Search',
    'Collapse',
    'Timeline.Item',
    'Result',
    'Modal',
  ];

  const businessComponents = [
    'AddressPicker',
    'CarKeyboard',
    'ImageUpload',
    'Calendar',
    'Cascader',
    'SelectorCore',
    'InfiniteScroll',
    'Lottie',
  ];

  const containerComponents = ['Container', 'Flex', 'Grid'];

  if (atomicComponents.includes(ftaComponent)) return ComponentCategory.ATOMIC;
  if (slotComponents.includes(ftaComponent)) return ComponentCategory.SLOT;
  if (businessComponents.includes(ftaComponent)) return ComponentCategory.BUSINESS;
  if (containerComponents.includes(ftaComponent)) return ComponentCategory.CONTAINER;

  return ComponentCategory.ATOMIC; // default
}

export type LabelStyle = (typeof LABEL_STYLES)[keyof typeof LABEL_STYLES];

export type LabelInstruction = {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  style: LabelStyle;
  backgroundColor: string;
};

// Component mapping (confirmed or pending)
export interface ComponentMapping {
  id: string; // Unique mapping ID
  nodeIds: string[]; // One or more DSL node IDs (grouped components)
  ftaComponent: string; // FTA component type
  name?: string; // Component instance name
  comment?: string; // Component comment/description

  // Position and size (calculated from nodeIds)
  absoluteX: number;
  absoluteY: number;
  width: number;
  height: number;

  // Layout properties
  layout?: LayoutTreeNode['layout'];

  // Component props
  props?: Record<string, any>;

  // Recognition metadata
  confidence?: number; // AI confidence if recognized
  isConfirmed: boolean; // User has confirmed this mapping
  isManuallyAdjusted: boolean; // User modified the AI suggestion

  // Original nodes (for grouped components)
  originChildren?: LeafNodeInfo[];

  // Timestamps
  createdAt: number;
  updatedAt: number;
}

// Leaf node information with calculated absolute position
export interface LeafNodeInfo {
  id: string; // DSL node ID
  node: DSLNode; // Original DSL node
  name?: string; // Node name
  type: string; // Node type (TEXT, PATH, LAYER, etc.)
  // Absolute position calculated from tree
  absoluteX: number;
  absoluteY: number;
  width: number;
  height: number;
  // Parent information
  parentId?: string;
  parentPath: string[]; // Array of parent IDs from root to this node
}

// AI recognition result
export interface AIRecognitionResult {
  nodeId: string; // DSL node ID
  ftaComponent: string; // FTA component name (e.g., "Button", "Input")
  confidence: number; // 0-1 (0.6-0.95 for recognized)
  properties?: Record<string, any>; // Suggested properties
}
