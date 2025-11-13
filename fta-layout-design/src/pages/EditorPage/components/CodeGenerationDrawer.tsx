import { BorderOutlined, CheckSquareFilled, ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Alert, Divider, Drawer, List, Modal, Space, Typography } from 'antd';
import React, { useMemo } from 'react';
import { Streamdown } from 'streamdown';
import { useSnapshot } from 'valtio/react';
import { codeGenerationActions, codeGenerationStore } from '../contexts/CodeGenerationContext';

const { Text, Title } = Typography;

interface CodeGenerationDrawerProps {
  abortGeneration: () => void;
}
const CodeGenerationDrawer: React.FC<CodeGenerationDrawerProps> = ({ abortGeneration }) => {
  const { thoughtChainItems, generationStatus, isDrawerOpen } = useSnapshot(codeGenerationStore);

  // 分离 TODO 和 迭代数据
  const { todoItems, iterationItems } = useMemo(() => {
    const todos = thoughtChainItems.filter((item) => item.kind === 'task');
    const iterations = thoughtChainItems.filter((item) => item.kind === 'iteration');
    return { todoItems: todos, iterationItems: iterations };
  }, [thoughtChainItems]);

  const handleClose = () => {
    // 如果正在生成中，显示确认弹窗
    if (generationStatus === 'generating') {
      Modal.confirm({
        title: '确认强制退出',
        icon: <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />,
        content: (
          <div>
            <p>代码生成正在进行中，强制退出将中断当前任务。</p>
            <p style={{ marginBottom: 0, color: '#ff4d4f', fontWeight: 500 }}>此操作不可恢复，确定要退出吗？</p>
          </div>
        ),
        okText: '强制退出',
        okType: 'danger',
        cancelText: '继续生成',
        onOk: () => {
          abortGeneration();
        },
      });
    } else {
      // 非生成状态直接关闭
      codeGenerationActions.closeDrawer();
    }
  };

  // 将迭代数据格式化为 Markdown 文本
  const iterationMarkdown = useMemo(() => {
    if (iterationItems.length === 0) {
      return '';
    }

    return iterationItems
      .map((item) => {
        const content = (item.content || '').trim();
        if (content === '') {
          return '';
        }

        const timestamp = item.startedAt
          ? new Date(item.startedAt).toLocaleTimeString('zh-CN', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })
          : '';

        // 构建迭代块
        const parts: string[] = [];
        const titleLine = timestamp ? ` *${timestamp}*` : '';
        parts.push(titleLine);
        parts.push(''); // 空行分隔

        // 内容部分
        if (content) {
          parts.push(content);
        }

        return parts.join('\n');
      })
      .filter((item) => item !== '')
      .join('\n\n---\n\n');
  }, [iterationItems]);

  return (
    <Drawer
      title={
        <Space direction='vertical' size={4}>
          <Title level={5} style={{ margin: 0 }}>
            代码生成
          </Title>
          <Text type='secondary' style={{ fontSize: 12 }}>
            根据模型调用实时追踪生成进度
          </Text>
        </Space>
      }
      placement='right'
      width={1280}
      open={isDrawerOpen}
      closable={{ placement: 'end' }}
      maskClosable={false}
      onClose={handleClose}>
      {generationStatus === 'generating' && (
        <Alert
          message='  代码生成正在进行中，请耐心等待。'
          type='info'
          showIcon
          icon={<LoadingOutlined spin />}
          style={{ marginBottom: 16 }}
        />
      )}
      {generationStatus === 'completed' && (
        <Alert
          message='代码生成完成'
          description='代码生成已成功完成，您可以查看下方的运行日志了解详细信息。'
          type='success'
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {generationStatus === 'failed' && (
        <Alert
          message='代码生成失败'
          description='代码生成过程中出现错误，请查看下方的运行日志了解详细信息，或重新尝试生成。'
          type='error'
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}

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
          }}>
          {todoItems.length > 0 ? (
            <List
              size='small'
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
                    }}>
                    <Space align='start' size={8} style={{ width: '100%' }}>
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
                          }}>
                          {item.title}
                        </Text>
                        {item.content && item.content !== item.title && (
                          <Text
                            type='secondary'
                            style={{
                              fontSize: 12,
                              textDecoration: isCompleted ? 'line-through' : 'none',
                            }}>
                            {item.content}
                          </Text>
                        )}
                      </div>
                      {item.startedAt && (
                        <Text type='secondary' style={{ fontSize: 11, whiteSpace: 'nowrap' }}>
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
              }}>
              {generationStatus === 'generating' ? '等待任务列表...' : '暂无任务'}
            </div>
          )}
        </div>
      </div>

      <Divider />

      {/* 下视图：迭代信息 */}
      <div>
        <Title level={5} style={{ marginBottom: 12 }}>
          运行日志:
        </Title>
        <div
          style={{
            border: '1px solid #f0f0f0',
            borderRadius: 8,
            backgroundColor: '#fafafa',
            minHeight: 200,
            maxHeight: 'calc(40vh - 70px)',
            overflow: 'auto',
          }}>
          {iterationMarkdown ? (
            <div style={{ padding: 16 }}>
              <Streamdown isAnimating={generationStatus === 'generating'}>{iterationMarkdown}</Streamdown>
            </div>
          ) : (
            <div
              style={{
                padding: 32,
                textAlign: 'center',
                color: 'rgba(0, 0, 0, 0.45)',
              }}>
              <div style={{ fontSize: 14 }}>
                {generationStatus === 'generating' ? '正在初始化代码生成...' : '暂无迭代记录，点击「生成代码」开始体验'}
              </div>
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
};

export default CodeGenerationDrawer;
