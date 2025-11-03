import { useDSLData } from '@/hooks/useDSLData';
import {
  AppstoreOutlined,
  DownOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { App as AntApp, App, Button, Dropdown, Layout, Space, Spin, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import CodeGenerationDrawer from './components/CodeGenerationDrawer';
import Component3DInspectModal from './components/Component3DInspectModal';
import ComponentPropertyPanelV2 from './components/ComponentPropertyPanelV2';
import DetectionCanvasV2 from './components/DetectionCanvasV2';
import InteractionGuideOverlay from './components/InteractionGuideOverlay';
import LayerTreePanel from './components/LayerTreePanel';
import RequirementDocDrawer from './components/RequirementDocDrawer';
import { ComponentDetectionProviderV2, useComponentDetectionV2 } from './contexts/ComponentDetectionContextV2';
import { RequirementDocProvider, useRequirementDoc } from './contexts/RequirementDocContext';
import { CodeGenerationProvider, useCodeGeneration } from './contexts/CodeGenerationContext';
import { COMPONENT_STYLES } from './styles/EditorPageStyles';
import { loadAnnotationState } from './utils/componentStorage';
import { generateRequirementDoc } from './utils/requirementDoc';
import { AgentScheduler } from './services/CodeGenerationLoop';
import { generateUID } from './services/CodeGenerationLoop/utils';
import { commonUserPrompt } from './services/CodeGenerationLoop/CommonPrompt';
import { flattenAnnotation, formatAnnotationSummary } from './utils/prompt';

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
  const {
    isDrawerOpen: isCodeDrawerOpen,
    isGenerating: isGeneratingCode,
    openDrawer: openCodeDrawer,
    closeDrawer: closeCodeDrawer,
    startGeneration,
    stopGeneration,
    addThoughtItem,
    updateThoughtItem,
    appendToThoughtContent,
    updateTodos,
    setCurrentIteration,
    clearThoughtChain,
  } = useCodeGeneration();

  const [scale, setScale] = useState(0.5);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isDocDrawerOpen, setIsDocDrawerOpen] = useState(false);
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [designId, setDesignId] = useState<string>('');
  const [dslTreeSelectedNodeId, setDslTreeSelectedNodeId] = useState<string | null>(null);
  const [dslTreeHoveredNodeId, setDslTreeHoveredNodeId] = useState<string | null>(null);

  const schedulerRef = useRef<AgentScheduler | null>(null);

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

  useEffect(() => {
    return () => {
      // codeStreamControllerRef.current?.abort();
    };
  }, []);

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

  const handleGenerateCode = async () => {
    if (!designId) {
      message.error('请提供设计稿 ID 参数');
      return;
    }

    if (isGeneratingCode) {
      message.info('代码生成进行中，请稍候');
      openCodeDrawer();
      return;
    }

    // 打开抽屉并清空之前的数据
    openCodeDrawer();
    clearThoughtChain();
    message.open({ type: 'loading', content: '正在初始化代码生成...', key: 'generate-code' });

    // 当前迭代的思维链 ID（在 try 块外定义，以便在 catch 块中访问）
    let currentIterationThoughtId: string | null = null;

    try {
      // 初始化 Scheduler
      if (!schedulerRef.current) {
        schedulerRef.current = new AgentScheduler();
      }

      const scheduler = schedulerRef.current;
      const sessionId = generateUID();

      // 构建初始提示词
      let initialPrompt = commonUserPrompt.mainPrompt;
      if (rootAnnotation) {
        const annotationSummary = formatAnnotationSummary(flattenAnnotation(rootAnnotation));
        initialPrompt += `\n\n当前设计标注数据：\n${annotationSummary}`;
      }

      // 创建会话
      scheduler.createSession(sessionId, initialPrompt);
      startGeneration(sessionId);

      // 执行会话，传入回调函数
      await scheduler.executeSession(sessionId, {
        onIterationStart: (iteration) => {
          console.log(`开始第 ${iteration} 轮迭代`);
          setCurrentIteration(iteration);

          // 创建新的迭代项
          const thoughtId = `iteration-${sessionId}-${iteration}`;
          currentIterationThoughtId = thoughtId;
          addThoughtItem({
            id: thoughtId,
            title: `第 ${iteration} 轮迭代`,
            status: 'in_progress',
            content: '',
            startedAt: new Date().toISOString(),
            kind: 'iteration',
          });
        },

        onTextChunk: (text) => {
          // 将文本追加到当前迭代项
          if (currentIterationThoughtId) {
            appendToThoughtContent(currentIterationThoughtId, text);
          }
        },

        onTodoUpdate: (todos) => {
          // 更新 TODO 列表
          console.log('TODO 更新:', todos);
          updateTodos(todos);
        },

        onIterationEnd: (iteration) => {
          console.log(`第 ${iteration} 轮迭代结束`);
          // 将当前迭代项标记为完成
          if (currentIterationThoughtId) {
            updateThoughtItem(currentIterationThoughtId, {
              status: 'success',
              finishedAt: new Date().toISOString(),
            });
          }
        },

        onSessionComplete: () => {
          console.log('会话完成');
          message.success({ content: '代码生成完成', key: 'generate-code' });
          stopGeneration();
        },
      });
    } catch (error) {
      console.error('代码生成失败:', error);
      message.error({ content: '代码生成失败，请稍后重试', key: 'generate-code' });

      // 如果有正在进行的迭代，标记为失败
      if (currentIterationThoughtId) {
        updateThoughtItem(currentIterationThoughtId, {
          status: 'error',
          finishedAt: new Date().toISOString(),
        });
      }

      stopGeneration();
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

    setIsDocDrawerOpen(true);
    setDocContent('');

    try {
      setIsGeneratingDoc(true);
      const content = await generateRequirementDoc(designId, rootAnnotation, {
        onChunk: (chunk) => {
          setDocContent((prev) => prev + chunk);
        },
      });

      message.success({ content: '需求规格文档生成成功', key: 'generating' });
      setDocContent(content);
    } catch (error) {
      message.error({ content: '生成需求规格文档失败', key: 'generating' });
      console.error('Generate doc error:', error);
      setDocContent('');
      setIsDocDrawerOpen(false);
    } finally {
      setIsGeneratingDoc(false);
    }
  };

  const handleCloseCodeDrawer = () => {
    closeCodeDrawer();
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
            onGenerateCode={handleGenerateCode}
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
      <CodeGenerationDrawer open={isCodeDrawerOpen} onClose={handleCloseCodeDrawer} />
      <RequirementDocDrawer
        open={isDocDrawerOpen}
        onClose={() => setIsDocDrawerOpen(false)}
        designId={designId}
        isGenerating={isGeneratingDoc}
      />
    </>
  );
};

// Main component with provider
const EditorPageComponentDetect: React.FC = () => {
  return (
    <AntApp>
      <RequirementDocProvider>
        <CodeGenerationProvider>
          <ComponentDetectionProviderV2>
            <EditorPageContent />
          </ComponentDetectionProviderV2>
        </CodeGenerationProvider>
      </RequirementDocProvider>
    </AntApp>
  );
};

export default EditorPageComponentDetect;
