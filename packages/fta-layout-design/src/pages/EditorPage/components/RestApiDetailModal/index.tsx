import { restApiService } from '@/services/restApiService';
import type { DataModel } from '@/types/dataModel';
import type { RestApi, UpdateRestApiRequest } from '@/types/restApi';
import { HTTP_METHOD_OPTIONS, METHOD_COLORS } from '@/types/restApi';
import { SaveOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Select, Space, Tabs, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import './index.css';

const { Title, Text } = Typography;

interface RestApiDetailModalProps {
  open: boolean;
  apiId: string | null;
  onClose: () => void;
}

const RestApiDetailModal: React.FC<RestApiDetailModalProps> = ({ open, apiId, onClose }) => {
  const { message } = App.useApp();
  const { restApis, dataModels, dataModelGroups } = useSnapshot(editorPageStore);

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<RestApi['method']>();
  const [requestModelIds, setRequestModelIds] = useState<string[]>([]);
  const [responseModelIds, setResponseModelIds] = useState<string[]>([]);

  // 获取当前接口
  const restApi = apiId ? (restApis as RestApi[]).find((a) => a.id === apiId) : null;

  // 构建数据模型选项（带分组）
  const dataModelOptions = React.useMemo(() => {
    const ungrouped = (dataModels as DataModel[]).filter((m) => !m.groupId);
    const grouped = (dataModelGroups as any[]).map((g) => ({
      label: g.name,
      options: (dataModels as DataModel[])
        .filter((m) => m.groupId === g.id)
        .map((m) => ({
          label: m.name,
          value: m.id,
          desc: m.description,
        })),
    }));

    const result: any[] = [];

    if (ungrouped.length > 0) {
      result.push({
        label: '未分组',
        options: ungrouped.map((m) => ({
          label: m.name,
          value: m.id,
          desc: m.description,
        })),
      });
    }

    result.push(...grouped.filter((g) => g.options.length > 0));

    return result;
  }, [dataModels, dataModelGroups]);

  // 初始化表单
  useEffect(() => {
    if (restApi) {
      setName(restApi.name);
      setDescription(restApi.description || '');
      setUrl(restApi.url || '');
      setMethod(restApi.method);
      setRequestModelIds(restApi.requestModelIds || []);
      setResponseModelIds(restApi.responseModelIds || []);
      setHasChanges(false);
      setActiveTab('basic');
    }
  }, [restApi?.id]);

  const markChanged = () => setHasChanges(true);

  const handleSave = async () => {
    if (!restApi) return;

    setSaving(true);
    try {
      const updateData: UpdateRestApiRequest = {
        name,
        description: description || undefined,
        url: url || undefined,
        method,
        requestModelIds,
        responseModelIds,
      };

      const updated = await restApiService.update(restApi.id, updateData);
      editorPageActions.updateRestApi(restApi.id, updated);
      setHasChanges(false);
      message.success('保存成功');
    } catch (error: any) {
      console.error('保存失败:', error);
      message.error(error.message || '保存失败');
    } finally {
      setSaving(false);
    }
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <div className='rest-api-detail-modal__tab-content'>
          <Form layout='vertical'>
            <Form.Item label='接口名称' required>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  markChanged();
                }}
                placeholder='接口名称'
              />
            </Form.Item>
            <Form.Item label='描述'>
              <Input.TextArea
                rows={3}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  markChanged();
                }}
                placeholder='简要描述该接口的用途'
              />
            </Form.Item>
            <Form.Item label='HTTP 方法'>
              <Select
                value={method}
                onChange={(value) => {
                  setMethod(value);
                  markChanged();
                }}
                placeholder='选择请求方法'
                allowClear
                style={{ width: 200 }}>
                {HTTP_METHOD_OPTIONS.map((opt) => (
                  <Select.Option key={opt.value} value={opt.value}>
                    <Tag color={opt.color}>{opt.label}</Tag>
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            <Form.Item label='API 地址'>
              <Input
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  markChanged();
                }}
                placeholder='如：/api/v1/users'
              />
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'request',
      label: '请求参数',
      children: (
        <div className='rest-api-detail-modal__tab-content'>
          <Text type='secondary' style={{ marginBottom: 12, display: 'block' }}>
            选择请求时需要传递的数据模型
          </Text>
          <Select
            mode='multiple'
            value={requestModelIds}
            onChange={(value) => {
              setRequestModelIds(value);
              markChanged();
            }}
            placeholder='选择关联的数据模型'
            style={{ width: '100%' }}
            options={dataModelOptions}
            optionRender={(option) => (
              <Space direction='vertical' size={0}>
                <Text>{option.label}</Text>
                {option.data.desc && (
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {option.data.desc}
                  </Text>
                )}
              </Space>
            )}
          />
          {requestModelIds.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text strong>已关联的数据模型：</Text>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {requestModelIds.map((id) => {
                  const model = (dataModels as DataModel[]).find((m) => m.id === id);
                  return model ? (
                    <Tag key={id} color='blue'>
                      {model.name}
                    </Tag>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'response',
      label: '响应数据',
      children: (
        <div className='rest-api-detail-modal__tab-content'>
          <Text type='secondary' style={{ marginBottom: 12, display: 'block' }}>
            选择接口返回的数据模型
          </Text>
          <Select
            mode='multiple'
            value={responseModelIds}
            onChange={(value) => {
              setResponseModelIds(value);
              markChanged();
            }}
            placeholder='选择关联的数据模型'
            style={{ width: '100%' }}
            options={dataModelOptions}
            optionRender={(option) => (
              <Space direction='vertical' size={0}>
                <Text>{option.label}</Text>
                {option.data.desc && (
                  <Text type='secondary' style={{ fontSize: 12 }}>
                    {option.data.desc}
                  </Text>
                )}
              </Space>
            )}
          />
          {responseModelIds.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <Text strong>已关联的数据模型：</Text>
              <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {responseModelIds.map((id) => {
                  const model = (dataModels as DataModel[]).find((m) => m.id === id);
                  return model ? (
                    <Tag key={id} color='green'>
                      {model.name}
                    </Tag>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className='rest-api-detail-modal__header'>
          <Space>
            {restApi?.method && <Tag color={METHOD_COLORS[restApi.method]}>{restApi.method}</Tag>}
            <Title level={5} style={{ margin: 0 }}>
              {restApi?.name || '接口详情'}
            </Title>
          </Space>
          <Text type='secondary' style={{ fontSize: 12 }}>
            ID: {apiId}
          </Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      maskClosable={false}
      width={700}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button type='primary' icon={<SaveOutlined />} loading={saving} disabled={!hasChanges} onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
      destroyOnHidden>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Modal>
  );
};

export default RestApiDetailModal;
