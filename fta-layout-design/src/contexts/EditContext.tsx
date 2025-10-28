import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { LayoutTreeNode } from "../types/layout";

// 编辑模式类型
export type EditMode = "none" | "resize" | "move" | "draw";

// 新建框的类型
export interface NewBox {
  x: number;
  y: number;
  width: number;
  height: number;
  parentId?: string;
}

// 编辑上下文接口
interface EditContextValue {
  // 编辑模式状态
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;

  // 当前编辑模式
  currentEditMode: EditMode;
  setCurrentEditMode: (mode: EditMode) => void;

  // 正在编辑的节点
  editingNodeId: string | null;
  setEditingNodeId: (nodeId: string | null) => void;

  // 新建框状态
  isDrawingBox: boolean;
  setIsDrawingBox: (value: boolean) => void;
  drawingBox: NewBox | null;
  setDrawingBox: (box: NewBox | null) => void;

  // 显示所有框
  showAllBoxes: boolean;
  setShowAllBoxes: (value: boolean) => void;

  // 更新节点位置和大小
  updateNodeLayout: (
    nodeId: string,
    layout: {
      x?: number;
      y?: number;
      width?: number;
      height?: number;
    }
  ) => void;

  // 添加新节点
  addNewNode: (parentId: string | null, box: NewBox) => void;

  // 节点布局变化监听器
  onNodeLayoutChange?: (nodeId: string, layout: any) => void;
  onNodeAdd?: (parentId: string | null, node: LayoutTreeNode) => void;
}

const EditContext = createContext<EditContextValue | undefined>(undefined);

export const useEdit = () => {
  const context = useContext(EditContext);
  if (!context) {
    throw new Error("useEdit must be used within EditProvider");
  }
  return context;
};

interface EditProviderProps {
  children: ReactNode;
  onNodeLayoutChange?: (nodeId: string, layout: any) => void;
  onNodeAdd?: (parentId: string | null, node: LayoutTreeNode) => void;
}

export const EditProvider: React.FC<EditProviderProps> = ({
  children,
  onNodeLayoutChange,
  onNodeAdd,
}) => {
  // 编辑模式状态
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentEditMode, setCurrentEditMode] = useState<EditMode>("none");
  const [editingNodeId, setEditingNodeId] = useState<string | null>(null);

  // 新建框状态
  const [isDrawingBox, setIsDrawingBox] = useState(false);
  const [drawingBox, setDrawingBox] = useState<NewBox | null>(null);

  // 显示所有框状态
  const [showAllBoxes, setShowAllBoxes] = useState(false);

  // 更新节点布局
  const updateNodeLayout = useCallback(
    (
      nodeId: string,
      layout: {
        x?: number;
        y?: number;
        width?: number;
        height?: number;
      }
    ) => {
      // 触发外部的布局变化监听器
      onNodeLayoutChange?.(nodeId, layout);
    },
    [onNodeLayoutChange]
  );

  // 添加新节点
  const addNewNode = useCallback(
    (parentId: string | null, box: NewBox) => {
      // 创建新的节点
      const newNode: LayoutTreeNode = {
        nodeId: `node_${Date.now()}`,
        componentName: "Container",
        layout: {
          width: box.width,
          height: box.height,
          position: "absolute",
        },
        children: [],
      };

      // 触发外部的节点添加监听器
      onNodeAdd?.(parentId, newNode);
    },
    [onNodeAdd]
  );

  const value: EditContextValue = {
    isEditMode,
    setIsEditMode,
    currentEditMode,
    setCurrentEditMode,
    editingNodeId,
    setEditingNodeId,
    isDrawingBox,
    setIsDrawingBox,
    drawingBox,
    setDrawingBox,
    showAllBoxes,
    setShowAllBoxes,
    updateNodeLayout,
    addNewNode,
    onNodeLayoutChange,
    onNodeAdd,
  };

  return <EditContext.Provider value={value}>{children}</EditContext.Provider>;
};
