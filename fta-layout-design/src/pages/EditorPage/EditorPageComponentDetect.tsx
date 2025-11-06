import { projectService } from '@/services/projectService';
import { DSLData, DSLNode } from '@/types/dsl';
import type { DocumentReference } from '@/types/project';
import {
  AppstoreOutlined,
  DownOutlined,
  EyeInvisibleOutlined,
  EyeOutlined,
  QuestionCircleOutlined,
} from '@ant-design/icons';
import { App as AntApp, App, Button, Dropdown, Layout, Space, Spin, Typography } from 'antd';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSnapshot } from 'valtio/react';
import AnnotationConfirmModal from './components/AnnotationConfirmModal';
import CodeGenerationDrawer from './components/CodeGenerationDrawer';
import Component3DInspectModal from './components/Component3DInspectModal';
import ComponentPropertyPanel from './components/ComponentPropertyPanel';
import DetectionCanvas from './components/DetectionCanvas';
import InteractionGuideOverlay from './components/InteractionGuideOverlay';
import LayerTreePanel from './components/LayerTreePanel';
import OpenAPIDataPanel from './components/OpenAPIDataPanel';
import OpenAPIUrlPanel from './components/OpenAPIUrlPanel';
import PRDEditorPanel from './components/PRDEditorPanel';
import { TDocumentKeys } from './constants';
import { codeGenerationActions, codeGenerationStore } from './contexts/CodeGenerationContext';
import { componentDetectionActions, componentDetectionStore } from './contexts/ComponentDetectionContext';
import { dslDataActions, dslDataStore } from './contexts/DSLDataContext';
import { editorPageActions, editorPageStore } from './contexts/EditorPageContext';
import { commonUserPrompt } from './services/CodeGenerationLoop/CommonPrompt';
import { AgentScheduler } from './services/CodeGenerationLoop/index.AgentScheduler.backup';
import { generateUID } from './services/CodeGenerationLoop/utils';
import './styles/EditorPageStyles.css';
import { AnnotationNode } from './types/componentDetection';
import { loadAnnotationState } from './utils/componentStorage';
import { flattenAnnotation, formatAnnotationSummary } from './utils/prompt';

// import { SSEScheduler } from './services/CodeGenerationLoop/SSEScheduler';
const { Sider, Content } = Layout;
const { Title } = Typography;

const SCALE_OPTIONS = [
  { key: '0.25', label: '25%' },
  { key: '0.5', label: '50%' },
  { key: '0.75', label: '75%' },
  { key: '1', label: '100%' },
];

const EditorPageContent: React.FC = () => {
  const { message } = App.useApp();

  const editorPageStoreSnapshot = useSnapshot(editorPageStore);
  const { setPageId, setProjectId, setCurrentPage, setSelectedDocument } = editorPageActions;

  const { initializeFromDSL, toggleShowAllBorders, saveAnnotations, loadAnnotations, updateDslRootNode } =
    componentDetectionActions;
  const componentDetectionStoreSnapshot = useSnapshot(componentDetectionStore);

  const codeGenerationStoreSnapshot = useSnapshot(codeGenerationStore);
  const {
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
  } = codeGenerationActions;

  // 使用 designId 获取 DSL 数据（仅在选中设计文档时）
  const dslDataStoreSnapshot = useSnapshot(dslDataStore);

  const [scale, setScale] = useState(0.5);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(false);
  const [pageError, setPageError] = useState<string | null>(null);
  const [isAnnotationConfirmOpen, setIsAnnotationConfirmOpen] = useState(false);

  // const schedulerRef = useRef<SSEScheduler | null>(null);
  const schedulerRef = useRef<AgentScheduler | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const _pageId = params.get('pageId');
    const _projectId = params.get('projectId');

    setPageId(_pageId || '');
    setProjectId(_projectId || '');

    const fetchPageData = async () => {
      setPageLoading(true);
      setPageError(null);
      try {
        const pageData = await projectService.getPageDetail(_pageId!);
        setCurrentPage(pageData);
        // 初始化：默认选中第一个设计文档
        setSelectedDocument({ type: 'design', id: pageData.designDocuments[0].id });
        await dslDataActions.loadDesign(pageData.designDocuments[0].id);
      } catch (error: any) {
        console.error('获取页面数据失败:', error);
        setPageError(error.message || '获取页面数据失败');
        message.error('获取页面数据失败');
      } finally {
        setPageLoading(false);
      }
    };

    fetchPageData();
  }, []);

  // 初始化 DSL 数据和加载已保存的标注信息
  useEffect(() => {
    const { selectedDocument } = editorPageStoreSnapshot;
    const { data: dslData } = dslDataStoreSnapshot;

    if (!dslData || !selectedDocument?.id || selectedDocument?.type !== 'design') {
      return;
    }

    const rootNode = (dslData.dsl.nodes?.[0] as DSLNode) || null;
    updateDslRootNode(rootNode);

    initializeFromDSL(dslData as DSLData, selectedDocument.id);

    const loadSavedAnnotations = async () => {
      try {
        const savedState = await loadAnnotationState(selectedDocument.id);
        loadAnnotations(savedState.rootAnnotation);
        message.success('已加载保存的标注信息');
      } catch (error) {
        console.error('加载标注信息失败:', error);
      }
    };

    loadSavedAnnotations();
  }, []);

  useEffect(() => {
    return () => {
      // codeStreamControllerRef.current?.abort();
    };
  }, []);

  const handleScaleChange = (value: number) => {
    setScale(Math.max(0.1, Math.min(1, value)));
  };

  const handleSave = async () => {
    const { selectedDocument } = editorPageStoreSnapshot;
    if (!selectedDocument?.id) {
      message.error('请提供设计稿 ID 参数');
      return;
    }

    try {
      await saveAnnotations(selectedDocument?.id);
      message.success('保存成功');
    } catch (error) {
      message.error('保存失败');
      console.error('Save error:', error);
    }
  };

  const handleGenerateCode = async () => {
    const { selectedDocument } = editorPageStoreSnapshot;
    if (!selectedDocument?.id) {
      message.error('请提供设计稿 ID 参数');
      return;
    }

    if (codeGenerationStoreSnapshot.isGenerating) {
      message.info('代码生成进行中，请稍候');
      openCodeDrawer();
      return;
    }

    // 打开抽屉并清空之前的数据
    openCodeDrawer();
    clearThoughtChain();
    message.open({
      type: 'loading',
      content: '正在初始化代码生成...',
      key: 'generate-code',
    });

    // 当前迭代的思维链 ID（在 try 块外定义，以便在 catch 块中访问）
    let currentIterationThoughtId: string | null = null;

    try {
      // 初始化 SSE Scheduler
      if (!schedulerRef.current) {
        schedulerRef.current = new AgentScheduler();
        // schedulerRef.current = new SSEScheduler()
      }

      const scheduler = schedulerRef.current;
      const sessionId = generateUID();

      // 构建初始提示词
      let initialPrompt = commonUserPrompt.mainPrompt;
      const { rootAnnotation } = componentDetectionStoreSnapshot;
      if (rootAnnotation) {
        const annotationSummary = formatAnnotationSummary(flattenAnnotation(rootAnnotation as AnnotationNode));
        initialPrompt += `\n\n当前设计标注数据：\n${annotationSummary}`;
      }
      const { data: dslData } = dslDataStoreSnapshot;
      const dslJsonStr = JSON.stringify(dslData?.dsl ?? {});
      // 创建会话
      scheduler.createSession(sessionId, initialPrompt, dslJsonStr);
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
      // // 执行 SSE 会话，传入回调函数
      // await scheduler.execute(
      //   {
      //     message: initialPrompt,
      //     sessionId,
      //   },
      //   {
      //     onIterationStart: (iteration) => {
      //       console.log(`开始第 ${iteration} 轮迭代`);
      //       setCurrentIteration(iteration);

      //       // 创建新的迭代项
      //       const thoughtId = `iteration-${sessionId}-${iteration}`;
      //       currentIterationThoughtId = thoughtId;
      //       addThoughtItem({
      //         id: thoughtId,
      //         title: `第 ${iteration} 轮迭代`,
      //         status: 'in_progress',
      //         content: '',
      //         startedAt: new Date().toISOString(),
      //         kind: 'iteration',
      //       });
      //     },

      //     onTextChunk: (text) => {
      //       // 将文本追加到当前迭代项
      //       if (currentIterationThoughtId) {
      //         appendToThoughtContent(currentIterationThoughtId, text);
      //       }
      //     },

      //     onTodoUpdate: (todos) => {
      //       // 更新 TODO 列表
      //       console.log('TODO 更新:', todos);
      //       updateTodos(todos);
      //     },

      //     onIterationEnd: (iteration) => {
      //       console.log(`第 ${iteration} 轮迭代结束`);
      //       // 将当前迭代项标记为完成
      //       if (currentIterationThoughtId) {
      //         updateThoughtItem(currentIterationThoughtId, {
      //           status: 'success',
      //           finishedAt: new Date().toISOString(),
      //         });
      //       }
      //     },

      //     onSessionComplete: (returnedSessionId) => {
      //       console.log('会话完成，SessionId:', returnedSessionId);
      //       message.success({ content: '代码生成完成', key: 'generate-code' });
      //       stopGeneration();
      //     },

      //     onError: (error) => {
      //       console.error('SSE 错误:', error);
      //       message.error({
      //         content: `代码生成失败: ${error}`,
      //         key: 'generate-code',
      //       });

      //       // 如果有正在进行的迭代，标记为失败
      //       if (currentIterationThoughtId) {
      //         updateThoughtItem(currentIterationThoughtId, {
      //           status: 'error',
      //           finishedAt: new Date().toISOString(),
      //         });
      //       }

      //       stopGeneration();
      //     },
      //   }
      // );
    } catch (error) {
      console.error('代码生成失败:', error);
      message.error({
        content: '代码生成失败，请稍后重试',
        key: 'generate-code',
      });

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

  const handleGenerateCodeV2 = () => {
    const { selectedDocument } = editorPageStoreSnapshot;
    const { rootAnnotation } = componentDetectionStoreSnapshot;
    if (!selectedDocument?.id) {
      message.error('请提供设计稿 ID 参数');
      return;
    }

    if (selectedDocument?.type !== 'design') {
      void handleGenerateCode();
      return;
    }

    if (!rootAnnotation) {
      message.error('当前没有可确认的标注数据');
      return;
    }

    setIsAnnotationConfirmOpen(true);
  };

  const handleAnnotationConfirmSubmit = async () => {
    setIsAnnotationConfirmOpen(false);
    await handleGenerateCode();
  };

  const handleAnnotationConfirmCancel = useCallback(() => {
    setIsAnnotationConfirmOpen(false);
  }, []);

  const handleCloseCodeDrawer = () => {
    closeCodeDrawer();
  };

  // 处理删除文档
  const handleDeleteDocument = async (type: keyof typeof TDocumentKeys, docId: string) => {
    const { selectedDocument, currentPage } = editorPageStoreSnapshot;
    if (!currentPage) {
      message.error('页面数据未加载');
      return;
    }

    try {
      // 获取当前该类型的所有文档 URL（过滤掉要删除的文档）
      let currentDocs: DocumentReference[] | undefined = [];
      currentDocs = currentPage[TDocumentKeys[type]] as DocumentReference[];

      const updatedUrls = currentDocs
        .filter((doc: { id: string; url: string }) => doc.id !== docId)
        .map((doc: { id: string; url: string }) => doc.url);

      // 构建更新数据
      const updateData: { designUrls?: string[]; prdUrls?: string[]; openapiUrls?: string[] } = {};
      if (type === 'design') {
        updateData.designUrls = updatedUrls;
      } else if (type === 'prd') {
        updateData.prdUrls = updatedUrls;
      } else if (type === 'openapi') {
        updateData.openapiUrls = updatedUrls;
      }

      // 调用 API 更新页面
      await projectService.updatePage(currentPage.projectId, currentPage.id, updateData);

      message.success('文档删除成功');

      // 如果删除的是当前选中的文档，清空选择
      if (selectedDocument?.type === type && selectedDocument?.id === docId) {
        setSelectedDocument(null);
      }
    } catch (error: any) {
      console.error('删除文档失败:', error);
      message.error(error.message || '删除文档失败');
    }
  };

  // 处理 OpenAPI 接口选择
  const handleSelectOpenApi = (id: string) => {
    setSelectedDocument({ type: 'openapi', id });
  };

  // 如果页面数据还在加载中
  if (pageLoading) {
    return (
      <div className='editor-page-loading-container'>
        <Spin size='large' />
        <div style={{ marginTop: 16, color: '#999', fontSize: 14 }}>加载页面数据...</div>
      </div>
    );
  }

  // 如果页面数据加载失败
  if (pageError) {
    return (
      <div className='editor-page-error-container'>
        <Typography.Text type='danger'>加载页面数据失败：{pageError}</Typography.Text>
      </div>
    );
  }

  // 如果 DSL 数据还在加载中（仅在选中设计文档时检查）
  if (editorPageStoreSnapshot.selectedDocument?.type === 'design' && dslDataStoreSnapshot.loading) {
    return (
      <div className='editor-page-loading-container'>
        <Spin size='large' />
        <div style={{ marginTop: 16, color: '#999', fontSize: 14 }}>加载 DSL 数据...</div>
      </div>
    );
  }

  // 如果选中设计文档时 DSL 数据加载失败
  if (editorPageStoreSnapshot.selectedDocument?.type === 'design' && dslDataStoreSnapshot.error) {
    return (
      <div className='editor-page-error-container'>
        <Typography.Text type='danger'>加载 DSL 数据失败：{dslDataStoreSnapshot.error.message}</Typography.Text>
      </div>
    );
  }

  // 如果选中设计文档但没有 DSL 数据
  if (editorPageStoreSnapshot.selectedDocument?.type === 'design' && !dslDataStoreSnapshot.data) {
    return (
      <div className='editor-page-error-container'>
        <Typography.Text type='secondary'>未找到 DSL 数据</Typography.Text>
      </div>
    );
  }

  // 如果选中设计文档且组件识别上下文还在加载中
  if (editorPageStoreSnapshot.selectedDocument?.type === 'design' && componentDetectionStoreSnapshot.isLoading) {
    return (
      <div className='editor-page-loading-container'>
        <Spin size='large' />
        <div style={{ marginTop: 16, color: '#999', fontSize: 14 }}>初始化中...</div>
      </div>
    );
  }

  return (
    <>
      <Layout className='editor-page-main-layout'>
        {/* 左侧面板：文档管理 */}
        <Sider
          width={350}
          theme='light'
          collapsible
          collapsed={leftCollapsed}
          onCollapse={setLeftCollapsed}
          collapsedWidth={0}
          trigger={null}
          className='editor-page-sider'>
          <LayerTreePanel
            onDeleteDocument={handleDeleteDocument}
            onSave={handleSave}
            onGenerateCode={handleGenerateCodeV2}
          />
        </Sider>

        {/* 中间和右侧内容：根据文档类型切换 */}
        {editorPageStoreSnapshot.selectedDocument?.type === 'design' && dslDataStoreSnapshot.data && (
          <>
            <Layout>
              <Content className='editor-page-content'>
                <div className='editor-page-header-toolbar'>
                  <Title level={5} className='editor-page-title'>
                    组件标注编辑器
                  </Title>
                  <Space>
                    <Button
                      size='small'
                      type={componentDetectionStoreSnapshot.showAllBorders ? 'primary' : 'default'}
                      icon={componentDetectionStoreSnapshot.showAllBorders ? <EyeOutlined /> : <EyeInvisibleOutlined />}
                      onClick={toggleShowAllBorders}
                      className='editor-page-button'>
                      框线
                    </Button>
                    <Button
                      type={is3DModalOpen ? 'primary' : 'default'}
                      size='small'
                      icon={<AppstoreOutlined />}
                      onClick={() => setIs3DModalOpen(true)}
                      className='editor-page-button'>
                      3D 检视
                    </Button>
                    <Button
                      type={isGuideOpen ? 'primary' : 'default'}
                      size='small'
                      icon={<QuestionCircleOutlined />}
                      onClick={() => setIsGuideOpen(true)}
                      className='editor-page-button'>
                      交互引导
                    </Button>
                    <Dropdown
                      menu={{
                        items: SCALE_OPTIONS,
                        onClick: ({ key }) => handleScaleChange(parseFloat(key)),
                      }}
                      trigger={['click']}>
                      <a onClick={(e) => e.preventDefault()}>
                        {Math.round(scale * 100)}% <DownOutlined />
                      </a>
                    </Dropdown>
                  </Space>
                </div>

                <div className='editor-page-canvas-container'>
                  <div
                    onClick={() => setLeftCollapsed(!leftCollapsed)}
                    className='editor-page-collapse-button editor-page-collapse-button-left'>
                    {leftCollapsed ? '▶' : '◀'}
                  </div>

                  <div
                    onClick={() => setRightCollapsed(!rightCollapsed)}
                    className='editor-page-collapse-button editor-page-collapse-button-right'>
                    {rightCollapsed ? '◀' : '▶'}
                  </div>

                  <div id='detection-canvas-container' className='editor-page-detection-canvas-container'>
                    <DetectionCanvas
                      dslData={dslDataStoreSnapshot.data as DSLData}
                      scale={scale}
                      onScaleChange={handleScaleChange}
                      highlightedNodeId={null}
                      hoveredNodeId={null}
                    />
                  </div>
                </div>
              </Content>
            </Layout>

            <Sider
              width={350}
              theme='light'
              collapsible
              collapsed={rightCollapsed}
              onCollapse={setRightCollapsed}
              collapsedWidth={0}
              trigger={null}
              className='editor-page-sider editor-page-right-sider'>
              <ComponentPropertyPanel />
            </Sider>
          </>
        )}

        {/* PRD 文档编辑器 */}
        {editorPageStoreSnapshot.selectedDocument?.type === 'prd' && (
          <Layout style={{ flex: 1 }}>
            <Content className='editor-page-content editor-page-content--no-padding'>
              <div
                onClick={() => setLeftCollapsed(!leftCollapsed)}
                className='editor-page-collapse-button editor-page-collapse-button-left'>
                {leftCollapsed ? '▶' : '◀'}
              </div>
              <PRDEditorPanel documentId={editorPageStoreSnapshot.selectedDocument?.id} />
            </Content>
          </Layout>
        )}

        {/* OpenAPI 数据面板 */}
        {editorPageStoreSnapshot.selectedDocument?.type === 'openapi' && (
          <>
            <Layout>
              <Content className='editor-page-content editor-page-content--no-padding'>
                <div
                  onClick={() => setLeftCollapsed(!leftCollapsed)}
                  className='editor-page-collapse-button editor-page-collapse-button-left'>
                  {leftCollapsed ? '▶' : '◀'}
                </div>

                <div
                  onClick={() => setRightCollapsed(!rightCollapsed)}
                  className='editor-page-collapse-button editor-page-collapse-button-right'>
                  {rightCollapsed ? '◀' : '▶'}
                </div>

                <OpenAPIUrlPanel
                  selectedApiId={editorPageStoreSnapshot.selectedDocument?.id || undefined}
                  onSelectApi={handleSelectOpenApi}
                />
              </Content>
            </Layout>

            <Sider
              width={350}
              theme='light'
              collapsible
              collapsed={rightCollapsed}
              onCollapse={setRightCollapsed}
              collapsedWidth={0}
              trigger={null}
              className='editor-page-sider editor-page-right-sider'>
              <OpenAPIDataPanel selectedApiId={editorPageStoreSnapshot.selectedDocument?.id || undefined} />
            </Sider>
          </>
        )}

        {/* 没有选中任何文档时的提示 */}
        {!editorPageStoreSnapshot.selectedDocument && (
          <Layout style={{ flex: 1 }}>
            <Content
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgb(255, 255, 255)',
              }}>
              <div
                onClick={() => setLeftCollapsed(!leftCollapsed)}
                className='editor-page-collapse-button editor-page-collapse-button-left'>
                {leftCollapsed ? '▶' : '◀'}
              </div>
              <Typography.Text type='secondary'>请从左侧选择一个文档开始编辑</Typography.Text>
            </Content>
          </Layout>
        )}
      </Layout>
      <AnnotationConfirmModal
        open={isAnnotationConfirmOpen}
        rootAnnotation={componentDetectionStoreSnapshot.rootAnnotation as AnnotationNode | null}
        selectedDocumentId={
          editorPageStoreSnapshot.selectedDocument?.type === 'design'
            ? editorPageStoreSnapshot.selectedDocument.id
            : undefined
        }
        onCancel={handleAnnotationConfirmCancel}
        onConfirm={handleAnnotationConfirmSubmit}
      />
      <Component3DInspectModal open={is3DModalOpen} onClose={() => setIs3DModalOpen(false)} />
      <InteractionGuideOverlay open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <CodeGenerationDrawer open={codeGenerationStoreSnapshot.isDrawerOpen} onClose={handleCloseCodeDrawer} />
    </>
  );
};

// Main component with provider
const EditorPageComponentDetect: React.FC = () => {
  return (
    <AntApp>
      <EditorPageContent />
    </AntApp>
  );
};

export default EditorPageComponentDetect;
