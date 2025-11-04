/**
 * SSEScheduler - 轻量级 SSE 客户端调度器
 *
 * 职责：
 * 1. 发起 SSE 请求到后端 /neo/send 接口
 * 2. 解析 SSE 事件流
 * 3. 触发相应的回调函数
 */

export interface TodoItem {
  id: string;
  content: string;
  status: "pending" | "in_progress" | "completed";
  priority?: "low" | "medium" | "high";
}

export interface SSESchedulerParams {
  message: string;
  sessionId?: string;
  cwd?: string;
  model?: string;
}

export interface SSESchedulerCallbacks {
  onIterationStart?: (iteration: number) => void;
  onTextChunk?: (text: string) => void;
  onTodoUpdate?: (todos: TodoItem[]) => void;
  onIterationEnd?: (iteration: number) => void;
  onSessionComplete?: (sessionId: string) => void;
  onError?: (error: string) => void;
}

const SSE_ENDPOINT = "http://localhost:7001/neo/send";

/**
 * SSE Scheduler 类
 */
export class SSEScheduler {
  private abortController: AbortController | null = null;

  /**
   * 执行 SSE 会话
   */
  async execute(
    params: SSESchedulerParams,
    callbacks: SSESchedulerCallbacks = {}
  ): Promise<void> {
    this.abortController = new AbortController();

    try {
      const response = await fetch(SSE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          message: params.message,
          sessionId: params.sessionId,
          cwd: params.cwd,
          model: params.model,
        }),
        signal: this.abortController.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          `SSE 连接失败: ${response.status} ${response.statusText} ${errorText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("SSE 服务未返回可读流");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // 解析 SSE 事件
          let newlineIndex = buffer.indexOf("\n");
          while (newlineIndex !== -1) {
            const line = buffer.slice(0, newlineIndex).trim();
            buffer = buffer.slice(newlineIndex + 1);

            if (line.startsWith("event:")) {
              const eventType = line.slice(6).trim();

              // 读取下一行的 data
              newlineIndex = buffer.indexOf("\n");
              if (newlineIndex !== -1) {
                const dataLine = buffer.slice(0, newlineIndex).trim();
                buffer = buffer.slice(newlineIndex + 1);

                if (dataLine.startsWith("data:")) {
                  const dataContent = dataLine.slice(5).trim();

                  try {
                    const data = JSON.parse(dataContent);
                    this.handleSSEEvent(eventType, data, callbacks);
                  } catch (err) {
                    console.error("解析 SSE 数据失败:", err, dataContent);
                  }
                }
              }
            }

            newlineIndex = buffer.indexOf("\n");
          }
        }
      } finally {
        reader.releaseLock();
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        console.log("SSE 连接已中断");
      } else {
        const errorMessage = error?.message || "SSE 连接错误";
        console.error("SSE 错误:", errorMessage);
        callbacks.onError?.(errorMessage);
      }
    }
  }

  /**
   * 处理 SSE 事件
   */
  private handleSSEEvent(
    eventType: string,
    data: any,
    callbacks: SSESchedulerCallbacks
  ): void {
    switch (eventType) {
      case "iteration_start":
        if (typeof data.iteration === "number") {
          callbacks.onIterationStart?.(data.iteration);
        }
        break;

      case "text_delta":
        if (typeof data.text === "string") {
          callbacks.onTextChunk?.(data.text);
        }
        break;

      case "todo_update":
        if (Array.isArray(data.todos)) {
          callbacks.onTodoUpdate?.(data.todos);
        }
        break;

      case "iteration_end":
        if (typeof data.iteration === "number") {
          callbacks.onIterationEnd?.(data.iteration);
        }
        break;

      case "complete":
        if (data.sessionId) {
          callbacks.onSessionComplete?.(data.sessionId);
        }
        break;

      case "error":
        if (data.message) {
          callbacks.onError?.(data.message);
        }
        break;

      default:
        console.warn("未知的 SSE 事件类型:", eventType);
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
