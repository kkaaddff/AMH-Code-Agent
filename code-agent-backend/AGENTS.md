# Repository Guidelines

## Project Structure & Module Organization

The service is built on Midway 3. TypeScript sources live in `src/`, where controllers expose HTTP endpoints, services coordinate domain logic, listeners handle async tasks, and `middleware/` hosts cross-cutting concerns. Shared contracts sit in `dto/`, `interface/`, and `types.ts`; `utils/` keeps reusable helpers. Environment-specific settings are defined in `src/config/*.ts`, while production bundles compile to `dist/`. Tests reside under `test/`, mirroring the `src/controller` layout. Operational scripts (`bootstrap.js`, `start.sh`) sit at the repository root.

## Build, Test, and Development Commands

- `npm run dev`: Launches a hot-reloading Midway dev server with local configuration.
- `npm run build`: Compiles TypeScript to `dist/` via `midway-bin`.
- `npm start`: Boots the compiled server through `bootstrap.js`; use after `build`.
- `npm run start_build`: Builds and immediately starts the production bundle.
- `npm test`: Executes the Midway/Jest suite in TypeScript mode.
- `npm run cov`: Generates coverage reports for CI; prefer before merging.
- `npm run lint` / `lint:fix`: Runs MWTS lint checks, optionally applying fixes.

## Coding Style & Naming Conventions

Write new code in TypeScript with module resolution aligned to `tsconfig.json`. Follow MWTS defaults (two-space indentation, trailing semicolons, single quotes) and rely on `npm run lint` to enforce them. Keep files named in kebab-case (e.g., `doctor.service.ts`) and export classes or functions with descriptive PascalCase names. Place shared constants in `constant.ts` and configuration tokens under `src/config/`.

## Testing Guidelines

Tests use Jest through `midway-bin test`; locate spec files as `*.test.ts` under `test/` with parity to the implementation module path. Prefer Midway's mocking utilities for dependency isolation. Maintain or improve coverage by running `npm run cov`; investigate any drop below the current baseline before opening a PR.

## Commit & Pull Request Guidelines

Commit history follows Conventional Commits (`type(scope): summary`). Match that pattern, keeping summaries under 72 characters and using English descriptions. For pull requests, include a concise change overview, linked issue IDs, deployment or migration notes, and screenshots or API samples when relevant. Confirm lint, test, and coverage commands locally, and mention any configuration changes (for example, updates to `src/config/*.ts` or environment variables).

## Security & Configuration Tips

Secrets and environment-specific credentials belong in runtime configuration, not source. Review `src/config/config.local.ts` and related files before committing to avoid leaking developer overrides. When instrumenting telemetry (`@opentelemetry/*` packages), prefer environment variables over hard-coded endpoints.
