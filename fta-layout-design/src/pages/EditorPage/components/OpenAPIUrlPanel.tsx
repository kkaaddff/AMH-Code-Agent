import { interfaceDataModelService } from '@/services/interfaceDataModelService';
import type { CreateDataModelRequest, HttpMethod } from '@/types/interfaceDataModel';
import { HTTP_METHOD_OPTIONS } from '@/types/interfaceDataModel';
import { ApiOutlined, DeleteOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { App, Button, Empty, Form, Input, List, Modal, Popconfirm, Select, Space, Spin, Tag, Typography } from 'antd';
import React, { useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../contexts/EditorPageContext';

const { Title, Text } = Typography;

// HTTP 方法对应的颜色
const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
  HEAD: 'default',
  OPTIONS: 'default',
};

interface OpenAPIUrlPanelProps {
  selectedApiId?: string;
  onSelectApi?: (apiId: string) => void;
}

const OpenAPIUrlPanel: React.FC<OpenAPIUrlPanelProps> = ({ selectedApiId, onSelectApi }) => {
  const { message } = App.useApp();
  const { pageId, interfaceDataModels, loadingDataModels } = useSnapshot(editorPageStore);

  const [searchText, setSearchText] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addForm] = Form.useForm();

  // 从 context 获取数据模型列表
  const dataModels = interfaceDataModels;
  const loading = loadingDataModels;

  // 过滤数据模型列表
  const filteredDataModels = dataModels.filter(
    (model) =>
      model.name.toLowerCase().includes(searchText.toLowerCase()) ||
      (model.description?.toLowerCase().includes(searchText.toLowerCase()) ?? false) ||
      (model.url?.toLowerCase().includes(searchText.toLowerCase()) ?? false)
  );

  // 处理添加数据模型
  const handleAddDataModel = async (values: Partial<CreateDataModelRequest>) => {
    if (!pageId) {
      message.error('页面 ID 不存在');
      return;
    }

    try {
      const newModel = await interfaceDataModelService.create({
        pageId,
        name: values.name!,
        description: values.description,
        url: values.url,
        method: values.method,
        requestSchema: [],
        responseSchema: [],
      });

      // 更新 context 中的数据模型列表
      editorPageActions.addInterfaceDataModel(newModel);
      setAddModalVisible(false);
      addForm.resetFields();
      message.success('数据模型创建成功');

      // 自动选中新创建的数据模型
      onSelectApi?.(newModel.id);
    } catch (error) {
      console.error('创建数据模型失败:', error);
      message.error('创建数据模型失败');
    }
  };

  // 处理删除数据模型
  const handleDeleteDataModel = async (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      await interfaceDataModelService.delete(id);
      // 更新 context 中的数据模型列表
      editorPageActions.removeInterfaceDataModel(id);
      message.success('数据模型已删除');

      // 如果删除的是当前选中的，清空选中
      if (selectedApiId === id) {
        onSelectApi?.('');
      }
    } catch (error) {
      console.error('删除数据模型失败:', error);
      message.error('删除数据模型失败');
    }
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgb(255, 255, 255)' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgb(240, 240, 240)',
          background: 'rgb(255, 255, 255)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <Title level={5} style={{ margin: 0 }}>
            <ApiOutlined /> 接口数据模型
          </Title>
          <Button type='primary' size='small' icon={<PlusOutlined />} onClick={() => setAddModalVisible(true)}>
            添加
          </Button>
        </div>
        <Input
          placeholder='搜索数据模型名称或描述...'
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      {/* Data Model List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Spin spinning={loading}>
          {filteredDataModels.length === 0 ? (
            <Empty
              description={dataModels.length === 0 ? '暂无数据模型，点击上方按钮添加' : '没有匹配的数据模型'}
              style={{ marginTop: 48 }}
            />
          ) : (
            <List
              dataSource={filteredDataModels}
              renderItem={(model) => {
                const isSelected = selectedApiId === model.id;
                return (
                  <List.Item
                    key={model.id}
                    style={{
                      cursor: 'pointer',
                      backgroundColor: isSelected ? 'rgb(230, 247, 255)' : 'transparent',
                      padding: '16px 24px',
                      borderBottom: '1px solid rgb(240, 240, 240)',
                      transition: 'background-color 0.2s',
                    }}
                    onClick={() => onSelectApi?.(model.id)}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'rgb(250, 250, 250)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}>
                    <List.Item.Meta
                      title={
                        <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                          <Space>
                            {model.method && (
                              <Tag color={METHOD_COLORS[model.method]} style={{ minWidth: 50, textAlign: 'center' }}>
                                {model.method}
                              </Tag>
                            )}
                            <Text strong>{model.name}</Text>
                          </Space>
                          <Popconfirm
                            title='确定删除此数据模型？'
                            onConfirm={(e) => handleDeleteDataModel(model.id, e as any)}
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
                      }
                      description={
                        <div style={{ marginTop: 4 }}>
                          {model.description && (
                            <Text type='secondary' style={{ fontSize: 12, display: 'block' }}>
                              {model.description}
                            </Text>
                          )}
                          {model.url && (
                            <Text code style={{ fontSize: 11, marginTop: 4, display: 'block' }}>
                              {model.url}
                            </Text>
                          )}
                        </div>
                      }
                    />
                  </List.Item>
                );
              }}
            />
          )}
        </Spin>
      </div>

      {/* Footer Info */}
      <div
        style={{
          padding: '12px 24px',
          borderTop: '1px solid rgb(240, 240, 240)',
          background: 'rgb(250, 250, 250)',
        }}>
        <Text type='secondary' style={{ fontSize: 12 }}>
          共 {filteredDataModels.length} 个数据模型
        </Text>
      </div>

      {/* Add Data Model Modal */}
      <Modal
        title='添加数据模型'
        open={addModalVisible}
        onCancel={() => {
          setAddModalVisible(false);
          addForm.resetFields();
        }}
        maskClosable={false}
        footer={null}
        destroyOnClose>
        <Form form={addForm} layout='vertical' onFinish={handleAddDataModel}>
          <Form.Item label='数据模型名称' name='name' rules={[{ required: true, message: '请输入数据模型名称' }]}>
            <Input placeholder='如：用户信息、订单数据' />
          </Form.Item>

          <Form.Item label='描述' name='description'>
            <Input.TextArea rows={2} placeholder='简要描述该数据模型的用途（可选）' />
          </Form.Item>

          <Form.Item label='HTTP 方法' name='method'>
            <Select placeholder='选择请求方法（可选）' allowClear>
              {HTTP_METHOD_OPTIONS.map((opt) => (
                <Select.Option key={opt.value} value={opt.value}>
                  <Tag color={opt.color}>{opt.label}</Tag>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item label='API 地址' name='url'>
            <Input placeholder='如：/api/v1/users（可选，仅作参考）' />
          </Form.Item>

          <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
            <Space>
              <Button
                onClick={() => {
                  setAddModalVisible(false);
                  addForm.resetFields();
                }}>
                取消
              </Button>
              <Button type='primary' htmlType='submit'>
                添加
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default OpenAPIUrlPanel;
