import { Context } from '@midwayjs/web'
import { Controller, Get, Inject, Query, Redirect } from '@midwayjs/decorator'

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
}
