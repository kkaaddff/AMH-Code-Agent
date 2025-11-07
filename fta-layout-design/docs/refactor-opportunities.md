# Refactor Candidates – Overlapping Functions in `src/`

> 目标：聚焦那些实现高度相似、可提炼成共享工具或抽象层的函数。以下分组按“可能合并逻辑/重构”的主题整理，并给出所在文件与行号，方便后续深入分析。所有行号取自当前仓库版本（`feat/new-neo-project` 分支）。

## 1. DSL / 标注树遍历类函数
- `src/pages/EditorPage/contexts/ComponentDetectionContext.tsx`
  - `flattenAnnotationTree` (37-45)、`findAnnotationById` (48-62)、`findAnnotationByDSLNodeId` (65-79)
  - `findDSLNodeById` (82-97)、`calculateDSLNodeAbsolutePosition` (100-120)
- `src/pages/EditorPage/utils/DetectionCanvasV2Helper.tsx`
  - `getNodeBounds` (69-75)、`findNodeAtPosition` (87-103)
  - `getNodeAbsolutePosition` (112-126)、`findNodeById` (135-143)
  - `getSelectionBounds` (151-158)、`isItemInSelection` (167-178)

**机会：** 上述函数都在做“树遍历 + 坐标计算”工作。`ComponentDetectionContext` 和 `DetectionCanvasV2Helper` 分别维护了一套近乎相同的 DSL 节点搜索与定位逻辑，且 `DetectionCanvas.tsx` 又通过 `findNodeByIdMemo` 间接消费。可考虑提炼统一的 DSL 工具模块：
- 避免在不同文件中重复维护 `findNodeById` / 绝对坐标计算。
- 让标注与画布层共享同一份边界、命中、定位算法，减少偏差。

## 2. 本地存储（localStorage）读写模式
- `src/pages/EditorPage/utils/componentStorage.ts`
  - 组件映射：`saveComponentMappings` / `loadComponentMappings` / `clearComponentMappings` (22-88)
  - 注解快照：`readAnnotationCache` (169-181) 等辅助函数
- `src/pages/EditorPage/utils/requirementDoc.ts`
  - `saveRequirementDoc` / `loadRequirementDoc` (206-234)

**机会：** 几乎相同的“生成 key → JSON 序列化 → 写入 localStorage → 错误处理”流程分散在多处。可考虑：
- 构建通用的 `storageHelper`，传入命名空间、默认数据结构和校验函数。
- 统一错误日志、版本字段和时间戳策略，降低重复代码量，并让缓存策略（例如过期时间、版本迁移）更容易集中管理。

## 3. 项目 / 页面 CRUD 包装
- `src/contexts/ProjectContext.tsx`
  - `createProject` (85-104)、`updateProject` (100-120)、`deleteProject` (115-131)
  - `createPage` (137-150)、`updatePage` (152-169)、`deletePage` (171-184)
- `src/services/projectService.ts`
  - 同名方法 (`createProject`、`updateProject`、`deleteProject` 等) 通过 `resolveRequest` 访问后端或 Mock。

**机会：** Context 层和 Service 层在做“请求→更新状态→错误处理”的模式化操作：
- `setLoading(true) → try { await apiServices.project.xxx } catch { setError } finally { setLoading(false) }` 结构在多个函数里重复。
- 可考虑抽出高阶函数，例如 `withProjectMutation(actionName, requestFn)`，统一 loading / error / 状态刷新的行为。
- Page 级别的 `create/update/delete` 与 Project 级别结构几乎一致，也可通过参数化（资源类型、成功提示）减少重复。

## 4. 文档状态与同步流程
- `src/contexts/ProjectContext.tsx`
  - `updateDocumentStatus` (235-273)、`syncDocuments` (292-318)、`completeDocument` (319-333)
- `src/services/projectService.ts`
  - `updateDocumentStatus` (200-215)、`syncDocument` (217-234)

**机会：** 多处函数在做“调用 service → 刷新 store → 反馈消息”的重复逻辑：
- Context 层三种操作几乎只在状态文本 & 成功提示上差异，可封装为通用的 `mutateDocumentStatus(type, documentId, action)`。
- Service 层同样存在状态更新与同步两个 API，可考虑统一命名、共享请求体构造，并为调用方返回一致的结果结构。

## 5. Modal 表单处理逻辑
- `src/components/ProjectCreateModal.tsx`
  - `handleSubmit` (25-44)、`handleAddTag` (43-51)、`handleRemoveTag` (50-53)、`handleCancel` (54-61)
- `src/components/ProjectDetailModal.tsx`
  - `handleCreatePage` (83-93)、`handleUpdatePage` (51-63)、`handleDeletePage` (64-82)、`handleNavigateToEditor` (95-101)
- `src/pages/HomePage/ProjectManagement.tsx`
  - `handleDeleteProject` (52-71)、`handleViewProject` (73-77)、`handleEditProject` (79-84)、`handleShareProject` (86-102)

**机会：** 多个组件存在“确认弹窗 → 调用 `useProject` -> 成功/失败提示”的同构逻辑。可以：
- 通过统一的 `useProjectActions()` Hook 返回包装后的回调，避免每个组件维护相似的 loading / message / confirm 代码。
- 抽离通用的 `confirmAndExecute` / `withSuccessMessage` 帮助函数，减轻各组件的样板代码。

## 6. 文档状态展示工具
- `src/utils/documentStatus.ts`
  - `getDocumentStatusText` (17-22)、`getDocumentStatusColor` (26-44)、`getDocumentActionConfig` (57-84)
- 使用点：`LayerTreePanel`（状态标签）、`ProjectContext`（状态提示）等。

**机会：** 这些函数彼此相关，可组合成单一的 `documentStatusRegistry`（包含 status → {text, color, action}），避免多次同步维护。虽然当前文件已经共存，但调用端仍需分别 import 不同函数；可考虑导出更语义化的单元（例如 `getDocumentMeta(status)`）。

## 7. 需求文档 & 注解保存流程
- `src/pages/EditorPage/utils/requirementDoc.ts`
  - `generateRequirementDoc` (107-174)、`executeCodeGeneration` (176-193)
- `src/pages/EditorPage/utils/componentStorage.ts`
  - `saveAnnotationState` (210-228)、`loadAnnotationState` (235-257)
- `src/pages/EditorPage/EditorPageComponentDetect.tsx`
  - `handleSave` (207-223)、`handleGenerateCode` (225-280) 调用上述工具。

**机会：** 需求文档、代码生成与注解保存共享大量“调用 API → 更新 UI → 处理异常”的流程。可：
- 定义统一的 `editorPersistence` 服务层，对外暴露 `saveAnnotations`, `generateRequirementDoc`, `executeCodeGeneration` 等方法，内部复用相同的 loading / message / retry 策略。
- `generateRequirementDoc` 内部包含 `streamRequirementDoc` 与 Mock 分支，可进一步抽象请求器，减少重复。

## 8. 画布交互事件处理
- `src/pages/EditorPage/components/DetectionCanvas.tsx`
  - `commitPanOffset` (39-41)、`stopPanning` (43-62) 等用于平移
  - 键盘事件处理：`handleKeyDown` (103-132)、`handleKeyUp` (135-168)
  - 框选事件：`handleDocumentMouseMove` / `handleDocumentMouseUp`（双套：576-609、612-640）
- `InteractionGuideOverlay` 仅展示规则，逻辑集中在 `DetectionCanvas`。

**机会：** 同一文件内存在多段几乎相同的事件监听/解绑逻辑（尤其是两组 `handleDocumentMouseMove`/`MouseUp`）。可考虑：
- 抽象 “注册 document 级事件监听 → 返回销毁函数” 的通用 helper。
- 使用状态机或封装 Hook（如 `usePanSession`, `useLassoSelection`）整合 Shift 框选与 Space 平移的差异逻辑。

---

## 总结
上述分组展示了目前最容易出现“逻辑散落/代码重复”的区域。优先级建议：
1. **DSL/标注树工具**：直接影响画布与标注一致性，合并后可减少 bug surface area。
2. **LocalStorage 持久化模式**：高重复、易出错，且未来若扩展缓存策略会更复杂。
3. **ProjectContext 请求包装**：重构收益在于减少样板代码，并统一错误提示体验。

这份清单可作为后续重构或代码整洁化任务的切入点，欢迎根据业务优先级挑选落实。
