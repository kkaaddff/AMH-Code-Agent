import React from 'react';
import { Card, Typography, Row, Col, Space } from 'antd';
import { CheckCircleOutlined, ToolOutlined, BulbOutlined, CodeOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const RequirementPage: React.FC = () => {
  const features = [
    {
      title: '需求理解',
      icon: <BulbOutlined />,
      description: '深入分析设计稿需求，理解业务逻辑和用户交互流程',
      details: [
        '设计稿解析与理解',
        '业务逻辑识别',
        '用户交互流程分析',
        '组件层次结构分析'
      ]
    },
    {
      title: '技术选型',
      icon: <ToolOutlined />,
      description: '根据项目需求选择最适合的技术栈和架构方案',
      details: [
        'React/Vue技术栈',
        '组件库选择(Ant Design/Element UI)',
        '状态管理方案',
        '构建工具配置'
      ]
    },
    {
      title: '代码生成',
      icon: <CodeOutlined />,
      description: '自动生成高质量、可维护的前端代码',
      details: [
        '组件化开发',
        'TypeScript类型定义',
        '响应式布局',
        '性能优化'
      ]
    }
  ];

  const capabilities = [
    '支持多种设计工具导入 (MasterGo, Figma, Sketch)',
    '智能识别设计规范',
    '自动生成组件代码',
    '支持多种前端框架',
    '响应式布局自适应',
    '代码质量保证'
  ];

  return (
    <div style={{ minHeight: '100vh', backgroundColor: 'rgb(245, 245, 245)', padding: '40px 20px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '60px' }}>
          <Title level={1} style={{ color: 'rgb(24, 144, 255)', marginBottom: '16px' }}>
            需求理解与分析
          </Title>
          <Text style={{ fontSize: '18px', color: 'rgb(102, 102, 102)' }}>
            深度理解设计需求，提供专业的技术解决方案
          </Text>
        </div>

        {/* Core Features */}
        <Row gutter={[32, 32]} style={{ marginBottom: '60px' }}>
          {features.map((feature, index) => (
            <Col span={8} key={index}>
              <Card
                style={{ height: '100%', textAlign: 'center' }}
                styles={{ body: { padding: '40px 24px' } }}
              >
                <div style={{ fontSize: '48px', color: 'rgb(24, 144, 255)', marginBottom: '16px' }}>
                  {feature.icon}
                </div>
                <Title level={3} style={{ marginBottom: '16px' }}>
                  {feature.title}
                </Title>
                <Paragraph style={{ color: 'rgb(102, 102, 102)', marginBottom: '24px' }}>
                  {feature.description}
                </Paragraph>
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  {feature.details.map((detail, idx) => (
                    <div key={idx} style={{ textAlign: 'left' }}>
                      <CheckCircleOutlined style={{ color: 'rgb(82, 196, 26)', marginRight: '8px' }} />
                      <Text>{detail}</Text>
                    </div>
                  ))}
                </Space>
              </Card>
            </Col>
          ))}
        </Row>

        {/* Platform Capabilities */}
        <Card style={{ marginBottom: '40px' }}>
          <Title level={2} style={{ marginBottom: '24px' }}>
            平台核心能力
          </Title>
          <Row gutter={[16, 16]}>
            {capabilities.map((capability, index) => (
              <Col span={12} key={index}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <CheckCircleOutlined style={{ color: 'rgb(82, 196, 26)', marginRight: '12px', fontSize: '16px' }} />
                  <Text style={{ fontSize: '16px' }}>{capability}</Text>
                </div>
              </Col>
            ))}
          </Row>
        </Card>

        {/* Process Flow */}
        <Card>
          <Title level={2} style={{ marginBottom: '24px' }}>
            工作流程
          </Title>
          <Row gutter={[24, 24]}>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgb(24, 144, 255)',
                  color: 'rgb(255, 255, 255)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0 auto 16px'
                }}>
                  1
                </div>
                <Title level={4}>设计导入</Title>
                <Text type="secondary">
                  上传设计稿或导入设计工具文件
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgb(24, 144, 255)',
                  color: 'rgb(255, 255, 255)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0 auto 16px'
                }}>
                  2
                </div>
                <Title level={4}>需求分析</Title>
                <Text type="secondary">
                  智能解析设计意图和业务需求
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgb(24, 144, 255)',
                  color: 'rgb(255, 255, 255)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0 auto 16px'
                }}>
                  3
                </div>
                <Title level={4}>技术方案</Title>
                <Text type="secondary">
                  制定最优的技术实现方案
                </Text>
              </div>
            </Col>
            <Col span={6}>
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: 'rgb(24, 144, 255)',
                  color: 'rgb(255, 255, 255)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  margin: '0 auto 16px'
                }}>
                  4
                </div>
                <Title level={4}>代码生成</Title>
                <Text type="secondary">
                  自动生成高质量前端代码
                </Text>
              </div>
            </Col>
          </Row>
        </Card>
      </div>
    </div>
  );
};

export default RequirementPage;
