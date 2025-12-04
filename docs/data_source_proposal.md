# 数据源维护方案建议书

## 1. 现状分析

### 1.1 现有实现
- **数据结构**：目前使用存储在 MongoDB 中的自定义 JSON Schema 结构 (`SchemaField[]`)。
- **管理界面**：`SchemaFieldEditor` 提供了一个可视化的表单编辑器，用于定义字段、类型和嵌套结构。
- **LLM 消费**：目前的工作流（推断）是将数据模型信息注入到提示词（Prompt）中。
- **技术栈**：后端使用 MidwayJS 和 Typegoose；前端使用 React + Ant Design。

### 1.2 问题陈述
- **多数据源管理**：需要处理多个数据源及其交叉重叠的情况。
- **维护效率**：用户指出，与 TypeScript 接口相比，JSON Schema 过于冗长，手动维护困难。
- **LLM 兼容性**：对于 LLM 来说，TS 接口通常比 JSON Schema 更节省 Token，且语义更丰富。
- **两难境地**：TS 接口更适合使用/定义，但对于非技术用户来说，验证/编辑可能比可视化表单更难。

## 2. 分析：JSON Schema vs. TypeScript Interfaces

| 特性 | JSON Schema (当前) | TypeScript Interfaces (建议) |
| :--- | :--- | :--- |
| **简洁性** | 低 (冗长，对象嵌套深) | 高 (语法紧凑) |
| **LLM 理解能力** | 好 (标准格式) | **极佳** (原生于代码训练数据) |
| **Token 效率** | 低 (许多关键字: `type`, `properties`) | 高 |
| **表达能力** | 擅长验证规则 | 擅长类型定义 (联合类型, 泛型, Pick/Omit) |
| **UI 编辑** | 容易 (表单构建器) | 需要代码编辑器 (Monaco) |
| **验证** | 容易 (Ajv 等) | 需要编译器/解析器 (ts-morph, zod) |
| **重构** | 难 (数据迁移) | 容易 (文本操作) |

## 3. 建议方案：“代码优先”的数据模型管理

鉴于目标受众可能是开发者或技术用户（使用“Code Agent”），且目标是驱动 LLM，**TypeScript Interfaces 是更优的选择**。

### 3.1 核心概念
将“单一事实来源（Source of Truth）”从 JSON Schema 结构转变为 **TypeScript 接口定义**。

### 3.2 架构设计

#### A. 存储层
- 在数据库中将 **原始 TypeScript 代码** 存储为字符串。
- *可选*：如果需要索引/搜索，可以缓存解析后的 JSON 结构 (AST)，但 LLM 主要依赖字符串。

#### B. 管理界面 (前端)
- **主视图**：**Monaco Editor** (代码编辑器)。
    - TypeScript 语法高亮。
    - 基础验证 (语法错误提示)。
- **辅助视图**：“可视化查看器” (只读或有限编辑)。
    - 解析 TS 代码并展示为树状视图，便于快速导航。
- **AI 辅助**：
    - “粘贴 JSON 转 TS”：一键将 JSON 样本转换为 TS 接口（使用 LLM 或库）。
    - “自然语言转 TS”：“创建一个包含姓名和年龄的用户模型” -> 生成 TS 代码。

#### C. LLM 消费 (后端)
- **直接注入**：将原始 TS 接口字符串直接注入到 System Prompt 中。
- **上下文管理**：
    - 生成代码时，提供 `interface` 定义。
    - LLM 可以在生成的代码中直接 import/使用这些类型。

### 3.3 解决“数据录入与维护”的顾虑

用户担心“TS 数据录入是个问题”。我们通过以下方式解决：

1.  **模板与片段**：提供常用模式的一键模板（如 `Pagination`, `User`, `APIResponse`）。
2.  **导入能力**：允许从现有的 `.d.ts` 文件或 Swagger/OpenAPI 规范导入（自动将 OpenAPI -> TS Interfaces）。
3.  **验证**：使用后端服务（利用 `ts-morph` 或 `typescript` 编译器 API）在保存时验证 TS 代码，确保无语法错误。

### 3.4 处理多数据源与重叠

- **命名空间**：将接口包裹在 `namespace` 或 `module` 块中，以避免命名冲突（例如 `CRM.User` vs `Auth.User`）。
- **共享库**：创建一个“Common”数据模型组，其他组可以通过 `import` 语法（在虚拟编辑器上下文中）引用它。
- **交叉引用**：LLM 可以自然地处理 `type User = Auth.User & { role: string }` 这种交叉类型。

## 4. 实施路线图

### 第一阶段：混合过渡
1.  在 `DataModel` 实体中添加 `tsContent` 字段。
2.  更新 `DataModelCreateModal`，增加“代码模式”标签页（Monaco Editor）。
3.  实现转换器：`JSON Schema -> TS Interface`，以迁移现有数据。

### 第二阶段：LLM 集成
1.  更新 Prompt 生成器，如果 `tsContent` 可用则优先使用。
2.  测试 LLM 使用 TS 接口的效果（预期代码质量和类型安全性会有所提升）。

### 第三阶段：高级功能
1.  实现 `OpenAPI -> TS` 导入功能。
2.  实现用于跨模型导入的“虚拟文件系统”。

## 5. 结论

切换到 **TypeScript Interfaces** 是 Code Agent 的最佳路径。它与输出领域（代码）高度一致，减少 Token 使用，并充分利用 LLM 最强的能力（理解代码）。只要实现了良好的代码编辑器体验，开发者的维护负担不仅不会增加，反而会 *减少*。
