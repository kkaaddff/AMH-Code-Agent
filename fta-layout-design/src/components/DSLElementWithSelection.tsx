import React from 'react';
import { DSLNode, DSLData } from '../types/dsl';
import { useSelection } from '../contexts/SelectionContext';
import DSLElement from './DSLElement';

interface DSLElementWithSelectionProps {
  node: DSLNode;
  dslData?: DSLData | null;
  originalNodeId?: string;
  onSelect?: (nodeId: string | null) => void;
  onHover?: (nodeId: string | null) => void;
}

const DSLElementWithSelection: React.FC<DSLElementWithSelectionProps> = ({ 
  node,
  dslData,
  originalNodeId,
  onSelect,
  onHover
}) => {
  const { selectedNodeId, hoveredNodeId, setSelectedNodeId, setHoveredNodeId } = useSelection();
  
  const nodeKey = originalNodeId || node.id;
  const isSelected = selectedNodeId === nodeKey;
  const isHovered = hoveredNodeId === nodeKey;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect?.(nodeKey);
    setSelectedNodeId(nodeKey);
  };

  const handleMouseEnter = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHover?.(nodeKey);
    setHoveredNodeId(nodeKey);
  };

  const handleMouseLeave = (e: React.MouseEvent) => {
    e.stopPropagation();
    onHover?.(null);
    setHoveredNodeId(null);
  };

  return (
    <div
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        outline: isSelected ? '2px solid rgb(24, 144, 255)' : 
                (isHovered ? '2px dashed rgba(24, 144, 255, 0.6)' : 'none'),
        outlineOffset: '1px',
        cursor: 'pointer',
        position: 'relative'
      }}
      data-node-id={nodeKey}
      data-dsl-id={node.id}
    >
      <DSLElement node={node} dslData={dslData} />
      
      {/* 递归渲染子节点，为每个子节点添加选择功能 */}
      {'children' in node && node.children && (node.children as DSLNode[]).map((child) => (
        <DSLElementWithSelection
          key={child.id}
          node={child}
          dslData={dslData}
          originalNodeId={child.id}
          onSelect={onSelect}
          onHover={onHover}
        />
      ))}
    </div>
  );
};

export default DSLElementWithSelection;
