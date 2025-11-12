/**
 * FrontendWorkflowScheduler - 前端工作流 SSE 客户端调度器
 *
 * 职责：
 * 1. 发起 SSE 请求到后端 /code-agent/frontend-workflow 接口
 * 2. 解析 SSE 事件流
 * 3. 将新接口事件映射到原有回调函数
 */

import { buildApiUrl } from '@/config/api';
import { TodoItem } from './CodeGenerationLoop/types';

export interface FrontendWorkflowParams {
  designDocId: string;
  productName?: string;
}

export interface FrontendWorkflowCallbacks {
  onIterationStart?: (iteration: number) => void;
  onTextChunk?: (text: string) => void;
  onTodoUpdate?: (todos: TodoItem[]) => void;
  onIterationEnd?: (iteration: number) => void;
  onSessionComplete?: () => void;
  onError?: (error: string) => void;
}

/**
 * Frontend Workflow SSE Scheduler 类
 */
export class FrontendWorkflowScheduler {
  private abortController: AbortController | null = null;
  private currentIteration = 0;

  /**
   * 执行前端工作流 SSE 会话
   */
  async execute(params: FrontendWorkflowParams, callbacks: FrontendWorkflowCallbacks = {}): Promise<void> {
    this.abortController = new AbortController();
    this.currentIteration = 0;
    console.log('execute params', params);

    try {
      const response = await fetch(buildApiUrl('/code-agent/frontend-workflow'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          designDocId: '690ab433aed2d277ac31d6c7',
          productName: 'FTA-Frontend',
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SSE 连接失败: ${response.status} ${response.statusText} ${errorText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('SSE 服务未返回可读流');
      }

      const decoder = new TextDecoder();
      let buffer = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // 解析 SSE 事件
          let newlineIndex = buffer.indexOf('\n');
          while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (line.startsWith('event:')) {
              const eventType = line.slice(6).trim();

              // 读取下一行的 data
              newlineIndex = buffer.indexOf('\n');
              if (newlineIndex !== -1) {
                const dataLine = buffer.slice(0, newlineIndex).trim();
                buffer = buffer.slice(newlineIndex + 1);

                if (dataLine.startsWith('data:')) {
                  const dataContent = dataLine.slice(5).trim();

                  try {
                    const data = JSON.parse(dataContent);
                    this.handleSSEEvent(eventType, data, callbacks);
                  } catch (err) {
                    console.error('解析 SSE 数据失败:', err, dataContent);
                  }
                }
              }
            }

            newlineIndex = buffer.indexOf('\n');
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        console.log('SSE 连接已中断');
        return;
      }

      const errorMessage = error?.message || 'SSE 连接错误';
      console.error('SSE 错误:', errorMessage);
      callbacks.onError?.(errorMessage);
    }
  }

  /**
   * 处理 SSE 事件
   */
  private handleSSEEvent(eventType: string, data: any, callbacks: FrontendWorkflowCallbacks): void {
    switch (eventType) {
      case 'turn':
        // turn 事件表示新的一轮对话开始
        this.currentIteration += 1;
        console.log(`开始第 ${this.currentIteration} 轮迭代`);
        callbacks.onIterationStart?.(this.currentIteration);

        // turn 事件也包含结束时间，表示这轮迭代结束
        if (data.endTime) {
          console.log(`第 ${this.currentIteration} 轮迭代结束`);
          callbacks.onIterationEnd?.(this.currentIteration);
        }
        break;

      case 'text':
        // 文本输出
        if (data.text && typeof data.text === 'string') {
          // callbacks.onTextChunk?.(data.text);
        }
        break;

      case 'message':
        // Agent 消息，如果是 assistant 消息且包含文本，提取文本内容
        if (data.role === 'assistant' && data.content) {
          try {
            // content 可能是字符串或 JSON 字符串
            let content = data.content;
            if (typeof content === 'string') {
              try {
                const parsed = JSON.parse(content);
                if (Array.isArray(parsed)) {
                  // 提取 text 类型的消息
                  const textParts = parsed
                    .filter((item: any) => item.type === 'text' && item.text)
                    .map((item: any) => item.text)
                    .join('');
                  if (textParts) {
                    callbacks.onTextChunk?.(textParts);
                  }
                }
              } catch {
                // 如果不是 JSON，直接使用字符串
                callbacks.onTextChunk?.(content);
              }
            }
          } catch (err) {
            console.error('解析 message 内容失败:', err);
          }
        }
        break;

      case 'tool_approve':
        // 工具批准事件，当 toolName 为 todoWrite 时，提取 TODO 列表
        if (data.toolName === 'todoWrite' && data.params?.todos && Array.isArray(data.params.todos)) {
          console.log('TODO 更新:', data.params.todos);
          callbacks.onTodoUpdate?.(data.params.todos);
        }
        break;

      case 'complete':
        // 会话完成
        console.log('会话完成');
        callbacks.onSessionComplete?.();
        break;

      case 'error':
        // 错误事件
        const errorMessage = data.message || '代码生成失败';
        console.error('SSE 错误:', errorMessage);
        callbacks.onError?.(errorMessage);
        break;

      default:
        // 忽略其他事件类型（如 stream_result, info, warning 等）
        break;
    }
  }

  /**
   * 中断 SSE 连接
   */
  abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }
}
