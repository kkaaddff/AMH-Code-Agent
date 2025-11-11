import { Body, Controller, Inject, Post } from '@midwayjs/decorator';
import { Context } from '@midwayjs/web';
import { Validate } from '@midwayjs/validate';
import { v4 as uuid } from 'uuid';
import { FrontendWorkflowRequestDTO } from '../../dto/code-agent/frontend-workflow.dto';
import { FrontendWorkflowService } from '../../service/code-agent/frontend-workflow';

@Controller('/code-agent')
export class FrontendWorkflowController {
  @Inject()
  private ctx: Context;

  @Inject()
  private frontendWorkflowService: FrontendWorkflowService;

  @Post('/frontend-workflow')
  @Validate()
  async startFrontendWorkflow(@Body() body: FrontendWorkflowRequestDTO) {
    const { designDocId, productName = 'FTA-Frontend' } = body;

    // 设置 SSE 响应头
    this.ctx.status = 200;
    this.ctx.set('Content-Type', 'text/event-stream; charset=utf-8');
    this.ctx.set('Cache-Control', 'no-cache');
    this.ctx.set('Connection', 'keep-alive');
    this.ctx.set('Access-Control-Allow-Origin', '*');

    const res = this.ctx.res;

    // SSE 事件发送辅助函数
    const sendSSE = (event: string, data: any) => {
      const payload = JSON.stringify(data);
      res.write(`event: ${event}\ndata: ${payload}\n\n`);
    };

    const sessionId = uuid();

    try {
      // 调用 service 执行 workflow
      const result = await this.frontendWorkflowService.runWorkflow({
        designDocId,
        productName,
        sessionId,
        callbacks: {
          onMessage: async (opts) => {
            const { message } = opts;
            sendSSE('message', {
              role: message.role,
              content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
              uuid: message.uuid,
              parentUuid: message.parentUuid,
              timestamp: message.timestamp,
            });
          },
          onText: async (text) => {
            sendSSE('text', { text });
          },
          onStreamResult: async (streamResult) => {
            sendSSE('stream_result', {
              requestId: streamResult.requestId,
              model: streamResult.model?.model || null,
              hasError: !!streamResult.error,
              error: streamResult.error
                ? {
                    message: streamResult.error.message,
                    name: streamResult.error.name,
                  }
                : undefined,
            });
          },
          onTurn: async (turn) => {
            sendSSE('turn', {
              usage: turn.usage,
              startTime: turn.startTime,
              endTime: turn.endTime,
            });
          },
          onToolApprove: async (opts) => {
            const { toolUse, category } = opts;
            sendSSE('tool_approve', {
              toolName: toolUse.name,
              callId: toolUse.callId,
              params: toolUse.params,
              category,
            });
            // 自动批准所有工具调用
            return true;
          },
        },
      });

      // 发送完成事件
      sendSSE('complete', result);

      res.end();
    } catch (error: any) {
      console.error('Frontend workflow error:', error);
      sendSSE('error', {
        message: error?.message || 'Frontend workflow failed',
        stack: error?.stack,
      });
      res.end();
    }
  }
}
