import React, { useRef, useEffect, useCallback } from "react";
import { DSLData } from "../types/dsl";
import { LayoutTreeNode } from "../types/layout";
import { useSelection } from "../contexts/SelectionContext";
import { findDSLNodeById } from "../utils/nodeMapping";

interface CanvasInteractionLayerProps {
  dslData: DSLData;
  layoutData: LayoutTreeNode;
  scale?: number;
  width: number;
  height: number;
  onSelect?: (nodeId: string | null) => void;
  onHover?: (nodeId: string | null) => void;
}

interface NodeBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  nodeId: string;
  layoutNodeId: string;
}

const CanvasInteractionLayer: React.FC<CanvasInteractionLayerProps> = ({
  dslData,
  layoutData,
  scale = 1,
  width,
  height,
  onSelect,
  onHover,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { setSelectedNodeId, setHoveredNodeId, selectedNodeId, hoveredNodeId } =
    useSelection();
  const nodeBoundsRef = useRef<NodeBounds[]>([]);

  // 计算所有节点的边界框
  const calculateNodeBounds = useCallback(() => {
    const bounds: NodeBounds[] = [];

    // 递归遍历 DSL 节点树来获取准确的位置信息
    const traverseDSLTree = (
      node: any,
      parentX: number = 0,
      parentY: number = 0
    ) => {
      if (!node) return;

      const { layoutStyle } = node;
      if (layoutStyle) {
        const x = parentX + (layoutStyle.relativeX || 0);
        const y = parentY + (layoutStyle.relativeY || 0);
        const nodeWidth = layoutStyle.width || 0;
        const nodeHeight = layoutStyle.height || 0;

        // 只有有效尺寸的节点才添加到交互区域
        if (nodeWidth > 0 && nodeHeight > 0) {
          bounds.push({
            x,
            y,
            width: nodeWidth,
            height: nodeHeight,
            nodeId: node.id,
            layoutNodeId: node.id, // 简化映射，直接使用 DSL nodeId
          });
        }

        // 递归处理子节点，传递累积的位置
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) => {
            traverseDSLTree(child, x, y);
          });
        }
      }
    };

    // 从 DSL 根节点开始遍历
    if (dslData.dsl.nodes && dslData.dsl.nodes.length > 0) {
      traverseDSLTree(dslData.dsl.nodes[0]);
    }

    nodeBoundsRef.current = bounds;
  }, [dslData]);

  // 绘制交互区域
  const drawInteractionAreas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // 清空画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 绘制所有节点的交互区域
    nodeBoundsRef.current.forEach(
      ({ x, y, width: nodeWidth, height: nodeHeight, nodeId }) => {
        const isSelected = selectedNodeId === nodeId;
        const isHovered = hoveredNodeId === nodeId;

        if (isSelected || isHovered) {
          ctx.save();

          if (isSelected) {
            // 选中状态：蓝色实线边框
            ctx.strokeStyle = "rgb(24, 144, 255)";
            ctx.lineWidth = 2;
            ctx.setLineDash([]);

            // 添加选中背景色
            ctx.fillStyle = "rgba(24, 144, 255, 0.1)";
            ctx.fillRect(x, y, nodeWidth, nodeHeight);
          } else if (isHovered) {
            // 悬停状态：蓝色虚线边框
            ctx.strokeStyle = "rgba(24, 144, 255, 0.6)";
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
          }

          // 绘制边框 - 考虑边框线宽度的像素偏移
          const lineWidth = 2;
          const offset = lineWidth / 2;
          ctx.strokeRect(x + offset, y + offset, nodeWidth - lineWidth, nodeHeight - lineWidth);

          // 绘制节点信息标签
          if (isSelected || isHovered) {
            // 尝试从 DSL 节点获取名称，如果没有则使用 nodeId
            const dslNode = findDSLNodeById(dslData, nodeId);
            const label = dslNode?.name || nodeId.substring(0, 8) + "...";

            ctx.fillStyle = isSelected ? "rgb(24, 144, 255)" : "rgba(24, 144, 255, 0.6)";
            ctx.font = "12px Arial";
            const textMetrics = ctx.measureText(label);
            const labelWidth = textMetrics.width + 8;
            const labelHeight = 20;

            // 确保标签不会超出画布边界
            const labelX = Math.min(x, width - labelWidth);
            const labelY = Math.max(y, labelHeight);

            // 标签背景
            ctx.fillRect(labelX, labelY - labelHeight, labelWidth, labelHeight);

            // 标签文字
            ctx.fillStyle = "rgb(255, 255, 255)";
            ctx.fillText(label, labelX + 4, labelY - 6);
          }

          ctx.restore();
        }
      }
    );
  }, [selectedNodeId, hoveredNodeId, layoutData]);

  // 处理鼠标点击
  const handleCanvasClick = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / scale;
      const y = (event.clientY - rect.top) / scale;

      // 查找点击的节点（从最小的节点开始，确保选中最具体的节点）
      let clickedNode: NodeBounds | null = null;
      let minArea = Infinity;

      for (const bounds of nodeBoundsRef.current) {
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

      if (clickedNode) {
        onSelect?.(clickedNode.nodeId);
        setSelectedNodeId(clickedNode.nodeId);
      } else {
        onSelect?.(null);
        setSelectedNodeId(null);
      }
    },
    [scale, onSelect, setSelectedNodeId]
  );

  // 处理鼠标移动
  const handleCanvasMouseMove = useCallback(
    (event: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = (event.clientX - rect.left) / scale;
      const y = (event.clientY - rect.top) / scale;

      // 查找悬停的节点
      let hoveredNode: NodeBounds | null = null;
      let minArea = Infinity;

      for (const bounds of nodeBoundsRef.current) {
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

      const newHoveredId = hoveredNode?.nodeId || null;
      if (newHoveredId !== hoveredNodeId) {
        onHover?.(newHoveredId);
        setHoveredNodeId(newHoveredId);
      }
    },
    [scale, onHover, setHoveredNodeId, hoveredNodeId]
  );

  // 处理鼠标离开
  const handleCanvasMouseLeave = useCallback(() => {
    onHover?.(null);
    setHoveredNodeId(null);
  }, [onHover, setHoveredNodeId]);

  // 初始化和更新
  useEffect(() => {
    calculateNodeBounds();
  }, [calculateNodeBounds]);

  useEffect(() => {
    drawInteractionAreas();
  }, [drawInteractionAreas]);

  // 设置画布尺寸
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // 设置画布的实际尺寸
    canvas.width = width;
    canvas.height = height;

    // 设置画布的显示尺寸
    // canvas.style.width = `${width * scale}px`;
    // canvas.style.height = `${height * scale}px`;

    // 重新绘制
    drawInteractionAreas();
  }, [width, height, scale, drawInteractionAreas]);

  return (
    <canvas
      ref={canvasRef}
      onClick={handleCanvasClick}
      onMouseMove={handleCanvasMouseMove}
      onMouseLeave={handleCanvasMouseLeave}
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        cursor: "pointer",
        zIndex: 10,
        pointerEvents: "auto",
      }}
    />
  );
};

export default CanvasInteractionLayer;
