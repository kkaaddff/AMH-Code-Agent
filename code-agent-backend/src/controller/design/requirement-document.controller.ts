import { Body, Controller, Get, Inject, Param, Post, Put, Query } from '@midwayjs/decorator'
import { ApiOkResponse, ApiOperation, ApiTags } from '@midwayjs/swagger'
import { Context } from '@midwayjs/web'
import { HttpStatus, MidwayHttpError } from '@midwayjs/core'
import {
  GenerateRequirementDocumentBody,
  RequirementDocumentDetailResponse,
  RequirementDocumentExportResponse,
  RequirementDocumentListResponse,
  RequirementDocumentPaginationQuery,
  UpdateRequirementDocumentBody,
} from '../../dto/design'
import { DesignRequirementDocumentService } from '../../service/design'

@ApiTags(['Design'])
@Controller('/design', { description: 'Requirement Document Management' })
export class DesignRequirementDocumentController {
  @Inject()
  ctx: Context

  @Inject()
  private designRequirementDocumentService: DesignRequirementDocumentService

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

  @ApiOperation({ summary: '生成需求规格文档草稿' })
  @ApiOkResponse({ type: RequirementDocumentDetailResponse })
  @Post('/:designId/requirement-docs/generate')
  async generateRequirementDocument(
    @Param('designId') designId: string,
    @Body() body: GenerateRequirementDocumentBody
  ) {
    const operatorId = this.resolveOperatorId()
    const doc = await this.designRequirementDocumentService.generateRequirementDocument(designId, body, operatorId)
    return new RequirementDocumentDetailResponse(doc)
  }

  @ApiOperation({ summary: '更新需求文档' })
  @ApiOkResponse({ type: RequirementDocumentDetailResponse })
  @Put('/requirement-docs/:docId')
  async updateRequirementDocument(@Param('docId') docId: string, @Body() body: UpdateRequirementDocumentBody) {
    const operatorId = this.resolveOperatorId()
    const doc = await this.designRequirementDocumentService.updateRequirementDocument(docId, body, operatorId)
    return new RequirementDocumentDetailResponse(doc)
  }

  @ApiOperation({ summary: '获取需求文档详情' })
  @ApiOkResponse({ type: RequirementDocumentDetailResponse })
  @Get('/requirement-docs/:docId')
  async getRequirementDocument(@Param('docId') docId: string) {
    const doc = await this.designRequirementDocumentService.getRequirementDocumentById(docId)
    if (!doc) {
      throw new MidwayHttpError('Requirement document not found', HttpStatus.NOT_FOUND)
    }
    return new RequirementDocumentDetailResponse(doc)
  }

  @ApiOperation({ summary: '分页查询需求文档列表' })
  @ApiOkResponse({ type: RequirementDocumentListResponse })
  @Get('/:designId/requirement-docs')
  async listRequirementDocuments(
    @Param('designId') designId: string,
    @Query() query: RequirementDocumentPaginationQuery
  ) {
    const { list, total } = await this.designRequirementDocumentService.paginateRequirementDocuments(designId, query)
    return new RequirementDocumentListResponse(list, total)
  }

  @ApiOperation({ summary: '导出需求文档文件' })
  @ApiOkResponse({ type: RequirementDocumentExportResponse })
  @Post('/requirement-docs/:docId/export')
  async exportRequirementDocument(@Param('docId') docId: string) {
    const operatorId = this.resolveOperatorId()
    const downloadUrl = await this.designRequirementDocumentService.exportRequirementDocument(docId, operatorId)
    return new RequirementDocumentExportResponse(downloadUrl)
  }
}
