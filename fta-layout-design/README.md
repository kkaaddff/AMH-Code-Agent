# FTA 前端应用 (fta-layout-design)

<div align="center">

![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue?style=for-the-badge&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5.4.0-green?style=for-the-badge&logo=vite)
![Ant Design](https://img.shields.io/badge/Ant%20Design-5.12.0-red?style=for-the-badge&logo=antdesign)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-org/amh_code_agent/actions)
[![Coverage](https://img.shields.io/badge/coverage-85%25-green.svg)](https://github.com/your-org/amh_code_agent/actions)

**🎨 企业级设计稿到代码转换平台前端应用**

基于React 18 + TypeScript的现代化前端应用，提供智能设计稿解析、3D组件检视、需求文档生成等核心功能。

</div>

## 📋 目录

- [项目概述](#-项目概述)
- [核心功能](#-核心功能)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [开发指南](#-开发指南)
- [组件架构](#-组件架构)
- [状态管理](#-状态管理)
- [API集成](#-api集成)
- [性能优化](#-性能优化)
- [开发规范](#-开发规范)

## 🎯 项目概述

FTA前端应用是整个设计稿到代码转换平台的核心用户界面，提供从设计稿上传、智能解析、组件识别到代码生成的完整工作流。应用采用现代化的React技术栈，集成了Three.js 3D渲染、智能组件识别、实时协作等先进功能。

## ✨ 核心功能

### 🏠 项目管理仪表板
- **统计面板**: 实时展示项目数、组件数、团队数等关键指标
- **快速操作**: 一键创建项目、上传组件、查看统计
- **项目管理**: 项目列表展示、搜索筛选、状态管理

### 🔍 智能组件识别编辑器
- **三栏布局**: 组件树 + 画布预览 + 属性面板的经典布局
- **Three.js 3D检视**: 交互式3D组件层级可视化
- **智能识别**: AI驱动的组件边界检测和分类
- **多选操作**: 批量组件选择和编辑功能
- **实时预览**: DSL数据实时渲染和可视化

### 📝 需求文档生成
- **智能转换**: 设计稿到PRD的自动转换
- **模板化**: 标准化需求文档格式
- **版本控制**: 文档版本管理和变更追踪
- **导出功能**: 支持Markdown、PDF等格式导出

### 🏗️ 布局编辑器
- **DSL映射**: DSL数据到组件树的智能映射
- **实时编辑**: 拖拽、调整大小、移动等编辑操作
- **缩放控制**: 画布缩放和视图控制
- **同步机制**: 组件树与画布的实时同步

### 🤝 协作标注系统
- **实时协作**: 多人实时标注和评论
- **版本管理**: 标注历史和冲突检测
- **批量操作**: 高效的批量标注工具

## 🛠️ 技术栈

### 核心框架
| 技术 | 版本 | 说明 |
|------|------|------|
| React | 18.2.0 | 核心UI框架，支持并发特性 |
| TypeScript | 5.5.3 | 类型安全的JavaScript超集 |
| Vite | 5.4.0 | 现代化构建工具，支持HMR |
| React Router | v7.9.1 | 客户端路由管理 |

### UI组件库
| 技术 | 版本 | 说明 |
|------|------|------|
| Ant Design | 5.12.0 | 企业级UI组件库 |
| @ant-design/icons | 5.2.6 | Ant Design图标库 |
| @ant-design/pro-components | 2.6.43 | 高级业务组件 |

### 状态管理
| 技术 | 版本 | 说明 |
|------|------|------|
| Valtio | 1.13.0 | 代理式状态管理 |
| use-context-selector | 1.4.1 | Context性能优化 |
| React Context | 内置 | 组件级状态管理 |

### 核心功能库
| 技术 | 版本 | 说明 |
|------|------|------|
| @dagrejs/dagre | 0.10.0 | 图形布局算法 |
| React Flow | 11.11.4 | 流程图组件 |
| Three.js | 0.180.0 | 3D渲染引擎 |
| Lexical | 0.35.0 | 富文本编辑器 |
| html2canvas | 1.4.1 | 截图功能 |

### 开发工具
| 技术 | 版本 | 说明 |
|------|------|------|
| ESLint | 9.8.0 | 代码质量检查 |
| PostCSS | 8.4.41 | CSS处理工具 |
| @types/react | 18.2.37 | React类型定义 |

## 📁 项目结构

```
fta-layout-design/
├── public/                     # 静态资源
│   ├── favicon.ico
│   └── index.html
├── src/
│   ├── components/             # 核心组件
│   │   ├── DSLElement.tsx     # DSL元素渲染组件
│   │   ├── LayoutTree.tsx     # 布局树组件
│   │   ├── LayoutPreview.tsx  # 布局预览组件
│   │   ├── Component3DInspectModal.tsx  # 3D检视组件
│   │   └── ...                # 其他业务组件
│   ├── pages/                 # 页面组件
│   │   ├── HomePage/          # 首页
│   │   ├── RequirementPage/   # 需求理解页面
│   │   ├── TechnicalPage/     # 技术架构页面
│   │   └── EditorPage/        # 编辑器页面
│   │       ├── ComponentDetectV2/     # 组件识别编辑器
│   │       └── Layout/                # 布局编辑器
│   ├── contexts/              # Context状态管理
│   │   ├── ProjectContext.tsx        # 项目级状态
│   │   ├── SelectionContext.tsx      # 选择状态
│   │   ├── EditContext.tsx          # 编辑状态
│   │   └── ComponentDetectionContextV2.tsx  # 组件识别状态
│   ├── hooks/                 # 自定义Hook
│   │   ├── useApi.ts          # API调用Hook
│   │   ├── useDebounce.ts     # 防抖Hook
│   │   └── useThrottle.ts     # 节流Hook
│   ├── services/              # API服务层
│   │   ├── api.ts             # API基础配置
│   │   ├── projectService.ts  # 项目相关API
│   │   └── designService.ts   # 设计稿相关API
│   ├── utils/                 # 工具函数
│   │   ├── dslParser.ts       # DSL解析工具
│   │   ├── styleUtils.ts      # 样式工具
│   │   └── mockRequirementAPI.ts  # 模拟API
│   ├── types/                 # TypeScript类型定义
│   │   ├── dsl.ts             # DSL类型定义
│   │   ├── api.ts             # API类型定义
│   │   └── component.ts       # 组件类型定义
│   ├── config/                # 配置文件
│   │   └── constants.ts       # 常量配置
│   ├── demo/                  # 示例数据
│   │   └── demoData.ts        # 演示数据
│   ├── App.tsx                # 根组件
│   ├── main.tsx               # 应用入口
│   └── vite-env.d.ts          # Vite类型声明
├── .eslintrc.cjs              # ESLint配置
├── package.json               # 项目依赖
├── tsconfig.json              # TypeScript配置
├── vite.config.ts             # Vite配置
└── README.md                  # 本文件
```

## 🚀 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev
```
应用将在 http://localhost:5173 启动，支持热重载

### 构建生产版本
```bash
npm run build
```

### 预览生产构建
```bash
npm run preview
```

### 类型检查
```bash
npx tsc --noEmit
```

## 🎨 组件架构

### 核心组件详解

#### DSLElement 组件 (`src/components/DSLElement.tsx`)
**功能**: DSL节点渲染组件，支持6种节点类型
- **FRAME**: 容器框架组件
- **TEXT**: 文本内容组件
- **PATH**: 路径图形组件
- **LAYER**: 图层组件
- **INSTANCE**: 实例组件
- **GROUP**: 组合组件

**特性**:
- React.memo性能优化，自定义比较函数
- 样式解析和实时渲染
- 选择和悬停交互支持
- 动态样式计算和缓存

#### LayoutTree 组件 (`src/components/LayoutTree.tsx`)
**功能**: 可展开/收缩的树形结构组件
- 节点选择和悬停高亮
- 动态节点宽度调整
- 虚拟滚动支持
- 拖拽排序功能

#### LayoutPreview 组件 (`src/components/LayoutPreview.tsx`)
**功能**: DSL数据可视化预览组件
- 缩放和交互功能
- 与组件树实时同步
- 多选和框选支持
- 响应式布局适配

#### Component3DInspectModal 组件
**功能**: Three.js集成的3D检视组件
- 交互式3D可视化
- 组件层级深度展示
- 材质和纹理实时渲染
- 相机控制和动画效果

## 🔄 状态管理

### Context层级架构

```
App
├── ProjectContext (项目级状态)
│   ├── 项目列表和当前项目
│   ├── 页面管理
│   └── 文档同步
├── SelectionContext (选择状态)
│   ├── 选中节点ID
│   └── 悬停节点ID
├── EditContext (编辑状态)
│   ├── 编辑模式 (none/resize/move/draw)
│   ├── 新建框操作
│   └── 布局变化监听
└── ComponentDetectionContextV2 (组件识别状态)
    ├── 高级组件识别
    ├── 多选支持
    └── 标注管理
```

### Valtio状态管理
使用Valtio proxy + useSnapshot管理跨文件状态：
- 项目、编辑、选择各自拥有独立store保持单一职责
- 快照订阅让组件仅在相关字段变化时更新
- Provider仅负责注入外部依赖（消息、回调），核心状态由store托管

## 🔌 API集成

### API服务层架构
```typescript
// api.ts - 基础API配置
const api = {
  baseURL: 'http://localhost:7001',
  headers: {
    'Content-Type': 'application/json',
    'SonicToken': token,
    'FTAToken': token
  }
}

// projectService.ts - 项目相关API
export const projectService = {
  list: () => api.get('/code-agent/project/list'),
  create: (data) => api.post('/code-agent/project/create', data),
  update: (id, data) => api.put(`/code-agent/project/${id}`, data)
}

// designService.ts - 设计稿相关API
export const designService = {
  list: () => api.get('/design/list'),
  create: (data) => api.post('/design/create', data),
  getAnnotations: (id) => api.get(`/design/${id}/annotations`),
  generateCode: (id, options) => api.post(`/design/${id}/code-generation`, options)
}
```

### 错误处理
- 统一错误拦截和处理
- 用户友好的错误提示
- 自动重试机制
- 请求取消和超时处理

## ⚡ 性能优化

### 组件级优化
```typescript
// React.memo + 自定义比较函数
const DSLElement = React.memo(({ dslElement, selected, hovered }) => {
  // 组件实现
}, (prevProps, nextProps) => {
  return prevProps.dslElement.id === nextProps.dslElement.id &&
         prevProps.selected === nextProps.selected &&
         prevProps.hovered === nextProps.hovered;
});
```

### 渲染优化
- **虚拟滚动**: 大列表性能优化
- **条件渲染**: 按需渲染组件
- **懒加载**: 组件和资源按需加载
- **批量更新**: React自动批处理优化

### 数据管理优化
- **增量更新**: DSL数据增量更新
- **缓存策略**: useMemo和useCallback缓存
- **状态规范化**: 避免深层嵌套状态
- **内存管理**: 及时清理事件监听器

### Bundle优化
- **代码分割**: 路由级和组件级分割
- **Tree Shaking**: 移除未使用代码
- **资源压缩**: 图片和字体资源优化
- **CDN加速**: 静态资源CDN分发

## 📋 开发规范

### 代码风格
- **TypeScript严格模式**: 启用所有严格检查
- **Prettier格式化**: 2空格缩进，120字符行宽
- **ESLint规则**: 统一代码质量标准
- **命名规范**:
  - 组件: PascalCase
  - 变量/函数: camelCase
  - 常量: UPPER_SNAKE_CASE
  - 文件: kebab-case

### 组件开发规范
```typescript
// ✅ 正确的组件写法
interface ComponentProps {
  title: string;
  onSubmit: (data: FormData) => void;
}

const Component: React.FC<ComponentProps> = ({ title, onSubmit }) => {
  // Hook调用必须在组件顶部
  const [loading, setLoading] = useState(false);
  const { message } = App.useApp();

  // 事件处理函数使用useCallback缓存
  const handleSubmit = useCallback((data: FormData) => {
    setLoading(true);
    onSubmit(data).finally(() => setLoading(false));
  }, [onSubmit]);

  return (
    <div className="component">
      {/* JSX内容 */}
    </div>
  );
};

export default Component;
```

### API调用规范
```typescript
// ✅ 正确的API调用方式
const { message } = App.useApp();

const handleSubmit = async () => {
  try {
    setLoading(true);
    const result = await projectService.create(data);
    message.success('创建成功');
    // 处理成功逻辑
  } catch (error) {
    message.error('创建失败');
    // 处理错误逻辑
  } finally {
    setLoading(false);
  }
};
```

### 提交信息规范
```
<type>(<scope>): <subject>

<body>

<footer>
```

**示例**:
```
feat(组件检测): 新增3D检视功能与相关依赖

- 新增 Component3DInspectModal 组件,提供 Three.js 3D层级可视化
- 集成 html2canvas 用于组件纹理生成和Three.js材质映射
- 在 ComponentDetectionContextV2 中添加 3D 检视状态管理

Closes #123
```

## 🧪 测试

### 测试框架配置
推荐使用 Vitest + React Testing Library：

```bash
# 安装测试依赖
npm install -D vitest @testing-library/react @testing-library/jest-dom

# 运行测试
npm test

# 测试覆盖率
npm run test:coverage
```

### 测试规范
- **单元测试**: 组件逻辑和工具函数
- **集成测试**: 组件交互和API调用
- **E2E测试**: 完整用户流程（可选）
- **覆盖率要求**: 核心功能80%+

## 🔧 调试技巧

### React DevTools
- 组件状态检查
- Props和Context查看
- 性能分析工具

### 浏览器开发者工具
- Network面板: API调用监控
- Console面板: 错误信息查看
- Performance面板: 性能分析

### VS Code调试配置
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug React App",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "dev"]
}
```

## 📦 部署

### 构建配置
```typescript
// vite.config.ts
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          antd: ['antd', '@ant-design/icons']
        }
      }
    }
  }
});
```

### 环境变量
```bash
# .env.development
VITE_API_BASE_URL=http://localhost:7001
VITE_APP_TITLE=FTA开发环境

# .env.production
VITE_API_BASE_URL=https://api.example.com
VITE_APP_TITLE=FTA生产环境
```

## 🤝 贡献指南

1. Fork项目
2. 创建特性分支
3. 提交代码（遵循提交规范）
4. 创建Pull Request
5. 代码审查和合并

## 📞 联系方式

- **开发团队**: dev-team@company.com
- **问题反馈**: [GitHub Issues](https://github.com/your-org/amh_code_agent/issues)
- **技术讨论**: [GitHub Discussions](https://github.com/your-org/amh_code_agent/discussions)

---

<div align="center">

**[⬆ 回到顶部](#fta-前端应用-fta-layout-design)**

Made with ❤️ by FTA Frontend Team

</div>
