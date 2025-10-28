# 设计稿协同与代码生成模块需求实现文档

本文档基于 `backend-requirements.md` 的结构与约定，细化设计稿协同与低代码生成模块（下称 **Design-to-Code 模块**）在 `fta-server` 项目中的落地方案，确保能够无缝融入现有 Midway + Mongo 架构，并支持多实例部署场景。

## 1. 背景与目标

- 为 FTA 团队提供设计稿解析、组件标注、需求文档沉淀与代码生成的一站式后端能力，支撑设计、研发、产品的协同流程。
- 保障 DSL/标注/文档/代码制品的可追溯性，形成统一数据域，利于后续指标与自动化治理。
- 面向多实例部署与 API 网关调度，强调任务幂等、缓存失效策略、权限校验与队列并发控制。

## 2. 系统架构概览

### 2.1 技术栈

- **运行环境**：Node.js 16.18、TypeScript、Midway 3（@midwayjs/web）。
- **数据存储**：MongoDB（@midwayjs/mongoose + @typegoose/typegoose）、Redis 缓存、OSS/本地缓存目录 `files-cache/` 保存大文件。
- **队列/异步**：新增 @midwayjs/bull@3（BullMQ）处理代码生成任务；现有 @midwayjs/task 保留原有调度。
- **鉴权链路**：复用 SSO 与 Token 中间件（`FTATokenMiddleware`、`FTASsoMiddleware`）。

### 2.2 模块分层

```
Controller（HTTP） → Service（业务编排） → Repository/Entity（Mongo 模型） → Queue Processor（Bull）
                                      ↘ Utility（DSL/Markdown/代码模板处理）
```

- `src/controller/design/`：设计稿、标注、需求文档、代码任务相关 REST 接口。
- `src/service/design/`：领域服务，串联实体、缓存、文件存储与队列。
- `src/entity/design/`：Typegoose 实体描述各集合结构。
- `src/queue/design/`：Bull 任务定义与处理器（代码生成、打包）。
- `src/utils/design/`：DSL 解析、Markdown 模板渲染、代码模板引擎。

### 2.3 部署与可用性

- 服务多实例运行于 K8s，统一通过 API 网关转发；所有写入操作需幂等设计，以 `designId`、`taskId` 等唯一键约束。
- Bull 队列使用 Redis 作为后端，要求配置哨兵或集群地址，确保任务在实例间共享。实例启动时注册处理器，避免重复消费。
- 文件制品统一上传至 OSS，再落地本地缓存目录；提供回源逻辑，避免单实例磁盘依赖。

## 3. 业务域与功能边界

### 3.1 设计稿管理（Designs）

- 新增/更新设计稿基础信息，保存 DSL 原始数据与上传文件元信息。
- 支持 DSL 冻结版本（`dslRevision`），便于回滚与比对；提供 DSL 读取接口。

### 3.2 组件标注（ComponentAnnotations）

- 记录遵循树结构的组件标注（根节点含子节点数组），支持版本号与展开状态保存。
- 提供幂等的保存/覆盖接口，以 `designId + version` 唯一标识；支持差异对比。

### 3.3 需求文档（RequirementDocuments）

- 基于设计稿与标注生成 Markdown 需求规格，支持手动编辑、状态流转（草稿 → 发布 → 归档）。
- 文档内容持久化于 Mongo，文件制品（如导出的 PDF/Markdown 文件）存至 OSS，字段存储下载链接。

### 3.4 代码生成（CodeGenerationTasks）

- 支持 React/Vue/Flutter 等多框架代码生成，任务入队后异步执行。
- 队列处理器需分阶段上报进度（解析 → 生成 → 优化 → 打包），任务完成后产出物打包为 ZIP 并提供下载链接。
- 失败任务记录错误堆栈，支持重试/补偿。

## 4. 数据模型（MongoDB + Typegoose）

| 集合名                         | 实体                              | 关键字段                                                                                                | 索引与约束                                                                                                                                | 说明                                                                  |
| ------------------------------ | --------------------------------- | ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `design_documents`             | `DesignDocumentEntity`            | `_id`(ObjectId)、`name`、`dslData`、`dslRevision`、`status`、`ossObjectKey`、`createdBy`                | `design_documents_name_idx`：`name`，`design_documents_creator_idx`：`createdBy`，`design_documents_status_idx`：`status`，TTL/软删除字段 | 存储设计稿元信息与 DSL JSON，`dslData` 采用 `Mixed`，必要时压缩存储。 |
| `design_component_annotations` | `DesignComponentAnnotationEntity` | `_id`、`designId`、`version`、`rootAnnotation`、`expandedKeys`、`createdBy`                             | 复合唯一索引 `(designId, version)`；`design_component_annotations_creator_idx`                                                            | 保存组件标注树，`rootAnnotation` 允许嵌套对象。                       |
| `design_requirement_documents` | `DesignRequirementDocumentEntity` | `_id`、`designId`、`title`、`content`、`status`、`ossObjectKey`、`createdBy`                            | 复合索引 `(designId, status)`，文本索引 `title`                                                                                           | Markdown 内容与导出文件路径。                                         |
| `design_code_generation_tasks` | `DesignCodeGenerationTaskEntity`  | `_id`、`designId`、`requirementDocId`、`taskType`、`status`、`progress`、`result`、`error`、`createdBy` | 复合索引 `(designId, status)`，单字段索引 `createdAt`                                                                                     | 任务进度、产出信息，`result` 含 `outputZipKey`、`fileMeta` 等。       |
| `design_task_logs`（可选）     | `DesignTaskLogEntity`             | `_id`、`taskId`、`message`、`createdAt`                                                                 | `taskId` 索引                                                                                                                             | 抽象为追加日志集合，便于追踪进度信息。亦可存储于 Redis Stream。       |

- 所有实体默认 `timestamps`，保留 `createdAt`/`updatedAt`。
- 对大字段（`dslData`、`rootAnnotation`、`content`）开启压缩（如 Snappy）或最少使用 `lean()` 避免冗余字段。
- 软删除通过 `status` 字段实现（`active`、`archived`、`deleted`），删除操作仅标记状态。

## 5. 接口设计

所有接口返回统一 `AsyncResponse<T>` 结构，需标注在 Swagger，并继承中间件鉴权。以下路径基于 `/design` 控制器命名空间：

### 5.1 设计稿管理

- `POST /design`：创建/上传设计稿。请求体含 `name`、`description`、`dslData` 或 `dslObjectKey`、`fileMeta`。返回创建的设计稿信息。
- `GET /design/{designId}`：查询设计稿基本信息。
- `GET /design/{designId}/dsl`：输出 DSL 数据（支持 `If-None-Match` 缓存、压缩）。
- `PUT /design/{designId}`：更新名称/描述/状态/文件元信息。
- `GET /design`：分页检索，支持 `status`、`createdBy`、`keyword`（模糊）过滤。

### 5.2 组件标注

- `POST /design/{designId}/annotations`：保存标注。请求参数支持 `version`（默认最新）与 `force` 控制并发写入。
- `GET /design/{designId}/annotations`：获取最新标注，支持 `version` 查询历史。
- `GET /design/{designId}/annotations/diff`：比较两个版本的差异（可返回节点新增/删除/变更列表）。

### 5.3 需求文档

- `POST /design/{designId}/requirement-docs/generate`：触发自动生成 Markdown（内部调用 DSL + 标注解析服务），返回草稿文档。
- `PUT /design/requirement-docs/{docId}`：更新标题/正文/状态；状态流转只允许 `draft→published→archived`。
- `GET /design/requirement-docs/{docId}`：获取文档详情。
- `GET /design/{designId}/requirement-docs`：分页列出当前设计的文档记录。
- `POST /design/requirement-docs/{docId}/export`：生成文件制品（如 Markdown/PDF），返回 OSS 下载链接。

### 5.4 代码生成任务

- `POST /design/{designId}/code-generation`：提交任务。请求体包含 `requirementDocId`、`taskType`、`options`（框架、UI 库、TS 支持等）。入队 Bull 队列，返回 `taskId`。
- `GET /design/code-generation-tasks/{taskId}`：查询任务状态与进度、日志片段。
- `POST /design/code-generation-tasks/{taskId}/retry`：重新入队失败任务（需权限）。
- `GET /design/code-generation-tasks/{taskId}/download`：返回打包文件的临时签名 URL。

### 5.5 辅助接口

- `GET /design/{designId}/analytics`：输出 DSL 节点统计、组件分布，为前端可视化提供数据。
- `GET /design/code-generation/options`：枚举可用框架、UI 预设、代码模板版本。

## 6. 核心业务流程

### 6.1 需求文档生成流程

1. Controller 校验 `designId` 与用户权限，调用 `DesignDocumentService.getDesignWithAnnotations` 获取 DSL + 标注。
2. Service 侧利用 `DesignDSLParser` 生成结构化数据（组件列表、交互、布局指标）。
3. `RequirementDocumentService` 加载 Markdown 模板（可存储在 `DesignTemplateRepository` 或文件系统），通过 `renderRequirementTemplate` 输出初稿。
4. 将 Markdown 内容入库（状态为 `draft`），必要时调用 `FileService` 生成预览 Markdown/PDF。
5. 返回文档信息；若生成失败，记录错误日志并保持幂等（重试时覆盖同一草稿）。

### 6.2 代码生成流程

1. Controller 校验 `designId`、`taskType` 与文档状态（至少为 `draft`），创建任务记录（`pending`）。
2. 将任务推入 Bull 队列 `design:code-generation`，消息体包含 `taskId`、`designId`、`options`。
3. Queue Processor（`DesignCodeGenerationProcessor`）分阶段执行：
   - 拉取 DSL、标注、需求文档，校验版本一致性。
   - 调用 `ComponentStructureBuilder` 生成组件树，阶段进度更新至 20%。
   - 根据 `taskType` 选择模板引擎（React/Vue/Flutter），生成代码文件集合并写入临时目录（进度 50%）。
   - 执行 `CodeQualityPipeline`（格式化、Lint、依赖注入），进度至 80%。
   - 压缩文件、上传 OSS，更新 `result.outputZipKey`、`result.fileCount`、`result.totalSize`，进度 100% → `completed`。
4. 若中途失败，设置 `status=failed`、`errorMessage`，并追加日志/指标。支持按照 `taskId` 重试，重试时清理上次的 `result`。

### 6.3 并发与幂等策略

- 创建设计稿/文档等写入接口需使用 `findOneAndUpdate({ _id }, { upsert: true })` 或服务层锁，避免重复插入。
- 队列任务使用 `jobId = taskId`，保证单任务只入队一次；重试时使用 Bull 内建的 `retry`。
- 多实例下的 Redis Key 采用命名空间前缀 `design:*`，并设置 TTL 避免缓存膨胀。

## 7. 队列与缓存策略

- **Bull 队列**：`design:code-generation`，并发度默认 2，可通过配置文件动态调整。队列连接参数放在 `src/config/config.default.ts` 中的 `bull` 节点，支持环境覆盖。
- **Redis 缓存**：
  - `design:dsl:{designId}:{revision}`：缓存 DSL JSON，便于高频读取。
  - `design:annotations:{designId}:{version}`：缓存标注树。
  - `design:code-task:{taskId}`：暂存实时进度与日志（可结合 Stream）。
- 缓存写入在更新实体后触发，需处理失效与低一致性场景。

## 8. 安全、权限与审计

- 接口默认要求登陆用户，继承现有 SSO 中间件，写操作需校验角色（设计、产品、研发）。
- 对于导出、下载接口执行操作日志记录（`DesignAuditService`），包含 `designId`、`taskId`、IP、UserAgent。
- OSS 下载链接需短期签名，避免直链泄露；任务日志仅对创建者与管理员可见。

## 9. 配置与环境变量

- `DESIGN_CODEGEN_QUEUE_CONCURRENCY`：队列并发度。
- `DESIGN_DEFAULT_TEMPLATE_VERSION`：默认模板版本号。
- `DESIGN_DSL_CACHE_TTL`、`DESIGN_ANNOTATION_CACHE_TTL`：缓存 TTL。
- `OSS_DESIGN_BUCKET`、`OSS_DESIGN_PREFIX`：设计模块在 OSS 中的 bucket/路径。
- 配置文件在 `src/config/config.*.ts` 中增量声明；严禁将环境凭证写入仓库。

## 10. 指标与监控

- 关键指标：任务耗时、成功率、平均文件大小、队列堆积数、标注写入失败率。
- 记录于日志 & OpenTelemetry，必要时对接报警机器人（利用现有订阅体系）。
- 设计稿和代码产出体积超过阈值时写入告警队列或发通知。

## 11. 里程碑与开发计划

### Phase 1：基础能力（1.5 周）

- [ ] 定义实体与迁移脚本（Mongo 集合、索引创建）。
- [ ] 实现设计稿 CRUD、DSL 下载、分页检索。
- [ ] 完成组件标注保存/查询，含缓存策略。

### Phase 2：文档生成（1 周）

- [ ] 搭建 DSL → Markdown 模板流水线，落地自动生成接口。
- [ ] 实现文档编辑/状态流转/导出。
- [ ] 增加单元测试覆盖解析与模板渲染。

### Phase 3：代码生成与队列（1.5 周）

- [ ] 引入 @midwayjs/bull，配置队列与处理器。
- [ ] 开发代码模板引擎、打包与下载能力。
- [ ] 补充任务重试、进度查询、监控埋点。

### Phase 4：集成与验收（0.5 周）

- [ ] 对接权限、审计、缓存刷新的横切逻辑。
- [ ] 联调前端，补充 Swagger、测试与文档。
- [ ] 评估性能与资源使用，准备上线 checklist。

---

以上设计遵循现有项目架构，确保新增模块在多实例环境下具备一致性、可扩展与可运维性。后续迭代需同步更新 DTO、Swagger、测试用例与部署脚本。
