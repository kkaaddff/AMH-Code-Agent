import React, { useState } from 'react';
import { Tabs, Typography, Empty } from 'antd';
import { CodeOutlined, FileTextOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Mock 请求参数
const MOCK_REQUEST_SCHEMA = {
  type: 'object',
  properties: {
    name: {
      type: 'string',
      description: '用户名称',
      example: '张三',
    },
    email: {
      type: 'string',
      format: 'email',
      description: '用户邮箱',
      example: 'zhangsan@example.com',
    },
    age: {
      type: 'integer',
      minimum: 0,
      maximum: 150,
      description: '用户年龄',
      example: 25,
    },
    role: {
      type: 'string',
      enum: ['admin', 'user', 'guest'],
      description: '用户角色',
      example: 'user',
    },
    profile: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'uri',
          description: '头像URL',
        },
        bio: {
          type: 'string',
          description: '个人简介',
        },
      },
    },
  },
  required: ['name', 'email'],
};

// Mock 响应参数
const MOCK_RESPONSE_SCHEMA = {
  type: 'object',
  properties: {
    code: {
      type: 'integer',
      description: '响应状态码',
      example: 200,
    },
    message: {
      type: 'string',
      description: '响应消息',
      example: 'Success',
    },
    data: {
      type: 'object',
      properties: {
        id: {
          type: 'string',
          description: '用户ID',
          example: 'user_123456',
        },
        name: {
          type: 'string',
          description: '用户名称',
          example: '张三',
        },
        email: {
          type: 'string',
          format: 'email',
          description: '用户邮箱',
          example: 'zhangsan@example.com',
        },
        age: {
          type: 'integer',
          description: '用户年龄',
          example: 25,
        },
        role: {
          type: 'string',
          description: '用户角色',
          example: 'user',
        },
        profile: {
          type: 'object',
          properties: {
            avatar: {
              type: 'string',
              format: 'uri',
              description: '头像URL',
              example: 'https://example.com/avatar.jpg',
            },
            bio: {
              type: 'string',
              description: '个人简介',
              example: '这是一段个人简介',
            },
          },
        },
        createdAt: {
          type: 'string',
          format: 'date-time',
          description: '创建时间',
          example: '2025-01-01T00:00:00Z',
        },
        updatedAt: {
          type: 'string',
          format: 'date-time',
          description: '更新时间',
          example: '2025-01-02T00:00:00Z',
        },
      },
    },
  },
};

interface OpenAPIDataPanelProps {
  selectedApiId?: string;
}

const OpenAPIDataPanel: React.FC<OpenAPIDataPanelProps> = ({ selectedApiId }) => {
  const [activeTab, setActiveTab] = useState('request');

  // 如果没有选中的 API，显示空状态
  if (!selectedApiId) {
    return (
      <div
        style={{
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgb(255, 255, 255)',
        }}>
        <Empty description='请从左侧选择一个接口' />
      </div>
    );
  }

  const tabItems = [
    {
      key: 'request',
      label: (
        <span>
          <CodeOutlined /> 请求参数
        </span>
      ),
      children: (
        <div style={{ padding: '16px' }}>
          <pre
            style={{
              background: 'rgb(245, 245, 245)',
              padding: '16px',
              borderRadius: 4,
              overflow: 'auto',
              fontSize: 12,
              lineHeight: 1.6,
              fontFamily: 'Monaco, Menlo, "Courier New", monospace',
              margin: 0,
            }}>
            {JSON.stringify(MOCK_REQUEST_SCHEMA, null, 2)}
          </pre>
        </div>
      ),
    },
    {
      key: 'response',
      label: (
        <span>
          <FileTextOutlined /> 响应数据
        </span>
      ),
      children: (
        <div style={{ padding: '16px' }}>
          <pre
            style={{
              background: 'rgb(245, 245, 245)',
              padding: '16px',
              borderRadius: 4,
              overflow: 'auto',
              fontSize: 12,
              lineHeight: 1.6,
              fontFamily: 'Monaco, Menlo, "Courier New", monospace',
              margin: 0,
            }}>
            {JSON.stringify(MOCK_RESPONSE_SCHEMA, null, 2)}
          </pre>
        </div>
      ),
    },
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgb(255, 255, 255)' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgb(240, 240, 240)',
          background: 'rgb(255, 255, 255)',
        }}>
        <Title level={5} style={{ margin: 0 }}>
          接口详情
        </Title>
        <Text type='secondary' style={{ fontSize: 12 }}>
          API ID: {selectedApiId}
        </Text>
      </div>

      {/* Tabs */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          style={{ height: '100%' }}
          tabBarStyle={{ margin: 0, padding: '0 16px' }}
        />
      </div>
    </div>
  );
};

export default OpenAPIDataPanel;
