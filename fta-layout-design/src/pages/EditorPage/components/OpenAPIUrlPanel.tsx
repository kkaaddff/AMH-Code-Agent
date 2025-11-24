import React, { useState } from 'react';
import { List, Tag, Typography, Space, Input } from 'antd';
import { SearchOutlined, ApiOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

// Mock API 数据
const MOCK_API_LIST = [
  {
    id: 'api-1',
    method: 'GET',
    path: '/api/v1/users',
    description: '获取用户列表',
    tags: ['用户管理'],
  },
  {
    id: 'api-2',
    method: 'POST',
    path: '/api/v1/users',
    description: '创建新用户',
    tags: ['用户管理'],
  },
  {
    id: 'api-3',
    method: 'GET',
    path: '/api/v1/users/{id}',
    description: '获取用户详情',
    tags: ['用户管理'],
  },
  {
    id: 'api-4',
    method: 'PUT',
    path: '/api/v1/users/{id}',
    description: '更新用户信息',
    tags: ['用户管理'],
  },
  {
    id: 'api-5',
    method: 'DELETE',
    path: '/api/v1/users/{id}',
    description: '删除用户',
    tags: ['用户管理'],
  },
  {
    id: 'api-6',
    method: 'GET',
    path: '/api/v1/projects',
    description: '获取项目列表',
    tags: ['项目管理'],
  },
  {
    id: 'api-7',
    method: 'POST',
    path: '/api/v1/projects',
    description: '创建新项目',
    tags: ['项目管理'],
  },
  {
    id: 'api-8',
    method: 'GET',
    path: '/api/v1/projects/{id}',
    description: '获取项目详情',
    tags: ['项目管理'],
  },
  {
    id: 'api-9',
    method: 'GET',
    path: '/api/v1/projects/{id}/pages',
    description: '获取项目页面列表',
    tags: ['页面管理'],
  },
  {
    id: 'api-10',
    method: 'POST',
    path: '/api/v1/projects/{id}/pages',
    description: '创建新页面',
    tags: ['页面管理'],
  },
];

// HTTP 方法对应的颜色
const METHOD_COLORS: Record<string, string> = {
  GET: 'blue',
  POST: 'green',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
};

interface OpenAPIUrlPanelProps {
  selectedApiId?: string;
  onSelectApi?: (apiId: string) => void;
}

const OpenAPIUrlPanel: React.FC<OpenAPIUrlPanelProps> = ({ selectedApiId, onSelectApi }) => {
  const [searchText, setSearchText] = useState('');

  // 过滤 API 列表
  const filteredApiList = MOCK_API_LIST.filter(
    (api) =>
      api.path.toLowerCase().includes(searchText.toLowerCase()) ||
      api.description.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgb(255, 255, 255)' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgb(240, 240, 240)',
          background: 'rgb(255, 255, 255)',
        }}>
        <Title level={5} style={{ margin: 0, marginBottom: 12 }}>
          <ApiOutlined /> OpenAPI 接口列表
        </Title>
        <Input
          placeholder='搜索接口路径或描述...'
          prefix={<SearchOutlined />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          allowClear
        />
      </div>

      {/* API List */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <List
          dataSource={filteredApiList}
          renderItem={(api) => {
            const isSelected = selectedApiId === api.id;
            return (
              <List.Item
                key={api.id}
                style={{
                  cursor: 'pointer',
                  backgroundColor: isSelected ? 'rgb(230, 247, 255)' : 'transparent',
                  padding: '16px 24px',
                  borderBottom: '1px solid rgb(240, 240, 240)',
                  transition: 'background-color 0.2s',
                }}
                onClick={() => onSelectApi?.(api.id)}
                onMouseEnter={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'rgb(250, 250, 250)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                  }
                }}>
                <List.Item.Meta
                  title={
                    <Space>
                      <Tag color={METHOD_COLORS[api.method]} style={{ minWidth: 50, textAlign: 'center' }}>
                        {api.method}
                      </Tag>
                      <Text strong code style={{ fontSize: 13 }}>
                        {api.path}
                      </Text>
                    </Space>
                  }
                  description={
                    <div style={{ marginTop: 4 }}>
                      <Text type='secondary' style={{ fontSize: 12 }}>
                        {api.description}
                      </Text>
                      <div style={{ marginTop: 4 }}>
                        {api.tags.map((tag) => (
                          <Tag key={tag} style={{ fontSize: 11, marginRight: 4 }}>
                            {tag}
                          </Tag>
                        ))}
                      </div>
                    </div>
                  }
                />
              </List.Item>
            );
          }}
        />
      </div>

      {/* Footer Info */}
      <div
        style={{
          padding: '12px 24px',
          borderTop: '1px solid rgb(240, 240, 240)',
          background: 'rgb(250, 250, 250)',
        }}>
        <Text type='secondary' style={{ fontSize: 12 }}>
          共 {filteredApiList.length} 个接口
        </Text>
      </div>
    </div>
  );
};

export default OpenAPIUrlPanel;
