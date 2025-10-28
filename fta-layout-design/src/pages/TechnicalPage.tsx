import React from 'react';
import { Card, Typography, Row, Col, Table, Tag, Space, Descriptions } from 'antd';
import {
  DatabaseOutlined,
  CloudOutlined,
  CodeOutlined,
  ApiOutlined,
  SecurityScanOutlined,
  ToolOutlined,
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const TechnicalPage: React.FC = () => {
  const architectureComponents = [
    {
      name: '设计解析引擎',
      category: '核心引擎',
      description: '智能解析设计稿，提取布局和样式信息',
      technology: 'Node.js + Python',
      features: ['图像识别', 'AI分析', '语义理解'],
    },
    {
      name: '代码生成器',
      category: '核心引擎',
      description: '基于设计数据自动生成前端代码',
      technology: 'TypeScript + AST',
      features: ['模板引擎', '代码优化', '类型检查'],
    },
    {
      name: '组件库适配',
      category: '适配层',
      description: '适配不同前端组件库的API差异',
      technology: 'React + Vue',
      features: ['组件映射', 'API适配', '样式转换'],
    },
    {
      name: 'DSL渲染器',
      category: '渲染层',
      description: '实时预览和编辑设计布局',
      technology: 'Canvas + SVG',
      features: ['实时渲染', '交互编辑', '性能优化'],
    },
  ];

  const techStack = [
    {
      category: '前端技术',
      icon: <CodeOutlined />,
      technologies: [
        { name: 'React 18', version: '^18.2.0', purpose: '用户界面框架' },
        { name: 'TypeScript', version: '^5.2.2', purpose: '类型安全' },
        { name: 'Ant Design', version: '^5.12.0', purpose: 'UI组件库' },
        { name: 'Vite', version: '^5.0.8', purpose: '构建工具' },
      ],
    },
    {
      category: '后端技术',
      icon: <DatabaseOutlined />,
      technologies: [
        { name: 'Node.js', version: '^18.0.0', purpose: 'API服务' },
        { name: 'Express', version: '^4.18.0', purpose: 'Web框架' },
        { name: 'MongoDB', version: '^6.0.0', purpose: '数据存储' },
        { name: 'Redis', version: '^7.0.0', purpose: '缓存服务' },
      ],
    },
    {
      category: '云服务',
      icon: <CloudOutlined />,
      technologies: [
        { name: 'AWS S3', version: 'Latest', purpose: '文件存储' },
        { name: 'CDN', version: 'CloudFlare', purpose: '内容分发' },
        { name: 'Docker', version: '^24.0.0', purpose: '容器化部署' },
        { name: 'Kubernetes', version: '^1.28.0', purpose: '容器编排' },
      ],
    },
  ];

  const features = [
    '支持多种设计工具格式解析',
    '每个步骤均可进行交互式编辑',
    '编译打包 DSL 文件生成可运行项目',
    '可以批量台批量操作',
    '模块可以复用',
    '数据可以缓存/后端API',
  ];

  const columns = [
    {
      title: '组件名称',
      dataIndex: 'name',
      key: 'name',
      render: (text: string) => <strong>{text}</strong>,
    },
    {
      title: '分类',
      dataIndex: 'category',
      key: 'category',
      render: (category: string) => {
        const color = category === '核心引擎' ? 'rgb(0, 0, 255)' : category === '适配层' ? 'rgb(0, 128, 0)' : 'rgb(255, 165, 0)';
        return <Tag color={color}>{category}</Tag>;
      },
    },
    {
      title: '技术栈',
      dataIndex: 'technology',
      key: 'technology',
    },
    {
      title: '核心特性',
      dataIndex: 'features',
      key: 'features',
      render: (features: string[]) => (
        <Space wrap>
          {features.map((feature, index) => (
            <Tag key={index} color="rgb(0, 255, 255)">
              {feature}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
    },
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'rgb(245, 245, 245)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Title level={1} style={{ color: 'rgb(24, 144, 255)', marginBottom: '16px' }}>
            技术方案设计
          </Title>
          <Text style={{ fontSize: '18px', color: 'rgb(102, 102, 102)' }}>基于现代前端技术栈的设计到代码自动化平台</Text>
        </div>

        {/* Architecture Overview */}
        <Card style={{ marginBottom: '40px' }}>
          <Title level={2} style={{ marginBottom: '24px' }}>
            <ToolOutlined style={{ marginRight: '8px' }} />
            系统架构组件
          </Title>
          <Table dataSource={architectureComponents} columns={columns} pagination={false} size="middle" />
        </Card>

        {/* Technology Stack */}
        <Row gutter={[24, 24]} style={{ marginBottom: '40px' }}>
          {techStack.map((stack, index) => (
            <Col span={8} key={index}>
              <Card
                style={{ height: '100%' }}
                title={
                  <Space>
                    <span style={{ fontSize: '20px', color: 'rgb(24, 144, 255)' }}>{stack.icon}</span>
                    <span>{stack.category}</span>
                  </Space>
                }
              >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                  {stack.technologies.map((tech, idx) => (
                    <Descriptions
                      key={idx}
                      size="small"
                      column={1}
                      bordered
                      items={[
                        {
                          label: '技术',
                          children: <strong>{tech.name}</strong>,
                        },
                        {
                          label: '版本',
                          children: <Tag color="rgb(0, 0, 255)">{tech.version}</Tag>,
                        },
                        {
                          label: '用途',
                          children: <Text type="secondary">{tech.purpose}</Text>,
                        },
                      ]}
                    />
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Platform Features */}
        <Card style={{ marginBottom: '40px' }}>
          <Title level={2} style={{ marginBottom: '24px' }}>
            <ApiOutlined style={{ marginRight: '8px' }} />
            平台核心特性
          </Title>
          <Row gutter={[16, 16]}>
            {features.map((feature, index) => (
              <Col span={12} key={index}>
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgb(248, 249, 250)',
                    borderRadius: '8px',
                    border: '1px solid rgb(233, 236, 239)',
                  }}
                >
                  <Text style={{ fontSize: '16px' }}>
                    <span style={{ color: 'rgb(82, 196, 26)', marginRight: '8px' }}>✓</span>
                    {feature}
                  </Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Security & Performance */}
        <Row gutter={[24, 24]}>
          <Col span={12}>
            <Card
              title={
                <Space>
                  <SecurityScanOutlined style={{ color: 'rgb(255, 77, 79)' }} />
                  <span>安全策略</span>
                </Space>
              }
              style={{ height: '100%' }}
            >
              <Space direction="vertical" size="middle">
                <div>
                  <Text strong>数据安全</Text>
                  <Paragraph type="secondary" style={{ margin: '8px 0' }}>
                    所有上传文件均加密存储，支持私有化部署
                  </Paragraph>
                </div>
                <div>
                  <Text strong>访问控制</Text>
                  <Paragraph type="secondary" style={{ margin: '8px 0' }}>
                    基于角色的权限管理，API接口鉴权
                  </Paragraph>
                </div>
                <div>
                  <Text strong>代码安全</Text>
                  <Paragraph type="secondary" style={{ margin: '8px 0' }}>
                    生成代码经过安全扫描，防范XSS等安全漏洞
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card
              title={
                <Space>
                  <DatabaseOutlined style={{ color: 'rgb(24, 144, 255)' }} />
                  <span>性能优化</span>
                </Space>
              }
              style={{ height: '100%' }}
            >
              <Space direction="vertical" size="middle">
                <div>
                  <Text strong>渲染优化</Text>
                  <Paragraph type="secondary" style={{ margin: '8px 0' }}>
                    虚拟滚动、懒加载、代码分割等性能优化
                  </Paragraph>
                </div>
                <div>
                  <Text strong>缓存策略</Text>
                  <Paragraph type="secondary" style={{ margin: '8px 0' }}>
                    多级缓存机制，减少重复计算和网络请求
                  </Paragraph>
                </div>
                <div>
                  <Text strong>并发处理</Text>
                  <Paragraph type="secondary" style={{ margin: '8px 0' }}>
                    支持大文件并发处理，提升解析和生成速度
                  </Paragraph>
                </div>
              </Space>
            </Card>
          </Col>
        </Row>
      </div>
    </div>
  );
};

export default TechnicalPage;
