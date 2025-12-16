import { projectService } from '@/services/projectService';
import type { CreatePageForm, CreateProjectForm, Page, Project, ProjectResolutionResult } from '@/types/project';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { App, Button, Card, Empty, Form, Input, List, Modal, Result, Space, Spin, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const { Title, Paragraph, Text } = Typography;

/**
 * 这是一个只存在与 vscode 插件内部的页面，用于管理项目和页面
 */
const InternalProjectPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { message } = App.useApp();

  // 优先从 window.workspaceInfo 获取，其次从 URL 参数获取
  const gitUrl = window.workspaceInfo?.gitUrl;
  const workdir = window.workspaceInfo?.workdir;
  const srcTree = window.workspaceInfo?.srcTree;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ProjectResolutionResult | null>(null);
  const [bindingProjectId, setBindingProjectId] = useState<string | null>(null);
  const [pageModalOpen, setPageModalOpen] = useState(false);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [pageForm] = Form.useForm<CreatePageForm>();
  const [pageSaving, setPageSaving] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectForm] = Form.useForm<CreateProjectForm>();
  const [creatingProject, setCreatingProject] = useState(false);

  const matchedProject = result?.matchedProject ?? null;
  const projects = result?.projects ?? [];
  const resolvedUserLabel =
    matchedProject?.userId ||
    projects[0]?.userId ||
    window.userInfo?.name ||
    window.userInfo?.jobNumber ||
    '当前登录用户';

  const fetchResolution = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await projectService.resolveProjectContext({
        gitUrl,
        workdir,
      });
      setResult({
        matchedProject: data.matchedProject,
        matchedBy: data.matchedBy,
        resolvedGitId: data.resolvedGitId,
        requestedWorkdir: data.requestedWorkdir,
        projects: data.projects,
      });
    } catch (err: any) {
      setError(err?.message || '项目匹配失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResolution();
  }, []);

  const handleBindProject = async (projectId: string) => {
    setBindingProjectId(projectId);
    try {
      await projectService.bindProjectContext({
        projectId,
        gitUrl,
        workdir,
      });
      message.success('项目绑定完成');
      await fetchResolution();
    } catch (err: any) {
      message.error(err?.message || '绑定项目失败');
    } finally {
      setBindingProjectId(null);
    }
  };

  const openCreatePageModal = () => {
    setEditingPage(null);
    pageForm.resetFields();
    setPageModalOpen(true);
  };

  const openEditPageModal = (page: Page) => {
    setEditingPage(page);
    pageForm.setFieldsValue({
      name: page.name,
      routePath: page.routePath,
      description: page.description,
    });
    setPageModalOpen(true);
  };

  const handlePageSubmit = async (values: CreatePageForm) => {
    if (!matchedProject) return;
    setPageSaving(true);
    try {
      if (editingPage) {
        await projectService.updatePage(matchedProject.id, editingPage.id, values);
        message.success('页面更新成功');
      } else {
        await projectService.createPage(matchedProject.id, values);
        message.success('页面创建成功');
      }
      setPageModalOpen(false);
      pageForm.resetFields();
      await fetchResolution();
    } catch (err: any) {
      message.error(err?.message || '保存页面失败');
    } finally {
      setPageSaving(false);
    }
  };

  const handleDeletePage = (page: Page) => {
    if (!matchedProject) return;
    Modal.confirm({
      title: '删除页面',
      content: `确定要删除 ${page.name} 吗？该操作不可恢复。`,
      okType: 'danger',
      onOk: async () => {
        try {
          await projectService.deletePage(matchedProject.id, page.id);
          message.success('页面删除成功');
          await fetchResolution();
        } catch (err: any) {
          message.error(err?.message || '删除页面失败');
          throw err;
        }
      },
    });
  };

  const handleCreateProject = async (values: CreateProjectForm) => {
    setCreatingProject(true);
    try {
      const project = await projectService.createProject(values);
      message.success('项目创建成功');
      setProjectModalOpen(false);
      projectForm.resetFields();
      await projectService.bindProjectContext({
        projectId: project.id,
        gitUrl,
        workdir,
      });
      await fetchResolution();
    } catch (err: any) {
      message.error(err?.message || '创建项目失败');
    } finally {
      setCreatingProject(false);
    }
  };

  const handleNavigateToEditor = (page: Page) => {
    if (!matchedProject) return;
    navigate(`/editor/component-detect-v2?projectId=${matchedProject.id}&pageId=${page.id}`);
  };

  const renderContextCard = () => (
    <Card
      style={{ marginBottom: 16 }}
      title='工作空间上下文'
      extra={
        <Space>
          <Button icon={<ReloadOutlined />} onClick={fetchResolution} disabled={loading}>
            重新匹配
          </Button>
          <Button type='primary' icon={<PlusOutlined />} onClick={() => setProjectModalOpen(true)}>
            新建项目
          </Button>
        </Space>
      }>
      <Space direction='vertical' size={8}>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>用户：</Text>
          {resolvedUserLabel}
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>Git URL：</Text>
          {gitUrl || '未提供'}
        </Paragraph>
        <Paragraph style={{ marginBottom: 0 }}>
          <Text strong>工作目录：</Text>
          {workdir || '未提供'}
        </Paragraph>
        {result?.matchedBy && matchedProject && (
          <Paragraph style={{ marginBottom: 0 }}>
            <Text strong>匹配结果：</Text>
            {matchedProject.name}（依据 {result.matchedBy === 'gitId' ? 'Git 项目' : '工作目录'}）
          </Paragraph>
        )}
      </Space>
    </Card>
  );

  const renderPageList = (project: Project) => (
    <Card
      title={`页面列表 - ${project.name}`}
      extra={
        <Button type='primary' icon={<PlusOutlined />} onClick={openCreatePageModal}>
          添加页面
        </Button>
      }>
      {project.pages.length === 0 ? (
        <Empty description='当前项目还没有页面，点击右上角按钮创建一个吧' />
      ) : (
        <List
          dataSource={project.pages}
          renderItem={(pageItem) => (
            <List.Item key={pageItem.id}>
              <div
                style={{
                  width: '100%',
                  border: '1px solid #f0f0f0',
                  borderRadius: 8,
                  padding: 16,
                  background: '#fff',
                }}>
                <Space direction='vertical' style={{ width: '100%' }}>
                  <Space align='center' style={{ justifyContent: 'space-between', width: '100%' }}>
                    <Space>
                      <Title level={5} style={{ margin: 0 }}>
                        {pageItem.name}
                      </Title>
                      <Tag color='processing'>{pageItem.routePath}</Tag>
                    </Space>
                    <Space>
                      <Button type='link' onClick={() => handleNavigateToEditor(pageItem)}>
                        打开编辑器
                      </Button>
                      <Button type='link' onClick={() => openEditPageModal(pageItem)}>
                        编辑
                      </Button>
                      <Button danger type='link' onClick={() => handleDeletePage(pageItem)}>
                        删除
                      </Button>
                    </Space>
                  </Space>
                  {pageItem.description && <Paragraph>{pageItem.description}</Paragraph>}
                </Space>
              </div>
            </List.Item>
          )}
        />
      )}
    </Card>
  );

  const renderBindingList = () => (
    <Card title='选择需要绑定的项目'>
      {projects.length === 0 ? (
        <Empty description='当前没有可选项目，请先创建一个' />
      ) : (
        <List
          dataSource={projects}
          renderItem={(projectItem) => {
            const alreadyBound =
              (result?.resolvedGitId && projectItem.gitId === result.resolvedGitId) ||
              (result?.requestedWorkdir &&
                (projectItem.gitId === result.requestedWorkdir ||
                  projectItem.workdirs.includes(result.requestedWorkdir)));
            return (
              <List.Item key={projectItem.id}>
                <Space
                  direction='vertical'
                  style={{ width: '100%', padding: 12, border: '1px solid #f0f0f0', borderRadius: 8 }}>
                  <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                    <div>
                      <Title level={5} style={{ margin: 0 }}>
                        {projectItem.name}
                      </Title>
                      <Text type='secondary'>{projectItem.description || '暂无描述'}</Text>
                    </div>
                    <Space>
                      {alreadyBound && <Tag color='success'>已绑定</Tag>}
                      <Button
                        type='primary'
                        disabled={Boolean(alreadyBound)}
                        loading={bindingProjectId === projectItem.id}
                        onClick={() => handleBindProject(projectItem.id)}>
                        绑定
                      </Button>
                    </Space>
                  </Space>
                  <Space wrap>
                    <Tag>负责人：{projectItem.manager}</Tag>
                    <Tag color='default'>Git ID：{projectItem.gitId || 'empty'}</Tag>
                    {projectItem.workdirs.map((dir) => (
                      <Tag key={dir} color='blue'>
                        {dir}
                      </Tag>
                    ))}
                  </Space>
                </Space>
              </List.Item>
            );
          }}
        />
      )}
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      {renderContextCard()}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
          <Spin size='large' />
        </div>
      ) : error ? (
        <Result
          status='error'
          title='加载失败'
          subTitle={error}
          extra={
            <Button type='primary' onClick={fetchResolution}>
              重试
            </Button>
          }
        />
      ) : matchedProject ? (
        <Space direction='vertical' style={{ width: '100%' }} size={16}>
          <Card title='当前项目'>
            <Space direction='vertical' size={8}>
              <Title level={4} style={{ margin: 0 }}>
                {matchedProject.name}
              </Title>
              <Text type='secondary'>{matchedProject.description || '暂无描述'}</Text>
              <Space wrap>
                <Tag>{matchedProject.manager}</Tag>
                <Tag color='default'>Git ID：{matchedProject.gitId}</Tag>
                {matchedProject.workdirs.map((dir) => (
                  <Tag key={dir} color='blue'>
                    {dir}
                  </Tag>
                ))}
              </Space>
            </Space>
          </Card>
          {renderPageList(matchedProject)}
        </Space>
      ) : (
        renderBindingList()
      )}

      <Modal
        title={editingPage ? '编辑页面' : '新建页面'}
        open={pageModalOpen}
        onCancel={() => {
          setPageModalOpen(false);
          pageForm.resetFields();
        }}
        okButtonProps={{ loading: pageSaving }}
        onOk={() => pageForm.submit()}>
        <Form form={pageForm} layout='vertical' onFinish={handlePageSubmit}>
          <Form.Item name='name' label='页面名称' rules={[{ required: true, message: '请输入页面名称' }]}>
            <Input placeholder='例如：登录页' />
          </Form.Item>
          <Form.Item name='routePath' label='路由路径' rules={[{ required: true, message: '请输入路由路径' }]}>
            <Input placeholder='/login' />
          </Form.Item>
          <Form.Item name='description' label='页面描述'>
            <Input.TextArea placeholder='用于说明页面目标和范围' rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title='新建项目'
        open={projectModalOpen}
        onCancel={() => {
          setProjectModalOpen(false);
          projectForm.resetFields();
        }}
        okButtonProps={{ loading: creatingProject }}
        onOk={() => projectForm.submit()}>
        <Form form={projectForm} layout='vertical' onFinish={handleCreateProject}>
          <Form.Item name='name' label='项目名称' rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder='请输入项目名称' />
          </Form.Item>
          <Form.Item name='manager' label='负责人' rules={[{ required: true, message: '请输入负责人' }]}>
            <Input placeholder='负责人姓名或账号' />
          </Form.Item>
          <Form.Item name='description' label='项目描述'>
            <Input.TextArea rows={3} placeholder='可选，补充项目背景信息' />
          </Form.Item>
          <Form.Item name='gitRepository' label='Git 仓库地址'>
            <Input placeholder='https://code.example.com/foo/bar.git' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default InternalProjectPage;
