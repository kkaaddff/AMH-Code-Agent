import {
  ApiOutlined,
  CheckCircleOutlined,
  FileImageOutlined,
  FileTextOutlined,
  LinkOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { Button, Card, Progress, Tag, Typography } from 'antd';
import { getDocumentStatusText } from '@/utils/documentStatus';
import React from 'react';

const { Text } = Typography;

interface DocumentStatusDemoProps {
  documentType: 'design' | 'prd' | 'openapi';
  url: string;
  status: 'pending' | 'syncing' | 'synced' | 'editing' | 'completed' | 'failed';
  progress?: number;
  onSync?: () => void;
  onEdit?: () => void;
  onComplete?: () => void;
}

const DocumentStatusDemo: React.FC<DocumentStatusDemoProps> = ({
  documentType,
  url,
  status,
  progress = 0,
  onSync,
  onEdit,
  onComplete,
}) => {
  const getDocumentIcon = () => {
    switch (documentType) {
      case 'design':
        return <FileImageOutlined style={{ color: 'rgb(24, 144, 255)' }} />;
      case 'prd':
        return <FileTextOutlined style={{ color: 'rgb(82, 196, 26)' }} />;
      case 'openapi':
        return <ApiOutlined style={{ color: 'rgb(250, 140, 22)' }} />;
      default:
        return <FileImageOutlined />;
    }
  };

  const getDocumentName = () => {
    switch (documentType) {
      case 'design':
        return '设计稿';
      case 'prd':
        return 'PRD文档';
      case 'openapi':
        return 'OpenAPI文档';
      default:
        return '文档';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'pending':
        return 'default';
      case 'syncing':
        return 'processing';
      case 'synced':
        return 'warning';
      case 'editing':
        return 'processing';
      case 'completed':
        return 'success';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Card size="small" className="document-link-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {getDocumentIcon()}
          <div>
            <Text strong>{getDocumentName()}</Text>
            <br />
            <Text type="secondary" style={{ fontSize: 12 }}>
              <LinkOutlined /> {url}
            </Text>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Tag color={getStatusColor()}>{getDocumentStatusText(status)}</Tag>
          {status === 'pending' && (
            <Button type="primary" size="small" icon={<SyncOutlined />} onClick={onSync}>
              同步
            </Button>
          )}
          {status === 'synced' && (
            <Button type="default" size="small" onClick={onEdit}>
              开始编辑
            </Button>
          )}
          {status === 'editing' && (
            <Button type="primary" size="small" icon={<CheckCircleOutlined />} onClick={onComplete}>
              标记完成
            </Button>
          )}
        </div>
      </div>
      {status === 'syncing' && <Progress percent={progress} size="small" style={{ marginTop: 8 }} />}
    </Card>
  );
};

export default DocumentStatusDemo;
