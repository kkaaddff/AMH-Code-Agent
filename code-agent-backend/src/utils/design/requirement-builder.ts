import dayjs from 'dayjs'
import type { DesignDocumentEntity, DesignComponentAnnotationEntity } from '../../entity/design'

interface RequirementBuilderOptions {
  templateKey?: string
}

interface AnnotationNodeSummary {
  nodeId: string
  name?: string
  ftaComponent?: string
  depth: number
  childCount: number
}

interface RequirementGenerationResult {
  content: string
  availableFormats: string[]
  stats: {
    componentCount: number
    annotationVersion: number | null
  }
}

function extractAnnotationNodes(annotation?: DesignComponentAnnotationEntity | null): AnnotationNodeSummary[] {
  if (!annotation?.rootAnnotation) {
    return []
  }

  const summaries: AnnotationNodeSummary[] = []
  const visit = (node: any, depth: number) => {
    if (!node || typeof node !== 'object') {
      return
    }
    const children = Array.isArray(node.children) ? node.children : []
    if (node.id) {
      summaries.push({
        nodeId: String(node.id),
        name: typeof node.name === 'string' ? node.name : undefined,
        ftaComponent: typeof node.ftaComponent === 'string' ? node.ftaComponent : undefined,
        depth,
        childCount: children.length,
      })
    }
    children.forEach((child) => visit(child, depth + 1))
  }

  visit(annotation.rootAnnotation, 0)
  return summaries
}

function buildComponentTable(nodes: AnnotationNodeSummary[]): string {
  if (!nodes.length) {
    return '当前标注暂无可识别的组件节点。'
  }

  const header = '| 节点 ID | 名称 | FTA 组件 | 子节点数 |\n| --- | --- | --- | --- |'
  const rows = nodes
    .map((node) => `| ${node.nodeId} | ${node.name ?? '-'} | ${node.ftaComponent ?? '-'} | ${node.childCount ?? 0} |`)
    .join('\n')
  return `${header}\n${rows}`
}

function resolveDslNodeCount(design: DesignDocumentEntity): number {
  const dslData = design.dslData as any
  if (!dslData) {
    return 0
  }
  if (Array.isArray(dslData?.nodes)) {
    return dslData.nodes.length
  }
  if (Array.isArray(dslData?.dsl?.nodes)) {
    return dslData.dsl.nodes.length
  }
  return 0
}

export function generateRequirementMarkdown(params: {
  design: DesignDocumentEntity
  annotation?: DesignComponentAnnotationEntity
  options?: RequirementBuilderOptions
}): RequirementGenerationResult {
  const { design, annotation } = params
  const annotationNodes = extractAnnotationNodes(annotation)
  const nodeCount = resolveDslNodeCount(design)
  const generatedAt = dayjs().format('YYYY-MM-DD HH:mm:ss')

  const sections = [
    `# ${design.name ?? '未命名设计'} - 需求规格文档`,
    '',
    '## 1. 基本信息',
    `- 设计 ID：${design._id ?? '-'} `,
    `- DSL 修订号：${design.dslRevision ?? '-'} （节点数：${nodeCount}）`,
    `- 标注版本：${annotation?.version ?? '暂无'}`,
    `- 生成时间：${generatedAt}`,
    design.description ? `- 设计简介：${design.description}` : '',
    '',
    '## 2. 组件结构',
    buildComponentTable(annotationNodes),
    '',
    '## 3. 交互与状态',
    '请在标注中补充交互流程、状态切换及异常场景描述。',
    '',
    '## 4. 数据与接口需求',
    '- 数据模型占位：请完善接口字段、校验规则。',
    '- 外部依赖占位：请罗列依赖的第三方服务或基础能力。',
    '',
    '## 5. 研发备注',
    '- 根据 DSL 与组件标注生成初始代码骨架。',
    '- 核对需求评审结论与组件约束。',
  ].filter(Boolean)

  return {
    content: sections.join('\n'),
    availableFormats: ['md'],
    stats: {
      componentCount: annotationNodes.length,
      annotationVersion: annotation?.version ?? null,
    },
  }
}
