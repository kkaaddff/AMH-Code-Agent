import { projectService } from '@/services/projectService';
import { DSLData } from '@/types/dsl';
import { DocumentReference } from '@/types/project';
import { api } from '@/utils/apiService';
import { getDocumentStatusColor, getDocumentStatusText } from '@/utils/documentStatus';
import {
  ApiOutlined,
  CompressOutlined,
  DeleteOutlined,
  DownOutlined,
  ExpandOutlined,
  FileImageOutlined,
  FileOutlined,
  FileTextOutlined,
  FolderOutlined,
  LinkOutlined,
  PlusOutlined,
  ReloadOutlined,
  SaveOutlined,
  SettingOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { App, Button, Collapse, Form, Input, List, Modal, Space, Tag, Tooltip, Tree, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import React, { useEffect, useMemo, useState } from 'react';
import { useSnapshot } from 'valtio';
import { TDocumentKeys } from '../constants';
import { componentDetectionActions, componentDetectionStore } from '../contexts/ComponentDetectionContext';
import { editorPageActions, editorPageStore } from '../contexts/EditorPageContext';
import { AnnotationNode } from '../types/componentDetectionV2';

const { Title, Text } = Typography;

interface LayerTreePanelProps {
  onDeleteDocument: (type: keyof typeof TDocumentKeys, id: string) => void;
  onRefreshPage?: () => void;
  onSave?: () => void;
  onGenerateCode?: () => void;
}

const showLine = { showLeafIcon: false };

type DesignDocTreeStatus = 'pending' | 'loading' | 'ready' | 'error';

interface DesignDocTreeState {
  annotation: AnnotationNode | null;
  status: DesignDocTreeStatus;
}

const createRootAnnotationFromDSL = (dslData: DSLData, docId: string, docName?: string): AnnotationNode | null => {
  const rootNode = dslData?.dsl?.nodes?.[0];
  if (!rootNode) {
    return null;
  }

  const now = Date.now();
  return {
    id: `design-root-${docId}`,
    dslNodeId: rootNode.id,
    dslNode: rootNode,
    ftaComponent: 'View',
    name: docName || 'Page',
    isRoot: true,
    isContainer: true,
    children: [],
    absoluteX: 0,
    absoluteY: 0,
    width: rootNode.layoutStyle?.width || 720,
    height: rootNode.layoutStyle?.height || 1560,
    createdAt: now,
    updatedAt: now,
  };
};

// 转换AnnotationNode为Tree DataNode
const convertToTreeData = (
  node: AnnotationNode,
  options: { isFirstLevel?: boolean; isActiveDoc?: boolean; documentName?: string } = {}
): DataNode => {
  const { isFirstLevel = false, isActiveDoc = false, documentName } = options;
  const isRoot = node.isRoot;
  const isContainer = node.isContainer;

  const title = (
    <Space size={4} style={{ width: '100%', justifyContent: 'space-between' }}>
      <Space size={4}>
        {isContainer ? (
          <FolderOutlined style={{ color: isRoot ? 'rgb(82, 196, 26)' : 'rgb(24, 144, 255)' }} />
        ) : (
          <FileOutlined style={{ color: 'rgb(140, 140, 140)' }} />
        )}
        <span style={{ fontWeight: isRoot ? 600 : 400 }}>
          {node.name ? `${node.name} (${node.ftaComponent})` : node.ftaComponent}
          {/* {isRoot && documentName && (
            <span style={{ marginLeft: 8, fontSize: 12, color: 'rgba(0, 0, 0, 0.45)' }}>{documentName}</span>
          )} */}
        </span>
        {isRoot && <span style={{ fontSize: 12, color: 'rgb(82, 196, 26)' }}>[主页面]</span>}
      </Space>
      {isFirstLevel && isActiveDoc && (
        <Space size={4}>
          <Tooltip title='展开全部' color='#eee'>
            <Button
              type='text'
              size='small'
              icon={<ExpandOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                componentDetectionActions.expandAll();
              }}
            />
          </Tooltip>
          <Tooltip title='收起全部' color='#eee'>
            <Button
              type='text'
              size='small'
              icon={<CompressOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                componentDetectionActions.collapseAll();
              }}
            />
          </Tooltip>
          <Tooltip title='设置' color='#eee'>
            <Button
              type='text'
              size='small'
              icon={<SettingOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                // TODO: 添加设置功能
              }}
            />
          </Tooltip>
        </Space>
      )}
    </Space>
  );

  return {
    key: node.id,
    title,
    children: node.children.map((child) => convertToTreeData(child, { isActiveDoc })),
    isLeaf: node.children.length === 0,
    selectable: isActiveDoc,
  };
};

const LayerTreePanel: React.FC<LayerTreePanelProps> = ({ onDeleteDocument, onRefreshPage, onSave, onGenerateCode }) => {
  const { currentPage, selectedDocument } = useSnapshot(editorPageStore);
  const { pageId, projectId } = useSnapshot(editorPageStore);
  const { modal, message } = App.useApp();
  const { rootAnnotation, selectedAnnotationId, expandedKeys } = useSnapshot(componentDetectionStore);

  const [addDocModalVisible, setAddDocModalVisible] = useState(false);
  const [addDocType, setAddDocType] = useState<keyof typeof TDocumentKeys>('design');
  const [addDocForm] = Form.useForm();
  const [designDocStates, setDesignDocStates] = useState<Record<string, DesignDocTreeState>>({});
  const [syncingDocIds, setSyncingDocIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const designDocs = currentPage?.designDocuments ?? [];

    if (designDocs.length === 0) {
      setDesignDocStates({});
      return;
    }

    let cancelled = false;

    setDesignDocStates((prev) => {
      const next: Record<string, DesignDocTreeState> = {};
      designDocs.forEach((doc) => {
        next[doc.id] = prev[doc.id] ?? { annotation: null, status: 'loading' };
      });
      return next;
    });

    const fetchDesignDocDSL = async (doc: DocumentReference) => {
      try {
        const response = await api.project.document.getContent({ documentId: doc.id });
        const dslData: DSLData | undefined = response?.data?.data;
        if (!dslData) {
          throw new Error('没有获取到DSL数据');
        }

        const rootNode = createRootAnnotationFromDSL(dslData, doc.id, doc.name);
        if (cancelled) {
          return;
        }

        setDesignDocStates((prev) => {
          const next = { ...prev };
          next[doc.id] = {
            annotation: rootNode,
            status: rootNode ? 'ready' : 'error',
          };
          return next;
        });
      } catch (error) {
        console.error(`获取设计文档DSL失败: ${doc.id}`, error);
        if (cancelled) {
          return;
        }
        setDesignDocStates((prev) => {
          const next = { ...prev };
          next[doc.id] = {
            annotation: null,
            status: 'pending',
          };
          return next;
        });
      }
    };

    designDocs.forEach((doc) => {
      fetchDesignDocDSL(doc as DocumentReference);
    });

    return () => {
      cancelled = true;
    };
  }, [currentPage?.designDocuments]);

  const handleSyncDesignDocument = async (doc: DocumentReference) => {
    if (!projectId || !pageId) {
      message.error('缺少项目或页面信息');
      return;
    }

    setSyncingDocIds((prev) => ({ ...prev, [doc.id]: true }));

    setDesignDocStates((prev) => {
      const next = { ...prev };
      const current = next[doc.id];
      next[doc.id] = {
        annotation: current?.annotation ?? null,
        status: 'loading',
      };
      return next;
    });

    try {
      await projectService.syncDocument(projectId, pageId, 'design', doc.id);

      const response = await api.project.document.getContent({ documentId: doc.id });
      const dslData: DSLData | undefined = response?.data?.data;
      if (!dslData) {
        throw new Error('没有获取到DSL数据');
      }

      const rootNode = createRootAnnotationFromDSL(dslData, doc.id, doc.name);
      if (!rootNode) {
        throw new Error('DSL数据中缺少根节点');
      }

      setDesignDocStates((prev) => {
        const next = { ...prev };
        next[doc.id] = {
          annotation: rootNode,
          status: 'ready',
        };
        return next;
      });

      message.success('设计文档同步成功');
      if (onRefreshPage) {
        onRefreshPage();
      }
    } catch (error: any) {
      console.error(`设计文档同步失败: ${doc.id}`, error);
      const errorMessage = error?.message ?? '';
      if (errorMessage.includes('DSL')) {
        message.warning('设计文档同步已触发，DSL 数据暂未生成');
      } else {
        message.error(errorMessage || '设计文档同步失败');
      }
      setDesignDocStates((prev) => {
        const next = { ...prev };
        const current = next[doc.id];
        next[doc.id] = {
          annotation: current?.annotation ?? null,
          status: 'pending',
        };
        return next;
      });
    } finally {
      setSyncingDocIds((prev) => {
        const next = { ...prev };
        delete next[doc.id];
        return next;
      });
    }
  };

  // 生成Tree数据：合并所有设计文档
  const designTreeData: DataNode[] = useMemo(() => {
    const designDocs = currentPage?.designDocuments ?? [];
    if (designDocs.length === 0) {
      return [];
    }

    return designDocs
      .map((doc) => {
        const docState = designDocStates[doc.id];
        const isDesignSelected = selectedDocument?.type === 'design' && selectedDocument?.id === doc.id;
        const hasStoreAnnotation = isDesignSelected && rootAnnotation;
        const resolvedAnnotation = hasStoreAnnotation
          ? (rootAnnotation as AnnotationNode)
          : docState?.annotation ?? null;

        if (resolvedAnnotation) {
          return convertToTreeData(resolvedAnnotation, {
            isFirstLevel: true,
            isActiveDoc: Boolean(hasStoreAnnotation),
            documentName: doc.name || doc.id.substring(0, 6),
          });
        }

        const statusText =
          docState?.status === 'error' ? '加载失败' : docState?.status === 'pending' ? '待加载' : '加载中...';
        const iconColor = docState?.status === 'error' ? 'rgb(245, 34, 45)' : 'rgb(24, 144, 255)';

        const isPending = docState?.status === 'pending';

        const title = (
          <Space size={4} style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space size={4}>
              <FileImageOutlined style={{ color: iconColor }} />
              <span style={{ fontWeight: 500 }}>{doc.name || `文档 ${doc.id.substring(0, 6)}`}</span>
            </Space>
            {isPending ? (
              <Button
                type='link'
                size='small'
                icon={<ReloadOutlined />}
                loading={Boolean(syncingDocIds[doc.id])}
                onClick={(e) => {
                  e.stopPropagation();
                  handleSyncDesignDocument(doc as DocumentReference);
                }}
                style={{ padding: 0, fontSize: 12 }}>
                同步
              </Button>
            ) : (
              <Text type='secondary' style={{ fontSize: 12 }}>
                {statusText}
              </Text>
            )}
          </Space>
        );

        return {
          key: `design-doc-${doc.id}`,
          title,
          isLeaf: true,
          selectable: false,
        };
      })
      .filter(Boolean) as DataNode[];
  }, [currentPage?.designDocuments, designDocStates, selectedDocument, rootAnnotation, syncingDocIds]);

  // 处理节点选择
  const handleSelect = (selectedKeys: React.Key[]) => {
    if (selectedKeys.length > 0) {
      componentDetectionActions.selectAnnotation(selectedKeys[0] as string, false);
    } else {
      componentDetectionActions.selectAnnotation(null);
    }
  };

  // 处理展开/收起
  const handleExpand = (expandedKeysValue: React.Key[]) => {
    componentDetectionActions.setExpandedKeys(expandedKeysValue as string[]);
  };

  // 处理添加文档
  const handleAddDocumentClick = (type: keyof typeof TDocumentKeys) => {
    setAddDocType(type);
    setAddDocModalVisible(true);
  };

  const handleAddDocumentSubmit = async (values: { url: string; name?: string }) => {
    if (!projectId || !pageId) {
      message.error('缺少项目或页面信息');
      return;
    }

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

      // 调用 API 更新页面
      await projectService.updatePage(projectId, pageId, updateData);

      message.success('文档添加成功');
      setAddDocModalVisible(false);
      addDocForm.resetFields();

      // 刷新页面数据
      if (onRefreshPage) {
        onRefreshPage();
      }
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
    return (
      <List.Item
        key={doc.id}
        style={{
          cursor: 'pointer',
          backgroundColor: isSelected ? 'rgb(230, 247, 255)' : 'transparent',
          padding: '8px 12px',
          borderRadius: 4,
        }}
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
              <Tag color={getDocumentStatusColor(doc.status)} style={{ fontSize: 11 }}>
                {getDocumentStatusText(doc.status)}
              </Tag>
            </Space>
          }
          description={
            <Text type='secondary' style={{ fontSize: 12 }} ellipsis>
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
          <FileImageOutlined style={{ color: 'rgb(24, 144, 255)' }} />
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
            selectedKeys={selectedDocument?.type === 'design' && selectedAnnotationId ? [selectedAnnotationId] : []}
            expandedKeys={expandedKeys as string[]}
            onSelect={handleSelect}
            onExpand={handleExpand}
            switcherIcon={<DownOutlined />}
            showLine={showLine}
            showIcon
            blockNode
          />
        ) : (
          <Text type='secondary' style={{ display: 'block', padding: '8px 0', textAlign: 'center' }}>
            暂无标注结构
          </Text>
        ),
    },
    {
      key: 'prd',
      label: (
        <Space>
          <FileTextOutlined style={{ color: 'rgb(82, 196, 26)' }} />
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
      children: (
        <>
          {currentPage?.prdDocuments && currentPage.prdDocuments.length > 0 ? (
            <List
              size='small'
              dataSource={currentPage.prdDocuments as DocumentReference[]}
              renderItem={(doc) => renderDocumentItem(doc, 'prd')}
            />
          ) : (
            <Text type='secondary' style={{ display: 'block', padding: '8px 0', textAlign: 'center' }}>
              暂无PRD文档
            </Text>
          )}
        </>
      ),
    },
    {
      key: 'openapi',
      label: (
        <Space>
          <ApiOutlined style={{ color: 'rgb(250, 140, 22)' }} />
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
      children: (
        <>
          {currentPage?.openapiDocuments && currentPage.openapiDocuments.length > 0 ? (
            <List
              size='small'
              dataSource={currentPage.openapiDocuments as DocumentReference[]}
              renderItem={(doc) => renderDocumentItem(doc, 'openapi')}
            />
          ) : (
            <Text type='secondary' style={{ display: 'block', padding: '8px 0', textAlign: 'center' }}>
              暂无OpenAPI文档
            </Text>
          )}
        </>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgb(255, 255, 255)' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderBottom: '1px solid rgb(240, 240, 240)' }}>
        <Title level={5} style={{ margin: 0 }}>
          页面管理 - {currentPage?.name}
        </Title>
      </div>

      {/* Collapse Panels */}
      <div style={{ flex: 1, overflow: 'auto', padding: '8px' }}>
        <Collapse
          size='small'
          defaultActiveKey={['design']}
          expandIconPosition='end'
          style={{ background: 'transparent', border: 'none' }}
          items={collapseItems}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          padding: '16px',
          borderTop: '1px solid rgb(240, 240, 240)',
          background: 'rgb(255, 255, 255)',
        }}>
        <Space size='small' style={{ width: '100%', justifyContent: 'center' }}>
          <Button type='primary' size='small' icon={<SaveOutlined />} onClick={onSave} style={{ minWidth: '80px' }}>
            保存
          </Button>
          <Button size='small' icon={<ThunderboltOutlined />} onClick={onGenerateCode} style={{ minWidth: '120px' }}>
            生成代码
          </Button>
        </Space>
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
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
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
    </div>
  );
};

export default LayerTreePanel;
