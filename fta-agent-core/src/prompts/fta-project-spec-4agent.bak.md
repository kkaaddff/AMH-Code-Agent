## Project Overview

This is an FTA (Enterprise Mobile Cross-Platform Framework) multi-platform demo application supporting:

- **Mini-programs**: WeApp, Alipay, TikTok
- **Web platforms**: MW (mobile web), H5
- **Native**: Thresh (cross-platform solution similar to React Native)

Built with React, TypeScript, and Taro framework for cross-platform development.

## Project Structure

### Core Architecture

- **Multi-platform support**: Uses Taro framework for cross-platform compilation
- **TypeScript**: Strict typing with path aliases (`@/*` maps to `./src/*`)
- **Component-based**: React functional components with hooks pattern
- **State management**: Redux for lightweight state management
- **Styling**: SCSS modules for component-specific styling

### Key Directories

- `src/pages/` - Application pages with platform-specific builds
- `src/components/` - Reusable UI components
- `src/api/` - API layer with platform-specific implementations (.mw.ts, .thresh.ts)
- `src/services/` - Business logic and request handling
- `src/hooks/` - Custom React hooks
- `src/data-source/` - Data fetching and management

### Platform-Specific Files

- `.mw.ts` - Mobile web specific implementations
- `.thresh.ts` - Thresh platform specific implementations
- `.weapp.scss` - WeChat mini-program specific styles

### Configuration Files

- `app.config.ts` - Taro app configuration with conditional demo pages
- `project.config.json` - Project configuration
- `babel.config.js` - Babel configuration for multiple platforms

## Development Patterns

### Page Structure

Each page follows this pattern:

```
src/pages/[page-name]/
├── index.tsx           # Main page component
├── index.config.ts     # Page-specific config
├── index.module.scss   # Page styles
├── components/         # Page-specific components
├── hooks/             # Page-specific hooks
└── service/           # Page-specific API calls
```

### API Layer

- Platform-specific implementations in `src/api/`
- Service abstractions in `src/services/`
- Request configuration with FTA plugins

### Component Organization

- Component-scoped styles using SCSS modules
- Hook-based logic separation
- TypeScript interfaces for props

## Important Notes

- **Demo pages**: Currently includes demo pages for development - remove before production deployment
- **Environment variables**: Uses `CODE_ENV` and `NODE_ENV` for environment-specific builds
- **Platform detection**: Uses `process.env.TARO_ENV` to detect current platform
- **Pre-commit hooks**: Runs code quality checks before commits
- **Multi-platform builds**: Each platform may have different bundle outputs and configurations
