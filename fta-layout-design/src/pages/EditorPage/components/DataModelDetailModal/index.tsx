import { dataModelService } from '@/services/dataModelService';
import type { DataModel, DataModelGroup, SchemaField, UpdateDataModelRequest } from '@/types/dataModel';
import { EMPTY_SCHEMA_FIELD } from '@/types/dataModel';
import { PlusOutlined, RobotOutlined, SaveOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Select, Space, Tabs, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import AiParseModal from '../AiParseModal';
import SchemaFieldEditor from '../SchemaFieldEditor';
import './index.css';

const { Title, Text } = Typography;

interface DataModelDetailModalProps {
  open: boolean;
  modelId: string | null;
  onClose: () => void;
}

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
              showRequiredColumn
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
