import {
  AppstoreOutlined,
  BarChartOutlined,
  ProjectOutlined,
  RocketOutlined,
  TeamOutlined
} from '@ant-design/icons';
import { Card, Col, Row, Statistic, Tabs, Typography } from 'antd';
import React, { useState } from 'react';
import AssetManagement from './AssetManagement';
import ProjectManagement from './ProjectManagement';
import './styles.css';

const { Title, Text } = Typography;

const HomePage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    { title: '我的项目', value: 12, icon: <ProjectOutlined />, color: 'rgb(24, 144, 255)' },
    { title: '我的组件', value: 28, icon: <AppstoreOutlined />, color: 'rgb(82, 196, 26)' },
    { title: '团队成员', value: 8, icon: <TeamOutlined />, color: 'rgb(114, 46, 209)' },
    { title: '本月发布', value: 5, icon: <RocketOutlined />, color: 'rgb(250, 140, 22)' },
  ];

  const quickActions = [
    { 
      title: '创建新项目', 
      description: '快速创建一个新的前端项目',
      icon: <ProjectOutlined />,
      action: () => console.log('创建项目')
    },
    { 
      title: '上传组件', 
      description: '将您的组件分享到资产市场',
      icon: <AppstoreOutlined />,
      action: () => console.log('上传组件')
    },
    { 
      title: '查看统计', 
      description: '查看项目和组件的使用统计',
      icon: <BarChartOutlined />,
      action: () => console.log('查看统计')
    },
  ];

  const renderOverview = () => (
    <div className="homepage-overview">
      <div className="welcome-section">
        <Title level={2}>欢迎回来！</Title>
        <Text type="secondary">继续您的创作之旅，管理项目和组件资产</Text>
      </div>

      <Row gutter={[16, 16]} className="stats-section">
        {stats.map((stat, index) => (
          <Col xs={24} sm={12} lg={6} key={index}>
            <Card className="stat-card">
              <Statistic
                title={stat.title}
                value={stat.value}
                prefix={<span style={{ color: stat.color }}>{stat.icon}</span>}
                valueStyle={{ color: stat.color }}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <div className="quick-actions-section">
        <Title level={3}>快速操作</Title>
        <Row gutter={[16, 16]}>
          {quickActions.map((action, index) => (
            <Col xs={24} sm={12} lg={8} key={index}>
              <Card 
                className="action-card"
                hoverable
                onClick={action.action}
              >
                <div className="action-content">
                  <div className="action-icon">{action.icon}</div>
                  <div className="action-text">
                    <Title level={4}>{action.title}</Title>
                    <Text type="secondary">{action.description}</Text>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </div>
    </div>
  );

  const tabItems = [
    {
      key: 'overview',
      label: (
        <span>
          <BarChartOutlined />
          概览
        </span>
      ),
      children: renderOverview(),
    },
    {
      key: 'projects',
      label: (
        <span>
          <ProjectOutlined />
          项目管理
        </span>
      ),
      children: <ProjectManagement />,
    },
    {
      key: 'assets',
      label: (
        <span>
          <AppstoreOutlined />
          资产管理
        </span>
      ),
      children: <AssetManagement />,
    },
  ];

  return (
    <div className="homepage-container">
      <Tabs 
        activeKey={activeTab} 
        onChange={setActiveTab}
        size="large"
        className="homepage-tabs"
        items={tabItems}
      />
    </div>
  );
};

export default HomePage;