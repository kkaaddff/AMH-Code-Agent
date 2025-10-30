import { Context } from '@midwayjs/web'
import { Body, Controller, Get, Inject, Post, Query, Redirect } from '@midwayjs/decorator'
import axios from 'axios'

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
    const baseUrl = 'https://qa-user.aiapi.amh-group.com/claude/v1/messages?beta=true'
    const apiKey =
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyIjoicWljaGVuZy56aGFuZyIsImlkIjoiMTAyMzQxOSIsImtleSI6IkJyT1ExS3E2IiwiY29uc3VtZXIiOiJhcGlrZXktNjhmOWVlMGFlNGIwYjI2MzliNjgyNTYzIn0.0h9dqhHBQzk6oWmNqeoZix_aGg-EOefKEBj09Lxv-AI'

    this.ctx.res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    })

    await new Promise<void>((resolve, reject) => {
      axios({
        method: 'POST',
        url: baseUrl,
        responseType: 'stream',
        data: questionBody,
        headers: {
          Authorization: `Bearer ${apiKey}`,
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
}
