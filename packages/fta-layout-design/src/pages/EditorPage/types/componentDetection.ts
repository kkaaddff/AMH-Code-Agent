import type { DSLNode } from '@/types/dsl';
import type { LayoutTreeNode } from '@/types/layout';
import type { AnnotationNode } from '@fta/shared';
import { LABEL_STYLES } from '../constants/CanvasConstant';

export type { AnnotationNode } from '@fta/shared';

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

// Context状态
export interface AnnotationState {
  rootAnnotation: AnnotationNode | null; // 页面根节点
  selectedAnnotation: AnnotationNode | null; // 选中的标注
  hoveredAnnotation: AnnotationNode | null; // hover的标注
  selectedDSLNode: DSLNode | null; // 选中的DSL节点（未标注的）
  hoveredDSLNode: DSLNode | null; // hover的DSL节点
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
  // 包含 SLOT + CONTAINER 类型组件（可包含子元素）
  const containerComponents = [
    // SLOT 组件
    'ActionSheet',
    'AnimatedResult',
    'AnimatedSlideinout',
    'BottomTips',
    'Card',
    'Captcha',
    'Collapse',
    'Coupon',
    'Curtain',
    'Drawer',
    'Dropdown',
    'FloatingBubble',
    'FloatingPanel',
    'Form',
    'IndexBar',
    'Input',
    'InputNumber',
    'Intro',
    'Keyboard',
    'List',
    'Modal',
    'NavBar',
    'NoticeBar',
    'Overlay',
    'Password',
    'Picker',
    'Popover',
    'Protocol',
    'PullToRefresh',
    'Result',
    'SafeArea',
    'Search',
    'Selector',
    'Steps',
    'Style',
    'SwipeAction',
    'Swiper',
    'TabBar',
    'Tabs',
    'Textarea',
    'Timeline',
    'Toast',
    'Tooltip',
    'OptionSelect',
    // CONTAINER 组件
    'Flex',
    'FlexScrollView',
    'Gradient',
    'Grid',
    'View',
  ];
  return containerComponents.includes(ftaComponent);
}

// 获取组件类型分类
export function getComponentCategory(ftaComponent: string): ComponentCategory {
  // 基础原子组件（完整组件，不需要子元素）
  const atomicComponents = [
    'Avatar',
    'Badge',
    'Button',
    'CheckBox',
    'CircularProgress',
    'CountDown',
    'DashedLine',
    'Divider',
    'Empty',
    'Gap',
    'Icon',
    'Image',
    'ImageBackground',
    'Line',
    'Loading',
    'LoadingImage',
    'PageIndicator',
    'ProgressBar',
    'Radio',
    'Rate',
    'RichText',
    'Skeleton',
    'Slider',
    'Tag',
    'Text',
    'Toggle',
    'Typography',
  ];

  // 带插槽组件（容器组件，可包含特定插槽内容）
  const slotComponents = [
    'ActionSheet',
    'AnimatedResult',
    'AnimatedSlideinout',
    'BottomTips',
    'Card',
    'Captcha',
    'Collapse',
    'Coupon',
    'Curtain',
    'Drawer',
    'Dropdown',
    'FloatingBubble',
    'FloatingPanel',
    'Form',
    'IndexBar',
    'Input',
    'InputNumber',
    'Intro',
    'Keyboard',
    'List',
    'Modal',
    'NavBar',
    'NoticeBar',
    'Overlay',
    'Password',
    'Picker',
    'Popover',
    'Protocol',
    'PullToRefresh',
    'Result',
    'RichText',
    'SafeArea',
    'Search',
    'Selector',
    'Steps',
    'Style',
    'SwipeAction',
    'Swiper',
    'TabBar',
    'Tabs',
    'Textarea',
    'Timeline',
    'Toast',
    'Tooltip',
    'OptionSelect',
  ];

  // 业务组件（完整组件，业务相关）
  const businessComponents = [
    'AddressPicker',
    'Calendar',
    'Carkeyboard',
    'Cascader',
    'ImageUpload',
    'InfiniteScroll',
    'IntersectionObserver',
    'Layer',
    'LazyList',
    'Lottie',
    'Native',
    'ScrollHelper',
  ];

  // 基础容器（布局容器组件）
  const containerComponents = ['Flex', 'FlexScrollView', 'Gradient', 'Grid', 'View'];

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
