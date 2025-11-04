import { proxy } from 'valtio';
import { useSnapshot } from 'valtio/react';

interface SelectionStoreState {
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
}

const selectionStore = proxy<SelectionStoreState>({
  selectedNodeId: null,
  hoveredNodeId: null,
});

const setSelectedNodeId = (nodeId: string | null) => {
  selectionStore.selectedNodeId = nodeId;
};

const setHoveredNodeId = (nodeId: string | null) => {
  selectionStore.hoveredNodeId = nodeId;
};

export const useSelection = () => {
  const state = useSnapshot(selectionStore);
  return {
    ...state,
    setSelectedNodeId,
    setHoveredNodeId,
  };
};
