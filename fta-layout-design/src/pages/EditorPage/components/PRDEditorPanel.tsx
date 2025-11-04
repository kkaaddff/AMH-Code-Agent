import React, { useState } from 'react';
import { Button, Space, Typography, Card, Input } from 'antd';
import { SaveOutlined, EyeOutlined, ExportOutlined } from '@ant-design/icons';

const { Title } = Typography;
const { TextArea } = Input;

// Mock PRD 内容
const MOCK_PRD_CONTENT = `# 产品需求文档 (PRD)

## 1. 产品概述

本产品旨在提供一个高效的设计到代码转换平台，帮助开发团队快速将设计稿转换为可运行的代码。

## 2. 功能需求

### 2.1 组件识别
- 自动识别设计稿中的UI组件
- 支持手动标注和调整
- 提供组件属性编辑功能

### 2.2 布局编辑
- 可视化布局编辑器
- 支持拖拽调整组件位置
- 实时预览布局效果

### 2.3 代码生成
- 支持多框架代码生成（React、Vue等）
- 自动生成组件代码和样式
- 提供代码预览和导出功能

## 3. 非功能需求

### 3.1 性能要求
- 页面加载时间 < 2s
- 组件识别响应时间 < 3s
- 支持最大 10MB 的设计文件

### 3.2 兼容性
- 支持 Chrome、Safari、Firefox 最新版本
- 支持 MasterGo 设计文件格式

## 4. 用户体验

### 4.1 界面设计
- 采用直观的三栏布局
- 提供快捷键操作
- 支持暗黑模式

### 4.2 交互流程
1. 上传设计稿
2. 自动识别组件
3. 手动调整标注
4. 生成代码
5. 预览和导出

## 5. 技术实现

### 5.1 前端技术栈
- React 18
- TypeScript
- Ant Design
- Zustand

### 5.2 后端技术栈
- Node.js
- Midway.js
- TypeScript

## 6. 迭代计划

### V1.0（当前版本）
- ✅ 基础组件识别
- ✅ 布局编辑器
- ✅ React 代码生成

### V2.0（计划中）
- 🚧 AI 辅助识别
- 🚧 多框架支持
- 🚧 团队协作功能
`;

interface PRDEditorPanelProps {
  documentId?: string;
}

const PRDEditorPanel: React.FC<PRDEditorPanelProps> = ({ documentId: _documentId }) => {
  const [content, setContent] = useState(MOCK_PRD_CONTENT);
  const [isPreview, setIsPreview] = useState(false);

  const handleSave = () => {
    console.log('保存 PRD 文档:', content);
    // TODO: 实现保存功能
  };

  const handleExport = () => {
    console.log('导出 PRD 文档');
    // TODO: 实现导出功能
  };

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: 'rgb(255, 255, 255)' }}>
      {/* Header */}
      <div
        style={{
          padding: '16px 24px',
          borderBottom: '1px solid rgb(240, 240, 240)',
          background: 'rgb(255, 255, 255)',
        }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Title level={5} style={{ margin: 0 }}>
            PRD 文档编辑器
          </Title>
          <Space>
            <Button
              size='small'
              icon={<EyeOutlined />}
              onClick={() => setIsPreview(!isPreview)}
              type={isPreview ? 'primary' : 'default'}>
              {isPreview ? '编辑模式' : '预览模式'}
            </Button>
            <Button size='small' icon={<SaveOutlined />} onClick={handleSave}>
              保存
            </Button>
            <Button size='small' icon={<ExportOutlined />} onClick={handleExport}>
              导出
            </Button>
          </Space>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px' }}>
        {isPreview ? (
          <Card>
            <pre
              style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word',
                fontFamily: 'system-ui, -apple-system, sans-serif',
                fontSize: 14,
                lineHeight: 1.6,
                margin: 0,
              }}>
              {content}
            </pre>
          </Card>
        ) : (
          <TextArea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            style={{
              width: '100%',
              height: '100%',
              fontFamily: 'Monaco, Menlo, "Courier New", monospace',
              fontSize: 14,
              lineHeight: 1.6,
            }}
            placeholder='请输入 PRD 文档内容（支持 Markdown 格式）...'
          />
        )}
      </div>
    </div>
  );
};

export default PRDEditorPanel;
