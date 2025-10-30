import { useDSLData } from '@/hooks/useDSLData';
import {
  AppstoreOutlined,
  DownOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { App as AntApp, Button, Dropdown, Layout, Space, Spin, Typography, App } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import Component3DInspectModal from './components/Component3DInspectModal';
import ComponentPropertyPanelV2 from './components/ComponentPropertyPanelV2';
import DetectionCanvasV2 from './components/DetectionCanvasV2';
import InteractionGuideOverlay from './components/InteractionGuideOverlay';
import LayerTreePanel from './components/LayerTreePanel';
import RequirementDocDrawer from './components/RequirementDocDrawer';
import { ComponentDetectionProviderV2, useComponentDetectionV2 } from './contexts/ComponentDetectionContextV2';
import { RequirementDocProvider, useRequirementDoc } from './contexts/RequirementDocContext';
import { COMPONENT_STYLES } from './styles/EditorPageStyles';
import { loadAnnotationState } from './utils/componentStorage';
import { generateRequirementDoc } from './utils/requirementDoc';

const { Sider, Content } = Layout;
const { Title } = Typography;

const SCALE_OPTIONS = [
  { key: '0.25', label: '25%' },
  { key: '0.5', label: '50%' },
  { key: '0.75', label: '75%' },
  { key: '1', label: '100%' },
];

// Inner component that uses the context
const EditorPageContent: React.FC = () => {
  const { message } = App.useApp();
  const { setDocContent } = useRequirementDoc();
  const {
    initializeFromDSL,
    isLoading,
    showAllBorders,
    toggleShowAllBorders,
    saveAnnotations,
    loadAnnotations,
    updateDslRootNode,
    rootAnnotation,
  } = useComponentDetectionV2();
  const [scale, setScale] = useState(0.5);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDocDrawerOpen, setIsDocDrawerOpen] = useState(false);
  const [designId, setDesignId] = useState<string>('');
  const [dslTreeSelectedNodeId, setDslTreeSelectedNodeId] = useState<string | null>(null);
  const [dslTreeHoveredNodeId, setDslTreeHoveredNodeId] = useState<string | null>(null);

  // 从 URL 读取 designId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('designId');
    setDesignId(id || '');
  }, []);

  // 使用 designId 获取 DSL 数据
  const {
    data: dslData,
    loading: dslLoading,
    error: dslError,
    updateNodeVisibility,
    resetAllNodeVisibility,
  } = useDSLData({
    designId: designId || null,
  });
  const initializedDesignRef = useRef<string | null>(null);

  // 初始化 DSL 数据和加载已保存的标注信息
  useEffect(() => {
    if (!dslData || !designId) {
      return;
    }

    const rootNode = dslData.dsl.nodes?.[0] || null;
    updateDslRootNode(rootNode);
    setDslTreeSelectedNodeId(null);
    setDslTreeHoveredNodeId(null);

    if (initializedDesignRef.current === designId) {
      return;
    }

    initializeFromDSL(dslData);

    initializedDesignRef.current = designId;

    const loadSavedAnnotations = async () => {
      try {
        const savedState = await loadAnnotationState(designId);
        if (savedState && savedState.rootAnnotation) {
          loadAnnotations(savedState.rootAnnotation);
          message.success('已加载保存的标注信息');
        }
      } catch (error) {
        console.error('加载标注信息失败:', error);
      }
    };

    loadSavedAnnotations();
  }, [designId, dslData, initializeFromDSL, loadAnnotations, message, updateDslRootNode]);

  const handleScaleChange = (value: number) => {
    setScale(Math.max(0.1, Math.min(1, value)));
  };

  const handleSave = async () => {
    if (!designId) {
      message.error('请提供设计稿 ID 参数');
      return;
    }

    try {
      await saveAnnotations(designId);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
      console.error('Save error:', error);
    }
  };

  const handleGenerateDoc = async () => {
    if (!designId) {
      message.error('请提供设计稿 ID 参数');
      return;
    }

    if (!rootAnnotation) {
      message.error('暂无标注数据，无法生成需求规格文档');
      return;
    }

    try {
      const hide = message.loading({ content: '正在生成需求规格文档...', key: 'generating', duration: 0 });
      let content = '';
      content =
        '好的，作为一名资深前端系统分析师，我将根据您提供的设计稿与组件标注，生成一份详细的、可直接用于代码生成的需求规格说明（SRS）。\n\n---\n\n# 用户详情页 - 需求规格说明 (SRS)\n\n## 1. 功能概述与目标\n\n### 1.1 功能概述\n本页面为用户详情页（或称个人主页），旨在集中展示特定用户的个人信息、简介及相关内容（如作品、动态等）。页面采用垂直滚动布局，顶部为固定导航栏，底部为固定操作栏，中间主体区域可滚动浏览。\n\n### 1.2 核心目标\n- **信息展示**：清晰、结构化地展示用户的核心信息，包括头像、昵称、标签、简介等。\n- **内容呈现**：以图文卡片的形式展示用户发布的内容列表。\n- **用户交互**：提供便捷的关注、私信等核心交互入口。\n- **代码生成驱动**：提供精确的组件、样式、数据结构定义，确保前端工程师或代码生成工具能够高效、准确地实现页面。\n\n## 2. 用户场景与交互流程\n\n### 2.1 主要路径\n1.  **进入页面**：用户从其他页面（如搜索结果、推荐列表）点击某用户，跳转至本用户详情页。\n2.  **页面加载**：\n    -   页面首先显示加载状态（如骨架屏或 Loading 动画）。\n    -   后端请求用户数据，成功后渲染页面所有内容。\n3.  **浏览信息**：用户在 `Body` 区域上下滑动，浏览用户个人信息和内容卡片。\n4.  **执行操作**：\n    -   用户点击 `Footer` 中的“关注”按钮，触发关注操作，按钮状态变为“已关注”或显示加载状态。\n    -   用户点击 `Footer` 中的“私信”按钮，跳转至与该用户的聊天界面。\n\n### 2.2 异常/边界情况\n| 场景描述 | 预期行为 |\n| :--- | :--- |\n| **网络请求失败** | 在 `Body` 区域显示统一的错误提示（如“加载失败，请重试”），并提供一个刷新按钮。 |\n| **图片加载失败** | `Avatar` 和 `Image` 组件显示默认占位图。 |\n| **文本内容过长** | `Text` 组件根据设计稿固定尺寸，超出部分应使用省略号（...）截断。多行文本需指定行数（如 `-webkit-line-clamp`）。 |\n| **标签数量过多** | `Tag` 组件所在的容器应支持自动换行或提供横向滚动能力（根据设计稿尺寸，换行更可能）。 |\n| **用户已关注** | “关注”按钮初始状态应为“已关注”，点击后触发取消关注操作，按钮状态恢复为“关注”。 |\n| **无内容数据** | 当 `contentList` 为空时，应在内容区域显示空状态提示（如“该用户暂无发布内容”）。 |\n\n## 3. 组件树结构说明\n\n本页面采用自上而下的组件化结构，容器组件负责布局，原子组件负责内容展示。\n\n```mermaid\ngraph TD\n    A[Page: 根容器] --> B[Header: 顶部导航栏];\n    A --> C[Body: 主内容区];\n    A --> D[Footer: 底部操作栏];\n\n    C --> E[Avatar: 用户头像];\n    C --> F[Text: 用户昵称];\n    C --> G[Tag: 用户标签1];\n    C --> H[Tag: 用户标签2];\n    C --> I[Tag: 用户标签3];\n    C --> J[Flex: 简介容器];\n    J --> K[Text: 简介标题];\n    J --> L[Text: 简介内容];\n    C --> M[ContentCard: 内容卡片1];\n    M --> N[Text: 卡片标题];\n    M --> O[Image: 卡片图片];\n    C --> P[ContentCard: 内容卡片2];\n    P --> Q[Text: 卡片标题];\n    P --> R[Image: 卡片图片];\n\n    D --> S[Button: 关注按钮];\n    D --> T[Button: 私信按钮];\n```\n\n### 组件职责说明\n\n| 组件路径 | 组件类型 | 职责描述 | 备注 |\n| :--- | :--- | :--- | :--- |\n| `Page` | `View`/`div` | 作为根容器，定义整体页面布局（全屏、垂直方向）。 | 负责管理全局状态，如加载、错误。 |\n| `Header` | `Flex` | 顶部固定区域，通常用于放置返回按钮、页面标题等。 | **待补充**：标注中未包含子节点，需确认具体内容（如返回按钮、标题）。 |\n| `Body` | `ScrollView`/`div` | 可滚动的主内容容器，垂直排列所有子组件。 | 需处理滚动性能及吸顶效果（如有）。 |\n| `Avatar` | `Image` | 展示用户头像。 | 通常为圆形，需设置 `border-radius: 50%`。 |\n| `Text` (昵称) | `Text` | 展示用户昵称或全名。 | 字体加粗，字号较大。 |\n| `Tag` | `Text`/`View` | 展示用户属性标签（如“设计师”、“摄影师”）。 | 具有统一的背景色、圆角和内边距样式。 |\n| `Flex` (简介) | `Flex` | 容器，用于组合“简介”标题和内容。 | 采用水平布局，标题和内容左对齐。 |\n| `Text` (简介标题) | `Text` | 展示“简介”等固定标题。 | 字体颜色、大小与内容区有区分。 |\n| `Text` (简介内容) | `Text` | 展示用户的具体简介文字。 | 支持多行显示，超出部分截断。 |\n| `ContentCard` | `Flex`/`View` | **可复用组件**。用于展示单个内容项，包含标题和图片。 | 应封装为独立组件，通过 `props` 传入数据。 |\n| `Text` (卡片标题) | `Text` | 展示内容卡片的标题。 | |\n| `Image` (卡片图片) | `Image` | 展示内容卡片的主图。 | 需设置固定宽高比或进行裁剪适配。 |\n| `Footer` | `Flex` | 底部固定操作栏，水平排列操作按钮。 | 背景通常为半透明或纯色，与内容区区隔。 |\n| `Button` | `Button` | 触发关注/取消关注、私信等操作。 | 需处理不同状态（默认、加载、禁用）。 |\n\n## 4. 样式与布局要点\n\n### 4.1 整体布局\n-   **方向**：主轴为垂直方向（`column`）。\n-   **尺寸**：页面总宽度为 `720px`，高度为 `1560px`（移动端视口）。\n-   **定位**：`Header` 和 `Footer` 为固定定位（`position: fixed`），`Body` 区域的 `padding-top` 和 `padding-bottom` 需分别等于 `Header` 和 `Footer` 的高度，以避免内容被遮挡。\n\n### 4.2 关键尺寸与间距\n\n| 组件/区域 | 宽度 | 高度 | 布局/样式要点 |\n| :--- | :--- | :--- | :--- |\n| `Page` | 720px | 1560px | 全屏容器，背景色 `#F5F5F5`（推测）。 |\n| `Header` | 720px | 144px | 固定于顶部，`z-index` 较高。 |\n| `Body` | 720px | 1192px | 可滚动区域，`padding` 需考虑与 `Header`/`Footer` 的间距。 |\n| `Footer` | 720px | 100px | 固定于底部，`z-index` 较高。内部 `justify-content: space-around` 或 `space-between`。 |\n| `Avatar` | 96px | 96px | 圆形，`margin` 与其他元素保持间距。 |\n| `Text` (昵称) | 560px | 48px | 字号较大，行高约 1.2-1.4。 |\n| `Tag` | 96/125/124px | 34px | 高度统一，宽度自适应内容。`margin-right` 和 `margin-bottom` 用于设置间距。 |\n| `Flex` (简介) | 672px | 100px | 水平布局，`align-items: flex-start`。 |\n| `ContentCard` | 720px | 450px | 垂直布局，卡片之间有 `margin` 间距。 |\n| `Image` (卡片) | 504px | 330px | 居中显示，可能需要 `object-fit: cover`。 |\n| `Button` | 336px | 52px | 圆角，背景色为主色调。两个按钮之间的间距约为 `48px`。 |\n\n### 4.3 工程实现注意事项\n-   **单位**：所有尺寸单位应使用 `px` 或 `rem`，建议在项目中配置 `postcss-pxtorem` 等工具进行移动端适配。\n-   **样式复用**：`Tag` 组件、`ContentCard` 组件的样式应高度可复用。建议使用 CSS-in-JS 或 CSS Modules 进行样式隔离。\n-   **Flex 布局**：大量使用 `Flex` 布局，需明确 `justify-content` 和 `align-items` 属性。根据上下文，`Body` 和 `ContentCard` 内部应为 `column`，`Footer` 和简介容器应为 `row`。\n\n## 5. 数据与接口契约\n\n### 5.1 数据源\n页面数据应通过一个 API 请求获取。假设接口为 `GET /api/v1/users/{userId}`。\n\n### 5.2 数据结构定义\n\n```typescript\ninterface UserProfileResponse {\n  id: string;\n  avatar: string; // 头像 URL\n  nickname: string; // 昵称\n  tags: string[]; // 标签数组\n  bioTitle: string; // 简介标题，如 "个人简介"\n  bioContent: string; // 简介内容\n  contentList: ContentItem[]; // 内容列表\n  isFollowing: boolean; // 是否已关注\n}\n\ninterface ContentItem {\n  id: string;\n  title: string; // 内容标题\n  imageUrl: string; // 内容图片 URL\n}\n```\n\n### 5.3 字段需求与校验规则\n\n| 字段 | 类型 | 是否必填 | 校验规则/说明 | 映射组件 |\n| :--- | :--- | :--- | :--- | :--- |\n| `id` | `string` | 是 | 用户唯一标识符。 | 页面状态管理 |\n| `avatar` | `string` | 是 | 有效的图片 URL。 | `Avatar` |\n| `nickname` | `string` | 是 | 长度 1-20 字符。 | `Text` (昵称) |\n| `tags` | `string[]` | 否 | 数组，每个元素长度 1-10 字符。最多显示 3 个。 | `Tag` |\n| `bioTitle` | `string` | 否 | 长度 1-10 字符。 | `Text` (简介标题) |\n| `bioContent` | `string` | 否 | 长度 0-200 字符。 | `Text` (简介内容) |\n| `contentList` | `Array` | 否 | 数组，每个元素需符合 `ContentItem` 结构。 | `ContentCard` 列表 |\n| `contentItem.title` | `string` | 是 | 长度 1-50 字符。 | `Text` (卡片标题) |\n| `contentItem.imageUrl`| `string` | 是 | 有效的图片 URL。 | `Image` (卡片图片) |\n| `isFollowing` | `boolean` | 是 | `true` 表示已关注，`false` 表示未关注。 | `Button` (关注) |\n\n### 5.4 待补充项\n-   **分页**：`contentList` 可能很长，需要确认是否需要分页加载机制（无限滚动或分页器）。\n-   **国际化**：`bioTitle`（如“简介”）和按钮文本（如“关注”、“私信”）应使用国际化 key（如 `t(\'profile.bio\')`），而非硬编码。\n-   **操作接口**：需定义关注/取消关注（`POST /api/v1/follow/{userId}`）和获取私信会话（`POST /api/v1/conversations`）的接口契约。\n\n## 6. 验收标准\n\n### 6.1 功能验收点\n- [ ] 页面在 720x1560 分辨率下布局与设计稿完全一致。\n- [ ] 页面加载时显示加载状态，数据加载成功后正确渲染所有模块。\n- [ ] 网络错误时，页面能正确显示错误提示和重试按钮。\n- [ ] 用户头像、内容图片加载失败时，显示默认占位图。\n- [ ] 昵称、简介等文本超长时，能按设计稿样式截断显示。\n- [ ] 点击“关注”按钮，能正确切换“关注/已关注”状态，并调用相应 API。\n- [ ] 点击“私信”按钮，能正确跳转到聊天页面。\n- [ ] `Body` 区域可以流畅地上下滚动。\n\n### 6.2 代码生成检查项\n- [ ] **组件结构**：生成的组件树与第 3 节描述完全一致。\n- [ ] **组件复用**：`Tag` 和 `ContentCard` 已被封装为独立的、可复用的组件。\n- [ ] **Props 传递**：`ContentCard` 组件通过 `props`（如 `title`, `imageUrl`）接收数据，而非硬编码。\n- [ ] **样式实现**：所有尺寸、间距、颜色等样式已按第 4 节要求实现，并使用了合理的布局方式（Flex）。\n- [ ] **状态管理**：已实现页面级状态管理，包括 `loading`, `error`, `profileData`。\n- [ ] **数据绑定**：模板中的数据绑定（如 `{profileData.nickname}`）与第 5 节的数据结构一一对应。\n- [ ] **国际化**：所有静态文本已通过 `t()` 函数包裹，并生成了对应的语言包文件。\n- [ ] **代码质量**：生成的代码结构清晰，有必要的注释，符合项目编码规范。';
      content = await generateRequirementDoc(designId, rootAnnotation);
      setDocContent(content);
      setIsDocDrawerOpen(true);
      hide();
      message.success({ content: '需求规格文档生成成功', key: 'generating' });
    } catch (error) {
      message.error({ content: '生成需求规格文档失败', key: 'generating' });
      console.error('Generate doc error:', error);
    }
  };

  // 如果 DSL 数据还在加载中
  if (dslLoading) {
    return (
      <div style={COMPONENT_STYLES.loadingContainer}>
        <Spin size="large" tip="加载中..." />
      </div>
    );
  }

  // 如果 DSL 数据加载失败
  if (dslError) {
    return (
      <div style={COMPONENT_STYLES.errorContainer}>
        <Typography.Text type="danger">加载 DSL 数据失败：{dslError.message}</Typography.Text>
      </div>
    );
  }

  // 如果没有 DSL 数据
  if (!dslData) {
    return (
      <div style={COMPONENT_STYLES.errorContainer}>
        <Typography.Text type="secondary">未找到 DSL 数据</Typography.Text>
      </div>
    );
  }

  // 如果组件识别上下文还在加载中
  if (isLoading) {
    return (
      <div style={COMPONENT_STYLES.loadingContainer}>
        <Spin size="large" tip="初始化中..." />
      </div>
    );
  }

  return (
    <>
      <Layout style={COMPONENT_STYLES.mainLayout}>
        <Sider
          width={350}
          theme="light"
          collapsible
          collapsed={leftCollapsed}
          onCollapse={setLeftCollapsed}
          collapsedWidth={0}
          trigger={null}
          style={COMPONENT_STYLES.sider}
        >
          <LayerTreePanel
            dslData={dslData}
            onToggleNodeVisibility={updateNodeVisibility}
            onResetNodeVisibility={resetAllNodeVisibility}
            dslSelectedNodeId={dslTreeSelectedNodeId}
            onSelectDslNode={setDslTreeSelectedNodeId}
            onHoverDslNode={setDslTreeHoveredNodeId}
            onSave={handleSave}
            onGenerateDoc={handleGenerateDoc}
          />
        </Sider>

        <Layout>
          <Content style={COMPONENT_STYLES.content}>
            <div style={COMPONENT_STYLES.headerToolbar}>
              <Title level={5} style={COMPONENT_STYLES.title}>
                组件标注编辑器
              </Title>
              <Space>
                <Button
                  type={showAllBorders ? 'primary' : 'default'}
                  size="small"
                  icon={showAllBorders ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                  onClick={toggleShowAllBorders}
                  style={COMPONENT_STYLES.button}
                >
                  框线
                </Button>
                <Button
                  type={is3DModalOpen ? 'primary' : 'default'}
                  size="small"
                  icon={<AppstoreOutlined />}
                  onClick={() => setIs3DModalOpen(true)}
                  style={COMPONENT_STYLES.button}
                >
                  3D 检视
                </Button>
                <Button
                  type={isGuideOpen ? 'primary' : 'default'}
                  size="small"
                  icon={<QuestionCircleOutlined />}
                  onClick={() => setIsGuideOpen(true)}
                  style={COMPONENT_STYLES.button}
                >
                  交互引导
                </Button>
                <Dropdown
                  menu={{ items: SCALE_OPTIONS, onClick: ({ key }) => handleScaleChange(parseFloat(key)) }}
                  trigger={['click']}
                >
                  <a onClick={(e) => e.preventDefault()}>
                    {Math.round(scale * 100)}% <DownOutlined />
                  </a>
                </Dropdown>
              </Space>
            </div>

            <div style={COMPONENT_STYLES.canvasContainer}>
              <div
                onClick={() => setLeftCollapsed(!leftCollapsed)}
                style={{ ...COMPONENT_STYLES.collapseButton, ...COMPONENT_STYLES.leftCollapseButton }}
              >
                {leftCollapsed ? '▶' : '◀'}
              </div>

              <div
                onClick={() => setRightCollapsed(!rightCollapsed)}
                style={{ ...COMPONENT_STYLES.collapseButton, ...COMPONENT_STYLES.rightCollapseButton }}
              >
                {rightCollapsed ? '◀' : '▶'}
              </div>

              <div id="detection-canvas-container" style={COMPONENT_STYLES.detectionCanvasContainer}>
                <DetectionCanvasV2
                  dslData={dslData}
                  scale={scale}
                  onScaleChange={handleScaleChange}
                  highlightedNodeId={dslTreeSelectedNodeId}
                  hoveredNodeId={dslTreeHoveredNodeId}
                />
              </div>
            </div>
          </Content>
        </Layout>

        <Sider
          width={350}
          theme="light"
          collapsible
          collapsed={rightCollapsed}
          onCollapse={setRightCollapsed}
          collapsedWidth={0}
          trigger={null}
          style={COMPONENT_STYLES.rightSider}
        >
          <ComponentPropertyPanelV2 />
        </Sider>
      </Layout>
      <Component3DInspectModal open={is3DModalOpen} onClose={() => setIs3DModalOpen(false)} />
      <InteractionGuideOverlay open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <RequirementDocDrawer open={isDocDrawerOpen} onClose={() => setIsDocDrawerOpen(false)} designId={designId} />
    </>
  );
};

// Main component with provider
const EditorPageComponentDetect: React.FC = () => {
  return (
    <AntApp>
      <RequirementDocProvider>
        <ComponentDetectionProviderV2>
          <EditorPageContent />
        </ComponentDetectionProviderV2>
      </RequirementDocProvider>
    </AntApp>
  );
};

export default EditorPageComponentDetect;
