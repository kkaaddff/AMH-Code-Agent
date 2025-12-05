import { Body, Controller, Inject, Post } from '@midwayjs/decorator';
import { Validate } from '@midwayjs/validate';
import { Context } from '@midwayjs/web';
import { v4 as uuid } from 'uuid';
import { FrontendWorkflowRequestDTO } from '../../dto/code-agent/frontend-workflow.dto';
import { FrontendWorkflowService } from '../../service/code-agent/frontend-workflow';

// ToolResult 类型定义（与 agent-core 保持一致）
type TextPart = {
  type: 'text';
  text: string;
};

type ImagePart = {
  type: 'image';
  data: string;
  mimeType: string;
};

type ToolResult = {
  llmContent: string | (TextPart | ImagePart)[];
  returnDisplay?: string | any;
  isError?: boolean;
};

@Controller('/code-agent')
export class FrontendWorkflowController {
  @Inject()
  private ctx: Context;

  @Inject()
  private frontendWorkflowService: FrontendWorkflowService;

  // Global map to track pending tool calls across all sessions
  private static pendingToolCalls = new Map<
    string,
    {
      resolve: (value: any) => void;
      reject: (reason?: any) => void;
      timestamp: number;
      sessionId: string;
    }
  >();

  // Map to track callIds per session for efficient cleanup
  private static sessionCallIds = new Map<string, Set<string>>();

  @Post('/frontend-workflow/tool-result')
  async handleToolResult(
    @Body() body: { callId: string; toolName: string; params: any; toolResult: ToolResult | string }
  ) {
    const { callId, toolResult } = body;
    const pending = FrontendWorkflowController.pendingToolCalls.get(callId);

    if (!pending) {
      return { success: false, message: 'Tool call not found or expired' };
    }

    const { sessionId } = pending;
    FrontendWorkflowController.pendingToolCalls.delete(callId);

    // Clean up from sessionCallIds
    const sessionCalls = FrontendWorkflowController.sessionCallIds.get(sessionId);
    if (sessionCalls) {
      sessionCalls.delete(callId);
      if (sessionCalls.size === 0) {
        FrontendWorkflowController.sessionCallIds.delete(sessionId);
      }
    }
    let toolResultObject: ToolResult;
    if (typeof toolResult === 'string') {
      toolResultObject = JSON.parse(toolResult);
    } else {
      toolResultObject = toolResult;
    }
    // 根据 ToolResult 的 isError 字段判断是 resolve 还是 reject
    if (toolResultObject.isError) {
      // 错误情况：从 llmContent 提取错误信息
      const errorMessage =
        typeof toolResultObject.llmContent === 'string'
          ? toolResultObject.llmContent
          : JSON.stringify(toolResultObject.llmContent);

      pending.reject(new Error(errorMessage));
    } else {
      // 成功情况：resolve ToolResult 对象
      pending.resolve(toolResultObject);
    }

    return { success: true };
  }

  @Post('/frontend-workflow')
  @Validate()
  async startFrontendWorkflow(@Body() body: FrontendWorkflowRequestDTO) {
    const { designDocId, productName = 'FTA-Frontend', srcTree, apiKey, baseURL, model } = body;

    // 生成会话ID并开始日志记录
    const sessionId = uuid();
    const startTime = Date.now();

    console.log(`frontend-workflow: [${sessionId}] 🚀 前端工作流开始启动`);
    console.log(
      `frontend-workflow: [${sessionId}] 📋 请求参数: designDocId=${designDocId}, productName=${productName}`
    );

    // 设置 SSE 响应头
    this.ctx.status = 200;
    this.ctx.set('Content-Type', 'text/event-stream; charset=utf-8');
    this.ctx.set('Cache-Control', 'no-cache');
    this.ctx.set('Connection', 'keep-alive');

    // 监听客户端断开连接
    const req = this.ctx.req;
    const res = this.ctx.res;

    // SSE 事件发送辅助函数
    const sendSSE = (event: string, data: any) => {
      const payload = JSON.stringify(data);
      res.write(`event: ${event}\ndata: ${payload}\n\n`);
    };

    // 创建 AbortController 用于处理客户端断开连接
    const abortController = new AbortController();

    console.log(`frontend-workflow: [${sessionId}] 📡 SSE连接已建立，准备监听客户端断开事件`);

    const onClose = (e: any) => {
      if (abortController.signal.aborted) {
        console.log('客户端断开连接', e);
        const duration = Date.now() - startTime;
        console.log(
          `frontend-workflow: [${sessionId}] ❌ 客户端断开连接 (持续${(duration / 1000).toFixed(2)}秒)，中断工作流`
        );
      }
    };

    res.on('close', onClose);
    res.on('error', onClose);

    req.on('close', onClose);
    req.on('error', onClose);

    try {
      console.log(`frontend-workflow: [${sessionId}] ⏳ 开始调用前端工作流服务`);

      // 调用 service 执行 workflow
      const result = await this.frontendWorkflowService.runWorkflow({
        designDocId,
        productName,
        srcTree,
        apiKey,
        baseURL,
        model,
        sessionId,
        signal: abortController.signal,
        toolProxy: async (toolName: string, params: any) => {
          const callId = uuid();

          // Send SSE event requesting tool execution
          sendSSE('tool_call', {
            callId,
            toolName,
            params,
          });

          // Create and store promise
          return new Promise((resolve, reject) => {
            FrontendWorkflowController.pendingToolCalls.set(callId, {
              resolve,
              reject,
              timestamp: Date.now(),
              sessionId,
            });

            // Track callId per session for cleanup
            if (!FrontendWorkflowController.sessionCallIds.has(sessionId)) {
              FrontendWorkflowController.sessionCallIds.set(sessionId, new Set());
            }
            FrontendWorkflowController.sessionCallIds.get(sessionId)!.add(callId);

            // Optional: Set timeout to reject after 60 seconds
            const timeoutId = setTimeout(() => {
              if (FrontendWorkflowController.pendingToolCalls.has(callId)) {
                FrontendWorkflowController.pendingToolCalls.delete(callId);
                // Clean up from sessionCallIds
                const sessionCalls = FrontendWorkflowController.sessionCallIds.get(sessionId);
                if (sessionCalls) {
                  sessionCalls.delete(callId);
                  if (sessionCalls.size === 0) {
                    FrontendWorkflowController.sessionCallIds.delete(sessionId);
                  }
                }
                reject(new Error('Tool execution timeout'));
              }
            }, 60000);

            // Store timeoutId for potential cleanup (though we don't need to clear it in normal flow)
            // The timeout will naturally clean up after 60s
          });
        },
        callbacks: {
          onMessage: async (opts) => {
            const { message } = opts;
            console.log(`frontend-workflow: [${sessionId}] 💬 收到消息: role=${message.role}, uuid=${message.uuid}`);
            sendSSE('message', {
              role: message.role,
              content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
              uuid: message.uuid,
              parentUuid: message.parentUuid,
              timestamp: message.timestamp,
            });
          },
          onText: async (text) => {
            console.log(
              `frontend-workflow: [${sessionId}] 📝 收到文本片段: ${text.substring(0, 50)}${
                text.length > 50 ? '...' : ''
              }`
            );
            sendSSE('text', { text });
          },
          onStreamResult: async (streamResult) => {
            const hasError = !!streamResult.error;
            console.log(
              `frontend-workflow: [${sessionId}] 🔄 流式结果: requestId=${
                streamResult.requestId
              }, hasError=${hasError}, model=${
                streamResult.model?.model ? JSON.stringify(streamResult.model.model) : 'N/A'
              }`
            );
            if (hasError) {
              console.error(`frontend-workflow: [${sessionId}] ❌ 流式结果错误:`, streamResult.error);
            }
            sendSSE('stream_result', {
              requestId: streamResult.requestId,
              model: streamResult.model?.model || null,
              hasError,
              error: streamResult.error
                ? {
                    message: streamResult.error.message,
                    name: streamResult.error.name,
                  }
                : undefined,
            });
          },
          onTurn: async (turn) => {
            const startTime = Number(turn.startTime);
            const endTime = Number(turn.endTime);
            const duration = endTime - startTime;
            console.log(
              `frontend-workflow: [${sessionId}] 🔄 对话轮次完成: 开始时间=${new Date(startTime).toISOString()}, 持续${(
                duration / 1000
              ).toFixed(2)}秒`
            );
            console.log(`frontend-workflow: [${sessionId}] 📊 Token使用情况:\n`, turn.usage);
            sendSSE('turn', {
              usage: turn.usage,
              startTime: turn.startTime,
              endTime: turn.endTime,
            });
          },
          onToolApprove: async (opts) => {
            const { toolUse, category } = opts;

            // 自动批准所有工具调用
            // 注意：文件系统工具的实际执行通过 toolProxy 的 tool_call 事件处理
            return true;
          },
        },
      });

      // 计算总执行时间
      const totalDuration = Date.now() - startTime;

      // 发送完成事件
      console.log(
        `frontend-workflow: [${sessionId}] ✅ 工作流执行完成 (总耗时: ${(totalDuration / 1000).toFixed(2)}秒)`
      );
      console.log(
        `frontend-workflow: [${sessionId}] 📊 执行结果: success=${result.success}, filesCount=${result.filesCount || 0}`
      );

      sendSSE('complete', {
        ...result,
        executionTime: totalDuration,
        sessionId,
        timestamp: new Date().toISOString(),
      });

      console.log(`frontend-workflow: [${sessionId}] 📤 发送完成事件，关闭SSE连接`);
      res.end();
    } catch (error: any) {
      // 计算错误发生时的执行时间
      const errorDuration = Date.now() - startTime;

      // 如果是 AbortError，表示客户端主动断开
      if (error.name === 'AbortError' || abortController.signal.aborted) {
        console.log(
          `frontend-workflow: [${sessionId}] ⏹️ 工作流已被中断 (执行${(errorDuration / 1000).toFixed(2)}秒后)`
        );
        sendSSE('aborted', {
          message: '工作流已被用户中断',
          sessionId,
          executionTime: errorDuration,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error(
          `frontend-workflow: [${sessionId}] ❌ 工作流执行失败 (执行${(errorDuration / 1000).toFixed(2)}秒后):`,
          error
        );
        console.error(`frontend-workflow: [${sessionId}] 🔍 错误详情:`, {
          name: error.name,
          message: error.message,
          stack: error.stack,
        });
        sendSSE('error', {
          message: error?.message || 'Frontend workflow failed',
          stack: error?.stack,
          sessionId,
          executionTime: errorDuration,
          timestamp: new Date().toISOString(),
        });
      }
      res.end();
    } finally {
      // 清理事件监听器
      console.log(`frontend-workflow: [${sessionId}] 🧹 清理事件监听器`);
      req.off('close', onClose);
      req.off('error', onClose);

      // 清理该 session 的所有待处理工具调用，防止内存泄漏
      const sessionCalls = FrontendWorkflowController.sessionCallIds.get(sessionId);
      if (sessionCalls) {
        const callIdsToClean = Array.from(sessionCalls);
        console.log(`frontend-workflow: [${sessionId}] 🧹 清理 ${callIdsToClean.length} 个待处理的工具调用`);
        for (const callId of callIdsToClean) {
          const pending = FrontendWorkflowController.pendingToolCalls.get(callId);
          if (pending) {
            // Reject with abort error to signal the tool call was cancelled
            pending.reject(new Error('Tool call cancelled: workflow aborted or error occurred'));
            FrontendWorkflowController.pendingToolCalls.delete(callId);
          }
        }
        FrontendWorkflowController.sessionCallIds.delete(sessionId);
      }
    }
  }
}
