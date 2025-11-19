import { Body, Controller, Inject, Post } from '@midwayjs/decorator';
import { Validate } from '@midwayjs/validate';
import { Context } from '@midwayjs/web';
import fs from 'fs';
import path from 'path';
import { v4 as uuid } from 'uuid';
import { FrontendWorkflowRequestDTO } from '../../dto/code-agent/frontend-workflow.dto';
import { FrontendWorkflowService } from '../../service/code-agent/frontend-workflow';

/**
 * 日志路径生产相关辅助函数
 */
function generateLogPaths() {
  const logDir = path.join(process.cwd(), 'logs', 'api');
  // 日志文件名包含当前从当天0点到现在的秒数
  const now = new Date();
  const dayStr = now.toISOString().split('T')[0];
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const secondsSinceZero = Math.floor((now.getTime() - startOfDay.getTime()) / 1000);
  const logFile = path.join(logDir, `frontend-workflow-${dayStr}-${secondsSinceZero}.log`);
  return { logDir, logFile };
}

function appendLogSegmentsFactory(logDir: string, logFile: string, sessionId: string) {
  return (...entries: any[]) => {
    try {
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const logEntry = entries.map((entry) => JSON.stringify(entry)).join('\n') + '\n---\n';
      fs.appendFileSync(logFile, logEntry, 'utf8');
    } catch (logError) {
      console.error(`frontend-workflow: [${sessionId}] ⚠️ 写入日志失败:`, logError);
    }
  };
}

@Controller('/code-agent')
export class FrontendWorkflowController {
  @Inject()
  private ctx: Context;

  @Inject()
  private frontendWorkflowService: FrontendWorkflowService;

  @Post('/frontend-workflow')
  @Validate()
  async startFrontendWorkflow(@Body() body: FrontendWorkflowRequestDTO) {
    const { designDocId, productName = 'FTA-Frontend', srcTree } = body;

    // 生成会话ID并开始日志记录
    const sessionId = uuid();
    const startTime = Date.now();
    // 使用辅助函数生产日志路径
    const { logDir, logFile } = generateLogPaths();
    // 使用辅助函数创建 appendLogSegments
    const appendLogSegments = appendLogSegmentsFactory(logDir, logFile, sessionId);

    appendLogSegments({
      timestamp: new Date().toISOString(),
      type: 'REQUEST',
      direction: 'IN',
      sessionId,
      endpoint: '/code-agent/frontend-workflow',
      payload: {
        designDocId,
        productName,
        srcTree,
      },
    });

    console.log(`frontend-workflow: [${sessionId}] 🚀 前端工作流开始启动`);
    console.log(
      `frontend-workflow: [${sessionId}] 📋 请求参数: designDocId=${designDocId}, productName=${productName}`
    );

    // 设置 SSE 响应头
    this.ctx.status = 200;
    this.ctx.set('Content-Type', 'text/event-stream; charset=utf-8');
    this.ctx.set('Cache-Control', 'no-cache');
    this.ctx.set('Connection', 'keep-alive');
    this.ctx.set('Access-Control-Allow-Origin', '*');

    // 监听客户端断开连接
    const req = this.ctx.req;
    const res = this.ctx.res;

    // SSE 事件发送辅助函数
    const sendSSE = (event: string, data: any) => {
      const payload = JSON.stringify(data);
      res.write(`event: ${event}\ndata: ${payload}\n\n`);
    };

    const logSSEEvent = (event: string, data: any) => {
      appendLogSegments({
        timestamp: new Date().toISOString(),
        type: 'SSE_EVENT',
        direction: 'OUT',
        sessionId,
        event,
        data,
      });
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
        sessionId,
        signal: abortController.signal,
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
            logSSEEvent('message', {
              role: message.role,
              content: message.content,
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
            logSSEEvent('text', { text });
          },
          onStreamResult: async (streamResult) => {
            const hasError = !!streamResult.error;
            console.log(
              `frontend-workflow: [${sessionId}] 🔄 流式结果: requestId=${
                streamResult.requestId
              }, hasError=${hasError}, model=${streamResult.model?.model || 'N/A'}`
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
            logSSEEvent('stream_result', {
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
            console.log(`frontend-workflow: [${sessionId}] 📊 Token使用情况:`, turn.usage);
            sendSSE('turn', {
              usage: turn.usage,
              startTime: turn.startTime,
              endTime: turn.endTime,
            });
            logSSEEvent('turn', {
              usage: turn.usage,
              startTime: turn.startTime,
              endTime: turn.endTime,
            });
          },
          onToolApprove: async (opts) => {
            const { toolUse, category } = opts;
            console.log(
              `frontend-workflow: [${sessionId}] 🔧 工具调用审批: toolName=${toolUse.name}, callId=${toolUse.callId}, category=${category}`
            );
            sendSSE('tool_approve', {
              toolName: toolUse.name,
              callId: toolUse.callId,
              params: toolUse.params,
              category,
            });
            logSSEEvent('tool_approve', {
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
      appendLogSegments({
        timestamp: new Date().toISOString(),
        type: 'COMPLETE',
        direction: 'OUT',
        sessionId,
        event: 'complete',
        executionTime: totalDuration,
        result,
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
        appendLogSegments({
          timestamp: new Date().toISOString(),
          type: 'ABORT',
          direction: 'OUT',
          sessionId,
          event: 'aborted',
          executionTime: errorDuration,
          reason: error?.message || 'aborted',
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
        appendLogSegments({
          timestamp: new Date().toISOString(),
          type: 'ERROR',
          direction: 'OUT',
          sessionId,
          event: 'error',
          executionTime: errorDuration,
          error: {
            name: error.name,
            message: error.message,
            stack: error.stack,
          },
        });
      }
      res.end();
    } finally {
      // 清理事件监听器
      console.log(`frontend-workflow: [${sessionId}] 🧹 清理事件监听器`);
      req.off('close', onClose);
      req.off('error', onClose);
    }
  }
}
