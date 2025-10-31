const MODEL_GATEWAY_ENDPOINT = 'http://localhost:7001/model-gateway';
const MODEL_GATEWAY_SYNC_ENDPOINT = 'http://localhost:7001/model-gateway-sync';

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

export const streamModelGateway = async ({ body, onChunk, onComplete }: StreamModelGatewayOptions): Promise<void> => {
  const response = await fetch(MODEL_GATEWAY_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
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

export const syncModelGateway = async ({ body }: SyncModelGatewayOptions): Promise<StreamModelGatewayEvent[]> => {
  const response = await fetch(MODEL_GATEWAY_SYNC_ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`模型连接失败: ${response.status} ${response.statusText} ${errorText}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(`模型调用失败: ${result.error || '未知错误'}`);
  }

  // 从后端返回的 data 字段中提取事件
  const events = extractEventsFromPayload(result.data);

  return events;
};
