import { Body, Controller, Get, Inject, Post, Query, Redirect } from '@midwayjs/decorator'
import type { Context } from '@midwayjs/web'
import axios from 'axios'
import fs from 'fs'
import path from 'path'
import { Context as AgentContext } from '../service/neovate-code/context'
import { Project } from '../service/neovate-code/project'

const CLAUDE_BASE_URL = 'https://qa-user.aiapi.amh-group.com/claude/v1/messages'
const CLAUDE_API_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoicWljaGVuZy56aGFuZyIsImlkIjoiMTAyMzQxOSIsImtleSI6IkJyT1ExS3E2IiwiY29uc3VtZXIiOiJhcGlrZXktNjhmOWVlMGFlNGIwYjI2MzliNjgyNTYzIn0.0h9dqhHBQzk6oWmNqeoZix_aGg-EOefKEBj09Lxv-AI'

type ProjectSendBody = {
  message?: string | null
  sessionId?: string
  cwd?: string
  productName?: string
  productASCIIArt?: string
  version?: string
  model?: string
  planModel?: string
  smallModel?: string
  plugins?: string[]
  config?: Record<string, any>
  parentUuid?: string
  thinking?: {
    effort: 'low' | 'medium' | 'high'
  }
}

const omitUndefined = (input: Record<string, any>) => {
  const result: Record<string, any> = {}
  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      result[key] = value
    }
  }
  return result
}

// const CLAUDE_BASE_URL = 'https://open.bigmodel.cn/api/anthropic/v1/messages'
// const CLAUDE_API_KEY = '1a502e8ee34c4953a3c25b778f094b8e.c33zr72sfzXKf5Fr'

@Controller('/')
export class HomeController {
  @Inject()
  private ctx: Context

  @Get('/')
  @Redirect('/swagger-ui/index.html')
  async home() {}

  @Get('/redirect')
  async redirect(@Query('url') url?: string) {
    url = url ? decodeURIComponent(url) : 'https://fta.amh-group.com/'

    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://fta.amh-group.com/'
    }

    this.ctx.redirect(url)
  }

  @Post('/model-gateway')
  async modelGateway(@Body() questionBody: any) {
    this.ctx.res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    await new Promise<void>((resolve, reject) => {
      axios({
        method: 'POST',
        url: CLAUDE_BASE_URL,
        responseType: 'stream',
        data: questionBody,
        headers: {
          Authorization: `Bearer ${CLAUDE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })
        .then((response) => {
          // 这里处理成功的响应
          if (response.status === 200) {
            // 这里你可以将数据流转发给客户端，例如：res.send(response.data)
            // 监听数据流
            response.data.on('data', (chunk) => {
              this.ctx.res.write(chunk.toString())
            })
            response.data.on('end', () => {
              this.ctx.res.end()
              resolve()
            })
          } else {
            // 处理其他状态码的情况
            reject(`Server responded with status code: ${response.status}`)
          }
        })
        .catch((error) => {
          // 这里处理请求错误
          // 结束响应，如果你在一个服务器上下文中
          this.ctx.res.end()
          reject('Request Error:' + error)
        })
    })
  }

  @Post('/model-gateway-sync')
  async modelGatewaySync(@Body() questionBody: any) {
    const logDir = path.join(process.cwd(), 'logs', 'api')
    const timestamp = new Date().toISOString()
    const logFile = path.join(logDir, `model-gateway-sync-${new Date().toISOString().split('T')[0]}.log`)

    // 确保日志目录存在
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true })
    }

    // 记录入参
    const requestLog = {
      timestamp,
      type: 'REQUEST',
      method: 'POST',
      endpoint: '/model-gateway-sync',
      requestBody: questionBody,
    }

    try {
      // 确保请求体中 stream 参数为 false（如果存在）
      const requestData = {
        ...questionBody,
        stream: false,
      }

      const response = await axios({
        method: 'POST',
        url: CLAUDE_BASE_URL,
        data: requestData,
        headers: {
          Authorization: `Bearer ${CLAUDE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      })

      // 记录出参
      const responseLog = {
        timestamp: new Date().toISOString(),
        type: 'RESPONSE',
        method: 'POST',
        endpoint: '/model-gateway-sync',
        status: response.status,
        responseData: response.data,
      }

      // 写入日志文件
      const logEntry = JSON.stringify(requestLog) + '\n' + JSON.stringify(responseLog) + '\n' + '---\n'
      fs.appendFileSync(logFile, logEntry, 'utf8')

      return {
        success: true,
        data: response.data,
      }
    } catch (error: any) {
      // 记录错误日志
      const errorLog = {
        timestamp: new Date().toISOString(),
        type: 'ERROR',
        method: 'POST',
        endpoint: '/model-gateway-sync',
        status: error.response?.status || 500,
        error: error.response?.data || error.message || 'Request Error',
      }

      // 写入日志文件
      const logEntry = JSON.stringify(requestLog) + '\n' + JSON.stringify(errorLog) + '\n' + '---\n'
      fs.appendFileSync(logFile, logEntry, 'utf8')

      this.ctx.status = error.response?.status || 500
      return {
        success: false,
        error: error.response?.data || error.message || 'Request Error',
      }
    }
  }

  @Post('/project/send')
  async projectSend(@Body() body: ProjectSendBody) {
    const {
      message = null,
      sessionId,
      cwd,
      productName,
      productASCIIArt,
      version,
      model,
      planModel,
      smallModel,
      plugins,
      config,
      parentUuid,
      thinking,
    } = body

    const resolvedCwd = cwd ? path.resolve(cwd) : process.cwd()
    const resolvedProductName = productName || 'CodeAgent'
    const resolvedVersion = version || process.env.CODE_AGENT_VERSION || '0.0.0'

    const baseConfig = typeof config === 'object' && config ? { ...config } : {}
    const primaryModel = model || baseConfig.model || process.env.MODEL_NAME
    if (!primaryModel) {
      this.ctx.status = 400
      return {
        success: false,
        error: 'model is required',
      }
    }

    const argvConfig = omitUndefined({
      ...baseConfig,
      model: primaryModel,
      planModel,
      smallModel,
    })
    if (Array.isArray(plugins) && plugins.length) {
      argvConfig.plugins = plugins
    }

    let agentContext: AgentContext | null = null
    try {
      agentContext = await AgentContext.create({
        cwd: resolvedCwd,
        productName: resolvedProductName,
        productASCIIArt,
        version: resolvedVersion,
        argvConfig,
        plugins: [],
      })

      const project = new Project({
        context: agentContext,
        sessionId,
      })

      const sendOptions = omitUndefined({
        model: primaryModel,
        parentUuid,
        thinking,
      })
      const result = await project.send(message, sendOptions)

      return {
        ...result,
        sessionId: project.session.id,
      }
    } catch (error: any) {
      this.ctx.status = 500
      return {
        success: false,
        error: error?.message || 'Project send failed',
      }
    } finally {
      if (agentContext) {
        await agentContext.destroy()
      }
    }
  }
}
