# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a React-based design-to-code platform for FTA (Figma-to-App) conversion. The application features a multi-page architecture that guides users from design upload through requirement analysis to code generation, culminating in an interactive layout editor with component trees, preview areas, and property panels. The platform parses and renders design elements from FTA export data into web components.

## Common Development Commands

```bash
# Install dependencies
npm install

# Start development server (with HMR)
npm run dev

# Build for production (includes TypeScript compilation)
npm run build

# Preview production build
npm run preview

# Type checking (useful for catching issues without full build)
npx tsc --noEmit

# Lint code (ESLint v9+ needs config file - currently not configured)
# Note: ESLint configuration is missing - would need eslint.config.js for v9+

# Recommended Node version: 18+
```

## Code Style and Language

**All interactions should be in Chinese.** Follow established conventions:
- **Language**: TypeScript with React functional components (.tsx)
- **Formatting**: Prettier with 2-space indentation (print width 120)
- **Naming**: Components use `PascalCase`, variables/functions use `camelCase`
- **Imports**: Prefer path aliases (`@/utils/...`) over relative paths
- **Node version**: 18+ recommended
- **TypeScript**: Strict mode enabled, no unused locals/parameters

## Architecture Overview

### Project Structure
The project uses Vite path aliases for cleaner imports:
- `@/*` maps to `src/*`
- Additional aliases: `context`, `utils`, `config`, `components`, `types`, `hooks`, `app`, `workflow`

**Build Configuration:**
- TypeScript compilation via `tsc` before Vite build
- Path aliases configured in both `vite.config.ts` and `tsconfig.json`
- Strict TypeScript mode enabled with comprehensive type checking
- Build output directory: `dist/`

### Application Structure - Multi-Page Platform
- **App** (`src/App.tsx`): Root router component with React Router navigation between pages
- **Layout** (`src/components/Layout.tsx`): Shared layout wrapper with navigation header for all pages (including editor sub-pages)

### Page Components
- **HomePage** (`src/pages/HomePage.tsx`): Landing page with design upload and configuration options
- **RequirementPage** (`src/pages/RequirementPage.tsx`): Requirements analysis and platform capabilities overview
- **TechnicalPage** (`src/pages/TechnicalPage.tsx`): Technical architecture and implementation details
- **EditorPage** (`src/pages/EditorPage/`): Editor section with two sub-pages:
  - **EditorPageComponentDetect** (`src/pages/EditorPage/EditorPageComponentDetect.tsx`): Component detection interface
  - **EditorPageLayout** (`src/pages/EditorPage/EditorPageLayout.tsx`): Layout editing interface

### Routing Configuration
- **RouteConfig** (`src/config/routes.tsx`): Centralized routing configuration with nested editor routes
- Router types defined in `src/types/router.ts`
- Editor routes are nested under `/editor` with automatic redirection to component-detect

### Core Editor Components
- **LayoutEditor** (`src/components/LayoutEditor.tsx`): Main editor interface with three-panel layout (component tree, preview, properties)

### Core Components
- **DSLElement** (`src/components/DSLElement.tsx`): Performance-optimized rendering component for all DSL node types (FRAME, TEXT, PATH, LAYER, INSTANCE, GROUP) with React.memo and custom comparison
- **LayoutTree** (`src/components/LayoutTree.tsx`): Interactive component tree with expand/collapse, hover effects, and dynamic node width adjustment
- **LayoutPreview** (`src/components/LayoutPreview.tsx`): Scalable preview area for DSL content with selection/hover interaction
- **CanvasInteractionLayer** (`src/components/CanvasInteractionLayer.tsx`): Overlay for handling canvas interactions and edit mode functionality

### Context Management
- **SelectionContext** (`src/contexts/SelectionContext.tsx`): Manages selected and hovered node states across components
- **EditContext** (`src/contexts/EditContext.tsx`): Handles editing modes (draw mode, edit mode) and editing state
- **ProjectContext** (`src/contexts/ProjectContext.tsx`): Manages project-level state and configuration

### Key Utilities
- **styleUtils** (`src/utils/styleUtils.ts`): Parses colors, fonts, layout styles, flexbox configurations, border radius, and text styling from DSL data
- **nodeUtils** (`src/utils/nodeUtils.ts`): Node traversal and search functions for layout tree operations
- **nodeMapping** (`src/utils/nodeMapping.ts`): Creates bidirectional mapping between LayoutTree nodes and DSL nodes
- **debounce** (`src/utils/debounce.ts`): Throttling utilities for performance optimization of hover events

### Custom Hooks
- **useDSLData** (`src/hooks/useDSLData.ts`): Custom hook for loading and managing DSL data from demo JSON files

### Type System
- **dsl.ts** (`src/types/dsl.ts`): Complete TypeScript definitions for DSL data structure
- **layout.ts** (`src/types/layout.ts`): Layout tree node definitions and selection state interfaces

### Data Flow
The application uses two primary data structures:
1. **DSL Data** (`src/demo/DesignDSL.json`): FTA export format with styles and hierarchical nodes
2. **Layout Tree Data** (`src/demo/LayoutTree.json`): Component-oriented tree structure for the editor interface

Node mapping utilities create bidirectional relationships between these structures, enabling seamless interaction between the component tree and preview area.

## Technology Stack
- React 18 with TypeScript
- React Router DOM v7 for page routing
- Vite 5.4 build system with hot module replacement
- Ant Design 5.12+ component library
- CSS-in-JS styling approach
- SVG rendering for PATH elements
- Performance optimizations: React.memo, useMemo, useCallback, throttling
- Additional libraries:
  - @dagrejs/dagre for graph layouts
  - Lexical for text editing
  - React Flow for node-based interfaces
  - Zustand for state management
  - ahooks for React hooks utilities
  - lodash-es for utility functions
  - dayjs for date handling
  - Remixicons for icons
  - Three.js for 3D visualization and component inspection
  - html2canvas for capturing component renders as textures

## Application Flow
1. **Homepage** (`/`): Upload designs, configure output settings (platform, framework, component library)
2. **Requirements** (`/requirements`): Review platform capabilities and requirement analysis approach
3. **Technical** (`/technical`): Understand technical architecture and implementation approach
4. **Editor** (`/editor`): Interactive layout editing with two modes:
   - **Component Detection** (`/editor/component-detect`): Advanced component identification with 3D inspection, multi-select, and virtual container creation
   - **Layout Editor** (`/editor/layout`): Interactive layout editing with real-time preview and property editing

## Navigation Structure
- Unified header navigation for seamless page transitions
- Homepage initiates configuration flow leading to editor
- Requirements and Technical pages provide platform context
- Editor section has nested routing with automatic redirection to component-detect
- Both editor modes maintain the shared layout wrapper for consistent navigation

## Development Notes

### Performance Optimizations
- DSLElement uses React.memo with custom comparison function to prevent unnecessary re-renders
- Hover events are throttled (50ms) to reduce state update frequency
- Style calculations are memoized using useMemo
- Event handlers are cached with useCallback

### Node Rendering Logic
Each DSL node type has specialized rendering in DSLElement:
- **FRAME**: Flexbox containers with overflow control
- **TEXT**: Styled text with font parsing, color application, and text mode handling
- **LAYER**: Background images or solid fills with border radius support
- **PATH**: SVG path rendering with viewBox calculations
- **INSTANCE**: Component references with child rendering
- **GROUP**: Generic containers for grouping elements

### Editor Features
- Three-panel layout: component tree, preview area, property panel
- Real-time selection sync between tree and preview
- Hover highlighting with visual feedback
- Grid overlay toggle for alignment assistance
- Edit modes: normal view, draw mode for creating new elements
- Show/hide bounding boxes for all elements
- Intermediate hierarchy node detection and interaction
- **3D Component Inspection**: Interactive Three.js visualization of component hierarchy
- **Multi-select Operations**: Select and combine multiple DSL nodes and annotations
- **Virtual Container Creation**: Automatically generate container components for selected elements
- **Enhanced Annotation System**: V2 context with improved state management and sorting

### Key Development Notes
- **No test framework**: Currently no unit or integration tests configured (recommend Vitest + React Testing Library)
- **ESLint setup**: ESLint v9+ installed but configuration file missing - would need eslint.config.js
- **Build pipeline**: Uses `tsc && vite build` for TypeScript compilation before Vite build
- **Path aliases**: Multiple aliases configured in vite.config.ts beyond what's listed in tsconfig.json
- **Current branch**: `feat/designable-v2` with enhanced component detection and layout editing features
- **Best practices**: Edit existing files when possible, avoid creating unnecessary new files
- **Import organization**: External libraries first, then internal modules, maintain logical grouping
- **Build status**: Current codebase builds successfully without TypeScript errors

### Commit Message Guidelines
When making Git commits, follow Angular Commit Format with Chinese descriptions (max 50 words):
- **Format**: `<type>(<scope>): <subject>\n\n<body>`
- **Type**: `feat`(新功能), `fix`(修复), `docs`(文档), `refactor`(重构), `style`(格式), `test`(测试), `chore`(构建)
- **Scope**: Optional, use Chinese or English component/module names (e.g., `组件识别`, `LayoutEditor`)
- **Subject**: Concise Chinese summary of changes
- **Body**: Multi-line details with bullet points (`-`) listing specific changes
- **Example**:
  ```
  feat(组件检测): 新增3D检视功能与相关依赖

  - 新增 Component3DInspectModal 组件,提供 Three.js 3D层级可视化
  - 集成 html2canvas 用于组件纹理生成和Three.js材质映射
  - 在 ComponentDetectionContextV2 中添加 3D 检视状态管理
  - 优化纹理缓存机制,支持组件深度排序和标签显示
  ```

### Style Processing
FTA design tokens are converted to CSS properties through utility functions:
- Color references (`paint_*`) resolve to actual color values
- Font references resolve to font family, size, weight, and other typography properties
- Layout styles handle positioning, sizing, and transformation
- Flexbox configurations parse direction, alignment, gaps, and padding

### TypeScript Configuration
- Strict mode enabled with comprehensive type checking
- Path aliases configured in both `vite.config.ts` and `tsconfig.json`
- JSX support configured for React 18
- Custom route types in `src/types/router.ts` for type-safe routing

### Performance Considerations
- Build process includes TypeScript compilation (`tsc && vite build`)
- Hot module replacement enabled for development
- Bundle size warning: Main chunk is 1.3MB+ - consider code splitting
- No test framework currently configured - consider adding for production use
- ESLint v9+ installed but configuration missing - needs eslint.config.js

### Development Guidelines
- **Message API Usage**: Always use `App.useApp()` hook for antd message functions, never use static imports
  - ✅ **Correct**: `const { message } = App.useApp(); message.success('Success');`
  - ❌ **Incorrect**: `import { message } from 'antd'; message.success('Success');`

### Component Detection Context
- **ComponentDetectionContextV2** (`src/pages/EditorPage/contexts/ComponentDetectionContextV2.tsx`): Enhanced component identification and analysis state management with multi-select support
- **DetectionCanvas** (`src/pages/EditorPage/components/DetectionCanvas.tsx`): Canvas for component identification and intermediate node visualization
- **Component3DInspectModal** (`src/pages/EditorPage/components/Component3DInspectModal.tsx`): 3D visualization modal for component hierarchy inspection using Three.js
- **Intermediate Node Support**: Shows and allows interaction with hierarchy nodes between root and leaf elements
- **Multi-select Functionality**: Support for selecting multiple DSL nodes and annotations simultaneously
- **Virtual Container Creation**: Auto-generates virtual containers for grouping selected elements