import { dataModelService } from '@/services/dataModelService';
import type { DataModel, DataModelGroup, SchemaField, UpdateDataModelRequest } from '@/types/dataModel';
import { EMPTY_SCHEMA_FIELD, SCHEMA_FIELD_TYPE_OPTIONS } from '@/types/dataModel';
import { DeleteOutlined, PlusOutlined, RobotOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Popconfirm, Radio, Select, Space, Table, Tabs, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import { validateSchema } from '../../utils/schema';
import './index.css';

const { Title, Text } = Typography;

/**
 * AI 解析输入弹窗组件
 */
const AiParseModal: React.FC<{
  open: boolean;
  onClose: () => void;
  onParse: (schema: SchemaField[]) => void;
}> = ({ open, onClose, onParse }) => {
  const { message } = App.useApp();
  const [aiText, setAiText] = useState('');
  const [aiHint, setAiHint] = useState<'json' | 'typescript' | 'text'>('json');
  const [parsing, setParsing] = useState(false);

  const handleClose = () => {
    setAiText('');
    onClose();
  };

  const handleParse = async () => {
    if (!aiText.trim()) {
      message.warning('请输入需要解析的文本');
      return;
    }

    setParsing(true);
    try {
      const parsedSchema = await dataModelService.parseSchema({
        text: aiText.trim(),
        hint: aiHint,
      });

      // 校验解析结果
      if (!parsedSchema || !Array.isArray(parsedSchema)) {
        message.error('解析结果格式不正确');
        return;
      }

      if (!validateSchema(parsedSchema)) {
        message.error('解析结果数据结构校验失败，请检查输入格式');
        return;
      }

      if (parsedSchema.length === 0) {
        message.warning('未能解析出字段，请检查输入格式');
        return;
      }

      onParse(parsedSchema);
      message.success(`成功解析出 ${parsedSchema.length} 个字段`);
      handleClose();
    } catch (error: any) {
      console.error('AI 解析失败:', error);
      message.error(error.message || 'AI 解析失败');
    } finally {
      setParsing(false);
    }
  };

  return (
    <Modal
      title={
        <Space>
          <RobotOutlined />
          AI 智能解析
        </Space>
      }
      open={open}
      onCancel={handleClose}
      width={600}
      footer={
        <Space>
          <Button onClick={handleClose}>取消</Button>
          <Button type='primary' icon={<RobotOutlined />} onClick={handleParse} loading={parsing}>
            {parsing ? '解析中...' : '开始解析'}
          </Button>
        </Space>
      }
      destroyOnHidden>
      <div className='data-model-detail-modal__ai-section'>
        <Text type='secondary' style={{ marginBottom: 8, display: 'block' }}>
          粘贴 JSON、TypeScript 类型定义或文字描述，AI 将自动解析生成数据结构
        </Text>
        <div className='data-model-detail-modal__ai-hint'>
          <Text style={{ marginRight: 8 }}>内容类型：</Text>
          <Radio.Group value={aiHint} onChange={(e) => setAiHint(e.target.value)}>
            <Radio.Button value='json'>JSON</Radio.Button>
            <Radio.Button value='typescript'>TypeScript</Radio.Button>
            <Radio.Button value='text'>文字描述</Radio.Button>
          </Radio.Group>
        </div>
        <Input.TextArea
          rows={10}
          value={aiText}
          onChange={(e) => setAiText(e.target.value)}
          placeholder={
            aiHint === 'json'
              ? '{\n  "name": "张三",\n  "age": 18,\n  "address": {\n    "city": "北京",\n    "street": "朝阳路"\n  }\n}'
              : aiHint === 'typescript'
              ? 'interface User {\n  name: string;\n  age: number;\n  address: {\n    city: string;\n    street: string;\n  };\n}'
              : '用户信息包含：姓名（字符串，必填）、年龄（数字）、地址对象（包含城市和街道）'
          }
          className='data-model-detail-modal__ai-input'
        />
      </div>
    </Modal>
  );
};

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
  onAiParse?: () => void;
  showAiParseButton?: boolean;
}> = ({ fields, onChange, level = 0, onAiParse, showAiParseButton = false }) => {
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
      <div className='data-model-detail-modal__schema-actions'>
        <Button type='dashed' size='small' icon={<PlusOutlined />} onClick={handleAddField}>
          添加字段
        </Button>
        {showAiParseButton && (
          <div onClick={onAiParse} className='data-model-detail-modal__ai-parse-btn'>
            <RobotOutlined />
            AI 解析
          </div>
        )}
      </div>
    </div>
  );
};

const DataModelDetailModal: React.FC<DataModelDetailModalProps> = ({ open, modelId, onClose }) => {
  const { message, modal } = App.useApp();
  const { dataModels, dataModelGroups } = useSnapshot(editorPageStore);

  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<string | undefined>();
  const [schema, setSchema] = useState<SchemaField[]>([]);

  // AI 解析弹窗状态
  const [aiParseModalOpen, setAiParseModalOpen] = useState(false);

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

  // 处理 AI 解析按钮点击（编辑态需要二次确认）
  const handleAiParseClick = () => {
    if (schema.length > 0) {
      // 已有数据时二次确认
      modal.confirm({
        title: '确认覆盖',
        content: '当前已有字段数据，使用 AI 解析将覆盖现有数据结构。确定要继续吗？',
        okText: '继续',
        cancelText: '取消',
        onOk: () => {
          setAiParseModalOpen(true);
        },
      });
    } else {
      setAiParseModalOpen(true);
    }
  };

  // 处理 AI 解析结果
  const handleAiParseResult = (parsedSchema: SchemaField[]) => {
    setSchema(parsedSchema);
    markChanged();
  };

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
      label: `数据结构${schema.length > 0 ? ` (${schema.length})` : ''}`,
      children: (
        <div className='data-model-detail-modal__tab-content'>
          {schema.length === 0 ? (
            <div className='data-model-detail-modal__schema-empty'>
              <RobotOutlined style={{ fontSize: 32, color: '#8c8c8c', marginBottom: 12 }} />
              <Text type='secondary' style={{ marginBottom: 16 }}>
                暂无字段，可以手动添加或使用 AI 快速创建
              </Text>
              <Space>
                <Button
                  type='dashed'
                  icon={<PlusOutlined />}
                  onClick={() => {
                    setSchema([{ ...EMPTY_SCHEMA_FIELD }]);
                    markChanged();
                  }}>
                  手动添加
                </Button>
                <Button type='primary' icon={<RobotOutlined />} onClick={handleAiParseClick}>
                  AI 快速创建
                </Button>
              </Space>
            </div>
          ) : (
            <SchemaFieldEditor
              fields={schema}
              onChange={(fields) => {
                setSchema(fields);
                markChanged();
              }}
              showAiParseButton
              onAiParse={handleAiParseClick}
            />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
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
        destroyOnHidden>
        <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      </Modal>
      <AiParseModal open={aiParseModalOpen} onClose={() => setAiParseModalOpen(false)} onParse={handleAiParseResult} />
    </>
  );
};

export default DataModelDetailModal;
