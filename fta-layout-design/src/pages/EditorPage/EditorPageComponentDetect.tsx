import { ModelConfigModal } from '@/components/ModelConfigModal';
import type { DesignData } from '@/types/dsl';
import { apiServices } from '@/services';
import { DSLCleaner } from '@fta/shared';
import {
  AppstoreOutlined,
  BorderOutlined,
  ClearOutlined,
  DeploymentUnitOutlined,
  DownOutlined,
  ExclamationCircleOutlined,
  QuestionCircleOutlined,
  ReloadOutlined,
  SettingOutlined,
  TableOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { App as AntApp, App, Button, Dropdown, Layout, Spin, Switch, Typography } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import { useSnapshot } from 'valtio/react';
import AnnotationConfirmModal from './components/AnnotationConfirmModal';
import CodeGenerationDrawer from './components/CodeGenerationDrawer';
import Component3DInspectModal from './components/Component3DInspectModal';
import ComponentPropertyPanel from './components/ComponentPropertyPanel';
import DataModelCreateModal from './components/DataModelCreateModal';
import DataModelDetailModal from './components/DataModelDetailModal';
import DataModelGroupPanel from './components/DataModelGroupPanel';
import DataModelListPanel from './components/DataModelListPanel';
import DetectionCanvas from './components/DetectionCanvas';
import DSL3DInspectModal from './components/DSL3DInspectModal';
import InteractionGuideOverlay from './components/InteractionGuideOverlay';
import LayerTreePanel from './components/LayerTreePanel';
import PRDEditorPanel from './components/PRDEditorPanel';
import RestApiCreateModal from './components/RestApiCreateModal';
import RestApiDetailModal from './components/RestApiDetailModal';
import RestApiGroupPanel from './components/RestApiGroupPanel';
import RestApiListPanel from './components/RestApiListPanel';
import type { SmartDetectionHandle } from './components/SmartDetection';
import SmartDetection from './components/SmartDetection';
import { TDocumentKeys } from './constants';
import { codeGenerationActions, codeGenerationStore } from './contexts/CodeGenerationContext';
import { designDetectionActions, designDetectionStore } from './contexts/DesignDetectionContext';
import { editorPageActions, editorPageStore } from './contexts/EditorPageContext';
import './EditorPageComponentDetect.css';
import { FrontendWorkflowScheduler } from './services/FrontendWorkflowScheduler';
import type { AnnotationNode } from './types/componentDetection';
import { DocumentReference } from '@/types/project';

const { Sider, Content } = Layout;
const { Title } = Typography;

const SCALE_OPTIONS = [
  { key: '0.25', label: '25%' },
  { key: '0.5', label: '50%' },
  { key: '0.75', label: '75%' },
  { key: '1', label: '100%' },
];

const EditorPageContent: React.FC = () => {
  const { message, modal } = App.useApp();

  const editorPageStoreSnapshot = useSnapshot(editorPageStore);
  const { setPageId, setProjectId, fetchPageDetail, deleteDocument } = editorPageActions;

  const { toggleShowAllBorders, saveAnnotations, setActiveDesignDocument, fetchDesignDocumentDSL } =
    designDetectionActions;
  const componentDetectionStoreSnapshot = useSnapshot(designDetectionStore);

  const codeGenerationStoreSnapshot = useSnapshot(codeGenerationStore);
  const {
    openDrawer: openCodeDrawer,
    closeDrawer: closeCodeDrawer,
    startGeneration,
    setGenerationStatus,
    addThoughtItem,
    updateThoughtItem,
    appendToThoughtContent,
    updateTodos,
    setCurrentIteration,
    clearThoughtChain,
  } = codeGenerationActions;

  const [scale, setScale] = useState(0.5);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [is3DModalOpen, setIs3DModalOpen] = useState(false);
  const [isDSL3DModalOpen, setIsDSL3DModalOpen] = useState(false);
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [isAnnotationConfirmOpen, setIsAnnotationConfirmOpen] = useState(false);
  const [isSmartDetecting, setIsSmartDetecting] = useState(false);
  // 数据管理相关弹窗状态
  const [modelConfigModalOpen, setModelConfigModalOpen] = useState(false);
  // 数据管理相关弹窗状态
  const [dataModelCreateModalOpen, setDataModelCreateModalOpen] = useState(false);
  const [dataModelDetailModalOpen, setDataModelDetailModalOpen] = useState(false);
  const [restApiCreateModalOpen, setRestApiCreateModalOpen] = useState(false);
  const [restApiDetailModalOpen, setRestApiDetailModalOpen] = useState(false);
  const [isCleanAndRefreshLoading, setIsCleanAndRefreshLoading] = useState(false);

  // Frontend Workflow Scheduler
  const schedulerRef = useRef<FrontendWorkflowScheduler | null>(null);
  const smartDetectionRef = useRef<SmartDetectionHandle | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const _pageId = params.get('pageId');
    const _projectId = params.get('projectId');

    setPageId(_pageId || '');
    setProjectId(_projectId || '');

    const initPageData = async () => {
      if (!_pageId) {
        return;
      }
      try {
        await fetchPageDetail(_pageId);
        // 加载数据模型和 REST API
        editorPageActions.loadAllDataView();
      } catch (error: any) {
        message.error('获取页面数据失败');
      }
    };

    initPageData();
  }, []);

  // 初始化 DSL 数据和加载已保存的标注信息
  const selectedDocument = editorPageStoreSnapshot.selectedDocument;

  useEffect(() => {
    if (!selectedDocument || selectedDocument.type !== 'design' || !selectedDocument.id) {
      return;
    }
    setActiveDesignDocument();
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

  const handleCleanAndRefreshDSL = async () => {
    const { selectedDocument } = editorPageStoreSnapshot;
    if (!selectedDocument?.id) {
      message.error('请提供设计稿 ID 参数');
      return;
    }
    if (!designDetectionStore.designData?.dsl?.nodes?.length) {
      message.error('当前设计稿没有可清洗的 DSL 数据');
      return;
    }

    setIsCleanAndRefreshLoading(true);
    try {
      const cleaner = new DSLCleaner({
        removeEmptyNodes: true,
        detectIcons: false,
        iconMaxSize: 80,
        verbose: true,
      });

      const cleanResult = cleaner.clean({
        dsl: designDetectionStore.designData.dsl,
      });

      const cleanedDslData: DesignData = {
        dsl: {
          styles: designDetectionStore.designData.dsl.styles,
          nodes: cleanResult.nodes as any,
        },
      };

      const updatedDocument = await apiServices.project.updateDocument({
        id: selectedDocument.id,
        data: cleanedDslData,
      });

      await fetchDesignDocumentDSL(updatedDocument, { force: true });
      message.success('DSL 已清洗并刷新');
    } catch (error: any) {
      console.error('清洗并刷新 DSL 失败', error);
      message.error(error?.message ?? '清洗并刷新 DSL 失败');
    } finally {
      setIsCleanAndRefreshLoading(false);
    }
  };

  const confirmCleanAndRefreshDSL = () => {
    modal.warning({
      title: '确认清洗并刷新 DSL？',
      icon: <ExclamationCircleOutlined />,
      content: (
        <span>
          <strong style={{ color: '#faad14' }}>⚡ 基于规则引擎的自动化清洗</strong>
          <br />
          将对当前设计稿进行清洗并保存刷新，可能会调整节点结构。
        </span>
      ),
      okText: '确认',
      cancelText: '取消',
      onOk: () => handleCleanAndRefreshDSL(),
    });
  };

  const handleGenerateCode = async () => {
    await handleSave();

    if (codeGenerationStoreSnapshot.generationStatus === 'generating') {
      message.info('代码生成进行中，请稍候');
      openCodeDrawer();
      return;
    }

    // 打开抽屉并清空之前的数据
    openCodeDrawer();
    clearThoughtChain();

    // 当前迭代的思维链 ID（在 try 块外定义，以便在 catch 块中访问）
    let currentIterationThoughtId: string | null = null;
    const sessionId = `session-${Date.now()}`;

    // 初始化或重置 scheduler
    if (!schedulerRef.current) {
      schedulerRef.current = new FrontendWorkflowScheduler();
    } else {
      // 中断之前的连接
      schedulerRef.current.abort();
    }

    const scheduler = schedulerRef.current;

    try {
      // 启动生成状态
      startGeneration(sessionId);

      // 执行 SSE 会话
      await scheduler.execute(
        {
          designDocId: selectedDocument!.id!,
          productName: 'FTA-Frontend',
          srcTree: window.workspaceInfo?.srcTree || undefined,
        },
        {
          onIterationStart: (iteration) => {
            setCurrentIteration(iteration);

            // 创建新的迭代项
            const thoughtId = `iteration-${sessionId}-${iteration}`;
            currentIterationThoughtId = thoughtId;
            addThoughtItem({
              id: thoughtId,
              title: `第 ${iteration} 轮调用`,
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
            updateTodos(todos);
          },

          onIterationEnd: () => {
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
            setGenerationStatus('completed');
          },

          onError: (errorMessage) => {
            console.error('代码生成失败:', errorMessage);
            message.error({
              content: `代码生成失败: ${errorMessage}`,
              key: 'generate-code',
            });

            // 如果有正在进行的迭代，标记为失败
            if (currentIterationThoughtId) {
              updateThoughtItem(currentIterationThoughtId, {
                status: 'error',
                finishedAt: new Date().toISOString(),
              });
            }

            setGenerationStatus('failed');
          },
        }
      );
    } catch (error: any) {
      // 如果是 AbortError，说明用户主动中断
      if (error.name === 'AbortError') {
        console.log('代码生成已被用户中断');
        message.warning({
          content: '代码生成已被中断',
          key: 'generate-code',
        });

        // 如果有正在进行的迭代，标记为失败并添加中断标记
        if (currentIterationThoughtId) {
          const currentItem = codeGenerationStore.thoughtChainItems.find(
            (item) => item.id === currentIterationThoughtId
          );
          updateThoughtItem(currentIterationThoughtId, {
            status: 'error',
            content: (currentItem?.content || '') + '\n\n*已被用户中断*',
            finishedAt: new Date().toISOString(),
          });
        }

        setGenerationStatus('failed');
      } else {
        console.error('代码生成失败:', error);
        message.error({
          content: `代码生成失败: ${error?.message || '未知错误'}`,
          key: 'generate-code',
        });

        // 如果有正在进行的迭代，标记为失败
        if (currentIterationThoughtId) {
          updateThoughtItem(currentIterationThoughtId, {
            status: 'error',
            finishedAt: new Date().toISOString(),
          });
        }

        setGenerationStatus('failed');
      }
    }
  };
  // 中断 SSE 请求
  const abortGeneration = () => {
    schedulerRef.current?.abort();
    setGenerationStatus('failed');
    closeCodeDrawer();
  };

  const handleGenerateCodeV2 = () => {
    const { selectedDocument } = editorPageStoreSnapshot;
    const { rootAnnotation } = componentDetectionStoreSnapshot;
    if (!selectedDocument?.id || !rootAnnotation) {
      message.error(!selectedDocument?.id ? '请提供设计稿 ID 参数' : '当前没有可确认的标注数据');
      return;
    }

    setIsAnnotationConfirmOpen(true);
  };

  const handleAnnotationConfirmSubmit = async () => {
    setIsAnnotationConfirmOpen(false);
    await handleGenerateCode();
  };

  const handleAnnotationConfirmCancel = () => {
    setIsAnnotationConfirmOpen(false);
  };

  // 智能识别处理函数
  const handleSmartDetection = async () => {
    if (isSmartDetecting) {
      message.info('智能识别进行中，请稍候');
      return;
    }

    const rootAnnotation = componentDetectionStoreSnapshot.rootAnnotation;
    const hasExistingAnnotations = rootAnnotation && rootAnnotation.children?.length > 0;

    if (!hasExistingAnnotations) {
      const instance = modal.confirm({
        title: '智能识别是什么？',
        content: (
          <div>
            <div style={{ fontWeight: 500, marginBottom: 8 }}>
              智能识别会自动分析设计稿，尝试识别页面结构和组件。该功能仍在持续优化中，存在如下局限与注意事项：
            </div>
            <ul style={{ paddingLeft: 20, marginBottom: 8 }}>
              <li>识别结果仅供参考，可能需手动调整和确认。</li>
              <li>复杂布局、非标准组件或图形类元素可能无法完整还原。</li>
              <li>重复识别会覆盖现有标注，请谨慎操作。</li>
              <li>如遇识别卡顿/失败，可刷新页面后重试。</li>
            </ul>
            <div>
              <span>将对当前设计稿执行智能识别并生成标注数据，确认继续操作吗？</span>
            </div>
          </div>
        ),
        okText: '开始智能识别',
        cancelText: '取消',
        okType: 'primary',
        centered: true,
        onOk: () => {
          smartDetectionRef.current?.runDetection();
          instance.destroy();
        },
      });
    } else {
      const instance = modal.confirm({
        title: '确认重新执行智能识别？',
        content: '当前设计稿已存在标注，重新识别可能产生重复或冲突，请确认是否继续。',
        okText: '继续识别',
        cancelText: '取消',
        okType: 'danger',
        centered: true,
        onOk: () => {
          smartDetectionRef.current?.runDetection();
          instance.destroy();
        },
      });
    }
  };

  // 智能识别状态变化回调
  const handleSmartDetectionChange = (detecting: boolean) => {
    setIsSmartDetecting(detecting);
  };

  // 处理删除文档
  const handleDeleteDocument = async (type: keyof typeof TDocumentKeys, docId: string) => {
    try {
      await deleteDocument(type, docId);
      message.success('文档删除成功');
    } catch (error: any) {
      console.error('删除文档失败:', error);
      message.error(error.message || '删除文档失败');
    }
  };

  // 如果页面数据加载失败
  if (editorPageStoreSnapshot.pageError) {
    return (
      <div className='editor-page-error-container'>
        <Typography.Text type='danger'>加载页面数据失败：{editorPageStoreSnapshot.pageError}</Typography.Text>
      </div>
    );
  }

  return (
    <>
      <Spin spinning={editorPageStoreSnapshot.pageLoading} size='large' tip='加载页面数据...'>
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
              onGenerateCode={handleGenerateCode}
            />
          </Sider>

          {/* 中间内容区域包装器 - 包含折叠按钮和文档内容 */}
          <div className='editor-page-content-wrapper'>
            {/* 左侧折叠按钮 - 与文档类型无关 */}
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

            {/* 设计文档编辑器 */}
            {editorPageStoreSnapshot.selectedDocument?.type === 'design' && (
              <Layout className='editor-page-flex-layout'>
                <Content className='editor-page-content'>
                  <div className='editor-page-header-toolbar'>
                    <Title level={5} className='editor-page-title'>
                      组件标注编辑器
                    </Title>
                    <div className='editor-page-toolbar-actions'>
                      <Button
                        type='primary'
                        size='small'
                        icon={<DeploymentUnitOutlined />}
                        onClick={() => setIsDSL3DModalOpen(true)}
                        className='editor-page-button'
                        data-testid='dsl-3d-button'>
                        设计稿优化
                      </Button>

                      <Switch
                        checked={componentDetectionStoreSnapshot.showAllBorders}
                        onChange={toggleShowAllBorders}
                        checkedChildren={<TableOutlined />}
                        unCheckedChildren={<BorderOutlined />}
                      />
                      <Button
                        type={is3DModalOpen ? 'primary' : 'default'}
                        size='small'
                        icon={<AppstoreOutlined />}
                        onClick={() => setIs3DModalOpen(true)}
                        className='editor-page-button'>
                        3D 检视
                      </Button>
                      <div
                        role='button'
                        tabIndex={isSmartDetecting ? -1 : 0}
                        aria-disabled={isSmartDetecting}
                        className={`gradient-action-button ${isSmartDetecting ? 'is-disabled' : ''}`}
                        onClick={isSmartDetecting ? undefined : handleSmartDetection}>
                        <ThunderboltOutlined />
                        <span>{isSmartDetecting ? '智能识别中...' : '智能识别'}</span>
                      </div>
                      <Button
                        type={isGuideOpen ? 'primary' : 'default'}
                        size='small'
                        icon={<QuestionCircleOutlined />}
                        onClick={() => setIsGuideOpen(true)}
                        className='editor-page-button'>
                        交互引导
                      </Button>
                      <Button
                        type='default'
                        size='small'
                        icon={<SettingOutlined />}
                        onClick={() => setModelConfigModalOpen(true)}
                        className='editor-page-button'>
                        模型配置
                      </Button>
                      <Button
                        type='default'
                        danger
                        size='small'
                        icon={<ClearOutlined />}
                        loading={isCleanAndRefreshLoading}
                        onClick={confirmCleanAndRefreshDSL}
                        className='editor-page-button'
                      />
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
                    </div>
                  </div>

                  <div className='editor-page-canvas-container'>
                    <div id='detection-canvas-container' className='editor-page-detection-canvas-container'>
                      <DetectionCanvas
                        designData={designDetectionStore.designData as DesignData}
                        scale={scale}
                        onScaleChange={handleScaleChange}
                        highlightedNodeId={null}
                        hoveredNodeId={null}
                      />
                    </div>
                  </div>
                </Content>
              </Layout>
            )}

            {/* PRD 文档编辑器 */}
            {editorPageStoreSnapshot.selectedDocument?.type === 'prd' && (
              <Layout className='editor-page-flex-layout'>
                <Content className='editor-page-content editor-page-content--no-padding'>
                  <PRDEditorPanel documentId={editorPageStoreSnapshot.selectedDocument?.id} />
                </Content>
              </Layout>
            )}

            {/* 数据管理面板 - 根据 dataViewType 显示 */}
            {editorPageStoreSnapshot.selectedDocument?.type === 'openapi' && (
              <Layout className='editor-page-flex-layout'>
                <Content className='editor-page-content editor-page-content--no-padding'>
                  {editorPageStoreSnapshot.dataViewType === 'dataModel' ? (
                    <DataModelListPanel
                      onCreateClick={() => setDataModelCreateModalOpen(true)}
                      onItemClick={() => setDataModelDetailModalOpen(true)}
                    />
                  ) : (
                    <RestApiListPanel
                      onCreateClick={() => setRestApiCreateModalOpen(true)}
                      onItemClick={() => setRestApiDetailModalOpen(true)}
                    />
                  )}
                </Content>
              </Layout>
            )}

            {/* 没有选中任何文档时的提示 */}
            {!editorPageStoreSnapshot.selectedDocument && (
              <Layout className='editor-page-flex-layout'>
                <Content className='editor-page-empty-content'>
                  <Typography.Text type='secondary'>请从左侧选择一个文档开始编辑</Typography.Text>
                </Content>
              </Layout>
            )}
          </div>

          {/* 右侧面板 - 根据文档类型显示不同内容 */}
          <Sider
            width={350}
            theme='light'
            collapsible
            collapsed={rightCollapsed}
            onCollapse={setRightCollapsed}
            collapsedWidth={0}
            trigger={null}
            className='editor-page-sider editor-page-right-sider'>
            {editorPageStoreSnapshot.selectedDocument?.type === 'design' ? (
              <ComponentPropertyPanel />
            ) : editorPageStoreSnapshot.selectedDocument?.type === 'openapi' ? (
              editorPageStoreSnapshot.dataViewType === 'dataModel' ? (
                <DataModelGroupPanel />
              ) : (
                <RestApiGroupPanel />
              )
            ) : (
              <div style={{ padding: 24, textAlign: 'center', color: '#aaa' }}>暂无内容</div>
            )}
          </Sider>
        </Layout>
      </Spin>

      {/* 数据模型创建弹窗 */}
      <DataModelCreateModal open={dataModelCreateModalOpen} onClose={() => setDataModelCreateModalOpen(false)} />

      {/* 数据模型详情弹窗 */}
      <DataModelDetailModal
        open={dataModelDetailModalOpen}
        modelId={editorPageStoreSnapshot.selectedDataModelId}
        onClose={() => setDataModelDetailModalOpen(false)}
      />

      {/* REST API 创建弹窗 */}
      <RestApiCreateModal open={restApiCreateModalOpen} onClose={() => setRestApiCreateModalOpen(false)} />

      {/* REST API 详情弹窗 */}
      <RestApiDetailModal
        open={restApiDetailModalOpen}
        apiId={editorPageStoreSnapshot.selectedRestApiId}
        onClose={() => setRestApiDetailModalOpen(false)}
      />

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
      <DSL3DInspectModal open={isDSL3DModalOpen} onClose={() => setIsDSL3DModalOpen(false)} />
      <InteractionGuideOverlay open={isGuideOpen} onClose={() => setIsGuideOpen(false)} />
      <CodeGenerationDrawer abortGeneration={abortGeneration} />
      <ModelConfigModal open={modelConfigModalOpen} onClose={() => setModelConfigModalOpen(false)} />

      {/* 智能识别动画组件 */}
      <SmartDetection ref={smartDetectionRef} onDetectingChange={handleSmartDetectionChange} />
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
