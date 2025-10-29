# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个企业级的设计稿到代码转换平台（FTA - Figma-to-App），包含两个核心项目：

1. **fta-layout-design** - React 18 + TypeScript 前端应用
2. **code-agent-backend** - Midway.js + TypeScript 后端服务

平台提供从设计稿上传、需求分析、组件识别到代码生成的完整工作流，支持3D组件检视、智能组件识别、需求文档自动生成等高级功能。

## 项目结构

```
amh_code_agent/
├── fta-layout-design/          # React 前端应用
│   ├── src/
│   │   ├── components/         # 核心组件
│   │   ├── pages/             # 页面组件
│   │   ├── contexts/          # Context 状态管理
│   │   ├── types/             # TypeScript 类型定义
│   │   ├── utils/             # 工具函数
│   │   ├── hooks/             # 自定义 Hook
│   │   ├── services/          # API 服务层
│   │   ├── config/            # 配置文件
│   │   └── demo/              # 示例数据
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
├── code-agent-backend/         # Midway.js 后端服务
│   ├── src/
│   │   ├── controller/        # 控制器
│   │   ├── service/           # 业务服务
│   │   ├── entity/            # 数据实体
│   │   ├── dto/               # 数据传输对象
│   │   ├── middleware/        # 中间件
│   │   └── config/            # 配置文件
│   ├── test/                  # 测试文件
│   ├── package.json
│   └── bootstrap.js
├── .cursorrules               # 开发规范和指导原则
└── CLAUDE.md                  # 本文件
```

## 开发环境命令

### 前端开发 (fta-layout-design)

```bash
# 进入前端目录
cd fta-layout-design

# 安装依赖
npm install

# 启动开发服务器（热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
npx tsc --noEmit
```

### 后端开发 (code-agent-backend)

```bash
# 进入后端目录
cd code-agent-backend

# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build

# 启动生产服务器
npm start

# 构建并启动
npm run start_build

# 代码质量检查
npm run lint
npm run lint:fix

# 代码格式化
npm run prettier

# 运行测试
npm test
npm run cov
```

## 技术栈详解

### 前端技术栈

**核心框架：**
- React 18.2.0 + TypeScript 5.5.3
- Vite 5.4.0 (构建工具)
- React Router DOM v7.9.1 (路由)
- Ant Design 5.12.0 (UI组件库)

**状态管理：**
- Zustand 4.5.2 (全局状态)
- React Context (组件级状态)
- use-context-selector (性能优化)

**核心功能库：**
- @dagrejs/dagre (图形布局)
- React Flow 11.11.4 (流程图)
- Three.js 0.180.0 (3D渲染)
- Lexical 0.35.0 (文本编辑)

**开发工具：**
- ESLint 9.8.0 (代码检查)
- PostCSS 8.4.41 (CSS处理)

### 后端技术栈

**核心框架：**
- Midway.js v3.11.15 (IoC容器框架)
- TypeScript 4.9.4
- Egg.js v2.37.0 (底层Web框架)

**数据存储：**
- MongoDB v5.13.0 (主数据库)
- Mongoose + Typegoose (ODM)
- Redis v4.28.5 (缓存)
- 阿里云 OSS (文件存储)

**任务队列：**
- Bull v4.10.0 (任务队列)
- @midwayjs/bull (队列集成)

**测试和监控：**
- Jest v29.1.2 (测试框架)
- OpenTelemetry (链路追踪)

## 核心功能模块

### 前端页面功能

#### 1. **HomePage** - 项目管理首页
- 项目统计面板（项目数、组件数、团队数）
- 快速操作入口（创建项目、上传组件、查看统计）
- 项目列表和资产管理标签页

#### 2. **RequirementPage** - 需求理解页面
- 需求理解能力展示
- 技术选型说明
- 业务逻辑和交互流程分析

#### 3. **TechnicalPage** - 技术架构页面
- 系统架构组件详解
- 技术栈展示和说明
- 实现方案和最佳实践

#### 4. **EditorPage** - 编辑器核心页面

**EditorPageComponentDetectV2** - 组件识别编辑器：
- 三栏布局：组件树、画布预览、属性面板
- Three.js 3D组件检视功能
- 智能组件识别和多选操作
- 交互引导覆盖层
- 需求文档自动生成

**EditorPageLayout** - 布局编辑器：
- DSL数据到组件树映射
- 实时预览和编辑功能
- 节点选择和悬停同步
- 缩放和布局调整

### 核心组件架构

#### 1. **DSLElement** (`src/components/DSLElement.tsx`)
- 支持6种DSL节点类型：FRAME、TEXT、PATH、LAYER、INSTANCE、GROUP
- React.memo性能优化，自定义比较函数
- 样式解析和实时渲染
- 选择和悬停交互支持

#### 2. **LayoutTree** (`src/components/LayoutTree.tsx`)
- 可展开/收缩树形结构
- 节点选择和悬停高亮
- 动态节点宽度调整
- 虚拟滚动支持

#### 3. **LayoutPreview** (`src/components/LayoutPreview.tsx`)
- DSL数据可视化预览
- 缩放和交互功能
- 与组件树实时同步

#### 4. **Component3DInspectModal** - 3D检视组件
- Three.js集成的3D可视化
- 组件层级深度展示
- 交互式3D操作

### 后端API模块

#### 1. **设计稿管理** (`/design`)
- 创建、查询、更新设计稿文档
- DSL数据存储和版本管理
- 设计稿缓存机制

#### 2. **需求文档生成** (`/design/:designId/requirement-docs`)
- 基于设计稿生成需求规格文档
- 支持Markdown、PDF等导出格式
- 文档状态管理（draft/published/archived）

#### 3. **组件标注** (`/design/:designId/annotations`)
- 保存和获取组件标注信息
- 版本控制和对比功能
- 标注树结构存储

#### 4. **代码生成任务** (`/design/:designId/code-generation`)
- 异步代码生成任务提交
- 任务状态跟踪
- 结果文件打包下载

#### 5. **项目管理** (`/code-agent/project`)
- 项目和页面CRUD操作
- 文档状态同步
- 内容管理

### 状态管理架构

#### 前端Context层级

1. **ProjectContext** - 项目级状态管理
   - 项目列表和当前项目状态
   - 页面管理和文档上传
   - 设计稿同步和处理

2. **SelectionContext** - 选择状态管理
   - 选中和悬停节点ID管理
   - 全局选择状态同步

3. **EditContext** - 编辑状态管理
   - 编辑模式（none、resize、move、draw）
   - 新建框和节点操作
   - 布局变化监听

4. **ComponentDetectionContextV2** - 组件识别上下文
   - 高级组件识别状态管理
   - 多选支持和标注管理
   - Zustand + use-context-selector优化

#### 后端数据模型

1. **DesignDocumentEntity** - 设计稿文档实体
2. **DesignRequirementDocumentEntity** - 需求文档实体
3. **DesignComponentAnnotationEntity** - 组件标注实体
4. **DesignCodeGenerationTaskEntity** - 代码生成任务实体

## API集成架构

### 前后端API映射

| 前端调用 | 后端端点 | 功能 |
|---------|----------|------|
| `api.project.list` | `GET /code-agent/project/list` | 获取项目列表 |
| `api.project.create` | `POST /code-agent/project/create` | 创建项目 |
| `api.project.page.create` | `POST /code-agent/project/page/create` | 创建页面 |
| `api.project.document.sync` | `POST /code-agent/project/document/sync` | 同步文档 |

### 认证和权限

**Token传递：**
- 支持 `FTAToken` 和 `SonicToken` 两种认证方式
- 跨域配置支持认证传递
- 用户身份识别：jobNum、jobId、id、x-operator-id、x-user-id

**CORS配置：**
```typescript
config.cors = {
  credentials: true,
  allowHeaders: ['Content-Type', 'SonicToken', 'FTAToken', 'x-page-url', 'Yu1'],
  origin: 动态来源控制
}
```

## 开发规范

### 代码风格

**前端：**
- TypeScript严格模式
- React函数组件(.tsx)
- Prettier格式化（2空格缩进，120字符行宽）
- 组件命名：PascalCase
- 变量/函数命名：camelCase
- 优先使用路径别名

**后端：**
- TypeScript装饰器风格
- MWTS（Midway TypeScript Style）规范
- 控制器、服务、实体分层架构
- DTO类型验证

### 提交信息规范

遵循Angular Commit格式，使用中文描述：

```
<type>(<scope>): <subject>

<body>
```

**类型：**
- `feat` - 新功能
- `fix` - 修复bug
- `docs` - 文档更新
- `refactor` - 代码重构
- `style` - 代码格式调整
- `test` - 测试相关
- `chore` - 构建/工具配置

**示例：**
```
feat(组件检测): 新增3D检视功能与相关依赖

- 新增 Component3DInspectModal 组件,提供 Three.js 3D层级可视化
- 集成 html2canvas 用于组件纹理生成和Three.js材质映射
- 在 ComponentDetectionContextV2 中添加 3D 检视状态管理
```

## 重要开发注意事项

### 前端开发要点

1. **消息API使用：** 必须使用 `App.useApp()` hook获取antd消息函数
   ```typescript
   // ✅ 正确
   const { message } = App.useApp();
   message.success('Success');

   // ❌ 错误
   import { message } from 'antd';
   message.success('Success');
   ```

2. **性能优化：**
   - DSLElement使用React.memo + 自定义比较函数
   - 悬停事件50ms节流处理
   - 样式计算使用useMemo缓存
   - 事件处理函数使用useCallback缓存

3. **Bundle优化：** 当前主包1.3MB+，考虑代码分割

### 后端开发要点

1. **环境要求：** Node.js 16.18
2. **数据库：** MongoDB + Redis
3. **配置管理：** 环境变量 + Lion配置中心
4. **异步任务：** 使用Bull队列处理耗时操作

### 测试策略

**前端：** 当前未配置测试框架（建议Vitest + React Testing Library）

**后端：**
- Jest + ts-jest测试框架
- @midwayjs/mock集成测试支持
- 覆盖率报告：`npm run cov`

## 部署和运维

### 环境配置

**开发环境：**
- 前端：Vite开发服务器（HMR）
- 后端：本地开发服务器（端口7001）
- 数据库：本地MongoDB + Redis

**生产环境：**
- 前端：静态文件部署（CDN/Nginx）
- 后端：Node.js集群部署
- 数据库：MongoDB集群 + Redis集群
- 文件存储：阿里云OSS

### 监控和日志

- **日志管理：** 统一日志格式，分级记录
- **链路追踪：** OpenTelemetry + Jaeger
- **性能监控：** 响应时间、错误率、吞吐量

## 特色技术亮点

### 1. **3D组件检视**
- Three.js集成的交互式3D可视化
- 组件层级深度关系展示
- 材质和纹理实时渲染

### 2. **智能组件识别**
- AI驱动的组件边界识别
- 置信度评估和人工确认
- 多选和批量操作支持

### 3. **需求文档自动生成**
- 设计稿到PRD的智能转换
- 模板化文档结构
- 版本控制和变更追踪

### 4. **实时协作标注**
- 多人实时标注支持
- 标注版本管理
- 冲突检测和合并

### 5. **异步任务处理**
- Bull队列系统
- 任务状态实时跟踪
- 失败重试和错误恢复

## 性能优化策略

### 前端优化

1. **组件级优化：**
   - React.memo + 自定义比较函数
   - useMemo缓存计算结果
   - useCallback缓存事件处理

2. **渲染优化：**
   - 虚拟滚动大列表
   - 条件渲染和懒加载
   - 批量状态更新

3. **数据管理优化：**
   - 增量更新DSL数据
   - Zustand状态管理优化
   - 资源按需加载

### 后端优化

1. **缓存策略：**
   - Redis多层缓存
   - 缓存键版本控制
   - TTL自动过期管理

2. **数据库优化：**
   - 索引优化
   - 查询性能调优
   - 连接池管理

3. **任务优化：**
   - 异步队列处理
   - 任务优先级管理
   - 失败重试机制

## 故障排查指南

### 常见问题

1. **前端构建失败**
   - 检查TypeScript类型错误
   - 确认依赖版本兼容性
   - 清理node_modules重新安装

2. **后端启动失败**
   - 检查Node.js版本（需16.18）
   - 确认MongoDB和Redis连接
   - 检查环境变量配置

3. **API调用失败**
   - 检查CORS配置
   - 确认认证Token传递
   - 查看后端日志错误信息

4. **组件渲染异常**
   - 检查DSL数据格式
   - 确认Context状态正确
   - 查看控制台错误信息

### 调试技巧

1. **前端调试：**
   - React DevTools组件状态检查
   - Redux DevTools状态追踪
   - Network面板API调用监控

2. **后端调试：**
   - Midway调试模式启动
   - MongoDB查询日志分析
   - Redis缓存状态检查

## 快速开始指南

### 1. 环境准备
```bash
# 确保Node.js版本
node --version  # 前端推荐18+，后端需16.18

# 确保数据库服务运行
# MongoDB: 10.13.67.90:27017 (开发环境)
# Redis: 本地Redis服务
```

### 2. 启动开发环境
```bash
# 启动后端服务
cd code-agent-backend
npm install
npm run dev

# 启动前端服务（新终端）
cd fta-layout-design
npm install
npm run dev
```

### 3. 访问应用
- 前端应用：http://localhost:5173
- 后端API：http://localhost:7001
- API文档：http://localhost:7001/swagger-ui/index.html (开发环境)

### 4. 验证功能
1. 访问首页，查看项目统计
2. 创建新项目并上传设计稿
3. 进入编辑器，体验组件识别
4. 使用3D检视功能
5. 生成需求文档

这个平台展现了现代全栈开发的最佳实践，集成了React、TypeScript、Three.js、Midway.js等先进技术，提供了完整的设计稿到代码转换解决方案。


