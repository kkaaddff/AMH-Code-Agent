import DSLElement from '@/components/DSLElement';
import { DesignDSL, DSLNode } from '@/types/dsl';
import { Button, Modal, Switch } from 'antd';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';
import { designDetectionActions, designDetectionStore } from '../../contexts/DesignDetectionContext';
import { DSL3DScene, DSLNodeInfo } from './DSL3DScene';

import './style.css';

interface DSL3DInspectModalProps {
  open: boolean;
  onClose: () => void;
}

const buildPreviewDSL = (node: DSLNode, dslData: DesignDSL | null): DesignDSL | null => {
  if (!dslData) return null;

  const cloneWithoutHidden = (current: DSLNode): DSLNode => {
    const clonedChildren = current.children?.map((child) => cloneWithoutHidden(child));
    const clonedLayers = (current as any).layers?.map((child: DSLNode) => cloneWithoutHidden(child));
    return {
      ...current,
      hidden: false,
      ...(clonedChildren ? { children: clonedChildren } : {}),
      ...((current as any).layers ? { layers: clonedLayers } : {}),
    };
  };

  return {
    ...dslData,
    dsl: {
      ...dslData.dsl,
      nodes: [cloneWithoutHidden(node)],
    },
  };
};

const DSL3DInspectModal: React.FC<DSL3DInspectModalProps> = ({ open, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { dslData } = useSnapshot(designDetectionStore);
  const sceneRef = useRef<DSL3DScene | null>(null);

  const [selectedNode, setSelectedNode] = useState<DSLNodeInfo | null>(null);
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);

  const flatNodes = useMemo(() => {
    if (!dslData) return [];

    const nodes: DSLNodeInfo[] = [];

    const traverse = (node: any, depth: number, parentX: number, parentY: number) => {
      if (!node) return;

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
        node.children.forEach((child: any) => traverse(child, depth + 1, x, y));
      } else if (node.layers && Array.isArray(node.layers)) {
        node.layers.forEach((child: any) => traverse(child, depth + 1, x, y));
      }
    };

    let rootNodes: any[] = [];

    if (dslData && typeof dslData === 'object' && 'dsl' in dslData && (dslData as any).dsl?.nodes) {
      rootNodes = (dslData as any).dsl.nodes;
    } else if (Array.isArray(dslData)) {
      rootNodes = dslData;
    } else {
      rootNodes = [dslData];
    }

    rootNodes.forEach((item) => traverse(item, 0, 0, 0));

    return nodes.filter((node) => !node.rawNode.hidden && node.rawNode.mask !== 'outline');
  }, [dslData]);

  const tmpDSLData: DesignDSL | null = useMemo(() => {
    if (!selectedNode || !dslData) return null;

    const targetNode = selectedNode.rawNode as DSLNode;

    return {
      ...dslData,
      dsl: {
        ...dslData.dsl,
        nodes: [targetNode],
      },
    };
  }, [selectedNode, dslData]);

  const hiddenNodes = useMemo(() => {
    if (!dslData?.dsl?.nodes?.length) return [];

    const nodes: DSLNode[] = [];
    const traverse = (node: DSLNode) => {
      if (node.hidden) {
        nodes.push(node);
      }
      if (node.children?.length) {
        node.children.forEach(traverse);
      } else if ((node as any).layers?.length) {
        (node as any).layers.forEach(traverse);
      }
    };

    dslData.dsl.nodes.forEach((node) => traverse(node as DSLNode));
    return nodes;
  }, [dslData]);

  const HiddenNodePreview: React.FC<{ dsl: DesignDSL | null }> = ({ dsl }) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useLayoutEffect(() => {
      const wrapper = wrapperRef.current;
      const content = contentRef.current;
      if (!wrapper || !content) return;

      const measure = () => {
        const { clientWidth: wrapperWidth, clientHeight: wrapperHeight } = wrapper;
        if (!wrapperWidth || !wrapperHeight) return;
        const rect = content.getBoundingClientRect();
        const contentWidth = rect.width || 1;
        const contentHeight = rect.height || 1;
        const nextScale = Math.min(wrapperWidth / contentWidth, wrapperHeight / contentHeight, 1);
        setScale(nextScale || 1);
      };

      measure();
      const resizeObserver = new ResizeObserver(() => measure());
      resizeObserver.observe(wrapper);
      return () => resizeObserver.disconnect();
    }, [dsl]);

    return (
      <div ref={wrapperRef} className='dsl-3d-inspect-modal__hidden-preview'>
        <div
          ref={contentRef}
          className='dsl-3d-inspect-modal__hidden-preview-inner'
          style={{ transform: `scale(0.25)`, transformOrigin: 'top left' }}>
          {dsl ? <DSLElement dslData={dsl} /> : null}
        </div>
      </div>
    );
  };

  // Initialize Scene
  useEffect(() => {
    if (open && !sceneRef.current) {
      // Small timeout to ensure container has dimensions

      setTimeout(() => {
        if (!containerRef.current) return;
        sceneRef.current = new DSL3DScene(containerRef.current, {
          onSelect: (node) => setSelectedNode(node),
          onHover: () => {
            // Optional: handle hover state in React if needed,
            // but currently we only use it for cursor style in the scene class
          },
        });
        // Initial update
        sceneRef.current.updateNodes(flatNodes);
      }, 200);
    }

    // Cleanup when modal closes (unmounts or open becomes false)
    // Actually, we want to keep the scene instance if possible, but since the modal unmounts the DOM,
    // we probably need to dispose it.
    // The user requirement says: "threejs 实例只有在第一次创建页面时创建" (Threejs instance is created only when the page is first created)
    // But this is a Modal. If the Modal is destroyed, the DOM is gone.
    // If the Modal uses `destroyOnClose={false}` (or `destroyOnHidden` which is set to true in the original code), then the DOM might be gone.
    // The original code has `destroyOnHidden`.
    // If we want to persist the scene, we need to remove `destroyOnHidden` or manage the DOM manually.
    // However, "第一次创建页面时创建" might mean "when the modal is first opened".
    // Let's assume we should dispose it when the modal is closed to avoid memory leaks,
    // BUT we should avoid re-creating it if the data changes while it's open.

    return () => {
      if (!open && sceneRef.current) {
        sceneRef.current.dispose();
        sceneRef.current = null;
      }
    };
  }, [open]); // Only depend on open.

  // Update Nodes when data changes
  useEffect(() => {
    if (sceneRef.current && open) {
      sceneRef.current.updateNodes(flatNodes);
    }
  }, [flatNodes, open]);

  const handleClose = () => {
    Modal.confirm({
      title: '确认关闭',
      content: '关闭 3D 结构预览前请确认。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => {
        if (sceneRef.current) {
          sceneRef.current.dispose();
          sceneRef.current = null;
        }
        onClose();
      },
    });
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={
        <div className='dsl-3d-inspect-modal__title'>
          <span>DSL 3D Structure Inspector</span>
          <Button size='small' danger onClick={handleClose}>
            关闭
          </Button>
        </div>
      }
      width='100vw'
      footer={null}
      centered={false}
      destroyOnHidden
      closable={false}
      maskClosable={false}
      keyboard={false}
      rootClassName='dsl-3d-inspect-modal'>
      <div className='dsl-3d-inspect-modal__layout'>
        <div className='dsl-3d-inspect-modal__viewport' data-testid='dsl-3d-modal-container'>
          <div ref={containerRef} className='dsl-3d-inspect-modal__canvas' />
          <div className='dsl-3d-inspect-modal__hidden-toggle'>
            <Switch
              checkedChildren='隐藏节点'
              unCheckedChildren='隐藏节点'
              checked={showHiddenPanel}
              onChange={(checked) => setShowHiddenPanel(checked)}
            />
          </div>
          {showHiddenPanel ? (
            <div className='dsl-3d-inspect-modal__hidden-panel'>
              {hiddenNodes.length === 0 ? (
                <div className='dsl-3d-inspect-modal__hidden-empty'>暂无隐藏节点</div>
              ) : (
                <div className='dsl-3d-inspect-modal__hidden-grid'>
                  {hiddenNodes.map((node) => {
                    const previewDSL = buildPreviewDSL(node, dslData as DesignDSL);
                    return (
                      <div key={node.id} className='dsl-3d-inspect-modal__hidden-item'>
                        <HiddenNodePreview dsl={previewDSL} />
                        <div className='dsl-3d-inspect-modal__hidden-actions'>
                          <div className='dsl-3d-inspect-modal__hidden-title'>{node.name || node.id}</div>
                          <Button
                            size='small'
                            type='link'
                            onClick={() => designDetectionActions.showDSLNodeById(node.id)}>
                            撤销隐藏
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : null}
        </div>

        <div className='dsl-3d-inspect-modal__sidebar'>
          <div className='dsl-3d-inspect-modal__sidebar-header'>
            <span>Selected Node Preview</span>
            {tmpDSLData?.dsl?.nodes?.[0]?.id ? (
              <Button
                size='small'
                onClick={() => {
                  if (tmpDSLData.dsl.nodes[0].hidden) {
                    designDetectionActions.showDSLNodeById(tmpDSLData.dsl.nodes[0].id);
                  } else {
                    designDetectionActions.hideDSLNodeById(tmpDSLData.dsl.nodes[0].id);
                  }
                }}>
                {tmpDSLData.dsl.nodes[0].hidden ? '显示节点' : '隐藏节点'}
              </Button>
            ) : null}
          </div>
          <div className='dsl-3d-inspect-modal__sidebar-body'>
            {tmpDSLData ? (
              <div className='dsl-3d-inspect-modal__preview'>
                <DSLElement dslData={tmpDSLData} />
              </div>
            ) : (
              <div className='dsl-3d-inspect-modal__empty'>Click on a wireframe box to view details</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DSL3DInspectModal;
