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
import CodeGenerationDrawer, { ThoughtChainItem, ThoughtChainStatus } from './components/CodeGenerationDrawer';
import Component3DInspectModal from './components/Component3DInspectModal';
import ComponentPropertyPanelV2 from './components/ComponentPropertyPanelV2';
import DetectionCanvasV2 from './components/DetectionCanvasV2';
import InteractionGuideOverlay from './components/InteractionGuideOverlay';
import LayerTreePanel from './components/LayerTreePanel';
import RequirementDocDrawer from './components/RequirementDocDrawer';
import { ComponentDetectionProviderV2, useComponentDetectionV2 } from './contexts/ComponentDetectionContextV2';
import { RequirementDocProvider, useRequirementDoc } from './contexts/RequirementDocContext';
import { COMPONENT_STYLES } from './styles/EditorPageStyles';
import { inputBody1 } from './utils/CodeGenerationLoop/input1';
import { loadAnnotationState } from './utils/componentStorage';
import streamModelGateway from './utils/modelGateway';
import { generateRequirementDoc } from './utils/requirementDoc';

const { Sider, Content } = Layout;
const { Title } = Typography;

const SCALE_OPTIONS = [
  { key: '0.25', label: '25%' },
  { key: '0.5', label: '50%' },
  { key: '0.75', label: '75%' },
  { key: '1', label: '100%' },
];

const mapTodoStatusToThoughtStatus = (status?: string): ThoughtChainStatus => {
  const normalized = (status || '').toLowerCase();
  if (['success', 'completed', 'done', 'finished'].includes(normalized)) {
    return 'success';
  }
  if (['error', 'failed', 'failure'].includes(normalized)) {
    return 'error';
  }
  if (['in_progress', 'working', 'progress'].includes(normalized)) {
    return 'in_progress';
  }
  return 'pending';
};

const createTodoItemId = (baseId: string, index: number) => `${baseId}-todo-${index}`;

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
  const [isGeneratingDoc, setIsGeneratingDoc] = useState(false);
  const [isCodeDrawerOpen, setIsCodeDrawerOpen] = useState(false);
  const [isGeneratingCode, setIsGeneratingCode] = useState(false);
  const [thoughtChainItems, setThoughtChainItems] = useState<ThoughtChainItem[]>([]);
  const [designId, setDesignId] = useState<string>('');
  const [dslTreeSelectedNodeId, setDslTreeSelectedNodeId] = useState<string | null>(null);
  const [dslTreeHoveredNodeId, setDslTreeHoveredNodeId] = useState<string | null>(null);
  const codeStreamControllerRef = useRef<AbortController | null>(null);
  const codeRoundRef = useRef(0);

  const createThoughtId = () => `thought-${Date.now()}-${Math.random().toString(16).slice(2)}`;

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
      codeStreamControllerRef.current?.abort();
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
      setIsCodeDrawerOpen(true);
      return;
    }

    const startedAt = new Date().toISOString();
    setIsCodeDrawerOpen(true);
    setIsGeneratingCode(true);
    message.open({ type: 'loading', content: '正在生成代码...', key: 'generate-code' });

    codeRoundRef.current += 1;
    const currentRound = codeRoundRef.current;
    const thoughtId = createThoughtId();

    setThoughtChainItems((prev) => {
      const nextNode: ThoughtChainItem = {
        id: thoughtId,
        title: `第${currentRound}轮模型响应`,
        status: 'pending',
        content: '',
        startedAt,
        kind: 'response',
      };
      const last = prev[prev.length - 1];
      if (last && last.status === 'pending' && !last.content) {
        return [...prev.slice(0, -1), nextNode];
      }
      return [...prev, nextNode];
    });

    const controller = new AbortController();
    codeStreamControllerRef.current = controller;

    const requestMessages: Array<{ role: string; content: string }> = [
      {
        role: 'system',
        content: '你是一个前端代码生成助手，擅长根据设计标注输出 React 代码。',
      },
      {
        role: 'user',
        content: `请基于设计稿${designId ? `（ID: ${designId}）` : ''}的标注信息给出代码草稿。`,
      },
    ];

    if (rootAnnotation) {
      const serialized = JSON.stringify(rootAnnotation);
      const truncated = serialized.length > 4000 ? `${serialized.slice(0, 4000)}…` : serialized;
      requestMessages.push({
        role: 'user',
        content: `标注数据：${truncated}`,
      });
    }
    const requestBody = inputBody1;
    try {
      await streamModelGateway({
        body: requestBody,
        onChunk: (event) => {
          if (event.type === 'text') {
            setThoughtChainItems((prev) =>
              prev.map((item) => {
                if (item.id !== thoughtId) {
                  return item;
                }
                const mergedContent = (item.content || '') + event.text;
                const nextStatus =
                  item.status === 'pending' && event.text.trim() ? 'in_progress' : item.status;
                return {
                  ...item,
                  status: nextStatus,
                  content: mergedContent,
                };
              })
            );
            return;
          }

          if (event.type === 'todo') {
            if (!event.todos.length) {
              return;
            }
            setThoughtChainItems((prev) => {
              const todoPrefix = `${thoughtId}-todo-`;
              const now = new Date().toISOString();
              const todoItems: ThoughtChainItem[] = event.todos.map((todo, index): ThoughtChainItem => {
                const todoId = createTodoItemId(thoughtId, index);
                const existing = prev.find((item) => item.id === todoId);
                const status = mapTodoStatusToThoughtStatus(todo.status);
                const startedAt = existing?.startedAt || now;
                const finishedAt =
                  status === 'success' || status === 'error'
                    ? existing?.finishedAt || now
                    : undefined;

                return {
                  id: todoId,
                  title: todo.activeForm || todo.content || `任务 ${index + 1}`,
                  status,
                  content: todo.content || existing?.content || '',
                  startedAt,
                  finishedAt,
                  kind: 'task',
                };
              });

              const filtered = prev.filter((item) => !item.id.startsWith(todoPrefix));
              const insertionIndex = filtered.findIndex((item) => item.id === thoughtId);
              if (insertionIndex === -1) {
                return [...filtered, ...todoItems];
              }

              return [
                ...filtered.slice(0, insertionIndex + 1),
                ...todoItems,
                ...filtered.slice(insertionIndex + 1),
              ];
            });
          }
        },
      });

      const finishedAt = new Date().toISOString();

      setThoughtChainItems((prev) => {
        const updated = prev.map((item) =>
          item.id === thoughtId
            ? {
                ...item,
                status: 'success' as ThoughtChainStatus,
                finishedAt,
              }
            : item
        );
        const placeholder: ThoughtChainItem = {
          id: createThoughtId(),
          title: `第${currentRound + 1}轮模型响应`,
          status: 'pending',
          content: '',
          startedAt: finishedAt,
          kind: 'response',
        };
        return [...updated, placeholder];
      });

      message.success({ content: '代码生成完成', key: 'generate-code' });
    } catch (error) {
      const finishedAt = new Date().toISOString();

      setThoughtChainItems((prev) => {
        const updated = prev.map((item) =>
          item.id === thoughtId
            ? {
                ...item,
                status: 'error' as ThoughtChainStatus,
                finishedAt,
              }
            : item
        );
        const placeholder: ThoughtChainItem = {
          id: createThoughtId(),
          title: `第${currentRound + 1}轮模型响应`,
          status: 'pending',
          content: '',
          startedAt: finishedAt,
          kind: 'response',
        };
        return [...updated, placeholder];
      });

      if ((error as Error).name === 'AbortError') {
        message.warning({ content: '已取消代码生成', key: 'generate-code' });
      } else {
        message.error({ content: '代码生成失败，请稍后重试', key: 'generate-code' });
        console.error('代码生成失败:', error);
      }
    } finally {
      codeStreamControllerRef.current = null;
      setIsGeneratingCode(false);
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
    if (isGeneratingCode) {
      codeStreamControllerRef.current?.abort();
    }
    setIsCodeDrawerOpen(false);
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
      <CodeGenerationDrawer
        open={isCodeDrawerOpen}
        onClose={handleCloseCodeDrawer}
        items={thoughtChainItems}
        isGenerating={isGeneratingCode}
      />
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
        <ComponentDetectionProviderV2>
          <EditorPageContent />
        </ComponentDetectionProviderV2>
      </RequirementDocProvider>
    </AntApp>
  );
};

export default EditorPageComponentDetect;
