import { DSLNode } from '@fta/shared';
import type { LayoutTreeNode } from '@/types/layout';
import type { AnnotationNode } from '@fta/shared';
import { LABEL_STYLES } from '../constants/CanvasConstant';

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
