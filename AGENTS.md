# Repository Guide

## Monorepo Layout

- `shared-types/` – Shared TypeScript interfaces (DSL, annotations, model metrics) consumed by backend, frontend, and agent-core.
- `code-agent-backend/` – Midway 3 service (Node 20) that proxies the model gateway, converts MasterGo DSL PATH nodes to OSS PNG layers with Redis/Mongo caching, manages projects/pages/docs, exposes interface data models CRUD, streams the frontend workflow via SSE, and surfaces model-metrics snapshots from Redis.
- `fta-layout-design/` – React 19 + Vite 5 UI with Ant Design compact theme. Default route is an internal project binding page (for VSCode connector) plus the component-detection editor, marketing pages, and a streaming markdown demo.
- `fta-agent-core/` – TypeScript agent runtime providing `createAgentService` and `runFrontendProjectWorkflow` (todo/file-draft/component-doc tools, ai-sdk LLMs). Tests sit beside sources; build copies mock specs.
- `messages-replayer/` – Small Node 18+ CLI that parses `messages.log`, replays locally, or re-sends to an OpenAI-compatible endpoint.
- Keep generated assets (`dist/`, `logs/`, `run/`, `files-cache/`, `output/`, `mock-temp/`) out of git.

## Workflow Basics

- Use Yarn workspaces at the repo root (`yarn install` once). Run package scripts from each folder or via `yarn workspace <name> <cmd>`.
- Always set `workdir` on shell commands and stay inside the target package.
- Prefer `rg` / `rg --files` for search; avoid destructive git commands.
- Follow plan-tool rules (no single-step plans; update statuses as you go).
- Use package scripts over raw binaries; add concise comments only when logic is non-obvious.
- Document manual verification when tests aren’t run; never leak env secrets.

## Build & Test Commands

| Package               | Develop                                      | Build/Start                              | Quality & Tests                                                                       |
| --------------------- | -------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------- |
| `shared-types/`       | `yarn workspace @fta/shared-types typecheck` | `yarn workspace @fta/shared-types build` | —                                                                                     |
| `code-agent-backend/` | `npm run dev`                                | `npm run build && npm start`             | `npm run lint`, `npm run lint:fix`, `npm run prettier`, `npm run test`, `npm run cov` |
| `fta-layout-design/`  | `npm run dev`                                | `npm run build` / `npm run preview`      | Add Vitest/RTL when touching logic; otherwise manual verification                     |
| `fta-agent-core/`     | —                                            | `yarn build`                             | `yarn typecheck` (use `npx vitest` for specs)                                         |
| `messages-replayer/`  | `npm run replay`                             | —                                        | `npm run parse`; live mode via `npm run replay:live`                                  |

## Backend Highlights (`code-agent-backend/`)

- Controllers: `/model-gateway` (SSE proxy) and `/model-gateway-sync` (buffered) hit `OPENAI_BASE_URL`; `/code-agent/dsl` reads/normalizes `DesignData.json` and converts PATH→LAYER via a remote PNG service + OSS upload with Redis/Mongo caching; `/code-agent/dsl/cache` get/set; `/code-agent/gitlab/project-id` resolves GitLab ID; `/code-agent/project/*` handles projects/pages/docs (design sync via MasterGo); `/code-agent/interface-data-model/*` CRUD; `/code-agent/frontend-workflow` streams `runFrontendProjectWorkflow`; `/code-agent/metrics` serves cached vLLM metrics.
- Services use Mongo (projects, documents, annotations, path assets), Redis (caches + metrics lock), and MasterGo token/base URL. Design annotations and diff utilities live under `src/service/design/*` even if not exposed by current routes.
- Config: see `src/config/config.default.ts` for Redis/Mongo/mastergo/model-gateway defaults and OSS buckets. Respect production hosts and tokens.

## Frontend Highlights (`fta-layout-design/`)

- React 19, Vite 5, Ant Design 5 compact. Routing in `src/config/routes.tsx`; `Layout` header + breadcrumbs.
- Default route `InternalProjectPage` resolves/binds project context using `@fta/workstation-connector` (window workspace info) or dev env fallbacks (`VITE_DEV_WORKSPACE_INFO`, `VITE_DEV_USER_INFO`); allows project/page CRUD and jumps to the editor.
- Editor: `EditorPage/EditorPageComponentDetect.tsx` with Valtio contexts (`EditorPageContext`, `DesignDetectionContext`, `DSLDataContext`, `CodeGenerationContext`, `RequirementDocContext`) for DSL visibility, annotation state, and code-gen drawer streams.
- `apiService` attaches `X-User-Cookies` from `window.userInfo`; `VITE_API_BASE_URL` + `VITE_REQUEST_TIMEOUT` + optional `VITE_ENABLE_MOCK` control traffic vs mocks.
- Extra pages: `/requirements`, `/technical`, `/markdown` (Streamdown demo), legacy `/` home dashboard.

## Agent Core (`fta-agent-core/`)

- `runFrontendProjectWorkflow` wires todo storage (file or memory), file-draft buffer, component doc reader, ai-sdk LLMs, and prompts/rules under `src/prompts/*`; logs JSONL in `dist` paths.
- `Context`, `Session`, `Project`, and `runLoop` live in `src/*.ts`; tests include `agentService.test.ts`, `frontendProjectService.test.ts`, `backgroundTaskManager.test.ts`.
- Build via `scripts/build.mjs` (clean + compile + copy mock specs); TypeScript config is strict (Node 20).

## Messages Replayer

- CLI commands from `messages-replayer/src/index.js`: `npm run parse`, `npm run replay`, `npm run replay:live` (requires `MODEL_*` or `--api-*` flags). Outputs go to `messages-replayer/output/`.

## Configuration & Security

- Backend env: `OPENAI_BASE_URL`/`OPENAI_API_KEY`/`OPENAI_MODEL`/`MODEL_TIMEOUT`/`MODEL_TEMPERATURE`, `MASTERGO_BASE_URL`/`MASTERGO_TOKEN`, Redis/Mongo hosts, `DESIGN_DSL_PATH_CACHE_TTL`, OSS creds. `config.default.ts` and `gitlab.service.ts` contain real endpoints/tokens—treat as secrets and avoid leaking.
- Frontend env: `VITE_API_BASE_URL`, `VITE_REQUEST_TIMEOUT`, `VITE_ENABLE_MOCK`, optional dev workspace/user JSON (`VITE_DEV_WORKSPACE_INFO`, `VITE_DEV_USER_INFO`).
- Keep `files-cache/`, `logs/`, `run/*.json`, and mock/temp outputs out of commits; scrub generated PNGs/ZIPs.

## IMPORTANT: Commit 规范

- 采用 Angular Conventional Commit，提交信息使用中文，保持祈使句、简洁明了。
- 基本结构：`<type>(scope): <subject>`，常见 type：`feat`、`fix`、`docs`、`refactor`、`chore`、`test`、`style`、`perf`。
- 示例：
  - feat(editor):
    - 支持 PATH 节点转 PNG 后缓存
  - fix(backend):
    - 修复 model-gateway 超时未写入日志的问题

## Testing & Verification

- Backend: Jest/Midway under `test/`; use `npm run cov` before merge and explain coverage gaps. Note Redis/Mongo dependencies.
- Frontend: no default automated suite; document manual flows (InternalProjectPage binding, editor load, API mocks vs live). Add Vitest/RTL when touching logic.
- CLI: after parser/replayer changes, run `npm run parse` + `npm run replay`; document live endpoint when using `replay:live`.
