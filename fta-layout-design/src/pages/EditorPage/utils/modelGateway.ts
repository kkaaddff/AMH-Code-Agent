import { getModelConfig } from '@/utils/modelConfig';
import { api, type StreamingRequestConfig, ApiService } from '@/utils/apiService';

export interface StreamModelGatewayTodo {
  id?: string;
  content: string;
  status?: string;
  activeForm?: string;
}

export type StreamModelGatewayEvent =
  | { type: 'text'; text: string }
  | { type: 'todo'; todos: StreamModelGatewayTodo[] };

export interface StreamModelGatewayOptions {
  body: Record<string, any>;
  onChunk?: (chunk: StreamModelGatewayEvent) => void;
  onComplete?: () => void;
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

export interface SyncModelGatewayOptions {
  body: Record<string, any>;
  apiKey?: string;
  baseURL?: string;
  model?: string;
}

const extractChunkContent = (payload: any): string => {
  if (!payload) {
    return '';
  }

  return (
    payload?.choices?.[0]?.delta?.content ??
    payload?.choices?.[0]?.message?.content ??
    payload?.output ??
    payload?.data ??
    ''
  );
};

const toTodoItems = (input: any): StreamModelGatewayTodo[] => {
  if (!Array.isArray(input)) {
    return [];
  }

  return input
    .map((todo) => {
      if (!todo || typeof todo !== 'object') {
        return null;
      }

      const content = typeof todo.content === 'string' ? todo.content : '';
      if (!content) {
        return null;
      }

      const status = typeof todo.status === 'string' ? todo.status : undefined;
      const activeForm = typeof todo.activeForm === 'string' ? todo.activeForm : undefined;
      const id = typeof todo.id === 'string' ? todo.id : undefined;

      return {
        id,
        content,
        status,
        activeForm,
      } as StreamModelGatewayTodo;
    })
    .filter(Boolean) as StreamModelGatewayTodo[];
};

const parseContentToEvents = (content: any): StreamModelGatewayEvent[] => {
  if (!content) {
    return [];
  }

  const texts: string[] = [];
  const todos: StreamModelGatewayTodo[] = [];

  const visit = (node: any): void => {
    if (!node) {
      return;
    }

    if (typeof node === 'string') {
      if (node.trim()) {
        texts.push(node);
      }
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item) => visit(item));
      return;
    }

    if (typeof node !== 'object') {
      return;
    }

    if (node.type === 'text' && typeof node.text === 'string') {
      if (node.text) {
        texts.push(node.text);
      }
      return;
    }

    if (node.type === 'tool_use' && node.name === 'TodoWrite') {
      const todoItems = toTodoItems(node.input?.todos);
      if (todoItems.length) {
        todos.push(...todoItems);
      }
      return;
    }

    if (typeof node.text === 'string') {
      visit(node.text);
    } else if (node.text) {
      visit(node.text);
    }

    if (node.content) {
      visit(node.content);
    }

    if (node.delta?.content) {
      visit(node.delta.content);
    }

    if (node.message?.content) {
      visit(node.message.content);
    }

    if (node.output) {
      visit(node.output);
    }

    if (node.data) {
      visit(node.data);
    }
  };

  visit(content);

  const events: StreamModelGatewayEvent[] = [];

  if (texts.length) {
    events.push({ type: 'text', text: texts.join('') });
  }

  if (todos.length) {
    events.push({ type: 'todo', todos });
  }

  return events;
};

const extractEventsFromPayload = (payload: any): StreamModelGatewayEvent[] => {
  const directEvents = parseContentToEvents(payload?.content);
  if (directEvents.length) {
    return directEvents;
  }

  const deltaEvents = parseContentToEvents(payload?.choices?.[0]?.delta?.content);
  if (deltaEvents.length) {
    return deltaEvents;
  }

  const messageEvents = parseContentToEvents(payload?.choices?.[0]?.message?.content);
  if (messageEvents.length) {
    return messageEvents;
  }

  const outputEvents = parseContentToEvents(payload?.output);
  if (outputEvents.length) {
    return outputEvents;
  }

  const dataEvents = parseContentToEvents(payload?.data);
  if (dataEvents.length) {
    return dataEvents;
  }

  const fallbackChunk = extractChunkContent(payload);
  if (typeof fallbackChunk === 'string' && fallbackChunk.trim()) {
    return [{ type: 'text', text: fallbackChunk }];
  }

  return [];
};

/**
 * 调用模型网关的流式接口，逐块接收模型输出。
 * @param body 请求体内容，可为对象或字符串
 * @param onChunk 每次收到事件片段时的回调
 * @param onComplete 流结束后的回调
 * @param apiKey API Key（可选，优先使用）
 * @param baseURL Base URL（可选，优先使用）
 * @returns 异步执行的 Promise
 */
export const streamModelGateway = async ({
  body,
  onChunk,
  onComplete,
  apiKey,
  baseURL,
  model,
}: StreamModelGatewayOptions): Promise<void> => {
  // 优先使用请求参数，如果没有则从 localStorage 读取
  const storedConfig = getModelConfig();
  const finalApiKey = apiKey || storedConfig.apiKey;
  const finalBaseURL = baseURL || storedConfig.baseURL;
  const finalModel = model || storedConfig.model;

  const requestPayload = {
    ...body,
    ...(finalApiKey && { apiKey: finalApiKey }),
    ...(finalBaseURL && { baseURL: finalBaseURL }),
    ...(finalModel && { model: finalModel }),
    stream: true,
  };

  // 构建流式请求配置
  const streamingConfig: StreamingRequestConfig = {
    onChunk: (chunk: string) => {
      // 处理 SSE 格式的数据块
      if (chunk && chunk.trim() && chunk.trim() !== '[DONE]') {
        try {
          const parsed = JSON.parse(chunk);
          const events = extractEventsFromPayload(parsed);
          events.forEach((event) => {
            onChunk?.(event);
          });
        } catch {
          // ignore malformed data packets
        }
      }
    },
    onError: (error: Error) => {
      throw new Error(`模型连接失败: ${error.message}`);
    },
    onComplete: () => {
      onComplete?.();
    },
  };

  // 使用 apiService.ts 中的流式请求方法
  await api.streaming.modelGateway(requestPayload, streamingConfig);
};

/**
 * 调用模型网关的同步接口，一次性获取模型输出。
 * @param body 请求体内容，可为对象或字符串
 * @param apiKey API Key（可选，优先使用）
 * @param baseURL Base URL（可选，优先使用）
 * @returns 模型返回的事件数组
 */
export const syncModelGateway = async ({
  body,
  apiKey,
  baseURL,
  model,
}: SyncModelGatewayOptions): Promise<StreamModelGatewayEvent[]> => {
  // 优先使用请求参数，如果没有则从 localStorage 读取
  const storedConfig = getModelConfig();
  const finalApiKey = apiKey || storedConfig.apiKey;
  const finalBaseURL = baseURL || storedConfig.baseURL;
  const finalModel = model || storedConfig.model;

  const requestPayload = {
    ...body,
    ...(finalApiKey && { apiKey: finalApiKey }),
    ...(finalBaseURL && { baseURL: finalBaseURL }),
    ...(finalModel && { model: finalModel }),
  };

  try {
    // 使用 apiService.ts 中的普通请求方法 - 需要通过 ApiService 类调用
    const result = await ApiService.post('/model-gateway-sync', requestPayload);

    // 从后端返回的 data 字段中提取事件
    const events = extractEventsFromPayload(result.data);

    return events;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`模型调用失败: ${error.message}`);
    }
    throw new Error(`模型调用失败: 未知错误`);
  }
};
