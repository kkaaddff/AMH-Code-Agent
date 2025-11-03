# Agent Scheduler - TODO 驱动的代码生成调度器

## 概述

Agent Scheduler 是一个自驱动的任务调度系统，使用 TODO 模式来管理和执行代码生成任务。模型在接收到输入后，会自动创建一系列待办事项（TODO），并驱动自己逐步完成这些任务。

## 核心特性

### 1. TODO 驱动模式
- 模型自动创建任务列表
- 跟踪每个任务的状态（pending、in_progress、completed）
- 按顺序执行任务直到全部完成

### 2. 会话管理
- 使用 UID 唯一标识每个会话
- 支持多会话并发执行
- 消息历史记录和上下文管理

### 3. 工具集成
- 支持多种工具：文件操作（Read、Write、Edit）、命令执行（Bash）、搜索（Glob、Grep）等
- TodoWrite 工具用于更新任务列表
- 所有工具调用通过伪函数接口

### 4. 自动化工作流
- 模型根据上次输出自动决定下一步行动
- 工具执行结果作为下一轮输入
- 循环执行直到所有任务完成

## 架构设计

```
┌─────────────────────────────────────────────────────────┐
│                  Agent Scheduler                         │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  ┌───────────────────────────────────────────────┐      │
│  │         Session Management                     │      │
│  │  - Create Session (UID)                       │      │
│  │  - Store Message History                      │      │
│  │  - Track TODO List                            │      │
│  └───────────────────────────────────────────────┘      │
│                        │                                  │
│                        ▼                                  │
│  ┌───────────────────────────────────────────────┐      │
│  │         Main Execution Loop                    │      │
│  │  1. Build Request Body                        │      │
│  │  2. Call Model API (pseudo)                   │      │
│  │  3. Process Response                          │      │
│  │  4. Execute Tools                             │      │
│  │  5. Update TODO Status                        │      │
│  │  6. Check Completion                          │      │
│  └───────────────────────────────────────────────┘      │
│                        │                                  │
│                        ▼                                  │
│  ┌───────────────────────────────────────────────┐      │
│  │         Tool Execution                         │      │
│  │  - TodoWrite: Update task list                │      │
│  │  - Read/Write/Edit: File operations           │      │
│  │  - Bash: Command execution                    │      │
│  │  - Glob/Grep: Search operations               │      │
│  └───────────────────────────────────────────────┘      │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## 使用方法

### 基本使用

```typescript
import AgentScheduler, { generateUID } from './index';

// 创建调度器实例
const scheduler = new AgentScheduler();

// 创建新会话
const uid = generateUID();
const initialPrompt = "创建一个用户详情页面";

scheduler.createSession(uid, initialPrompt);

// 执行会话
await scheduler.executeSession(uid);

// 获取会话状态
const session = scheduler.getSession(uid);
console.log('TODO 列表:', session.todos);

// 清理会话
scheduler.cleanupSession(uid);
```

### 多会话并行执行

```typescript
import AgentScheduler, { 
  generateUID, 
  runMultipleSessionsExample 
} from './index';

// 使用内置的多会话示例
await runMultipleSessionsExample();

// 或者自定义多会话执行
const scheduler = new AgentScheduler();
const prompts = [
  '创建用户管理页面',
  '创建订单列表页面',
  '创建商品详情页面',
];

const uids = prompts.map(prompt => {
  const uid = generateUID();
  scheduler.createSession(uid, prompt);
  return uid;
});

// 并行执行
await Promise.all(uids.map(uid => scheduler.executeSession(uid)));

// 清理
uids.forEach(uid => scheduler.cleanupSession(uid));
```

## 数据结构

### TODO 项

```typescript
interface TodoItem {
  content: string;        // TODO 内容描述
  status: TodoStatus;     // 状态: pending | in_progress | completed
  activeForm: string;     // 进行时态描述
}
```

### 消息

```typescript
interface Message {
  role: 'user' | 'assistant';
  content: string | MessageContent[];
}

interface MessageContent {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  id?: string;
  name?: string;
  input?: any;
  tool_use_id?: string;
  content?: string;
}
```

### 会话状态

```typescript
interface SessionState {
  uid: string;                  // 唯一标识符
  messages: Message[];          // 消息历史
  todos: TodoItem[];            // TODO 列表
  currentTodoIndex: number;     // 当前任务索引
  isCompleted: boolean;         // 是否完成
}
```

## 工作流程详解

### 1. 会话创建

```typescript
const session = scheduler.createSession(uid, initialPrompt);
```

- 生成唯一 UID
- 初始化消息历史
- 添加系统提示和用户提示
- 记录创建日志

### 2. 执行循环

```typescript
while (!session.isCompleted) {
  // 1. 构建请求
  const requestBody = buildRequest(session);
  
  // 2. 调用 API
  const response = await callModelAPI(requestBody);
  
  // 3. 处理响应
  await processResponse(session, response);
  
  // 4. 检查完成状态
  if (isSessionCompleted(session)) {
    session.isCompleted = true;
  }
}
```

### 3. TODO 更新

当模型调用 TodoWrite 工具时：

```typescript
{
  type: 'tool_use',
  name: 'TodoWrite',
  input: {
    todos: [
      { 
        content: '分析需求',
        status: 'completed',
        activeForm: '已分析需求'
      },
      {
        content: '创建页面组件',
        status: 'in_progress',
        activeForm: '正在创建页面组件'
      },
      {
        content: '编写样式文件',
        status: 'pending',
        activeForm: '编写样式文件中'
      }
    ]
  }
}
```

系统会自动：
1. 更新会话的 TODO 列表
2. 记录当前进行中的任务索引
3. 记录日志

### 4. 工具执行

支持的工具类型：

| 工具 | 功能 | 示例输入 |
|------|------|----------|
| TodoWrite | 更新任务列表 | `{ todos: [...] }` |
| Read | 读取文件 | `{ file_path: "/path/to/file" }` |
| Write | 创建文件 | `{ file_path: "/path", content: "..." }` |
| Edit | 编辑文件 | `{ file_path: "/path", old_string: "...", new_string: "..." }` |
| Bash | 执行命令 | `{ command: "mkdir src/pages" }` |
| Glob | 文件匹配 | `{ pattern: "**/*.ts" }` |
| Grep | 内容搜索 | `{ pattern: "function.*" }` |

### 5. 完成检测

会话被认为完成当：
1. 所有 TODO 项状态为 `completed`
2. 最后一条消息包含完成标志（如 "successfully created"）

## 日志记录

所有操作都会记录日志：

```typescript
[Log] 2025-10-30T08:00:00.000Z uid=abc123 session_created: {...}
[Log] 2025-10-30T08:00:01.000Z uid=abc123 input: {...}
[Log] 2025-10-30T08:00:02.000Z uid=abc123 stream.final: {...}
[Log] 2025-10-30T08:00:03.000Z uid=abc123 tool_execute: {...}
[Log] 2025-10-30T08:00:04.000Z uid=abc123 todos_updated: {...}
[Log] 2025-10-30T08:00:05.000Z uid=abc123 session_completed: {...}
```

## 配置

配置在 `config.ts` 文件中：

```typescript
export const systemSetting = {
  model: 'glm-4.6',
  max_tokens: 32000,
  thinking: { 
    budget_tokens: 31999, 
    type: 'enabled' 
  },
  stream: false,
  betas: [
    'claude-code-20250219',
    'interleaved-thinking-2025-05-14',
    'fine-grained-tool-streaming-2025-05-14'
  ],
};
```

## 伪函数说明

### callModelAPI

```typescript
async function callModelAPI(requestBody: RequestBody): Promise<ApiResponse>
```

这是一个伪 API 调用函数，实际使用时需要替换为真实的模型 API 调用。

**参数：**
- `requestBody`: 包含模型、消息、系统提示、工具列表等信息

**返回：**
- `ApiResponse`: 包含文本响应和工具调用

**实际实现示例：**

```typescript
async function callModelAPI(requestBody: RequestBody): Promise<ApiResponse> {
  const response = await fetch('https://api.example.com/v1/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`,
    },
    body: JSON.stringify(requestBody),
  });
  
  return await response.json();
}
```

### logToFile

```typescript
function logToFile(uid: string, type: string, data: any): void
```

这是一个伪日志函数，实际使用时需要实现真实的文件写入逻辑。

**实际实现示例：**

```typescript
import fs from 'fs';

function logToFile(uid: string, type: string, data: any): void {
  const timestamp = new Date().toISOString();
  const logLine = `${timestamp} uid=${uid} ${type}: ${JSON.stringify(data)}\n`;
  fs.appendFileSync('./logs/agent.log', logLine);
}
```

## 扩展和自定义

### 添加新工具

1. 在 `tools.ts` 中定义工具：

```typescript
export const CustomTool = {
  name: 'CustomTool',
  description: '自定义工具描述',
  input_schema: {
    type: 'object',
    properties: {
      param1: { type: 'string' },
      param2: { type: 'number' },
    },
    required: ['param1'],
  },
};
```

2. 在 `AgentScheduler` 中添加工具处理逻辑：

```typescript
private async executeTool(session: SessionState, toolCall: any): Promise<string> {
  switch (toolCall.name) {
    case 'CustomTool':
      // 实现自定义逻辑
      return `Custom tool executed with ${toolCall.input.param1}`;
    // ... 其他工具
  }
}
```

### 自定义完成条件

重写 `isSessionCompleted` 方法：

```typescript
private isSessionCompleted(session: SessionState): boolean {
  // 自定义完成逻辑
  const hasCompletedAllTasks = session.todos.every(
    todo => todo.status === 'completed'
  );
  
  const hasMinimumTasks = session.todos.length >= 3;
  
  return hasCompletedAllTasks && hasMinimumTasks;
}
```

## 最佳实践

### 1. 错误处理

```typescript
try {
  await scheduler.executeSession(uid);
} catch (error) {
  console.error('会话执行失败:', error);
  // 记录错误日志
  logToFile(uid, 'error', { error: error.message });
  // 清理资源
  scheduler.cleanupSession(uid);
}
```

### 2. 超时控制

```typescript
const TIMEOUT = 300000; // 5 分钟

const executeWithTimeout = (uid: string) => {
  return Promise.race([
    scheduler.executeSession(uid),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('执行超时')), TIMEOUT)
    ),
  ]);
};
```

### 3. 会话恢复

```typescript
// 保存会话状态
const session = scheduler.getSession(uid);
fs.writeFileSync(
  `./sessions/${uid}.json`, 
  JSON.stringify(session)
);

// 恢复会话
const savedSession = JSON.parse(
  fs.readFileSync(`./sessions/${uid}.json`, 'utf-8')
);
// 恢复逻辑需要根据实际需求实现
```

## 性能优化

### 1. 并行工具执行

对于独立的工具调用，可以并行执行：

```typescript
const toolResults = await Promise.all(
  toolCalls.map(toolCall => this.executeTool(session, toolCall))
);
```

### 2. 缓存机制

实现提示词缓存以减少重复计算：

```typescript
const cacheKey = hashPrompt(requestBody.messages);
if (cache.has(cacheKey)) {
  return cache.get(cacheKey);
}
```

### 3. 消息历史压缩

当消息历史过长时，可以压缩旧消息：

```typescript
if (session.messages.length > MAX_HISTORY) {
  session.messages = [
    ...session.messages.slice(0, 2), // 保留初始消息
    { role: 'user', content: '[压缩的历史消息]' },
    ...session.messages.slice(-10), // 保留最近10条
  ];
}
```

## 故障排查

### 常见问题

**Q: 会话一直不结束？**
- 检查 TODO 列表是否正确更新
- 检查完成条件是否过于严格
- 添加最大迭代次数限制

**Q: 工具执行失败？**
- 检查工具参数是否正确
- 验证文件路径是否存在
- 查看日志获取详细错误信息

**Q: 内存占用过高？**
- 及时清理已完成的会话
- 压缩消息历史
- 限制并发会话数量

## 参考资料

- [messages.new.log](./messages.new.log) - 实际运行日志示例
- [CommonPrompt.ts](./CommonPrompt.ts) - 公共提示词定义
- [tools.ts](./tools.ts) - 工具集定义
- [config.ts](./config.ts) - 系统配置

## 许可证

本项目遵循 MIT 许可证。
