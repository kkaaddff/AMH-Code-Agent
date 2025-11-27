import { restApiGroupService } from '@/services/restApiService';
import type { CreateRestApiGroupRequest, RestApiGroup } from '@/types/restApi';
import {
  ApiOutlined,
  CloudSyncOutlined,
  DeleteOutlined,
  EditOutlined,
  FolderOutlined,
  LoadingOutlined,
  PlusOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { App, Button, Empty, Form, Input, List, Modal, Popconfirm, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import './index.css';

const { Title, Text } = Typography;

interface RestApiGroupPanelProps {
  onGroupSelect?: (groupId: string | null) => void;
}

const RestApiGroupPanel: React.FC<RestApiGroupPanelProps> = ({ onGroupSelect }) => {
  const { message, modal } = App.useApp();
  const { projectId, restApiGroups, restApis, loadingDataView, selectedRestApiGroupId } = useSnapshot(editorPageStore);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RestApiGroup | null>(null);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [syncingGroupId, setSyncingGroupId] = useState<string | null>(null);

  // 计算每个组的接口数量
  const getGroupApiCount = (groupId: string | null) => {
    if (groupId === null) {
      return restApis.length;
    }
    if (groupId === '__ungrouped__') {
      return (restApis as any[]).filter((a) => !a.groupId).length;
    }
    return (restApis as any[]).filter((a) => a.groupId === groupId).length;
  };

  // 处理组选择
  const handleGroupClick = (groupId: string | null) => {
    editorPageActions.setSelectedRestApiGroupId(groupId);
    onGroupSelect?.(groupId);
  };

  // 创建组
  const handleCreate = async (values: { name: string; description?: string; syncUrl?: string }) => {
    if (!projectId) {
      message.error('项目 ID 不存在');
      return;
    }

    setCreating(true);
    try {
      const createData: CreateRestApiGroupRequest = {
        projectId,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        syncUrl: values.syncUrl?.trim() || undefined,
      };

      const newGroup = await restApiGroupService.create(createData);
      editorPageActions.addRestApiGroup(newGroup);
      message.success('接口组创建成功');
      setCreateModalOpen(false);
      form.resetFields();

      // 如果提供了 syncUrl，询问是否立即同步
      if (values.syncUrl?.trim()) {
        modal.confirm({
          title: '是否立即同步接口？',
          content: '检测到您配置了同步 URL，是否立即从远程拉取接口列表？',
          okText: '立即同步',
          cancelText: '稍后再说',
          onOk: () => handleSync(newGroup),
        });
      }
    } catch (error: any) {
      console.error('创建接口组失败:', error);
      message.error(error.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  // 打开编辑弹窗
  const handleEdit = (group: RestApiGroup, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingGroup(group);
    form.setFieldsValue({
      name: group.name,
      description: group.description,
      syncUrl: group.syncUrl,
    });
    setEditModalOpen(true);
  };

  // 更新组
  const handleUpdate = async (values: { name: string; description?: string; syncUrl?: string }) => {
    if (!editingGroup) return;

    setUpdating(true);
    try {
      const updated = await restApiGroupService.update(editingGroup.id, {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        syncUrl: values.syncUrl?.trim() || undefined,
      });
      editorPageActions.updateRestApiGroup(editingGroup.id, updated);
      message.success('接口组更新成功');
      setEditModalOpen(false);
      setEditingGroup(null);
      form.resetFields();
    } catch (error: any) {
      console.error('更新接口组失败:', error);
      message.error(error.message || '更新失败');
    } finally {
      setUpdating(false);
    }
  };

  // 删除组
  const handleDelete = async (group: RestApiGroup, e: React.MouseEvent) => {
    e.stopPropagation();

    const apiCount = getGroupApiCount(group.id);

    modal.confirm({
      title: '确认删除接口组？',
      content:
        apiCount > 0
          ? `该组下有 ${apiCount} 个接口，删除后这些接口也将被删除。确定要删除吗？`
          : '确定要删除该接口组吗？',
      okText: '删除',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await restApiGroupService.delete(group.id);
          editorPageActions.removeRestApiGroup(group.id);
          message.success('接口组已删除');
        } catch (error: any) {
          console.error('删除接口组失败:', error);
          message.error(error.message || '删除失败');
        }
      },
    });
  };

  // 同步远程接口
  const handleSync = async (group: RestApiGroup, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!group.syncUrl) {
      message.warning('该组未配置同步 URL，请先编辑配置');
      return;
    }

    setSyncingGroupId(group.id);
    try {
      const result = await restApiGroupService.sync(group.id);
      // 更新组状态
      const updatedGroup = await restApiGroupService.getById(group.id);
      if (updatedGroup) {
        editorPageActions.updateRestApiGroup(group.id, updatedGroup);
      }
      // 添加同步的接口到列表
      if (result.apis && result.apis.length > 0) {
        editorPageActions.addRestApis(result.apis);
      }
      message.success(`同步成功，共获取 ${result.syncedCount} 个接口`);
    } catch (error: any) {
      console.error('同步接口失败:', error);
      message.error(error.message || '同步失败');
      // 刷新组状态以获取错误信息
      const updatedGroup = await restApiGroupService.getById(group.id);
      if (updatedGroup) {
        editorPageActions.updateRestApiGroup(group.id, updatedGroup);
      }
    } finally {
      setSyncingGroupId(null);
    }
  };

  // 获取同步状态标签
  const getSyncStatusTag = (group: RestApiGroup) => {
    const isSyncing = syncingGroupId === group.id || group.syncStatus === 'syncing';

    if (isSyncing) {
      return (
        <Tag color='processing' icon={<LoadingOutlined />}>
          同步中
        </Tag>
      );
    }

    switch (group.syncStatus) {
      case 'success':
        return (
          <Tooltip title={`上次同步: ${group.lastSyncAt ? new Date(group.lastSyncAt).toLocaleString() : '未知'}`}>
            <Tag color='success'>已同步</Tag>
          </Tooltip>
        );
      case 'failed':
        return (
          <Tooltip title={group.syncError || '同步失败'}>
            <Tag color='error'>同步失败</Tag>
          </Tooltip>
        );
      default:
        return group.syncUrl ? <Tag>待同步</Tag> : null;
    }
  };

  const ungroupedCount = getGroupApiCount('__ungrouped__');

  return (
    <div className='rest-api-group-panel'>
      {/* Header */}
      <div className='rest-api-group-panel__header'>
        <Title level={5} className='rest-api-group-panel__title'>
          <ApiOutlined /> 接口组管理
        </Title>
        <Button type='primary' size='small' icon={<PlusOutlined />} onClick={() => setCreateModalOpen(true)}>
          新建组
        </Button>
      </div>

      {/* List */}
      <div className='rest-api-group-panel__content'>
        <Spin spinning={loadingDataView}>
          {/* 全部 */}
          <div
            className={`rest-api-group-panel__item${!selectedRestApiGroupId ? ' rest-api-group-panel__item--active' : ''}`}
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
            <Text type='secondary'>{restApis.length}</Text>
          </div>

          {/* 未分组 */}
          <div
            className={`rest-api-group-panel__item${
              selectedRestApiGroupId === '__ungrouped__' ? ' rest-api-group-panel__item--active' : ''
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
          {(restApiGroups as RestApiGroup[]).length === 0 ? (
            <Empty description='暂无接口组' image={Empty.PRESENTED_IMAGE_SIMPLE} className='rest-api-group-panel__empty' />
          ) : (
            <List
              dataSource={restApiGroups as RestApiGroup[]}
              renderItem={(group) => {
                const isSelected = selectedRestApiGroupId === group.id;
                const count = getGroupApiCount(group.id);
                const isSyncing = syncingGroupId === group.id;
                return (
                  <div
                    key={group.id}
                    className={`rest-api-group-panel__item${isSelected ? ' rest-api-group-panel__item--active' : ''}`}
                    onClick={() => handleGroupClick(group.id)}
                    role='button'
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleGroupClick(group.id);
                    }}>
                    <div className='rest-api-group-panel__item-content'>
                      <Space>
                        <FolderOutlined />
                        <Text strong={isSelected}>{group.name}</Text>
                        {getSyncStatusTag(group)}
                      </Space>
                      {group.description && (
                        <Text type='secondary' className='rest-api-group-panel__item-desc' ellipsis>
                          {group.description}
                        </Text>
                      )}
                      {group.syncUrl && (
                        <Text type='secondary' className='rest-api-group-panel__item-url' ellipsis>
                          <CloudSyncOutlined /> {group.syncUrl}
                        </Text>
                      )}
                    </div>
                    <Space className='rest-api-group-panel__item-actions'>
                      <Text type='secondary'>{count}</Text>
                      {group.syncUrl && (
                        <Tooltip title='同步接口'>
                          <Button
                            type='text'
                            size='small'
                            icon={<SyncOutlined spin={isSyncing} />}
                            onClick={(e) => handleSync(group, e)}
                            disabled={isSyncing}
                          />
                        </Tooltip>
                      )}
                      <Button type='text' size='small' icon={<EditOutlined />} onClick={(e) => handleEdit(group, e)} />
                      <Button
                        type='text'
                        size='small'
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(group, e);
                        }}
                      />
                    </Space>
                  </div>
                );
              }}
            />
          )}
        </Spin>
      </div>

      {/* 创建组弹窗 */}
      <Modal
        title='新建接口组'
        open={createModalOpen}
        onCancel={() => {
          setCreateModalOpen(false);
          form.resetFields();
        }}
        maskClosable={false}
        footer={null}
        destroyOnClose
        width={480}>
        <Form form={form} layout='vertical' onFinish={handleCreate} style={{ marginTop: 16 }}>
          <Form.Item label='组名称' name='name' rules={[{ required: true, message: '请输入组名称' }]}>
            <Input placeholder='如：用户模块、订单模块' />
          </Form.Item>
          <Form.Item label='描述' name='description'>
            <Input.TextArea rows={2} placeholder='简要描述该组（可选）' />
          </Form.Item>
          <Form.Item
            label='同步 URL'
            name='syncUrl'
            extra='可选：填入 OpenAPI/Swagger 文档地址，支持从远程自动同步接口列表'>
            <Input placeholder='如：https://api.example.com/swagger.json' />
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

      {/* 编辑组弹窗 */}
      <Modal
        title='编辑接口组'
        open={editModalOpen}
        onCancel={() => {
          setEditModalOpen(false);
          setEditingGroup(null);
          form.resetFields();
        }}
        maskClosable={false}
        footer={null}
        destroyOnClose
        width={480}>
        <Form form={form} layout='vertical' onFinish={handleUpdate} style={{ marginTop: 16 }}>
          <Form.Item label='组名称' name='name' rules={[{ required: true, message: '请输入组名称' }]}>
            <Input placeholder='如：用户模块、订单模块' />
          </Form.Item>
          <Form.Item label='描述' name='description'>
            <Input.TextArea rows={2} placeholder='简要描述该组（可选）' />
          </Form.Item>
          <Form.Item
            label='同步 URL'
            name='syncUrl'
            extra='可选：填入 OpenAPI/Swagger 文档地址，支持从远程自动同步接口列表'>
            <Input placeholder='如：https://api.example.com/swagger.json' />
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

export default RestApiGroupPanel;
