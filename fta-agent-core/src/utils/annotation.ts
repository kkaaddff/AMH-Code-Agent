import type { AnnotationNode } from '@fta/shared';

export type { AnnotationNode, DSLData, DSLNode, DesignData } from '@fta/shared';

interface AnnotationNodeSummary {
  id: string;
  dslNodeId?: string;
  name?: string;
  component?: string;
  comment?: string;
  isContainer?: boolean;
  depth: number;
  childCount: number;
  width?: number;
  height?: number;
  /** 关联的数据模型名称（从 props.dataModelId 解析） */
  dataModelName?: string;
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
      node.dslNodeId ? `(NodeId:${node.dslNodeId})` : '',
      node.name ?? 'unnamed',
      node.component ?? '',
      node.isContainer ? '(容器)' : '',
    ].filter(Boolean);

    const metrics =
      node.width && node.height ? `尺寸：${Math.round(node.width)}×${Math.round(node.height)}` : undefined;
    const childInfo = node.childCount ? `子节点：${node.childCount}` : undefined;
    const commentInfo = node.comment ? `备注：${node.comment}` : undefined;
    const dataModelInfo = node.dataModelName ? `数据模型：${node.dataModelName}` : undefined;

    const info = [metrics, childInfo, commentInfo, dataModelInfo].filter(Boolean).join('，');
    lines.push(`${indent}- ${labelParts.join(' ')}${info ? `（${info}）` : ''}`);
  });
  return lines.join('\n');
}

/**
 * 将标注树拍平为节点概要列表，保留层级信息。
 * @param root 根标注节点
 * @param dataModelMap 可选的数据模型映射表（id -> name），用于解析 props.dataModelId
 * @returns 拍平后的节点概要数组
 */
export function flattenAnnotation(root?: AnnotationNode, dataModelMap?: Map<string, string>): AnnotationNodeSummary[] {
  if (!root || typeof root !== 'object') {
    return [];
  }

  const summaries: AnnotationNodeSummary[] = [];
  const visit = (node: AnnotationNode, depth: number) => {
    if (!node || typeof node !== 'object') {
      return;
    }
    const children = Array.isArray(node.children) ? node.children : [];

    // 解析 props.dataModelId 对应的数据模型名称
    let dataModelName: string | undefined;
    if (dataModelMap && node.props?.dataModelId) {
      const dataModelId = String(node.props.dataModelId);
      dataModelName = dataModelMap.get(dataModelId);
    }

    summaries.push({
      id: String(node.id ?? `node-${summaries.length}`),
      dslNodeId: typeof node.dslNodeId === 'string' && node.dslNodeId.length ? node.dslNodeId : undefined,
      name: typeof node.name === 'string' && node.name.length ? node.name : undefined,
      component: typeof node.ftaComponent === 'string' && node.ftaComponent.length ? node.ftaComponent : undefined,
      comment: typeof node.comment === 'string' && node.comment.length ? node.comment : undefined,
      isContainer: Boolean(node.isContainer),
      depth,
      childCount: children.length,
      width: typeof node.width === 'number' ? node.width : undefined,
      height: typeof node.height === 'number' ? node.height : undefined,
      dataModelName,
    });
    children.forEach((child) => visit(child, depth + 1));
  };

  visit(root, 0);
  return summaries;
}
