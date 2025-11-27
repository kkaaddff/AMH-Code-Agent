import { modelMetricsService } from '@/services/modelMetricsService';
import type { ModelMetricsSnapshot } from '@/types/modelMetrics';
import { DocumentReference } from '@/types/project';
import { getDocumentStatusColor, getDocumentStatusText } from '@/utils/documentStatus';
import {
  ApiOutlined,
  CloseOutlined,
  DeleteOutlined,
  DownOutlined,
  FileImageOutlined,
  FileTextOutlined,
  FlagOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { App, Button, Collapse, Form, Input, List, Modal, Space, Tag, Tooltip, Tree, Typography } from 'antd';
import React, { useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';
import { TDocumentKeys } from '../../constants';
import { designDetectionActions, designDetectionStore, useDesignTreeData } from '../../contexts/DesignDetectionContext';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import { extractDesignIdFromTopLevelKey, findTopLevelKey } from './utils';
import './index.css';

const { Title, Text } = Typography;
type ModelStatus = 'busy' | 'idle' | 'unknown' | 'error';
const DEFAULT_ACTIVE_KEY = ['design', 'openapi'];
interface LayerTreePanelProps {
  onDeleteDocument: (type: keyof typeof TDocumentKeys, id: string) => void;
  onSave?: () => void;
  onGenerateCode?: () => void;
}

const showLine = { showLeafIcon: false };

const evaluateModelStatus = (snapshot: ModelMetricsSnapshot | null): ModelStatus => {
  if (!snapshot) {
    return 'unknown';
  }
  const running = snapshot.numRequestsRunning ?? 0;
  const waiting = snapshot.numRequestsWaiting ?? 0;
  const kvUsage = snapshot.kvCacheUsagePerc ?? 0;

  if (waiting > 0 || running > 0 || kvUsage >= 0.85) {
    return 'busy';
  }
  return 'idle';
};

const formatPercent = (value?: number) => {
  if (value === undefined || Number.isNaN(value)) {
    return '未知';
  }
  return `${Math.round(value * 1000) / 10}%`;
};

const formatTimestamp = (value?: number) => {
  if (!value) {
    return '未采集';
  }
  return new Date(value).toLocaleTimeString();
};

const LayerTreePanel: React.FC<LayerTreePanelProps> = ({ onDeleteDocument, onSave, onGenerateCode }) => {
  const { currentPage, selectedDocument } = useSnapshot(editorPageStore);
  const { modal, message } = App.useApp();
  const { selectedAnnotation, expandedKeys } = useSnapshot(designDetectionStore);

  const [addDocModalVisible, setAddDocModalVisible] = useState(false);
  const [addDocType, setAddDocType] = useState<keyof typeof TDocumentKeys>('design');
  const [addDocForm] = Form.useForm();
  const [syncingStatus, setSyncingStatus] = useState<boolean>(false);
  const [modelMetrics, setModelMetrics] = useState<ModelMetricsSnapshot | null>(null);
  const [modelStatus, setModelStatus] = useState<ModelStatus>('unknown');
  const [modelStatusMessage, setModelStatusMessage] = useState<string>('');

  // 设置弹窗状态
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [settingsDocumentId, setSettingsDocumentId] = useState<string | null>(null);

  const handleSyncDesignDocument = async (doc: DocumentReference) => {
    setSyncingStatus(true);

    try {
      await editorPageActions.syncDocument('design', doc.id);
      await designDetectionActions.fetchDesignDocumentDSL(doc, { force: true });
      message.success('设计文档同步成功');
    } catch (error: any) {
      console.error(`设计文档同步失败: ${doc.id}`, error);
      const errorMessage = error?.message ?? '';
      if (errorMessage.includes('DSL')) {
        message.warning('设计文档同步已触发，DSL 数据暂未生成');
      } else {
        message.error(errorMessage || '设计文档同步失败');
      }
    } finally {
      setSyncingStatus(false);
    }
  };

  // 打开设置弹窗
  const handleOpenSettings = (documentId: string) => {
    setSettingsDocumentId(documentId);
    setSettingsModalVisible(true);
  };

  // 关闭设置弹窗
  const handleCloseSettings = () => {
    setSettingsModalVisible(false);
    setSettingsDocumentId(null);
  };

  // 设置为主页面
  const handleSetMainPage = async () => {
    if (!settingsDocumentId) return;

    const docState = designDetectionStore.designStoreMap[settingsDocumentId];
    if (!docState?.rootAnnotation) {
      message.error('未找到标注数据');
      return;
    }

    const currentIsMainPage = docState.rootAnnotation.isMainPage;
    await designDetectionActions.updateAnnotation(docState.rootAnnotation.id, {
      isMainPage: !currentIsMainPage,
    });
    await designDetectionActions.saveAnnotations(settingsDocumentId);
    await editorPageActions.refreshCurrentPage();

    message.success(currentIsMainPage ? '已取消主页面标记' : '已标记为主页面');
    handleCloseSettings();
  };

  // 删除设计文档
  const handleDeleteDesignDocument = () => {
    if (!settingsDocumentId) return;

    modal.confirm({
      title: '确认删除',
      content: '确定要删除这个设计文档吗？此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      centered: true,
      onOk: () => {
        onDeleteDocument('design', settingsDocumentId);
        handleCloseSettings();
      },
    });
  };

  // 重新同步设计文档（从设置弹窗触发）
  const handleResyncFromSettings = () => {
    if (!settingsDocumentId) return;

    const doc = currentPage?.designDocuments?.find((d) => d.id === settingsDocumentId);
    if (!doc) {
      message.error('未找到设计文档');
      return;
    }

    modal.confirm({
      title: '确认重新同步',
      content: '重新同步将从远程获取最新的设计数据，确定要继续吗？',
      okText: '确认同步',
      cancelText: '取消',
      centered: true,
      onOk: async () => {
        handleCloseSettings();
        await handleSyncDesignDocument(doc as DocumentReference);
      },
    });
  };

  // 获取当前设置文档的主页面状态
  const settingsDocIsMainPage = useMemo(() => {
    if (!settingsDocumentId) return false;
    const docState = designDetectionStore.designStoreMap[settingsDocumentId];
    return docState?.rootAnnotation?.isMainPage ?? false;
  }, [settingsDocumentId]);

  const designTreeData = useDesignTreeData({
    onSyncDesignDocument: handleSyncDesignDocument,
    onSettingsClick: handleOpenSettings,
    syncing: syncingStatus,
  });

  useEffect(() => {
    let isMounted = true;
    let polling = false;

    const pollMetrics = async () => {
      if (polling) {
        return;
      }
      polling = true;
      try {
        const response = await modelMetricsService.getLatest();
        if (!isMounted) {
          return;
        }
        const snapshot = response.data ?? null;
        setModelMetrics(snapshot);
        setModelStatus(evaluateModelStatus(snapshot));
        const nextMessage = response.message && response.message !== 'Success' ? response.message : '';
        setModelStatusMessage(nextMessage);
      } catch (error: any) {
        if (!isMounted) {
          return;
        }
        setModelStatus('error');
        setModelStatusMessage(error?.message ?? '无法获取模型指标');
      } finally {
        polling = false;
      }
    };

    // pollMetrics();
    // const timerId = window.setInterval(pollMetrics, 5000);
    return () => {
      isMounted = false;
      // clearInterval(timerId);
    };
  }, []);

  // 处理节点选择
  const handleDesignSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length === 0) {
      designDetectionActions.selectAnnotation(null);
      return;
    }

    const nextSelectedKey = selectedKeys[0] as string;
    const nextTopLevelKey = findTopLevelKey(designTreeData, nextSelectedKey);
    const designId = extractDesignIdFromTopLevelKey(nextTopLevelKey);

    if (designId && designId !== designDetectionStore.currentDesignId) {
      designDetectionActions.setActiveDesignDocument();
      editorPageActions.setSelectedDocument({
        type: 'design',
        id: designId,
      });
    }

    designDetectionActions.selectAnnotation(nextSelectedKey, false);
  };

  const modelStatusTag = useMemo(() => {
    const colorMap: Record<ModelStatus, string> = {
      busy: 'orange',
      idle: 'green',
      unknown: 'default',
      error: 'red',
    };
    const textMap: Record<ModelStatus, string> = {
      busy: '模型繁忙',
      idle: '模型空闲',
      unknown: '模型状态未知',
      error: '模型状态异常',
    };
    const running = modelMetrics?.numRequestsRunning ?? 0;
    const waiting = modelMetrics?.numRequestsWaiting ?? 0;
    const kvUsage = modelMetrics?.kvCacheUsagePerc;

    return (
      <Tooltip
        placement='topRight'
        title={
          <div className='layer-tree-panel__tooltip-content'>
            <div>{textMap[modelStatus]}</div>
            <div>运行中请求：{running}</div>
            <div>排队中请求：{waiting}</div>
            <div>KV 缓存使用率：{formatPercent(kvUsage)}</div>
            <div>最近采集时间：{formatTimestamp(modelMetrics?.fetchedAt)}</div>
            {modelStatusMessage && <div>提示：{modelStatusMessage}</div>}
          </div>
        }>
        <Tag color={colorMap[modelStatus]} className='layer-tree-panel__model-status-tag'>
          {textMap[modelStatus]}
        </Tag>
      </Tooltip>
    );
  }, [modelMetrics, modelStatus, modelStatusMessage]);

  // 处理展开/收起
  const handleDesignExpand = (expandedKeysValue: React.Key[]) => {
    designDetectionActions.setExpandedKeys(expandedKeysValue as string[]);
  };

  // 处理添加文档
  const handleAddDocumentClick = (type: keyof typeof TDocumentKeys) => {
    setAddDocType(type);
    setAddDocModalVisible(true);
  };

  const handleAddDocumentSubmit = async (values: { url: string; name?: string }) => {
    try {
      // 根据文档类型，获取当前的所有文档 URL
      const currentDocs = currentPage?.[TDocumentKeys[addDocType]];
      if (!currentDocs) {
        message.error('获取当前文档失败');
        return;
      }
      const currentUrls = currentDocs.map((doc) => doc.url);
      // 添加新的 URL
      const updatedUrls = [...currentUrls, values.url];

      // 构建更新数据
      const updateData: { designUrls?: string[]; prdUrls?: string[]; openapiUrls?: string[] } = {};
      if (addDocType === 'design') {
        updateData.designUrls = updatedUrls;
      } else if (addDocType === 'prd') {
        updateData.prdUrls = updatedUrls;
      } else if (addDocType === 'openapi') {
        updateData.openapiUrls = updatedUrls;
      }

      // 通过 context 更新页面
      await editorPageActions.updatePage(updateData);

      message.success('文档添加成功');
      setAddDocModalVisible(false);
      addDocForm.resetFields();
    } catch (error: any) {
      console.error('添加文档失败:', error);
      message.error(error.message || '添加文档失败');
    }
  };

  // 处理删除文档
  const handleDeleteDocumentClick = (type: 'design' | 'prd' | 'openapi', id: string) => {
    modal.confirm({
      title: '确认删除',
      content: '确定要删除这个文档吗？此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: () => {
        onDeleteDocument(type, id);
      },
    });
  };

  // 渲染文档列表项
  const renderDocumentItem = (doc: DocumentReference, type: keyof typeof TDocumentKeys) => {
    const isSelected = selectedDocument?.type === type && selectedDocument?.id === doc.id;
    const itemClassName = `layer-tree-panel__doc-item${isSelected ? ' layer-tree-panel__doc-item--selected' : ''}`;
    return (
      <List.Item
        key={doc.id}
        className={itemClassName}
        onClick={() => editorPageActions.setSelectedDocument({ type, id: doc.id })}
        actions={[
          <Button
            key='delete'
            type='text'
            size='small'
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteDocumentClick(type, doc.id);
            }}
          />,
        ]}>
        <List.Item.Meta
          title={
            <Space>
              <Text strong>{doc.name || `文档 ${doc.id.substring(0, 6)}`}</Text>
              <Tag color={getDocumentStatusColor(doc.status)} className='layer-tree-panel__doc-tag'>
                {getDocumentStatusText(doc.status)}
              </Tag>
            </Space>
          }
          description={
            <Text type='secondary' className='layer-tree-panel__doc-desc' ellipsis>
              <LinkOutlined /> {doc.url}
            </Text>
          }
        />
      </List.Item>
    );
  };

  // Construct Collapse items for Ant Design v5+/rc-collapse
  const collapseItems = [
    {
      key: 'design',
      label: (
        <Space>
          <FileImageOutlined className='layer-tree-panel__icon--design' />
          <span>设计</span>
        </Space>
      ),
      extra: (
        <Button
          type='text'
          size='small'
          icon={<PlusOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleAddDocumentClick('design');
          }}
        />
      ),
      /* 当选中设计文档时，显示标注树 */
      children:
        designTreeData.length > 0 ? (
          <Tree
            treeData={designTreeData}
            selectedKeys={selectedDocument?.type === 'design' && selectedAnnotation?.id ? [selectedAnnotation.id] : []}
            expandedKeys={expandedKeys as string[]}
            onSelect={handleDesignSelect}
            onExpand={handleDesignExpand}
            switcherIcon={<DownOutlined />}
            showLine={showLine}
            showIcon
            blockNode
          />
        ) : (
          <Text type='secondary' className='layer-tree-panel__empty-text'>
            暂无标注结构
          </Text>
        ),
    },
    {
      key: 'prd',
      label: (
        <Space>
          <FileTextOutlined className='layer-tree-panel__icon--prd' />
          <span>文档</span>
        </Space>
      ),
      extra: (
        <Button
          type='text'
          size='small'
          icon={<PlusOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleAddDocumentClick('prd');
          }}
        />
      ),
      children:
        currentPage?.prdDocuments && currentPage.prdDocuments.length > 0 ? (
          <List
            size='small'
            dataSource={currentPage.prdDocuments as DocumentReference[]}
            renderItem={(doc) => renderDocumentItem(doc, 'prd')}
          />
        ) : (
          <Text type='secondary' className='layer-tree-panel__empty-text'>
            暂无PRD文档
          </Text>
        ),
    },
    {
      key: 'openapi',
      label: (
        <Space>
          <ApiOutlined className='layer-tree-panel__icon--openapi' />
          <span>数据</span>
        </Space>
      ),
      extra: (
        <Button
          type='text'
          size='small'
          icon={<PlusOutlined />}
          onClick={(e) => {
            e.stopPropagation();
            handleAddDocumentClick('openapi');
          }}
        />
      ),
      children:
        currentPage?.openapiDocuments && currentPage.openapiDocuments.length > 0 ? (
          <List
            size='small'
            dataSource={currentPage.openapiDocuments as DocumentReference[]}
            renderItem={(doc) => renderDocumentItem(doc, 'openapi')}
          />
        ) : (
          <Text type='secondary' className='layer-tree-panel__empty-text'>
            暂无OpenAPI文档
          </Text>
        ),
    },
  ];

  return (
    <div className='layer-tree-panel'>
      {/* Header */}
      <div className='layer-tree-panel__header'>
        <Title level={5} className='layer-tree-panel__header-title'>
          页面管理 - {currentPage?.name}
        </Title>
      </div>

      {/* Collapse Panels */}
      <div className='layer-tree-panel__content'>
        <Collapse
          size='small'
          defaultActiveKey={DEFAULT_ACTIVE_KEY}
          expandIconPosition='end'
          className='layer-tree-panel__collapse'
          items={collapseItems.filter((item) => item.key !== 'prd')}
        />
      </div>

      {/* Footer */}
      <div className='layer-tree-panel__footer'>
        <div className='layer-tree-panel__footer-inner'>
          <Button
            type='primary'
            size='small'
            icon={<SaveOutlined />}
            onClick={onSave}
            className='layer-tree-panel__save-btn'>
            保存
          </Button>
          <div
            role='button'
            tabIndex={0}
            className='gradient-action-button gradient-action-button--wide'
            onClick={onGenerateCode}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onGenerateCode?.();
              }
            }}>
            <ThunderboltOutlined />
            <span>生成代码</span>
          </div>
          {modelStatusTag}
        </div>
      </div>

      {/* 添加文档模态框 */}
      <Modal
        title={`添加${addDocType === 'design' ? '设计稿' : addDocType === 'prd' ? 'PRD文档' : 'OpenAPI文档'}`}
        open={addDocModalVisible}
        onCancel={() => {
          setAddDocModalVisible(false);
          addDocForm.resetFields();
        }}
        footer={null}>
        <Form form={addDocForm} layout='vertical' onFinish={handleAddDocumentSubmit}>
          <Form.Item label='文档名称' name='name'>
            <Input placeholder='请输入文档名称（可选）' autoComplete='off' />
          </Form.Item>
          <Form.Item
            label='文档地址'
            name='url'
            rules={[
              { required: true, message: '请输入文档地址' },
              { type: 'url', message: '请输入有效的URL' },
            ]}>
            <Input
              placeholder={
                addDocType === 'design'
                  ? 'https://mastergo.com/...'
                  : addDocType === 'prd'
                  ? 'https://docs.company.com/...'
                  : 'https://api.company.com/openapi.json'
              }
              prefix={
                addDocType === 'design' ? (
                  <FileImageOutlined />
                ) : addDocType === 'prd' ? (
                  <FileTextOutlined />
                ) : (
                  <ApiOutlined />
                )
              }
            />
          </Form.Item>
          <Form.Item className='layer-tree-panel__form-footer'>
            <Space className='layer-tree-panel__form-actions'>
              <Button
                onClick={() => {
                  setAddDocModalVisible(false);
                  addDocForm.resetFields();
                }}>
                取消
              </Button>
              <Button type='primary' htmlType='submit'>
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 设计文档设置弹窗 */}
      <Modal
        title='设计文档设置'
        open={settingsModalVisible}
        onCancel={handleCloseSettings}
        footer={null}
        width={320}
        centered>
        <Space direction='vertical' className='layer-tree-panel__settings-actions' size='middle'>
          <Button block icon={<ReloadOutlined />} onClick={handleResyncFromSettings} loading={syncingStatus}>
            重新同步
          </Button>
          <Button
            block
            icon={<FlagOutlined />}
            onClick={handleSetMainPage}
            type={settingsDocIsMainPage ? 'primary' : 'default'}>
            {settingsDocIsMainPage ? '取消主页面标记' : '标记为 Main Page'}
          </Button>
          <Button block danger icon={<DeleteOutlined />} onClick={handleDeleteDesignDocument}>
            删除
          </Button>
          <Button block icon={<CloseOutlined />} onClick={handleCloseSettings}>
            退出
          </Button>
        </Space>
      </Modal>
    </div>
  );
};

export default LayerTreePanel;
