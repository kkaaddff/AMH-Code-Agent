// DSL 数据类型定义
export interface DSLStyle {
  value: any;
  token?: string;
}

export interface DSLStyles {
  [key: string]: DSLStyle;
}

export type DSLNodeType = 'FRAME' | 'INSTANCE' | 'TEXT' | 'PATH' | 'GROUP' | 'LAYER';

export interface DSLBaseNode {
  type: DSLNodeType;
  id: string;
  name?: string;
  hidden?: boolean;
  layoutStyle?: {
    width?: number;
    height?: number;
    relativeX?: number;
    relativeY?: number;
    rotate?: number;
  };
  opacity?: number | string;
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

export interface DSLTextNode extends DSLBaseNode {
  type: 'TEXT';
  text: Array<{
    text: string;
    font: string;
  }>;
  textColor: Array<{
    start: number;
    end: number;
    color: string;
  }>;
  textAlign: 'left' | 'center' | 'right';
  textMode: string;
  flexGrow?: number;
  flexShrink?: number;
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

export interface DSLPathNode extends DSLBaseNode {
  type: 'PATH';
  path: Array<{
    fill?: string;
    data: string;
  }>;
  opacity?: number;
}

export type DSLNode = DSLFrameNode | DSLInstanceNode | DSLTextNode | DSLLayerNode | DSLPathNode | DSLBaseNode;

export interface DSLData {
  dsl: {
    styles: DSLStyles;
    nodes: DSLNode[];
  };
}
