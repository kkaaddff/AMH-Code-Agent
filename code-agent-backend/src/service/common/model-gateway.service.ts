import { Config, Provide, Scope, ScopeEnum } from '@midwayjs/core'
import axios from 'axios'

export interface ModelGatewayConfig {
  endpoint?: string
  apiKey?: string
  model?: string
  timeout?: number
  temperature?: number
  maxTokens?: number
  topP?: number
}

export interface ModelRequestOptions {
  prompt: string
  model?: string
  temperature?: number
  maxTokens?: number
  topP?: number
  stream?: boolean
  customPayload?: Record<string, any>
}

export interface ModelResponse {
  content: string
  usage?: Record<string, any>
  model?: string
  success: boolean
  error?: string
}

/**
 * 通用模型网关服务
 * 统一封装各种模型的调用逻辑，支持多种API格式和响应解析
 */
@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class ModelGatewayService {
  @Config('modelGateway.default')
  private modelConfig: ModelGatewayConfig

  /**
   * 从模型响应中提取文本内容
   * 支持多种常见的API响应格式
   */
  private extractTextFromModelPayload(payload: any): string | null {
    if (!payload) {
      return null
    }

    // 直接返回字符串
    if (typeof payload === 'string') {
      return payload
    }

    // 常见的响应格式
    const textPaths = [
      'output', // 通用格式
      'result', // 通用格式
      'text', // 通用格式
      'response', // 通用格式
      'data.0.text', // 某些API格式
      'data.0.content', // 某些API格式
      'choices.0.message.content', // OpenAI格式
      'choices.0.text', // OpenAI兼容格式
    ]

    for (const path of textPaths) {
      const value = this.getNestedValue(payload, path)
      if (typeof value === 'string') {
        return value
      }
    }

    // 处理数组形式的content (例如OpenAI的多模态响应)
    if (Array.isArray(payload.choices?.[0]?.message?.content)) {
      const contentPart = payload.choices[0].message.content.find((part: any) => part.type === 'text' && part.text)
      if (contentPart?.text) {
        return contentPart.text
      }
    }

    // 处理messages数组的最后一条消息
    if (Array.isArray(payload.messages)) {
      const lastMessage = payload.messages[payload.messages.length - 1]
      if (lastMessage && typeof lastMessage.content === 'string') {
        return lastMessage.content
      }
    }

    // 处理output数组
    if (Array.isArray(payload.output)) {
      const first = payload.output.find((item: any) => typeof item?.text === 'string' || typeof item === 'string')
      if (first) {
        return typeof first === 'string' ? first : first.text
      }
    }

    // 处理data数组
    if (Array.isArray(payload.data) && payload.data.length > 0) {
      const item = payload.data[0]
      if (item?.text) {
        return typeof item.text === 'string' ? item.text : item.text.join('\n')
      }
      if (item?.content) {
        return typeof item.content === 'string' ? item.content : null
      }
    }

    return null
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && typeof current === 'object' ? current[key] : undefined
    }, obj)
  }

  /**
   * 提取使用量信息
   */
  private extractUsageFromPayload(payload: any): Record<string, any> | undefined {
    const usagePaths = ['usage', 'tokenUsage', 'meta.usage', 'data.0.usage']

    for (const path of usagePaths) {
      const usage = this.getNestedValue(payload, path)
      if (usage && typeof usage === 'object') {
        return usage
      }
    }

    return undefined
  }

  /**
   * 构建请求载荷
   * 支持多种模型API格式
   */
  private buildRequestPayload(options: ModelRequestOptions): Record<string, any> {
    const config = { ...this.modelConfig }
    const {
      prompt,
      model = config.model,
      temperature = config.temperature ?? 0.2,
      maxTokens = config.maxTokens,
      topP = config.topP,
      stream = false,
      customPayload = {},
    } = options

    // 基础载荷
    const basePayload = {
      model,
      temperature,
      stream,
      ...(maxTokens && { max_tokens: maxTokens }),
      ...(topP && { top_p: topP }),
    }

    // 根据常见的API格式构建载荷
    const payloadVariants = [
      // OpenAI格式
      {
        ...basePayload,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      },
      // 通用格式 (直接传prompt)
      {
        ...basePayload,
        prompt,
        input: prompt,
      },
      // 自定义格式
      {
        ...basePayload,
        ...customPayload,
        ...(customPayload.prompt ? {} : { prompt }),
      },
    ]

    return payloadVariants[0] // 默认使用OpenAI格式，可根据配置调整
  }

  /**
   * 发起模型请求
   */
  private async makeRequest(payload: Record<string, any>): Promise<any> {
    const config = this.modelConfig

    if (!config.endpoint) {
      throw new Error('Model gateway endpoint is not configured')
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    // 添加认证头
    if (config.apiKey) {
      headers.Authorization = `Bearer ${config.apiKey}`
    }

    const response = await axios.post(config.endpoint, payload, {
      headers,
      timeout: config.timeout ?? 45_000,
    })

    return response.data
  }

  /**
   * 调用模型的主要接口
   */
  public async callModel(options: ModelRequestOptions): Promise<ModelResponse> {
    try {
      const payload = this.buildRequestPayload(options)
      const response = await this.makeRequest(payload)

      const content = this.extractTextFromModelPayload(response)
      if (!content) {
        return {
          content: '',
          success: false,
          error: 'Unable to extract content from model response',
        }
      }

      const usage = this.extractUsageFromPayload(response)
      const model = options.model || this.modelConfig.model

      return {
        content: content.trim(),
        usage,
        model,
        success: true,
      }
    } catch (error) {
      console.error('[ModelGatewayService] 模型调用失败:', error)

      let errorMessage = 'Unknown error occurred'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      }

      return {
        content: '',
        success: false,
        error: errorMessage,
      }
    }
  }

  /**
   * 流式调用模型 (如果支持)
   */
  public async *callModelStream(options: ModelRequestOptions): AsyncGenerator<string, void, unknown> {
    try {
      const payload = this.buildRequestPayload({ ...options, stream: true })
      const config = this.modelConfig

      if (!config.endpoint) {
        throw new Error('Model gateway endpoint is not configured')
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(config.apiKey ? { Authorization: `Bearer ${config.apiKey}` } : {}),
      }

      const response = await axios.post(config.endpoint, payload, {
        headers,
        timeout: config.timeout ?? 60_000,
        responseType: 'stream',
      })

      // 注意：流式处理需要根据具体的API格式实现
      // 这里只是一个基础框架
      for await (const chunk of response.data) {
        const text = chunk.toString()
        // 这里需要根据具体的流式格式解析
        // 例如SSE格式或其他自定义格式
        if (text.trim()) {
          yield text
        }
      }
    } catch (error) {
      console.error('[ModelGatewayService] 流式模型调用失败:', error)
      throw error
    }
  }

  /**
   * 检查模型服务是否可用
   */
  public async checkHealth(): Promise<boolean> {
    try {
      const result = await this.callModel({
        prompt: 'test',
        temperature: 0.1,
      })
      return result.success
    } catch (error) {
      return false
    }
  }

  /**
   * 获取模型配置信息
   */
  public getConfig(): ModelGatewayConfig {
    return { ...this.modelConfig }
  }
}
