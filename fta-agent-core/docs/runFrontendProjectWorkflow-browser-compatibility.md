# runFrontendProjectWorkflow 调用链路与浏览器兼容性分析

> 分析日期: 2025-01-10  
> 目标文件: `src/frontendProjectService.ts`

本文档详细分析 `runFrontendProjectWorkflow` 函数的完整调用链路，并评估其在浏览器环境运行的可行性。

---

## 一、调用链路分析

### 1.1 直接调用点

- **测试文件**: `fta-agent-core/src/frontendProjectService.test.ts:125` - 单元测试中调用
- **导出入口**: `fta-agent-core/src/index.ts:7` - 作为公共 API 导出
- **文档示例**: `fta-agent-core/docs/frontend-project-workflow.md` - 使用示例

### 1.2 函数执行流程

```
runFrontendProjectWorkflow(opts)
├── Context.create()
│   ├── Paths (使用 os.homedir(), process.cwd())
│   ├── ConfigManager (读取 ~/.{product}/config.json)
│   ├── MCPManager (可能启动子进程)
│   └── BackgroundTaskManager
├── Session.create()
├── FileDraftStore (内存存储，无文件操作)
├── JsonlLogger (文件系统: fs.appendFileSync, fs.readFileSync)
├── RequestLogger (文件系统: fs.appendFileSync, fs.mkdirSync)
├── createTodoTool (文件系统: fs.readFile, fs.writeFile, fs.existsSync)
├── createSpecReaderTool (文件系统: fs.readFileSync, fs.existsSync, fs.readdirSync)
├── createFileDraftTool (仅内存操作)
├── LlmsContext.create()
│   ├── getGitStatus() (执行 git 命令，需要 child_process)
│   ├── createLSTool() (文件系统操作)
│   ├── resolveLlmsRules() (读取规则文件)
│   └── 读取 README.md (fs.readFileSync)
├── resolveModelWithContext() (可能读取环境变量 process.env)
└── runLoop()
    ├── 模型 API 调用 (HTTP 请求，浏览器可用)
    ├── 工具执行 (部分工具依赖文件系统)
    └── History 压缩 (仅内存操作)
```

### 1.3 关键依赖模块

#### Context 模块
- **文件**: `src/context.ts`
- **依赖**: `Paths`, `ConfigManager`, `MCPManager`, `BackgroundTaskManager`
- **Node.js 特性**: 文件系统操作、进程管理

#### Paths 模块
- **文件**: `src/paths.ts`
- **Node.js API**: `os.homedir()`, `process.cwd()`, `fs.existsSync()`, `fs.readdirSync()`, `fs.statSync()`, `fs.readFileSync()`

#### ConfigManager 模块
- **文件**: `src/config.ts`
- **Node.js API**: `os.homedir()`, `fs.existsSync()`, `fs.readFileSync()`, `fs.writeFileSync()`, `fs.mkdirSync()`

#### JsonlLogger 模块
- **文件**: `src/jsonl.ts`
- **Node.js API**: `fs.existsSync()`, `fs.readFileSync()`, `fs.mkdirSync()`, `fs.appendFileSync()`

#### RequestLogger 模块
- **文件**: `src/jsonl.ts`
- **Node.js API**: `fs.existsSync()`, `fs.mkdirSync()`, `fs.appendFileSync()`

#### Tools 模块
- **createTodoTool** (`src/tools/todo.ts`): `fs.readFile()`, `fs.writeFile()`, `fs.existsSync()`, `fs.mkdirSync()`
- **createSpecReaderTool** (`src/tools/specReader.ts`): `fs.readFileSync()`, `fs.existsSync()`, `fs.readdirSync()`, `fileURLToPath()`
- **createFileDraftTool** (`src/tools/fileDraft.ts`): 仅内存操作，无文件系统依赖

#### LlmsContext 模块
- **文件**: `src/llmsContext.ts`
- **依赖**: `getGitStatus()` (执行 git 命令), `createLSTool()`, `resolveLlmsRules()`, 读取 README.md
- **Node.js API**: `fs.existsSync()`, `fs.readFileSync()`, `execFileNoThrow()` (子进程)

#### runLoop 模块
- **文件**: `src/loop.ts`
- **特性**: 模型 API 调用（HTTP，浏览器可用）、工具执行、历史压缩（内存操作）

---

## 二、Node.js 特定依赖清单

### 2.1 文件系统操作 (fs 模块)

#### JsonlLogger
- `fs.appendFileSync` - 追加日志消息
- `fs.readFileSync` - 读取最新 UUID
- `fs.existsSync` - 检查日志文件是否存在
- `fs.mkdirSync` - 创建日志目录

#### RequestLogger
- `fs.appendFileSync` - 记录请求元数据和块数据
- `fs.mkdirSync` - 创建请求日志目录

#### createTodoTool
- `fs.readFile` (异步) - 读取待办事项文件
- `fs.writeFile` (异步) - 保存待办事项文件
- `fs.existsSync` - 检查文件是否存在
- `fs.mkdirSync` - 创建待办事项目录

#### createSpecReaderTool
- `fs.readFileSync` - 读取规范文件内容
- `fs.existsSync` - 检查规范文件是否存在
- `fs.readdirSync` - 扫描 mock-specs 目录（测试环境）
- `fileURLToPath` (node:url) - 转换模块 URL 为文件路径

#### Paths
- `fs.existsSync` - 检查全局项目目录
- `fs.readdirSync` - 列出会话日志文件
- `fs.statSync` - 获取文件修改时间
- `fs.readFileSync` - 读取会话摘要

#### ConfigManager
- `fs.existsSync` - 检查配置文件是否存在
- `fs.readFileSync` - 读取全局/项目配置
- `fs.writeFileSync` - 保存配置更改
- `fs.mkdirSync` - 创建配置目录

#### LlmsContext
- `fs.existsSync` - 检查 README.md 是否存在
- `fs.readFileSync` - 读取 README.md 内容

#### resolveLlmsRules
- 文件读取操作（具体实现需查看 `src/rules.ts`）

### 2.2 系统级 API

#### os 模块
- `os.homedir()` - 获取用户主目录
  - 使用位置: `Paths` 构造函数, `ConfigManager` 构造函数
  - 用途: 构建全局配置目录路径 `~/.{productName}`

#### process 对象
- `process.cwd()` - 获取当前工作目录
  - 使用位置: `Paths.getSessionLogPath()`
  - 用途: 解析相对路径的会话日志

- `process.env` - 环境变量
  - 使用位置: `model.ts` (OPENAI_API_KEY, OPENAI_BASE_URL, LLM_TIMEOUT), `specReader.ts` (VITEST), 多个工具
  - 用途: 读取 API 密钥、配置参数

- `process.platform` - 平台检测
  - 使用位置: `llmsContext.ts`, `utils/ripgrep.ts`, `utils/isLocal.ts`
  - 用途: 平台特定逻辑

#### node:url 模块
- `fileURLToPath` - URL 转文件路径
  - 使用位置: `tools/specReader.ts`
  - 用途: 在 ESM 模块中获取当前文件目录

### 2.3 子进程操作

#### getGitStatus()
- **文件**: `src/utils/git.ts`
- **API**: `execFileNoThrow` (基于 `child_process.execFile`)
- **命令**: 执行多个 `git` 命令
  - `git rev-parse --is-inside-work-tree`
  - `git branch --show-current`
  - `git rev-parse --abbrev-ref origin/HEAD`
  - `git status --short`
  - `git log --oneline -n 5`
  - `git config user.email`
  - `git log --author ... --oneline -n 5`

#### MCPManager
- **文件**: `src/mcp.ts`
- **特性**: 可能启动 stdio 类型的 MCP 服务器子进程
- **依赖**: `@ai-sdk/mcp` 的 `experimental_createMCPClient`

#### BackgroundTaskManager
- **文件**: `src/backgroundTaskManager.ts`
- **API**: `process.kill()` - 进程管理
- **用途**: 管理后台任务进程的生命周期

### 2.4 路径操作

- `path.join` - 拼接路径
- `path.resolve` - 解析绝对路径
- `path.dirname` - 获取目录路径
- `path.basename` - 获取文件名
- `path.isAbsolute` - 判断绝对路径

**注意**: 虽然 `pathe` 库理论上可以在浏览器使用，但在此代码库中，所有路径操作都配合 `fs` 模块使用，因此仍需要 Node.js 环境。

---

## 三、浏览器兼容性结论

### ❌ **不能直接在浏览器运行**

#### 核心原因

1. **文件系统依赖**
   - 大量使用 Node.js `fs` 模块进行同步和异步文件读写
   - 浏览器无直接文件系统访问权限（出于安全考虑）
   - 所有日志、配置、待办事项、规范文件都依赖真实文件系统

2. **系统路径依赖**
   - 依赖 `os.homedir()` 获取用户主目录（浏览器无此概念）
   - 依赖 `process.cwd()` 获取当前工作目录（浏览器无工作目录概念）
   - 路径系统基于真实文件系统结构

3. **子进程执行**
   - Git 状态获取需要执行系统命令（`git` CLI）
   - 浏览器无法直接执行系统命令或启动子进程
   - MCP stdio 类型服务器需要子进程通信

4. **进程管理**
   - `BackgroundTaskManager` 使用 `process.kill()` 管理进程
   - 浏览器无进程管理能力

5. **环境变量**
   - 依赖 `process.env` 读取配置（API 密钥等）
   - 浏览器环境变量访问受限

### ✅ **可能的适配方案**

如果要在浏览器环境运行，需要进行以下适配：

#### 1. 文件系统抽象层

**方案 A: IndexedDB 存储**
- 使用 IndexedDB 替代真实文件系统
- 实现文件系统 API 的异步版本
- 路径映射到 IndexedDB 键值对

**方案 B: MemoryFS**
- 使用内存文件系统（如 `memfs`）
- 所有文件操作在内存中进行
- 适合临时会话，数据不持久化

**方案 C: 虚拟文件系统接口**
- 定义文件系统接口抽象
- Node.js 环境使用真实 `fs`，浏览器环境使用存储 API
- 需要重构所有文件操作代码

**实现要点**:
- 将 `fs.appendFileSync` 改为异步 API（IndexedDB 操作）
- 将 `fs.readFileSync` 改为异步读取
- 路径操作改为虚拟路径系统（如 `/project/{projectId}/...`）

#### 2. 配置与路径管理

**配置存储**:
- 使用 `localStorage` 或 `sessionStorage` 替代配置文件
- 配置键名: `{productName}_config`
- 支持项目级配置（使用项目 ID 作为命名空间）

**路径管理**:
- 移除 `os.homedir()` 依赖
- 使用项目 ID 或会话 ID 作为虚拟根目录
- `cwd` 改为虚拟工作目录（如 `/project/{projectId}`）
- 全局配置目录映射到 `localStorage` 或 IndexedDB

**实现示例**:
```typescript
// 浏览器环境路径适配
class BrowserPaths {
  constructor(private projectId: string) {}
  
  get globalConfigDir() {
    return `/browser/${this.projectId}/config`;
  }
  
  get globalProjectDir() {
    return `/browser/${this.projectId}/projects`;
  }
}
```

#### 3. Git 操作替代

**方案 A: 后端 API**
- 通过 HTTP API 调用后端服务获取 Git 状态
- 后端执行 `git` 命令并返回结果
- 需要新增 API 端点

**方案 B: 移除 Git 功能**
- 在浏览器环境禁用 Git 状态获取
- `LlmsContext.create()` 中跳过 Git 相关逻辑
- 通过配置标志控制

**方案 C: WebAssembly Git**
- 使用 WebAssembly 版本的 Git 实现（如 `isomorphic-git`）
- 在浏览器中直接操作 Git 仓库
- 需要用户提供 Git 仓库的访问权限

#### 4. 进程管理移除

**MCP 适配**:
- 仅支持 HTTP/SSE 类型的 MCP 服务器
- 禁用 stdio 类型的 MCP 服务器
- 通过配置验证服务器类型

**后台任务管理**:
- 移除 `BackgroundTaskManager` 功能
- 或改为基于 Web Worker 的实现
- 任务状态存储在 IndexedDB

#### 5. 环境变量处理

**配置对象传入**:
- 不再依赖 `process.env`
- 通过 `configOverrides` 参数传入所有配置
- API 密钥等敏感信息通过配置对象提供

**实现示例**:
```typescript
// 浏览器环境配置
const browserConfig = {
  model: 'gpt-4',
  apiKey: userProvidedApiKey, // 从用户输入或安全存储获取
  // ... 其他配置
};

await runFrontendProjectWorkflow({
  ...opts,
  configOverrides: browserConfig,
});
```

#### 6. 工具适配

**createTodoTool**:
- 使用 IndexedDB 存储待办事项
- 路径改为虚拟路径（如 `/todos/{sessionId}.json`）

**createSpecReaderTool**:
- 规范文件通过配置对象传入（内容而非路径）
- 或通过 HTTP API 获取规范内容

**JsonlLogger / RequestLogger**:
- 使用 IndexedDB 存储日志
- 或通过 WebSocket/SSE 实时发送到后端

### 📝 **当前配置中的 browser 选项**

代码中存在 `config.browser?: boolean` 配置项（默认 `false`），位于 `src/config.ts:53`:

```typescript
export type Config = {
  // ...
  browser?: boolean;
  // ...
};

const DEFAULT_CONFIG: Partial<Config> = {
  // ...
  browser: false,
  // ...
};
```

**当前状态**: 该配置项**当前实现并未针对浏览器环境做适配**，可能为预留接口或未来扩展点。

**建议**: 如需实现浏览器支持，应：
1. 在 `Context.create()` 中检测 `browser: true`
2. 根据环境选择不同的实现（Node.js vs Browser）
3. 使用依赖注入或工厂模式创建环境特定的实现

---

## 四、建议

### 1. 服务端运行（推荐）

**当前设计最适合在 Node.js 服务端环境运行**，原因：
- 完整的文件系统访问能力
- 可以直接执行系统命令（Git）
- 进程管理功能完整
- 配置管理基于文件系统，易于持久化

**使用场景**:
- CLI 工具
- 服务端 API 端点
- 自动化流水线
- 本地开发脚本

### 2. 浏览器集成方案

**推荐架构**: 通过 HTTP API 调用服务端接口

```
浏览器前端
  ↓ HTTP/WebSocket
服务端 API (Node.js)
  ↓
runFrontendProjectWorkflow()
  ↓
文件系统 / Git / 进程管理
```

**优势**:
- 无需重构现有代码
- 保持服务端完整功能
- 浏览器端只需实现 API 调用和 UI
- 安全性更好（API 密钥在服务端）

**实现要点**:
- 服务端暴露 REST API 或 WebSocket 端点
- 浏览器通过 `fetch` 或 WebSocket 调用
- 流式响应通过 SSE 或 WebSocket 推送
- 文件草稿通过 API 返回，浏览器端处理下载

### 3. 浏览器直接运行（如需）

**工作量评估**: 估计需要 **2-3 周** 的重构工作

**主要任务**:
1. **文件系统抽象层** (1 周)
   - 定义文件系统接口
   - 实现 IndexedDB 后端
   - 重构所有文件操作代码

2. **配置与路径管理** (3-4 天)
   - 浏览器存储适配
   - 路径系统重构
   - 环境变量处理

3. **Git 功能适配** (2-3 天)
   - 后端 API 集成或功能移除
   - Git 状态获取逻辑修改

4. **进程管理移除/适配** (1-2 天)
   - MCP 类型验证
   - 后台任务管理移除或 Web Worker 实现

5. **测试与验证** (3-4 天)
   - 浏览器环境测试
   - 功能回归测试
   - 性能优化

**风险**:
- 代码复杂度增加（需要维护两套实现）
- 浏览器存储限制（IndexedDB 配额）
- 功能可能受限（如 Git 操作）
- 性能可能下降（异步操作增加）

---

## 五、总结

`runFrontendProjectWorkflow` 函数**当前无法直接在浏览器环境运行**，主要原因包括：

1. ✅ **文件系统依赖**: 大量使用 Node.js `fs` 模块
2. ✅ **系统路径依赖**: 依赖 `os.homedir()` 和 `process.cwd()`
3. ✅ **子进程操作**: Git 状态获取需要执行系统命令
4. ✅ **进程管理**: MCP 和后台任务管理需要进程操作

**推荐方案**: 通过服务端 API 暴露功能，浏览器通过 HTTP/WebSocket 调用。

**如需浏览器直接运行**: 需要大量重构工作（2-3 周），包括文件系统抽象、配置管理、Git 功能适配等。

---

## 附录：相关文件清单

### 核心文件
- `src/frontendProjectService.ts` - 主函数
- `src/context.ts` - 上下文管理
- `src/paths.ts` - 路径管理
- `src/config.ts` - 配置管理
- `src/jsonl.ts` - 日志记录
- `src/llmsContext.ts` - LLM 上下文
- `src/loop.ts` - 主循环

### 工具文件
- `src/tools/todo.ts` - 待办事项工具
- `src/tools/specReader.ts` - 规范读取工具
- `src/tools/fileDraft.ts` - 文件草稿工具
- `src/utils/git.ts` - Git 状态获取

### 文档文件
- `docs/frontend-project-workflow.md` - 使用文档
- `docs/agent-service-lifecycle.md` - 生命周期文档

