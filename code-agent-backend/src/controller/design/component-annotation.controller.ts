import { Body, Controller, Get, Inject, Param, Post, Query } from '@midwayjs/decorator'
import { ApiOkResponse, ApiOperation, ApiTags } from '@midwayjs/swagger'
import { Context } from '@midwayjs/web'
import { HttpStatus, MidwayHttpError } from '@midwayjs/core'
import {
  DiffDesignAnnotationQuery,
  DiffDesignAnnotationResponse,
  GetDesignAnnotationQuery,
  GetDesignAnnotationResponse,
  SaveDesignAnnotationBody,
} from '../../dto/design'
import { DesignComponentAnnotationService } from '../../service/design'

@ApiTags(['Design'])
@Controller('/design', { description: 'Design Annotation Management' })
export class DesignComponentAnnotationController {
  @Inject()
  ctx: Context

  @Inject()
  private designComponentAnnotationService: DesignComponentAnnotationService

  private resolveOperatorId(): string {
    const ctxAny = this.ctx as any
    const user = ctxAny?.user || ctxAny?.state?.user || {}
    const headers = this.ctx.headers || {}
    return (
      user.jobNum ||
      user.jobId ||
      user.id ||
      headers['x-operator-id'] ||
      headers['x-user-id'] ||
      this.ctx.get('x-operator-id') ||
      this.ctx.get('x-user-id') ||
      'system'
    )
  }

  @ApiOperation({ summary: '保存组件标注' })
  @ApiOkResponse({ type: GetDesignAnnotationResponse })
  @Post('/:designId/annotations')
  async saveAnnotation(@Param('designId') designId: string, @Body() body: SaveDesignAnnotationBody) {
    const operatorId = this.resolveOperatorId()
    const annotation = await this.designComponentAnnotationService.saveAnnotation(designId, body, operatorId)
    return new GetDesignAnnotationResponse(annotation)
  }

  @ApiOperation({ summary: '获取组件标注' })
  @ApiOkResponse({ type: GetDesignAnnotationResponse })
  @Get('/:designId/annotations')
  async getAnnotation(@Param('designId') designId: string, @Query() query: GetDesignAnnotationQuery) {
    const version =
      typeof query.version === 'number'
        ? query.version
        : query.version !== undefined
        ? Number(query.version)
        : undefined
    const annotation = await this.designComponentAnnotationService.getLatestAnnotation(designId, version)
    if (!annotation) {
      throw new MidwayHttpError('Annotation not found', HttpStatus.NOT_FOUND)
    }
    return new GetDesignAnnotationResponse(annotation)
  }

  @ApiOperation({ summary: '对比组件标注差异' })
  @ApiOkResponse({ type: DiffDesignAnnotationResponse })
  @Get('/:designId/annotations/diff')
  async diffAnnotations(@Param('designId') designId: string, @Query() query: DiffDesignAnnotationQuery) {
    const fromVersion = Number(query.fromVersion)
    const toVersion = Number(query.toVersion)
    if (!Number.isFinite(fromVersion) || !Number.isFinite(toVersion)) {
      throw new MidwayHttpError('Invalid version parameters', HttpStatus.BAD_REQUEST)
    }
    const diff = await this.designComponentAnnotationService.diffAnnotations(designId, {
      fromVersion,
      toVersion,
    })
    return new DiffDesignAnnotationResponse(diff)
  }
}
