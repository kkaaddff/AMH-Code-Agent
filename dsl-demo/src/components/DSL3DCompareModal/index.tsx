import { DesignData, DSLNode } from '@fta/shared-types';
import { Button, Modal } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { DSL3DScene, DSLNodeInfo } from './DSL3DScene';
import './style.css';

interface DSL3DCompareModalProps {
  open: boolean;
  onClose: () => void;
  rawDsl: DesignData | null;
  cleanedDsl: DesignData | null;
}

// Helper function to check if node is hidden
const isNodeHidden = (node: DSLNode): boolean => {
  if (node.hidden) return true;
  if ((node as any).mask === 'outline') return true;
  return false;
};

// Convert DSL to flat nodes for 3D rendering
const flattenDslNodes = (dslData: DesignData | null): DSLNodeInfo[] => {
  if (!dslData) return [];

  const nodes: DSLNodeInfo[] = [];

  const traverse = (node: DSLNode, depth: number, parentX: number, parentY: number) => {
    if (!node) return;

    // Skip hidden nodes
    if (isNodeHidden(node)) {
      return;
    }

    const layout = node.layoutStyle || {};
    const width = layout.width || 0;
    const height = layout.height || 0;

    const x = parentX + (layout.relativeX || layout.left || 0);
    const y = parentY + (layout.relativeY || layout.top || 0);

    nodes.push({
      id: node.id || `node-${Math.random()}`,
      name: node.name,
      type: node.type,
      width,
      height,
      x,
      y,
      depth,
      rawNode: node,
    });

    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => traverse(child, depth + 1, x, y));
    }
  };

  let rootNodes: DSLNode[] = [];

  if (dslData && typeof dslData === 'object' && 'dsl' in dslData && dslData.dsl?.nodes) {
    rootNodes = dslData.dsl.nodes;
  }

  rootNodes.forEach((item) => traverse(item, 0, 0, 0));

  return nodes;
};

const DSL3DCompareModal: React.FC<DSL3DCompareModalProps> = ({ open, onClose, rawDsl, cleanedDsl }) => {
  const leftContainerRef = useRef<HTMLDivElement>(null);
  const rightContainerRef = useRef<HTMLDivElement>(null);
  const leftSceneRef = useRef<DSL3DScene | null>(null);
  const rightSceneRef = useRef<DSL3DScene | null>(null);

  const [selectedNode, setSelectedNode] = useState<DSLNodeInfo | null>(null);

  const leftFlatNodes = useMemo(() => flattenDslNodes(rawDsl), [rawDsl]);
  const rightFlatNodes = useMemo(() => flattenDslNodes(cleanedDsl), [cleanedDsl]);

  // Initialize Scenes
  useEffect(() => {
    if (open) {
      const initTimer = setTimeout(() => {
        if (leftContainerRef.current && !leftSceneRef.current) {
          leftSceneRef.current = new DSL3DScene(leftContainerRef.current, {
            onSelect: (node) => setSelectedNode(node),
            onHover: () => {},
          });
          leftSceneRef.current.updateNodes(leftFlatNodes);
        }

        if (rightContainerRef.current && !rightSceneRef.current) {
          rightSceneRef.current = new DSL3DScene(rightContainerRef.current, {
            onSelect: (node) => setSelectedNode(node),
            onHover: () => {},
          });
          rightSceneRef.current.updateNodes(rightFlatNodes);
        }
      }, 300);

      return () => clearTimeout(initTimer);
    }

    return () => {
      if (!open) {
        if (leftSceneRef.current) {
          leftSceneRef.current.dispose();
          leftSceneRef.current = null;
        }
        if (rightSceneRef.current) {
          rightSceneRef.current.dispose();
          rightSceneRef.current = null;
        }
      }
    };
  }, [open]);

  const handleClose = () => {
    if (leftSceneRef.current) {
      leftSceneRef.current.dispose();
      leftSceneRef.current = null;
    }
    if (rightSceneRef.current) {
      rightSceneRef.current.dispose();
      rightSceneRef.current = null;
    }
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={
        <div className='dsl-3d-compare-modal__title'>
          <span>DSL 3D Structure Comparison</span>
          <div className='dsl-3d-compare-modal__title-actions'>
            {selectedNode && (
              <span className='dsl-3d-compare-modal__selected-info'>
                Selected: {selectedNode.id.length > 20 ? `${selectedNode.id.slice(0, 16)}...` : selectedNode.id}
              </span>
            )}
            <Button size='small' type='primary' onClick={handleClose}>
              关闭
            </Button>
          </div>
        </div>
      }
      width='100vw'
      footer={null}
      centered={false}
      destroyOnClose
      closable={false}
      maskClosable={false}
      keyboard={false}
      rootClassName='dsl-3d-compare-modal'>
      <div className='dsl-3d-compare-modal__layout'>
        <div className='dsl-3d-compare-modal__viewport'>
          <div className='dsl-3d-compare-modal__header'>Before (Raw)</div>
          <div ref={leftContainerRef} className='dsl-3d-compare-modal__canvas' />
        </div>
        <div className='dsl-3d-compare-modal__viewport'>
          <div className='dsl-3d-compare-modal__header'>After (Cleaned)</div>
          <div ref={rightContainerRef} className='dsl-3d-compare-modal__canvas' />
        </div>
      </div>
    </Modal>
  );
};

export default DSL3DCompareModal;
