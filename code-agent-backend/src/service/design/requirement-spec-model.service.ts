import { MidwayHttpError, Provide, Scope, ScopeEnum, Inject } from '@midwayjs/core'
import dayjs from 'dayjs'
import type { DesignDocumentEntity } from '../../entity/design'
import { generateRequirementMarkdown } from '../../utils/design/requirement-builder'
import { ModelGatewayService, ModelResponse } from '../common'

interface RequirementSpecGenerationParams {
  design: DesignDocumentEntity
  templateKey?: string
  rootAnnotation?: Record<string, any> | null
  annotationVersion?: number
  annotationSchemaVersion?: string
  operatorId?: string
}

interface AnnotationNodeSummary {
  id: string
  name?: string
  component?: string
  isContainer?: boolean
  depth: number
  childCount: number
  width?: number
  height?: number
}

interface RequirementSpecGenerationResult {
  content: string
  availableFormats: string[]
  prompt: string
  templateKey: string
  provider: {
    name: string
    model?: string
    fallback: boolean
    usage?: Record<string, any>
    finishedAt: string
  }
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class RequirementSpecModelService {
  @Inject()
  private modelGatewayService: ModelGatewayService

  private flattenAnnotation(root?: Record<string, any> | null): AnnotationNodeSummary[] {
    if (!root || typeof root !== 'object') {
      return []
    }

    const summaries: AnnotationNodeSummary[] = []
    const visit = (node: any, depth: number) => {
      if (!node || typeof node !== 'object') {
        return
      }
      const children = Array.isArray(node.children) ? node.children : []
      summaries.push({
        id: String(node.id ?? node.dslNodeId ?? `node-${summaries.length}`),
        name: typeof node.name === 'string' && node.name.length ? node.name : undefined,
        component:
          typeof node.ftaComponent === 'string' && node.ftaComponent.length
            ? node.ftaComponent
            : typeof node.component === 'string'
            ? node.component
            : undefined,
        isContainer: Boolean(node.isContainer),
        depth,
        childCount: children.length,
        width: typeof node.width === 'number' ? node.width : undefined,
        height: typeof node.height === 'number' ? node.height : undefined,
      })
      children.forEach((child) => visit(child, depth + 1))
    }

    visit(root, 0)
    return summaries
  }

  private formatAnnotationSummary(nodes: AnnotationNodeSummary[]): string {
    if (!nodes.length) {
      return '当前标注树为空，模型需要自行根据设计描述补充组件结构。'
    }

    const lines: string[] = []
    nodes.forEach((node) => {
      const indent = '  '.repeat(Math.max(node.depth - 1, 0))
      const labelParts = [
        `[${node.id}]`,
        node.name ?? '未命名节点',
        node.component ? `<${node.component}>` : '',
        node.isContainer ? '(容器)' : '',
      ].filter(Boolean)
      const metrics =
        node.width && node.height ? `尺寸：${Math.round(node.width)}×${Math.round(node.height)}` : undefined
      const childInfo = node.childCount ? `子节点：${node.childCount}` : undefined
      const info = [metrics, childInfo].filter(Boolean).join('，')
      lines.push(`${indent}- ${labelParts.join(' ')}${info ? `（${info}）` : ''}`)
    })
    return lines.join('\n')
  }

  private buildTemplateInstructions(templateKey?: string): { preface: string; constraints: string } {
    const defaultPreface = [
      '你是一名资深前端系统分析师，需要根据设计稿与组件标注生成驱动代码生成的需求规格说明（PRD/SRS）。',
      '请聚焦于帮助工程师理解页面布局、组件层级、关键交互以及数据依赖，确保内容可直接用于代码生成。',
    ].join('\n')

    const defaultConstraints = [
      '输出必须是 Markdown，并包含以下章节：',
      '1. 功能概述与目标',
      '2. 用户场景与交互流程（包含主要路径与异常/边界情况）',
      '3. 组件树结构说明（突出容器与关键组件的层级与职责）',
      '4. 样式与布局要点（从标注中提取关键信息，如尺寸、排列方式）',
      '5. 数据与接口契约（列出必要的数据源、字段需求、校验规则）',
      '6. 验收标准（列出功能验收点与代码生成所需的检查项）',
      '',
      '注意事项：',
      '- 使用小节和表格系统地呈现内容，确保条理清晰；',
      '- 补充工程实现注意事项，例如需要生成的组件属性、状态管理、国际化等；',
      '- 若标注树缺失信息，也要列出待补充项，避免遗漏；',
      '- 生成内容以简体中文输出。',
    ].join('\n')

    switch (templateKey) {
      case 'minimal':
        return {
          preface: defaultPreface,
          constraints: [
            '生成精简版 Markdown，总结核心交互、组件结构和关键验收条目即可。',
            '保持 Markdown 二级标题结构，章节不超过四节。',
          ].join('\n'),
        }
      default:
        return { preface: defaultPreface, constraints: defaultConstraints }
    }
  }

  private buildPrompt(params: RequirementSpecGenerationParams, annotationSummary: string): string {
    const { design, templateKey, rootAnnotation, annotationVersion, annotationSchemaVersion, operatorId } = params
    const instructions = this.buildTemplateInstructions(templateKey)
    const resolvedDesignId = (design as any)?._id ?? (design as any)?.id ?? '未知'
    const nodeCount =
      Array.isArray((design as any)?.dslData?.nodes) && (design as any).dslData.nodes.length
        ? (design as any).dslData.nodes.length
        : Array.isArray((design as any)?.dslData?.dsl?.nodes)
        ? (design as any).dslData.dsl.nodes.length
        : undefined

    const contextLines = [
      `设计名称：${design?.name ?? '未命名设计'}`,
      `设计 ID：${resolvedDesignId}`,
      design?.description ? `设计描述：${design.description}` : undefined,
      nodeCount ? `DSL 节点数量：${nodeCount}` : undefined,
      annotationVersion ? `标注版本：${annotationVersion}` : undefined,
      annotationSchemaVersion ? `标注 Schema：${annotationSchemaVersion}` : undefined,
      operatorId ? `发起人：${operatorId}` : undefined,
      `标注树是否存在根节点：${rootAnnotation ? '是' : '否'}`,
      '',
      '组件标注结构：',
      annotationSummary,
      '',
      '若标注中包含 props/layout 信息，可结合常识补足对组件约束的描述。',
    ].filter(Boolean)

    return [
      instructions.preface,
      '',
      instructions.constraints,
      '',
      '=== 设计上下文 ===',
      contextLines.join('\n'),
      '',
      '=== 输出要求 ===',
      '请按照约束编写 Markdown 文档，保留清晰的层级结构和要点列表。',
    ].join('\n')
  }

  private async requestModel(prompt: string): Promise<{ content: string; usage?: Record<string, any> } | null> {
    try {
      const result: ModelResponse = await this.modelGatewayService.callModel({
        prompt,
        temperature: 0.2,
      })

      if (result.success) {
        return {
          content: result.content,
          usage: result.usage,
        }
      } else {
        console.warn('[RequirementSpecModelService] 模型调用失败，将回退至模板生成。', result.error)
        return null
      }
    } catch (error) {
      console.warn('[RequirementSpecModelService] 模型调用失败，将回退至模板生成。', error)
      return null
    }
  }

  public async generateSpecification(
    params: RequirementSpecGenerationParams
  ): Promise<RequirementSpecGenerationResult> {
    const { design, templateKey } = params
    if (!design) {
      throw new MidwayHttpError('Design document payload is required', 400)
    }

    const annotationSummary = this.formatAnnotationSummary(this.flattenAnnotation(params.rootAnnotation))
    const prompt = this.buildPrompt(params, annotationSummary)
    const modelResult = await this.requestModel(prompt)
    const now = dayjs().toISOString()

    if (modelResult?.content) {
      const config = this.modelGatewayService.getConfig()
      return {
        content: modelResult.content.trim(),
        availableFormats: ['md'],
        prompt,
        templateKey: templateKey ?? 'default',
        provider: {
          name: 'model-gateway',
          model: config?.model ?? 'unknown',
          fallback: false,
          usage: modelResult.usage,
          finishedAt: now,
        },
      }
    }

    const fallbackAnnotation = params.rootAnnotation
      ? ({ rootAnnotation: params.rootAnnotation, version: params.annotationVersion ?? undefined } as any)
      : undefined

    const fallback = generateRequirementMarkdown({
      design,
      annotation: fallbackAnnotation,
      options: { templateKey },
    })

    return {
      content: fallback.content,
      availableFormats: fallback.availableFormats ?? ['md'],
      prompt,
      templateKey: templateKey ?? 'default',
      provider: {
        name: 'template-fallback',
        model: undefined,
        fallback: true,
        usage: fallback.stats ? { componentCount: fallback.stats.componentCount } : undefined,
        finishedAt: now,
      },
    }
  }
}
