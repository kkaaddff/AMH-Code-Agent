# Repository Guidelines

## Project Structure & Module Organization
- React 19 + Vite 5 app under `src/`; key areas: `pages/` (EditorPage, InternalProjectPage, Markdown/Technical/Requirement), `components/` (shared UI, modals, layout), `services/` (API wrappers), `contexts/` (Valtio/React state), `utils/` (API helpers, layout math, model gateway), `config/` (routes, API base), `styles/` (global + page-specific), `types/` (DSL, project, metrics). Assets live in `src/assets/`. Keep build output in `dist/` out of git.

## Build, Test, and Development Commands
- Node 20 required. From repo root with workspaces: `yarn workspace fta-layout-design dev` to start Vite dev server; inside this folder `npm run dev` also works.
- `yarn workspace fta-layout-design build` or `npm run build` compiles TypeScript then builds Vite bundle; `npm run build:dev` adds inline sourcemaps for debugging.
- `npm run preview` serves the built bundle locally.
- Vitest is available; run targeted checks via `npx vitest src/pages/EditorPage/utils/effectiveRect.test.ts` or `npx vitest` when adding logic.

## Coding Style & Naming Conventions
- TypeScript/TSX with functional components and hooks. Prefer 2-space indent, single quotes, and descriptive prop/state names; keep components small and colocate helpers.
- Follow existing patterns: routes in `src/config/routes.tsx`, API clients in `src/services/` using shared `apiService`, contexts in `src/pages/EditorPage/contexts/` for editor state.
- CSS modules or page-level CSS under `styles/`/`components/**/index.css`; avoid global leakage unless intentional.

## Testing Guidelines
- Place tests beside sources (e.g., `__tests__` or `.test.ts[x]` near utilities). Use Vitest/React Testing Library for logic/UI; keep names aligned with target module.
- When touching editor flows, manually verify InternalProjectPage binding, DSL load, detection canvas, and code-gen drawer. Note if mocks (`VITE_ENABLE_MOCK`) are used.

## Commit & Pull Request Guidelines
- Commits use Angular Conventional format in Chinese, imperative and concise (e.g., `feat(editor): 支持 PATH 节点转 PNG 后缓存`; common types: feat/fix/docs/refactor/chore/test/style/perf).
- PRs should summarize scope, link issues, list manual/automated checks, and attach UI screenshots for visual changes. Avoid committing `dist/`, logs, or temp caches.

## Security & Configuration Tips
- Configure env via `.env` or shell: `VITE_API_BASE_URL`, `VITE_REQUEST_TIMEOUT`, `VITE_ENABLE_MOCK`, optional `VITE_DEV_WORKSPACE_INFO`/`VITE_DEV_USER_INFO` for local binding. Do not leak backend tokens or generated assets.
