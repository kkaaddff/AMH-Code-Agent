import DSLElement from '@/components/DSLElement';
import { apiServices } from '@/services';
import { DesignData, DSLNode } from '@/types/dsl';
import { DoubleLeftOutlined, DoubleRightOutlined } from '@ant-design/icons';
import { App, Button, Modal } from 'antd';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useSnapshot } from 'valtio';
import { designDetectionActions, designDetectionStore } from '../../contexts/DesignDetectionContext';
import { editorPageStore } from '../../contexts/EditorPageContext';
import { DSL3DScene, DSLNodeInfo } from './DSL3DScene';
import { isNodeHidden } from '../../utils/nodeUtils';

import { DocumentReference } from '@/types/project';
import './style.css';

interface DSL3DInspectModalProps {
  open: boolean;
  onClose: () => void;
}

const buildPreviewDSL = (node: DSLNode, dslData: DesignData | null): DesignData | null => {
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

const HiddenNodePreview: React.FC<{ dsl: DesignData | null }> = ({ dsl }) => {
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
        {dsl ? <DSLElement dslData={dsl} isLeaf /> : null}
      </div>
    </div>
  );
};

const DSL3DInspectModal: React.FC<DSL3DInspectModalProps> = ({ open, onClose }) => {
  const { message, modal } = App.useApp();
  const containerRef = useRef<HTMLDivElement>(null);
  const { designData } = useSnapshot(designDetectionStore);
  const { currentPage, selectedDocument } = useSnapshot(editorPageStore);
  const sceneRef = useRef<DSL3DScene | null>(null);

  const [selectedNode, setSelectedNode] = useState<DSLNodeInfo | null>(null);
  const [showHiddenPanel, setShowHiddenPanel] = useState(false);
  const [saving, setSaving] = useState(false);

  const selectedDesignDocument = useMemo(() => {
    if (!currentPage || selectedDocument?.type !== 'design') {
      return null;
    }
    return currentPage.designDocuments.find((doc) => doc.id === selectedDocument.id) ?? null;
  }, [currentPage, selectedDocument]);

  const flatNodes = useMemo(() => {
    if (!designData) return [];

    const nodes: DSLNodeInfo[] = [];

    const traverse = (node: DSLNode, depth: number, parentX: number, parentY: number) => {
      if (!node) return;

      // 前置过滤：对于 hidden 或 mask 为 outline 的节点，直接跳过其本身及子节点
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

    if (designData && typeof designData === 'object' && 'dsl' in designData && (designData as DesignData).dsl?.nodes) {
      rootNodes = (designData as DesignData).dsl.nodes;
    }

    rootNodes.forEach((item) => traverse(item, 0, 0, 0));

    return nodes;
  }, [designData]);

  const tmpDSLData: DesignData | null = useMemo(() => {
    if (!selectedNode || !designData) return null;

    const targetNode = selectedNode.rawNode as DSLNode;

    return {
      ...designData,
      dsl: {
        ...designData.dsl,
        nodes: [targetNode],
      },
    };
  }, [selectedNode, designData]);

  const hiddenNodes = useMemo(() => {
    if (!designData?.dsl?.nodes?.length) return [];

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

    designData.dsl.nodes.forEach((node) => traverse(node as DSLNode));
    return nodes;
  }, [designData]);

  // Initialize Scene
  useEffect(() => {
    if (open && !sceneRef.current) {
      setTimeout(() => {
        if (!containerRef.current) return;
        sceneRef.current = new DSL3DScene(containerRef.current, {
          onSelect: (node) => setSelectedNode(node),
          onHover: () => {},
        });
        // Initial update
        sceneRef.current.updateNodes(flatNodes);
      }, 200);
    }

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

  const disposeScene = () => {
    if (sceneRef.current) {
      sceneRef.current.dispose();
      sceneRef.current = null;
    }
  };

  const refreshDesignDocument = async () => {
    if (!selectedDesignDocument) return;
    try {
      await designDetectionActions.fetchDesignDocumentDSL(selectedDesignDocument as DocumentReference, { force: true });
    } catch (error: any) {
      message.error(error?.message ?? '更新 DSL 数据失败');
    }
  };

  const finalizeClose = async () => {
    disposeScene();
    onClose();
    await refreshDesignDocument();
  };

  const handleSaveAndClose = async () => {
    if (saving) return;

    setSaving(true);
    try {
      await apiServices.project.updateDocument({
        id: selectedDesignDocument!.id,
        data: designData as DesignData,
      });
      message.success('DSL 已保存');
      await finalizeClose();
    } catch (error: any) {
      message.error(error?.message ?? '保存 DSL 失败');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseWithoutSave = async () => {
    await finalizeClose();
  };

  const handleDirectClose = () => {
    modal.confirm({
      title: '关闭 3D 结构预览',
      content: '是否在关闭前保存 DSL？',
      okText: '保存并关闭',
      cancelText: '直接关闭',
      centered: true,
      onOk: () => handleSaveAndClose(),
      onCancel: () => handleCloseWithoutSave(),
    });
  };

  return (
    <Modal
      open={open}
      onCancel={handleDirectClose}
      title={
        <div className='dsl-3d-inspect-modal__title'>
          <span>DSL 3D Structure Inspector</span>
          <div className='dsl-3d-inspect-modal__title-actions'>
            <Button size='small' type='primary' loading={saving} onClick={handleSaveAndClose}>
              保存并关闭
            </Button>
            <Button size='small' danger disabled={saving} onClick={handleDirectClose}>
              直接关闭
            </Button>
          </div>
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
            <Button
              icon={showHiddenPanel ? <DoubleRightOutlined /> : <DoubleLeftOutlined />}
              onClick={() => setShowHiddenPanel(!showHiddenPanel)}>
              隐藏节点 ( {hiddenNodes.length} )
            </Button>
          </div>
          {showHiddenPanel ? (
            <div className='dsl-3d-inspect-modal__hidden-panel'>
              {hiddenNodes.length === 0 ? (
                <div className='dsl-3d-inspect-modal__hidden-empty'>暂无隐藏节点</div>
              ) : (
                <div className='dsl-3d-inspect-modal__hidden-grid'>
                  {hiddenNodes.map((node) => {
                    const previewDSL = buildPreviewDSL(node, designData as DesignData);
                    return (
                      <div key={node.id} className='dsl-3d-inspect-modal__hidden-item'>
                        <HiddenNodePreview dsl={previewDSL} />
                        <div className='dsl-3d-inspect-modal__hidden-actions'>
                          <div className='dsl-3d-inspect-modal__hidden-title'>{node.name || node.id}</div>
                          <Button
                            size='small'
                            type='link'
                            onClick={() => designDetectionActions.toggleDSLNodeById(node.id)}>
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
          <div className='dsl-3d-inspect-modal__sidebar-section'>
            <div className='dsl-3d-inspect-modal__sidebar-header'>
              <span>DSL 全局预览</span>
            </div>
            <div className='dsl-3d-inspect-modal__sidebar-body'>
              {designData ? (
                <div className='dsl-3d-inspect-modal__preview-wrapper1'>
                  <div className='dsl-3d-inspect-modal__preview1' style={{ transform: 'scale(0.5)' }}>
                    <DSLElement dslData={designData as DesignData} />
                  </div>
                </div>
              ) : (
                <div className='dsl-3d-inspect-modal__empty'>暂无 DSL 数据</div>
              )}
            </div>
          </div>

          <div className='dsl-3d-inspect-modal__sidebar-section'>
            <div className='dsl-3d-inspect-modal__sidebar-header'>
              <span>当前节点预览</span>
              <span>按 Esc 键取消选择</span>
              {tmpDSLData?.dsl?.nodes?.[0]?.id && (
                <Button
                  size='small'
                  onClick={() => {
                    navigator.clipboard.writeText(tmpDSLData.dsl.nodes[0].id);
                    message.success('已复制节点 ID');
                  }}
                  title={tmpDSLData.dsl.nodes[0].id}>
                  {tmpDSLData.dsl.nodes[0].id.length > 16
                    ? `${tmpDSLData.dsl.nodes[0].id.slice(0, 8)}...${tmpDSLData.dsl.nodes[0].id.slice(-4)}`
                    : tmpDSLData.dsl.nodes[0].id}
                </Button>
              )}
              {tmpDSLData?.dsl?.nodes?.[0]?.id ? (
                <Button
                  size='small'
                  type='primary'
                  onClick={() => {
                    designDetectionActions.toggleDSLNodeById(tmpDSLData.dsl.nodes[0].id);
                  }}>
                  显示/隐藏
                </Button>
              ) : null}
            </div>
            <div className='dsl-3d-inspect-modal__sidebar-body'>
              {tmpDSLData ? (
                <div className='dsl-3d-inspect-modal__preview-wrapper'>
                  <div className='dsl-3d-inspect-modal__preview'>
                    <DSLElement dslData={tmpDSLData} isLeaf />
                  </div>
                </div>
              ) : (
                <div className='dsl-3d-inspect-modal__empty'>点击左侧线框查看节点详情</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DSL3DInspectModal;
