# 项目概览
FTA DSL 布局设计器是一套 React + Vite 应用，用于将 FTA（Figma-to-App）转换流程中的 DSL 数据解析为可视化布局。产品覆盖需求梳理、技术说明到布局编辑的多页体验，并提供交互式三栏编辑器（组件树、画布预览、属性面板）帮助设计人员快速验证导出的 DSL。

## 核心功能
- 解析并渲染 DSL `styles` 与 `nodes`，支持 FRAME、TEXT、LAYER、PATH、INSTANCE、GROUP 等节点类型。
- Layout Editor 中的画布预览支持实时选中、高亮、网格/边框开关、多选合并以及虚拟容器生成等能力。
- 组件检测页提供增强的多选、3D 层级可视化和中间节点操作，辅助梳理复杂层级。
- 引入项目管理弹窗、文档状态演示等配套模块，覆盖从设计稿导入到代码生成的完整流程展示。

## 代码结构
- `src/App.tsx` 与 `src/main.tsx` 构成应用入口，通过 React Router 组织多页导航。
- `src/pages/EditorPage/` 内含布局编辑与组件检测子页面，伴随 `components/、contexts/、utils/` 等子目录封装编辑器相关逻辑。
- `src/components/DSLElement*.tsx` 负责按节点类型渲染 DSL 元素，并通过 memo 与定制比对优化性能。
- `src/contexts` 内部使用 Zustand 及 `use-context-selector` 管理选中状态、编辑模式和项目信息，避免深层传参。
- 公共工具与类型定义集中在 `src/utils`、`src/types`，演示数据位于 `src/demo`。

## 状态与交互
- Selection、Edit、Project 等上下文将树与画布的交互串联，事件通过节流和 memo 优化性能。
- DSL 渲染层对样式、字体、边框、Flex 布局等进行解析映射，CanvasInteractionLayer/EditableCanvasLayer 负责交互覆盖层。
- 组件检测 V2 上下文提供 3D 检视、虚拟容器、批量操作等高级能力。

## 开发与构建
- Node 18+，依赖管理使用 `npm install`。
- `npm run dev` 启动 Vite HMR 开发服务器，`npm run build` 执行 `tsc` 严格类型检查并产出到 `dist/`，`npm run preview` 用于本地验收优化包。
- 项目尚未集成测试框架，推荐后续引入 Vitest + React Testing Library 并将测试文件与实现同目录放置。

## 代码风格
- TypeScript + React 18 函数组件，保持 2 空格缩进与 Prettier 120 字符宽度。
- 组件/类型使用 PascalCase，工具函数用 camelCase，常量使用 UPPER_SNAKE_CASE。
- 优先使用别名导入：`@` 指向 `src`，还包含 `components`、`hooks`、`utils` 等别名。
- 注释仅在提供架构背景或复杂逻辑时补充。

## 文档与协作
- 设计/架构变更文档存放于 `docs/`。
- 依照 Conventional Commits + 中文主题（示例：`feat(LayoutEditor): 改进节点重排`），正文使用项目符号突出关键改动。
- PR 需自带概要、验证步骤（至少 `npm run build`）、关联 Issue 以及 UI 改动前后对比图。

## 扩展建议
- 引入单元测试覆盖 DSL 解析、Zustand hooks 与布局渲染分支。
- 关注 `dist/` 打包体积变化，必要时拆分异步路由或按需加载三方库。
- 后续可补充 ESLint 配置（当前缺失），并探索代码生成落地链路的自动化验证。

## 开发注意事项
- 使用 `antd` 的 `message` 函数时，必须使用 `App.useApp()` hook 方式调用，禁止使用静态函数
  - ✅ 正确：`const { message } = App.useApp(); message.success('成功');`
  - ❌ 错误：`import { message } from 'antd'; message.success('成功');`
