# FrontendWorkflowService 使用指南

## 概述

`FrontendWorkflowService` 封装了前端项目生成的核心业务逻辑，可以在 Controller、队列任务或其他 Service 中复用。

## 依赖注入

```typescript
import { Inject } from '@midwayjs/decorator';
import { FrontendWorkflowService } from '../../service/code-agent/frontend-workflow.service';

export class YourService {
  @Inject()
  private frontendWorkflowService: FrontendWorkflowService;
}
```

## API 方法

### 1. getDesignDsl(designDocId)

获取设计 DSL 数据。

```typescript
const { dsl, revision } = await this.frontendWorkflowService.getDesignDsl(designDocId);

if (!dsl) {
  throw new Error('Design document not found');
}
```

**返回值:**
```typescript
{
  dsl: Record<string, unknown> | null;
  revision: number | null;
}
```

### 2. getAnnotationSummary(designDocId, version?)

获取组件标注数据并转换为摘要格式。

```typescript
const summary = await this.frontendWorkflowService.getAnnotationSummary(designDocId, version);

if (!summary) {
  console.log('No annotation available');
}
```

**返回值:** `string` - 格式化的标注摘要文本

### 3. getWorkflowCwd(sessionId)

生成工作目录路径。

```typescript
const cwd = this.frontendWorkflowService.getWorkflowCwd(sessionId);
// 返回: /path/to/files-cache/frontend-projects/{sessionId}
```

**返回值:** `string` - 工作目录的绝对路径

### 4. runWorkflow(options)

执行完整的前端项目生成工作流。

```typescript
const result = await this.frontendWorkflowService.runWorkflow({
  designDocId: '507f1f77bcf86cd799439011',
  version: 1,
  productName: 'MyApp',
  model: 'claude-3-5-sonnet-20241022',
  planModel: 'claude-3-5-sonnet-20241022',
  rulesFilePath: '/path/to/custom/rules.md',
  sessionId: 'unique-session-id',
  callbacks: {
    onMessage: async (opts) => {
      console.log('Message:', opts.message);
    },
    onTextDelta: async (text) => {
      process.stdout.write(text);
    },
    onStreamResult: async (result) => {
      console.log('Stream result:', result.requestId);
    },
    onChunk: async (chunk, requestId) => {
      // 处理原始数据块
    },
    onTurn: async (turn) => {
      console.log('Turn completed:', turn.usage);
    },
    onToolApprove: async (opts) => {
      console.log('Tool:', opts.toolUse.name);
      return true; // 批准工具调用
    },
  },
});

if (result.success) {
  console.log(`Generated ${result.filesCount} files`);
  console.log('Files:', result.files);
} else {
  console.error('Workflow failed:', result.error);
}
```

**参数:**
```typescript
interface FrontendWorkflowOptions {
  designDocId: string;              // 必填：设计文档 ID
  version?: number;                  // 可选：annotation 版本号
  productName?: string;              // 可选：产品名称
  model?: string;                    // 可选：模型配置
  planModel?: string;                // 可选：规划模型配置
  rulesFilePath?: string;            // 可选：自定义规则文件路径
  sessionId: string;                 // 必填：会话 ID
  callbacks?: FrontendProjectWorkflowCallbacks; // 可选：回调函数
}
```

**返回值:**
```typescript
interface FrontendWorkflowResult {
  success: boolean;
  sessionId: string;
  filesCount?: number;
  files?: Array<{ path: string; kind: string }>;
  error?: {
    message: string;
    name: string;
  };
}
```

## 使用场景

### 场景 1: 在 Controller 中使用（SSE 流式返回）

参见 `src/controller/code-agent/frontend-workflow.controller.ts`

### 场景 2: 在队列任务中使用

```typescript
import { Processor, InjectQueue } from '@midwayjs/bull';
import { Queue } from 'bull';

@Processor('frontend-workflow', {
  concurrency: 2,
})
export class FrontendWorkflowProcessor {
  @Inject()
  private frontendWorkflowService: FrontendWorkflowService;

  async execute(job: any) {
    const { designDocId, sessionId } = job.data;

    const result = await this.frontendWorkflowService.runWorkflow({
      designDocId,
      sessionId,
      callbacks: {
        onTextDelta: async (text) => {
          // 更新任务进度
          await job.progress(text);
        },
        onTurn: async (turn) => {
          // 记录到数据库
          await this.logTurn(sessionId, turn);
        },
      },
    });

    return result;
  }
}
```

### 场景 3: 在其他 Service 中使用

```typescript
@Provide()
export class BatchGenerationService {
  @Inject()
  private frontendWorkflowService: FrontendWorkflowService;

  async generateMultipleProjects(designDocIds: string[]) {
    const results = [];

    for (const designDocId of designDocIds) {
      const sessionId = uuid();
      const result = await this.frontendWorkflowService.runWorkflow({
        designDocId,
        sessionId,
        // 不需要 callbacks，静默执行
      });

      results.push({ designDocId, sessionId, result });
    }

    return results;
  }
}
```

### 场景 4: 单元测试

```typescript
import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/web';

describe('FrontendWorkflowService', () => {
  let app: any;
  let frontendWorkflowService: FrontendWorkflowService;

  beforeAll(async () => {
    app = await createApp<Framework>();
    frontendWorkflowService = await app.getApplicationContext()
      .getAsync(FrontendWorkflowService);
  });

  afterAll(async () => {
    await close(app);
  });

  it('should get design DSL successfully', async () => {
    const { dsl, revision } = await frontendWorkflowService.getDesignDsl('test-id');
    expect(dsl).toBeDefined();
    expect(revision).toBeGreaterThanOrEqual(0);
  });

  it('should run workflow successfully', async () => {
    const result = await frontendWorkflowService.runWorkflow({
      designDocId: 'test-id',
      sessionId: 'test-session',
    });

    expect(result.success).toBe(true);
    expect(result.filesCount).toBeGreaterThan(0);
  });
});
```

## 配置

Service 依赖以下环境变量（通过 `@Config` 注入）：

- `CODE_AGENT_VERSION`: 代码版本号（默认: '0.0.0'）
- `MODEL_NAME`: 主模型名称
- `PLAN_MODEL_NAME`: 规划模型名称

## 错误处理

Service 会捕获所有异常并返回标准化的错误格式：

```typescript
{
  success: false,
  sessionId: 'xxx',
  error: {
    message: 'Error description',
    name: 'ErrorType'
  }
}
```

常见错误类型：
- `DesignNotFoundError`: 设计文档不存在
- `WorkflowError`: 工作流执行失败
- 其他异常会被包装为通用错误

## 最佳实践

1. **始终提供 sessionId**：用于追踪和文件管理
2. **根据场景选择 callbacks**：SSE 场景需要完整的回调，后台任务可以简化
3. **错误处理**：检查 `result.success` 并处理 `result.error`
4. **资源清理**：生成的文件在 `files-cache/frontend-projects/{sessionId}/`，需要定期清理
5. **并发控制**：批量生成时注意并发数量，避免资源耗尽

## 相关文档

- [Frontend Workflow API 文档](./frontend-workflow-api.md)
- [fta-agent-core 文档](../../fta-agent-core/README.md)

