# Repository Guide

## Monorepo Layout
- `code-agent-backend/` – Midway 3 + Egg web service (Node 20.19.5) that ingests MasterGo links, versions DSL + annotations, generates requirement docs through the model gateway, orchestrates Bull-based code generation tasks, and exposes project/DSL utilities plus the `/neo/send` streaming agent endpoint.
- `fta-layout-design/` – React 19 + TypeScript + Vite app that hosts the dashboard, requirement & technical overviews, and the component-detection editor (Valtio stores + Ant Design). Shared docs such as `docs/function-inventory.md` and `docs/refactor-opportunities.md` live here.
- `messages-replayer/` – Lightweight Node 18+ CLI that replays `messages.log` sessions and can re-send them to any OpenAI-compatible endpoint (uses `MODEL_*` env vars).
- Keep generated assets (`dist/`, `logs/`, `run/`, `files-cache/`, `output/`) untracked.

## Backend Service (`code-agent-backend/`)
- Entry: `bootstrap.js`/`start.sh`; dev server via `midway-bin dev --ts` on port 7001. Config lives in `src/config/*.ts`; runtime env comes from `.env` + Lion config center.
- Structure: controllers in `src/controller/` (`design/*`, `code-agent/*`, `neovate`), DTOs under `src/dto/`, entities in `src/entity/`, services split by domain (`design`, `code-agent`, `common`, `oss`, `neovate-code`), queues in `src/queue/`, utilities in `src/utils/`, shared types in `src/types/`.
- Domain flows:
  - **Design documents** (`DesignDocumentService`): pulls DSL + component document links with `MasterGoService`, snapshots DSL revisions, computes digests, and caches serialized DSL in Redis (`design:dsl:<id>[:revision]`).
  - **Component annotation** (`DesignComponentAnnotationService`): versioned tree stored in Mongo, cached in Redis (`design:annotations:*`) and diff-able via `diffAnnotations`.
  - **Requirement docs** (`DesignRequirementDocumentService` + `RequirementSpecModelService`): streams Markdown over SSE while `ModelGatewayService` talks to `MODEL_ENDPOINT`; falls back to non-stream generation and exports `.md` into `files-cache/design/requirement-docs/`.
  - **Code generation tasks**: `DesignCodeGenerationTaskService` owns task lifecycle/logs and dispatches Bull jobs to `src/queue/design/code-generation.processor.ts`, which currently assembles a README + optional requirement doc and writes a ZIP under `files-cache/design/codegen/`.
  - **Design DSL utilities** (`DesignDSLService`): reads `DesignDSL.json`, converts PATH nodes into PNG-backed LAYER nodes with `sharp`, persists assets in Mongo (`DesignPathAssetEntity`) and Redis, and exposes `/code-agent/dsl/*` plus Redis cache helpers.
  - **Project hub** (`ProjectService` + `controller/code-agent/project.ts`): CRUD for projects/pages, document reference syncing, MasterGo DSL pulls via `MasterGoServiceV1`, and document status tracking.
  - **Neovate agent** (`controller/neovate/index.ts`): SSE endpoint `/neo/send` that instantiates `service/neovate-code/*`, streams iteration/todo updates, and integrates plugins + tool calls configured via `MODEL_*` envs.
- Generated ZIPs/exports serve through `/filesCache/<key>`. Redis + Mongo credentials sit in `config.default.ts`; respect production hosts when testing locally.

## Frontend (`fta-layout-design/`)
- Requirements: Node 20.19.5, Vite 5, React 19 + Ant Design 5 (compact theme). Aliases defined in `vite.config.ts` (`@`, `components`, `hooks`, etc.).
- Key entry points: `src/main.tsx`, `src/App.tsx`, and config-driven routing in `src/config/routes.tsx`. Layout shell sits in `src/components/Layout.tsx`.
- Pages:
  - `src/pages/HomePage/` – overview dashboard with tabbed Project/Asset views, backed by `useProject()` (Valtio store) and the `/code-agent/project/*` API.
  - `src/pages/RequirementPage.tsx` & `TechnicalPage.tsx` – marketing/overview content for requirement analysis and technical stack.
  - `src/pages/EditorPage/EditorPageComponentDetect.tsx` – the main detection workspace containing the detection canvas, layer tree, annotation confirmation, property panel, PRD/OpenAPI panels, 3D inspector, and the code-generation drawer that streams updates from `AgentScheduler` or `SSEScheduler`.
- State management:
  - `src/contexts/ProjectContext.tsx` – canonical project/page/doc store with async actions delegated to `apiServices.project`.
  - `src/pages/EditorPage/contexts/*` – `EditorPageContext`, `DesignDetectionContext` (annotation tree, selection, DSL interactions), `DSLDataContext` (node visibility), and `CodeGenerationContext` (drawer, thought chain, todo syncing).
  - Component detection utilities (`src/pages/EditorPage/components/*` + `.../utils`) map DSL nodes to annotation nodes and persist versions through backend APIs.
- Services (`src/services/*.ts`) wrap `api.requirement`, `api.project`, etc., and can fall back to mock data through `VITE_ENABLE_MOCK`. `src/utils/apiService.ts` centralizes fetch logic and honours `VITE_API_BASE_URL` + timeout.
- Local documentation: `docs/function-inventory.md` (exhaustive function map) & `docs/refactor-opportunities.md` (tech debt log).

## Message Replayer (`messages-replayer/`)
- Parses `../messages.log`, replays sessions verbatim (`npm run replay`), or re-sends each `uid` bucket to a live endpoint with `npm run replay:live` (requires `MODEL_ENDPOINT`, `MODEL_API_KEY`, optional `MODEL_NAME`, `MODEL_TEMPERATURE`, `MODEL_TIMEOUT`). Parsed summaries available via `npm run parse`.
- Core files: `src/parser.js`, `src/replayer.js`, `src/llmClient.js`, `src/config.js`. Outputs live in `messages-replayer/output/`.

## Build & Test Commands
| Package | Install | Develop | Build/Start | Quality & Tests |
| --- | --- | --- | --- | --- |
| `code-agent-backend/` | `npm install` | `npm run dev` (hot reload) | `npm run build && npm start`, or `./start.sh <port>` | `npm run lint`, `npm run lint:fix`, `npm run prettier`, `npm run test`, `npm run cov` |
| `fta-layout-design/` | `npm install` | `npm run dev` | `npm run build`, `npm run preview` | (Add Vitest/RTL when touching logic; currently manual verification) |
| `messages-replayer/` | `npm install` | `npm run replay` (default) | N/A | N/A |

## Coding Expectations
- Backend: follow `mwts` (2 spaces, single quotes, decorators on separate lines, no dangling semicolons). Organize services/dtos/entities under matching folders and keep controller/service names aligned. Use `Provide`/`Scope` consistently and leverage `Config`, `InjectEntityModel`, and `InjectQueue` instead of manual wiring.
- Frontend: 2-space indentation, PascalCase components/contexts, camelCase hooks/utilities, constants in `UPPER_SNAKE_CASE`. Prefer derived state via selectors/memos, keep Valtio stores single-purpose, and reuse Ant Design tokens/components.
- Avoid cross-cutting edits that span backend + frontend + CLI in a single PR unless absolutely necessary.

## Testing & Verification
- Backend: place Jest/Midway specs under `test/<feature>/*.test.ts`, boot services with `@midwayjs/mock`, and exercise controller DTO validation. Run `npm run cov` before merging and explain any coverage deltas.
- Frontend: no automated suite today; when adding logic-heavy code, colocate Vitest + React Testing Library tests or document manual verification steps (UI flows exercised, API mocks used).
- CLI: smoke-test `npm run parse` and `npm run replay` after changing parser/replayer logic; for live mode, document which endpoint you pointed at.

## Configuration & Security
- Backend env: `MODEL_ENDPOINT`, `MODEL_API_KEY`, `MODEL_NAME`, `MODEL_TIMEOUT`, `MODEL_TEMPERATURE`, MasterGo token/URL (`src/config/config.default.ts`), Redis hosts, Mongo URIs, OSS credentials. Never hardcode secrets—pipe them through env or Lion configs. Inspect `files-cache/` and `run/*.json` before publish to ensure no sensitive data leaks.
- Frontend env: `VITE_API_BASE_URL`, `VITE_REQUEST_TIMEOUT`, optional `VITE_ENABLE_MOCK`. Treat them as build-time switches.
- Messages replayer env: reuse `MODEL_*` keys; CLI also supports `--api-url`, `--api-key`, etc.
- Generated zips/markdown are stored under `files-cache/` and served via `/filesCache/*`; clean up before committing.
