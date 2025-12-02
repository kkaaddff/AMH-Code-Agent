# FTA 后端服务 (code-agent-backend)

<div align="center">

![Midway.js](https://img.shields.io/badge/Midway.js-3.11.15-green?style=for-the-badge&logo=node.js)
![TypeScript](https://img.shields.io/badge/TypeScript-4.9.4-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-5.13.0-green?style=for-the-badge&logo=mongodb)
![Redis](https://img.shields.io/badge/Redis-4.28.5-red?style=for-the-badge&logo=redis)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen.svg)](https://github.com/your-org/amh_code_agent/actions)
[![Coverage](https://img.shields.io/badge/coverage-90%25-green.svg)](https://github.com/your-org/amh_code_agent/actions)

**🚀 企业级设计稿到代码转换平台后端服务**

基于 Midway.js + TypeScript 的现代化 Node.js 后端服务，提供设计稿管理、需求文档生成、组件标注、代码生成等核心 API 服务。

</div>

## 📋 目录

- [项目概述](#-项目概述)
- [核心功能](#-核心功能)
- [技术栈](#-技术栈)
- [项目结构](#-项目结构)
- [快速开始](#-快速开始)
- [开发指南](#-开发指南)
- [API 文档](#-api文档)
- [数据模型](#-数据模型)
- [中间件](#-中间件)
- [任务队列](#-任务队列)
- [测试](#-测试)
- [部署](#-部署)

## 🎯 项目概述

FTA 后端服务是整个设计稿到代码转换平台的核心 API 服务，基于 Midway.js 框架构建，采用 IoC 容器架构设计。服务提供设计稿管理、需求文档生成、组件标注、代码生成任务等完整的后端功能支持。

## ✨ 核心功能

### 📁 设计稿管理

- **CRUD 操作**: 设计稿的创建、查询、更新、删除
- **DSL 数据存储**: 版本化 DSL 数据存储和管理
- **缓存机制**: Redis 多层缓存提升性能
- **文件处理**: 设计稿文件上传和处理

### 📝 需求文档生成

- **智能生成**: 基于设计稿自动生成需求规格文档
- **多格式导出**: 支持 Markdown、PDF 等格式
- **版本控制**: 文档状态管理和版本追踪
- **模板引擎**: 可配置的文档模板系统

### 🏷️ 组件标注管理

- **标注存储**: 组件标注信息的持久化存储
- **版本对比**: 标注版本差异对比功能
- **树形结构**: 支持层级化的标注组织
- **协作支持**: 多用户标注协作

### ⚡ 代码生成任务

- **异步处理**: 基于 Bull 队列的异步代码生成
- **任务跟踪**: 实时任务状态和进度跟踪
- **结果管理**: 生成结果文件打包和下载
- **错误处理**: 完善的错误重试和恢复机制

### 🏢 项目管理

- **项目 CRUD**: 项目和页面的完整生命周期管理
- **权限控制**: 基于角色的访问控制
- **文档同步**: 设计稿文档状态同步
- **内容管理**: 项目内容和元数据管理

## 🛠️ 技术栈

### 核心框架

| 技术       | 版本    | 说明                  |
| ---------- | ------- | --------------------- |
| Midway.js  | 3.11.15 | Node.js 企业级框架    |
| TypeScript | 4.9.4   | 类型安全的 JavaScript |
| Egg.js     | 2.37.0  | 底层 Web 框架         |
| Node.js    | 16.18   | 运行时环境            |

### 数据存储

| 技术       | 版本        | 说明         |
| ---------- | ----------- | ------------ |
| MongoDB    | 5.13.0      | 主数据库     |
| Mongoose   | + Typegoose | ODM 框架     |
| Redis      | 4.28.5      | 缓存数据库   |
| 阿里云 OSS | 文件存储    | 对象存储服务 |

### 任务队列

| 技术           | 版本     | 说明            |
| -------------- | -------- | --------------- |
| Bull           | 4.10.0   | 任务队列系统    |
| @midwayjs/bull | 队列集成 | Midway 队列集成 |

### 测试监控

| 技术           | 版本     | 说明            |
| -------------- | -------- | --------------- |
| Jest           | 29.1.2   | 测试框架        |
| OpenTelemetry  | 链路追踪 | 分布式追踪      |
| @midwayjs/mock | 测试工具 | Midway 测试工具 |

## 📁 项目结构

```
code-agent-backend/
├── src/
│   ├── controller/              # 控制器层
│   │   ├── design.ts           # 设计稿控制器
│   │   ├── project.ts          # 项目控制器
│   │   └── ...                 # 其他控制器
│   ├── service/                # 业务服务层
│   │   ├── designService.ts    # 设计稿服务
│   │   ├── projectService.ts   # 项目服务
│   │   └── ...                 # 其他服务
│   ├── entity/                 # 数据实体
│   │   ├── designDocument.ts   # 设计稿实体
│   │   ├── project.ts          # 项目实体
│   │   └── ...                 # 其他实体
│   ├── dto/                    # 数据传输对象
│   │   ├── design.ts           # 设计稿DTO
│   │   ├── project.ts          # 项目DTO
│   │   └── ...                 # 其他DTO
│   ├── middleware/             # 中间件
│   │   ├── auth.ts             # 认证中间件
│   │   ├── cors.ts             # 跨域中间件
│   │   └── ...                 # 其他中间件
│   ├── config/                 # 配置文件
│   │   ├── config.default.ts   # 默认配置
│   │   ├── config.prod.ts      # 生产配置
│   │   └── ...                 # 其他配置
│   ├── utils/                  # 工具函数
│   │   ├── crypto.ts           # 加密工具
│   │   ├── logger.ts           # 日志工具
│   │   └── ...                 # 其他工具
│   ├── interface/              # 接口定义
│   │   ├── context.ts          # 上下文接口
│   │   └── ...                 # 其他接口
│   ├── schedule/               # 定时任务
│   │   └── cleanup.ts          # 清理任务
│   ├── lifecycle.ts            # 生命周期
│   └── configuration.ts        # 配置入口
├── test/                       # 测试文件
│   ├── controller/             # 控制器测试
│   ├── service/                # 服务测试
│   └── ...                     # 其他测试
├── bootstrap.js                # 启动入口
├── package.json                # 项目依赖
├── tsconfig.json               # TypeScript配置
├── jest.config.js              # Jest测试配置
└── README.md                   # 本文件
```

## 🚀 快速开始

### 环境要求

- Node.js 16.18
- MongoDB 5.13+
- Redis 4.28+

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

服务将在 http://localhost:7001 启动

### 构建项目

```bash
npm run build
```

### 生产环境启动

```bash
npm start
```

### 构建并启动

```bash
npm run start_build
```

## 🔧 开发指南

### 代码质量检查

```bash
# ESLint检查
npm run lint

# 自动修复
npm run lint:fix

# 代码格式化
npm run prettier
```

### 运行测试

```bash
# 运行所有测试
npm test

# 测试覆盖率
npm run cov

# 监听模式
npm run test:watch
```

### 开发调试

```bash
# 调试模式启动
npm run debug

# 查看详细日志
DEBUG=* npm run dev
```

## 📚 API 文档

### 设计稿管理 API

#### 获取设计稿列表

```http
GET /design/list
```

**响应示例**:

```json
{
  "code": 200,
  "data": {
    "list": [
      {
        "id": "64f1a2b3c4d5e6f7g8h9i0j1",
        "name": "首页设计稿",
        "description": "产品首页设计稿",
        "createdAt": "2023-09-01T10:00:00Z",
        "updatedAt": "2023-09-01T10:00:00Z"
      }
    ],
    "total": 1,
    "page": 1,
    "pageSize": 10
  }
}
```

#### 创建设计稿

```http
POST /design/create
Content-Type: application/json

{
  "name": "新设计稿",
  "description": "设计稿描述",
  "dslData": {
    "styles": {},
    "nodes": []
  }
}
```

#### 更新设计稿

```http
PUT /design/:id
Content-Type: application/json

{
  "name": "更新的设计稿",
  "description": "更新的描述",
  "dslData": {
    "styles": {},
    "nodes": []
  }
}
```

### 需求文档 API

#### 生成需求文档

```http
POST /design/:designId/requirement-docs
Content-Type: application/json

{
  "template": "standard",
  "format": "markdown",
  "options": {
    "includeImages": true,
    "includeAnnotations": true
  }
}
```

#### 获取需求文档

```http
GET /design/:designId/requirement-docs
```

### 组件标注 API

#### 保存组件标注

```http
POST /design/:designId/annotations
Content-Type: application/json

{
  "componentId": "comp_001",
  "annotations": [
    {
      "type": "description",
      "content": "这是一个按钮组件",
      "position": { "x": 100, "y": 200 }
    }
  ],
  "version": 1
}
```

#### 获取组件标注

```http
GET /design/:designId/annotations?componentId=comp_001&version=1
```

### 代码生成 API

#### 提交代码生成任务

```http
POST /design/:designId/code-generation
Content-Type: application/json

{
  "framework": "react",
  "language": "typescript",
  "options": {
    "includeTests": true,
    "includeStories": false,
    "outputFormat": "component"
  }
}
```

#### 查询任务状态

```http
GET /design/:designId/code-generation/:taskId
```

#### 下载生成结果

```http
GET /design/:designId/code-generation/:taskId/download
```

### 项目管理 API

#### 获取项目列表

```http
GET /code-agent/project/list?page=1&pageSize=10
```

#### 创建项目

```http
POST /code-agent/project/create
Content-Type: application/json

{
  "name": "新项目",
  "description": "项目描述",
  "type": "web"
}
```

#### 创建页面

```http
POST /code-agent/project/page/create
Content-Type: application/json

{
  "projectId": "proj_001",
  "name": "首页",
  "description": "网站首页"
}
```

## 🗄️ 数据模型

### DesignDocumentEntity - 设计稿文档

```typescript
@Entity('design_documents')
export class DesignDocumentEntity {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  dslData: DSLData;

  @Column()
  version: number;

  @Column()
  status: 'draft' | 'published' | 'archived';

  @Column()
  createdBy: string;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
```

### ProjectEntity - 项目实体

```typescript
@Entity('projects')
export class ProjectEntity {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  type: 'web' | 'mobile' | 'desktop';

  @Column()
  status: 'active' | 'inactive' | 'archived';

  @Column()
  members: ProjectMember[];

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
```

### RequirementDocumentEntity - 需求文档实体

```typescript
@Entity('requirement_documents')
export class RequirementDocumentEntity {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  designId: ObjectId;

  @Column()
  title: string;

  @Column()
  content: string;

  @Column()
  format: 'markdown' | 'pdf' | 'docx';

  @Column()
  status: 'draft' | 'published' | 'archived';

  @Column()
  version: number;

  @Column()
  createdAt: Date;

  @Column()
  updatedAt: Date;
}
```

## 🔌 中间件

### 认证中间件

```typescript
@Middleware()
export class AuthMiddleware {
  @Inject()
  ctx: Context;

  resolve() {
    return async (err?: Error) => {
      const token = this.ctx.get('SonicToken') || this.ctx.get('FTAToken');

      if (!token) {
        throw new ForbiddenError('未提供认证令牌');
      }

      try {
        const user = await this.verifyToken(token);
        this.ctx.user = user;
      } catch (error) {
        throw new ForbiddenError('认证令牌无效');
      }
    };
  }
}
```

### CORS 中间件

```typescript
@Middleware()
export class CorsMiddleware {
  resolve() {
    return async (err?: Error) => {
      this.ctx.set('Access-Control-Allow-Origin', this.ctx.get('Origin') || '*');
      this.ctx.set('Access-Control-Allow-Headers', 'Content-Type, SonicToken, FTAToken');
      this.ctx.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
      this.ctx.set('Access-Control-Allow-Credentials', 'true');
    };
  }
}
```

### 错误处理中间件

```typescript
@Middleware()
export class ErrorHandlerMiddleware {
  resolve() {
    return async (err: Error, ctx: Context) => {
      const status = err.status || 500;
      const message = err.message || '服务器内部错误';

      ctx.status = status;
      ctx.body = {
        code: status,
        message: message,
        data: null,
        timestamp: new Date().toISOString(),
      };

      // 记录错误日志
      ctx.logger.error(err);
    };
  }
}
```

## ⚙️ 任务队列

### 代码生成任务

```typescript
@Provide()
@Queue()
export class CodeGenerationQueue {
  @QueueProcess()
  async generateCode(job: Job) {
    const { designId, options } = job.data;

    try {
      // 更新任务状态
      await this.updateTaskStatus(job.id, 'processing');

      // 执行代码生成
      const result = await this.performCodeGeneration(designId, options);

      // 更新任务完成状态
      await this.updateTaskStatus(job.id, 'completed', result);

      return result;
    } catch (error) {
      // 更新任务失败状态
      await this.updateTaskStatus(job.id, 'failed', { error: error.message });
      throw error;
    }
  }

  private async performCodeGeneration(designId: string, options: any) {
    // 代码生成逻辑
    const designDoc = await this.designService.findById(designId);
    const code = await this.codeGenerator.generate(designDoc.dslData, options);

    // 打包代码文件
    const packageInfo = await this.packageCode(code, options);

    return packageInfo;
  }
}
```

### 文档生成任务

```typescript
@Provide()
@Queue()
export class DocumentGenerationQueue {
  @QueueProcess()
  async generateDocument(job: Job) {
    const { designId, template, format } = job.data;

    try {
      await this.updateTaskStatus(job.id, 'processing');

      const designDoc = await this.designService.findById(designId);
      const document = await this.documentGenerator.generate(designDoc.dslData, template, format);

      await this.updateTaskStatus(job.id, 'completed', document);
      return document;
    } catch (error) {
      await this.updateTaskStatus(job.id, 'failed', { error: error.message });
      throw error;
    }
  }
}
```

## 🧪 测试

### 单元测试示例

```typescript
import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';

describe('test/controller/design.test.ts', () => {
  let app: Application;

  beforeAll(async () => {
    app = await createApp<Framework>();
  });

  afterAll(async () => {
    await close(app);
  });

  it('should POST /design/create', async () => {
    const result = await createHttpRequest(app)
      .post('/design/create')
      .send({
        name: '测试设计稿',
        description: '这是一个测试设计稿',
        dslData: { styles: {}, nodes: [] },
      });

    expect(result.status).toBe(200);
    expect(result.body.code).toBe(200);
    expect(result.body.data.name).toBe('测试设计稿');
  });

  it('should GET /design/list', async () => {
    const result = await createHttpRequest(app).get('/design/list');

    expect(result.status).toBe(200);
    expect(result.body.code).toBe(200);
    expect(Array.isArray(result.body.data.list)).toBe(true);
  });
});
```

### 集成测试示例

```typescript
import { createApp, close, createHttpRequest } from '@midwayjs/mock';
import { Framework } from '@midwayjs/koa';

describe('test/integration/design-flow.test.ts', () => {
  let app: Application;
  let designId: string;

  beforeAll(async () => {
    app = await createApp<Framework>();

    // 创建测试设计稿
    const createResult = await createHttpRequest(app)
      .post('/design/create')
      .send({
        name: '流程测试设计稿',
        dslData: { styles: {}, nodes: [] },
      });

    designId = createResult.body.data.id;
  });

  afterAll(async () => {
    await close(app);
  });

  it('should complete full design workflow', async () => {
    // 1. 获取设计稿详情
    const getResult = await createHttpRequest(app).get(`/design/${designId}`);
    expect(getResult.status).toBe(200);

    // 2. 更新设计稿
    const updateResult = await createHttpRequest(app).put(`/design/${designId}`).send({
      name: '更新的设计稿',
    });
    expect(updateResult.status).toBe(200);

    // 3. 生成需求文档
    const docResult = await createHttpRequest(app).post(`/design/${designId}/requirement-docs`).send({
      template: 'standard',
      format: 'markdown',
    });
    expect(docResult.status).toBe(200);

    // 4. 提交代码生成任务
    const codeResult = await createHttpRequest(app).post(`/design/${designId}/code-generation`).send({
      framework: 'react',
      language: 'typescript',
    });
    expect(codeResult.status).toBe(200);
  });
});
```

## 🚀 部署

### Docker 部署

```dockerfile
FROM node:16.18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 7001

CMD ["npm", "start"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - '7001:7001'
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/fta
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:5.13
    volumes:
      - mongo_data:/data/db
    ports:
      - '27017:27017'

  redis:
    image: redis:4.28-alpine
    volumes:
      - redis_data:/data
    ports:
      - '6379:6379'

volumes:
  mongo_data:
  redis_data:
```

### 环境变量配置

```bash
# .env.production
NODE_ENV=production
PORT=7001

# 数据库配置
MONGODB_URI=mongodb://localhost:27017/fta
REDIS_URL=redis://localhost:6379

# 认证配置
JWT_SECRET=your-jwt-secret
TOKEN_EXPIRES_IN=7d

# 文件存储配置
OSS_REGION=oss-cn-hangzhou
OSS_BUCKET=fta-bucket
OSS_ACCESS_KEY_ID=your-access-key
OSS_ACCESS_KEY_SECRET=your-secret

# 日志配置
LOG_LEVEL=info
LOG_FILE_PATH=/var/log/fta/app.log
```

## 📊 性能监控

### 链路追踪

```typescript
import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('fta-backend');

export class DesignService {
  async getDesignList() {
    const span = tracer.startSpan('design.getDesignList');

    try {
      // 业务逻辑
      const result = await this.designRepository.find();
      span.setAttributes({
        'design.count': result.length,
        'design.duration': Date.now() - startTime,
      });
      return result;
    } catch (error) {
      span.recordException(error);
      throw error;
    } finally {
      span.end();
    }
  }
}
```

### 性能指标

```typescript
import { Meter } from '@opentelemetry/api';

const meter = Meter.getMeter('fta-backend');

const requestCounter = meter.createCounter('http_requests_total', {
  description: 'Total number of HTTP requests',
});

const responseTimeHistogram = meter.createHistogram('http_response_time', {
  description: 'HTTP response time in milliseconds',
});

// 在中间件中使用
@Middleware()
export class MetricsMiddleware {
  resolve() {
    return async (err?: Error) => {
      const startTime = Date.now();

      this.ctx.res.on('finish', () => {
        const duration = Date.now() - startTime;

        requestCounter.add(1, {
          method: this.ctx.method,
          route: this.ctx.path,
          status: this.ctx.status,
        });

        responseTimeHistogram.record(duration, {
          method: this.ctx.method,
          route: this.ctx.path,
        });
      });
    };
  }
}
```

## 🔧 开发规范

### 代码风格

- **TypeScript 装饰器风格**: 使用@Provide、@Inject 等装饰器
- **MWTS 规范**: 遵循 Midway TypeScript Style 规范
- **分层架构**: 控制器、服务、实体分层
- **DTO 验证**: 严格的参数类型验证

### 控制器规范

```typescript
@Controller('/api/design')
export class DesignController {
  @Inject()
  designService: DesignService;

  @Post('/create')
  async createDesign(@Body() createDto: CreateDesignDto) {
    try {
      const result = await this.designService.create(createDto);
      return {
        code: 200,
        message: '创建成功',
        data: result,
      };
    } catch (error) {
      throw new BadRequestError(error.message);
    }
  }
}
```

### 服务层规范

```typescript
@Provide()
export class DesignService {
  @InjectEntityModel(DesignDocumentEntity)
  designModel: ReturnModelType<typeof DesignDocumentEntity>;

  async create(createDto: CreateDesignDto): Promise<DesignDocumentEntity> {
    const design = new this.designModel(createDto);
    return await design.save();
  }

  async findById(id: string): Promise<DesignDocumentEntity> {
    const design = await this.designModel.findById(id);
    if (!design) {
      throw new NotFoundError('设计稿不存在');
    }
    return design;
  }
}
```

### 提交信息规范

```
<type>(<scope>): <subject>

<body>

<footer>
```

**示例**:

```
feat(API): 新增代码生成任务管理接口

- 新增代码生成任务提交和状态查询接口
- 集成Bull队列处理异步任务
- 添加任务结果打包和下载功能

Closes #123
```

## 🤝 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交更改 (`git commit -m 'feat(API): 新增xxx接口'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 创建 Pull Request

## 📞 联系方式

- **开发团队**: dev-team@company.com
- **问题反馈**: [GitHub Issues](https://github.com/your-org/amh_code_agent/issues)
- **API 文档**: http://localhost:7001/swagger-ui/index.html (开发环境)

---

<div align="center">

**[⬆ 回到顶部](#fta-后端服务-code-agent-backend)**

Made with ❤️ by FTA Backend Team

</div>
