import { Provide, Scope, ScopeEnum, Inject } from '@midwayjs/core'
import fs from 'fs'
import path from 'path'
import { ModelGatewayService, ModelResponse } from '../common'

interface RequirementSpecGenerationParams {
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
  private promptDumpFile = path.join(__dirname, 'prompt.md')

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
      '请聚焦于帮助工程师理解页面布局、组件层级、生成一份以下模板对应的实际项目需求规格说明',
    ].join('\n')

    const defaultConstraints1 = fs.readFileSync(path.join(__dirname, 'ai-code-agent-spec-compact.md'), 'utf-8')

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
        return { preface: defaultPreface, constraints: defaultConstraints1 }
    }
  }

  private buildPrompt(params: RequirementSpecGenerationParams, annotationSummary: string): string {
    const { templateKey, rootAnnotation, annotationVersion, annotationSchemaVersion, operatorId } = params
    const instructions = this.buildTemplateInstructions(templateKey)

    const contextLines = [
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
      '=== 需求文档模板 ===',
      instructions.constraints,
      '',
      '=== 设计上下文 ===',
      contextLines.join('\n'),
      '',
      '=== 输出要求 ===',
      '请按照需求文档模板编写 Markdown 文档，确保内容符合需求文档模板的要求。',
      '在需求文档最后添加 TODO 列表，列出最多十条后续要完成的需求项。',
    ].join('\n')
  }

  private preparePrompt(params: RequirementSpecGenerationParams): string {
    const annotationSummary = this.formatAnnotationSummary(this.flattenAnnotation(params.rootAnnotation))
    const prompt = this.buildPrompt(params, annotationSummary)

    try {
      fs.writeFileSync(this.promptDumpFile, prompt)
    } catch (error) {
      console.warn('[RequirementSpecModelService] 写入 prompt 调试文件失败', error)
    }

    return prompt
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

  public async generateSpecification(params: RequirementSpecGenerationParams): Promise<string> {
    const prompt = this.preparePrompt(params)
    const modelResult = await this.requestModel(prompt)

    if (modelResult?.content) {
      return modelResult.content.trim()
    }

    // const fallbackAnnotation = params.rootAnnotation
    //   ? ({ rootAnnotation: params.rootAnnotation, version: params.annotationVersion ?? undefined } as any)
    //   : undefined

    // const fallback = generateRequirementMarkdown({
    //   design,
    //   annotation: fallbackAnnotation,
    //   options: { templateKey },
    // })

    // return {
    //   content: fallback.content,
    //   availableFormats: fallback.availableFormats ?? ['md'],
    //   prompt,
    //   templateKey: templateKey ?? 'default',
    //   provider: {
    //     name: 'template-fallback',
    //     model: undefined,
    //     fallback: true,
    //     usage: fallback.stats ? { componentCount: fallback.stats.componentCount } : undefined,
    //     finishedAt: now,
    //   },
    // }
  }

  public async streamSpecification(
    params: RequirementSpecGenerationParams,
    handlers: {
      onChunk: (chunk: string) => void
      onComplete?: () => void
      onError?: (error: unknown) => void
    }
  ): Promise<void> {
    const prompt = this.preparePrompt(params)
    let receivedChunk = false

    const handleChunk = (chunk: string) => {
      if (!chunk) {
        return
      }
      receivedChunk = true
      handlers.onChunk(chunk)
    }

    try {
      await this.modelGatewayService.streamModel(
        {
          prompt,
          temperature: 0.2,
        },
        handleChunk
      )
    } catch (error) {
      console.warn('[RequirementSpecModelService] 流式生成失败，将回退至非流式生成。', error)
    }

    if (!receivedChunk) {
      try {
        const fallback = await this.generateSpecification(params)
        if (fallback) {
          handlers.onChunk(fallback)
        }
      } catch (error) {
        handlers.onError?.(error)
        return
      }
    }

    handlers.onComplete?.()
  }
}
