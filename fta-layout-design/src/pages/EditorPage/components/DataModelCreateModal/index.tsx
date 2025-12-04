import { dataModelService } from '@/services/dataModelService';
import type { CreateDataModelRequest, DataModelGroup } from '@/types/dataModel';
import { DEFAULT_TS_TEMPLATE } from '@/types/dataModel';
import { RobotOutlined, WarningOutlined } from '@ant-design/icons';
import { App, Button, Form, Input, Modal, Select, Space, Tabs, Tooltip, Typography } from 'antd';
import React, { useEffect, useState } from 'react';
import { useSnapshot } from 'valtio';
import { editorPageActions, editorPageStore } from '../../contexts/EditorPageContext';
import TypeScriptEditor from '@/components/TypeScriptEditor';
import AiParseModal from '../AiParseModal';
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
  const [aiParseModalOpen, setAiParseModalOpen] = useState(false);

  // 表单状态
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [groupId, setGroupId] = useState<string | undefined>();
  const [tsContent, setTsContent] = useState(DEFAULT_TS_TEMPLATE);
  const [hasValidationErrors, setHasValidationErrors] = useState(false);

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
    setTsContent(DEFAULT_TS_TEMPLATE);
    setHasValidationErrors(false);
    setActiveTab('basic');
    setAiParseModalOpen(false);
  };

  const handleAiParseSuccess = (typescriptCode: string) => {
    // 将生成的 TypeScript 代码填充到编辑器
    setTsContent(typescriptCode);
    // 切换到 TypeScript 标签页以便用户查看
    setActiveTab('typescript');
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

    if (hasValidationErrors) {
      message.error('TypeScript 代码存在语法错误，请修复后再创建');
      setActiveTab('typescript');
      return;
    }

    setCreating(true);
    try {
      const createData: CreateDataModelRequest = {
        projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        groupId: groupId || undefined,
        tsContent,
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
      key: 'typescript',
      label: 'TypeScript 接口',
      children: (
        <div className='data-model-create-modal__tab-content'>
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
            onChange={setTsContent}
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
      title='新建数据模型'
      open={open}
      onCancel={handleClose}
      maskClosable={false}
      width={800}
      footer={
        <Space>
          <Button onClick={handleClose}>取消</Button>
          <Tooltip title={hasValidationErrors ? 'TypeScript 代码存在语法错误' : ''} placement='top'>
            <Button type='primary' onClick={handleCreate} loading={creating} disabled={!name.trim() || hasValidationErrors}>
              创建
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

export default DataModelCreateModal;
