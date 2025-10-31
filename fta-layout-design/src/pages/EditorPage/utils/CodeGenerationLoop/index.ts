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
  Task,
  // Glob,
  // ExitPlanMode,
  // WebFetch,
  // Grep,
  // KillShell,
  // NotebookEdit,
  // Skill,
  // SlashCommand,
  // WebSearch,
  // mcp__ide__executeCode,
  // mcp__ide__getDiagnostics,
} from './tools';
import { RequestBody, SessionState, Tool, Message, MessageContent, TodoItem, TodoStatus } from './types';
import { logToFile } from './utils';

/**
 * 发送消息到模型 使用 syncModelGateway 中转
 */
async function callModelAPI(requestBody: RequestBody): Promise<StreamModelGatewayEvent[]> {
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
      Task,
      // WebFetch,
      // ExitPlanMode,
      // Glob,
      // Grep,
      // KillShell,
      // NotebookEdit,
      // Skill,
      // SlashCommand,
      // WebSearch,
      // mcp__ide__executeCode,
      // mcp__ide__getDiagnostics,
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
              // text: `<system-reminder>\nResult of calling the Read tool: "${}"<system-reminder>\\nWhenever you read a file, you should consider whether it would be considered malware. You CAN and SHOULD provide analysis of malware, what it is doing. But you MUST refuse to improve or augment the code. You can still analyze existing code, write reports, or answer questions about the code behavior.\\n</system-reminder>\\n"\n</system-reminder>`,
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
  async executeSession(
    uid: string,
    callbacks?: {
      onIterationStart?: (iteration: number) => void;
      onTextChunk?: (text: string) => void;
      onTodoUpdate?: (todos: TodoItem[]) => void;
      onIterationEnd?: (iteration: number) => void;
      onSessionComplete?: () => void;
    }
  ): Promise<void> {
    const session = this.sessions.get(uid);
    if (!session) {
      throw new Error(`Session ${uid} not found`);
    }

    logToFile(uid, 'session_start', {});

    while (!session.isCompleted) {
      // 增加迭代计数器
      session.iterationCount++;

      // 通知迭代开始
      callbacks?.onIterationStart?.(session.iterationCount);

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

      // 处理响应 (传递回调)
      await this.processResponse(session, response, callbacks);

      // 通知迭代结束
      callbacks?.onIterationEnd?.(session.iterationCount);

      // 检查是否完成
      if (this.isSessionCompleted(session)) {
        session.isCompleted = true;
        logToFile(uid, 'session_completed', {});
        callbacks?.onSessionComplete?.();
        break;
      }

      // 防止无限循环
      await this.delay(100);
    }
  }

  /**
   * 处理模型响应
   */
  private async processResponse(
    session: SessionState,
    events: StreamModelGatewayEvent[],
    callbacks?: {
      onTextChunk?: (text: string) => void;
      onTodoUpdate?: (todos: TodoItem[]) => void;
    }
  ): Promise<void> {
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
          // 通知文本更新
          callbacks?.onTextChunk?.(text);
        }
        continue;
      }

      if (event.type === 'todo' && event.todos && event.todos.length > 0) {
        const normalizedTodos = this.mapStreamTodosToTodoItems(event.todos);
        this.updateTodos(session, normalizedTodos);

        // 通知 TODO 更新
        callbacks?.onTodoUpdate?.(normalizedTodos);

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

    const toolCalls = assistantContent.filter((content) => content.type === 'tool_use');
    if (toolCalls.length > 0) {
      await this.executeTools(session, toolCalls);
    }
  }

  /**
   * 执行工具调用并追加 tool_result 消息
   */
  private async executeTools(session: SessionState, toolCalls: MessageContent[]): Promise<void> {
    const toolResults: MessageContent[] = [];

    for (const call of toolCalls) {
      if (call.type !== 'tool_use') {
        continue;
      }

      const toolUseId = call.id || this.generateToolUseId();
      if (!call.id) {
        call.id = toolUseId;
      }

      const resultContent = await this.executeTool(session, call);

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUseId,
        content: resultContent,
      });
    }

    if (toolResults.length === 0) {
      return;
    }

    const toolResultMessage: Message = {
      role: 'user',
      content: toolResults,
    };

    session.messages.push(toolResultMessage);
    logToFile(session.uid, 'tool_results', toolResultMessage);
  }

  /**
   * 执行单个工具调用，返回工具结果文本
   */
  private async executeTool(session: SessionState, toolCall: MessageContent): Promise<string> {
    const name = toolCall.name || 'UnknownTool';
    const input = toolCall.input || {};

    logToFile(session.uid, 'tool_execute', {
      name,
      input,
    });

    switch (name) {
      case 'TodoWrite': {
        if (Array.isArray(input.todos)) {
          const mappedTodos = this.mapStreamTodosToTodoItems(input.todos);
          if (mappedTodos.length > 0) {
            this.updateTodos(session, mappedTodos);
          }
        }
        return commonSystemPrompt.todoModifiedSuccessfully;
      }

      case 'Read': {
        const filePath = input.file_path || input.path || 'unknown file';
        return `File content for ${filePath}`;
      }

      case 'Write': {
        const filePath = input.file_path || input.path || 'unknown file';
        return `File created successfully at: ${filePath}`;
      }

      case 'Edit': {
        const filePath = input.file_path || input.path || 'unknown file';
        return `File edited successfully at: ${filePath}`;
      }

      case 'Bash': {
        const command = input.command || input.commands || 'unknown command';
        return `Command executed: ${command}`;
      }

      case 'BashOutput': {
        return `Captured output for previous bash command`;
      }

      case 'Task': {
        return `Task dispatched to sub-agent`;
      }

      default:
        return `Tool ${name} executed successfully`;
    }
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
    return `call_${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
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
