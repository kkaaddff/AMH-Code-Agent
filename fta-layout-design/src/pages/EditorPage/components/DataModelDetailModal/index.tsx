import { dataModelService, dataModelGroupService } from '@/services/dataModelService';
import type { DataModel, DataModelGroup, SchemaField, UpdateDataModelRequest } from '@/types/dataModel';
import { EMPTY_SCHEMA_FIELD, SCHEMA_FIELD_TYPE_OPTIONS } from '@/types/dataModel';
import { DeleteOutlined, PlusOutlined, SaveOutlined } from '@ant-design/icons';
import {
  App,
  Button,
  Form,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tabs,
  Typography,
} from 'antd';
import React, { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import './index.css';

const { Title, Text } = Typography;

interface DataModelDetailModalProps {
  open: boolean;
  modelId: string | null;
  onClose: () => void;
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
    onChange(fields.filter((_, i) => i !== index));
  };

  const handleFieldChange = (index: number, key: keyof SchemaField, value: any) => {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], [key]: value };

    if (key === 'type') {
      if (value !== 'object') delete newFields[index].properties;
      if (value !== 'array') delete newFields[index].items;
      else if (value === 'array' && !newFields[index].items) {
        newFields[index].items = { ...EMPTY_SCHEMA_FIELD };
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
            if (record.type === 'array') {
              return (
                <div style={{ padding: '8px 0' }}>
                  <Text type='secondary' style={{ fontSize: 12, marginBottom: 8, display: 'block' }}>
                    数组元素类型:
                  </Text>
                  <Space direction='vertical' style={{ width: '100%' }}>
                    <Select
                      size='small'
                      value={record.items?.type}
                      onChange={(value) =>
                        handleItemsChange(index, { ...record.items!, type: value as SchemaField['type'] })
                      }
                      style={{ width: 120 }}>
                      {SCHEMA_FIELD_TYPE_OPTIONS.map((opt) => (
                        <Select.Option key={opt.value} value={opt.value}>
                          {opt.label}
                        </Select.Option>
                      ))}
                    </Select>
                    {record.items?.type === 'object' && (
                      <SchemaFieldEditor
                        fields={record.items?.properties || []}
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
      <Button type='dashed' size='small' icon={<PlusOutlined />} onClick={handleAddField} style={{ marginTop: 8, width: '100%' }}>
        添加字段
      </Button>
    </div>
  );
};

const DataModelDetailModal: React.FC<DataModelDetailModalProps> = ({ open, modelId, onClose }) => {
  const { message } = App.useApp();
  const { dataModels, dataModelGroups } = useSnapshot(editorPageStore);

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<string | undefined>();
  const [schema, setSchema] = useState<SchemaField[]>([]);

  // 获取当前数据模型
  const dataModel = modelId ? (dataModels as DataModel[]).find((m) => m.id === modelId) : null;

  // 初始化表单
  useEffect(() => {
    if (dataModel) {
      setName(dataModel.name);
      setDescription(dataModel.description || '');
      setGroupId(dataModel.groupId);
      setSchema(dataModel.schema || []);
      setHasChanges(false);
      setActiveTab('basic');
    }
  }, [dataModel?.id]);

  const markChanged = () => setHasChanges(true);

  const handleSave = async () => {
    if (!dataModel) return;

    setSaving(true);
    try {
      const updateData: UpdateDataModelRequest = {
        name,
        description: description || undefined,
        groupId: groupId || null,
        schema,
      };

      const updated = await dataModelService.update(dataModel.id, updateData);
      editorPageActions.updateDataModel(dataModel.id, updated);
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
        <div className='data-model-detail-modal__tab-content'>
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
            <Form.Item label='所属分组'>
              <Select
                value={groupId}
                onChange={(value) => {
                  setGroupId(value);
                  markChanged();
                }}
                placeholder='选择分组（可选）'
                allowClear
                style={{ width: '100%' }}>
                {(dataModelGroups as DataModelGroup[]).map((g) => (
                  <Select.Option key={g.id} value={g.id}>
                    {g.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Form>
        </div>
      ),
    },
    {
      key: 'schema',
      label: '数据结构',
      children: (
        <div className='data-model-detail-modal__tab-content'>
          <Text type='secondary' style={{ marginBottom: 12, display: 'block' }}>
            定义数据模型的字段结构
          </Text>
          <SchemaFieldEditor
            fields={schema}
            onChange={(fields) => {
              setSchema(fields);
              markChanged();
            }}
          />
        </div>
      ),
    },
  ];

  return (
    <Modal
      title={
        <div className='data-model-detail-modal__header'>
          <Title level={5} style={{ margin: 0 }}>
            {dataModel?.name || '数据模型详情'}
          </Title>
          <Text type='secondary' style={{ fontSize: 12 }}>
            ID: {modelId}
          </Text>
        </div>
      }
      open={open}
      onCancel={onClose}
      maskClosable={false}
      width={800}
      footer={
        <Space>
          <Button onClick={onClose}>关闭</Button>
          <Button type='primary' icon={<SaveOutlined />} loading={saving} disabled={!hasChanges} onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
      destroyOnClose>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </Modal>
  );
};

export default DataModelDetailModal;

