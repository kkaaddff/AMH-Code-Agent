import { proxy } from 'valtio';

export interface SelectionBox {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
}

export interface DetectionCanvasState {
  isShiftPressed: boolean;
  isSpacePressed: boolean;
  /** 是否正在选择 */
  isSelecting: boolean;
  /** 是否正在平移 */
  isPanning: boolean;
  /** 平移偏移量 */
  panOffset: { x: number; y: number };
  /** 选择框 */
  selectionBox: SelectionBox | null;
}

export const detectionCanvasState = proxy<DetectionCanvasState>({
  isShiftPressed: false,
  isSpacePressed: false,
  isSelecting: false,
  isPanning: false,
  panOffset: { x: 0, y: 0 },
  selectionBox: null,
});

export const detectionCanvasActions = {
  setShiftPressed(next: boolean) {
    detectionCanvasState.isShiftPressed = next;
  },
  setSpacePressed(next: boolean) {
    detectionCanvasState.isSpacePressed = next;
  },
  startSelection(box: SelectionBox) {
    detectionCanvasState.isSelecting = true;
    detectionCanvasState.selectionBox = box;
  },
  updateSelection(box: SelectionBox | null) {
    detectionCanvasState.selectionBox = box;
  },
  finishSelection() {
    detectionCanvasState.isSelecting = false;
  },
  startPanning() {
    detectionCanvasState.isPanning = true;
  },
  stopPanning() {
    detectionCanvasState.isPanning = false;
  },
  setPanOffset(offset: { x: number; y: number }) {
    detectionCanvasState.panOffset = offset;
  },
  resetSelection() {
    detectionCanvasState.selectionBox = null;
    detectionCanvasState.isSelecting = false;
  },
  reset() {
    detectionCanvasState.isShiftPressed = false;
    detectionCanvasState.isSpacePressed = false;
    detectionCanvasState.isSelecting = false;
    detectionCanvasState.isPanning = false;
    detectionCanvasState.panOffset = { x: 0, y: 0 };
    detectionCanvasState.selectionBox = null;
  },
};
