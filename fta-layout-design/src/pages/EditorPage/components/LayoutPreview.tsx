import CanvasInteractionLayer from '@/components/CanvasInteractionLayer';
import DSLElement from '@/components/DSLElement';
import EditableCanvasLayer from '@/components/EditableCanvasLayer';
import { useEdit } from '@/contexts/EditContext';
import { useSelection } from '@/contexts/SelectionContext';
import { DSLData } from '@/types/dsl';
import { LayoutTreeNode } from '@/types/layout';
import { ClearOutlined, EditOutlined, EyeOutlined, PlusSquareOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import React, { useCallback, useMemo } from 'react';
import './LayoutPreview.css';

interface LayoutPreviewProps {
  dslData: DSLData;
  layoutData: LayoutTreeNode;
  scale?: number;
  selectedNodeId?: string | null;
  onSelect?: (nodeId: string | null) => void;
  onHover?: (nodeId: string | null) => void;
}

// 使用 React.memo 优化组件，只在 props 真正改变时重新渲染
const LayoutPreview: React.FC<LayoutPreviewProps> = React.memo(
  ({ dslData, layoutData, scale = 1, onSelect, onHover }) => {
    const { setSelectedNodeId, setHoveredNodeId } = useSelection();
    const {
      isEditMode,
      setIsEditMode,
      currentEditMode,
      setCurrentEditMode,
      showAllBoxes,
      setShowAllBoxes,
      setEditingNodeId,
    } = useEdit();

    // 使用 useCallback 缓存事件处理函数 - 现在只用于 Canvas 层
    const handleCanvasSelect = useCallback(
      (nodeId: string | null) => {
        onSelect?.(nodeId);
        setSelectedNodeId(nodeId);
        // 总是设置编辑节点，这样切换到编辑模式时会保留选中状态
        setEditingNodeId(nodeId);
      },
      [onSelect, setSelectedNodeId, setEditingNodeId]
    );

    const handleCanvasHover = useCallback(
      (nodeId: string | null) => {
        onHover?.(nodeId);
        setHoveredNodeId(nodeId);
      },
      [onHover, setHoveredNodeId]
    );

    // 容器点击事件 - 取消选择
    const handleContainerClick = useCallback(
      (e: React.MouseEvent) => {
        // 只有点击到容器本身时才取消选择，避免与 Canvas 冲突
        if (e.target === e.currentTarget) {
          handleCanvasSelect(null);
        }
      },
      [handleCanvasSelect]
    );

    // 编辑相关事件处理函数
    const handleEditModeToggle = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsEditMode(!isEditMode);
        if (isEditMode) {
          // 退出编辑模式时，重置编辑状态
          setCurrentEditMode('none');
          setEditingNodeId(null);
        }
      },
      [isEditMode, setIsEditMode, setCurrentEditMode, setEditingNodeId]
    );

    const handleDrawMode = useCallback(() => {
      if (!isEditMode) {
        setIsEditMode(true);
      }
      setCurrentEditMode(currentEditMode === 'draw' ? 'none' : 'draw');
    }, [isEditMode, setIsEditMode, currentEditMode, setCurrentEditMode]);

    const handleClearSelection = useCallback(() => {
      setSelectedNodeId(null);
      setHoveredNodeId(null);
      setEditingNodeId(null);
    }, [setSelectedNodeId, setHoveredNodeId, setEditingNodeId]);

    // 缓存根节点数据
    const { rootNode, width, height } = useMemo(() => {
      const node = dslData.dsl.nodes[0];
      return {
        rootNode: node,
        width: node?.layoutStyle?.width || 720,
        height: node?.layoutStyle?.height || 1560,
      };
    }, [dslData]);

    // 缓存容器样式
    const containerStyle = useMemo(
      () => ({
        width: width * scale + 2,
        height: height * scale + 2,
      }),
      [width, height, scale]
    );

    // 缓存内容样式
    const contentStyle = useMemo(
      () => ({
        transform: `scale(${scale})`,
        transformOrigin: 'top left',
        width: width,
        height: height,
      }),
      [scale, width, height]
    );

    return (
      <div style={{ position: 'relative', width: '100%', height: '100%' }}>
        {/* 编辑工具栏 */}
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 100,
            background: 'rgba(255, 255, 255, 0.95)',
            borderRadius: '6px',
            padding: '8px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
        >
          <Tooltip title={isEditMode ? '退出编辑模式' : '进入编辑模式'}>
            <Button
              size="small"
              type={isEditMode ? 'primary' : 'default'}
              icon={<EditOutlined />}
              onClick={handleEditModeToggle}
            />
          </Tooltip>
          <Tooltip title={currentEditMode === 'draw' ? '退出绘制模式' : '新建框'}>
            <Button
              size="small"
              type={currentEditMode === 'draw' ? 'primary' : 'default'}
              icon={<PlusSquareOutlined />}
              onClick={handleDrawMode}
              disabled={!isEditMode}
            />
          </Tooltip>
          <Tooltip title={showAllBoxes ? '隐藏所有框' : '显示所有框'}>
            <Button
              size="small"
              type={showAllBoxes ? 'primary' : 'default'}
              icon={<EyeOutlined />}
              onClick={() => setShowAllBoxes(!showAllBoxes)}
            />
          </Tooltip>
          <Tooltip title="清除选择">
            <Button size="small" icon={<ClearOutlined />} onClick={handleClearSelection} />
          </Tooltip>
        </div>

        {/* 预览内容 */}
        <div className="layout-preview-container" style={containerStyle} onClick={handleContainerClick}>
          <div className="layout-preview-content" style={contentStyle}>
            {/* 底层：DSL 静态展示层 - 移除所有交互事件 */}
            <DSLElement
              node={rootNode}
              dslData={dslData}
              selectedNodeId={null} // 不显示选择状态
              hoveredNodeId={null} // 不显示悬停状态
              // 移除 onSelect 和 onHover，使其完全静态
            />

            {/* 中层：Canvas 交互层 - 仅在非编辑模式下响应交互 */}
            {!isEditMode && (
              <CanvasInteractionLayer
                dslData={dslData}
                layoutData={layoutData}
                scale={scale}
                width={width}
                height={height}
                onSelect={handleCanvasSelect}
                onHover={handleCanvasHover}
              />
            )}

            {/* 上层：编辑层 - 仅在编辑模式或显示所有框时渲染 */}
            <EditableCanvasLayer dslData={dslData} scale={scale} width={width} height={height} />
          </div>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // 自定义比较函数，只在关键属性改变时重新渲染
    return (
      prevProps.scale === nextProps.scale &&
      prevProps.selectedNodeId === nextProps.selectedNodeId &&
      prevProps.dslData === nextProps.dslData &&
      prevProps.layoutData === nextProps.layoutData &&
      prevProps.onSelect === nextProps.onSelect &&
      prevProps.onHover === nextProps.onHover
    );
  }
);

LayoutPreview.displayName = 'LayoutPreview';

export default LayoutPreview;
