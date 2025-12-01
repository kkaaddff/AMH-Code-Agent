import { dataModelService } from '@/services/dataModelService';
import type { CreateDataModelRequest, DataModelGroup, SchemaField } from '@/types/dataModel';
import { EMPTY_SCHEMA_FIELD } from '@/types/dataModel';
import { PlusOutlined, RobotOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Select, Space, Tabs, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import AiParseModal from '../AiParseModal';
import SchemaFieldEditor from '../SchemaFieldEditor';
import './index.css';

const { Text } = Typography;

interface DataModelCreateModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DataModelCreateModal: React.FC<DataModelCreateModalProps> = ({ open, onClose, onSuccess }) => {
  const { message, modal } = App.useApp();
  const { projectId, dataModelGroups, selectedGroupId } = useSnapshot(editorPageStore);

  const [creating, setCreating] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<string | undefined>();
  const [schema, setSchema] = useState<SchemaField[]>([]);

  // AI 解析弹窗状态
  const [aiParseModalOpen, setAiParseModalOpen] = useState(false);

  // 当弹窗打开时，设置默认分组为当前选中的分组
  useEffect(() => {
    if (open) {
      // 如果选中的是 "__ungrouped__" 或 null，则不设置分组
      if (selectedGroupId && selectedGroupId !== '__ungrouped__') {
        setGroupId(selectedGroupId);
      } else {
        setGroupId(undefined);
      }
    }
  }, [open, selectedGroupId]);

  const resetForm = () => {
    setName('');
    setDescription('');
    setGroupId(undefined);
    setSchema([]);
    setActiveTab('basic');
    setAiParseModalOpen(false);
  };

  // 处理 AI 解析按钮点击
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
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreate = async () => {
    if (!name.trim()) {
      message.error('请输入数据模型名称');
      return;
    }

    if (!projectId) {
      message.error('项目 ID 不存在');
      return;
    }

    setCreating(true);
    try {
      const createData: CreateDataModelRequest = {
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        groupId: groupId || undefined,
        schema,
      };

      const newModel = await dataModelService.create(createData);
      editorPageActions.addDataModel(newModel);
      message.success('数据模型创建成功');
      handleClose();
      onSuccess?.();
    } catch (error: any) {
      console.error('创建失败:', error);
      message.error(error.message || '创建失败');
    } finally {
      setCreating(false);
    }
  };

  const tabItems = [
    {
      key: 'basic',
      label: '基本信息',
      children: (
        <div className='data-model-create-modal__tab-content'>
          <Form layout='vertical'>
            <Form.Item label='数据模型名称' required>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder='如：用户信息、订单数据' />
            </Form.Item>
            <Form.Item label='描述'>
              <Input.TextArea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder='简要描述该数据模型的用途（可选）'
              />
            </Form.Item>
            <Form.Item label='所属分组'>
              <Select
                value={groupId}
                onChange={setGroupId}
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
        <div className='data-model-create-modal__tab-content'>
          {schema.length === 0 ? (
            <div className='data-model-create-modal__schema-empty'>
              <RobotOutlined style={{ fontSize: 32, color: '#8c8c8c', marginBottom: 12 }} />
              <Text type='secondary' style={{ marginBottom: 16 }}>
                暂无字段，可以手动添加或使用 AI 快速创建
              </Text>
              <Space>
                <Button type='dashed' icon={<PlusOutlined />} onClick={() => setSchema([{ ...EMPTY_SCHEMA_FIELD }])}>
                  手动添加
                </Button>
                <Button type='primary' icon={<RobotOutlined />} onClick={handleAiParseClick}>
                  AI 快速创建
                </Button>
              </Space>
            </div>
          ) : (
            <SchemaFieldEditor fields={schema} onChange={setSchema} showAiParseButton onAiParse={handleAiParseClick} />
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <Modal
        title='新建数据模型'
        open={open}
        onCancel={handleClose}
        maskClosable={false}
        width={800}
        footer={
          <Space>
            <Button onClick={handleClose}>取消</Button>
            <Button type='primary' onClick={handleCreate} loading={creating} disabled={!name.trim()}>
              创建
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

export default DataModelCreateModal;
