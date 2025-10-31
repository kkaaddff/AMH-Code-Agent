import { Drawer, Space, Typography, List, Divider } from 'antd';
import { ThoughtChain, type ThoughtChainItem as AntThoughtChainItem } from '@ant-design/x';
import { LoadingOutlined, CheckSquareFilled, BorderOutlined } from '@ant-design/icons';
import React, { useMemo } from 'react';
import { useCodeGeneration } from '../contexts/CodeGenerationContext';

const { Text, Title } = Typography;

interface CodeGenerationDrawerProps {
  open: boolean;
  onClose: () => void;
}

const CodeGenerationDrawer: React.FC<CodeGenerationDrawerProps> = ({ open, onClose }) => {
  const { thoughtChainItems, isGenerating } = useCodeGeneration();

  // 分离 TODO 和 迭代数据
  const { todoItems, iterationItems } = useMemo(() => {
    const todos = thoughtChainItems.filter((item) => item.kind === 'task');
    const iterations = thoughtChainItems.filter((item) => item.kind === 'iteration');
    return { todoItems: todos, iterationItems: iterations };
  }, [thoughtChainItems]);

  // 将迭代数据转换为 ThoughtChain 格式
  const thoughtChainData = useMemo(() => {
    return iterationItems.map((item): AntThoughtChainItem => {
      // ThoughtChain 只支持 pending, success, error 三种状态
      let status: 'pending' | 'success' | 'error' = 'pending';
      if (item.status === 'success') status = 'success';
      else if (item.status === 'error') status = 'error';

      const icon = item.status === 'in_progress' ? <LoadingOutlined spin /> : undefined;

      return {
        key: item.id,
        title: item.title,
        status,
        icon,
        content: item.content || '',
        extra: item.startedAt
          ? new Date(item.startedAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : undefined,
      };
    });
  }, [iterationItems]);

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
      {/* 上视图：TODO 列表 */}
      <div style={{ marginBottom: 16 }}>
        <Title level={5} style={{ marginBottom: 12 }}>
          任务列表 ({todoItems.length})
        </Title>
        <div
          style={{
            maxHeight: '60vh',
            overflow: 'auto',
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            backgroundColor: '#fafafa',
          }}
        >
          {todoItems.length > 0 ? (
            <List
              size="small"
              dataSource={todoItems}
              renderItem={(item) => {
                const isCompleted = item.status === 'success';
                const isInProgress = item.status === 'in_progress';

                return (
                  <List.Item
                    style={{
                      padding: '8px 16px',
                      backgroundColor: isCompleted ? '#f6ffed' : isInProgress ? '#e6f7ff' : '#fff',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                  >
                    <Space align="start" size={8} style={{ width: '100%' }}>
                      {isCompleted ? (
                        <CheckSquareFilled style={{ color: '#52c41a', fontSize: 16, marginTop: 2 }} />
                      ) : isInProgress ? (
                        <LoadingOutlined spin style={{ color: '#1890ff', fontSize: 16, marginTop: 2 }} />
                      ) : (
                        <BorderOutlined style={{ color: '#d9d9d9', fontSize: 16, marginTop: 2 }} />
                      )}
                      <div style={{ flex: 1 }}>
                        <Text
                          style={{
                            textDecoration: isCompleted ? 'line-through' : 'none',
                            color: isCompleted ? '#8c8c8c' : '#000',
                            display: 'block',
                            marginBottom: 4,
                          }}
                        >
                          {item.title}
                        </Text>
                        {item.content && item.content !== item.title && (
                          <Text
                            type="secondary"
                            style={{
                              fontSize: 12,
                              textDecoration: isCompleted ? 'line-through' : 'none',
                            }}
                          >
                            {item.content}
                          </Text>
                        )}
                      </div>
                      {item.startedAt && (
                        <Text type="secondary" style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
                          {new Date(item.startedAt).toLocaleTimeString('zh-CN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </Text>
                      )}
                    </Space>
                  </List.Item>
                );
              }}
            />
          ) : (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'rgba(0, 0, 0, 0.45)',
              }}
            >
              {isGenerating ? '等待任务列表...' : '暂无任务'}
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* 下视图：迭代信息 */}
      <div>
        <Title level={5} style={{ marginBottom: 12 }}>
          迭代过程 ({iterationItems.length})
        </Title>
        {thoughtChainData.length > 0 ? (
          <ThoughtChain size="small" collapsible items={thoughtChainData} />
        ) : (
          <div
            style={{
              padding: 32,
              textAlign: 'center',
              color: 'rgba(0, 0, 0, 0.45)',
              border: '1px solid #f0f0f0',
              borderRadius: 8,
              backgroundColor: '#fafafa',
            }}
          >
            <div style={{ fontSize: 14 }}>
              {isGenerating ? '正在初始化代码生成...' : '暂无迭代记录，点击「生成代码」开始体验'}
            </div>
          </div>
        )}
      </div>
    </Drawer>
  );
};

export default CodeGenerationDrawer;
