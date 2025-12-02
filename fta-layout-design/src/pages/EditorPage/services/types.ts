// ==================== 类型定义 ====================

/**
 * TODO 状态
 */
export type TodoStatus = 'pending' | 'in_progress' | 'completed';

/**
 * TODO 项
 * - id: 唯一标识，必填
 * - content: 任务内容，必填，不可为空
 * - status: 任务状态，必填
 * - priority: 优先级，必填
 */
export interface TodoItem {
  id: string;
  content: string;
  status: TodoStatus;
  priority: 'low' | 'medium' | 'high';
}

/**
 * 消息内容类型
 */
export interface MessageContent {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: any;
  tool_use_id?: string;
  content?: string;
  is_error?: boolean;
  cache_control?: { type: 'ephemeral' };
}

/**
 * 消息
 */
export interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | MessageContent[];
}

/**
 * 工具定义
 */
export interface Tool {
  name: string;
  description: string;
  input_schema: any;
}

/**
 * API 请求体
 */
export interface RequestBody {
  model?: string;
  messages: Message[];
  temperature?: number;
  tools?: Tool[];
  betas?: string[];
  metadata?: any;
  max_tokens?: number;
  stream?: boolean;
  chat_template_kwargs?: any;
}

/**
 * 会话状态
 */
export interface SessionState {
  uid: string;
  messages: Message[];
  todos: TodoItem[];
  currentTodoIndex: number;
  isCompleted: boolean;
  iterationCount: number; // 迭代轮数计数器
}
