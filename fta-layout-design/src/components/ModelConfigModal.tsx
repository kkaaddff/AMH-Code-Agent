import { Modal, Form, Input, Button, Space, message } from 'antd';
import { useEffect } from 'react';
import { getModelConfig, saveModelConfig, clearModelConfig, ModelConfig } from '@/utils/modelConfig';

interface ModelConfigModalProps {
  open: boolean;
  onClose: () => void;
}

export const ModelConfigModal: React.FC<ModelConfigModalProps> = ({ open, onClose }) => {
  const [form] = Form.useForm<ModelConfig>();

  useEffect(() => {
    if (open) {
      // 打开弹窗时加载已保存的配置
      const config = getModelConfig();
      form.setFieldsValue(config);
    }
  }, [open, form]);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      saveModelConfig(values);
      message.success('配置已保存');
      onClose();
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  };

  const handleClear = () => {
    form.resetFields();
    clearModelConfig();
    message.success('配置已清空');
  };

  return (
    <Modal
      title='模型配置'
      open={open}
      onCancel={onClose}
      footer={
        <Space>
          <Button onClick={handleClear}>清空</Button>
          <Button onClick={onClose}>取消</Button>
          <Button type='primary' onClick={handleSave}>
            保存
          </Button>
        </Space>
      }
      width={600}>
      <Form form={form} layout='vertical'>
        <Form.Item label='API Key' name='apiKey' rules={[{ required: false, message: '请输入 API Key' }]}>
          <Input.Password placeholder='请输入 API Key' />
        </Form.Item>
        <Form.Item
          label='Base URL'
          name='baseURL'
          rules={[
            { required: false, message: '请输入 Base URL' },
            { type: 'url', message: '请输入有效的 URL' },
          ]}>
          <Input placeholder='例如: https://api.openai.com/v1' />
        </Form.Item>
        <div style={{ color: '#999', fontSize: '12px', marginTop: '-16px' }}>
          提示：配置将保存在本地浏览器中，优先使用请求参数中的配置
        </div>
      </Form>
    </Modal>
  );
};
