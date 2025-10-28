import { LayoutTreeNode } from '../types/layout';
import { DSLData, DSLNode, DSLFrameNode, DSLTextNode, DSLLayerNode } from '../types/dsl';

const createDefaultStyles = () => ({
  'paint_1:0131': { value: ['rgb(245, 245, 245)'] },
  'paint_1:890': { value: ['rgb(255, 255, 255)'] },
  'paint_1:0020': { value: ['rgb(255, 112, 0)'] },
  'paint_1:796': { value: ['rgb(26, 26, 26)'] },
  'paint_1:0470': { value: ['rgb(102, 102, 102)'] },
  'paint_1:0301': { value: ['rgb(153, 153, 153)'] },
  'paint_1:03565': { value: ['rgb(255, 240, 230)'] },
  'paint_1:0414': { value: ['rgb(249, 249, 249)'] },
  'font_1:976': {
    value: { family: 'PingFang SC', size: 36, style: '中黑体', decoration: 'none', lineHeight: '50', letterSpacing: 'auto' }
  },
  'font_1:0284': {
    value: { family: 'PingFang SC', size: 28, style: '常规体', decoration: 'none', lineHeight: '40', letterSpacing: 'auto' }
  },
  'font_1:6184': {
    value: { family: 'PingFang SC', size: 20, style: '常规体', decoration: 'none', lineHeight: '28', letterSpacing: 'auto' }
  },
  'font_1:0821': {
    value: { family: 'PingFang SC', size: 24, style: '常规体', decoration: 'none', lineHeight: '34', letterSpacing: 'auto' }
  },
  'font_1:2202': {
    value: { family: 'PingFang SC', size: 22, style: '常规体', decoration: 'none', lineHeight: '30', letterSpacing: 'auto' }
  },
});

const getFontStyle = (fontSize: number): string => {
  if (fontSize >= 36) return 'font_1:976';
  if (fontSize >= 28) return 'font_1:0284';
  if (fontSize >= 24) return 'font_1:0821';
  if (fontSize >= 22) return 'font_1:2202';
  return 'font_1:6184';
};

const getPaintStyle = (color: string): string => {
  const colorMap: { [key: string]: string } = {
    'rgb(255, 255, 255)': 'paint_1:890', 'rgb(255, 112, 0)': 'paint_1:0020', 'rgb(26, 26, 26)': 'paint_1:796',
    'rgb(102, 102, 102)': 'paint_1:0470', 'rgb(153, 153, 153)': 'paint_1:0301', 'rgb(245, 245, 245)': 'paint_1:0131',
    'rgb(255, 240, 230)': 'paint_1:03565', 'rgb(249, 249, 249)': 'paint_1:0414',
  };
  return colorMap[color] || 'paint_1:796';
};

const createBaseNode = (node: LayoutTreeNode, index: number) => ({
  id: node.nodeId || `generated_${node.componentName}_${index}`,
  name: node.componentName,
  layoutStyle: {
    width: node.layout?.width,
    height: node.layout?.height,
    relativeX: 0,
    relativeY: 0,
  },
  opacity: 1,
});

const createTextChild = (text: string, color: string, fontSize: number, nodeId: string) => ({
  id: `${nodeId}_text`,
  name: 'Text',
  type: 'TEXT' as const,
  text: [{ text, font: getFontStyle(fontSize) }],
  textColor: [{ color: getPaintStyle(color), start: 0, end: text.length }],
  textAlign: 'left' as const,
  textMode: 'single-line' as const,
  layoutStyle: { relativeX: 0, relativeY: 0 },
  opacity: 1,
});

const createContainerNode = (node: LayoutTreeNode, index: number, children: DSLNode[] = []): DSLFrameNode => {
  const baseNode = createBaseNode(node, index);
  const layout = node.layout || {};

  return {
    ...baseNode,
    type: 'FRAME',
    fill: layout.backgroundColor ? getPaintStyle(layout.backgroundColor) : undefined,
    borderRadius: layout.borderRadius,
    flexContainerInfo: (layout.flexDirection || node.children?.length) ? {
      flexDirection: layout.flexDirection || 'column',
      alignItems: layout.alignItems || 'stretch',
      gap: 0,
      padding: layout.margin ? 0 : 16,
    } : undefined,
    flexGrow: layout.flex === 1 ? 1 : undefined,
    children,
  };
};

const convertLayoutNodeToDSL = (node: LayoutTreeNode, index = 0): DSLNode => {
  const { componentName, props = {}, children = [] } = node;

  switch (componentName) {
    case 'Text':
      return {
        ...createBaseNode(node, index),
        type: 'TEXT',
        text: [{ text: props.content || 'Text', font: getFontStyle(props.fontSize || 14) }],
        textColor: [{ color: getPaintStyle(props.color || 'rgb(26, 26, 26)'), start: 0, end: (props.content || 'Text').length }],
        textAlign: 'left',
        textMode: 'auto-height',
      } as DSLTextNode;

    case 'Icon':
      return {
        ...createBaseNode(node, index),
        type: 'LAYER',
        layoutStyle: { ...createBaseNode(node, index).layoutStyle, width: 24, height: 24 },
        fill: getPaintStyle('rgb(24, 144, 255)'),
        borderRadius: '2px',
      } as DSLLayerNode;

    case 'Avatar':
      return {
        ...createBaseNode(node, index),
        type: 'LAYER',
        layoutStyle: { ...createBaseNode(node, index).layoutStyle, width: 40, height: 40 },
        fill: getPaintStyle('rgb(240, 240, 240)'),
        borderRadius: '50%',
      } as DSLLayerNode;

    case 'Input':
      return {
        ...createBaseNode(node, index),
        type: 'FRAME',
        layoutStyle: { ...createBaseNode(node, index).layoutStyle, height: 40 },
        fill: getPaintStyle('rgb(255, 255, 255)'),
        strokeColor: getPaintStyle('rgb(217, 217, 217)'),
        strokeWidth: '1',
        borderRadius: '4px',
        flexContainerInfo: { flexDirection: 'row', alignItems: 'center', padding: 8 },
        children: [createTextChild(props.placeholder || '', props.color || 'rgb(153, 153, 153)', props.fontSize || 14, node.nodeId || `input_${index}`)],
      } as DSLFrameNode;

    case 'Button':
      return {
        ...createBaseNode(node, index),
        type: 'FRAME',
        fill: getPaintStyle('rgb(24, 144, 255)'),
        borderRadius: '4px',
        layoutStyle: { ...createBaseNode(node, index).layoutStyle, height: 32 },
        flexContainerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 12 },
        children: [createTextChild(props.content || 'Button', props.color || 'rgb(255, 255, 255)', props.fontSize || 14, node.nodeId || `button_${index}`)],
      } as DSLFrameNode;

    case 'Tag':
      return {
        ...createBaseNode(node, index),
        type: 'FRAME',
        fill: getPaintStyle('rgb(255, 240, 230)'),
        strokeColor: getPaintStyle('rgb(255, 112, 0)'),
        strokeWidth: '1',
        borderRadius: '4px',
        layoutStyle: createBaseNode(node, index).layoutStyle,
        flexContainerInfo: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 4 },
        children: [createTextChild(props.content || 'Tag', props.color || 'rgb(255, 112, 0)', props.fontSize || 12, node.nodeId || `tag_${index}`)],
      } as DSLFrameNode;

    default:
      return createContainerNode(node, index, children.map((child, childIndex) => convertLayoutNodeToDSL(child, childIndex)));
  }
};

export const convertLayoutTreeToDSL = (layoutData: LayoutTreeNode): DSLData => {
  const dslNode = convertLayoutNodeToDSL(layoutData);
  return { dsl: { styles: createDefaultStyles(), nodes: [dslNode] } };
};

export const findDSLNodePath = (dslData: DSLData, nodeId: string): string[] => {
  const findNode = (node: DSLNode, path: string[]): string[] | null => {
    if (node.id === nodeId) return [...path, node.id];

    if ((node as any).children) {
      for (const child of (node as any).children) {
        const found = findNode(child, [...path, node.id]);
        if (found) return found;
      }
    }
    return null;
  };

  for (const rootNode of dslData.dsl.nodes) {
    const found = findNode(rootNode, []);
    if (found) return found;
  }
  return [];
};
