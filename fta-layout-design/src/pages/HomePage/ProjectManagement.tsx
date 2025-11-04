import {
  CalendarOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  PlusOutlined,
  SearchOutlined,
  ShareAltOutlined,
  UserOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Button,
  Card,
  Col,
  Empty,
  Input,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  Typography,
  Modal,
  App,
} from 'antd';
import React, { useState, useEffect } from 'react';
import { useProject } from '../../contexts/ProjectContext';
import ProjectCreateModal from '../../components/ProjectCreateModal';
import ProjectDetailModal from '../../components/ProjectDetailModal';
import { Project } from '../../types/project';

const { Title, Text } = Typography;
const { Search } = Input;
const { Option } = Select;

const ProjectManagement: React.FC = () => {
  const { message } = App.useApp();
  const { state, loadProjects, deleteProject } = useProject();
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  useEffect(() => {
    loadProjects({ page: 1, size: 10 }, message).catch(() => undefined);
  }, [loadProjects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'processing';
      case 'completed':
        return 'success';
      case 'paused':
        return 'warning';
      case 'archived':
        return 'default';
      case 'draft':
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '进行中';
      case 'completed':
        return '已完成';
      case 'paused':
        return '已暂停';
      case 'archived':
        return '已归档';
      case 'draft':
        return '草稿';
      default:
        return '未知';
    }
  };

  const handleDeleteProject = (projectId: string) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个项目吗？此操作不可恢复。',
      okText: '确认删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await deleteProject(projectId);
          message.success('项目删除成功');
        } catch (error) {
          message.error('项目删除失败，请重试');
          throw error;
        }
      },
    });
  };

  const handleViewProject = (project: Project) => {
    setSelectedProject(project);
    setDetailModalVisible(true);
  };

  const handleEditProject = (project: Project) => {
    setSelectedProject(project);
    // TODO: 实现项目编辑功能
    message.info('项目编辑功能即将上线');
  };

  const handleShareProject = (project: Project) => {
    // 复制项目分享链接到剪贴板
    const shareUrl = `${window.location.origin}/project/${project.id}`;
    navigator.clipboard
      .writeText(shareUrl)
      .then(() => {
        message.success('项目链接已复制到剪贴板');
      })
      .catch(() => {
        message.error('复制失败，请手动复制链接');
      });
  };

  const filteredProjects = state.projects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (project.description || '').toLowerCase().includes(searchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className='project-management'>
      <div className='project-header'>
        <div className='header-content'>
          <Title level={3}>项目管理</Title>
          <Text type='secondary'>管理您的所有项目，跟踪进度和协作</Text>
        </div>
        <Button type='primary' icon={<PlusOutlined />} size='large' onClick={() => setCreateModalVisible(true)}>
          创建新项目
        </Button>
      </div>

      <div className='project-filters'>
        <Row gutter={16} align='middle'>
          <Col flex='auto'>
            <Search
              placeholder='搜索项目名称或描述...'
              allowClear
              size='large'
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col>
            <Select
              value={statusFilter}
              onChange={setStatusFilter}
              size='large'
              style={{ width: 120 }}
              suffixIcon={<FilterOutlined />}>
              <Option value='all'>全部状态</Option>
              <Option value='active'>进行中</Option>
              <Option value='completed'>已完成</Option>
              <Option value='paused'>已暂停</Option>
              <Option value='archived'>已归档</Option>
              <Option value='draft'>草稿</Option>
            </Select>
          </Col>
        </Row>
      </div>

      <div className='project-grid'>
        {filteredProjects.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredProjects.map((project) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={project.id}>
                <Card
                  className='project-card'
                  hoverable
                  onClick={() => handleViewProject(project)}
                  actions={[
                    <Button
                      type='text'
                      icon={<EyeOutlined />}
                      title='查看详情'
                      onClick={() => handleViewProject(project)}
                    />,
                    <Button
                      type='text'
                      icon={<EditOutlined />}
                      title='编辑项目'
                      onClick={() => handleEditProject(project)}
                    />,
                    <Button
                      type='text'
                      icon={<ShareAltOutlined />}
                      title='分享项目'
                      onClick={() => handleShareProject(project)}
                    />,
                    <Button
                      type='text'
                      icon={<DeleteOutlined />}
                      title='删除项目'
                      danger
                      onClick={() => handleDeleteProject(project.id)}
                    />,
                  ]}>
                  <div className='project-card-header'>
                    <div className='project-avatar-wrapper'>
                      <Avatar size={48} className='project-avatar'>
                        {project.avatar || '📁'}
                      </Avatar>
                      {project.status === 'active' && <div className='status-indicator active'></div>}
                    </div>
                    <div className='project-info'>
                      <div className='project-title-row'>
                        <Title level={5} className='project-name' ellipsis={{ tooltip: project.name }}>
                          {project.name}
                        </Title>
                        <Tag color={getStatusColor(project.status)} className='status-tag'>
                          {getStatusText(project.status)}
                        </Tag>
                      </div>
                      <Text type='secondary' className='project-manager'>
                        负责人: {project.manager}
                      </Text>
                    </div>
                  </div>

                  <Text type='secondary' className='project-description'>
                    {project.description || '暂无描述'}
                  </Text>

                  <div className='project-progress'>
                    <div className='progress-header'>
                      <Text strong>进度</Text>
                      <Text>{project.progress || 0}%</Text>
                    </div>
                    <Progress
                      percent={project.progress || 0}
                      showInfo={false}
                      strokeColor={{
                        '0%': 'rgb(16, 142, 233)',
                        '100%': 'rgb(135, 208, 104)',
                      }}
                    />
                  </div>

                  <div className='project-tags'>
                    {(project.tags || []).map((tag, index) => (
                      <Tag key={index}>{tag}</Tag>
                    ))}
                  </div>

                  <div className='project-meta'>
                    <Space>
                      <UserOutlined />
                      <Text type='secondary'>{project.members || 1} 成员</Text>
                    </Space>
                    <Space>
                      <CalendarOutlined />
                      <Text type='secondary'>{new Date(project.updatedAt).toLocaleDateString()}</Text>
                    </Space>
                  </div>
                </Card>
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description='没有找到匹配的项目' image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>

      <ProjectCreateModal
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        onSuccess={() => {
          setCreateModalVisible(false);
          loadProjects();
        }}
      />

      <ProjectDetailModal
        visible={detailModalVisible}
        project={selectedProject}
        onCancel={() => {
          setDetailModalVisible(false);
          setSelectedProject(null);
        }}
      />
    </div>
  );
};

export default ProjectManagement;
