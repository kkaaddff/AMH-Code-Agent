import React, { useRef, useEffect, useCallback, useState } from "react";
import { DSLData } from "../types/dsl";
import { useEdit, NewBox } from "../contexts/EditContext";
import { useSelection } from "../contexts/SelectionContext";

interface EditableCanvasLayerProps {
  dslData: DSLData;
  scale?: number;
  width: number;
  height: number;
}

interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  nodeId: string;
  depth: number;
}

// 编辑手柄位置类型
type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

const EditableCanvasLayer: React.FC<EditableCanvasLayerProps> = ({
  dslData,
  scale = 1,
  width,
  height,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    isEditMode,
    currentEditMode,
    setCurrentEditMode,
    editingNodeId,
    setEditingNodeId,
    isDrawingBox,
    setIsDrawingBox,
    drawingBox,
    setDrawingBox,
    showAllBoxes,
    updateNodeLayout,
    addNewNode,
  } = useEdit();
  
  const { setSelectedNodeId } = useSelection();

  const [nodeBounds, setNodeBounds] = useState<NodeBounds[]>([]);
  const [dragState, setDragState] = useState<{
    isDragging: boolean;
    startX: number;
    startY: number;
    originalBounds?: NodeBounds;
    handle?: ResizeHandle;
  }>({ isDragging: false, startX: 0, startY: 0 });

  const [drawStartPoint, setDrawStartPoint] = useState<{
    x: number;
    y: number;
  } | null>(null);

  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);

  // 计算所有节点的边界框
  const calculateNodeBounds = useCallback(() => {
    const bounds: NodeBounds[] = [];

    const traverseDSLTree = (
      node: any,
      parentX: number = 0,
      parentY: number = 0,
      depth: number = 0
    ) => {
      if (!node) return;

      const { layoutStyle } = node;
      if (layoutStyle) {
        const x = parentX + (layoutStyle.relativeX || 0);
        const y = parentY + (layoutStyle.relativeY || 0);
        const nodeWidth = layoutStyle.width || 0;
        const nodeHeight = layoutStyle.height || 0;

        if (nodeWidth > 0 && nodeHeight > 0) {
          bounds.push({
            x,
            y,
            width: nodeWidth,
            height: nodeHeight,
            nodeId: node.id,
            depth,
          });
        }

        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) => {
            traverseDSLTree(child, x, y, depth + 1);
          });
        }
      }
    };

    if (dslData.dsl.nodes && dslData.dsl.nodes.length > 0) {
      traverseDSLTree(dslData.dsl.nodes[0]);
    }

    setNodeBounds(bounds);
  }, [dslData]);

  // 检查两个矩形是否相交
  const checkIntersection = (
    rect1: { x: number; y: number; width: number; height: number },
    rect2: { x: number; y: number; width: number; height: number }
  ) => {
    return !(
      rect1.x + rect1.width <= rect2.x ||
      rect2.x + rect2.width <= rect1.x ||
      rect1.y + rect1.height <= rect2.y ||
      rect2.y + rect2.height <= rect1.y
    );
  };

  // 检查一个矩形是否完全包含另一个矩形
  const checkContainment = (
    container: { x: number; y: number; width: number; height: number },
    contained: { x: number; y: number; width: number; height: number }
  ) => {
    return (
      container.x <= contained.x &&
      container.y <= contained.y &&
      container.x + container.width >= contained.x + contained.width &&
      container.y + container.height >= contained.y + contained.height
    );
  };

  // 调整绘制框以避免交叉
  const adjustDrawingBox = (
    startX: number,
    startY: number,
    endX: number,
    endY: number
  ): NewBox => {
    let minX = Math.min(startX, endX);
    let minY = Math.min(startY, endY);
    let maxX = Math.max(startX, endX);
    let maxY = Math.max(startY, endY);

    const newBox = {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY,
    };

    // 检查与现有节点的交叉
    for (const node of nodeBounds) {
      if (checkIntersection(node, newBox)) {
        // 如果新框完全包含现有节点，允许
        if (checkContainment(newBox, node)) {
          continue;
        }
        // 如果现有节点完全包含新框，允许
        if (checkContainment(node, newBox)) {
          continue;
        }

        // 否则，调整新框的大小以避免交叉
        // 根据起始点位置决定调整方向
        if (startX < endX) {
          // 向右拖动，限制右边界
          maxX = Math.min(maxX, node.x);
        } else {
          // 向左拖动，限制左边界
          minX = Math.max(minX, node.x + node.width);
        }

        if (startY < endY) {
          // 向下拖动，限制下边界
          maxY = Math.min(maxY, node.y);
        } else {
          // 向上拖动，限制上边界
          minY = Math.max(minY, node.y + node.height);
        }
      }
    }

    return {
      x: minX,
      y: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
    };
  };

  // 获取鼠标位置对应的调整手柄
  const getResizeHandle = (
    x: number,
    y: number,
    bounds: NodeBounds
  ): ResizeHandle | null => {
    const handleSize = 8;
    // 计算边框的实际位置和尺寸（与绘制时保持一致）
    const selectedOffset = 1; // 2px lineWidth / 2
    const borderX = bounds.x + selectedOffset;
    const borderY = bounds.y + selectedOffset;
    const borderWidth = bounds.width - 2;
    const borderHeight = bounds.height - 2;
    
    const handles: { handle: ResizeHandle; x: number; y: number }[] = [
      { handle: "nw", x: borderX, y: borderY },
      { handle: "n", x: borderX + borderWidth / 2, y: borderY },
      { handle: "ne", x: borderX + borderWidth, y: borderY },
      {
        handle: "e",
        x: borderX + borderWidth,
        y: borderY + borderHeight / 2,
      },
      { handle: "se", x: borderX + borderWidth, y: borderY + borderHeight },
      {
        handle: "s",
        x: borderX + borderWidth / 2,
        y: borderY + borderHeight,
      },
      { handle: "sw", x: borderX, y: borderY + borderHeight },
      { handle: "w", x: borderX, y: borderY + borderHeight / 2 },
    ];

    for (const { handle, x: hx, y: hy } of handles) {
      if (Math.abs(x - hx) <= handleSize && Math.abs(y - hy) <= handleSize) {
        return handle;
      }
    }

    return null;
  };

  // 绘制编辑界面
  const drawEditInterface = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 在编辑模式下显示所有节点边框（便于选择）或者显示所有框
    if (isEditMode || showAllBoxes) {
      const maxDepth = Math.max(...nodeBounds.map((n) => n.depth), 1);

      nodeBounds.forEach((node) => {
        const isCurrentEditing = editingNodeId === node.nodeId;
        const isHovered = hoveredNodeId === node.nodeId;
        
        if (isCurrentEditing) {
          // 当前编辑的节点用不同样式，在后面单独绘制
          return;
        }

        const opacity = showAllBoxes ? 0.5 + (node.depth * 0.5) / maxDepth : (isHovered ? 0.6 : 0.3);
        const lineWidth = isHovered ? 2 : 1;
        const offset = lineWidth / 2;
        
        ctx.save();
        ctx.strokeStyle = `rgba(24, 144, 255, ${opacity})`;
        ctx.lineWidth = lineWidth;
        ctx.setLineDash(isHovered ? [] : [2, 2]);
        ctx.strokeRect(node.x + offset, node.y + offset, node.width - lineWidth, node.height - lineWidth);
        
        if (showAllBoxes || isHovered) {
          ctx.fillStyle = `rgba(24, 144, 255, ${opacity * 0.2})`;
          ctx.fillRect(node.x, node.y, node.width, node.height);
        }
        ctx.restore();
      });
    }

    // 绘制选中节点的编辑界面
    if (isEditMode && editingNodeId) {
      const node = nodeBounds.find((n) => n.nodeId === editingNodeId);
      if (node) {
        ctx.save();

        // 绘制选中框 - 考虑边框线宽度的像素偏移
        ctx.strokeStyle = "rgb(24, 144, 255)";
        ctx.lineWidth = 2;
        const selectedOffset = 2 / 2; // lineWidth / 2
        ctx.strokeRect(node.x + selectedOffset, node.y + selectedOffset, node.width - 2, node.height - 2);

        // 绘制调整手柄 - 基于边框的实际位置
        const handleSize = 8;
        ctx.fillStyle = "rgb(24, 144, 255)";
        // 计算边框的实际位置和尺寸
        const borderX = node.x + selectedOffset;
        const borderY = node.y + selectedOffset;
        const borderWidth = node.width - 2;
        const borderHeight = node.height - 2;
        
        const handles = [
          { x: borderX, y: borderY }, // nw
          { x: borderX + borderWidth / 2, y: borderY }, // n
          { x: borderX + borderWidth, y: borderY }, // ne
          { x: borderX + borderWidth, y: borderY + borderHeight / 2 }, // e
          { x: borderX + borderWidth, y: borderY + borderHeight }, // se
          { x: borderX + borderWidth / 2, y: borderY + borderHeight }, // s
          { x: borderX, y: borderY + borderHeight }, // sw
          { x: borderX, y: borderY + borderHeight / 2 }, // w
        ];

        handles.forEach(({ x, y }) => {
          ctx.fillRect(
            x - handleSize / 2,
            y - handleSize / 2,
            handleSize,
            handleSize
          );
        });

        // 显示尺寸信息 - 基于边框位置
        ctx.fillStyle = "rgb(24, 144, 255)";
        ctx.font = "12px Arial";
        const sizeText = `${Math.round(borderWidth)} × ${Math.round(borderHeight)}`;
        ctx.fillText(sizeText, borderX, borderY - 5);

        ctx.restore();
      }
    }

    // 绘制正在绘制的新框
    if (isDrawingBox && drawingBox) {
      ctx.save();
      ctx.strokeStyle = "rgb(82, 196, 26)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      const drawOffset = 2 / 2; // lineWidth / 2
      ctx.strokeRect(
        drawingBox.x + drawOffset,
        drawingBox.y + drawOffset,
        drawingBox.width - 2,
        drawingBox.height - 2
      );

      // 显示尺寸
      if (drawingBox.width > 0 && drawingBox.height > 0) {
        ctx.fillStyle = "rgb(82, 196, 26)";
        ctx.font = "12px Arial";
        const sizeText = `${Math.round(drawingBox.width)} × ${Math.round(
          drawingBox.height
        )}`;
        ctx.fillText(sizeText, drawingBox.x, drawingBox.y - 5);
      }

      ctx.restore();
    }
  }, [
    showAllBoxes,
    isEditMode,
    editingNodeId,
    hoveredNodeId,
    isDrawingBox,
    drawingBox,
    nodeBounds,
  ]);

  // 处理鼠标按下
  const handleMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isEditMode) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      // 检查是否在新建框模式
      if (currentEditMode === "draw") {
        setIsDrawingBox(true);
        setDrawStartPoint({ x, y });
        setDrawingBox({ x, y, width: 0, height: 0 });
        return;
      }

      // 首先查找点击的节点（用于节点选择）
      let clickedNode: NodeBounds | null = null;
      let minArea = Infinity;

      for (const bounds of nodeBounds) {
        if (
          x >= bounds.x &&
          x <= bounds.x + bounds.width &&
          y >= bounds.y &&
          y <= bounds.y + bounds.height
        ) {
          const area = bounds.width * bounds.height;
          if (area < minArea) {
            minArea = area;
            clickedNode = bounds;
          }
        }
      }

      // 检查是否点击了当前编辑节点的编辑手柄
      if (editingNodeId && clickedNode && clickedNode.nodeId === editingNodeId) {
        const handle = getResizeHandle(x, y, clickedNode);
        if (handle) {
          setCurrentEditMode("resize");
          setDragState({
            isDragging: true,
            startX: x,
            startY: y,
            originalBounds: clickedNode,
            handle,
          });
          return;
        }

        // 检查是否点击在当前编辑节点内部（移动模式）
        if (
          x >= clickedNode.x &&
          x <= clickedNode.x + clickedNode.width &&
          y >= clickedNode.y &&
          y <= clickedNode.y + clickedNode.height
        ) {
          setCurrentEditMode("move");
          setDragState({
            isDragging: true,
            startX: x,
            startY: y,
            originalBounds: clickedNode,
          });
          return;
        }
      }

      // 如果点击了其他节点，切换编辑目标
      if (clickedNode) {
        setEditingNodeId(clickedNode.nodeId);
        setSelectedNodeId(clickedNode.nodeId); // 同步更新选择状态
      } else {
        // 点击空白区域，取消选择
        setEditingNodeId(null);
        setSelectedNodeId(null); // 同步更新选择状态
      }
    },
    [isEditMode, currentEditMode, editingNodeId, scale, nodeBounds, setEditingNodeId, setSelectedNodeId]
  );

  // 处理鼠标移动
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!isEditMode) return;

      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale;
      const y = (e.clientY - rect.top) / scale;

      // 处理新建框绘制
      if (isDrawingBox && drawStartPoint) {
        const adjustedBox = adjustDrawingBox(
          drawStartPoint.x,
          drawStartPoint.y,
          x,
          y
        );
        setDrawingBox(adjustedBox);
        drawEditInterface();
        return;
      }

      // 处理节点拖拽
      if (dragState.isDragging && dragState.originalBounds) {
        const dx = x - dragState.startX;
        const dy = y - dragState.startY;
        const original = dragState.originalBounds;

        if (currentEditMode === "move") {
          // 移动模式
          updateNodeLayout(original.nodeId, {
            x: original.x + dx,
            y: original.y + dy,
          });
        } else if (currentEditMode === "resize" && dragState.handle) {
          // 调整大小模式
          let newX = original.x;
          let newY = original.y;
          let newWidth = original.width;
          let newHeight = original.height;

          switch (dragState.handle) {
            case "nw":
              newX = original.x + dx;
              newY = original.y + dy;
              newWidth = original.width - dx;
              newHeight = original.height - dy;
              break;
            case "n":
              newY = original.y + dy;
              newHeight = original.height - dy;
              break;
            case "ne":
              newY = original.y + dy;
              newWidth = original.width + dx;
              newHeight = original.height - dy;
              break;
            case "e":
              newWidth = original.width + dx;
              break;
            case "se":
              newWidth = original.width + dx;
              newHeight = original.height + dy;
              break;
            case "s":
              newHeight = original.height + dy;
              break;
            case "sw":
              newX = original.x + dx;
              newWidth = original.width - dx;
              newHeight = original.height + dy;
              break;
            case "w":
              newX = original.x + dx;
              newWidth = original.width - dx;
              break;
          }

          // 确保最小尺寸
          if (newWidth < 20) newWidth = 20;
          if (newHeight < 20) newHeight = 20;

          updateNodeLayout(original.nodeId, {
            x: newX,
            y: newY,
            width: newWidth,
            height: newHeight,
          });
        }
      }

      // 更新悬停状态和鼠标样式
      if (!dragState.isDragging) {
        // 查找悬停的节点
        let hoveredNode: NodeBounds | null = null;
        let minArea = Infinity;

        for (const bounds of nodeBounds) {
          if (
            x >= bounds.x &&
            x <= bounds.x + bounds.width &&
            y >= bounds.y &&
            y <= bounds.y + bounds.height
          ) {
            const area = bounds.width * bounds.height;
            if (area < minArea) {
              minArea = area;
              hoveredNode = bounds;
            }
          }
        }

        // 更新悬停状态
        const newHoveredId = hoveredNode?.nodeId || null;
        if (newHoveredId !== hoveredNodeId) {
          setHoveredNodeId(newHoveredId);
        }

        // 设置鼠标样式
        if (editingNodeId && hoveredNode && hoveredNode.nodeId === editingNodeId) {
          const handle = getResizeHandle(x, y, hoveredNode);
          if (handle) {
            const cursorMap: Record<ResizeHandle, string> = {
              nw: "nw-resize",
              n: "n-resize",
              ne: "ne-resize",
              e: "e-resize",
              se: "se-resize",
              s: "s-resize",
              sw: "sw-resize",
              w: "w-resize",
            };
            canvas.style.cursor = cursorMap[handle];
          } else {
            canvas.style.cursor = "move";
          }
        } else if (hoveredNode) {
          canvas.style.cursor = "pointer";
        } else if (currentEditMode === "draw") {
          canvas.style.cursor = "crosshair";
        } else {
          canvas.style.cursor = "default";
        }
      }
    },
    [
      isEditMode,
      isDrawingBox,
      drawStartPoint,
      dragState,
      currentEditMode,
      editingNodeId,
      hoveredNodeId,
      scale,
      nodeBounds,
      updateNodeLayout,
      drawEditInterface,
    ]
  );

  // 处理鼠标释放
  const handleMouseUp = useCallback(() => {
    if (
      isDrawingBox &&
      drawingBox &&
      drawingBox.width > 10 &&
      drawingBox.height > 10
    ) {
      // 找到父节点
      let parentId: string | null = null;
      for (const node of nodeBounds) {
        if (checkContainment(node, drawingBox)) {
          parentId = node.nodeId;
          break;
        }
      }

      // 添加新节点
      addNewNode(parentId, drawingBox);
    }

    // 重置状态
    setIsDrawingBox(false);
    setDrawStartPoint(null);
    setDrawingBox(null);
    setDragState({ isDragging: false, startX: 0, startY: 0 });
    setCurrentEditMode("none");
  }, [isDrawingBox, drawingBox, nodeBounds, addNewNode]);

  // 初始化和更新
  useEffect(() => {
    calculateNodeBounds();
  }, [calculateNodeBounds]);

  useEffect(() => {
    drawEditInterface();
  }, [drawEditInterface]);

  // 设置画布尺寸
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    canvas.width = width;
    canvas.height = height;
    drawEditInterface();
  }, [width, height, drawEditInterface]);

  // 只在编辑模式下渲染
  if (!isEditMode && !showAllBoxes) {
    return null;
  }

  return (
    <canvas
      ref={canvasRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        zIndex: isEditMode ? 20 : 15, // 编辑层在交互层之上
        pointerEvents: isEditMode || showAllBoxes ? "auto" : "none",
      }}
    />
  );
};

export default EditableCanvasLayer;
