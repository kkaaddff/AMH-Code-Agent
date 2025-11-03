# FTA - MasterGo-to-App 设计稿到代码转换平台

<div align="center">

![FTA Logo](https://img.shields.io/badge/FTA-MasterGo--to--App-blue?style=for-the-badge)
![React](https://img.shields.io/badge/React-18.2.0-blue?style=for-the-badge&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5.5.3-blue?style=for-the-badge&logo=typescript)
![Midway.js](https://img.shields.io/badge/Midway.js-3.11.15-green?style=for-the-badge&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-5.13.0-green?style=for-the-badge&logo=mongodb)

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

**🚀 企业级智能设计稿到代码转换平台**

提供从设计稿上传、需求分析、组件识别到代码生成的完整工作流，支持3D组件检视、智能组件识别、需求文档自动生成等高级功能。

</div>

## ✨ 核心特性

### 🎨 智能设计稿解析
- **多格式支持**: MasterGo、Sketch、Adobe XD等主流设计工具
- **智能组件识别**: AI驱动的组件边界检测和分类
- **实时预览**: DSL数据实时渲染和可视化

### 🔍 3D组件检视
- **Three.js集成**: 交互式3D组件层级可视化
- **深度展示**: 组件嵌套关系立体展示
- **材质渲染**: 实时纹理和材质映射

### 📋 需求文档生成
- **智能转换**: 设计稿到PRD的自动转换
- **模板化结构**: 标准化需求文档格式
- **版本控制**: 文档版本管理和变更追踪

### ⚡ 代码生成引擎
- **多框架支持**: React、Vue、Angular等主流框架
- **智能优化**: 自动代码优化和性能调优
- **实时预览**: 代码效果实时预览和调试

### 🤝 协作标注系统
- **实时协作**: 多人实时标注和评论
- **版本管理**: 标注历史和冲突检测
- **批量操作**: 高效的批量标注工具

## 🏗️ 项目架构

```
amh_code_agent/
├── fta-layout-design/          # React 18 + TypeScript 前端应用
│   ├── src/
│   │   ├── components/         # 核心UI组件
│   │   ├── pages/             # 页面组件
│   │   ├── contexts/          # Context状态管理
│   │   ├── hooks/             # 自定义Hook
│   │   ├── services/          # API服务层
│   │   ├── utils/             # 工具函数
│   │   └── types/             # TypeScript类型定义
│   └── package.json
├── code-agent-backend/         # Midway.js + TypeScript 后端服务
│   ├── src/
│   │   ├── controller/        # API控制器
│   │   ├── service/           # 业务服务
│   │   ├── entity/            # 数据实体
│   │   ├── dto/               # 数据传输对象
│   │   └── middleware/        # 中间件
│   ├── test/                  # 测试文件
│   └── package.json
├── .cursorrules               # 开发规范
├── CLAUDE.md                  # Claude Code指导文档
└── README.md                  # 本文件
```

## 🚀 快速开始

### 环境准备

- **Node.js**: 前端推荐18+，后端需16.18
- **数据库**: MongoDB 5.13+ + Redis 4.28+
- **包管理器**: npm 或 yarn

### 1. 克隆项目
```bash
git clone https://github.com/your-org/amh_code_agent.git
cd amh_code_agent
```

### 2. 后端服务启动
```bash
cd code-agent-backend
npm install
npm run dev
```
后端服务将在 http://localhost:7001 启动

### 3. 前端应用启动
```bash
cd fta-layout-design
npm install
npm run dev
```
前端应用将在 http://localhost:5173 启动

### 4. 访问应用
- 🌐 **前端应用**: http://localhost:5173
- 🔌 **后端API**: http://localhost:7001
- 📚 **API文档**: http://localhost:7001/swagger-ui/index.html

## 🛠️ 技术栈

### 前端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.2.0 | 核心UI框架 |
| TypeScript | 5.5.3 | 类型安全 |
| Vite | 5.4.0 | 构建工具 |
| Ant Design | 5.12.0 | UI组件库 |
| Zustand | 4.5.2 | 状态管理 |
| React Flow | 11.11.4 | 流程图组件 |
| Three.js | 0.180.0 | 3D渲染 |
| Lexical | 0.35.0 | 文本编辑器 |

### 后端技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| Midway.js | 3.11.15 | Node.js框架 |
| TypeScript | 4.9.4 | 类型安全 |
| MongoDB | 5.13.0 | 主数据库 |
| Mongoose | + Typegoose | ODM |
| Redis | 4.28.5 | 缓存 |
| Bull | 4.10.0 | 任务队列 |
| Jest | 29.1.2 | 测试框架 |

## 📖 核心功能模块

### 🏠 首页仪表板
- 项目统计面板（项目数、组件数、团队数）
- 快速操作入口
- 项目列表和资产管理

### 🔍 组件识别编辑器
- 三栏布局：组件树、画布预览、属性面板
- Three.js 3D组件检视
- 智能组件识别和多选操作
- 交互引导和帮助系统

### 📝 需求理解页面
- 需求理解能力展示
- 技术选型说明
- 业务逻辑和交互流程分析

### 🏗️ 技术架构页面
- 系统架构组件详解
- 技术栈展示和说明
- 实现方案和最佳实践

## 🎯 API接口

### 设计稿管理
```http
GET    /design/list                    # 获取设计稿列表
POST   /design/create                  # 创建设计稿
PUT    /design/:id                     # 更新设计稿
GET    /design/:id                     # 获取设计稿详情
```

### 需求文档
```http
POST   /design/:id/requirement-docs    # 生成需求文档
GET    /design/:id/requirement-docs    # 获取需求文档
PUT    /design/:id/requirement-docs    # 更新需求文档
```

### 组件标注
```http
GET    /design/:id/annotations         # 获取组件标注
POST   /design/:id/annotations         # 保存组件标注
PUT    /design/:id/annotations/:aid    # 更新组件标注
```

### 代码生成
```http
POST   /design/:id/code-generation     # 提交代码生成任务
GET    /design/:id/code-generation     # 获取生成状态
GET    /design/:id/code-generation/download # 下载生成结果
```

## 🔧 开发指南

### 前端开发

```bash
cd fta-layout-design

# 安装依赖
npm install

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 类型检查
npx tsc --noEmit

# 代码格式化
npm run format
```

### 后端开发

```bash
cd code-agent-backend

# 安装依赖
npm install

# 开发模式
npm run dev

# 构建项目
npm run build

# 生产环境启动
npm start

# 代码质量检查
npm run lint
npm run lint:fix

# 运行测试
npm test
npm run cov
```

## 🧪 测试

### 前端测试
```bash
cd fta-layout-design
npm test                 # 运行测试
npm run test:coverage    # 测试覆盖率
```

### 后端测试
```bash
cd code-agent-backend
npm test                 # 运行单元测试
npm run cov              # 测试覆盖率报告
```

## 📊 性能优化

### 前端优化策略
- **组件级优化**: React.memo + 自定义比较函数
- **渲染优化**: 虚拟滚动、条件渲染、懒加载
- **状态管理**: Zustand + use-context-selector
- **代码分割**: 路由级和组件级代码分割

### 后端优化策略
- **缓存机制**: Redis多层缓存
- **数据库优化**: 索引优化、查询调优
- **异步处理**: Bull队列系统
- **连接池**: 数据库连接池管理

## 🐛 故障排查

### 常见问题

**Q: 前端构建失败**
```bash
# 检查TypeScript类型错误
npx tsc --noEmit

# 清理依赖重新安装
rm -rf node_modules package-lock.json
npm install
```

**Q: 后端启动失败**
```bash
# 检查Node.js版本
node --version  # 需16.18

# 检查数据库连接
mongo --host 10.13.67.90 --port 27017
redis-cli ping
```

**Q: API调用失败**
- 检查CORS配置
- 确认认证Token传递
- 查看后端日志错误信息

## 🤝 贡献指南

我们欢迎所有形式的贡献！

### 提交规范
遵循Angular Commit格式，使用中文描述：

```
<type>(<scope>): <subject>

<body>
```

**类型说明：**
- `feat` - 新功能
- `fix` - 修复bug
- `docs` - 文档更新
- `refactor` - 代码重构
- `style` - 代码格式调整
- `test` - 测试相关
- `chore` - 构建/工具配置

### 开发流程
1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'feat(组件): 新增3D检视功能'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。

## 🙏 致谢

感谢所有为这个项目做出贡献的开发者和设计师！

## 📞 联系我们

- 📧 **邮箱**: dev-team@company.com
- 💬 **讨论**: [GitHub Discussions](https://github.com/your-org/amh_code_agent/discussions)
- 🐛 **问题反馈**: [GitHub Issues](https://github.com/your-org/amh_code_agent/issues)

---

<div align="center">

**[⬆ 回到顶部](#fta---MasterGo-to-app-设计稿到代码转换平台)**

Made with ❤️ by FTA Team

</div>