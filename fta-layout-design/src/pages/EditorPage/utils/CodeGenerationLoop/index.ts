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
import { StreamModelGatewayEvent, StreamModelGatewayTodo, syncModelGateway } from '../modelGateway';
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
import { RequestBody, SessionState, Tool, Message, MessageContent, TodoItem, TodoStatus } from './types';
import { logToFile, generateUID, formatTodos } from './utils';

// ==================== 伪 API 调用函数 ====================

/**
 * 伪 API 调用 - 发送消息到模型
 */
async function callModelAPI(requestBody: RequestBody): Promise<StreamModelGatewayEvent[]> {
  // 这是一个伪函数调用，实际应该调用真实的 API
  console.log('[API Call] 调用模型 API:', {
    model: requestBody.model || systemSetting.model,
    messageCount: requestBody.messages.length,
    hasTools: requestBody.tools && requestBody.tools.length > 0,
  });
  const events = await syncModelGateway({ body: requestBody });
  return events;
}

// ==================== 核心调度器类 ====================

/**
 * Agent 调度器
 */
export class AgentScheduler {
  private sessions: Map<string, SessionState> = new Map();
  private availableTools: Tool[] = [];
  private maxIterations: number = 50;

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
      iterationCount: 0,
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
      // 增加迭代计数器
      session.iterationCount++;

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
  private async processResponse(session: SessionState, events: StreamModelGatewayEvent[]): Promise<void> {
    if (!events || events.length === 0) {
      return;
    }

    const assistantContent: MessageContent[] = [];

    for (const event of events) {
      if (event.type === 'text') {
        const text = typeof event.text === 'string' ? event.text : '';
        if (text.trim()) {
          assistantContent.push({
            type: 'text',
            text,
          });
        }
        continue;
      }

      if (event.type === 'todo' && event.todos && event.todos.length > 0) {
        const normalizedTodos = this.mapStreamTodosToTodoItems(event.todos);
        this.updateTodos(session, normalizedTodos);

        assistantContent.push({
          type: 'tool_use',
          id: this.generateToolUseId(),
          name: 'TodoWrite',
          input: { todos: event.todos },
        });
      }
    }

    if (assistantContent.length === 0) {
      return;
    }

    const assistantMessage: Message = {
      role: 'assistant',
      content: assistantContent,
    };

    session.messages.push(assistantMessage);
    logToFile(session.uid, 'assistant_message', assistantMessage);
  }

  /**
   * 将模型返回的 TODO 列表转换为内部结构
   */
  private mapStreamTodosToTodoItems(streamTodos: StreamModelGatewayTodo[]): TodoItem[] {
    return streamTodos.map((todo) => ({
      id: todo.id,
      content: todo.content,
      status: this.normalizeTodoStatus(todo.status),
      activeForm: todo.activeForm,
    }));
  }

  private normalizeTodoStatus(status?: string): TodoStatus {
    const allowed: TodoStatus[] = ['pending', 'in_progress', 'completed'];
    if (status && (allowed as string[]).includes(status)) {
      return status as TodoStatus;
    }
    return 'pending';
  }

  private generateToolUseId(): string {
    return `todo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  /**
   * 更新 TODO 列表
   */
  private updateTodos(session: SessionState, todos: TodoItem[]): void {
    const copiedTodos = todos.map((todo) => ({ ...todo }));
    session.todos = copiedTodos;

    // 更新当前 TODO 索引
    let currentIndex = copiedTodos.findIndex((todo) => todo.status === 'in_progress');
    if (currentIndex === -1) {
      currentIndex = copiedTodos.findIndex((todo) => todo.status === 'pending');
    }

    session.currentTodoIndex = currentIndex;

    logToFile(session.uid, 'todos_updated', {
      todos: copiedTodos,
      currentIndex: session.currentTodoIndex,
    });
  }

  /**
   * 检查会话是否完成
   */
  private isSessionCompleted(session: SessionState): boolean {
    // 检查是否超过最大轮数限制（50 轮）
    if (session.iterationCount >= this.maxIterations) {
      logToFile(session.uid, 'session_max_iterations_reached', {
        iterationCount: session.iterationCount,
      });
      return true;
    }

    if (session.todos.length === 0) {
      return false;
    }

    return session.todos.every((todo) => todo.status === 'completed');
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
