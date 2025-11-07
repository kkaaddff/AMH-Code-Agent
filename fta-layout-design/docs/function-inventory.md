# Function Inventory by Functional Area

本目录梳理 `src/` 目录下的全部函数/方法，并按功能归类，便于快速了解当前代码库的能力分布。每个条目都包含函数所在文件与核心职责说明。如无特殊说明，所列函数均为 `const` 形式或导出的对象方法；类方法则按实例行为列出。

## 1. 启动与页面骨架
- `main.tsx`
  - （匿名函数）`ReactDOM.createRoot(...).render(<App />)`：创建根节点并挂载应用。
- `App.tsx`
  - `App()`：装配 Ant Design 主题、React Router，并委托 `renderRoutes` 渲染配置化路由。
- `src/components/Layout.tsx`
  - `Layout({ children })`：应用整体框架（头部、面包屑、内容区）。
  - `handleBreadcrumbClick(href)`：响应面包屑点击并触发导航。

## 2. 路由与配置
- `src/config/routes.tsx`
  - `routes`：路由配置对象数组（含 `withLayout` 语义）。
  - `wrapWithLayout(element)`：按需为页面包裹主框架 `Layout`。
- `src/utils/routerUtils.tsx`
  - `renderRoutes(routes)`：将配置映射为 `<Route>` 结构，处理嵌套路由与布局包装。
- `src/config/api.ts`
  - `getEnvironment()`：基于 `import.meta.env.MODE` 判断当前环境。
  - `API_CONFIG`：开发/生产环境默认配置表。
  - `getApiConfig()`：按环境返回当前 API 配置。
  - `API_ENDPOINTS`：后端接口路径集中定义。
  - `buildApiUrl(endpoint)`：拼接基础地址与端点，确保格式正确。
  - `currentApiConfig`：即时求值的配置快照。

## 3. 服务层（真实 API 与 Mock）
- `src/services/baseService.ts`
  - `resolveRequest(useMock, mockHandler, apiHandler)`：根据 Mock 开关在真实请求与模拟数据间切换。
  - `shouldUseMock()`：读取 `VITE_ENABLE_MOCK` 环境开关。
  - `BaseAPIService.makeRequest()` / `wrapAPIRequest()`：供继承者复用的请求封装。
- `src/utils/apiService.ts`
  - `ApiError`：自定义错误类型，承载状态码与响应。
  - `request(endpoint, options)`：底层 `fetch` 实现，处理超时、查询参数、错误码判定。
  - `ApiService.get/post/put/delete/patch/upload()`：REST 调用和文件上传的静态封装。
  - `api.project.*`：项目域接口（列表、CRUD、文档操作等）。
  - `api.dsl.*`：DSL 上传/解析/导出接口包装。
  - `api.component.*`：组件识别相关接口包装。
  - `api.requirement.*`：需求文档 CRUD 与导出接口。
  - `api.layout.*`：布局保存/加载/预览接口。
- `src/services/projectService.ts`
  - `normalizeProjectListResponse(payload, params)`：统一项目列表响应结构。
  - `projectService`（对象方法）：`getProjects`、`createProject`、`updateProject`、`deleteProject`、`getProjectDetail`、`getPageDetail`、`createPage`、`updatePage`、`deletePage`、`updateDocumentStatus`、`syncDocument`、`getDocumentContent`、`updateDocument`。
- `src/services/requirementService.ts`
  - `requirementService`：`generateRequirement`、`saveRequirement`、`exportRequirement`、`getRequirementDetail`、`getRequirementList`。
- `src/services/mockProjectService.ts`
  - 工具函数：`delay`、`deepClone`、`generateId`、`deriveDocumentName`、`createDocumentReferences`、`mergeDocumentReferences`、`findProject`、`findPage`、`findDocument`、`buildPagePayload`。
  - `projectMockService`：模拟层的 CRUD、页面管理、文档同步/内容读写等同名方法。
- `src/services/mockRequirementService.ts`
  - `delay`：简易延迟。
  - `requirementMockService`：`generateRequirement`、`saveRequirement`、`exportRequirement`、`getRequirementDetail`、`getRequirementList`。
- `src/services/index.ts`
  - `apiServices`：聚合 `projectService` 与 `requirementService`，供上下文统一调用。

## 4. 状态与上下文管理
- `src/contexts/ProjectContext.tsx`
  - 辅助函数：`generateId`、`getDocumentTypeName`、`setLoading`、`setError`、`replaceProjectInState`、`mutateProjectState`。
  - 行为函数：`createProject`、`updateProject`、`deleteProject`、`setCurrentProject`、`createPage`、`updatePage`、`deletePage`、`uploadDesignSpecs`、`updateDesignSpecStatus`、`updateDocumentStatus`、`syncDocuments`、`completeDocument`、`loadProjects`。
  - `useProject()`：暴露状态快照与上述操作。
- `src/pages/EditorPage/contexts/EditorPageContext.tsx`
  - `editorPageActions`：`setPageId`、`setProjectId`、`setCurrentPage`、`setSelectedDocument`。
- `src/pages/EditorPage/contexts/DSLDataContext.tsx`
  - 树操作工具：`updateNodeInTree`、`resetVisibilityInTree`。
  - `dslDataActions`：`updateNodeVisibility`、`resetAllNodeVisibility`、`loadDesign`（含请求节流与错误处理）。
- `src/pages/EditorPage/contexts/CodeGenerationContext.tsx`
  - `codeGenerationActions`：`openDrawer`、`closeDrawer`、`startGeneration`、`stopGeneration`、`addThoughtItem`、`updateThoughtItem`、`appendToThoughtContent`、`clearThoughtChain`、`setCurrentIteration`、`updateTodos`。
- `src/pages/EditorPage/contexts/RequirementDocContext.tsx`
  - `createRequirementDocStore()`：生成局部 store。
  - `createRequirementDocActions(store)`：提供 `setDocContent`。
- `src/pages/EditorPage/contexts/ComponentDetectionContext.tsx`
  - 工具函数：`sortAnnotationChildren`、`flattenAnnotationTree`、`findAnnotationById`、`findAnnotationByDSLNodeId`、`findDSLNodeById`、`calculateDSLNodeAbsolutePosition`、`findBestParent`、`calculateContainerBounds`、`findParentAnnotation`、`isAncestor`、`findContainingDSLNode`。
  - `setModalInstance(modal)`：注入 AntD Modal 实例。
  - `componentDetectionActions`：
    - 初始化与选择：`initializeFromDSL`、`selectAnnotation`、`selectDSLNode`、`clearSelection`、`toggleShowAllBorders`。
    - 注解 CRUD：`createAnnotation`、`updateAnnotation`、`removeAnnotation`、`combineSelectedDSLNodes`、`splitAnnotation`、`renameAnnotation`、`updateAnnotationFTAComponent`、`updateAnnotationProps`、`updateAnnotationLayout`、`toggleAnnotationContainer`、`moveAnnotation`、`duplicateAnnotation`。
    - 选区与高亮：`setHoveredAnnotation`、`setHoveredDSLNode`、`setExpandedKeys`、`setSelectedNodeIds`。
    - 状态持久化：`saveAnnotations`、`loadAnnotations`。

## 5. 通用工具模块
- `src/utils/documentStatus.ts`
  - `getDocumentStatusText`、`getDocumentStatusColor`、`getDocumentActionConfig`、`DOCUMENT_STATUS_TEXT`。
- `src/utils/styleUtils.ts`
  - `parseColor`、`parseLayoutStyle`、`parseFlexContainerStyle`、`parseBorderRadius`、`parseTextStyle`。
- `src/utils/layoutUtils.ts`
  - `parseBorderStyle`、`parseEffectStyle`。
- `src/utils/imageUtils.ts`
  - `parseImageUrl`：根据 DSL 样式解析图片 URL。
- `src/utils/componentDetectionDebug.ts`
  - `componentDetectionDebugLog(event, payload)`、`ensureComponentDetectionDebugToggle()`、`isLoggingEnabled()`（内部函数）。
- `src/utils/apiService.ts`（附，除服务外）：内部 `isSuccessfulResponse`、`request` 等已在第 3 节说明。
- `src/pages/EditorPage/utils/DetectionCanvasV2Helper.tsx`
  - Hook：`useContainerSize(ref)`。
  - DSL/画布工具：`getNodeBounds`、`findNodeAtPosition`、`getNodeAbsolutePosition`、`findNodeById`、`getSelectionBounds`、`isItemInSelection`、`drawBorder`、`getCanvasPoint`、`drawGridBackground`（及内部 `createGridPattern`）。
- `src/pages/EditorPage/utils/componentStorage.ts`
  - 本地缓存：`getStorageKey`、`saveComponentMappings`、`loadComponentMappings`、`clearComponentMappings`、`exportMappingsToJSON`、`importMappingsFromJSON`。
  - 标注缓存：`getAnnotationStorageKey`、`readAnnotationCache`、`normalizeSnapshot`、`safelyParseJSON`、`saveAnnotationState`、`loadAnnotationState`、`clearAnnotationState`。
- `src/pages/EditorPage/utils/prompt.ts`
  - `formatAnnotationSummary`、`flattenAnnotation`：用于构建模型提示。
- `src/pages/EditorPage/utils/modelGateway.ts`
  - 解析工具：`extractChunkContent`、`toTodoItems`、`parseContentToEvents`、`extractEventsFromPayload`。
  - 接口包装：`streamModelGateway({ body, onChunk, onComplete })`、`syncModelGateway({ body })`。
- `src/pages/EditorPage/utils/requirementDoc.ts`
  - 流式生成：`streamRequirementDoc(payload, options)`、`generateRequirementDoc(designId, rootAnnotation, options)`。
  - 辅助操作：`executeCodeGeneration`、`saveRequirementDoc`、`loadRequirementDoc`。

## 6. 共享 UI 组件
- `src/components/DSLElement.tsx`
  - 事件处理：`handleClick`、`handleMouseEnter`、`handleMouseLeave`。
  - 递归渲染：`renderChildren(children)` 根据节点类型绘制 TEXT/LAYER/PATH/FRAME 等。
- `src/components/ProjectCreateModal.tsx`
  - `handleSubmit`、`handleAddTag`、`handleRemoveTag`、`handleCancel`。
- `src/components/ProjectDetailModal.tsx`
  - 页面管理：`handleEditPage`、`handleUpdatePage`、`handleDeletePage`、`handleCreatePage`、`handleNavigateToEditor`。
  - 渲染辅助：`renderPageContent()`、`renderProjectInfo()`。
- `src/components/Layout.tsx`
  - 详见第 1 节。

## 7. 首页与业务面板
- `src/pages/HomePage/index.tsx`
  - `renderOverview()`：生成首页概览面板。
  - `tabItems`（常量数组）内嵌 `Render` 函数引用 `ProjectManagement` 与 `AssetManagement`。
- `src/pages/HomePage/ProjectManagement.tsx`
  - 状态映射：`getStatusColor`、`getStatusText`。
  - 交互函数：`handleDeleteProject`、`handleViewProject`、`handleEditProject`、`handleShareProject`。
- `src/pages/HomePage/AssetManagement.tsx`
  - `handlePreview`、`renderComponentCard`、`filterComponents`、`renderMyComponents`、`renderMarketplace`。
- `src/pages/RequirementPage.tsx`、`src/pages/TechnicalPage.tsx`
  - 两者均为静态展示组件，无额外函数；核心逻辑通过常量数组与 JSX 映射实现。

## 8. 编辑器页面主组件
- `src/pages/EditorPage/EditorPageComponentDetect.tsx`
  - 初始化：`fetchPageData`、`loadSavedAnnotations`。
  - 交互：`handleScaleChange`、`handleSave`、`handleGenerateCode`、`handleGenerateCodeV2`、`handleAnnotationConfirmSubmit`、`handleCloseCodeDrawer`、`handleDeleteDocument`、`handleSelectOpenApi`。
  - 组件内部还内联了一系列 `useEffect` 回调处理 DSL 与标注加载。

## 9. 编辑器页面子组件
- `AnnotationConfirmModal.tsx`
  - 数据处理：`collectContainerAnnotations`、`getAnnotationRect`、`annotationsOverlap`、`computeAnnotationComponents`、`splitComponentsIntoGroups`、`buildAnnotationDetails`。
  - 资源处理：`captureAnnotationImage`。
- `ComponentPropertyPanel.tsx`
  - 表单辅助：`customFilterOption`、`handleValuesChange`、`handleSave`、`handleDelete`、`handleCreateAnnotation`、`handleBatchCreateAnnotations`、`handleKeyDown`、`renderDynamicPropertyFields`。
- `DetectionCanvas.tsx`
  - 画布状态：`commitPanOffset`、`stopPanning`。
  - 键鼠逻辑：`isEditableTarget`、`handleKeyDown`、`handleKeyUp`、`getInteractionTarget`。
  - 绘制辅助：`getNodeAbsolutePositionMemo`、`findNodeByIdMemo`、`drawDSLNodeBorders`、`drawLabel`、`traverseDSLNodes` 等。
  - 拖拽/框选：`handleDocumentMouseMove`、`handleDocumentMouseUp`（两组，用于框选与平移）。
- `LayerTreePanel/index.tsx`
  - 数据加载：`fetchDesignDocDSL`、`handleSyncDesignDocument`。
  - 交互：`handleDesignSelect`、`handleDesignExpand`、`handleAddDocumentClick`、`handleAddDocumentSubmit`、`handleDeleteDocumentClick`。
  - 渲染：`renderDocumentItem`。
- `LayerTreePanel/utils.tsx`
  - Tree 工具：`createRootAnnotationFromDSL`、`convertToTreeData`、`nodeContainsKey`、`findTopLevelKey`、`extractDesignIdFromTopLevelKey`。
- `Component3DInspectModal.tsx`
  - 数据与渲染：`collectAnnotations`、`getMaxDepth`、`drawRoundedRect`、`disposeSceneResources`、`ensureTexture`、`initialiseScene`、`animate`。
- `CodeGenerationDrawer.tsx`
  - `CodeGenerationDrawer` 组件内部使用 `useMemo` 拆分任务/迭代，无额外独立函数。
- `PRDEditorPanel.tsx`
  - 行为：`handleSave`、`handleExport`。
- `RequirementDocDrawer.tsx`
  - 行为：`handleSave`、`handleSaveAndExecute`。
- `OpenAPIUrlPanel.tsx`
  - 通过 `setSearchText` 管理检索关键字，并在列表项上使用内联事件处理选中/悬停，无独立函数导出。
- `OpenAPIDataPanel.tsx`
  - 状态：`setActiveTab`（通过 React state 管理）。
- `InteractionGuideOverlay/index.tsx`
  - `InteractionGuideOverlay` 为展示组件，无额外函数。

## 10. 编辑器页面工具与服务
- `src/pages/EditorPage/utils/componentStorage.ts`、`DetectionCanvasV2Helper.tsx`、`modelGateway.ts`、`prompt.ts`、`requirementDoc.ts` 已于上文列出。
- `src/pages/EditorPage/services/CodeGenerationLoop/index.AgentScheduler.backup.ts`
  - 顶层辅助：`callModelAPI`。
  - `AgentScheduler` 类方法：
    - 生命周期：`initializeTools`、`createSession`、`executeSession`、`processResponse`、`executeTools`、`executeTool`、`cleanupSession`。
    - TODO 管理：`mapStreamTodosToTodoItems`、`normalizeTodoStatus`、`updateTodos`、`isSessionCompleted`、`generateToolUseId`。
    - 其他：`getSession`、`delay`。
- `src/pages/EditorPage/services/CodeGenerationLoop/utils.ts`
  - 日志与 UID：`logToFile`、`generateUID` 等（文件内按需求提供工具函数）。
- `src/pages/EditorPage/services/CodeGenerationLoop/CommonPrompt.ts`
  - `commonSystemPrompt`、`commonUserPrompt` 等常量（用于模型提示）。
- `src/pages/EditorPage/services/CodeGenerationLoop/tools.ts`
  - 导出工具描述对象（`AskUserQuestion`、`Write` 等），供调度器引用。

## 11. 需求文档与代码生成
- `src/pages/EditorPage/utils/requirementDoc.ts`（第 5 节已列）负责对接需求生成、默认保存与加载。
- `RequirementDocDrawer.tsx` 通过 `handleSave`、`handleSaveAndExecute` 调用上述工具。

## 12. 其他补充
- `src/services/componentService.ts` / `src/services/dslService.ts` / `src/services/layoutService.ts`
  - 提供各自领域的 API 调用方法（detect/recognize/save/list、upload/parse/export、save/load/preview）。
- `src/pages/EditorPage/components/OpenAPIUrlPanel.tsx`：以内部 state 与列表项事件支撑筛选/选中，无显式工具函数。
- `src/pages/EditorPage/components/PRDEditorPanel.tsx`：基础保存/导出按钮逻辑见第 9 节。

---

> 注：部分展示型组件仅使用 JSX + 常量映射（如 RequirementPage、TechnicalPage、OpenAPIDataPanel），未单独声明函数，故未逐一展开。若后续新增函数，请同步维护本清单。
