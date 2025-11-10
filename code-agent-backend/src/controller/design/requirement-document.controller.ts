import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/decorator';
import { ApiOkResponse, ApiOperation, ApiTags } from '@midwayjs/swagger';
import { Context } from '@midwayjs/web';
import { HttpStatus, MidwayHttpError } from '@midwayjs/core';
import {
  GenerateRequirementDocumentBody,
  RequirementDocumentDetailResponse,
  RequirementDocumentExportResponse,
  RequirementDocumentListResponse,
  RequirementDocumentPaginationQuery,
  UpdateRequirementDocumentBody,
} from '../../dto/design';
import { DesignRequirementDocumentService } from '../../service/design';

@ApiTags(['Code Agent'])
@Controller('/code-agent/requirement', {
  description: 'Requirement Document Management',
})
export class DesignRequirementDocumentController {
  @Inject()
  ctx: Context;

  @Inject()
  private designRequirementDocumentService: DesignRequirementDocumentService;

  private resolveOperatorId(): string {
    const ctxAny = this.ctx as any;
    const user = ctxAny?.user || ctxAny?.state?.user || {};
    const headers = this.ctx.headers || {};
    return (
      user.jobNum ||
      user.jobId ||
      user.id ||
      headers['x-operator-id'] ||
      headers['x-user-id'] ||
      this.ctx.get('x-operator-id') ||
      this.ctx.get('x-user-id') ||
      'system'
    );
  }

  @ApiOperation({ summary: '生成需求规格文档草稿' })
  @ApiOkResponse({ type: RequirementDocumentDetailResponse })
  @Post('/generate')
  async generateRequirementDocument(@Body() body: GenerateRequirementDocumentBody & { designId: string }) {
    const { designId, ...restBody } = body;
    const operatorId = this.resolveOperatorId();
    const ctx = this.ctx;

    ctx.status = HttpStatus.OK;
    ctx.set('Content-Type', 'text/event-stream; charset=utf-8');
    ctx.set('Cache-Control', 'no-cache, no-transform');
    ctx.set('Connection', 'keep-alive');
    ctx.set('Transfer-Encoding', 'chunked');

    if (typeof ctx.res.flushHeaders === 'function') {
      ctx.res.flushHeaders();
    }

    ctx.respond = false;

    let clientClosed = false;
    let finished = false;

    const writeEvent = (payload: Record<string, any>) => {
      if (clientClosed || finished) {
        return;
      }
      ctx.res.write(`data: ${JSON.stringify(payload)}\n\n`);
      if (typeof (ctx.res as any).flush === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-extra-semi
        (ctx.res as any).flush();
      }
    };

    const handleError = (error: unknown) => {
      if (clientClosed || finished) {
        return;
      }
      const message = error instanceof Error ? error.message : 'Unknown error';
      writeEvent({ event: 'error', message });
      endStream();
    };

    const endStream = () => {
      if (clientClosed || finished) {
        return;
      }
      finished = true;
      ctx.res.end();
    };

    ctx.req.on('close', () => {
      clientClosed = true;
    });

    try {
      await this.designRequirementDocumentService.streamRequirementDocument(designId, restBody, operatorId, {
        onChunk: (chunk) => {
          console.log('onChunk controller', chunk);
          writeEvent({ event: 'chunk', content: chunk });
        },
        onComplete: () => {
          writeEvent({ event: 'done' });
          endStream();
        },
        onError: handleError,
      });
    } catch (error) {
      handleError(error);
    }
  }

  @ApiOperation({ summary: '更新需求文档' })
  @ApiOkResponse({ type: RequirementDocumentDetailResponse })
  @Post('/update')
  async updateRequirementDocument(@Body() body: UpdateRequirementDocumentBody & { docId: string }) {
    const { docId, ...restBody } = body;
    const operatorId = this.resolveOperatorId();
    await this.designRequirementDocumentService.updateRequirementDocument(docId, restBody, operatorId);
    return new RequirementDocumentDetailResponse('doc');
  }

  @ApiOperation({ summary: '获取需求文档详情' })
  @ApiOkResponse({ type: RequirementDocumentDetailResponse })
  @Get('/detail')
  async getRequirementDocument(@Query() query: { docId: string }) {
    const { docId } = query;
    const doc = await this.designRequirementDocumentService.getRequirementDocumentById(docId);
    if (!doc) {
      throw new MidwayHttpError('Requirement document not found', HttpStatus.NOT_FOUND);
    }
    return new RequirementDocumentDetailResponse(doc.content);
  }

  @ApiOperation({ summary: '分页查询需求文档列表' })
  @ApiOkResponse({ type: RequirementDocumentListResponse })
  @Get('/list')
  async listRequirementDocuments(@Query() query: RequirementDocumentPaginationQuery & { designId: string }) {
    const { designId, ...restQuery } = query;
    const { list, total } = await this.designRequirementDocumentService.paginateRequirementDocuments(
      designId,
      restQuery
    );
    return new RequirementDocumentListResponse(list, total);
  }

  @ApiOperation({ summary: '导出需求文档文件' })
  @ApiOkResponse({ type: RequirementDocumentExportResponse })
  @Post('/export')
  async exportRequirementDocument(@Body() body: { docId: string }) {
    const { docId } = body;
    const operatorId = this.resolveOperatorId();
    const downloadUrl = await this.designRequirementDocumentService.exportRequirementDocument(docId, operatorId);
    return new RequirementDocumentExportResponse(downloadUrl);
  }
}
