import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Drawer, Space, Timeline, Typography } from 'antd';
import React from 'react';

const { Text, Paragraph, Title } = Typography;

export type ThoughtChainStatus = 'pending' | 'in_progress' | 'success' | 'error';

export interface ThoughtChainItem {
  id: string;
  title: string;
  status: ThoughtChainStatus;
  content?: string;
  startedAt?: string;
  finishedAt?: string;
  kind?: 'response' | 'task';
}

interface CodeGenerationDrawerProps {
  open: boolean;
  onClose: () => void;
  items: ThoughtChainItem[];
  isGenerating?: boolean;
}

const STATUS_COLORS: Record<ThoughtChainStatus, string> = {
  pending: 'gray',
  in_progress: 'blue',
  success: 'green',
  error: 'red',
};

const STATUS_DOTS: Record<ThoughtChainStatus, React.ReactNode> = {
  pending: <ClockCircleOutlined style={{ color: 'rgba(0, 0, 0, 0.45)' }} />,
  in_progress: <LoadingOutlined />,
  success: <CheckCircleOutlined style={{ color: 'rgb(82, 196, 26)' }} />,
  error: <CloseCircleOutlined style={{ color: 'rgb(255, 85, 0)' }} />,
};

const STATUS_LABELS: Record<ThoughtChainStatus, string> = {
  pending: '待开始',
  in_progress: '进行中',
  success: '已完成',
  error: '已失败',
};

const formatTimestamp = (timestamp?: string) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  return date.toLocaleString();
};

const CodeGenerationDrawer: React.FC<CodeGenerationDrawerProps> = ({ open, onClose, items, isGenerating }) => {
  const timelineItems = items.map((item) => ({
    color: STATUS_COLORS[item.status],
    dot: STATUS_DOTS[item.status],
    children: (
      <Space direction="vertical" size={4} style={{ width: '100%' }}>
        <Space align="baseline" size={8} style={{ justifyContent: 'space-between', width: '100%' }}>
          <Text strong>{item.title}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>
            {formatTimestamp(item.startedAt)}
          </Text>
        </Space>
        {item.content ? (
          <Paragraph style={{ marginBottom: 0, whiteSpace: 'pre-wrap' }}>{item.content}</Paragraph>
        ) : (
          <Text type="secondary">等待模型响应...</Text>
        )}
        {item.kind === 'task' ? (
          <Text type="secondary" style={{ fontSize: 12 }}>
            状态：{STATUS_LABELS[item.status]}
          </Text>
        ) : null}
      </Space>
    ),
  }));

  return (
    <Drawer
      title={
        <Space direction="vertical" size={4}>
          <Title level={5} style={{ margin: 0 }}>
            代码生成
          </Title>
          <Text type="secondary" style={{ fontSize: 12 }}>
            根据模型调用实时追踪生成进度
          </Text>
        </Space>
      }
      placement="right"
      width={1280}
      open={open}
      onClose={onClose}
    >
      {items.length ? (
        <Timeline mode="left" items={timelineItems} />
      ) : (
        <div
          style={{
            marginTop: 48,
            textAlign: 'center',
            color: 'rgba(0, 0, 0, 0.45)',
          }}
        >
          <LoadingOutlined style={{ fontSize: 32, marginBottom: 16 }} spin={isGenerating} />
          <div>暂无模型调用记录，点击「生成代码」开始体验</div>
        </div>
      )}
    </Drawer>
  );
};

export default CodeGenerationDrawer;
