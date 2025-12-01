import type { SchemaField } from '@/types/dataModel';
import { EMPTY_SCHEMA_FIELD, SCHEMA_FIELD_TYPE_OPTIONS } from '@/types/dataModel';
import { DeleteOutlined, PlusOutlined, RobotOutlined } from '@ant-design/icons';
import { Button, Input, Popconfirm, Select, Space, Table, Typography } from 'antd';
import React from 'react';
import './index.css';

const { Text } = Typography;

export interface SchemaFieldEditorProps {
  fields: SchemaField[];
  onChange: (fields: SchemaField[]) => void;
  /** 嵌套层级，用于控制缩进 */
  level?: number;
  /** AI 解析按钮点击回调 */
  onAiParse?: () => void;
  /** 是否显示 AI 解析按钮 */
  showAiParseButton?: boolean;
  /** AI 解析中状态 */
  aiParsing?: boolean;
  /** 是否显示必填列 */
  showRequiredColumn?: boolean;
}

/**
 * Schema 字段编辑器公共组件
 * 支持嵌套结构（object/array）的可视化编辑
 */
const SchemaFieldEditor: React.FC<SchemaFieldEditorProps> = ({
  fields,
  onChange,
  level = 0,
  onAiParse,
  showAiParseButton = false,
  aiParsing = false,
  showRequiredColumn = false,
}) => {
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
    // 可选的必填列
    ...(showRequiredColumn
      ? [
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
        ]
      : []),
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
                    showRequiredColumn={showRequiredColumn}
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
                        showRequiredColumn={showRequiredColumn}
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
      <div className='schema-field-editor__actions'>
        <Button type='dashed' size='small' icon={<PlusOutlined />} onClick={handleAddField}>
          添加字段
        </Button>
        {showAiParseButton && (
          <div onClick={onAiParse} className='schema-field-editor__ai-parse-btn' data-loading={aiParsing}>
            <RobotOutlined />
            {aiParsing ? '解析中...' : 'AI 解析'}
          </div>
        )}
      </div>
    </div>
  );
};

export default SchemaFieldEditor;
