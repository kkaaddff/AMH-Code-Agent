/**
 * Agent Scheduler - 自驱动的 TODO 模式任务调度器
 * 
 * 功能描述：
 * 1. 模型接收输入后，使用 TODO 模式提出一系列 action
 * 2. 模型自己驱动自己完成这些任务
 * 3. 使用 uid 区分每个会话
 * 4. 上次的输出可能作为下次的输入
 * 5. 所有接口请求使用伪函数调用
 */

import { commonUserPrompt, commonSystemPrompt } from './CommonPrompt';
import { systemSetting } from './config';
import {
  AskUserQuestion,
  Bash,
  BashOutput,
  Edit,
  Read,
  Write,
  TodoWrite,
  WebFetch,
  Task,
  ExitPlanMode,
  Glob,
  Grep,
  KillShell,
  NotebookEdit,
  Skill,
  SlashCommand,
  WebSearch,
  mcp__ide__executeCode,
  mcp__ide__getDiagnostics,
} from './tools';

// ==================== 类型定义 ====================

/**
 * TODO 状态
 */
type TodoStatus = 'pending' | 'in_progress' | 'completed';

/**
 * TODO 项
 */
interface TodoItem {
  content: string;
  status: TodoStatus;
  activeForm: string;
}

/**
 * 消息内容类型
 */
interface MessageContent {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: any;
  tool_use_id?: string;
  content?: string;
  cache_control?: { type: 'ephemeral' };
}

/**
 * 消息
 */
interface Message {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
}

/**
 * 工具定义
 */
interface Tool {
  name: string;
  description: string;
  input_schema: any;
}

/**
 * API 请求体
 */
interface RequestBody {
  model?: string;
  messages: Message[];
  system?: MessageContent[];
  tools?: Tool[];
  betas?: string[];
  metadata?: any;
  max_tokens?: number;
  stream?: boolean;
  thinking?: any;
}

/**
 * API 响应
 */
interface ApiResponse {
  text: string;
  tools?: any[];
  stop_reason?: string;
}

/**
 * 会话状态
 */
interface SessionState {
  uid: string;
  messages: Message[];
  todos: TodoItem[];
  currentTodoIndex: number;
  isCompleted: boolean;
}

// ==================== 伪 API 调用函数 ====================

/**
 * 伪 API 调用 - 发送消息到模型
 */
async function callModelAPI(requestBody: RequestBody): Promise<ApiResponse> {
  // 这是一个伪函数调用，实际应该调用真实的 API
  console.log('[API Call] 调用模型 API:', {
    model: requestBody.model || systemSetting.model,
    messageCount: requestBody.messages.length,
    hasTools: requestBody.tools && requestBody.tools.length > 0,
  });

  // 模拟 API 响应
  return {
    text: '模型响应内容',
    tools: [],
    stop_reason: 'end_turn',
  };
}

/**
 * 伪 API 调用 - 日志记录
 */
function logToFile(uid: string, type: string, data: any): void {
  // 这是一个伪函数调用，实际应该写入日志文件
  const timestamp = new Date().toISOString();
  console.log(`[Log] ${timestamp} uid=${uid} ${type}:`, JSON.stringify(data, null, 2));
}

// ==================== 核心调度器类 ====================

/**
 * Agent 调度器
 */
export class AgentScheduler {
  private sessions: Map<string, SessionState> = new Map();
  private availableTools: Tool[] = [];

  constructor() {
    this.initializeTools();
  }

  /**
   * 初始化可用工具
   */
  private initializeTools(): void {
    this.availableTools = [
      AskUserQuestion,
      Bash,
      BashOutput,
      Edit,
      Read,
      Write,
      TodoWrite,
      WebFetch,
      Task,
      ExitPlanMode,
      Glob,
      Grep,
      KillShell,
      NotebookEdit,
      Skill,
      SlashCommand,
      WebSearch,
      mcp__ide__executeCode,
      mcp__ide__getDiagnostics,
    ];
  }

  /**
   * 创建新会话
   */
  createSession(uid: string, initialPrompt: string): SessionState {
    const session: SessionState = {
      uid,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: commonUserPrompt.readAnnotatedJson,
            },
          ],
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: commonUserPrompt.annotatedJsonResult,
            },
            {
              type: 'text',
              text: commonSystemPrompt.todoListEmpty,
            },
            {
              type: 'text',
              text: commonUserPrompt.claudeDotMd,
            },
            {
              type: 'text',
              text: initialPrompt,
            },
          ],
        },
      ],
      todos: [],
      currentTodoIndex: -1,
      isCompleted: false,
    };

    this.sessions.set(uid, session);
    logToFile(uid, 'session_created', { initialPrompt });

    return session;
  }

  /**
   * 执行会话 - 主调度循环
   */
  async executeSession(uid: string): Promise<void> {
    const session = this.sessions.get(uid);
    if (!session) {
      throw new Error(`Session ${uid} not found`);
    }

    logToFile(uid, 'session_start', {});

    while (!session.isCompleted) {
      // 发送当前消息到模型
      const requestBody: RequestBody = {
        messages: session.messages,
        system: [
          {
            type: 'text',
            text: commonSystemPrompt.cliPrompt,
            cache_control: { type: 'ephemeral' } as const,
          },
          {
            type: 'text',
            text: commonSystemPrompt.mainPrompt,
            cache_control: { type: 'ephemeral' } as const,
          },
        ],
        tools: this.availableTools,
        ...systemSetting,
      };

      logToFile(uid, 'input', requestBody);

      // 调用模型 API
      const response = await callModelAPI(requestBody);

      logToFile(uid, 'stream.final', response);

      // 处理响应
      await this.processResponse(session, response);

      // 检查是否完成
      if (this.isSessionCompleted(session)) {
        session.isCompleted = true;
        logToFile(uid, 'session_completed', {});
        break;
      }

      // 防止无限循环
      await this.delay(100);
    }
  }

  /**
   * 处理模型响应
   */
  private async processResponse(session: SessionState, response: ApiResponse): Promise<void> {
    // 解析响应中的工具调用
    const toolCalls = this.extractToolCalls(response);

    // 构建 assistant 消息
    const assistantMessage: Message = {
      role: 'assistant',
      content: [],
    };

    // 添加文本响应
    if (response.text) {
      (assistantMessage.content as MessageContent[]).push({
        type: 'text',
        text: response.text,
      });
    }

    // 添加工具调用
    if (toolCalls.length > 0) {
      for (const toolCall of toolCalls) {
        (assistantMessage.content as MessageContent[]).push({
          type: 'tool_use',
          id: toolCall.id,
          name: toolCall.name,
          input: toolCall.input,
        });
      }
    }

    session.messages.push(assistantMessage);

    // 如果有工具调用，执行工具并添加结果
    if (toolCalls.length > 0) {
      await this.executeTools(session, toolCalls);
    }
  }

  /**
   * 从响应中提取工具调用
   */
  private extractToolCalls(response: ApiResponse): any[] {
    // 解析工具调用（这里简化处理，实际需要根据响应格式解析）
    if (response.tools && Array.isArray(response.tools)) {
      return response.tools;
    }

    // 从文本中提取工具调用（如果响应包含 tool_use）
    const toolCalls: any[] = [];

    // 模拟提取逻辑
    // 实际实现需要解析响应文本或使用结构化的响应格式

    return toolCalls;
  }

  /**
   * 执行工具调用
   */
  private async executeTools(session: SessionState, toolCalls: any[]): Promise<void> {
    const toolResults: MessageContent[] = [];

    for (const toolCall of toolCalls) {
      const result = await this.executeTool(session, toolCall);

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolCall.id,
        content: result,
      });

      // 特殊处理 TodoWrite 工具
      if (toolCall.name === 'TodoWrite') {
        this.updateTodos(session, toolCall.input.todos);
      }
    }

    // 添加工具结果到消息历史
    if (toolResults.length > 0) {
      session.messages.push({
        role: 'user',
        content: toolResults,
      });
    }
  }

  /**
   * 执行单个工具
   */
  private async executeTool(session: SessionState, toolCall: any): Promise<string> {
    logToFile(session.uid, 'tool_execute', {
      name: toolCall.name,
      input: toolCall.input,
    });

    // 根据工具名称执行相应的操作
    switch (toolCall.name) {
      case 'TodoWrite':
        return commonSystemPrompt.todoModifiedSuccessfully;

      case 'Read':
        // 模拟文件读取
        return `File content for ${toolCall.input.file_path}`;

      case 'Write':
        // 模拟文件写入
        return `File created successfully at: ${toolCall.input.file_path}`;

      case 'Edit':
        // 模拟文件编辑
        return `File edited successfully at: ${toolCall.input.file_path}`;

      case 'Bash':
        // 模拟命令执行
        return `Command executed: ${toolCall.input.command}`;

      case 'Glob':
        // 模拟文件查找
        return `Found files matching pattern: ${toolCall.input.pattern}`;

      case 'Grep':
        // 模拟内容搜索
        return `Search results for pattern: ${toolCall.input.pattern}`;

      default:
        return `Tool ${toolCall.name} executed successfully`;
    }
  }

  /**
   * 更新 TODO 列表
   */
  private updateTodos(session: SessionState, todos: TodoItem[]): void {
    session.todos = todos;

    // 更新当前 TODO 索引
    session.currentTodoIndex = todos.findIndex((todo) => todo.status === 'in_progress');

    logToFile(session.uid, 'todos_updated', {
      todos,
      currentIndex: session.currentTodoIndex,
    });
  }

  /**
   * 检查会话是否完成
   */
  private isSessionCompleted(session: SessionState): boolean {
    // 如果没有 TODO，不认为已完成
    if (session.todos.length === 0) {
      return false;
    }

    // 检查所有 TODO 是否都已完成
    const allCompleted = session.todos.every((todo) => todo.status === 'completed');

    // 检查是否有 final 响应
    const lastMessage = session.messages[session.messages.length - 1];
    const hasFinalResponse =
      lastMessage &&
      lastMessage.role === 'assistant' &&
      typeof lastMessage.content === 'string' &&
      lastMessage.content.includes('successfully created');

    return allCompleted && hasFinalResponse;
  }

  /**
   * 获取会话状态
   */
  getSession(uid: string): SessionState | undefined {
    return this.sessions.get(uid);
  }

  /**
   * 延迟函数
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * 清理会话
   */
  cleanupSession(uid: string): void {
    this.sessions.delete(uid);
    logToFile(uid, 'session_cleanup', {});
  }
}

// ==================== 辅助函数 ====================

/**
 * 生成唯一 UID
 */
export function generateUID(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * 格式化 TODO 列表为字符串
 */
export function formatTodos(todos: TodoItem[]): string {
  return todos
    .map((todo, index) => {
      const status = todo.status === 'completed' ? '✓' : todo.status === 'in_progress' ? '→' : '○';
      return `${status} ${index + 1}. ${todo.content}`;
    })
    .join('\n');
}

/**
 * 解析工具调用结果
 */
export function parseToolResult(result: string): any {
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
}

// ==================== 使用示例 ====================

/**
 * 示例：创建并执行一个代码生成会话
 */
export async function runCodeGenerationExample(): Promise<void> {
  const scheduler = new AgentScheduler();

  // 创建新会话
  const uid = generateUID();
  const initialPrompt = commonUserPrompt.mainPrompt;

  scheduler.createSession(uid, initialPrompt);

  console.log(`创建会话: ${uid}`);
  console.log('初始提示:', initialPrompt);

  try {
    // 执行会话
    await scheduler.executeSession(uid);

    // 获取最终状态
    const finalSession = scheduler.getSession(uid);
    if (finalSession) {
      console.log('\n会话完成!');
      console.log('TODO 列表:');
      console.log(formatTodos(finalSession.todos));
      console.log(`\n消息数量: ${finalSession.messages.length}`);
    }
  } catch (error) {
    console.error('会话执行失败:', error);
  } finally {
    // 清理会话
    scheduler.cleanupSession(uid);
  }
}

/**
 * 示例：多会话并行执行
 */
export async function runMultipleSessionsExample(): Promise<void> {
  const scheduler = new AgentScheduler();

  const prompts = [
    '创建一个用户详情页面',
    '创建一个订单列表页面',
    '创建一个商品展示页面',
  ];

  const sessions = prompts.map((prompt) => {
    const uid = generateUID();
    scheduler.createSession(uid, prompt);
    return uid;
  });

  console.log(`创建了 ${sessions.length} 个会话`);

  // 并行执行所有会话
  await Promise.all(sessions.map((uid) => scheduler.executeSession(uid)));

  console.log('\n所有会话完成!');

  // 清理所有会话
  sessions.forEach((uid) => scheduler.cleanupSession(uid));
}

// ==================== 导出 ====================

export default AgentScheduler;
