# Frontend Workflow API 使用文档

## 接口概述

该接口通过 SSE (Server-Sent Events) 实时推送前端项目生成过程，调用 `@fta/agent-core` 的 `runFrontendProjectWorkflow` 能力，根据设计 DSL 和组件标注生成前端项目代码。

## 接口信息

- **路径**: `POST /code-agent/frontend-workflow`
- **响应类型**: `text/event-stream` (SSE)

## 请求参数

```typescript
{
  designDocId: string;        // 必填：设计文档 ID
  version?: number;            // 可选：annotation 版本号（默认取最新版本）
  productName?: string;        // 可选：产品名称（默认 "FTA-Frontend"）
  model?: string;              // 可选：模型配置（默认使用环境变量 MODEL_NAME）
  planModel?: string;          // 可选：规划模型配置（默认使用环境变量 PLAN_MODEL_NAME）
  rulesFilePath?: string;      // 可选：自定义规则文件路径
}
```

## SSE 事件类型

### 1. info
流程信息通知
```json
{
  "message": "Loaded DSL data, revision: 1"
}
```

### 2. warning
警告信息
```json
{
  "message": "No annotation found for design xxx"
}
```

### 3. message
Agent 消息（包括用户消息、助手消息、工具调用等）
```json
{
  "role": "assistant",
  "content": "I'll help you generate...",
  "uuid": "msg-uuid",
  "parentUuid": "parent-uuid",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### 4. text_delta
流式文本增量（用于实时显示 Agent 输出）
```json
{
  "text": "Here is "
}
```

### 5. text
完整文本输出
```json
{
  "text": "Complete output text"
}
```

### 6. stream_result
流请求结果（包含模型信息和错误）
```json
{
  "requestId": "req-123",
  "model": "claude-3-5-sonnet-20241022",
  "hasError": false,
  "error": null
}
```

### 7. chunk
原始流数据块
```json
{
  "chunk": {...},
  "requestId": "req-123"
}
```

### 8. turn
每轮对话的统计信息
```json
{
  "usage": {
    "promptTokens": 1000,
    "completionTokens": 500,
    "totalTokens": 1500
  },
  "startTime": "2024-01-01T00:00:00.000Z",
  "endTime": "2024-01-01T00:01:00.000Z"
}
```

### 9. tool_approve
工具调用批准（当前自动批准）
```json
{
  "toolName": "file_draft_write",
  "callId": "call-123",
  "params": {...},
  "category": "file_operations"
}
```

### 10. complete
任务完成
```json
{
  "success": true,
  "sessionId": "session-uuid",
  "filesCount": 10,
  "files": [
    { "path": "src/App.tsx", "kind": "file" },
    { "path": "src/components", "kind": "directory" }
  ]
}
```

### 11. error
错误事件
```json
{
  "message": "Error message",
  "stack": "Error stack trace"
}
```

## 前端示例

```typescript
async function startFrontendWorkflow(designDocId: string) {
  const response = await fetch('/code-agent/frontend-workflow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      designDocId,
      productName: 'MyApp',
    }),
  });

  const reader = response.body!.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const text = decoder.decode(value);
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.startsWith('event:')) {
        const eventType = line.substring(6).trim();
        continue;
      }
      if (line.startsWith('data:')) {
        const data = JSON.parse(line.substring(5).trim());
        handleSSEEvent(eventType, data);
      }
    }
  }
}

function handleSSEEvent(event: string, data: any) {
  switch (event) {
    case 'text_delta':
      // 实时显示生成的文本
      appendText(data.text);
      break;
    case 'message':
      // 显示 Agent 消息
      addMessage(data);
      break;
    case 'complete':
      // 任务完成
      if (data.success) {
        showSuccess(`生成了 ${data.filesCount} 个文件`);
      } else {
        showError(data.error?.message);
      }
      break;
    case 'error':
      // 显示错误
      showError(data.message);
      break;
  }
}
```

## 使用 EventSource API（推荐）

```typescript
function startFrontendWorkflow(designDocId: string) {
  // 注意：EventSource 不支持 POST，需要通过 fetch-event-source 等库
  // 或者改造接口为 GET 并通过 query 参数传递
  
  // 使用 fetch-event-source 库
  import { fetchEventSource } from '@microsoft/fetch-event-source';

  await fetchEventSource('/code-agent/frontend-workflow', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      designDocId,
      productName: 'MyApp',
    }),
    onmessage(event) {
      const data = JSON.parse(event.data);
      console.log(event.event, data);
      
      if (event.event === 'complete') {
        // 任务完成
      }
    },
    onerror(err) {
      console.error('SSE error:', err);
    },
  });
}
```

## 注意事项

1. SSE 连接会保持打开直到任务完成或出错
2. 所有工具调用会自动批准，无需人工干预
3. 生成的文件会保存在 `files-cache/frontend-projects/{sessionId}/` 目录下
4. 确保 `@fta/agent-core` 依赖已正确安装
5. 需要配置环境变量：
   - `MODEL_NAME`: 主模型名称
   - `PLAN_MODEL_NAME`: 规划模型名称（可选）
   - `CODE_AGENT_VERSION`: 版本号（可选）

## 架构设计

### Controller 层 (`frontend-workflow.controller.ts`)
负责 HTTP 和 SSE 相关的逻辑：
- 接收请求参数并验证
- 设置 SSE 响应头
- 定义 `sendSSE` 辅助函数
- 注册各种回调事件，将 workflow 产生的事件通过 SSE 推送给前端
- 异常处理和连接关闭

### Service 层 (`frontend-workflow.service.ts`)
负责业务逻辑：
- 获取设计 DSL 数据
- 获取组件标注数据并转换为摘要格式
- 准备工作目录
- 调用 `@fta/agent-core` 的 `runFrontendProjectWorkflow`
- 返回标准化的结果格式

这种分层设计确保了：
- **职责分离**：Controller 只处理 HTTP/SSE，Service 处理业务逻辑
- **可测试性**：Service 可以独立测试，不依赖 HTTP 上下文
- **可复用性**：Service 可以被其他 Controller 或任务队列调用

## 相关文件

- Controller: `src/controller/code-agent/frontend-workflow.controller.ts`
- Service: `src/service/code-agent/frontend-workflow.service.ts`
- DTO: `src/dto/code-agent/frontend-workflow.dto.ts`
- 依赖的 Service:
  - `src/service/design/design-document.service.ts`
  - `src/service/design/component-annotation.service.ts`

