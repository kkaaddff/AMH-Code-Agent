import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, LoadingOutlined, DownloadOutlined } from '@ant-design/icons';
import { Drawer, Space, Timeline, Typography, Button, message } from 'antd';
import React, { useState } from 'react';

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
  const [isSaving, setIsSaving] = useState(false);

  // 提取代码文件信息
  const extractCodeFiles = (content: string): Array<{ path: string; content: string }> => {
    const files: Array<{ path: string; content: string }> = [];
    // 匹配代码块格式: ```filename 或 ```language:filename
    const codeBlockRegex = /```(?:[\w]+:)?([^\n]+)\n([\s\S]*?)```/g;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      const filename = match[1].trim();
      const fileContent = match[2];
      
      // 如果文件名看起来像是路径（包含 / 或扩展名）
      if (filename && (filename.includes('/') || filename.includes('.'))) {
        files.push({
          path: filename,
          content: fileContent,
        });
      }
    }

    return files;
  };

  // 使用 File System Access API 保存文件
  const handleSaveToFiles = async () => {
    try {
      // 检查浏览器是否支持 File System Access API
      if (!('showDirectoryPicker' in window)) {
        message.error('当前浏览器不支持文件系统 API，请使用 Chrome 或 Edge 浏览器');
        return;
      }

      // 收集所有生成的代码内容
      const allFiles: Array<{ path: string; content: string }> = [];
      items.forEach((item) => {
        if (item.content && item.status === 'success') {
          const files = extractCodeFiles(item.content);
          allFiles.push(...files);
        }
      });

      if (allFiles.length === 0) {
        message.warning('未找到可保存的文件内容');
        return;
      }

      setIsSaving(true);

      // 让用户选择工作目录
      const dirHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
      });

      // 循环保存文件
      let savedCount = 0;
      for (const file of allFiles) {
        try {
          // 处理相对路径，创建嵌套目录
          const pathParts = file.path.split('/');
          const fileName = pathParts.pop() || 'output.txt';
          
          // 递归创建目录
          let currentDirHandle = dirHandle;
          for (const dirName of pathParts) {
            if (dirName) {
              currentDirHandle = await currentDirHandle.getDirectoryHandle(dirName, {
                create: true,
              });
            }
          }

          // 创建并写入文件
          const fileHandle = await currentDirHandle.getFileHandle(fileName, {
            create: true,
          });
          const writable = await fileHandle.createWritable();
          await writable.write(file.content);
          await writable.close();
          
          savedCount++;
        } catch (err) {
          console.error(`保存文件 ${file.path} 失败:`, err);
        }
      }

      message.success(`成功保存 ${savedCount} 个文件到指定目录`);
    } catch (err: any) {
      if (err.name === 'AbortError') {
        message.info('已取消保存');
      } else {
        message.error(`保存文件失败: ${err.message}`);
        console.error('保存文件错误:', err);
      }
    } finally {
      setIsSaving(false);
    }
  };

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
      extra={
        <Button
          type="primary"
          icon={<DownloadOutlined />}
          onClick={handleSaveToFiles}
          loading={isSaving}
          disabled={items.length === 0 || isGenerating}
        >
          保存文件
        </Button>
      }
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
