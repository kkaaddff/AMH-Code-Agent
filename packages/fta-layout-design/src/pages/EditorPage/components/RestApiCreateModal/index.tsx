import { restApiService } from '@/services/restApiService';
import type { CreateRestApiRequest, RestApiGroup } from '@/types/restApi';
import { HTTP_METHOD_OPTIONS } from '@/types/restApi';
import { App, Button, Form, Input, Modal, Select, Space, Tag } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';

interface RestApiCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const RestApiCreateModal: React.FC<RestApiCreateModalProps> = ({ open, onClose, onSuccess }) => {
  const { message } = App.useApp();
  const { projectId, restApiGroups, selectedRestApiGroupId } = useSnapshot(editorPageStore);

  const [creating, setCreating] = useState(false);
  const [form] = Form.useForm();

  // 当弹窗打开时，设置默认分组为当前选中的分组
  useEffect(() => {
    if (open) {
      // 如果选中的是 "__ungrouped__" 或 null，则不设置分组
      if (selectedRestApiGroupId && selectedRestApiGroupId !== '__ungrouped__') {
        form.setFieldsValue({ groupId: selectedRestApiGroupId });
      }
    }
  }, [open, selectedRestApiGroupId, form]);

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  const handleCreate = async (values: any) => {
    if (!projectId) {
      message.error('项目 ID 不存在');
      return;
    }

    setCreating(true);
    try {
      const createData: CreateRestApiRequest = {
        projectId,
        groupId: values.groupId || undefined,
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        url: values.url?.trim() || undefined,
        method: values.method || undefined,
        requestModelIds: [],
        responseModelIds: [],
      };

      const newApi = await restApiService.create(createData);
      editorPageActions.addRestApi(newApi);
      message.success('接口创建成功');
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('创建失败:', error);
      message.error(error.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      title='新建接口'
      open={open}
      onCancel={handleClose}
      maskClosable={false}
      footer={null}
      destroyOnHidden
      width={500}>
      <Form form={form} layout='vertical' onFinish={handleCreate} style={{ marginTop: 16 }}>
        <Form.Item label='接口名称' name='name' rules={[{ required: true, message: '请输入接口名称' }]}>
          <Input placeholder='如：获取用户信息、创建订单' />
        </Form.Item>

        <Form.Item label='描述' name='description'>
          <Input.TextArea rows={2} placeholder='简要描述该接口的用途（可选）' />
        </Form.Item>

        <Form.Item label='所属接口组' name='groupId'>
          <Select placeholder='选择接口组（可选）' allowClear style={{ width: '100%' }}>
            {(restApiGroups as RestApiGroup[]).map((g) => (
              <Select.Option key={g.id} value={g.id}>
                {g.name}
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label='HTTP 方法' name='method'>
          <Select placeholder='选择请求方法（可选）' allowClear style={{ width: 200 }}>
            {HTTP_METHOD_OPTIONS.map((opt) => (
              <Select.Option key={opt.value} value={opt.value}>
                <Tag color={opt.color}>{opt.label}</Tag>
              </Select.Option>
            ))}
          </Select>
        </Form.Item>

        <Form.Item label='API 地址' name='url'>
          <Input placeholder='如：/api/v1/users（可选）' />
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleClose}>取消</Button>
            <Button type='primary' htmlType='submit' loading={creating}>
              创建
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default RestApiCreateModal;
