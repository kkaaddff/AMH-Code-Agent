# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development

- `npm run dev` - Start development server with hot-reload using Midway framework
- `npm run build` - Build the TypeScript project
- `npm start` - Start production server (runs bootstrap.js)
- `npm run start_build` - Build and start in one command

### Code Quality

- `npm run lint` - Run MWTS (Midway TypeScript Style) linter
- `npm run lint:fix` - Auto-fix linting issues
- `npm run prettier` - Format code using Prettier

### Testing

- `npm test` - Run Jest tests
- `npm run cov` - Run tests with coverage reports
- `npm run ci` - Run CI pipeline (coverage)

## Architecture Overview

This is a **Midway.js TypeScript server** for the FTA (Frontend Technology Architecture) infrastructure project. The server provides APIs and services for code analysis, quality reports, bundle analysis, and development tools.

### Core Framework Stack

- **Midway.js**: Main Node.js framework with IoC container and decorator support
- **TypeScript**: Primary language with strict typing
- **MongoDB + Mongoose**: Database layer with Typegoose ODM
- **Egg.js**: Underlying web framework (via @midwayjs/web)
- **Jest**: Testing framework

### Key Architectural Patterns

**Service Layer Architecture**: Controllers delegate to services for business logic

- Controllers (`src/controller/`) handle HTTP requests and parameter validation
- Services (`src/service/`) contain business logic and data access
- DTOs (`src/dto/`) define request/response interfaces
- Entities (`src/entity/`) define database models using Typegoose

**Middleware Stack** (in execution order):

1. FTATokenMiddleware - Token rewriting and cookie handling
2. FTASsoMiddleware - Single sign-on authentication
3. Cross-domain, static files, proxy, caching middlewares

**Module Organization by Domain**:

- `burying-point/` - Analytics and tracking
- `doctor/` - Code analysis and health checks
- `fta-usage/` - Usage metrics and code scanning
- `quality-report/` - Code quality reporting
- `bundle-info/` - Bundle analysis (via Perfsee integration)
- `gitlab/` - GitLab integration
- `material/` - Component and template management

### Database Schema

Uses MongoDB with Typegoose decorators. Entity relationships:

- Applications have associated quality reports
- Comments belong to applications with owner relationships
- Usage records track component/API usage patterns
- Doctor analysis results stored per project

### Configuration System

- Environment-specific configs in `src/config/config.{env}.ts`
- Lion configuration center integration (`@fta/server-middleware-lion`)
- Swagger documentation (local environment only)

## Development Notes

### File Structure Conventions

- Controllers use lowercase-hyphenated naming (e.g., `quality-report.ts`)
- Services mirror controller organization but may have deeper nesting
- DTOs split into `req.ts`, `res.ts`, and `common.ts` files
- Entities use domain grouping with index files for exports

### Code Analysis Features

This server specializes in analyzing frontend code:

- **ESLint Analysis**: Code quality and style checking
- **Bundle Analysis**: Webpack bundle optimization via Perfsee
- **Complexity Analysis**: Cyclomatic complexity and maintainability metrics
- **Duplication Detection**: Copy-paste detection (JSCPD integration)
- **Usage Tracking**: Component and API usage patterns

### External Integrations

- **Alipay**: Payment processing for premium features
- **GitLab**: Repository integration and webhook processing
- **OSS**: File storage for analysis results and caching
- **WeApp**: WeChat Mini Program development support
- **DMPT**: Internal deployment and monitoring platform

### Testing Approach

- Uses Jest with TypeScript preset
- Setup file: `jest.setup.js`
- Test files excluded from coverage: test fixtures and config
- Runs in Node.js environment

### Background Tasks

Uses `@midwayjs/task` for:

- Local tasks (immediate execution on server start)
- Queue-based processing for analysis jobs
- Warmup tasks for performance optimization
