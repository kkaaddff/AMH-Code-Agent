import React, { useState } from 'react';
import { Modal, Form, Input, Button, Space, Tag, App } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { CreateProjectForm } from '../types/project';
import { useProject } from '../contexts/ProjectContext';

const { TextArea } = Input;

interface ProjectCreateModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess?: () => void;
}

const ProjectCreateModal: React.FC<ProjectCreateModalProps> = ({ visible, onCancel, onSuccess }) => {
  const { message } = App.useApp();
  const { createProject, state } = useProject();
  const [form] = Form.useForm();
  const [tags, setTags] = useState<string[]>([]);
  const [inputTag, setInputTag] = useState('');
  const [avatar, setAvatar] = useState('📁');

  const avatarOptions = ['📁', '🛒', '📱', '📊', '✍️', '🎨', '⚡', '🔧', '🌟', '🚀'];

  const handleSubmit = async (values: CreateProjectForm) => {
    try {
      await createProject({
        ...values,
        avatar,
        tags,
      });
      message.success('项目创建成功！');
      form.resetFields();
      setTags([]);
      setAvatar('📁');
      onSuccess?.();
      onCancel();
    } catch (error) {
      message.error('项目创建失败，请重试');
    }
  };

  const handleAddTag = () => {
    if (inputTag && !tags.includes(inputTag)) {
      setTags([...tags, inputTag]);
      setInputTag('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleCancel = () => {
    form.resetFields();
    setTags([]);
    setAvatar('📁');
    onCancel();
  };

  return (
    <Modal title="创建新项目" open={visible} onCancel={handleCancel} footer={null} width={600} destroyOnHidden>
      <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
        <Form.Item label="项目头像" name="avatar">
          <div className="avatar-selector">
            <div className="current-avatar" style={{ marginBottom: 8 }}>
              <span style={{ fontSize: 32 }}>{avatar}</span>
            </div>
            <div className="avatar-options">
              {avatarOptions.map((option) => (
                <Button
                  key={option}
                  type={avatar === option ? 'primary' : 'default'}
                  size="small"
                  style={{ margin: '2px', fontSize: 16 }}
                  onClick={() => setAvatar(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </Form.Item>

        <Form.Item
          label="项目名称"
          name="name"
          rules={[
            { required: true, message: '请输入项目名称' },
            { min: 2, message: '项目名称至少2个字符' },
            { max: 50, message: '项目名称不能超过50个字符' },
          ]}
        >
          <Input placeholder="请输入项目名称" size="large" />
        </Form.Item>

        <Form.Item label="项目描述" name="description" rules={[{ max: 200, message: '项目描述不能超过200个字符' }]}>
          <TextArea placeholder="请输入项目描述（可选）" rows={3} showCount maxLength={200} />
        </Form.Item>

        <Form.Item
          label="Git仓库地址"
          name="gitRepository"
          rules={[
            {
              pattern: /^https?:\/\/.+/,
              message: '请输入有效的Git仓库地址',
            },
          ]}
        >
          <Input placeholder="https://github.com/username/repository（可选）" size="large" />
        </Form.Item>

        <Form.Item label="项目负责人" name="manager" rules={[{ required: true, message: '请输入项目负责人' }]}>
          <Input placeholder="请输入项目负责人姓名" size="large" />
        </Form.Item>

        <Form.Item label="项目标签">
          <div className="tags-input">
            <div className="tags-display" style={{ marginBottom: 8 }}>
              {tags.map((tag) => (
                <Tag key={tag} closable onClose={() => handleRemoveTag(tag)}>
                  {tag}
                </Tag>
              ))}
            </div>
            <Space.Compact style={{ width: '100%' }}>
              <Input
                placeholder="输入标签名称"
                value={inputTag}
                onChange={(e) => setInputTag(e.target.value)}
                onPressEnter={handleAddTag}
                maxLength={20}
              />
              <Button
                type="default"
                icon={<PlusOutlined />}
                onClick={handleAddTag}
                disabled={!inputTag || tags.includes(inputTag)}
              >
                添加
              </Button>
            </Space.Compact>
          </div>
        </Form.Item>

        <Form.Item style={{ marginBottom: 0, marginTop: 24 }}>
          <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
            <Button onClick={handleCancel}>取消</Button>
            <Button type="primary" htmlType="submit" loading={state.loading} size="large">
              创建项目
            </Button>
          </Space>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default ProjectCreateModal;
