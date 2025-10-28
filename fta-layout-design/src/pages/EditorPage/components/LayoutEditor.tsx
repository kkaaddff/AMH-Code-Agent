/**
 * @deprecated This component has been refactored into EditorPageLayout.tsx
 * 
 * 该组件的功能已经重构到 EditorPageLayout.tsx 中，采用了更现代的三面板布局结构。
 * 保留此文件是为了向后兼容，但不再推荐使用。
 * 
 * 如需使用布局编辑器，请直接导航到 /editor/layout 路由。
 */

import React from 'react';
import { Typography, Alert } from 'antd';
import { ComponentMapping } from '../types/componentDetectionV2';

const { Title, Paragraph } = Typography;

// Props for LayoutEditor component
export interface LayoutEditorProps {
  confirmedComponents?: ComponentMapping[];
}

/**
 * @deprecated 请使用 EditorPageLayout 代替
 */
const LayoutEditor: React.FC<LayoutEditorProps> = ({ confirmedComponents }) => {
  React.useEffect(() => {
    console.warn(
      'LayoutEditor component is deprecated. Please use EditorPageLayout instead. ' +
      'Navigate to /editor/layout route for the new layout editor.'
    );
    
    if (confirmedComponents && confirmedComponents.length > 0) {
      console.log('Confirmed components received:', confirmedComponents.length);
    }
  }, [confirmedComponents]);

  return (
    <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
      <Alert
        message="组件已废弃"
        description={
          <div>
            <Paragraph>
              该组件已被重构到 <code>EditorPageLayout.tsx</code> 中。
            </Paragraph>
            <Paragraph>
              新版本采用了更现代的三面板布局结构，具有以下优势：
            </Paragraph>
            <ul>
              <li>可折叠的侧边栏，提供更灵活的工作区</li>
              <li>统一的工具栏设计</li>
              <li>更好的响应式布局</li>
              <li>与组件识别编辑器一致的用户体验</li>
            </ul>
            <Paragraph>
              请直接访问 <code>/editor/layout</code> 路由来使用新的布局编辑器。
            </Paragraph>
          </div>
        }
        type="warning"
        showIcon
        style={{ marginBottom: '24px' }}
      />
      
      <Title level={3}>迁移说明</Title>
      <Paragraph>
        如果你在代码中直接使用了 <code>LayoutEditor</code> 组件，请改用路由导航：
      </Paragraph>
      <pre style={{ 
        background: 'rgb(245, 245, 245)', 
        padding: '12px', 
        borderRadius: '4px',
        overflow: 'auto'
      }}>
{`// 旧方式（已废弃）
<LayoutEditor confirmedComponents={components} />

// 新方式（推荐）
import { useNavigate } from 'react-router-dom';

const navigate = useNavigate();
navigate('/editor/layout', {
  state: {
    confirmedComponents: components,
    timestamp: Date.now(),
  }
});`}
      </pre>
    </div>
  );
};

export default LayoutEditor;
