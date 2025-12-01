const MODEL_GATEWAY_ENDPOINT = import.meta.env.VITE_API_BASE_URL + '/model-gateway';
const MODEL_GATEWAY_SYNC_ENDPOINT = import.meta.env.VITE_API_BASE_URL + '/model-gateway-sync';

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
}

export interface SyncModelGatewayOptions {
  body: Record<string, any>;
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
 * @returns 异步执行的 Promise
 */
export const streamModelGateway = async ({ body, onChunk, onComplete }: StreamModelGatewayOptions): Promise<void> => {
  const requestPayload = JSON.stringify({
    ...body,
    stream: true,
  });

  const response = await fetch(MODEL_GATEWAY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: requestPayload,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`模型连接失败: ${response.status} ${response.statusText} ${errorText}`);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('模型服务未返回可读流');
  }

  const decoder = new TextDecoder();
  let buffer = '';

  let hasError = false;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let newlineIndex = buffer.indexOf('\n');
      while (newlineIndex !== -1) {
        const rawLine = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (rawLine.startsWith('data:')) {
          const data = rawLine.slice(5).trim();
          if (data && data !== '[DONE]') {
            try {
              const parsed = JSON.parse(data);
              const events = extractEventsFromPayload(parsed);
              events.forEach((event) => {
                onChunk?.(event);
              });
            } catch {
              // ignore malformed data packets
            }
          }
        }

        newlineIndex = buffer.indexOf('\n');
      }
    }

    // flush remaining buffer
    if (buffer.trim().startsWith('data:')) {
      const data = buffer.trim().slice(5).trim();
      if (data && data !== '[DONE]') {
        try {
          const parsed = JSON.parse(data);
          const events = extractEventsFromPayload(parsed);
          events.forEach((event) => {
            onChunk?.(event);
          });
        } catch {
          // ignore malformed data packets
        }
      }
    }
  } catch (error) {
    hasError = true;
    throw error;
  } finally {
    reader.releaseLock();
    if (!hasError) {
      onComplete?.();
    }
  }
};

/**
 * 调用模型网关的同步接口，一次性获取模型输出。
 * @param body 请求体内容，可为对象或字符串
 * @returns 模型返回的事件数组
 */
export const syncModelGateway = async ({ body }: SyncModelGatewayOptions): Promise<StreamModelGatewayEvent[]> => {
  const requestPayload = JSON.stringify(body);
  let result = null;
  if (import.meta.env.MODE !== 'development') {
    const response = await fetch(MODEL_GATEWAY_SYNC_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: requestPayload,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`模型连接失败: ${response.status} ${response.statusText} ${errorText}`);
    }

    result = await response.json();

    if (!result.success) {
      throw new Error(`模型调用失败: ${result.error || '未知错误'}`);
    }
  } else {
    result = {
      success: true,
      data: {
        choices: [
          {
            finish_reason: 'stop',
            index: 0,
            message: {
              content:
                '\n677:12796:View:\n677:12841:Text:\n677:13276:Icon:\n677:12961:Text:\n677:12957:Text:\n677:12965:Text:\n677:12913:Card:ShipmentInfoCard\n677:13020:Card:OrderPricingBar\n677:13082:Card:CargoOwnerInfoCard\n677:13185:Card:ServiceFeeCard\n677:13143:Text:\n677:13147:Text:\n677:13172:Text:\n677:13155:Text:\n677:13159:Text:\n677:13163:Text:\n677:13139:Text:\n677:13167:Text:\n677:13134:Text:\n677:13181:Text:\n677:13131:Text:\n677:13205:Text:\n677:13111:View:\n677:13098:View:\n677:13051:Text:\n677:13055:Text:\n677:13037:Text:\n677:13041:Text:\n677:12894:Text:\n677:12990:Avatar:OwnerAvatar\n677:12992:Text:\n677:12999:Text:\n677:13012:Text:\n677:13004:Text:\n677:13016:Text:\n677:13008:Text:\n677:13061:Icon:',
              role: 'assistant',
            },
          },
        ],
        created: 1764574564,
        id: '202512011532257eec8508348246be',
        model: 'glm-4.6',
        request_id: '202512011532257eec8508348246be',
        usage: {
          completion_tokens: 8967,
          prompt_tokens: 25775,
          prompt_tokens_details: {
            cached_tokens: 4,
          },
          total_tokens: 34742,
        },
      },
    };
  }

  // 从后端返回的 data 字段中提取事件
  const events = extractEventsFromPayload(result.data);

  return events;
};
