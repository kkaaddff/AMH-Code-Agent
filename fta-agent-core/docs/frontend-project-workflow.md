# FrontendProjectWorkflow 调用说明

> 参考：`docs/agent-service-lifecycle.md`（了解 `Context`、`Session`、`runLoop` 等基础设施）  
> 目标文件：`src/frontendProjectService.ts`

本文给出 `runFrontendProjectWorkflow()` 的调用方式、参数约定与执行链路，便于将“前端项目生成”流程嵌入到 CLI、服务端脚本或自动化流水线中。

---

## 1. 适用场景

- 你已经拥有完整需求文档（`requirementDoc`），并希望在本地仓库内生成/更新前端项目骨架。
- 需要读写型工具（TODO、Spec 阅读、文件草稿）并复用 Agent 通用设施（`Context`、`Session`、`runLoop`）。
- 希望一次调用即可拿到“模型输出 + 文件草稿集合”，后续可自行落盘或进入评审环节。

---

## 2. 快速开始

```ts
import { runFrontendProjectWorkflow } from './src/frontendProjectService';
import type { SpecRegistry } from './src/tools/specReader';

const specs: SpecRegistry = {
  'frontend-design.md': '/absolute/path/to/frontend-design.md',
};

const result = await runFrontendProjectWorkflow({
  cwd: '/path/to/repo',
  productName: 'neovate',
  version: '0.2.0',
  requirementDoc: '## 需求\n1. ...',
  specFiles: specs,
  language: 'zh-CN', // 可选，未提供则回落到 config.language
});

if (result.success) {
  // FileDraftStore 中的草稿（path -> { content, metadata })
  console.log(result.files);
} else {
  console.error(result.error);
}
```

---

## 3. 参数说明

| 字段              | 必填 | 作用                                                       | 备注                                 |
| ----------------- | ---- | ---------------------------------------------------------- | ------------------------------------ |
| `cwd`             | ✅   | 工作目录，`Context.create` 会据此解析配置、路径、git 状态  | 请确保已安装依赖、具备写权限         |
| `productName`     | ✅   | 用于定位 `~/.<product>/projects` 下的运行态目录            | 建议与 CLI/产品名一致                |
| `version`         | ✅   | 影响配置路径与 JSONL 日志命名                              | 可自定义                             |
| `requirementDoc`  | ✅   | 会作为 `initialMessage` 内容，也用于构造 `LlmsContext`     | 建议提供 Markdown 结构               |
| `specFiles`       | ✅   | 交给 `createSpecReaderTool`，供 Agent 在对话中读取         | key 为展示名，value 为绝对路径       |
| `configOverrides` | ❌   | 部分覆盖默认配置（模型、超参、自动压缩等）                 | 透传给 `Context.create`              |
| `language`        | ❌   | 明确系统提示词语言，未提供则使用 `context.config.language` | 影响 `generateFrontendProjectPrompt` |

---

## 4. 执行链路概览

> 对照 `agent-service-lifecycle.md` 的阶段 A~D，可知 `runFrontendProjectWorkflow` 共复用了 `Context`、`Session`、`LlmsContext` 与 `runLoop` 的标准机制，仅工具与提示词不同。

1. **初始化阶段**
   - `Context.create()`：解析 `cwd`、合并配置、建立 paths（同生命周期文档“阶段 A”）。
   - `Session.create()`：生成一次性 sessionId，驱动 JSONL/历史系统。
2. **工具集构建**
   - TODO 工具：`createTodoTool()` 基于 `~/.<product>/todos/<sessionId>-frontend.json` 提供读写能力。
   - Spec 阅读：`createSpecReaderTool()` 暴露 `spec_reader.read`，让 Agent 随时注入规范内容。
   - 文件草稿：`createFileDraftTool()` 将模型生成的文件写入内存 `FileDraftStore`，调用方可决定何时落盘。
3. **上下文与提示词**
   - `LlmsContext.create()`：采样 README、git 摘要、规则文件等（等价于 Agent 通用 `llmsContexts` 载入流程）。
   - `generateFrontendProjectPrompt()`：根据 `specs` 名称与 `language` 生成系统提示词，指导模型聚焦前端需求。
4. **模型与回路**
   - `resolveModelWithContext()`：尊重配置覆盖，实例化最终 `model`。
   - `runLoop()`：以 `initialMessage` 为输入，持有上文工具、提示词与 `LlmsContext`，并开启 `autoCompact`。
   - 工具审批始终返回 `true`，默认 `thinking.effort='medium'`，适合作业生成类场景。
5. **收尾**
   - `loopResult.success === true`：返回 `files`（全部草稿）与原始 `loopResult`（包含 tokens、messages）。
   - `success === false`：依旧返回 `files`（便于排查），同时附带 `loopResult.error`。
   - `finally`：无论成功与否都会调用 `context.destroy()`，关闭背景资源（MCP、后台任务等）。

---

## 5. 返回值与落盘策略

- `files`：来源于 `FileDraftStore.drafts`，结构为 `{ [path: string]: { content: string; metadata?: DraftMeta } }`。
  - 你可以遍历写入真实文件，或结合 PR 工作流执行 diff。
  - 若希望让 Agent 直接修改磁盘，请改造工具集（将 `FileDraftTool` 替换为 `write`/`edit` 类工具）。
- `loopResult`：仅在 `success: true` 时返回，字段同 `LoopResult`（tokens、messages、toolRuns）。
- 错误场景会保留草稿，方便你还原上下文再重试。

---

## 6. 扩展建议

1. **自定义工具**：在 `toolset` 数组追加其他读/写工具（例如 `fetch`、`repo_map`），但务必保证 `Tools` 初始化顺序与权限正确。
2. **多语言提示词**：如果 `requirementDoc` 与 `specFiles` 使用不同语言，可通过 `language` 参数切换提示词，或在 `generateFrontendProjectPrompt` 基础上自定义模板。
3. **Session 持久化**：需要可重入对话时，可将 `Session.create()` 改为 `Session.resume(sessionId)`，并在外部存储 `sessionId`。
4. **管线集成**：在 CI/CD 中调用时，建议捕获 `result.files` 并生成工件（zip/patch），同时持久化 `loopResult` 便于审计。
5. **回放调试**：结合 `messages-replayer`（见仓库根目录）可对 `result.loopResult.messages` 进行重放，复现模型调用细节。

---

通过遵循上述约定，你可以快速集成前端项目生成流程，并保持与整体 Agent 基础设施（详见 `agent-service-lifecycle.md`）的行为一致。\*\*\*
