import React, { useState } from 'react';
import { Card, Button, Space, Typography, Tag, App } from 'antd';
import {
  PlayCircleOutlined,
} from '@ant-design/icons';
import DocumentStatusDemo from '../components/DocumentStatusDemo';

const { Title, Text } = Typography;

const DocumentDemoPage: React.FC = () => {
  const { message } = App.useApp();
  const [designStatus, setDesignStatus] = useState<'pending' | 'syncing' | 'synced' | 'editing' | 'completed' | 'failed'>('pending');
  const [prdStatus, setPrdStatus] = useState<'pending' | 'syncing' | 'synced' | 'editing' | 'completed' | 'failed'>('pending');
  const [openapiStatus, setOpenapiStatus] = useState<'pending' | 'syncing' | 'synced' | 'editing' | 'completed' | 'failed'>('pending');
  const [progress, setProgress] = useState(0);

  const handleSync = (type: 'design' | 'prd' | 'openapi') => {
    const setStatus = type === 'design' ? setDesignStatus : type === 'prd' ? setPrdStatus : setOpenapiStatus;
    
    setStatus('syncing');
    setProgress(0);
    
    // 模拟同步进度
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setStatus('synced');
          message.success('同步完成！');
          return 100;
        }
        return prev + 10;
      });
    }, 200);
  };

  const handleEdit = (type: 'design' | 'prd' | 'openapi') => {
    const setStatus = type === 'design' ? setDesignStatus : type === 'prd' ? setPrdStatus : setOpenapiStatus;
    setStatus('editing');
    message.info('开始编辑模式');
  };

  const handleComplete = (type: 'design' | 'prd' | 'openapi') => {
    const setStatus = type === 'design' ? setDesignStatus : type === 'prd' ? setPrdStatus : setOpenapiStatus;
    setStatus('completed');
    message.success('已标记为完成！');
  };

  const resetDemo = () => {
    setDesignStatus('pending');
    setPrdStatus('pending');
    setOpenapiStatus('pending');
    setProgress(0);
    message.info('演示已重置');
  };

  return (
    <div style={{ padding: 24, background: 'rgb(245, 245, 245)', minHeight: '100vh' }}>
      <Card style={{ maxWidth: 800, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <Title level={3}>📄 文档关联功能演示</Title>
          <Text type="secondary">
            展示设计稿、PRD文档、OpenAPI文档的完整同步和管理流程
          </Text>
        </div>

        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* 功能说明 */}
          <Card size="small" style={{ background: 'rgb(240, 249, 255)', border: '1px solid rgb(186, 231, 255)' }}>
            <Title level={5}>🎯 功能流程</Title>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
              <Tag color="default">待同步</Tag>
              <span>→</span>
              <Tag color="processing">同步中</Tag>
              <span>→</span>
              <Tag color="warning">已同步</Tag>
              <span>→</span>
              <Tag color="processing">编辑中</Tag>
              <span>→</span>
              <Tag color="success">已完成</Tag>
            </div>
          </Card>

          {/* 文档演示 */}
          <Card title="关联文档管理">
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
              <DocumentStatusDemo
                documentType="design"
                url="https://MasterGo.com/file/example-design"
                status={designStatus}
                progress={designStatus === 'syncing' ? progress : 0}
                onSync={() => handleSync('design')}
                onEdit={() => handleEdit('design')}
                onComplete={() => handleComplete('design')}
              />

              <DocumentStatusDemo
                documentType="prd"
                url="https://docs.company.com/prd/product-requirements"
                status={prdStatus}
                progress={prdStatus === 'syncing' ? progress : 0}
                onSync={() => handleSync('prd')}
                onEdit={() => handleEdit('prd')}
                onComplete={() => handleComplete('prd')}
              />

              <DocumentStatusDemo
                documentType="openapi"
                url="https://api.company.com/v1/openapi.json"
                status={openapiStatus}
                progress={openapiStatus === 'syncing' ? progress : 0}
                onSync={() => handleSync('openapi')}
                onEdit={() => handleEdit('openapi')}
                onComplete={() => handleComplete('openapi')}
              />
            </Space>
          </Card>

          {/* 操作按钮 */}
          <Card>
            <Space>
              <Button 
                icon={<PlayCircleOutlined />}
                onClick={resetDemo}
              >
                重置演示
              </Button>
              <Button 
                type="primary"
                onClick={() => {
                  handleSync('design');
                  setTimeout(() => handleSync('prd'), 1000);
                  setTimeout(() => handleSync('openapi'), 2000);
                }}
              >
                批量同步所有文档
              </Button>
            </Space>
          </Card>

          {/* 使用说明 */}
          <Card title="📋 使用说明">
            <Space direction="vertical" style={{ width: '100%' }}>
              <div>
                <Text strong>1. 同步阶段：</Text>
                <Text type="secondary"> 点击"同步"按钮从远程URL读取文档内容</Text>
              </div>
              <div>
                <Text strong>2. 编辑阶段：</Text>
                <Text type="secondary"> 同步完成后可以开始编辑调整</Text>
              </div>
              <div>
                <Text strong>3. 完成阶段：</Text>
                <Text type="secondary"> 编辑完成后标记为完成状态</Text>
              </div>
              <div>
                <Text strong>4. 状态追踪：</Text>
                <Text type="secondary"> 每个文档的状态变更都会被记录和展示</Text>
              </div>
            </Space>
          </Card>
        </Space>
      </Card>
    </div>
  );
};

export default DocumentDemoPage;