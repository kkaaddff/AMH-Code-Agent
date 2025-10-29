# Repository Guidelines

## Project Structure & Module Organization
Repo hosts `code-agent-backend/` (Midway TypeScript service) and `fta-layout-design/` (Vite + React UI). Backend boot runs through `bootstrap.js`/`start.sh`; routes sit in `src/controller/`, DTOs in `src/dto/`, domain logic in `src/service/` and `src/queue/`, data models in `src/entity/`, and shared helpers in `src/utils/` plus `src/types/`. Environment defaults and overrides live in `src/config/*.ts`; generated Midway typings land in `typings/`. Midway outputs router/timing data to `run/` and bundles to `dist/`. Frontend entry points are `src/main.tsx` and `src/App.tsx`; screens live in `src/pages/`, shared UI/state in `src/components/` and `src/contexts/`, API helpers in `src/services/`, and styling assets in `src/styles/`. Keep documentation in `docs/` and leave `logs/`/`dist/` untracked.

## Build, Test, and Development Commands
- Backend (Node 16.18): `npm install`; `npm run dev` for Midway (7001); `npm run build && npm start` or `./start.sh <port>` for production. Quality gates: `npm run lint`, `npm run lint:fix`, `npm run prettier`, `npm run test`, `npm run cov`.
- Frontend (Node 18+): `npm install`; `npm run dev`; `npm run build`; `npm run preview` to review the built assets.

## Coding Style & Naming Conventions
Backend follows `mwts`: 2-space indentation, single quotes, no dangling semicolons, and decorators each on their own line. Export named classes/functions per Midway conventions and mirror folder names when adding services or queues. Frontend modules keep 2-space indentation, prefer PascalCase for components and context providers, camelCase for hooks/utilities, and UPPER_SNAKE_CASE for constants. Respect the aliases defined in `vite.config.ts` (`@`, `components`, `hooks`, etc.) and run Prettier before staging changes.

## Testing Guidelines
Place backend specs under `test/<area>/*.test.ts`; use `@midwayjs/mock` and `jest.setup.js` for context scaffolding. Run `npm run cov` before merging and explain coverage drops. The frontend currently lacks automation—supply manual verification notes or add colocated Vitest + React Testing Library cases when extending UI logic.

## Commit & Pull Request Guidelines
History uses short imperative subjects (often Chinese); keep them under 72 characters, scope by package when helpful, and add rationale in the body. PRs should summarise the change, list validation (`npm run test`, `npm run build`, screenshots), link issues, and avoid bundling unrelated backend and frontend work.

## Configuration & Security Practices
Load secrets through environment variables and document required keys in config comments or PR notes instead of committing them. Review `run/*.json` for sensitive traces before pushing, coordinate OSS/Redis credential rotations with operations, regenerate typings via `npx midway-bin dev --ts` when decorators change, and delete stray `logs/` before publishing branches.
