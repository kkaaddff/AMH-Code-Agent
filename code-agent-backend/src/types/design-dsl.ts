// DesignDSL 数据类型定义

// 保留用于特定转换逻辑的类型
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

// DSL 样式定义（与前端保持一致）
export interface DSLStyle {
  value: any;
  token?: string;
}

export interface DSLStyles {
  [key: string]: DSLStyle;
}

// 节点类型
export type DSLNodeType = 'FRAME' | 'INSTANCE' | 'TEXT' | 'PATH' | 'GROUP' | 'LAYER';

// 布局样式
export interface LayoutStyle {
  width?: number;
  height?: number;
  relativeX?: number;
  relativeY?: number;
  rotate?: number;
}

// 基础节点
export interface BaseNode {
  type: DSLNodeType;
  id: string;
  name?: string;
  hidden?: boolean;
  layoutStyle?: LayoutStyle;
  opacity?: number | string;
  mask?: string;
  children?: DesignNode[];
}

// FRAME 节点
export interface FrameNode extends BaseNode {
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

// INSTANCE 节点
export interface InstanceNode extends BaseNode {
  type: 'INSTANCE';
  componentId: string;
  componentInfo?: {
    properties?: Record<string, string>;
  };
}

// TEXT 节点
export interface TextNode extends BaseNode {
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

// PATH 节点
export interface PathItem {
  fill?: string;
  data: string;
}

export interface PathNode extends BaseNode {
  type: 'PATH';
  path: PathItem[];
  opacity?: number;
}

// GROUP 节点
export interface GroupNode extends BaseNode {
  type: 'GROUP';
  children: DesignNode[];
}

// LAYER 节点
export interface LayerNode extends BaseNode {
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

// 节点联合类型
export type DesignNode = FrameNode | InstanceNode | TextNode | PathNode | GroupNode | LayerNode | BaseNode;

// DSL 数据结构
export interface DSLData {
  styles: DSLStyles;
  nodes: DesignNode[];
}

export interface DesignDSL {
  dsl: DSLData;
}

// 转换后的 LAYER 类型（保留用于特定转换逻辑）
export interface LayerStyle {
  value: ImageValue[];
  token: string;
}
