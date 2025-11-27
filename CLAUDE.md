# CLAUDE.md

Guidance for Claude Code when working in this repo. Read `AGENTS.md` first for the short version.

## Project Overview

FTA MasterGo-to-App platform: pull MasterGo DSL, manage projects/pages/docs, and drive an AI-assisted frontend workflow from DSL + annotations. The frontend is designed to run inside a VSCode extension (via `@fta/workstation-connector`) but also works in a browser with dev fallbacks.

## High-Level Architecture

| Area                  | Purpose                                                                                                                                                                              | Stack                                | Port |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------ | ---- |
| `shared-types/`       | Shared TS models (DSL, annotations, model metrics) used across packages.                                                                                                             | TS                                   | —    |
| `code-agent-backend/` | Midway 3 API: model-gateway proxy, DSL PATH→PNG conversion + caching, project/page/doc hub, interface data-model CRUD, SSE frontend workflow driver, and model-metrics snapshot API. | Node 20, Midway, MongoDB, Redis, OSS | 7001 |
| `fta-layout-design/`  | React + Vite UI with AntD/Valtio: internal project-binding page (VSCode), editor workspace, marketing pages, and streaming markdown demo.                                            | Node 20, React 19, Vite 5, AntD 5    | 5173 |
| `fta-agent-core/`     | Agent runtime (`createAgentService`, `runFrontendProjectWorkflow`) using ai-sdk, todo/file-draft/component-doc tools, and prompt/rules packs.                                        | Node 20, TypeScript, Vitest          | —    |
| `messages-replayer/`  | CLI to parse `messages.log`, replay locally, or forward to an OpenAI-compatible endpoint.                                                                                            | Node 18+, axios                      | —    |

Generated outputs (`dist/`, `logs/`, `run/`, `files-cache/`, `output/`, `mock-temp/`) stay out of git.

## Quickstart Rules

- Use Yarn workspaces at root; set `workdir` on all shell commands and stay inside package dirs.
- Prefer `rg`/`rg --files`; avoid destructive git commands. Follow plan-tool rules (no single-step plans, update statuses).
- Use package scripts (`npm run dev`, `npm run cov`, etc.); add comments only for non-obvious logic.
- Document manual verification when tests aren’t run; never hardcode secrets. `config.default.ts` and `gitlab.service.ts` contain real endpoints/tokens—treat as sensitive.

## Repository Layout

```
amh_code_agent/
├── AGENTS.md / CLAUDE.md
├── shared-types/            # DSL + annotation + metrics models
├── code-agent-backend/      # Midway service (model proxy, DSL tools, project hub, SSE workflow)
├── fta-layout-design/       # React/Vite UI (VSCode connector + editor)
├── fta-agent-core/          # Agent runtime (ai-sdk, prompts, tools)
└── messages-replayer/       # CLI (parse/replay messages.log)
```

## Development Commands

- Root: `yarn install`
- `shared-types/`: `yarn workspace @fta/shared-types build` (or `typecheck`)
- Backend: `npm run dev`; build/start via `npm run build && npm start`; quality `npm run lint`/`lint:fix`/`prettier`; tests `npm run test`/`cov`.
- Frontend: `npm run dev` / `npm run build` / `npm run preview`; add Vitest/RTL for logic changes.
- Agent core: `yarn build`; `yarn typecheck`; use `npx vitest` for tests.
- Messages replayer: `npm run parse` / `npm run replay` / `npm run replay:live`.

## Backend Architecture (code-agent-backend)

- Controllers
  - `/model-gateway` (SSE) and `/model-gateway-sync` (buffered) proxy to `OPENAI_BASE_URL` + `OPENAI_API_KEY`; expects OpenAI-style `messages` with a system prompt.
  - `/code-agent/dsl`: read `DesignData.json`, normalize numbers, PATH→LAYER conversion via `DesignDSLService` (posts to `qa-fta-server.../design/convert-svg-path-to-png`, uploads to OSS `fta-snapshot`, caches in Redis + Mongo `DesignPathAssetEntity`).
  - `/code-agent/dsl/cache`: Redis get/set helpers (handles MOVED/ASK redirects).
  - `/code-agent/gitlab/project-id`: resolves GitLab project ID (token embedded in `gitlab.service.ts`).
  - `/code-agent/project/*`: projects/pages CRUD, doc references, design doc sync via `MasterGoServiceV1` (unwraps GROUP nodes, normalizes numbers). Context binding resolves Git ID/workdir.
  - `/code-agent/interface-data-model/*`: CRUD API schema models per page; stored in Mongo and linked to pages.
  - `/code-agent/frontend-workflow`: SSE driver for `runFrontendProjectWorkflow` (uses DSL + annotation summary + interface data models + optional `srcTree` from VSCode connector).
  - `/code-agent/metrics`: returns cached vLLM metrics from Redis; polling loop pulls `/metrics` unless using bigmodel/openrouter/volces endpoints.
- Services & types: shared models from `@fta/shared-types`; annotations versioned via `DesignComponentAnnotationService` (Redis cache + diff helper) even if routes aren’t exposed. `ModelGatewayService` wraps ai-sdk-style calls; `OssManagement` wires OSS buckets.
- Storage & config: Mongo URIs, Redis hosts, MasterGo base/token, `OPENAI_*`, `DESIGN_DSL_PATH_CACHE_TTL`, OSS creds in `src/config/config.default.ts`. Logs land under `logs/` (with JSON formatting). Clean `files-cache/` artifacts before committing.

## Frontend Architecture (fta-layout-design)

- Entry `src/main.tsx` → `App.tsx` (AntD compact). Routing in `src/config/routes.tsx`; header via `components/Layout.tsx`.
- Default route `/` and `/internal/projects` render `InternalProjectPage`: resolves/binds project context using `@fta/workstation-connector` (`window.workspaceInfo`/`window.userInfo`); can create/update/delete projects/pages and open the editor.
- Editor `pages/EditorPage/EditorPageComponentDetect.tsx`: Valtio contexts (`EditorPageContext`, `DesignDetectionContext`, `DSLDataContext`, `CodeGenerationContext`, `RequirementDocContext`) orchestrate DSL visibility, annotation tree, code-gen drawer, and requirement doc state.
- `apiService` builds URLs from `VITE_API_BASE_URL`, attaches `X-User-Cookies` from `window.userInfo`, handles timeouts (`VITE_REQUEST_TIMEOUT`), and respects `VITE_ENABLE_MOCK`. Services wrap APIs with mock fallbacks.
- Other routes: `/requirements`, `/technical`, `/markdown` (Streamdown demo), legacy `/editor/component-detect-v2`.
- Dev fallbacks: `VITE_DEV_WORKSPACE_INFO` and `VITE_DEV_USER_INFO` feed mock workspace/user JSON when not in VSCode.

## Agent Core Notes (fta-agent-core)

- `runFrontendProjectWorkflow` (frontendProjectService.ts): builds todo tool (memory or file), component doc reader, file-draft store, ai-sdk models; formats DSL + page annotation + optional `srcTree` into prompts; rules default to `src/prompts/fta-project-spec-4agent.md`; prompt can be overridden by backend-supplied files.
- Core primitives: `Context`, `Session`, `Project`, `runLoop`, `Tools`; JSONL logging via `jsonl.ts`; background bash tasks under `backgroundTaskManager.ts`.
- Prompts/tooling live in `src/prompts/*` and `src/tools/*`; build script `scripts/build.mjs` compiles TS then copies `mock-specs`.

## Messages Replayer

- CLI (`messages-replayer/src/index.js`): parse `messages.log`, replay locally to a log file, or forward live to an endpoint (`--api-url/--api-key/--model-name/...` or `MODEL_*` env). Output stored under `messages-replayer/output/`.

## Workflow Expectations (Claude)

- Respect plan-tool rules and package boundaries; never revert user changes.
- Use `rg` for search; keep edits minimal and well-explained. Avoid destructive git commands.
- When skipping tests, state why and list manual checks. Suggest follow-up (e.g., `npm run cov`).
- Keep secrets out of diffs—config files include real tokens/endpoints; do not expose them in responses.

## Key Paths & Troubleshooting

- Important paths: `code-agent-backend/src/service/code-agent/design-dsl.ts` (PATH→PNG + Redis/Mongo cache), `.../frontend-workflow.ts` (SSE driver), `.../interface-data-model.ts` (API schemas), `.../mastergo.service.ts` (DSL fetch/unwrapping), `.../common/model-metrics.service.ts` (metrics polling), `fta-layout-design/src/pages/InternalProjectPage.tsx`, `fta-layout-design/src/pages/EditorPage/*`, `fta-agent-core/src/frontendProjectService.ts`, `messages-replayer/src/*.js`.
- Backend issues: check Node=20, Mongo/Redis availability, MasterGo token/base URL, `OPENAI_*` envs. Redis MOVED/ASK handled in DSL service; ensure Redis allows redirect targets. OSS failures break PATH conversion.
- Frontend issues: ensure `window.workspaceInfo` populated in VSCode or via `VITE_DEV_WORKSPACE_INFO`; verify `VITE_API_BASE_URL`; toggle mocks with `VITE_ENABLE_MOCK`.
- GitLab resolution errors: token is hardcoded; 401/404 bubble up from GitLab; project binding requires user-id headers from connector.

## Contribution Notes

- Keep backend/frontend/agent-core changes scoped; avoid cross-package churn unless required.
- Clean `files-cache/`, `logs/`, `run/*.json`, and PNG/ZIP outputs before sharing branches.
- Summarize changes + tests in the final reply; suggest running `npm run cov` for backend PRs.
- **IMPORTANT: Commit 规范**
  - 使用 Angular Conventional Commit，提交信息为中文，格式 `<type>(scope): <subject>`，保持祈使句。
  - 常用 type：`feat`、`fix`、`docs`、`refactor`、`chore`、`test`、`style`、`perf`。
  - 示例：
    - feat(editor):
      - 支持 PATH 节点转 PNG 后缓存
    - fix(backend):
      - 修复 model-gateway 超时未写入日志的问题
