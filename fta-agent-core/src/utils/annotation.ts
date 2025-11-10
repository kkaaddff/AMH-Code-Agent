// DSL 数据类型定义
interface DSLStyle {
  value: any;
  token?: string;
}

interface DSLStyles {
  [key: string]: DSLStyle;
}

type DSLNodeType = 'FRAME' | 'INSTANCE' | 'TEXT' | 'PATH' | 'GROUP' | 'LAYER';

interface DSLBaseNode {
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

interface DSLFrameNode extends DSLBaseNode {
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

interface DSLInstanceNode extends DSLBaseNode {
  type: 'INSTANCE';
  componentId: string;
  componentInfo?: {
    properties?: Record<string, string>;
  };
}

interface DSLTextNode extends DSLBaseNode {
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

interface DSLLayerNode extends DSLBaseNode {
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

interface DSLPathNode extends DSLBaseNode {
  type: 'PATH';
  path: Array<{
    fill?: string;
    data: string;
  }>;
  opacity?: number;
}

type DSLNode = DSLFrameNode | DSLInstanceNode | DSLTextNode | DSLLayerNode | DSLPathNode | DSLBaseNode;

export interface DSLData {
  dsl: {
    styles: DSLStyles;
    nodes: DSLNode[];
  };
}

interface LayoutProperties {
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

interface AnnotationNodeSummary {
  id: string;
  name?: string;
  component?: string;
  isContainer?: boolean;
  depth: number;
  childCount: number;
  width?: number;
  height?: number;
}

/**
 * 将标注节点概要信息格式化为易读的多行文本。
 * @param nodes 标注节点概要列表
 * @returns 适合传给模型的文本摘要
 */
export function formatAnnotationSummary(nodes: AnnotationNodeSummary[]): string {
  if (!nodes.length) {
    return '当前标注树为空，模型需要自行根据设计描述补充组件结构。';
  }

  const lines: string[] = [];
  nodes.forEach((node) => {
    const indent = '  '.repeat(Math.max(node.depth - 1, 0));
    const labelParts = [
      `[${node.id}]`,
      node.name ?? '未命名节点',
      node.component ? `<${node.component}>` : '',
      node.isContainer ? '(容器)' : '',
    ].filter(Boolean);
    const metrics =
      node.width && node.height ? `尺寸：${Math.round(node.width)}×${Math.round(node.height)}` : undefined;
    const childInfo = node.childCount ? `子节点：${node.childCount}` : undefined;
    const info = [metrics, childInfo].filter(Boolean).join('，');
    lines.push(`${indent}- ${labelParts.join(' ')}${info ? `（${info}）` : ''}`);
  });
  return lines.join('\n');
}

/**
 * 将标注树拍平为节点概要列表，保留层级信息。
 * @param root 根标注节点
 * @returns 拍平后的节点概要数组
 */
export function flattenAnnotation(root?: AnnotationNode): AnnotationNodeSummary[] {
  if (!root || typeof root !== 'object') {
    return [];
  }

  const summaries: AnnotationNodeSummary[] = [];
  const visit = (node: AnnotationNode, depth: number) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    const children = Array.isArray(node.children) ? node.children : [];
    summaries.push({
      id: String(node.id ?? node.dslNodeId ?? `node-${summaries.length}`),
      name: typeof node.name === 'string' && node.name.length ? node.name : undefined,
      component: typeof node.ftaComponent === 'string' && node.ftaComponent.length ? node.ftaComponent : undefined,
      isContainer: Boolean(node.isContainer),
      depth,
      childCount: children.length,
      width: typeof node.width === 'number' ? node.width : undefined,
      height: typeof node.height === 'number' ? node.height : undefined,
    });
    children.forEach((child) => visit(child, depth + 1));
  };

  visit(root, 0);
  return summaries;
}
