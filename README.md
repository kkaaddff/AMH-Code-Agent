# FTA MasterGo-to-App Platform

企业级「设计稿 → 代码」平台，涵盖 Midway 后端服务、React 前端工作台与一套对话日志回放 CLI，可将 MasterGo 设计数据转化为 DSL、组件标注、需求文档及代码资产。

---

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Key Capabilities](#key-capabilities)
3. [Repository Structure](#repository-structure)
4. [Getting Started](#getting-started)
5. [Backend Service](#backend-service)
6. [Frontend Application](#frontend-application)
7. [Messages Replayer CLI](#messages-replayer-cli)
8. [Environment Variables](#environment-variables)
9. [Development Commands](#development-commands)
10. [Testing & Verification](#testing--verification)
11. [Security & Operational Notes](#security--operational-notes)

---

## Architecture Overview

| Layer | Description | Stack |
| --- | --- | --- |
| Backend (`code-agent-backend/`) | Midway 3 + Egg API。负责 MasterGo 设计稿拉取、DSL/标注版本管理、需求文档生成（模型网关）、代码生成任务队列（Bull）、项目/文档中心，以及 `/neo/send` SSE 智能体。 | Node 20.19.5, Midway, MongoDB 5.13, Redis 4.28, Bull, OSS |
| Frontend (`fta-layout-design/`) | React + Vite 工作台。包含首页仪表盘、需求/技术说明页，以及具备 3D Inspect、标注树、PRD/OpenAPI 面板、代码生成抽屉的组件检测编辑器。 | Node 20.19.5, React 19, Ant Design 5, Valtio, React Router, Three.js |
| CLI (`messages-replayer/`) | 将 `messages.log` 逐条回放，或重放至任意 OpenAI 兼容模型端点，支持 API Key/模型覆盖参数。 | Node 18+, axios |

---

## Key Capabilities

- **设计稿管理**：从 MasterGo 链接提取 `fileId/layerId`，存储 DSL JSON、版本化修订与 Redis 缓存，支持 DSL 摘要校验与修订冲突检测。
- **组件标注**：树状标注结构持久化在 MongoDB，活跃版本缓存于 Redis，可计算跨版本差异 (`/design/:id/annotations/diff`)。
- **需求文档生成**：`RequirementSpecModelService` 基于模型网关流式生成 Markdown（SSE `/code-agent/requirement/generate`），失败自动回退至非流式模式，并可导出 `.md` 到 `files-cache/design/requirement-docs/`。
- **代码生成任务**：Bull 队列 `design:code-generation` 驱动，任务状态/日志/重试由 `DesignCodeGenerationTaskService` 管理，产出以 ZIP 形式存储于 `files-cache/design/codegen/` 并通过 `/filesCache/<key>` 下载。
- **项目 & 文档中心**：`/code-agent/project/*` 控制器支持项目/页面 CRUD、文档同步（MasterGo DSL）、状态流转、文档内容读写。
- **组件检测工作台**：前端编辑器整合 DSL 渲染、标注树、图层属性、3D 视角、PRD 编辑器、OpenAPI 数据面板与代码生成抽屉，可与 `DesignDSLService`、`RequirementService` 等接口联动。
- **对话回放**：`messages-replayer` 可 100% 还原 `messages.log` 或直接调用 LLM 网关进行实时回放，方便追踪/复现历史会话。

---

## Repository Structure

```
amh_code_agent/
├── AGENTS.md                 # 快速作业规范
├── CLAUDE.md                 # Claude Code 深度指南
├── README.md                 # 本文件
├── code-agent-backend/       # Midway 后端服务
│   ├── src/controller/       # design / code-agent / neovate 控制器
│   ├── src/service/          # 设计域、项目域、DSL、OSS、neovate 等服务
│   ├── src/entity/           # Mongo Typegoose 实体
│   ├── src/dto/              # Swagger DTO + 校验
│   ├── src/queue/            # Bull 处理器
│   └── src/config/           # Midway & 环境配置
├── fta-layout-design/        # Vite + React 前端
│   ├── src/pages/            # 首页/需求/技术/编辑器等页面
│   ├── src/contexts/         # Valtio 状态容器
│   ├── src/services/         # API 服务 & Mock
│   ├── src/utils/            # API、布局、路由等工具
│   └── docs/                 # 函数清单 & 重构建议
└── messages-replayer/        # 日志回放 CLI
    └── src/                  # parser / replayer / llmClient / config
```

---

## Getting Started

### 1. Clone & Install
```bash
git clone <repo_url>
cd amh_code_agent
```
Install dependencies per package:
```bash
(cd code-agent-backend && npm install)
(cd fta-layout-design && npm install)
(cd messages-replayer && npm install)
```

### 2. Configure Environment
- Backend: copy `.env.example` (若存在) 或直接设置 shell 环境。至少需要 Mongo、Redis、MasterGo、MODEL 网关等变量（见 [Environment Variables](#environment-variables)）。
- Frontend: 在 `fta-layout-design/.env.local` 配置 `VITE_API_BASE_URL=http://127.0.0.1:7001` 及可选 `VITE_ENABLE_MOCK=true`。
- CLI: 在 `messages-replayer/.env` 配置 `MODEL_ENDPOINT`, `MODEL_API_KEY`, `MODEL_NAME`, `MODEL_TEMPERATURE`, `MODEL_TIMEOUT` 等。

### 3. Run Services
```bash
# Backend
cd code-agent-backend
npm run dev            # http://localhost:7001

# Frontend (new terminal)
cd ../fta-layout-design
npm run dev            # http://localhost:5173
```
Access the app via `http://localhost:5173`, ensure API `/code-agent/**` 代理至 7001。

---

## Backend Service

- **Entry**: `bootstrap.js` / `start.sh`
- **Notable Controllers**:
  - `controller/design/*.ts`：设计稿 CRUD、标注、需求文档、代码生成任务
  - `controller/code-agent/*.ts`：DSL 工具、项目/页面/文档中心
  - `controller/neovate/index.ts`：SSE 智能体 `/neo/send`
- **Data Flow Highlights**:
  - `service/design/mastergo.service.ts`：解析 MasterGo 短链接→重定向→提取 `fileId` & `layerId`
  - `service/design/requirement-spec-model.service.ts`：构造 prompt，调用 `ModelGatewayService`，写入 `prompt.md` 便于调试
  - `service/code-agent/design-dsl.ts`：PATH → PNG （`sharp`） + Redis/Mongo 双写缓存
  - `queue/design/code-generation.processor.ts`：调用 Zip 生成 README & 需求文档副本
- **I/O Paths**: `files-cache/design/requirement-docs/`, `files-cache/design/codegen/`, `/filesCache/**` 静态访问
- **Quality Gates**: `npm run lint`, `npm run lint:fix`, `npm run prettier`, `npm run test`, `npm run cov`

---

## Frontend Application

- **Entry**: `src/main.tsx` → `src/App.tsx`
- **Routing**: Config-driven (`src/config/routes.tsx`) + `renderRoutes`
- **Major Pages**:
  - `HomePage/`: 仪表盘 + 项目管理（`ProjectContext`）
  - `RequirementPage.tsx` / `TechnicalPage.tsx`: 方案展示内容
  - `EditorPage/EditorPageComponentDetect.tsx`: 核心编辑器，整合 Layer Tree、Detection Canvas、PRD/OpenAPI、CodeGeneration Drawer、3D Inspect 等模块
- **State**: Valtio stores (`ProjectContext`, `EditorPageContext`, `DesignDetectionContext`, `DSLDataContext`, `CodeGenerationContext`)
- **Services**: `src/services/*.ts` 调用 `src/utils/apiService.ts`，可通过 `VITE_ENABLE_MOCK` 回退至 `mockProjectService` 等本地模拟
- **UI/UX**: Ant Design 5 compact theme (`ConfigProvider`)，配套 `App.tsx` 统一引入 `App.css` 与 `antd/dist/reset.css`

---

## Messages Replayer CLI

- **Usage**:
  ```bash
  cd messages-replayer
  npm run parse                 # 输出 session/请求统计
  npm run replay                # 逐行复刻 messages.log → output/messages-replay.log
  npm run replay:live           # 依赖 MODEL_* env，将请求重放到真实端点
  ```
- **Configuration**: 支持 `.env` 或 CLI 参数 (`--api-url`, `--api-key`, `--api-path`, `--model-name`, `--model-temperature`, ...)。输出写入 `output/` 目录。

---

## Environment Variables

### Backend (`code-agent-backend`)
| Key | Description |
| --- | --- |
| `MODEL_ENDPOINT` / `MODEL_API_KEY` / `MODEL_NAME` / `MODEL_TIMEOUT` / `MODEL_TEMPERATURE` | Requirement Spec + `/neo` 模型调用配置 |
| `MONGODB_URI` / `mongoose.client.*` | MongoDB 连接（默认值在 `config.default.ts` 中） |
| `REDIS_HOST` / `REDIS_PORT` / `REDIS_DB` | Redis 配置（支持集群 MOVED/ASK） |
| `MASTERGO_BASE_URL` / `MASTERGO_TOKEN` | MasterGo DSL API 凭证 |
| `OSS_*` | OSS 上传（见 `service/oss`） |
| `YMM_GLOBAL_PORT` | Midway 运行端口（默认 7001） |

### Frontend (`fta-layout-design`)
| Key | Description |
| --- | --- |
| `VITE_API_BASE_URL` | 后端 API 根地址（开发建议 `http://127.0.0.1:7001`） |
| `VITE_REQUEST_TIMEOUT` | fetch 超时时间 (ms) |
| `VITE_ENABLE_MOCK` | 为 `services/*` 切换至 Mock 数据 |

### Messages Replayer
同 Backend `MODEL_*`，另可通过 CLI 传入 `--api-url`, `--api-key`, `--api-timeout`, `--model-name`, 等。

---

## Development Commands

| Package | Command | Purpose |
| --- | --- | --- |
| `code-agent-backend` | `npm run dev` | Midway 热加载服务 |
| | `npm run build && npm start` | 构建 & 启动生产 bundle |
| | `npm run lint` / `lint:fix` / `prettier` | 代码质量 |
| | `npm run test` / `npm run cov` | Jest / 覆盖率 |
| `fta-layout-design` | `npm run dev` | Vite 开发服务器 |
| | `npm run build` | 生产构建 |
| | `npm run preview` | 预览 dist |
| `messages-replayer` | `npm run parse` / `replay` / `replay:live` | 日志解析与回放 |

> Always run commands from对应 package 目录，并在 CLI（如 Claude Code）中显式设置 `workdir`。

---

## Testing & Verification

- **Backend**：
  - 单测集中在 `test/`，使用 `@midwayjs/mock`
  - `npm run cov` 必须在合并前执行，并解释任何覆盖率下降
  - 重点验证：DSL/标注缓存命中、需求文档 SSE、Bull 任务回调、`/neo/send` SSE 生命周期
- **Frontend**：
  - 尚未接入自动化测试。提交前请手动走查涉及页面（首页、编辑器、需求/技术页），并记录验证步骤
  - 增量新增逻辑时，可在 `src` 同级添加 Vitest + React Testing Library 测试
- **CLI**：
  - 逻辑更新后至少运行 `npm run parse` + `npm run replay`。`replay:live` 需要配置真实端点

---

## Security & Operational Notes

- 不要提交包含敏感数据的 `files-cache/`、`run/*.json`、`logs/`。
- 所有凭证（MasterGo、OSS、MODEL、Mongo、Redis）均需通过环境变量或配置中心注入，切勿硬编码。
- 若修改装饰器/实体结构，请按需运行 `npx midway-bin dev --ts` 以刷新 Midway typings。
- `design-dsl` 相关逻辑会写入 `temp/`、`files-cache/`，本地调试完成后可清理残留图片/压缩包。

---

## Support & Contribution

- 提交信息遵循短小祈使句，必要时附加中文说明和验证步骤。
- 后端/前端/CLI 尽量分开提交，避免跨包耦合。
- 发现潜在重构点，可记录于 `fta-layout-design/docs/refactor-opportunities.md` 或在 PR 描述中注明。

欢迎贡献！如需讨论 API、模型或部署策略，请在 PR/Issue 中附上运行命令、日志与截图，便于快速 Review。
