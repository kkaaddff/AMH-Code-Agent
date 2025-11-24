// Shared DSL data model definitions used by backend, frontend, and agent-core.

export interface StyleValue {
  family?: string;
  size?: number;
  style?: string;
  decoration?: string;
  case?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

export interface ImageValue {
  url: string;
  filters?: string;
}

export interface DSLStyle {
  value: any;
  token?: string;
}

export interface DSLStyles {
  [key: string]: DSLStyle;
}

export type DSLNodeType = 'FRAME' | 'INSTANCE' | 'TEXT' | 'PATH' | 'GROUP' | 'LAYER';

export interface DSLLayoutStyle {
  width?: number;
  height?: number;
  relativeX?: number;
  relativeY?: number;
  rotate?: number;
}

export interface DSLBaseNode {
  type: DSLNodeType;
  id: string;
  name?: string;
  hidden?: boolean;
  layoutStyle?: DSLLayoutStyle;
  opacity?: number | string;
  mask?: string;
  children?: DSLNode[];
}

export interface DSLFrameNode extends DSLBaseNode {
  type: 'FRAME';
  fill?: string;
  strokeColor?: string;
  strokeWidth?: string;
  strokeType?: string;
  strokeAlign?: string;
  flexContainerInfo?: {
    flexDirection?: 'row' | 'column';
    alignItems?: string;
    justifyContent?: string;
    mainSizing?: string;
    crossSizing?: string;
    gap?: number | string;
    padding?: number | string;
  };
  flexGrow?: number;
  overflow?: string;
  borderRadius?: string;
}

export interface DSLInstanceNode extends DSLBaseNode {
  type: 'INSTANCE';
  componentId: string;
  componentInfo?: {
    properties?: Record<string, string>;
  };
}

export interface DSLTextSpan {
  text: string;
  font: string;
}

export interface DSLTextColorStop {
  start: number;
  end: number;
  color: string;
}

export interface DSLTextNode extends DSLBaseNode {
  type: 'TEXT';
  text: DSLTextSpan[];
  textColor: DSLTextColorStop[];
  textAlign: 'left' | 'center' | 'right';
  textMode: string;
  flexGrow?: number;
  flexShrink?: number;
}

export interface DSLPathItem {
  fill?: string;
  data: string;
}

export interface DSLPathNode extends DSLBaseNode {
  type: 'PATH';
  path: DSLPathItem[];
  opacity?: number;
}

export interface DSLGroupNode extends DSLBaseNode {
  type: 'GROUP';
  children: DSLNode[];
}

export interface DSLLayerNode extends DSLBaseNode {
  type: 'LAYER';
  fill?: string;
  borderRadius?: string;
  opacity?: number;
  strokeColor?: string;
  strokeType?: string;
  strokeAlign?: string;
  strokeWidth?: string;
  effect?: string;
}

export type DSLNode =
  | DSLFrameNode
  | DSLInstanceNode
  | DSLTextNode
  | DSLPathNode
  | DSLGroupNode
  | DSLLayerNode
  | DSLBaseNode;

export interface DSLData {
  styles: DSLStyles;
  nodes: DSLNode[];
}

export interface DesignDSL {
  dsl: DSLData;
}

// Path-to-layer conversion helper type kept for DSL conversion utilities.
export interface LayerStyle {
  value: ImageValue[];
  token: string;
}

// Compatibility aliases for legacy names inside existing packages.
export type LayoutStyle = DSLLayoutStyle;
export type BaseNode = DSLBaseNode;
export type FrameNode = DSLFrameNode;
export type InstanceNode = DSLInstanceNode;
export type TextNode = DSLTextNode;
export type PathItem = DSLPathItem;
export type PathNode = DSLPathNode;
export type GroupNode = DSLGroupNode;
export type LayerNode = DSLLayerNode;
export type DesignNode = DSLNode;
