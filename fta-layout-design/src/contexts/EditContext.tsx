import React, { ReactNode, useEffect } from 'react';
import { proxy } from 'valtio';
import { useSnapshot } from 'valtio/react';
import { LayoutTreeNode } from '../types/layout';

export type EditMode = 'none' | 'resize' | 'move' | 'draw';

export interface NewBox {
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string;
}

interface EditStoreState {
  isEditMode: boolean;
  currentEditMode: EditMode;
  editingNodeId: string | null;
  isDrawingBox: boolean;
  drawingBox: NewBox | null;
  showAllBoxes: boolean;
}

interface EditStore extends EditStoreState {
  callbacks: {
    onNodeLayoutChange?: (nodeId: string, layout: { x?: number; y?: number; width?: number; height?: number }) => void;
    onNodeAdd?: (parentId: string | null, node: LayoutTreeNode) => void;
  };
}

const createDefaultStore = (): EditStore => ({
  isEditMode: false,
  currentEditMode: 'none',
  editingNodeId: null,
  isDrawingBox: false,
  drawingBox: null,
  showAllBoxes: false,
  callbacks: {},
});

const editStore = proxy<EditStore>(createDefaultStore());

const setIsEditMode = (value: boolean) => {
  editStore.isEditMode = value;
};

const setCurrentEditMode = (mode: EditMode) => {
  editStore.currentEditMode = mode;
};

const setEditingNodeId = (nodeId: string | null) => {
  editStore.editingNodeId = nodeId;
};

const setIsDrawingBox = (value: boolean) => {
  editStore.isDrawingBox = value;
};

const setDrawingBox = (box: NewBox | null) => {
  editStore.drawingBox = box;
};

const setShowAllBoxes = (value: boolean) => {
  editStore.showAllBoxes = value;
};

const updateNodeLayout = (nodeId: string, layout: { x?: number; y?: number; width?: number; height?: number }) => {
  editStore.callbacks.onNodeLayoutChange?.(nodeId, layout);
};

const addNewNode = (parentId: string | null, box: NewBox) => {
  const newNode: LayoutTreeNode = {
    nodeId: `node_${Date.now()}`,
    componentName: 'Container',
    layout: {
      width: box.width,
      height: box.height,
      position: 'absolute',
    },
    children: [],
  };

  editStore.callbacks.onNodeAdd?.(parentId, newNode);
};

export const useEdit = () => {
  const { callbacks: _callbacks, ...state } = useSnapshot(editStore);
  return {
    ...state,
    setIsEditMode,
    setCurrentEditMode,
    setEditingNodeId,
    setIsDrawingBox,
    setDrawingBox,
    setShowAllBoxes,
    updateNodeLayout,
    addNewNode,
  };
};

interface EditProviderProps {
  children: ReactNode;
  onNodeLayoutChange?: (nodeId: string, layout: { x?: number; y?: number; width?: number; height?: number }) => void;
  onNodeAdd?: (parentId: string | null, node: LayoutTreeNode) => void;
}

export const EditProvider: React.FC<EditProviderProps> = ({ children, onNodeLayoutChange, onNodeAdd }) => {
  useEffect(() => {
    editStore.callbacks.onNodeLayoutChange = onNodeLayoutChange;
    return () => {
      if (editStore.callbacks.onNodeLayoutChange === onNodeLayoutChange) {
        editStore.callbacks.onNodeLayoutChange = undefined;
      }
    };
  }, [onNodeLayoutChange]);

  useEffect(() => {
    editStore.callbacks.onNodeAdd = onNodeAdd;
    return () => {
      if (editStore.callbacks.onNodeAdd === onNodeAdd) {
        editStore.callbacks.onNodeAdd = undefined;
      }
    };
  }, [onNodeAdd]);

  return <>{children}</>;
};
