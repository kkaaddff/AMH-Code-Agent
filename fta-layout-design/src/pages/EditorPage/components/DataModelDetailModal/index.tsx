import { dataModelService } from '@/services/dataModelService';
import type { DataModel, DataModelGroup, UpdateDataModelRequest } from '@/types/dataModel';
import { RobotOutlined, SaveOutlined, WarningOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Select, Space, Tabs, Tooltip, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import TypeScriptEditor from '@/components/TypeScriptEditor';
import AiParseModal from '../AiParseModal';
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
  const [hasValidationErrors, setHasValidationErrors] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');
  const [aiParseModalOpen, setAiParseModalOpen] = useState(false);

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<string | undefined>();
  const [tsContent, setTsContent] = useState('');

  // 获取当前数据模型
  const dataModel = modelId ? (dataModels as DataModel[]).find((m) => m.id === modelId) : null;

  // 初始化表单
  useEffect(() => {
    if (dataModel) {
      setName(dataModel.name);
      setDescription(dataModel.description || '');
      setGroupId(dataModel.groupId);
      setTsContent(dataModel.tsContent || '');
      setHasChanges(false);
      setHasValidationErrors(false);
      setActiveTab('basic');
    }
  }, [dataModel?.id]);

  const markChanged = () => setHasChanges(true);

  const handleAiParseSuccess = (typescriptCode: string) => {
    // 将生成的 TypeScript 代码填充到编辑器
    setTsContent(typescriptCode);
    markChanged();
    // 切换到 TypeScript 标签页以便用户查看
    setActiveTab('typescript');
  };

  const handleSave = async () => {
    if (!dataModel) return;

    if (hasValidationErrors) {
      message.error('TypeScript 代码存在语法错误，请修复后再保存');
      setActiveTab('typescript');
      return;
    }

    setSaving(true);
    try {
      const updateData: UpdateDataModelRequest = {
        name,
        description: description || undefined,
        groupId: groupId || null,
        tsContent,
      };

      const updated = await dataModelService.update(dataModel.id, updateData);
      editorPageActions.updateDataModel(dataModel.id, updated);
      setHasChanges(false);
      message.success('保存成功');
      onClose();
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
      key: 'typescript',
      label: 'TypeScript 接口',
      children: (
        <div className='data-model-detail-modal__tab-content'>
          <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Text type='secondary'>请在下方编辑器中定义 TypeScript 接口：</Text>
            <Button
              type='default'
              icon={<RobotOutlined />}
              size='small'
              onClick={() => setAiParseModalOpen(true)}
              style={{ marginLeft: 8 }}>
              AI 智能解析
            </Button>
          </div>
          <TypeScriptEditor
            value={tsContent}
            onChange={(value) => {
              setTsContent(value);
              markChanged();
            }}
            onValidate={(hasErrors) => setHasValidationErrors(hasErrors)}
            height={350}
          />
          {hasValidationErrors && (
            <div style={{ marginTop: 8, color: '#ff4d4f' }}>
              <WarningOutlined style={{ marginRight: 4 }} />
              TypeScript 代码存在语法错误
            </div>
          )}
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
          <Tooltip title={hasValidationErrors ? 'TypeScript 代码存在语法错误' : ''} placement='top'>
            <Button
              type='primary'
              icon={<SaveOutlined />}
              loading={saving}
              disabled={!hasChanges || hasValidationErrors}
              onClick={handleSave}>
              保存
            </Button>
          </Tooltip>
        </Space>
      }
      destroyOnHidden>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
      <AiParseModal
        open={aiParseModalOpen}
        onClose={() => setAiParseModalOpen(false)}
        onParse={handleAiParseSuccess}
        interfaceName={name.trim() ? name.trim() : undefined}
      />
    </Modal>
  );
};

export default DataModelDetailModal;
