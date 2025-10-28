import {
  AppstoreOutlined,
  ClockCircleOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  FilterOutlined,
  GlobalOutlined,
  HeartOutlined,
  PlusOutlined,
  SearchOutlined,
  ShareAltOutlined,
  StarOutlined,
} from '@ant-design/icons';
import {
  Avatar,
  Badge,
  Button,
  Card,
  Col,
  Divider,
  Empty,
  Input,
  Modal,
  Rate,
  Row,
  Select,
  Space,
  Tabs,
  Tag,
  Tooltip,
  Typography,
} from 'antd';
import React, { useState } from 'react';

const { Title, Text, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

interface Component {
  id: string;
  name: string;
  description: string;
  category: string;
  tags: string[];
  author: string;
  avatar?: string;
  downloads: number;
  likes: number;
  rating: number;
  lastUpdated: string;
  isPublic: boolean;
  preview?: string;
  codeSnippet?: string;
}

const AssetManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('my-components');
  const [searchText, setSearchText] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<Component | null>(null);

  const myComponents: Component[] = [
    {
      id: '1',
      name: 'DataTable Pro',
      description: '高性能数据表格组件，支持虚拟滚动、排序、筛选等功能',
      category: 'Table',
      tags: ['React', 'Table', 'Virtual Scroll'],
      author: '我',
      avatar: '📊',
      downloads: 0,
      likes: 0,
      rating: 0,
      lastUpdated: '2024-01-15',
      isPublic: false,
      preview: 'https://gw.alipayobjects.com/zos/rmsportal/ofpeZpgdrqXcRpTlVXTp.png',
    },
    {
      id: '2',
      name: 'Chart Dashboard',
      description: '可视化图表仪表板，集成多种图表类型',
      category: 'Chart',
      tags: ['React', 'Charts', 'D3.js'],
      author: '我',
      avatar: '📈',
      downloads: 0,
      likes: 0,
      rating: 0,
      lastUpdated: '2024-01-12',
      isPublic: true,
      preview: 'https://gw.alipayobjects.com/zos/rmsportal/iLilpTYKqogBNlwpmVGw.png',
    },
  ];

  const marketComponents: Component[] = [
    {
      id: '3',
      name: 'Advanced Form Builder',
      description: '拖拽式表单构建器，支持动态表单生成和验证',
      category: 'Form',
      tags: ['React', 'Form', 'Drag & Drop'],
      author: 'John Doe',
      avatar: '📝',
      downloads: 1250,
      likes: 89,
      rating: 4.8,
      lastUpdated: '2024-01-14',
      isPublic: true,
      preview: 'https://gw.alipayobjects.com/zos/rmsportal/ofpeZpgdrqXcRpTlVXTp.png',
    },
    {
      id: '4',
      name: 'Image Gallery Pro',
      description: '响应式图片画廊组件，支持懒加载和灯箱效果',
      category: 'Media',
      tags: ['React', 'Gallery', 'Lazy Load'],
      author: 'Jane Smith',
      avatar: '🖼️',
      downloads: 890,
      likes: 67,
      rating: 4.6,
      lastUpdated: '2024-01-13',
      isPublic: true,
      preview: 'https://gw.alipayobjects.com/zos/rmsportal/iLilpTYKqogBNlwpmVGw.png',
    },
    {
      id: '5',
      name: 'Calendar Widget',
      description: '功能丰富的日历组件，支持事件管理和多视图',
      category: 'Calendar',
      tags: ['React', 'Calendar', 'Events'],
      author: 'Mike Johnson',
      avatar: '📅',
      downloads: 2100,
      likes: 156,
      rating: 4.9,
      lastUpdated: '2024-01-11',
      isPublic: true,
      preview: 'https://gw.alipayobjects.com/zos/rmsportal/ofpeZpgdrqXcRpTlVXTp.png',
    },
    {
      id: '6',
      name: 'Navigation Menu',
      description: '现代化导航菜单组件，支持多级菜单和响应式设计',
      category: 'Navigation',
      tags: ['React', 'Menu', 'Responsive'],
      author: 'Sarah Wilson',
      avatar: '🧭',
      downloads: 1680,
      likes: 123,
      rating: 4.7,
      lastUpdated: '2024-01-10',
      isPublic: true,
      preview: 'https://gw.alipayobjects.com/zos/rmsportal/iLilpTYKqogBNlwpmVGw.png',
    },
  ];

  const categories = ['all', 'Table', 'Chart', 'Form', 'Media', 'Calendar', 'Navigation'];

  const handlePreview = (component: Component) => {
    setSelectedComponent(component);
    setIsModalVisible(true);
  };

  const renderComponentCard = (component: Component, showActions: boolean = true) => (
    <Card
      key={component.id}
      className="component-card"
      hoverable
      cover={
        <div className="component-preview" onClick={() => handlePreview(component)}>
          <img
            alt={component.name}
            src={component.preview}
            style={{ width: '100%', height: 200, objectFit: 'cover' }}
          />
          <div className="preview-overlay">
            <EyeOutlined style={{ fontSize: 24, color: 'rgb(255, 255, 255)' }} />
          </div>
        </div>
      }
      actions={
        showActions
          ? [
              <Tooltip title="预览">
                <EyeOutlined onClick={() => handlePreview(component)} />
              </Tooltip>,
              component.author === '我' ? (
                <Tooltip title="编辑">
                  <EditOutlined />
                </Tooltip>
              ) : (
                <Tooltip title="下载">
                  <DownloadOutlined />
                </Tooltip>
              ),
              <Tooltip title="分享">
                <ShareAltOutlined />
              </Tooltip>,
              component.author === '我' ? (
                <Tooltip title="删除">
                  <DeleteOutlined />
                </Tooltip>
              ) : (
                <Tooltip title="收藏">
                  <HeartOutlined />
                </Tooltip>
              ),
            ]
          : undefined
      }
    >
      <div className="component-header">
        <div className="component-info">
          <Avatar size={32} className="component-avatar">
            {component.avatar}
          </Avatar>
          <div>
            <Title level={5} className="component-name">
              {component.name}
            </Title>
            <Text type="secondary" className="component-author">
              by {component.author}
            </Text>
          </div>
        </div>
        {component.isPublic && <Badge status="success" text="公开" />}
      </div>

      <Paragraph ellipsis={{ rows: 2 }} type="secondary" className="component-description">
        {component.description}
      </Paragraph>

      <div className="component-tags">
        {component.tags.slice(0, 3).map((tag, index) => (
          <Tag key={index} color="rgb(0, 0, 255)">
            {tag}
          </Tag>
        ))}
        {component.tags.length > 3 && <Tag color="default">+{component.tags.length - 3}</Tag>}
      </div>

      <Divider style={{ margin: '12px 0' }} />

      <div className="component-stats">
        <Space split={<Divider type="vertical" />}>
          {component.downloads > 0 && (
            <Space size={4}>
              <DownloadOutlined />
              <Text type="secondary">{component.downloads}</Text>
            </Space>
          )}
          {component.likes > 0 && (
            <Space size={4}>
              <HeartOutlined />
              <Text type="secondary">{component.likes}</Text>
            </Space>
          )}
          {component.rating > 0 && (
            <Space size={4}>
              <StarOutlined />
              <Text type="secondary">{component.rating}</Text>
            </Space>
          )}
          <Space size={4}>
            <ClockCircleOutlined />
            <Text type="secondary">{component.lastUpdated}</Text>
          </Space>
        </Space>
      </div>
    </Card>
  );

  const filterComponents = (components: Component[]) => {
    return components.filter((component) => {
      const matchesSearch =
        component.name.toLowerCase().includes(searchText.toLowerCase()) ||
        component.description.toLowerCase().includes(searchText.toLowerCase()) ||
        component.tags.some((tag) => tag.toLowerCase().includes(searchText.toLowerCase()));
      const matchesCategory = categoryFilter === 'all' || component.category === categoryFilter;
      return matchesSearch && matchesCategory;
    });
  };

  const renderMyComponents = () => {
    const filteredComponents = filterComponents(myComponents);

    return (
      <div className="my-components">
        <div className="section-header">
          <div>
            <Title level={4}>我的组件</Title>
            <Text type="secondary">管理您创建的业务组件</Text>
          </div>
          <Button type="primary" icon={<PlusOutlined />}>
            上传新组件
          </Button>
        </div>

        {filteredComponents.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredComponents.map((component) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={component.id}>
                {renderComponentCard(component)}
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="还没有组件，快去创建一个吧！" image={Empty.PRESENTED_IMAGE_SIMPLE}>
            <Button type="primary" icon={<PlusOutlined />}>
              上传新组件
            </Button>
          </Empty>
        )}
      </div>
    );
  };

  const renderMarketplace = () => {
    const filteredComponents = filterComponents(marketComponents);

    return (
      <div className="marketplace">
        <div className="section-header">
          <div>
            <Title level={4}>资产市场</Title>
            <Text type="secondary">发现和使用社区贡献的优质组件</Text>
          </div>
        </div>

        {filteredComponents.length > 0 ? (
          <Row gutter={[16, 16]}>
            {filteredComponents.map((component) => (
              <Col xs={24} sm={12} lg={8} xl={6} key={component.id}>
                {renderComponentCard(component)}
              </Col>
            ))}
          </Row>
        ) : (
          <Empty description="没有找到匹配的组件" image={Empty.PRESENTED_IMAGE_SIMPLE} />
        )}
      </div>
    );
  };

  return (
    <div className="asset-management">
      <div className="asset-header">
        <Title level={3}>资产管理</Title>
        <Text type="secondary">管理和发现优质的业务组件</Text>
      </div>

      <div className="asset-filters">
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Search
              placeholder="搜索组件名称、描述或标签..."
              allowClear
              size="large"
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
            />
          </Col>
          <Col>
            <Select
              value={categoryFilter}
              onChange={setCategoryFilter}
              size="large"
              style={{ width: 120 }}
              suffixIcon={<FilterOutlined />}
            >
              <Option value="all">全部分类</Option>
              {categories.slice(1).map((category) => (
                <Option key={category} value={category}>
                  {category}
                </Option>
              ))}
            </Select>
          </Col>
        </Row>
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        className="asset-tabs"
        items={[
          {
            key: 'my-components',
            label: (
              <span>
                <AppstoreOutlined />
                我的组件
              </span>
            ),
            children: renderMyComponents(),
          },
          {
            key: 'marketplace',
            label: (
              <span>
                <GlobalOutlined />
                资产市场
              </span>
            ),
            children: renderMarketplace(),
          },
        ]}
      />

      <Modal
        title={selectedComponent?.name}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        width={800}
        footer={[
          <Button key="close" onClick={() => setIsModalVisible(false)}>
            关闭
          </Button>,
          selectedComponent?.author !== '我' && (
            <Button key="download" type="primary" icon={<DownloadOutlined />}>
              下载使用
            </Button>
          ),
        ]}
      >
        {selectedComponent && (
          <div className="component-detail">
            <img
              src={selectedComponent.preview}
              alt={selectedComponent.name}
              style={{ width: '100%', height: 300, objectFit: 'cover', marginBottom: 16 }}
            />
            <Paragraph>{selectedComponent.description}</Paragraph>

            <div className="component-meta">
              <Row gutter={16}>
                <Col span={12}>
                  <Text strong>作者：</Text>
                  <Text>{selectedComponent.author}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>分类：</Text>
                  <Text>{selectedComponent.category}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>更新时间：</Text>
                  <Text>{selectedComponent.lastUpdated}</Text>
                </Col>
                <Col span={12}>
                  <Text strong>评分：</Text>
                  <Rate disabled value={selectedComponent.rating} />
                </Col>
              </Row>
            </div>

            <div className="component-tags-detail">
              <Text strong>标签：</Text>
              <div style={{ marginTop: 8 }}>
                {selectedComponent.tags.map((tag, index) => (
                  <Tag key={index} color="rgb(0, 0, 255)">
                    {tag}
                  </Tag>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AssetManagement;
