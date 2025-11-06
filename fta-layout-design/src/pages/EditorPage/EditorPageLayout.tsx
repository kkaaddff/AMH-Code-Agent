import { EditProvider } from '@/contexts/EditContext';
import { useSelection } from '@/contexts/SelectionContext';
import layoutData from '@/demo/LayoutTree.json';
import type { DSLData, DSLNode } from '@/types/dsl';
import type { LayoutTreeNode } from '@/types/layout';
import { throttle } from '@/utils/debounce';
import { createNodeMapping, getLayoutNodeId, NodeMapping } from '@/utils/nodeMapping';
import { ensureNodeIds, findNodeById } from '@/utils/nodeUtils';
import { DownOutlined } from '@ant-design/icons';
import { App, Button, Dropdown, Layout, Space, Spin, Typography } from 'antd';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useSnapshot } from 'valtio/react';
import LayoutPreview from './components/LayoutPreview';
import LayoutTree from './components/LayoutTree';
import PropertyPanel from './components/PropertyPanel';
import { dslDataStore } from './contexts/DSLDataContext';
import { ComponentMapping } from './types/componentDetection';

const { Sider, Content } = Layout;
const { Title } = Typography;

interface LocationState {
  confirmedComponents?: ComponentMapping[];
  timestamp?: number;
}

// 更新节点的辅助函数
const updateNodeById = (node: LayoutTreeNode, targetId: string, updates: Partial<LayoutTreeNode>): LayoutTreeNode => {
  const cloneNode = (n: LayoutTreeNode): LayoutTreeNode => ({
    ...n,
    children: n.children ? n.children.map(cloneNode) : undefined,
  });

  const updateNode = (currentNode: LayoutTreeNode): LayoutTreeNode => {
    if (currentNode.nodeId === targetId) {
      return {
        ...currentNode,
        ...updates,
      };
    }

    if (currentNode.children) {
      return {
        ...currentNode,
        children: currentNode.children.map(updateNode),
      };
    }

    return currentNode;
  };

  return updateNode(cloneNode(node));
};

// Inner component that uses the context
const EditorPageLayoutContent: React.FC<{ confirmedComponents?: ComponentMapping[] }> = ({ confirmedComponents }) => {
  const { message } = App.useApp();
  const [designId, setDesignId] = useState<string | null>(null);
  const [scale, setScale] = useState(0.5);
  const [leftCollapsed, setLeftCollapsed] = useState(false);
  const [rightCollapsed, setRightCollapsed] = useState(false);
  const [layoutTreeData, setLayoutTreeData] = useState<LayoutTreeNode>(layoutData as LayoutTreeNode);
  const { selectedNodeId, setSelectedNodeId, setHoveredNodeId } = useSelection();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('designId');
    setDesignId(id);
  }, []);

  const { data: fetchedDSLData, loading: dslLoading, error: dslError } = useSnapshot(dslDataStore);

  const dslDataTyped = useMemo(() => {
    if (!fetchedDSLData) {
      return null;
    }
    return {
      dsl: {
        ...fetchedDSLData.dsl,
        nodes: fetchedDSLData.dsl.nodes.map((node) => ensureNodeIds(node as DSLNode)),
      },
    } as DSLData;
  }, [fetchedDSLData]);

  // 创建nodeId映射关系
  const nodeMapping = useMemo<NodeMapping>(() => {
    if (!dslDataTyped) {
      return {
        layoutToDS: new Map<string, string>(),
        dslToLayout: new Map<string, string>(),
      };
    }
    return createNodeMapping(layoutTreeData, dslDataTyped);
  }, [layoutTreeData, dslDataTyped]);

  // 处理节点更新
  const handleNodeUpdate = useCallback((nodeId: string, updates: Partial<LayoutTreeNode>) => {
    setLayoutTreeData((prevData) => {
      const newData = updateNodeById(prevData, nodeId, updates);
      if (newData) {
        message.success('节点更新成功');
        return newData;
      } else {
        message.error('节点更新失败');
        return prevData;
      }
    });
  }, []);

  // 处理树形视图选择 - 支持LayoutTree到DSL的映射
  const handleTreeSelect = useCallback(
    (selectedKeys: string[]) => {
      const layoutNodeId = selectedKeys.length > 0 ? selectedKeys[0] : null;
      setSelectedNodeId(layoutNodeId);
    },
    [setSelectedNodeId]
  );

  // 处理DSL编辑区域选择 - 支持DSL到LayoutTree的映射
  const handleDSLSelect = useCallback(
    (dslNodeId: string | null) => {
      if (dslNodeId) {
        const layoutNodeId = getLayoutNodeId(nodeMapping, dslNodeId);
        setSelectedNodeId(layoutNodeId || dslNodeId);
      } else {
        setSelectedNodeId(null);
      }
    },
    [nodeMapping, setSelectedNodeId]
  );

  // 创建节流的悬停处理函数
  const throttledSetHoveredNodeId = useMemo(() => throttle(setHoveredNodeId, 50), [setHoveredNodeId]);

  // 处理树形视图悬停
  const handleTreeHover = useCallback(
    (nodeId: string | null) => {
      throttledSetHoveredNodeId(nodeId);
    },
    [throttledSetHoveredNodeId]
  );

  // 处理DSL编辑区域悬停
  const handleDSLHover = useCallback(
    (dslNodeId: string | null) => {
      if (dslNodeId) {
        const layoutNodeId = getLayoutNodeId(nodeMapping, dslNodeId);
        throttledSetHoveredNodeId(layoutNodeId || dslNodeId);
      } else {
        throttledSetHoveredNodeId(null);
      }
    },
    [nodeMapping, throttledSetHoveredNodeId]
  );

  // 缓存选中的节点
  const selectedNode = useMemo(
    () => (selectedNodeId ? findNodeById(layoutTreeData, selectedNodeId) : null),
    [selectedNodeId, layoutTreeData]
  );

  // Handle scale change
  const handleScaleChange = (value: number) => {
    const clampedValue = Math.max(0.1, Math.min(2, value));
    setScale(clampedValue);
  };

  // Log confirmed components on mount
  useEffect(() => {
    if (confirmedComponents && confirmedComponents.length > 0) {
      console.log('=== 布局编辑器接收到的确认组件数据 ===');
      console.log('组件数量:', confirmedComponents.length);

      // 按组件类型分组统计
      const componentsByType = confirmedComponents.reduce((acc, component) => {
        const type = component.ftaComponent;
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('组件类型统计:', componentsByType);
      console.log('确认组件列表:', confirmedComponents);
      console.log('=============================================');
    }
  }, [confirmedComponents]);

  return (
    <>
      {dslLoading && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <Spin size='large' />
          <div style={{ marginTop: 16, color: '#999', fontSize: 14 }}>加载 DSL 数据...</div>
        </div>
      )}
      {!dslLoading && dslError && (
        <div style={{ padding: '24px' }}>
          <Typography.Text type='danger'>加载 DSL 数据失败：{dslError.message}</Typography.Text>
        </div>
      )}
      {!dslLoading && !dslError && !dslDataTyped && designId !== null && (
        <div style={{ padding: '24px' }}>
          <Typography.Text type='secondary'>
            {designId ? '未获取到 DSL 数据，请稍后重试。' : '请通过 URL 提供 designId 参数以加载 DSL 数据。'}
          </Typography.Text>
        </div>
      )}
      {!dslLoading && !dslError && dslDataTyped && (
        <Layout style={{ width: '100%', height: 'calc(100vh - 64px)' }}>
          {/* Left Panel - Component Tree */}
          <Sider
            width={400}
            theme='light'
            collapsible
            collapsed={leftCollapsed}
            onCollapse={(collapsed) => setLeftCollapsed(collapsed)}
            collapsedWidth={0}
            trigger={null}
            style={{ borderRight: '1px solid rgb(240, 240, 240)', overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid rgb(240, 240, 240)',
                background: 'rgb(250, 250, 250)',
              }}>
              <Title level={5} style={{ margin: 0 }}>
                组件树
              </Title>
            </div>
            <div style={{ height: 'calc(100% - 57px)', overflow: 'auto', padding: '8px' }}>
              <LayoutTree
                data={layoutTreeData}
                selectedKeys={selectedNodeId ? [selectedNodeId] : []}
                onSelect={handleTreeSelect}
                onHover={handleTreeHover}
              />
            </div>
          </Sider>

          {/* Middle Panel - Preview */}
          <Layout>
            <Content style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Toolbar */}
              <div
                style={{
                  padding: '12px 16px',
                  borderBottom: '1px solid rgb(240, 240, 240)',
                  background: 'rgb(255, 255, 255)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}>
                <Title level={5} style={{ margin: 0 }}>
                  布局编辑器
                  {confirmedComponents && confirmedComponents.length > 0 && (
                    <span
                      style={{
                        marginLeft: '12px',
                        fontSize: '14px',
                        color: 'rgb(153, 153, 153)',
                        fontWeight: 'normal',
                      }}>
                      ({confirmedComponents.length} 个已确认组件)
                    </span>
                  )}
                </Title>
                <Space>
                  <Dropdown
                    menu={{
                      items: [
                        { key: '0.25', label: '25%' },
                        { key: '0.5', label: '50%' },
                        { key: '0.75', label: '75%' },
                        { key: '1', label: '100%' },
                        { key: '1.5', label: '150%' },
                        { key: '2', label: '200%' },
                      ],
                      onClick: ({ key }) => handleScaleChange(parseFloat(key)),
                    }}
                    trigger={['click']}>
                    <a onClick={(e) => e.preventDefault()}>
                      {Math.round(scale * 100)}% &nbsp;
                      <DownOutlined />
                    </a>
                  </Dropdown>
                </Space>
              </div>

              {/* Preview Canvas */}
              <div
                style={{
                  flex: 1,
                  overflow: 'auto',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'flex-start',
                  position: 'relative',
                  padding: '20px',
                  background: 'rgb(250, 250, 250)',
                  backgroundSize: 'auto',
                }}>
                {/* Left collapse button */}
                <Button
                  type='dashed'
                  size='small'
                  onClick={() => setLeftCollapsed(!leftCollapsed)}
                  icon={<span style={{ fontSize: '14px' }}>{leftCollapsed ? '▶' : '◀'}</span>}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 100,
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 8px',
                  }}
                  title={leftCollapsed ? '显示组件树' : '隐藏组件树'}
                />

                {/* Right collapse button */}
                <Button
                  type='dashed'
                  size='small'
                  onClick={() => setRightCollapsed(!rightCollapsed)}
                  icon={<span style={{ fontSize: '14px' }}>{rightCollapsed ? '◀' : '▶'}</span>}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    zIndex: 100,
                    height: '60px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 8px',
                  }}
                  title={rightCollapsed ? '显示属性面板' : '隐藏属性面板'}
                />

                <LayoutPreview
                  dslData={dslDataTyped}
                  layoutData={layoutTreeData}
                  scale={scale}
                  selectedNodeId={selectedNodeId}
                  onSelect={handleDSLSelect}
                  onHover={handleDSLHover}
                />
              </div>
            </Content>
          </Layout>

          {/* Right Panel - Property Panel */}
          <Sider
            width={500}
            theme='light'
            collapsible
            collapsed={rightCollapsed}
            onCollapse={(collapsed) => setRightCollapsed(collapsed)}
            collapsedWidth={0}
            trigger={null}
            style={{ borderLeft: '1px solid rgb(240, 240, 240)', overflow: 'hidden' }}>
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid rgb(240, 240, 240)',
                background: 'rgb(250, 250, 250)',
              }}>
              <Title level={5} style={{ margin: 0 }}>
                属性面板
              </Title>
            </div>
            <div style={{ height: 'calc(100% - 57px)', overflow: 'auto', padding: '8px' }}>
              <PropertyPanel selectedNode={selectedNode} onNodeUpdate={handleNodeUpdate} />
            </div>
          </Sider>
        </Layout>
      )}
    </>
  );
};

// Main component with providers
const EditorPageLayout: React.FC = () => {
  const location = useLocation();
  const state = location.state as LocationState;

  return (
    <EditProvider>
      <EditorPageLayoutContent confirmedComponents={state?.confirmedComponents} />
    </EditProvider>
  );
};

export default EditorPageLayout;
