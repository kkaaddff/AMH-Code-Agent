# CLAUDE.md — Operator Guide for Claude Code

> Workspace: `/Users/admin/Documents/ai/vibe-coding/amh_code_agent`
> Packages: `code-agent-backend/`, `fta-layout-design/`, `messages-replayer/`

This document tells Claude Code exactly how to work inside this monorepo. Follow it before writing any code or running any task.

---

## 1. High-Level Overview

| Area | Purpose | Stack | Default Port |
| --- | --- | --- | --- |
| `code-agent-backend/` | Midway 3 (Egg.js) API that ingests MasterGo designs, versions DSL/annotations, streams requirement docs through a model gateway, manages Bull-driven code generation tasks, exposes project CRUD utilities, and powers the `/neo/send` agent SSE endpoint. | Node 20.19.5, Midway, MongoDB 5.13, Redis 4.28, Bull | 7001 |
| `fta-layout-design/` | React + Vite UI with Ant Design & Valtio stores. Hosts dashboard/requirement/technical pages and the component-detection editor with 3D inspector, PRD/OpenAPI side panels, and code-generation drawer. | Node 20.19.5, React 19, AntD 5, Vite 5 | 5173 |
| `messages-replayer/` | CLI that replays `messages.log` sessions exactly or re-sends them to any OpenAI-compatible endpoint. | Node 18+ | N/A |

Generated artifacts (`dist/`, `logs/`, `run/`, `files-cache/`, `messages-replayer/output/`) stay out of git.

---

## 2. Repository Layout

```
amh_code_agent/
├── AGENTS.md (shared quick guide)
├── CLAUDE.md (this file)
├── README.md (product overview)
├── code-agent-backend/
│   ├── bootstrap.js / start.sh
│   ├── src/
│   │   ├── controller/        (design, code-agent, neovate)
│   │   ├── service/
│   │   │   ├── design/        (design docs, annotations, req docs, codegen)
│   │   │   ├── code-agent/    (DSL utilities, project hub)
│   │   │   ├── neovate-code/  (agent runtime)
│   │   │   └── common/oss/
│   │   ├── entity/, dto/, queue/, utils/, types/
│   │   └── config/            (Midway + env wiring)
│   └── test/ (Jest + @midwayjs/mock)
├── fta-layout-design/
│   ├── src/
│   │   ├── pages/             (Home, Requirement, Technical, Editor)
│   │   ├── components/, contexts/, services/, utils/
│   │   └── docs/              (function inventory, refactor notes)
│   └── vite.config.ts, tailwind.config.js
└── messages-replayer/
    ├── src/ (parser/replayer/llmClient)
    └── messages.log (input)
```

---

## 3. Backend (code-agent-backend)

### 3.1 Prerequisites
- Node `20.19.5` (clamped via `package.json` engines)
- MongoDB 5.13+ with credentials configured in `src/config/config.default.ts`
- Redis 4.28+ (cluster aware; `DesignDSLService` follows MOVED/ASK redirects)
- MasterGo token & base URL for DSL pulls (`config.mastergo`)
- Model gateway endpoint (`MODEL_ENDPOINT`, `MODEL_API_KEY`, etc.) for requirement document streaming and the `/neo` agent

### 3.2 Common Commands
```bash
cd code-agent-backend
npm install
npm run dev              # Midway dev server on 7001
npm run build && npm start
npm run lint             # mwts check
npm run lint:fix
npm run prettier
npm run test
npm run cov
```
Use `./start.sh <port>` for production-style boots.

### 3.3 Domain Services & Flows

| Service | Highlights |
| --- | --- |
| `DesignDocumentService` | Creates versions from MasterGo URLs, stores DSL JSON + digest, caches serialized DSL in Redis (`design:dsl:<id>`), handles revision conflicts, and exposes DSL retrieval per revision. |
| `DesignComponentAnnotationService` | Manages tree-shaped annotations with monotonic versions, caches them via Redis (`design:annotations:*`), and computes diffs between versions. |
| `DesignRequirementDocumentService` + `RequirementSpecModelService` | Streams Markdown via SSE by invoking `ModelGatewayService`; falls back to buffered generation and can export `.md` into `files-cache/design/requirement-docs/<docId>.md`. |
| `DesignCodeGenerationTaskService` | Creates Bull tasks, tracks logs/progress, retries, and persists ZIP metadata. Paired with `src/queue/design/code-generation.processor.ts` which currently produces a README + optional requirement doc and writes `/files-cache/design/codegen/<taskId>.zip`. |
| `DesignDSLService` | Reads `DesignDSL.json`, converts PATH nodes to PNG-backed LAYER nodes with `sharp`, caches assets in Redis + Mongo, and exposes Redis helper endpoints. |
| `ProjectService` | CRUD projects/pages/document references, syncs MasterGo DSLs, updates reference status, and stores doc content. Exposed under `/code-agent/project/*`. |
| `NeovateController` + `service/neovate-code/*` | SSE agent endpoint `/neo/send` that spins up `AgentContext`, streams `text_delta`, `todo_update`, `iteration_start/end`, and cleans contexts on completion. |

### 3.4 Paths & Storage
- `files-cache/design/requirement-docs/` – exported Markdown docs
- `files-cache/design/codegen/` – zipped code-generation artifacts
- `/filesCache/<key>` – static serving URL Midway exposes for cached assets

### 3.5 Testing Notes
- Tests live under `test/` and rely on `@midwayjs/mock`
- Use `npm run cov` for coverage (mandated before merge)
- Provide manual verification notes for flows without automated coverage

### 3.6 Coding Conventions
- `mwts` formatting: 2 spaces, single quotes, no dangling semicolons
- Decorators each on their own line, exported class names match file purpose
- Use `@Provide()`, `@Inject()`, `@InjectEntityModel()`, `@InjectQueue()` consistently
- Never commit secrets; rely on env variables or Lion config center values

---

## 4. Frontend (fta-layout-design)

### 4.1 Stack & Conventions
- Node `20.19.5`
- React 19, Vite 5, TypeScript 5.5, Ant Design 5 (compact theme)
- Tailwind only via `@tailwindcss/vite` (no Tailwind configs in components yet)
- Component/style rules: 2-space indentation, PascalCase components/contexts, camelCase hooks/utilities, constants in `UPPER_SNAKE_CASE`
- State orchestration via Valtio stores (Project, EditorPage, DesignDetection, DSLData, CodeGeneration)
- Respect path aliases declared in `vite.config.ts`

### 4.2 Commands
```bash
cd fta-layout-design
npm install
npm run dev
npm run build
npm run preview
```
(No automated tests today; add Vitest + RTL when modifying core logic and document manual checks.)

### 4.3 Application Structure
- `src/App.tsx` uses ConfigProvider + React Router to render config-based routes (`src/config/routes.tsx`)
- Pages
  - `HomePage/` – dashboard with ProjectManagement (CRUD via `useProject`) and AssetManagement placeholder
  - `RequirementPage.tsx` & `TechnicalPage.tsx` – marketing/overview content
  - `EditorPage/EditorPageComponentDetect.tsx` – orchestrates detection canvas, layer tree, annotation save, DSL visibility, PRD/OpenAPI editors, 3D inspector, and the code-generation drawer that talks to `CodeGenerationLoop/AgentScheduler`
- Contexts & Stores
  - `ProjectContext` – wraps API calls (`apiServices.project`) and exposes `loadProjects`, `createProject`, etc.
  - `EditorPageContext` – selected project/page/document state
  - `DesignDetectionContext` – DSL/annotation state, selection, persistence
  - `DSLDataContext` – node visibility toggles
  - `CodeGenerationContext` – UI state for drawer, thought chains, todo updates, SSE streaming hooks
- Services (`src/services/*.ts`)
  - `projectService` / `requirementService` / `componentService` etc. use `apiService` and optional mock providers controlled by `VITE_ENABLE_MOCK`
- Utilities
  - `src/utils/apiService.ts` centralizes fetch logic, timeouts, and error handling; configure `VITE_API_BASE_URL` & `VITE_REQUEST_TIMEOUT`
  - `src/pages/EditorPage/services/CodeGenerationLoop` contains AgentScheduler + prompts + tool definitions mirroring backend `/neo` behaviour

### 4.4 Manual Verification Expectations
Whenever you touch UI logic:
1. Document the route(s) exercised (`/`, `/editor`, `/requirements`, `/technical`)
2. Mention which APIs were mocked or hit live
3. Record key flows (e.g., create/delete project, sync document, start code generation) and any regressions spotted

---

## 5. Messages Replayer CLI

- Location: `messages-replayer/`
- Purpose: replay `messages.log` verbatim or forward each recorded request to a live endpoint (OpenAI-compatible)
- Commands:
  ```bash
  cd messages-replayer
  npm install
  npm run parse               # summary only
  npm run replay              # reproduce log exactly
  npm run replay:live         # send to live endpoint (requires env below)
  ```
- Environment options: `MODEL_ENDPOINT`, `MODEL_API_KEY`, `MODEL_NAME`, `MODEL_TEMPERATURE`, `MODEL_TIMEOUT`, plus CLI flags (`--api-url`, `--api-key`, …)
- Outputs stored in `messages-replayer/output/`

---

## 6. Workflow Expectations for Claude Code

1. **Read AGENTS.md first** for a speedy reminder of conventions; this CLAUDE.md is the deep dive.
2. **Stay in package directories** (`code-agent-backend`, `fta-layout-design`, `messages-replayer`) when running commands. Always set `workdir` on shell calls.
3. **Follow the plan tool rules** (no single-step plans, update statuses as you progress).
4. **Use `rg`/`rg --files`** for searches. Prefer `npm` scripts over raw binaries (e.g., run `npm run lint` instead of `mwts check`).
5. **Never undo user changes** you didn't author (dirty worktree awareness). No destructive git commands like `reset --hard`.
6. **Add concise comments only when necessary** (e.g., complex logic). Default to clean TypeScript/JavaScript.
7. **Testing**: run relevant `npm run test` / `npm run cov` / manual steps when feasible. If you skip due to time or environment, state the reason and suggest follow-up.
8. **Environment variables**: document any new required keys in README/CLAUDE/AGENTS comments instead of hardcoding them.
9. **Before submitting**: summarize changes, mention tests executed (or not), and highlight next steps (e.g., “run `npm run cov` before merge”).

---

## 7. Quick Reference Tables

### 7.1 Key Scripts

| Location | Script | Description |
| --- | --- | --- |
| Backend | `npm run dev` | Midway dev server (ts-node, port 7001) |
| Backend | `npm run build` | Compiles to `dist/` |
| Backend | `npm run start` | Runs compiled output via `bootstrap.js` |
| Backend | `npm run lint` / `lint:fix` | mwts linting |
| Backend | `npm run prettier` | Repo-wide formatting |
| Backend | `npm run test` / `npm run cov` | Jest/Midway tests & coverage |
| Frontend | `npm run dev` | Vite dev server (5173) |
| Frontend | `npm run build` | Production bundle |
| Frontend | `npm run preview` | Preview production build |
| CLI | `npm run replay` | Reproduce log verbatim |
| CLI | `npm run replay:live` | Replay against live endpoint |

### 7.2 Important Paths

| Path | Use |
| --- | --- |
| `code-agent-backend/src/controller/design/` | REST endpoints for design docs, annotations, requirement docs, code-generation tasks |
| `code-agent-backend/src/service/design/` | Core business logic for design domain |
| `code-agent-backend/src/service/code-agent/design-dsl.ts` | DSL parsing, Redis helpers, PATH→PNG conversion |
| `code-agent-backend/src/service/neovate-code/` | SSE agent runtime implementation |
| `fta-layout-design/src/pages/EditorPage/` | Component detection UI and contexts |
| `fta-layout-design/src/contexts/ProjectContext.tsx` | Frontend state for projects/pages/docs |
| `messages-replayer/src/parser.js` | Log parsing logic |

---

## 8. Troubleshooting Checklist

- **Backend fails to boot**: verify Node version (must satisfy `20.19.5`), ensure Mongo/Redis endpoints reachable, and populate `MODEL_*` envs if requirement generation or `/neo` endpoint is hit.
- **MasterGo DSL import issues**: check `mastergo.baseUrl` & `token` in config, and confirm the design link resolves to `fileId` + `layerId` via `MasterGoService.extractIdsFromUrl`.
- **Bull queue not processing**: confirm Redis connection, ensure `files-cache` directory exists (Midway processor writes ZIPs there), and inspect `DesignCodeGenerationTaskService` logs.
- **Frontend hitting 4xx/5xx**: confirm `VITE_API_BASE_URL` in `.env` matches backend port, and whether `VITE_ENABLE_MOCK` needs toggling for offline work.
- **messages-replayer live mode fails**: double-check `MODEL_ENDPOINT`, `MODEL_API_KEY`, `MODEL_TIMEOUT`, and ensure endpoint speaks OpenAI-compatible JSON.

---

## 9. Contribution & Release Notes

- Follow repo commit practices (short imperative subjects, often Chinese, <72 chars). Keep backend/frontend changes in separate commits when possible.
- Document manual verification for UI work and `npm run cov` results for backend work.
- Clean up `files-cache/` and `run/*.json` before pushing branches (avoid leaking DSL or credential traces).
- When decorators or entity definitions change, regenerate Midway typings with `npx midway-bin dev --ts` if needed.

Happy shipping!
