# FTA 平台服务端需求实现文档

本文档针对 `fta-server` Midway 服务端项目，梳理已存在的能力与后续可实现的需求，确保新增或优化功能能够直接落地于当前架构。

## 1. 项目背景与目标

- 为前端技术基础设施（FTA）提供统一的服务端支撑，覆盖应用档案、代码质量分析、组件使用统计、物料模板生态、度量报表和插件管理等能力。
- 聚合 GitLab、Perfsee、Workstation Doctor、公司 SSO、Ali OSS 等内部系统，为研发、运营、质量等角色提供 API 与后台服务。
- 保证线上自助治理与离线分析任务贯通，沉淀跨团队可复用的数据资产。

## 2. 系统架构概览

### 2.1 技术栈

- **运行环境**：Node.js 16.18、TypeScript、Midway 3（@midwayjs/web）。
- **数据存储**：MongoDB（通过 @midwayjs/mongoose + @typegoose/typegoose 描述实体）、Redis 缓存、Ali OSS 与本地缓存目录 `files-cache/`。
- **异步任务**：@midwayjs/task、应用内队列（Doctor 分析、订阅通知、CLI 触发）。
- **鉴权链路**：@fta/server-middleware-sso、@fta/server-middleware-lion，结合 Token/Cookie 与内部网关。
- **接口调试**：Swagger（本地/测试可用）、EJS 视图辅助调试。

### 2.2 分层结构

```
Controller（HTTP 输入） → Service（业务编排） → Entity/DTO（Mongo 模型与契约） → Utils/Middleware/Listener（横切能力）
```

- `src/controller/`：暴露 REST API。
- `src/service/`：负责业务逻辑、外部系统协同、任务调度。
- `src/entity/`：使用 Typegoose 定义集合结构。
- `src/dto/`：请求/响应类型，驱动 Swagger。
- `src/listener/`、`src/middleware/`、`src/task/`：事件监听、跨域/Token/缓存等中间件。

### 2.3 配置与部署

- 配置文件位于 `src/config/`，覆盖 default/dev/local/unittest 环境，提供日志、文件服务、代理、Mongo、Redis 等参数。
- 核心命令：`npm run dev`、`npm run build`、`npm start`、`npm run cov`、`npm run lint`。
- 产出目录：`dist/`，通过 `bootstrap.js` 启动。

## 3. 核心业务域与需求

### 3.1 应用中心（`src/controller/application.ts`，`src/service/application/`）

- 管理应用档案（名称、Git 信息、负责人、部门、阈值、平台/框架），提供新增、条件查询、批量保存。
- 支持从 Phantom JSON 与 GitLab 同步数据，关联组织服务 (`src/service/organization/`) 获取部门树。
- 需求：完善分页/筛选能力，提供 deptCode、平台、状态联合查询；补充阈值配置校验及缓存。

### 3.2 GitLab 集成（`src/controller/gitlab.ts`，`src/service/gitlab/`）

- 拉取仓库信息、分支/Commit、文件列表，为 Doctor、FTA Usage、CLI 提供代码素材。
- 支持 Webhook 事件（`src/controller/webhook.ts`）及 OAuth Token 管理。
- 需求：统一通过 GitId/GitUrl 解析项目，缓存高频请求（`files-cache/gitlab`），提供 Token 轮换和降级策略。

### 3.3 代码健康分析（Doctor）（`src/controller/doctor.ts`，`src/service/doctor/`）

- Producer：拉取源码 → 调用 `@fta/workstation-doctor`、`@fta/perfsee-shared` → 生成 eslint/escomplex/jscpd/bundle 数据。
- Consumer：按项目/部门/时间提供查询、统计、Bundle 差异对比，输出报告数据。
- 需求：保证 commit + gitId 去重、错误日志追踪（`DoctorParseErrEntity`），支持 bundle 上传 (`/doctor/upload`) 与报告查询 (`/doctor/getBundleReport`)，在部门维度输出综合得分及标签。

### 3.4 组件与能力使用（`src/controller/fta-usage.ts`，`src/service/fta-usage/`）

- 接收 CLI/Web 上报的组件/能力使用记录、页面清单、平台信息，写入 `FTAUsageRecordsEntity` 等集合。
- 提供列表查询、时间/仓库过滤、按 ID 批量拉取，支持组件配置更新、基线维护、动画使用情况统计。
- 需求：提供平台/版本维度聚合、数据导出、增量对账，与质量报表联动输出告警。

### 3.5 质量报表（`src/controller/quality-report.ts`，`src/service/quality-report/`）

- 输出团队、项目的每日质量指标，支持时间范围、deptCode、gitId 查询。
- 可通过 commitId 定位 Doctor 主记录，与靠谱平台等消费者对接。
- 需求：规范指标口径（质量得分、bundle 体积、问题类型），支持多维筛选与结构化输出。

### 3.6 模板与物料生态（`src/controller/template.ts`，`src/service/template/`、`src/controller/material.ts`）

- 模板/物料的 CRUD、版本对比、预览，供 CLI/IDE 使用。
- 插件管理 (`src/controller/plugins.ts` + `src/service/plugins/`) 联动包版本信息 (`PkgService`)。
- 需求：提供模板发布流程、版本回滚、OSS/Git 仓库存储策略，保证与 CLI 公共协议一致。

### 3.7 配置、订阅与工具接口

- `src/controller/config.ts`：配置项增删改查，支持环境隔离。
- `src/controller/subscribe.ts`：通知订阅管理，结合机器人/邮件。
- `src/controller/task.ts`：内部任务触发开关。
- `src/controller/file.ts`、`src/service/file/`：文件上传、Ali OSS 转存、二维码生成 (`src/controller/qrcode.ts`)。
- `src/controller/im-llm.ts`、`src/controller/chat.ts`：对接 IM、LLM 服务。
- 需求：写入类接口需权限校验、操作审计；提供缓存刷新与配置变更通知。

### 3.8 认证与中间件

- `FTATokenMiddleware`、`FTASsoMiddleware` 负责 Token 重写、SSO 登录；`src/controller/auth.ts` 提供 Cookie 导出。
- 需求：明确不同环境（线上/QA/dev） Cookie 策略，对敏感写入接口增加角色校验与日志。

## 4. 数据模型概览（MongoDB + Typegoose）

| 集合                                     | 实体                       | 核心字段                                        | 说明                  |
| ---------------------------------------- | -------------------------- | ----------------------------------------------- | --------------------- |
| `applications`                           | `ApplicationEntity`        | gitId, platform, framework, deptCode, limitSize | 应用档案与阈值配置。  |
| `doctor-analysis-main`                   | `DoctorAnalysisMainEntity` | gitId, commitId, score, bundleIds, deptCode     | Doctor 主记录。       |
| `doctor-analysis-eslint/escomplex/jscpd` | 对应实体                   | messages、LoC、duplication                      | 细粒度分析结果。      |
| `doctor-bundle-stat`                     | `DoctorBundleStatEntity`   | statId, app, gitUrl, commitId, bundle           | Bundle 上传数据。     |
| `fta-usage-records/components/updates`   | 各 FTA 实体                | gitUrl, apiUsage, components, platforms         | 组件/能力使用与配置。 |
| `quality-report-*`                       | `QualityReportEntity` 系列 | deptCode, team, score, trend                    | 质量报表聚合。        |
| `materials/templates/plugins/pkg`        | 对应实体                   | name, version, meta, files                      | 物料生态及包信息。    |
| `config`                                 | `ConfigEntity`             | key, value, scope                               | 配置中心数据。        |
| `subscribe`                              | `SubscribeEntity`          | channel, event, target                          | 订阅通知。            |

- 实体通过 `@EntityModel` 注册，默认 `timestamps`，字段命名使用 camelCase。
- 新增字段需同步更新 DTO、Swagger、索引策略（常用：gitId、deptCode、createdAt）。

## 5. API 规划要点

- `/application/*`：创建、条件查询、批量更新、同步。
- `/doctor/*`：上传 bundle、获取项目分析记录、部门聚合、报告下载。
- `/quality-report/*`：团队列表、项目数据、commit 定位。
- `/ftaUsage/*`：数据上报、历史查询、组件配置管理（含 `/bundleInfo` 记录）。
- `/plugins/*`、`/template/*`、`/material/*`：物料生态 CRUD。
- `/cli/*`、`/code-agent/*`、`/task/*`：供 CLI 与自动化场景调用。
- `/config/*`、`/subscribe/*`、`/file/*`、`/qrcode/*`、`/proxy/*`：通用能力。
- 要求：接口返回统一 `AsyncResponse` 结构，Swagger 文档与单测同步更新，`test/` 目录保持与 Controller 同结构。

## 6. 异步任务与分析流程

1. **Doctor Producer**：获取项目 → 执行扫描 → 写入 Mongo → 触发 bundle 体积分析（`@fta/perfsee-bundle-analyzer`）。
2. **Doctor Consumer**：提供多维查询、差异分析、分部门统计，输出报表。
3. **订阅通知**：通过 Redis/任务调度驱动，触发机器人/邮件。
4. **文件处理**：上传后落地本地缓存，再异步推送 OSS。

- 需求：关键任务增加重试、监控与告警（结合订阅配置）。

## 7. 外部依赖与集成

- **GitLab**：访问 `AMH_GITLAB_URL` API 获取项目信息（需要 Private-Token）。
- **Ali OSS**：`FileService` 用于文件托管、二维码等静态资源。
- **Perfsee**：Bundle 差异、体积分析。
- **Workstation Doctor**：代码质量扫描。
- **SSO & Lion**：统一登录与配置中心。
- **内部代理**：`qa-fta-snapshot`、`qa-ymm-server-gateway` 等（详见 `config.default.ts` 的 httpProxy）。
- 要求：各依赖需提供环境变量、错误兜底与日志埋点。

## 8. 安全与合规

- 强制通过公司 SSO；中间件写入 `ctx.user`，拒绝未登录访问敏感接口。
- 写入/删除操作记录操作者信息，日志保持 JSON 规范（`config.midwayLogger`）。
- 上传限制默认 10MB，需校验文件类型与来源。
- 代理接口需过滤可疑 Header，防止 SSRF。
- 支持 OpenTelemetry 引入的可观测能力，重要链路埋点。

## 9. 开发与测试要求

- 单元测试：`npm test`，利用 Midway Mock 覆盖 Service/Utils。
- 覆盖率：`npm run cov`，确保 Doctor、质量报表、物料等核心模块覆盖率不下降。
- 代码规范：`npm run lint`；遵循 MWTS，两空格缩进、单引号、尾部分号。
- Swagger：持续维护 DTO 注释，避免线上文档与返回结构不一致。
- 数据准备：本地 `config.local.ts` 配置 Mongo/Redis，可补充 Mock/Seed 脚本。

## 10. 迭代计划建议

1. **稳定现有能力**：梳理接口契约、补齐 Swagger/单测、完善权限校验。
2. **指标统一**：整合 Doctor、质量报表、FTA Usage 数据模型，明确指标口径与字段含义。
3. **生态扩展**：模板/插件发布流程、版本回滚、与 CLI 自动对齐。
4. **平台联动**：通过订阅/通知/CLI，推动告警、看板、周报等自助治理场景。

## 11. 运维与监控

- 运行日志输出到 `logs/` 或生产环境 `/data/ymmapplogs/fta-server/logs/`。
- 需采集任务耗时、队列积压、存储容量、失败比率等指标，可逐步接入 OpenTelemetry。
- 通过订阅体系与报警机器人提示异常任务或外部依赖不可用。

---

以上需求与当前项目目录、依赖保持一致，可直接在现有 Midway + Mongo 架构上实施。功能扩展时，请同步更新实体、DTO、Swagger 与测试，确保 CLI 与前端调用兼容。
