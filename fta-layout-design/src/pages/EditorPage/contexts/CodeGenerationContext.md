# 代码生成集成说明

## 概述

本次更新实现了基于 AgentScheduler 的代码生成系统，使用 Context 统一管理状态，并通过 Ant Design X 的 ThoughtChain 组件实时展示生成进度。

## 核心组件

### 1. CodeGenerationContext

统一管理代码生成相关的所有状态：

```typescript
// 主要状态
- isDrawerOpen: 抽屉打开状态
- isGenerating: 生成中状态
- thoughtChainItems: 思维链数据
- currentSessionId: 当前会话 ID
- currentIteration: 当前迭代次数

// 主要操作方法
- openDrawer() / closeDrawer()
- startGeneration() / stopGeneration()
- addThoughtItem() / updateThoughtItem()
- appendToThoughtContent()
- updateTodos()
- clearThoughtChain()
```

### 2. AgentScheduler 回调机制

`executeSession` 方法现在支持实时回调：

```typescript
await scheduler.executeSession(sessionId, {
  onIterationStart: (iteration) => {
    // 迭代开始时触发
  },
  onTextChunk: (text) => {
    // 接收到文本块时触发
  },
  onTodoUpdate: (todos) => {
    // TODO 列表更新时触发
  },
  onIterationEnd: (iteration) => {
    // 迭代结束时触发
  },
  onSessionComplete: () => {
    // 会话完成时触发
  },
});
```

### 3. CodeGenerationDrawer

使用 Ant Design X 的 ThoughtChain 组件展示：

- 自动将内部的 `ThoughtChainItem` 转换为 Ant Design X 格式
- 支持三种状态：`pending`、`success`、`error`
- `in_progress` 状态通过 LoadingOutlined icon 显示
- 按时间顺序展示所有迭代和任务

## 数据流

1. 用户点击"生成代码"按钮
2. `handleGenerateCode` 创建新的 AgentScheduler 会话
3. 通过回调函数实时更新 Context 中的状态
4. ThoughtChain 组件自动响应状态变化并渲染
5. 会话完成后停止生成状态

## ThoughtChainItem 类型映射

我们的内部类型：
```typescript
{
  id: string;
  title: string;
  status: 'pending' | 'in_progress' | 'success' | 'error';
  content?: string;
  startedAt?: string;
  finishedAt?: string;
  kind?: 'iteration' | 'task' | 'text';
}
```

映射到 Ant Design X：
```typescript
{
  key: string;
  title: React.ReactNode;
  status: 'pending' | 'success' | 'error';  // 注意：不支持 in_progress
  icon?: React.ReactNode;  // in_progress 时显示 LoadingOutlined
  content?: React.ReactNode;
  description?: React.ReactNode;
  extra?: React.ReactNode;
}
```

## 使用示例

在 `EditorPageComponentDetectV2.tsx` 中：

```typescript
// 1. 引入 Context Provider
import { CodeGenerationProvider, useCodeGeneration } from './contexts/CodeGenerationContext';

// 2. 在组件树中包裹 Provider
<CodeGenerationProvider>
  <ComponentDetectionProviderV2>
    <EditorPageContent />
  </ComponentDetectionProviderV2>
</CodeGenerationProvider>

// 3. 在组件中使用 Context
const {
  isDrawerOpen,
  openDrawer,
  startGeneration,
  addThoughtItem,
  updateTodos,
  // ...其他方法
} = useCodeGeneration();

// 4. 使用 AgentScheduler
const scheduler = new AgentScheduler();
const sessionId = generateUID();

scheduler.createSession(sessionId, initialPrompt);
startGeneration(sessionId);

await scheduler.executeSession(sessionId, {
  onIterationStart: (iteration) => {
    addThoughtItem({
      id: `iteration-${iteration}`,
      title: `第 ${iteration} 轮迭代`,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      kind: 'iteration',
    });
  },
  onTodoUpdate: (todos) => {
    updateTodos(todos);
  },
  // ...其他回调
});
```

## 注意事项

1. **状态映射**：Ant Design X ThoughtChain 只支持三种状态，`in_progress` 需要通过 icon 展示
2. **实时更新**：所有状态更新都通过 Context 进行，确保组件自动响应
3. **会话管理**：每次生成创建新的会话，可以通过 sessionId 追踪
4. **错误处理**：确保在 try-catch 中调用 `stopGeneration()` 以重置状态

## 未来改进

- [ ] 支持中断正在进行的生成
- [ ] 添加生成历史记录
- [ ] 支持导出生成结果
- [ ] 优化大量数据时的性能

