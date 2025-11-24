import React, { useState, useEffect } from 'react';
import { Modal, List, Button, Space, Tag, Typography, Empty, App, Form, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { PlusOutlined, DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Project, Page, CreatePageForm } from '../types/project';
import { useProject } from '../contexts/ProjectContext';
import './ProjectDetailModal.css';

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
  const { createPage, deletePage, updatePage, state } = useProject();

  // 从 context 中获取最新的项目数据，确保数据同步
  const currentProject = project ? state.projects.find((p) => p.id === project.id) || project : null;
  const [createPageVisible, setCreatePageVisible] = useState(false);
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
        });
      }
    }
  }, [editingPageId, currentProject, editPageForm]);

  if (!currentProject) return null;

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

  // 处理页面跳转到编辑器
  const handleNavigateToEditor = (page: Page) => {
    onCancel();
    // 跳转到组件识别编辑器页面，带上 pageId 参数
    setTimeout(() => {
      navigate(`/editor/component-detect-v2?projectId=${currentProject.id}&pageId=${page.id}`);
    }, 300);
  };

  const renderPageContent = () => (
    <div className='pages-content'>
      <div className='pages-header' style={{ marginBottom: 16 }}>
        <Button type='primary' icon={<PlusOutlined />} onClick={() => setCreatePageVisible(true)}>
          添加页面
        </Button>
      </div>

      {currentProject.pages.length > 0 ? (
        <List
          dataSource={currentProject.pages as Page[]}
          renderItem={(page: Page) => (
            <List.Item key={page.id}>
              <div
                style={{
                  width: '100%',
                  cursor: 'pointer',
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: 16,
                  transition: 'box-shadow 0.2s',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
                  background: '#fff',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                }}
                onClick={() => handleNavigateToEditor(page)}
                className='project-page-list-item-hoverable'>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Space>
                    <Title level={5} style={{ margin: 0, fontWeight: 500 }}>
                      {page.name}
                    </Title>
                    <Tag color='processing'>{page.routePath}</Tag>
                  </Space>
                  <Space onClick={(e) => e.stopPropagation()}>
                    <Button
                      type='text'
                      icon={<EditOutlined />}
                      size='small'
                      onClick={() => handleEditPage(page)}
                      style={{ minWidth: 28 }}
                    />
                    <Button
                      type='text'
                      icon={<DeleteOutlined />}
                      size='small'
                      danger
                      onClick={() => handleDeletePage(page.id)}
                      style={{ minWidth: 28 }}
                    />
                  </Space>
                </div>
                {page.description && (
                  <Paragraph type='secondary' style={{ marginBottom: 0, marginTop: 10, color: 'rgba(0,0,0,0.45)' }}>
                    {page.description}
                  </Paragraph>
                )}
              </div>
            </List.Item>
          )}
        />
      ) : (
        <Empty description='暂无页面，点击上方按钮添加页面' />
      )}

      {/* 创建页面模态框 */}
      <Modal
        title='添加页面'
        open={createPageVisible}
        onCancel={() => {
          setCreatePageVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={500}
        destroyOnHidden>
        <Form form={form} layout='vertical' onFinish={handleCreatePage}>
          <Form.Item label='页面名称' name='name' rules={[{ required: true, message: '请输入页面名称' }]}>
            <Input placeholder='请输入页面名称' />
          </Form.Item>

          <Form.Item label='路由路径' name='routePath' rules={[{ required: true, message: '请输入路由路径' }]}>
            <Input placeholder='/example-page' />
          </Form.Item>

          <Form.Item label='页面描述' name='description'>
            <TextArea placeholder='请输入页面描述（可选）' rows={3} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setCreatePageVisible(false);
                  form.resetFields();
                }}>
                取消
              </Button>
              <Button type='primary' htmlType='submit'>
                创建页面
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑页面模态框 */}
      <Modal
        title='编辑页面'
        open={editingPageId !== null}
        onCancel={() => {
          setEditingPageId(null);
          editPageForm.resetFields();
        }}
        footer={null}
        width={500}
        destroyOnHidden>
        <Form form={editPageForm} layout='vertical' onFinish={handleUpdatePage}>
          <Form.Item label='页面名称' name='name' rules={[{ required: true, message: '请输入页面名称' }]}>
            <Input placeholder='请输入页面名称' />
          </Form.Item>

          <Form.Item label='路由路径' name='routePath' rules={[{ required: true, message: '请输入路由路径' }]}>
            <Input placeholder='/example-page' />
          </Form.Item>

          <Form.Item label='页面描述' name='description'>
            <TextArea placeholder='请输入页面描述（可选）' rows={3} />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setEditingPageId(null);
                  editPageForm.resetFields();
                }}>
                取消
              </Button>
              <Button type='primary' htmlType='submit'>
                更新页面
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );

  const renderProjectInfo = () => (
    <Space className='project-info-content' direction='vertical' style={{ width: '100%' }}>
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
  );

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
      width={900}
      style={{ top: 20 }}
      destroyOnHidden>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {/* 项目信息 */}
        {renderProjectInfo()}

        {/* 页面管理 */}
        <div>
          <Title level={5} style={{ marginBottom: 16 }}>
            页面管理 ({currentProject.pages.length})
          </Title>
          {renderPageContent()}
        </div>
      </div>
    </Modal>
  );
};

export default ProjectDetailModal;
