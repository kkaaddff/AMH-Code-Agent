import { AnnotationNode } from '../types/componentDetectionV2';

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
      component:
        typeof node.ftaComponent === 'string' && node.ftaComponent.length
          ? node.ftaComponent
          : undefined,
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
