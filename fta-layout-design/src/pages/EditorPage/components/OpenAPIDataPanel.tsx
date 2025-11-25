import { interfaceDataModelService } from '@/services/interfaceDataModelService';
import type {
  HttpMethod,
  InterfaceDataModel,
  SchemaField,
  SchemaFieldType,
  UpdateDataModelRequest,
} from '@/types/interfaceDataModel';
import { EMPTY_SCHEMA_FIELD, HTTP_METHOD_OPTIONS, SCHEMA_FIELD_TYPE_OPTIONS } from '@/types/interfaceDataModel';
import {
  CodeOutlined,
  DeleteOutlined,
  EditOutlined,
  FileTextOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { App, Button, Empty, Form, Input, Popconfirm, Select, Space, Spin, Table, Tabs, Tag, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../contexts/EditorPageContext';

const { Title, Text } = Typography;

interface OpenAPIDataPanelProps {
  selectedApiId?: string;
  onDataModelUpdated?: (dataModel: InterfaceDataModel) => void;
}

// Schema 字段编辑器组件
const SchemaFieldEditor: React.FC<{
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  level?: number;
}> = ({ fields, onChange, level = 0 }) => {
  const handleAddField = () => {
    onChange([...fields, { ...EMPTY_SCHEMA_FIELD }]);
  };

  const handleRemoveField = (index: number) => {
    const newFields = fields.filter((_, i) => i !== index);
    onChange(newFields);
  };

  const handleFieldChange = (index: number, key: keyof SchemaField, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };

    // 当类型从 object/array 切换到其他类型时，清空 properties/items
    if (key === 'type') {
      if (value !== 'object') {
        delete newFields[index].properties;
      }
      if (value !== 'array') {
        delete newFields[index].items;
      }
    }

    onChange(newFields);
  };

  const handlePropertiesChange = (index: number, properties: SchemaField[]) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], properties };
    onChange(newFields);
  };

  const handleItemsChange = (index: number, items: SchemaField) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], items };
    onChange(newFields);
  };

  const columns = [
    {
      title: '字段名',
      dataIndex: 'name',
      key: 'name',
      width: 120,
      render: (_: any, record: SchemaField, index: number) => (
        <Input
          size='small'
          value={record.name}
          onChange={(e) => handleFieldChange(index, 'name', e.target.value)}
          placeholder='字段名'
        />
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      render: (_: any, record: SchemaField, index: number) => (
        <Select
          size='small'
          value={record.type}
          onChange={(value) => handleFieldChange(index, 'type', value)}
          style={{ width: '100%' }}>
          {SCHEMA_FIELD_TYPE_OPTIONS.map((opt) => (
            <Select.Option key={opt.value} value={opt.value}>
              {opt.label}
            </Select.Option>
          ))}
        </Select>
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description',
      render: (_: any, record: SchemaField, index: number) => (
        <Input
          size='small'
          value={record.description}
          onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
          placeholder='字段描述'
        />
      ),
    },
    {
      title: '必填',
      dataIndex: 'required',
      key: 'required',
      width: 60,
      render: (_: any, record: SchemaField, index: number) => (
        <Select
          size='small'
          value={record.required ? 'yes' : 'no'}
          onChange={(value) => handleFieldChange(index, 'required', value === 'yes')}
          style={{ width: '100%' }}>
          <Select.Option value='yes'>是</Select.Option>
          <Select.Option value='no'>否</Select.Option>
        </Select>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      render: (_: any, _record: SchemaField, index: number) => (
        <Popconfirm title='确定删除此字段？' onConfirm={() => handleRemoveField(index)} okText='删除' cancelText='取消'>
          <Button type='text' size='small' danger icon={<DeleteOutlined />} />
        </Popconfirm>
      ),
    },
  ];

  return (
    <div style={{ marginLeft: level * 16 }}>
      <Table
        columns={columns}
        dataSource={fields}
        rowKey={(_, index) => `field-${level}-${index}`}
        pagination={false}
        size='small'
        expandable={{
          expandedRowRender: (record, index) => {
            if (record.type === 'object') {
              return (
                <div style={{ padding: '8px 0' }}>
                  <Text type='secondary' style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                    子字段:
                  </Text>
                  <SchemaFieldEditor
                    fields={record.properties || []}
                    onChange={(props) => handlePropertiesChange(index, props)}
                    level={level + 1}
                  />
                </div>
              );
            }
            if (record.type === 'array' && record.items) {
              return (
                <div style={{ padding: '8px 0' }}>
                  <Text type='secondary' style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                    数组元素类型:
                  </Text>
                  <Space direction='vertical' style={{ width: '100%' }}>
                    <Select
                      size='small'
                      value={record.items.type}
                      onChange={(value) =>
                        handleItemsChange(index, { ...record.items!, type: value as SchemaFieldType })
                      }
                      style={{ width: 120 }}>
                      {SCHEMA_FIELD_TYPE_OPTIONS.map((opt) => (
                        <Select.Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Select.Option>
                      ))}
                    </Select>
                    {record.items.type === 'object' && (
                      <SchemaFieldEditor
                        fields={record.items.properties || []}
                        onChange={(props) => handleItemsChange(index, { ...record.items!, properties: props })}
                        level={level + 1}
                      />
                    )}
                  </Space>
                </div>
              );
            }
            return null;
          },
          rowExpandable: (record) => record.type === 'object' || record.type === 'array',
        }}
      />
      <Button
        type='dashed'
        size='small'
        icon={<PlusOutlined />}
        onClick={handleAddField}
        style={{ marginTop: 8, width: '100%' }}>
        添加字段
      </Button>
    </div>
  );
};

const OpenAPIDataPanel: React.FC<OpenAPIDataPanelProps> = ({ selectedApiId, onDataModelUpdated }) => {
  const { message } = App.useApp();
  const { interfaceDataModels } = useSnapshot(editorPageStore);
  const [activeTab, setActiveTab] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [url, setUrl] = useState('');
  const [method, setMethod] = useState<HttpMethod | undefined>();
  const [requestSchema, setRequestSchema] = useState<SchemaField[]>([]);
  const [responseSchema, setResponseSchema] = useState<SchemaField[]>([]);

  // 从 context 中获取数据模型
  const dataModel = selectedApiId ? interfaceDataModels.find((m) => m.id === selectedApiId) || null : null;

  // 当选中的数据模型变化时，更新表单
  useEffect(() => {
    if (dataModel) {
      setName(dataModel.name);
      setDescription(dataModel.description || '');
      setUrl(dataModel.url || '');
      setMethod(dataModel.method);

      setRequestSchema((dataModel.requestSchema as SchemaField[]) || []);
      setResponseSchema((dataModel.responseSchema as SchemaField[]) || []);
      setHasChanges(false);
    } else {
      setName('');
      setDescription('');
      setUrl('');
      setMethod(undefined);
      setRequestSchema([]);
      setResponseSchema([]);
      setHasChanges(false);
    }
  }, [dataModel?.id]);

  // 标记有变更
  const markChanged = () => {
    setHasChanges(true);
  };

  // 保存数据模型
  const handleSave = async () => {
    if (!dataModel) return;

    setSaving(true);
    try {
      const updateData: UpdateDataModelRequest = {
        name,
        description: description || undefined,
        url: url || undefined,
        method,
        requestSchema,
        responseSchema,
      };

      const updatedModel = await interfaceDataModelService.update(dataModel.id, updateData);
      // 更新 context 中的数据模型
      editorPageActions.updateInterfaceDataModel(dataModel.id, updatedModel);
      setHasChanges(false);
      message.success('保存成功');
      onDataModelUpdated?.(updatedModel);
    } catch (error) {
      console.error('保存数据模型失败:', error);
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 如果没有选中的数据模型，显示空状态
  if (!selectedApiId) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgb(255, 255, 255)',
        }}>
        <Empty description='请从左侧选择一个数据模型' />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'basic',
      label: (
        <span>
          <EditOutlined /> 基本信息
        </span>
      ),
      children: (
        <div style={{ padding: '16px' }}>
          <Form layout='vertical'>
            <Form.Item label='数据模型名称' required>
              <Input
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  markChanged();
                }}
                placeholder='数据模型名称'
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
                placeholder='简要描述该数据模型的用途'
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
      label: (
        <span>
          <CodeOutlined /> 请求参数
        </span>
      ),
      children: (
        <div style={{ padding: '16px' }}>
          <Text type='secondary' style={{ marginBottom: 12, display: 'block' }}>
            定义请求时需要传递的参数结构
          </Text>
          <SchemaFieldEditor
            fields={requestSchema}
            onChange={(fields) => {
              setRequestSchema(fields);
              markChanged();
            }}
          />
        </div>
      ),
    },
    {
      key: 'response',
      label: (
        <span>
          <FileTextOutlined /> 响应数据
        </span>
      ),
      children: (
        <div style={{ padding: '16px' }}>
          <Text type='secondary' style={{ marginBottom: 12, display: 'block' }}>
            定义接口返回的数据结构
          </Text>
          <SchemaFieldEditor
            fields={responseSchema}
            onChange={(fields) => {
              setResponseSchema(fields);
              markChanged();
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <Spin spinning={false}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgb(255, 255, 255)' }}>
        {/* Header */}
        <div
          style={{
            padding: '16px 24px',
            borderBottom: '1px solid rgb(240, 240, 240)',
            background: 'rgb(255, 255, 255)',
          }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <Title level={5} style={{ margin: 0 }}>
                {dataModel?.name || '数据模型详情'}
              </Title>
              <Text type='secondary' style={{ fontSize: 12 }}>
                ID: {selectedApiId}
              </Text>
            </div>
            <Button
              type='primary'
              size='small'
              icon={<SaveOutlined />}
              loading={saving}
              disabled={!hasChanges}
              onClick={handleSave}>
              保存
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ flex: 1, overflow: 'auto' }}>
          <Tabs
            activeKey={activeTab}
            onChange={setActiveTab}
            items={tabItems}
            style={{ height: '100%' }}
            tabBarStyle={{ margin: 0, padding: '0 16px' }}
          />
        </div>
      </div>
    </Spin>
  );
};

export default OpenAPIDataPanel;
