import React, { useState, useEffect } from 'react';
import {
  Modal,
  Tabs,
  Card,
  List,
  Button,
  Space,
  Tag,
  Typography,
  Progress,
  Empty,
  App,
  Form,
  Input,
  Timeline,
  Drawer,
} from 'antd';
import { useNavigate } from 'react-router-dom';
import {
  PlusOutlined,
  FileImageOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  LoadingOutlined,
  DeleteOutlined,
  EditOutlined,
  HistoryOutlined,
  FileTextOutlined,
  ApiOutlined,
  LinkOutlined,
} from '@ant-design/icons';
import { Project, Page, DesignSpec, CreatePageForm, DocumentReference } from '../types/project';
import { getDocumentStatusText, getDocumentStatusColor } from '@/utils/documentStatus';
import { DocumentActionButtons } from './DocumentActionButtons';
import { useProject } from '../contexts/ProjectContext';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

interface ProjectDetailModalProps {
  visible: boolean;
  project: Project | null;
  onCancel: () => void;
}

const ProjectDetailModal: React.FC<ProjectDetailModalProps> = ({ visible, project, onCancel }) => {
  const { message } = App.useApp();
  const navigate = useNavigate();
  const { createPage, deletePage, syncDocuments, updateDocumentStatus, updatePage, state } = useProject();

  // 从 context 中获取最新的项目数据，确保数据同步
  const currentProject = project ? state.projects.find((p) => p.id === project.id) || project : null;
  const [activeTab, setActiveTab] = useState('pages');
  const [createPageVisible, setCreatePageVisible] = useState(false);
  const [historyVisible, setHistoryVisible] = useState(false);
  const [selectedDesignSpec, setSelectedDesignSpec] = useState<DesignSpec | null>(null);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editPageForm] = Form.useForm();
  const [form] = Form.useForm();

  // 使用useEffect来处理编辑表单的初始化
  useEffect(() => {
    if (editingPageId && currentProject) {
      const page = currentProject.pages.find((p) => p.id === editingPageId);
      if (page) {
        editPageForm.setFieldsValue({
          name: page.name,
          routePath: page.routePath,
          description: page.description,
          designUrls: page.designDocuments?.map((doc) => doc.url) || [],
          prdUrls: page.prdDocuments?.map((doc) => doc.url) || [],
          openapiUrls: page.openapiDocuments?.map((doc) => doc.url) || [],
        });
      }
    }
  }, [editingPageId, currentProject, editPageForm]);

  if (!currentProject) return null;

  // 状态图标和颜色助手函数
  const getStatusIcon = (status: DesignSpec['status']) => {
    switch (status) {
      case 'pending':
        return <ClockCircleOutlined style={{ color: 'rgb(250, 173, 20)', fontSize: 16 }} />;
      case 'processing':
        return <LoadingOutlined style={{ color: 'rgb(24, 144, 255)', fontSize: 16 }} spin />;
      case 'completed':
        return <CheckCircleOutlined style={{ color: 'rgb(82, 196, 26)', fontSize: 16 }} />;
      case 'failed':
        return <ExclamationCircleOutlined style={{ color: 'rgb(255, 77, 79)', fontSize: 16 }} />;
      default:
        return <ClockCircleOutlined style={{ fontSize: 16 }} />;
    }
  };

  const getStatusColor = (status: DesignSpec['status']) => {
    switch (status) {
      case 'pending':
        return 'warning';
      case 'processing':
        return 'processing';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // 页面编辑处理函数
  const handleEditPage = (page: Page) => {
    setEditingPageId(page.id);
  };

  const handleUpdatePage = async (values: any) => {
    if (!editingPageId) return;

    try {
      await updatePage(currentProject.id, editingPageId, values);
      message.success('页面更新成功！');
      setEditingPageId(null);
      editPageForm.resetFields();
    } catch (error) {
      message.error('页面更新失败，请重试');
    }
  };

  const handleDeletePage = (pageId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个页面吗？此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deletePage(currentProject.id, pageId);
          message.success('页面删除成功');
        } catch (error) {
          message.error('页面删除失败，请重试');
          throw error;
        }
      },
    });
  };

  const handleCreatePage = async (values: CreatePageForm) => {
    try {
      await createPage(currentProject.id, values);
      message.success('页面创建成功！');
      form.resetFields();
      setCreatePageVisible(false);
    } catch (error) {
      message.error('页面创建失败，请重试');
    }
  };

  const handleSyncDocument = async (pageId: string, type: 'design' | 'prd' | 'openapi', documentId: string) => {
    try {
      await syncDocuments(currentProject.id, pageId, type, documentId);
    } catch (error) {
      // errors are handled inside syncDocuments
    }
  };

  // 处理开始编辑：更新状态并跳转到布局编辑器
  const handleStartEditing = async (page: Page, type: 'design' | 'prd' | 'openapi', document: DocumentReference) => {
    // 如果文档状态不是editing，则更新状态为编辑中
    if (currentProject) {
      if (document && document.status !== 'editing') {
        try {
          await updateDocumentStatus(currentProject.id, page.id, type, document.id, 'editing');
          message.success('已开始编辑，正在跳转到组件识别编辑器...');
        } catch (error) {
          message.error('进入编辑模式失败，请稍后重试');
          return;
        }
      } else {
        message.success('正在跳转到组件识别编辑器...');
      }
    }

    // 关闭模态框
    onCancel();
    // 跳转到组件识别编辑器页面，带上 designId 参数
    setTimeout(() => {
      navigate(`/editor/component-detect-v2?designId=${document.id}`);
    }, 500); // 稍微延迟跳转，让用户看到成功消息
  };

  // 渲染文档卡片（支持多URL）
  const renderDocumentCards = (page: Page) => {
    const documentTypes = [
      {
        key: 'design' as const,
        name: '设计稿',
        icon: FileImageOutlined,
        color: 'rgb(24, 144, 255)',
        documents: page.designDocuments || [],
      },
      {
        key: 'prd' as const,
        name: 'PRD文档',
        icon: FileTextOutlined,
        color: 'rgb(82, 196, 26)',
        documents: page.prdDocuments || [],
      },
      {
        key: 'openapi' as const,
        name: 'OpenAPI文档',
        icon: ApiOutlined,
        color: 'rgb(250, 140, 22)',
        documents: page.openapiDocuments || [],
      },
    ];

    const hasAnyDocument = documentTypes.some((type) => type.documents.length > 0);

    if (!hasAnyDocument) {
      return null;
    }

    return (
      <div className="document-links-section">
        <Title level={5} style={{ marginBottom: 16 }}>
          关联文档
        </Title>
        <div className="document-links" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {documentTypes.map(({ key, name, icon: IconComponent, color, documents }) => {
            if (documents.length === 0) return null;

            return (
              <div key={key} style={{ marginBottom: 12 }}>
                <Title level={5} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <IconComponent style={{ color }} />
                  {name}
                </Title>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {documents.map((document, index) => (
                    <Card size="small" className="document-link-card" key={`${key}-${document.id}`}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div>
                            <Text strong>
                              {document.name || (documents.length > 1 ? `${name} ${index + 1}` : name)}
                            </Text>
                            <br />
                            <Text type="secondary" style={{ fontSize: 12 }}>
                              <LinkOutlined /> {document.url}
                            </Text>
                          </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Tag color={getDocumentStatusColor(document.status)}>
                            {getDocumentStatusText(document.status)}
                          </Tag>
                          <DocumentActionButtons
                            status={document.status}
                            onSync={() => handleSyncDocument(page.id, key as 'design' | 'prd' | 'openapi', document.id)}
                            onStartEditing={() =>
                              handleStartEditing(page, key as 'design' | 'prd' | 'openapi', document)
                            }
                          />
                        </div>
                      </div>
                      {document.status === 'syncing' && (
                        <Progress percent={document.progress || 0} size="small" style={{ marginTop: 8 }} />
                      )}
                    </Card>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderPageContent = () => (
    <div className="pages-content">
      <div className="pages-header" style={{ marginBottom: 16 }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreatePageVisible(true)}>
          添加页面
        </Button>
      </div>

      {currentProject.pages.length > 0 ? (
        <List
          dataSource={currentProject.pages}
          renderItem={(page: Page) => (
            <List.Item key={page.id}>
              <Card
                style={{ width: '100%' }}
                title={
                  <Space>
                    <Title level={5} style={{ margin: 0 }}>
                      {page.name}
                    </Title>
                    <Tag>{page.routePath}</Tag>
                  </Space>
                }
                extra={
                  <Space>
                    <Button type="text" icon={<EditOutlined />} size="small" onClick={() => handleEditPage(page)} />
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      size="small"
                      danger
                      onClick={() => handleDeletePage(page.id)}
                    />
                  </Space>
                }
              >
                {page.description && (
                  <Paragraph type="secondary" style={{ marginBottom: 16 }}>
                    {page.description}
                  </Paragraph>
                )}

                {/* 文档关联区域 - 支持多URL */}
                {renderDocumentCards(page)}
              </Card>
            </List.Item>
          )}
        />
      ) : (
        <Empty description="暂无页面，点击上方按钮添加页面" />
      )}

      {/* 创建页面模态框 - 支持多URL输入 */}
      <Modal
        title="添加页面"
        open={createPageVisible}
        onCancel={() => {
          setCreatePageVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnHidden={false}
      >
        <Form form={form} layout="vertical" onFinish={handleCreatePage}>
          <Form.Item label="页面名称" name="name" rules={[{ required: true, message: '请输入页面名称' }]}>
            <Input placeholder="请输入页面名称" />
          </Form.Item>

          <Form.Item label="路由路径" name="routePath" rules={[{ required: true, message: '请输入路由路径' }]}>
            <Input placeholder="/example-page" />
          </Form.Item>

          <Form.Item label="页面描述" name="description">
            <TextArea placeholder="请输入页面描述（可选）" rows={3} />
          </Form.Item>

          <Form.Item label="设计稿地址">
            <Form.List name="designUrls">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="https://figma.com/design-url" prefix={<FileImageOutlined />} />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>
                        删除
                      </Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加设计稿地址
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item label="PRD文档地址">
            <Form.List name="prdUrls">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="https://docs.company.com/prd-url" prefix={<FileTextOutlined />} />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>
                        删除
                      </Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加PRD文档地址
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item label="OpenAPI文档地址">
            <Form.List name="openapiUrls">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="https://api.company.com/openapi.json" prefix={<ApiOutlined />} />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>
                        删除
                      </Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加OpenAPI文档地址
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setCreatePageVisible(false);
                  form.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                创建页面
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑页面模态框 */}
      <Modal
        title="编辑页面"
        open={editingPageId !== null}
        onCancel={() => {
          setEditingPageId(null);
          editPageForm.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnHidden={false}
      >
        <Form form={editPageForm} layout="vertical" onFinish={handleUpdatePage}>
          <Form.Item label="页面名称" name="name" rules={[{ required: true, message: '请输入页面名称' }]}>
            <Input placeholder="请输入页面名称" />
          </Form.Item>

          <Form.Item label="路由路径" name="routePath" rules={[{ required: true, message: '请输入路由路径' }]}>
            <Input placeholder="/example-page" />
          </Form.Item>

          <Form.Item label="页面描述" name="description">
            <TextArea placeholder="请输入页面描述（可选）" rows={3} />
          </Form.Item>

          <Form.Item label="设计稿地址">
            <Form.List name="designUrls">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="https://figma.com/design-url" prefix={<FileImageOutlined />} />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>
                        删除
                      </Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加设计稿地址
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item label="PRD文档地址">
            <Form.List name="prdUrls">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="https://docs.company.com/prd-url" prefix={<FileTextOutlined />} />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>
                        删除
                      </Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加PRD文档地址
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item label="OpenAPI文档地址">
            <Form.List name="openapiUrls">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space key={key} style={{ display: 'flex', marginBottom: 8 }} align="baseline">
                      <Form.Item {...restField} name={[name]} style={{ flex: 1, marginBottom: 0 }}>
                        <Input placeholder="https://api.company.com/openapi.json" prefix={<ApiOutlined />} />
                      </Form.Item>
                      <Button type="text" danger onClick={() => remove(name)}>
                        删除
                      </Button>
                    </Space>
                  ))}
                  <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                    添加OpenAPI文档地址
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setEditingPageId(null);
                  editPageForm.resetFields();
                }}
              >
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                更新页面
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 处理历史抽屉 */}
      <Drawer
        title={
          <Space>
            <HistoryOutlined />
            处理历史 - {selectedDesignSpec?.name}
          </Space>
        }
        placement="right"
        open={historyVisible}
        onClose={() => {
          setHistoryVisible(false);
          setSelectedDesignSpec(null);
        }}
        width={500}
      >
        {selectedDesignSpec && (
          <Timeline>
            {selectedDesignSpec.processingHistory.map((item) => (
              <Timeline.Item key={item.id} dot={getStatusIcon(item.status)} color={getStatusColor(item.status)}>
                <div>
                  <Text strong>{item.message}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {new Date(item.timestamp).toLocaleString('zh-CN')}
                  </Text>
                </div>
              </Timeline.Item>
            ))}
          </Timeline>
        )}
      </Drawer>
    </div>
  );

  const renderProjectInfo = () => (
    <div className="project-info-content">
      <Card title="项目信息">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text strong>项目名称：</Text>
            <Text>{currentProject.name}</Text>
          </div>
          <div>
            <Text strong>项目描述：</Text>
            <Text>{currentProject.description || '暂无描述'}</Text>
          </div>
          <div>
            <Text strong>项目负责人：</Text>
            <Text>{currentProject.manager}</Text>
          </div>
          <div>
            <Text strong>Git仓库：</Text>
            <Text>{currentProject.gitRepository || '未配置'}</Text>
          </div>
          <div>
            <Text strong>创建时间：</Text>
            <Text>{new Date(currentProject.createdAt).toLocaleString()}</Text>
          </div>
          <div>
            <Text strong>最后更新：</Text>
            <Text>{new Date(currentProject.updatedAt).toLocaleString()}</Text>
          </div>
        </Space>
      </Card>
    </div>
  );

  const tabItems = [
    {
      key: 'pages',
      label: `页面管理 (${currentProject.pages.length})`,
      children: renderPageContent(),
    },
    {
      key: 'info',
      label: '项目信息',
      children: renderProjectInfo(),
    },
  ];

  return (
    <Modal
      title={
        <Space>
          <span style={{ fontSize: 24 }}>{currentProject.avatar || '📁'}</span>
          <Title level={4} style={{ margin: 0 }}>
            {currentProject.name}
          </Title>
        </Space>
      }
      open={visible}
      onCancel={onCancel}
      footer={null}
      width={800}
      style={{ top: 20 }}
      destroyOnHidden
    >
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Modal>
  );
};

export default ProjectDetailModal;
