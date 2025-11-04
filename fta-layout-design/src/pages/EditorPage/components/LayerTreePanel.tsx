import React, { useMemo, useState } from 'react';
import { Tree, Button, Space, Typography, App, Collapse, List, Tag, Modal, Input, Form, Tooltip } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  FolderOutlined,
  FileOutlined,
  SaveOutlined,
  ThunderboltOutlined,
  PlusOutlined,
  FileImageOutlined,
  FileTextOutlined,
  ApiOutlined,
  DeleteOutlined,
  LinkOutlined,
  DownOutlined,
  ExpandOutlined,
  CompressOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { componentDetectionActions, componentDetectionStore } from '../contexts/ComponentDetectionContextV2';
import { AnnotationNode } from '../types/componentDetectionV2';
import { DocumentReference } from '@/types/project';
import { getDocumentStatusColor, getDocumentStatusText } from '@/utils/documentStatus';
import { useSnapshot } from 'valtio';

const { Title, Text } = Typography;

interface LayerTreePanelProps {
  documents: {
    design: DocumentReference[];
    prd: DocumentReference[];
    openapi: DocumentReference[];
  };
  selectedDocument: { type: 'design' | 'prd' | 'openapi'; id: string } | null;
  onSelectDocument: (type: 'design' | 'prd' | 'openapi', id: string) => void;
  onDeleteDocument: (type: 'design' | 'prd' | 'openapi', id: string) => void;
  onSave?: () => void;
  onGenerateCode?: () => void;
}

const showLine = { showLeafIcon: false };

// 转换AnnotationNode为Tree DataNode
const convertToTreeData = (node: AnnotationNode, isFirstLevel = false): DataNode => {
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
          {node.ftaComponent}
          {node.name && ` (${node.name})`}
        </span>
        {isRoot && <span style={{ fontSize: 12, color: 'rgb(82, 196, 26)' }}>[主页面]</span>}
      </Space>
      {isFirstLevel && (
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
    children: node.children.map((child) => convertToTreeData(child, false)),
    isLeaf: node.children.length === 0,
  };
};

const LayerTreePanel: React.FC<LayerTreePanelProps> = ({
  documents,
  selectedDocument,
  onSelectDocument,
  onDeleteDocument,
  onSave,
  onGenerateCode,
}) => {
  const { modal, message } = App.useApp();
  const { rootAnnotation, selectedAnnotationId, expandedKeys } = useSnapshot(componentDetectionStore);

  const [addDocModalVisible, setAddDocModalVisible] = useState(false);
  const [addDocType, setAddDocType] = useState<'design' | 'prd' | 'openapi'>('design');
  const [addDocForm] = Form.useForm();

  // 生成Tree数据（仅在选中设计文档时显示）
  const designTreeData: DataNode[] = useMemo(() => {
    if (!rootAnnotation || selectedDocument?.type !== 'design') return [];
    return [
      convertToTreeData(rootAnnotation as AnnotationNode, true),
      // 测试用
      convertToTreeData(rootAnnotation as AnnotationNode, true),
    ];
  }, [rootAnnotation, selectedDocument]);

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
  const handleAddDocumentClick = (type: 'design' | 'prd' | 'openapi') => {
    setAddDocType(type);
    setAddDocModalVisible(true);
  };

  const handleAddDocumentSubmit = async (_values: { url: string; name?: string }) => {
    try {
      // 这里应该调用 API 添加文档
      // 暂时只是关闭模态框
      debugger;
      message.success('文档添加功能待实现');
      setAddDocModalVisible(false);
      addDocForm.resetFields();
    } catch (error) {
      message.error('添加文档失败');
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
  const renderDocumentItem = (doc: DocumentReference, type: 'design' | 'prd' | 'openapi') => {
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
        onClick={() => onSelectDocument(type, doc.id)}
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
            selectedKeys={selectedAnnotationId ? [selectedAnnotationId] : []}
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
          {documents.prd.length > 0 ? (
            <List size='small' dataSource={documents.prd} renderItem={(doc) => renderDocumentItem(doc, 'prd')} />
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
          {documents.openapi.length > 0 ? (
            <List
              size='small'
              dataSource={documents.openapi}
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
          文档管理
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
