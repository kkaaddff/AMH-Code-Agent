import { dataModelGroupService } from '@/services/dataModelService';
import type { CreateDataModelGroupRequest, DataModelGroup } from '@/types/dataModel';
import { DeleteOutlined, EditOutlined, FolderOutlined, PlusOutlined } from '@ant-design/icons';
import { App, Button, Empty, Form, Input, List, Modal, Popconfirm, Space, Spin, Typography } from 'antd';
import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import './index.css';

const { Title, Text } = Typography;

interface DataModelGroupPanelProps {
  onGroupSelect?: (groupId: string | null) => void;
}

const DataModelGroupPanel: React.FC<DataModelGroupPanelProps> = ({ onGroupSelect }) => {
  const { message, modal } = App.useApp();
  const { projectId, dataModelGroups, dataModels, loadingDataView, selectedGroupId } = useSnapshot(editorPageStore);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<DataModelGroup | null>(null);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // 计算每个分组的数据模型数量
  const getGroupModelCount = (groupId: string | null) => {
    if (groupId === null || groupId === '__ungrouped__') {
      return (dataModels as any[]).filter((m) => !m.groupId).length;
    }
    return (dataModels as any[]).filter((m) => m.groupId === groupId).length;
  };

  // 处理分组选择
  const handleGroupClick = (groupId: string | null) => {
    editorPageActions.setSelectedGroupId(groupId);
    onGroupSelect?.(groupId);
  };

  // 创建分组
  const handleCreate = async (values: { name: string; description?: string }) => {
    if (!projectId) {
      message.error('项目 ID 不存在');
      return;
    }

    setCreating(true);
    try {
      const createData: CreateDataModelGroupRequest = {
        projectId,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      };

      const newGroup = await dataModelGroupService.create(createData);
      editorPageActions.addDataModelGroup(newGroup);
      message.success('分组创建成功');
      setCreateModalOpen(false);
      form.resetFields();
    } catch (error: any) {
      console.error('创建分组失败:', error);
      message.error(error.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  // 打开编辑弹窗
  const handleEdit = (group: DataModelGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroup(group);
    form.setFieldsValue({ name: group.name, description: group.description });
    setEditModalOpen(true);
  };

  // 更新分组
  const handleUpdate = async (values: { name: string; description?: string }) => {
    if (!editingGroup) return;

    setUpdating(true);
    try {
      const updated = await dataModelGroupService.update(editingGroup.id, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
      });
      editorPageActions.updateDataModelGroup(editingGroup.id, updated);
      message.success('分组更新成功');
      setEditModalOpen(false);
      setEditingGroup(null);
      form.resetFields();
    } catch (error: any) {
      console.error('更新分组失败:', error);
      message.error(error.message || '更新失败');
    } finally {
      setUpdating(false);
    }
  };

  // 删除分组
  const handleDelete = async (group: DataModelGroup, e: React.MouseEvent) => {
    e.stopPropagation();

    const modelCount = getGroupModelCount(group.id);
    if (modelCount > 0) {
      modal.warning({
        title: '无法删除',
        content: `该分组下还有 ${modelCount} 个数据模型，请先移除或移动这些数据模型。`,
      });
      return;
    }

    try {
      await dataModelGroupService.delete(group.id);
      editorPageActions.removeDataModelGroup(group.id);
      message.success('分组已删除');
    } catch (error: any) {
      console.error('删除分组失败:', error);
      message.error(error.message || '删除失败');
    }
  };

  const ungroupedCount = getGroupModelCount(null);

  return (
    <div className='data-model-group-panel'>
      {/* Header */}
      <div className='data-model-group-panel__header'>
        <Title level={5} className='data-model-group-panel__title'>
          <FolderOutlined /> 数据模型分组
        </Title>
        <Button type='primary' size='small' icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          新建分组
        </Button>
      </div>

      {/* List */}
      <div className='data-model-group-panel__content'>
        <Spin spinning={loadingDataView}>
          {/* 全部 */}
          <div
            className={`data-model-group-panel__item${!selectedGroupId ? ' data-model-group-panel__item--active' : ''}`}
            onClick={() => handleGroupClick(null)}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGroupClick(null);
            }}>
            <Space>
              <FolderOutlined />
              <Text strong>全部</Text>
            </Space>
            <Text type='secondary'>{dataModels.length}</Text>
          </div>

          {/* 未分组 */}
          <div
            className={`data-model-group-panel__item${
              selectedGroupId === '__ungrouped__' ? ' data-model-group-panel__item--active' : ''
            }`}
            onClick={() => handleGroupClick('__ungrouped__')}
            role='button'
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleGroupClick('__ungrouped__');
            }}>
            <Space>
              <FolderOutlined />
              <Text>未分组</Text>
            </Space>
            <Text type='secondary'>{ungroupedCount}</Text>
          </div>

          {/* 分组列表 */}
          {(dataModelGroups as DataModelGroup[]).length === 0 ? (
            <Empty
              description='暂无分组'
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              className='data-model-group-panel__empty'
            />
          ) : (
            <List
              dataSource={dataModelGroups as DataModelGroup[]}
              renderItem={(group) => {
                const isSelected = selectedGroupId === group.id;
                const count = getGroupModelCount(group.id);
                return (
                  <div
                    key={group.id}
                    className={`data-model-group-panel__item${
                      isSelected ? ' data-model-group-panel__item--active' : ''
                    }`}
                    onClick={() => handleGroupClick(group.id)}
                    role='button'
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGroupClick(group.id);
                    }}>
                    <div className='data-model-group-panel__item-content'>
                      <Space>
                        <FolderOutlined />
                        <Text strong={isSelected}>{group.name}</Text>
                      </Space>
                      {group.description && (
                        <Text type='secondary' className='data-model-group-panel__item-desc' ellipsis>
                          {group.description}
                        </Text>
                      )}
                    </div>
                    <Space className='data-model-group-panel__item-actions'>
                      <Text type='secondary'>{count}</Text>
                      <Button type='text' size='small' icon={<EditOutlined />} onClick={(e) => handleEdit(group, e)} />
                      <Popconfirm
                        title='确定删除此分组？'
                        onConfirm={(e) => handleDelete(group, e as any)}
                        onCancel={(e) => e?.stopPropagation()}
                        okText='删除'
                        cancelText='取消'>
                        <Button
                          type='text'
                          size='small'
                          danger
                          icon={<DeleteOutlined />}
                          onClick={(e) => e.stopPropagation()}
                        />
                      </Popconfirm>
                    </Space>
                  </div>
                );
              }}
            />
          )}
        </Spin>
      </div>

      {/* 创建分组弹窗 */}
      <Modal
        title='新建分组'
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        maskClosable={false}
        footer={null}
        destroyOnHidden
        width={400}>
        <Form form={form} layout='vertical' onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item label='分组名称' name='name' rules={[{ required: true, message: '请输入分组名称' }]}>
            <Input placeholder='如：用户相关、订单相关' />
          </Form.Item>
          <Form.Item label='描述' name='description'>
            <Input.TextArea rows={2} placeholder='简要描述该分组（可选）' />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setCreateModalOpen(false);
                  form.resetFields();
                }}>
                取消
              </Button>
              <Button type='primary' htmlType='submit' loading={creating}>
                创建
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 编辑分组弹窗 */}
      <Modal
        title='编辑分组'
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingGroup(null);
          form.resetFields();
        }}
        maskClosable={false}
        footer={null}
        destroyOnHidden
        width={400}>
        <Form form={form} layout='vertical' onFinish={handleUpdate} style={{ marginTop: 16 }}>
          <Form.Item label='分组名称' name='name' rules={[{ required: true, message: '请输入分组名称' }]}>
            <Input placeholder='如：用户相关、订单相关' />
          </Form.Item>
          <Form.Item label='描述' name='description'>
            <Input.TextArea rows={2} placeholder='简要描述该分组（可选）' />
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button
                onClick={() => {
                  setEditModalOpen(false);
                  setEditingGroup(null);
                  form.resetFields();
                }}>
                取消
              </Button>
              <Button type='primary' htmlType='submit' loading={updating}>
                保存
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default DataModelGroupPanel;
