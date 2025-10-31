# CodeGenerationDrawer 组件说明

## 布局设计

采用上下两个视图区的布局：

### 上视图：任务列表区（60% 高度）
- **组件**：Ant Design List
- **高度**：maxHeight 60vh，可滚动
- **数据来源**：`thoughtChainItems.filter(item => item.kind === 'task')`
- **展示样式**：
  - ✅ **已完成**：绿色勾选框 (CheckSquareFilled) + 删除线 + 绿色背景
  - 🔄 **进行中**：旋转加载图标 (LoadingOutlined) + 蓝色背景
  - ☐ **未开始**：空框 (BorderOutlined) + 白色背景
- **额外信息**：显示任务标题、内容（如果有）、开始时间

### 下视图：迭代过程区
- **组件**：Ant Design X ThoughtChain
- **配置**：`size="small"` + `collapsible` 可折叠
- **数据来源**：`thoughtChainItems.filter(item => item.kind === 'iteration')`
- **展示内容**：
  - 每次模型调用显示一个迭代项
  - 标题显示迭代轮次
  - 内容折叠在 collapsible 中，可展开查看详细信息
  - 显示开始时间

## 数据流

```
AgentScheduler.executeSession
  ↓
onTodoUpdate → updateTodos() → kind: 'task'
  ↓
onIterationStart → addThoughtItem() → kind: 'iteration'
  ↓
CodeGenerationDrawer 自动分离并展示
```

## 状态映射

### TODO 状态
- `status: 'pending'` → ☐ 空框
- `status: 'in_progress'` → 🔄 加载中
- `status: 'success'` → ✅ 已完成（删除线）
- `status: 'error'` → ❌ 失败（红色）

### 迭代状态
- `status: 'pending'` → 灰色 + 默认图标
- `status: 'in_progress'` → pending + LoadingOutlined 旋转图标
- `status: 'success'` → 绿色 + 成功图标
- `status: 'error'` → 红色 + 错误图标

## 视觉特性

### 上视图（TODO 列表）
- 使用浅灰色背景容器 (#fafafa)
- 边框和圆角设计
- 不同状态使用不同背景色区分：
  - 已完成：#f6ffed（浅绿色）
  - 进行中：#e6f7ff（浅蓝色）
  - 未开始：#fff（白色）
- 列表项之间有分隔线

### 下视图（迭代过程）
- ThoughtChain 组件自带样式
- 可折叠查看详细内容
- 时间戳显示在右侧

## 使用示例

```typescript
// 在 handleGenerateCode 中
await scheduler.executeSession(sessionId, {
  onTodoUpdate: (todos) => {
    // 更新 TODO 列表（自动显示在上视图）
    updateTodos(todos);
  },
  
  onIterationStart: (iteration) => {
    // 添加迭代信息（自动显示在下视图）
    addThoughtItem({
      id: `iteration-${iteration}`,
      title: `第 ${iteration} 轮迭代`,
      status: 'in_progress',
      startedAt: new Date().toISOString(),
      kind: 'iteration',  // 关键：设置为 iteration
    });
  },
});
```

## 空状态处理

- **无 TODO**：显示 "等待任务列表..." 或 "暂无任务"
- **无迭代**：显示 "正在初始化代码生成..." 或 "暂无迭代记录，点击「生成代码」开始体验"

## 响应式设计

- 抽屉宽度：1280px
- TODO 列表：maxHeight 60vh，自适应屏幕高度
- 迭代过程：自动填充剩余空间
- 两个视图通过 Divider 分隔

