/**
 * FrontendWorkflowScheduler - 前端工作流 SSE 客户端调度器
 *
 * 职责：
 * 1. 发起 SSE 请求到后端 /code-agent/frontend-workflow 接口
 * 2. 解析 SSE 事件流
 * 3. 将新接口事件映射到原有回调函数
 */
import { ApiService, type StreamingRequestConfig } from '@/utils/apiService';
import { getModelConfig } from '@/utils/modelConfig';
import { callService } from '@/utils/workstationConnector';
import { TodoItem } from './types';

// ToolResult 类型定义（与 agent-core 保持一致）
export type TextPart = {
  type: 'text';
  text: string;
};

export type ImagePart = {
  type: 'image';
  data: string;
  mimeType: string;
};

export type ToolResult = {
  llmContent: string | (TextPart | ImagePart)[];
  returnDisplay?: string | any;
  isError?: boolean;
};

export interface FrontendWorkflowParams {
  designDocId: string;
  productName?: string;
  srcTree?: TreeNode;
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export interface FileProposal {
  path: string;
  kind: 'file' | 'directory';
  description?: string;
  content?: string;
  tags?: string[];
  callId?: string;
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
  private todos: TodoItem[] = [];

  /**
   * 执行前端工作流 SSE 会话
   */
  async execute(params: FrontendWorkflowParams, callbacks: FrontendWorkflowCallbacks = {}): Promise<void> {
    this.abortController = new AbortController();
    this.currentIteration = 0;
    this.todos = []; // 重置 todo list

    try {
      // 优先使用请求参数，如果没有则从 localStorage 读取
      const storedConfig = getModelConfig();
      const apiKey = params.apiKey || storedConfig.apiKey;
      const baseURL = params.baseURL || storedConfig.baseURL;
      const model = params.model || storedConfig.model;

      const requestBody = {
        designDocId: params.designDocId,
        productName: params.productName || 'FTA-Frontend',
        srcTree: params.srcTree || undefined,
        ...(apiKey && { apiKey }),
        ...(baseURL && { baseURL }),
        ...(model && { model }),
      };

      // 使用自定义的流式请求处理逻辑，因为这里需要解析特殊的事件格式
      const streamingConfig: StreamingRequestConfig = {
        signal: this.abortController.signal, // 传入外部的 AbortSignal
        onChunk: (_chunk: string) => {
          // 这里不处理，因为我们需要完整的事件解析逻辑
        },
        onError: (error: Error) => {
          if (error.name === 'AbortError') {
            console.log('SSE 连接已中断');
            return;
          }
          const errorMessage = error?.message || 'SSE 连接错误';
          console.error('SSE 错误:', errorMessage);
          callbacks.onError?.(errorMessage);
        },
        onComplete: () => {
          console.log('SSE 连接完成');
        },
      };

      // 由于 FrontendWorkflowScheduler 需要特殊的事件解析逻辑（event: 和 data: 的配对），
      // 而 ApiService 的 streamingRequest 只处理标准的 SSE 格式，
      // 所以这里仍需要自定义实现，但使用统一的错误处理和配置管理
      await this.executeWithCustomSSEHandling(requestBody, callbacks, streamingConfig);
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
   * 使用自定义 SSE 处理逻辑执行请求
   */
  private async executeWithCustomSSEHandling(
    requestBody: any,
    callbacks: FrontendWorkflowCallbacks,
    config: StreamingRequestConfig
  ): Promise<void> {
    const { signal } = config;

    // 使用 ApiService 构建请求 URL 和头部，但不使用其流式处理
    const { buildApiUrl } = await import('@/config/api');
    const url = buildApiUrl('/code-agent/frontend-workflow');

    // 构建请求头（复用 ApiService 的逻辑）
    const requestHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    };

    // 从 window.userInfo 中获取 cookies 并添加到自定义请求头
    if (window.userInfo?.cookies) {
      const cookiesJson = JSON.stringify(window.userInfo.cookies);
      requestHeaders['X-User-Cookies'] = cookiesJson;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: requestHeaders,
      body: JSON.stringify(requestBody),
      signal,
      credentials: 'include',
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

        // 解析 SSE 事件（保持原有逻辑）
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
  }

  /**
   * 处理 SSE 事件
   */
  private handleSSEEvent(eventType: string, data: any, callbacks: FrontendWorkflowCallbacks): void {
    switch (eventType) {
      case 'turn':
        // turn 事件表示新的一轮对话开始
        this.currentIteration += 1;
        callbacks.onIterationStart?.(this.currentIteration);

        // turn 事件也包含结束时间，表示这轮迭代结束
        if (data.endTime) {
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

      case 'aborted':
        // 工作流已被中断
        console.log('工作流已被中断:', data.message);
        callbacks.onError?.(data.message || '工作流已被用户中断');
        break;

      case 'tool_call':
        if (data.toolName && data.callId) {
          this.handleToolCall(data.toolName, data.params, data.callId, callbacks);
        }
        break;

      default:
        // 忽略其他事件类型（如 stream_result, info, warning 等）
        break;
    }
  }

  /**
   * 获取当前的 AbortController
   */
  getAbortController(): AbortController | null {
    return this.abortController;
  }

  /**
   * 将工具执行结果转换为字符串，用于构造 ToolResult 的 llmContent
   */
  private normalizeToolResultContent(result: any): string {
    return typeof result === 'string' ? result : JSON.stringify(result);
  }

  /**
   * Handle tool call from backend
   */
  private async handleToolCall(
    toolName: string,
    params: any,
    callId: string,
    callbacks: FrontendWorkflowCallbacks
  ): Promise<void> {
    let toolResult: ToolResult;

    try {
      // Execute the tool using callService - switch case 只专注于获取工具执行结果
      let toolExecutionResult: any;
      let specialResult: { llmContent: string; returnDisplay?: any } | null = null;

      switch (toolName) {
        case 'todoWrite': {
          // 保存旧的 todos
          const oldTodos = [...this.todos];

          let todos = params.todos;
          if (typeof todos === 'string') {
            try {
              todos = JSON.parse(todos);
            } catch (err) {
              console.error('解析 todos 字符串失败:', err, todos);
              todos = [];
            }
          }

          // 将 todos 统一转换为 TodoItem 类型
          let normalizedTodos: TodoItem[] = [];
          if (Array.isArray(todos)) {
            normalizedTodos = todos.map((item: any, idx: number) => {
              if (typeof item === 'object' && item !== null) {
                return {
                  id: item.id ?? `todo-${idx}`,
                  content: item.content ?? item.name ?? item.task ?? item.description ?? '',
                  status: (item.status ?? 'pending') as TodoItem['status'],
                  priority: (item.priority ?? 'medium') as TodoItem['priority'],
                };
              }
              // 如果是字符串等非对象类型，转为空 todo
              return {
                id: `todo-${idx}`,
                content: String(item),
                status: 'pending' as TodoItem['status'],
                priority: 'medium' as TodoItem['priority'],
              };
            });

            // 更新内部存储的 todos
            this.todos = normalizedTodos;

            // 触发回调通知前端更新
            callbacks.onTodoUpdate?.(normalizedTodos);
          }

          // todoWrite 需要特殊的 ToolResult 格式
          specialResult = {
            llmContent:
              'Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress. Please proceed with the current tasks if applicable',
            returnDisplay: { type: 'todo_write', oldTodos, newTodos: normalizedTodos },
          };
          break;
        }

        case 'todoRead': {
          // todoRead 需要特殊的 ToolResult 格式
          specialResult = {
            llmContent: this.todos.length === 0 ? 'Todo list is empty' : `Found ${this.todos.length} todos`,
            returnDisplay: { type: 'todo_read', todos: this.todos },
          };
          break;
        }

        case 'read':
          toolExecutionResult = await callService('tools', 'read', {
            file_path: params.file_path,
            offset: params.offset ?? null,
            limit: params.limit ?? null,
          });
          break;

        case 'write':
          toolExecutionResult = await callService('tools', 'write', {
            file_path: params.file_path,
            content: params.content,
          });
          break;

        case 'ls':
          toolExecutionResult = await callService('tools', 'ls', {
            dir_path: params.dir_path,
          });
          break;

        case 'grep':
          toolExecutionResult = await callService('tools', 'grep', {
            pattern: params.pattern,
            search_path: params.search_path,
            include: params.include,
            limit: params.limit,
          });
          break;

        case 'glob':
          toolExecutionResult = await callService('tools', 'glob', {
            pattern: params.pattern,
            path: params.path,
          });
          break;

        case 'edit':
          toolExecutionResult = await callService('tools', 'edit', {
            file_path: params.file_path,
            old_string: params.old_string,
            new_string: params.new_string,
          });
          break;

        case 'rm':
          toolExecutionResult = await callService('tools', 'rm', {
            file_path: params.file_path,
          });
          break;

        case 'verify':
          toolExecutionResult = await callService('tools', 'verify', {});
          break;

        case 'bash':
          toolExecutionResult = await callService('tools', 'executeCommand', {
            command: params.command,
            timeout: params.timeout,
            run_in_background: params.run_in_background,
          });
          break;

        case 'bash_output':
          toolExecutionResult = await callService('tools', 'getBackgroundTaskOutput', {
            task_id: params.task_id,
          });
          break;

        case 'kill_bash':
          toolExecutionResult = await callService('tools', 'killBackgroundTask', {
            task_id: params.task_id,
          });
          break;

        default:
          throw new Error(`Unknown tool: ${toolName}`);
      }

      if (specialResult) {
        // 特殊工具（todoWrite/todoRead）使用预定义的格式
        toolResult = specialResult;
      } else {
        // 普通工具统一处理：将执行结果转换为字符串
        toolResult = {
          llmContent: this.normalizeToolResultContent(toolExecutionResult),
        };
      }
    } catch (err) {
      // 捕获工具执行错误，构造错误 ToolResult
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      toolResult = {
        llmContent: errorMessage,
        isError: true,
      };
    }

    // 统一发送 ToolResult，如果发送失败只记录日志，避免重复请求
    try {
      await this.sendToolResult(callId, toolName, params, toolResult);
    } catch (sendError) {
      // sendToolResult 失败时只记录日志，不再重试，避免触发重复请求
      console.error('发送工具结果失败:', sendError, {
        callId,
        toolName,
        toolResult,
      });
    }
  }

  private async sendToolResult(callId: string, toolName: string, params: any, toolResult: ToolResult): Promise<void> {
    await ApiService.post('/code-agent/frontend-workflow/tool-result', {
      callId,
      toolName,
      params,
      toolResult,
    });
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
