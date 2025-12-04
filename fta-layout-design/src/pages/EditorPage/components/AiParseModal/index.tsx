import { RobotOutlined } from '@ant-design/icons';
import { App, Button, Input, Modal, Radio, Space, Typography } from 'antd';
import React, { useState } from 'react';
import { aiParseTypeScript } from '../../services/AiParsing';
import './index.css';

const { Text } = Typography;

export interface AiParseModalProps {
  open: boolean;
  onClose: () => void;
  /** 解析成功回调，返回生成的 TypeScript 代码 */
  onParse: (typescriptCode: string) => void;
  /** 外部 loading 状态（可选） */
  loading?: boolean;
  /** 接口名称（可选，如果不提供则从输入中推断） */
  interfaceName?: string;
}

/**
 * AI 智能解析弹窗组件
 * 支持 JSON、TypeScript、文字描述三种输入方式，生成 TypeScript 接口定义
 */
const AiParseModal: React.FC<AiParseModalProps> = ({ open, onClose, onParse, loading = false, interfaceName }) => {
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
      // 直接调用前端 AI 解析服务，通过 model-gateway-sync 调用统一大模型
      const typescriptCode = await aiParseTypeScript({
        text: aiText.trim(),
        hint: aiHint,
        interfaceName,
      });

      // 校验解析结果
      if (!typescriptCode || !typescriptCode.trim()) {
        message.error('未能生成有效的 TypeScript 代码');
        return;
      }

      // 简单校验：检查是否包含 interface 或 type 关键字
      if (!typescriptCode.includes('interface ') && !typescriptCode.includes('type ')) {
        message.warning('生成的代码可能不包含接口定义，请检查输入格式');
      }

      onParse(typescriptCode);
      message.success('TypeScript 接口生成成功');
      handleClose();
    } catch (error: any) {
      console.error('AI 解析失败:', error);
      message.error(error.message || 'AI 解析失败');
    } finally {
      setParsing(false);
    }
  };

  const isLoading = parsing || loading;

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
          <Button type='primary' icon={<RobotOutlined />} onClick={handleParse} loading={isLoading}>
            {isLoading ? '解析中...' : '开始解析'}
          </Button>
        </Space>
      }
      destroyOnHidden>
      <div className='ai-parse-modal__content'>
        <Text type='secondary' style={{ marginBottom: 8, display: 'block' }}>
          粘贴 JSON、TypeScript 类型定义或文字描述，AI 将自动生成 TypeScript 接口定义
        </Text>
        <div className='ai-parse-modal__hint'>
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
          className='ai-parse-modal__input'
        />
      </div>
    </Modal>
  );
};

export default AiParseModal;
