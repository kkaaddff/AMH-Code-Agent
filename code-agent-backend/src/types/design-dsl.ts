// DesignDSL 数据类型定义

export interface StyleValue {
  family?: string
  size?: number
  style?: string
  decoration?: string
  case?: string
  lineHeight?: string
  letterSpacing?: string
}

export interface ImageValue {
  url: string
  filters?: string
}

export interface Style {
  value: string[] | StyleValue | ImageValue[]
  token?: string
}

export interface PathItem {
  fill: string
  data: string
}

export interface LayoutStyle {
  width: number
  height: number
  relativeX: number
  relativeY: number
}

export interface BaseNode {
  type: string
  id: string
  name: string
  layoutStyle: LayoutStyle
}

export interface PathNode extends BaseNode {
  type: 'PATH'
  path: PathItem[]
}

export interface GroupNode extends BaseNode {
  type: 'GROUP'
  children: DesignNode[]
}

export interface FrameNode extends BaseNode {
  type: 'FRAME'
  children?: DesignNode[]
}

export type DesignNode = PathNode | GroupNode | FrameNode | LayerNode

export interface DSLData {
  styles: Record<string, Style>
  nodes: DesignNode[]
}

export interface DesignDSL {
  dsl: DSLData
}

// 转换后的 LAYER 类型
export interface LayerStyle {
  value: ImageValue[]
  token: string
}

export interface LayerNode extends BaseNode {
  type: 'LAYER'
  fill: string
}
