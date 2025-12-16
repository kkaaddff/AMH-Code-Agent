import { BorderOutlined, CheckSquareFilled, ExclamationCircleOutlined, LoadingOutlined } from '@ant-design/icons';
import { Alert, Collapse, Divider, Drawer, List, Modal, Space, Typography } from 'antd';
import React, { useMemo, useState } from 'react';
import { Streamdown } from 'streamdown';
import { useSnapshot } from 'valtio/react';
import { codeGenerationActions, codeGenerationStore } from '../../contexts/CodeGenerationContext';
import './index.css';

const { Text, Title } = Typography;

interface CodeGenerationDrawerProps {
  abortGeneration: () => void;
}
const CodeGenerationDrawer: React.FC<CodeGenerationDrawerProps> = ({ abortGeneration }) => {
  const { thoughtChainItems, generationStatus, isDrawerOpen } = useSnapshot(codeGenerationStore);
  const [todoListExpanded, setTodoListExpanded] = useState(true);

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
        icon: <ExclamationCircleOutlined className='cg-modal-icon' />,
        content: (
          <div>
            <p>代码生成正在进行中，强制退出将中断当前任务。</p>
            <p className='cg-modal-warning'>此操作不可恢复，确定要退出吗？</p>
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
        if (content === '' || content === '<think></think>') {
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
        // 内容部分
        if (content) {
          parts.push(content);
        }
        return parts.join(' ');
      })
      .filter((item) => item !== '')
      .join('\n\n');
  }, [iterationItems]);

  return (
    <Drawer
      title={
        <Space direction='vertical' size={4}>
          <Title level={5} className='cg-drawer-title'>
            代码生成
          </Title>
          <Text type='secondary' className='cg-drawer-subtitle'>
            根据模型调用实时追踪生成进度
          </Text>
        </Space>
      }
      placement='right'
      width={1280}
      open={isDrawerOpen}
      closable={{ placement: 'end' }}
      maskClosable={false}
      styles={{ body: { overflow: 'hidden' } }}
      onClose={handleClose}>
      <div className='code-generation-drawer'>
        {generationStatus === 'generating' && (
          <Alert
            message='  代码生成正在进行中，请耐心等待。'
            type='info'
            showIcon
            icon={<LoadingOutlined spin />}
            className='cg-alert'
          />
        )}
        {generationStatus === 'completed' && (
          <Alert
            message='代码生成完成'
            description='代码生成已成功完成，您可以查看下方的运行日志了解详细信息。'
            type='success'
            showIcon
            className='cg-alert'
          />
        )}
        {generationStatus === 'failed' && (
          <Alert
            message='代码生成失败'
            description='代码生成过程中出现错误，请查看下方的运行日志了解详细信息，或重新尝试生成。'
            type='error'
            showIcon
            className='cg-alert'
          />
        )}

        {/* 上视图：TODO 列表 */}
        <div className='cg-section'>
          <Collapse
            activeKey={todoListExpanded ? ['todo-list'] : []}
            onChange={(keys) => setTodoListExpanded(keys.includes('todo-list'))}
            items={[
              {
                key: 'todo-list',
                label: (
                  <Title level={5} className='cg-section-title' style={{ margin: 0 }}>
                    任务列表 ({todoItems.length})
                  </Title>
                ),
                children: (
                  <div className='cg-todo-list'>
                    {todoItems.length > 0 ? (
                      <List
                        size='small'
                        dataSource={todoItems}
                        renderItem={(item) => {
                          const isCompleted = item.status === 'success';
                          const isInProgress = item.status === 'in_progress';
                          const itemClassName = [
                            'cg-todo-item',
                            isCompleted ? 'cg-todo-item-completed' : '',
                            isInProgress ? 'cg-todo-item-in-progress' : '',
                          ]
                            .filter(Boolean)
                            .join(' ');

                          return (
                            <List.Item className={itemClassName}>
                              <Space align='start' size={8} className='cg-todo-item-row'>
                                {isCompleted ? (
                                  <CheckSquareFilled className='cg-todo-icon completed' />
                                ) : isInProgress ? (
                                  <LoadingOutlined spin className='cg-todo-icon in-progress' />
                                ) : (
                                  <BorderOutlined className='cg-todo-icon' />
                                )}
                                <div className='cg-todo-item-content'>
                                  <Text className={`cg-todo-item-title ${isCompleted ? 'completed' : 'default'}`}>
                                    {item.title}
                                  </Text>
                                  {item.content && item.content !== item.title && (
                                    <Text
                                      type='secondary'
                                      className={`cg-todo-item-desc ${isCompleted ? 'completed' : 'default'}`}>
                                      {item.content}
                                    </Text>
                                  )}
                                </div>
                                {item.finishedAt && (
                                  <Text type='secondary' className='cg-todo-item-time'>
                                    {new Date(item.finishedAt).toLocaleTimeString('zh-CN', {
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
                      <div className='cg-todo-empty'>
                        {generationStatus === 'generating' ? '等待任务列表...' : '暂无任务'}
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
            ghost
            className='cg-todo-collapse'
          />
        </div>

        <Divider />

        {/* 下视图：迭代信息 */}
        <div className='cg-iteration-section'>
          <Title level={5} className='cg-section-title'>
            运行日志:
          </Title>
          <div className='cg-iteration-container'>
            {iterationMarkdown ? (
              <div className='cg-iteration-content'>
                <Streamdown isAnimating={generationStatus === 'generating'}>{iterationMarkdown}</Streamdown>
              </div>
            ) : (
              <div className='cg-iteration-empty'>
                <div className='cg-iteration-empty-text'>
                  {generationStatus === 'generating'
                    ? '正在初始化代码生成...'
                    : '暂无迭代记录，点击「生成代码」开始体验'}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Drawer>
  );
};

export default CodeGenerationDrawer;
