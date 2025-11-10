import DSLElement from '@/components/DSLElement';
import type { DSLNode } from '@/types/dsl';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useSnapshot } from 'valtio';
import { COLORS, DASH_PATTERNS, DRAW_STYLES, LABEL_STYLES, SCALE_CONFIG } from '../constants/CanvasConstant';
import {
  designDetectionActions,
  designDetectionStore,
  findAnnotationByDSLNodeId,
} from '../contexts/DesignDetectionContext';
import { AnnotationNode, LabelInstruction, NodeType } from '../types/componentDetection';
import {
  DetectionCanvasV2Props,
  drawBorder,
  drawGridBackground,
  findNodeAtPosition,
  findNodeById,
  getCanvasPoint,
  getNodeAbsolutePosition,
  getNodeBounds,
  getSelectionBounds,
  isItemInSelection,
  useContainerSize,
} from '../utils/DetectionCanvasV2Helper';

// 给 canvas 画布增加额外的空间以支持框选交互
const CANVAS_EXTEND_SIZE = 80;

const DetectionCanvasV2: React.FC<DetectionCanvasV2Props> = ({
  dslData,
  scale = 1,
  onScaleChange,
  highlightedNodeId,
  hoveredNodeId,
}) => {
  const { annotations, selectedNodeIds, hoveredAnnotation, hoveredDSLNode, showAllBorders } =
    useSnapshot(designDetectionStore);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // 框选相关状态
  const [isShiftPressed, setIsShiftPressed] = React.useState(false);
  const [selectionBox, setSelectionBox] = React.useState<{
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  } | null>(null);
  const [isSelecting, setIsSelecting] = React.useState(false);
  const [isSpacePressed, setIsSpacePressed] = React.useState(false);
  const [isPanning, setIsPanning] = React.useState(false);
  const [panOffset, setPanOffset] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // 监听器引用
  const documentMouseMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const documentMouseUpHandlerRef = useRef<(() => void) | null>(null);
  const documentPanMoveHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const documentPanUpHandlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const panOffsetRef = useRef(panOffset);
  const panSessionRef = useRef<{
    pointerX: number;
    pointerY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const isSpacePressedRef = useRef(isSpacePressed);

  const commitPanOffset = useCallback((nextOffset: { x: number; y: number }) => {
    panOffsetRef.current = nextOffset;
    setPanOffset(nextOffset);
  }, []);

  const stopPanning = useCallback(() => {
    if (documentPanMoveHandlerRef.current) {
      document.removeEventListener('mousemove', documentPanMoveHandlerRef.current);
      documentPanMoveHandlerRef.current = null;
    }
    if (documentPanUpHandlerRef.current) {
      document.removeEventListener('mouseup', documentPanUpHandlerRef.current);
      documentPanUpHandlerRef.current = null;
    }
    panSessionRef.current = null;
    setIsPanning(false);

    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.cursor = isSpacePressedRef.current ? 'grab' : 'default';
    }
  }, []);
  // Get root node dimensions
  const { rootNode, width, height } = useMemo(() => {
    const node = dslData?.dsl.nodes[0] ?? null;
    return {
      rootNode: node,
      width: node?.layoutStyle?.width || 720,
      height: node?.layoutStyle?.height || 1560,
    };
  }, [dslData]);

  // 统一的键盘事件管理
  useEffect(() => {
    const isEditableTarget = (target: EventTarget | null) => {
      if (!(target instanceof HTMLElement)) return false;
      const tagName = target.tagName;
      return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;

      if (e.key === 'Shift') {
        setIsShiftPressed(true);
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        if (!isSpacePressedRef.current) {
          isSpacePressedRef.current = true;
          setIsSpacePressed(true);
        }
        const canvas = canvasRef.current;
        if (canvas && !isPanning) {
          canvas.style.cursor = 'grab';
        }
        e.preventDefault();
        return;
      }

      if (e.key === 'Escape') {
        designDetectionActions.clearSelection();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        setIsShiftPressed(false);
        // 如果正在框选，取消框选并清理监听器
        if (isSelecting) {
          setIsSelecting(false);
          setSelectionBox(null);

          // 清理 document 监听器
          if (documentMouseMoveHandlerRef.current) {
            document.removeEventListener('mousemove', documentMouseMoveHandlerRef.current);
            documentMouseMoveHandlerRef.current = null;
          }
          if (documentMouseUpHandlerRef.current) {
            document.removeEventListener('mouseup', documentMouseUpHandlerRef.current);
            documentMouseUpHandlerRef.current = null;
          }
        }
        return;
      }

      if (e.code === 'Space' || e.key === ' ') {
        if (isSpacePressedRef.current) {
          isSpacePressedRef.current = false;
          setIsSpacePressed(false);
        }
        if (isPanning) {
          stopPanning();
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.style.cursor = 'default';
          }
        } else {
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.style.cursor = 'default';
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isSelecting, isPanning]);

  const containerSize = useContainerSize(containerRef);

  const findNodeAtPositionMemo = (x: number, y: number) => findNodeAtPosition(x, y, rootNode);

  const getNodeAbsolutePositionMemo = useCallback(
    (node: DSLNode) => getNodeAbsolutePosition(rootNode, node),
    [rootNode]
  );

  const findNodeByIdMemo = useCallback((id: string) => findNodeById(rootNode, id), [rootNode]);

  const effectiveScale = useMemo(() => (scale === 0 ? 1 : scale), [scale]);

  const horizontalPadding = useMemo(() => {
    if (!containerSize.width) return CANVAS_EXTEND_SIZE;
    return Math.max((containerSize.width / effectiveScale - width) / 2, CANVAS_EXTEND_SIZE);
  }, [containerSize.width, width, effectiveScale]);

  const verticalPadding = useMemo(() => {
    if (!containerSize.height) return CANVAS_EXTEND_SIZE;
    return Math.max((containerSize.height / effectiveScale - height) / 2, CANVAS_EXTEND_SIZE);
  }, [containerSize.height, height, effectiveScale]);

  useEffect(() => {
    isSpacePressedRef.current = isSpacePressed;
  }, [isSpacePressed]);

  useEffect(() => {
    panOffsetRef.current = panOffset;
  }, [panOffset]);

  const scaledContentDimensions = useMemo(() => {
    const scaledWidth = (width + horizontalPadding * 2) * effectiveScale;
    const scaledHeight = (height + verticalPadding * 2) * effectiveScale;
    return { scaledWidth, scaledHeight };
  }, [width, height, horizontalPadding, verticalPadding, effectiveScale]);

  const contentOffset = useMemo(() => {
    const { scaledWidth, scaledHeight } = scaledContentDimensions;

    return {
      x: containerSize.width ? (containerSize.width - scaledWidth) / 2 : 0,
      y: containerSize.height ? (containerSize.height - scaledHeight) / 2 : 0,
    };
  }, [scaledContentDimensions, containerSize.width, containerSize.height]);

  useEffect(() => {
    if (isSpacePressed) {
      designDetectionActions.hoverAnnotation(null);
      designDetectionActions.hoverDSLNode(null);
    }
  }, [isSpacePressed]);

  // 统一的交互目标检测
  const getInteractionTarget = (x: number, y: number) => {
    // 从后往前查找，优先选择上层组件
    const hoveredAnnotation = [...annotations].reverse().find((annotation) => {
      if (annotation.isRoot) return false;
      return (
        x >= annotation.absoluteX &&
        x <= annotation.absoluteX + annotation.width &&
        y >= annotation.absoluteY &&
        y <= annotation.absoluteY + annotation.height
      );
    });

    const hoveredDSLNode = findNodeAtPositionMemo(x, y);

    // 判断优先级
    if (hoveredAnnotation && hoveredDSLNode) {
      if (hoveredAnnotation.isContainer && hoveredDSLNode.id !== hoveredAnnotation.dslNodeId) {
        return { type: 'dsl', target: hoveredDSLNode, annotation: null };
      } else {
        return { type: 'annotation', target: hoveredAnnotation, dslNode: null };
      }
    }

    if (hoveredAnnotation) {
      return { type: 'annotation', target: hoveredAnnotation, dslNode: null };
    }

    if (hoveredDSLNode) {
      return { type: 'dsl', target: hoveredDSLNode, annotation: null };
    }

    return null;
  };

  // 绘制DSL节点边框
  const drawDSLNodeBorders = (ctx: CanvasRenderingContext2D, node: DSLNode, parentX = 0, parentY = 0) => {
    const bounds = getNodeBounds(node, parentX, parentY);

    if (!findAnnotationByDSLNodeId(node.id) && bounds.width > 0 && bounds.height > 0) {
      drawBorder(ctx, bounds.x, bounds.y, bounds.width, bounds.height, {
        color: COLORS.UNANNOTATED_BORDER,
        width: DRAW_STYLES.UNANNOTATED_BORDER_WIDTH,
        dash: DASH_PATTERNS.UNANNOTATED_DASH,
      });
    }

    node.children?.forEach((child) => drawDSLNodeBorders(ctx, child, bounds.x, bounds.y));
  };

  // 绘制canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = width + horizontalPadding * 2;
    const canvasHeight = height + verticalPadding * 2;

    // 设置 canvas 的实际尺寸为扩展后的尺寸
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    // 清空整个 canvas 区域
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    // 绘制背景栅格
    // 洞区域向外扩 2px
    drawGridBackground(ctx, canvasWidth, canvasHeight, {
      x: horizontalPadding - 3,
      y: verticalPadding - 3,
      width: width + 6,
      height: height + 6,
    });

    // 保存 ctx 状态并设置偏移，使绘制坐标与 DSLElement 对齐
    ctx.save();
    ctx.translate(horizontalPadding, verticalPadding);

    // 1. 绘制所有DSL节点框线
    if (showAllBorders) {
      drawDSLNodeBorders(ctx, rootNode);
    }

    // 2. 绘制hover的DSL节点
    if (hoveredDSLNode) {
      if (hoveredDSLNode) {
        const bounds = getNodeAbsolutePositionMemo(hoveredDSLNode as DSLNode);
        const nodeWidth = hoveredDSLNode.layoutStyle?.width || 0;
        const nodeHeight = hoveredDSLNode.layoutStyle?.height || 0;
        drawBorder(ctx, bounds.x, bounds.y, nodeWidth, nodeHeight, {
          color: COLORS.HOVER_DSL_NODE,
          width: DRAW_STYLES.HOVER_DSL_NODE_WIDTH,
          dash: DASH_PATTERNS.HOVER_DSL_NODE_DASH,
        });
      }
    }

    // 3. 绘制选中的DSL节点
    const selectedDSLNodeIdsList = selectedNodeIds.filter((item) => item.type === NodeType.DSL).map((item) => item.id);

    selectedDSLNodeIdsList.forEach((nodeId) => {
      const selectedNode = findNodeByIdMemo(nodeId);
      if (selectedNode) {
        const bounds = getNodeAbsolutePositionMemo(selectedNode);
        const nodeWidth = selectedNode.layoutStyle?.width || 0;
        const nodeHeight = selectedNode.layoutStyle?.height || 0;
        drawBorder(ctx, bounds.x, bounds.y, nodeWidth, nodeHeight, {
          color: COLORS.ANNOTATED_SELECTED,
          width: DRAW_STYLES.SELECTED_DSL_NODE_WIDTH,
          dash: DASH_PATTERNS.SELECTED_DSL_NODE_DASH,
        });
      }
    });

    // 4. 绘制已标注的组件
    const selectedAnnotationIdsList = selectedNodeIds
      .filter((item) => item.type === NodeType.ANNOTATION)
      .map((item) => item.id);

    const defaultLabelInstructions: LabelInstruction[] = [];
    const selectedLabelInstructions: LabelInstruction[] = [];

    annotations.forEach((annotation) => {
      if (annotation.isRoot) return;

      const isSelected = selectedAnnotationIdsList.includes(annotation.id);
      const isHovered = hoveredAnnotation?.id === annotation.id;

      let strokeColor: string = COLORS.ANNOTATED_DEFAULT;
      let lineWidth: number = DRAW_STYLES.ANNOTATED_DEFAULT_WIDTH;
      let useDashedLine = false;

      if (isSelected) {
        strokeColor = COLORS.ANNOTATED_SELECTED;
        lineWidth = DRAW_STYLES.ANNOTATED_SELECTED_WIDTH;
      } else if (isHovered) {
        strokeColor = COLORS.ANNOTATED_HOVERED;
        lineWidth = DRAW_STYLES.ANNOTATED_HOVER_WIDTH;
        useDashedLine = true;
      }

      drawBorder(ctx, annotation.absoluteX, annotation.absoluteY, annotation.width, annotation.height, {
        color: strokeColor,
        width: lineWidth,
        dash: useDashedLine ? DASH_PATTERNS.ANNOTATED_HOVER_DASH : undefined,
        shadow: useDashedLine,
      });

      // 绘制标签
      const labelText = annotation.name || annotation.ftaComponent;
      const labelStyle = isSelected ? LABEL_STYLES.SELECTED : LABEL_STYLES.DEFAULT;
      ctx.font = labelStyle.FONT;
      const textMetrics = ctx.measureText(labelText);
      const labelWidth = textMetrics.width + labelStyle.PADDING;
      const labelHeight = labelStyle.HEIGHT;
      const labelX = annotation.absoluteX + annotation.width - labelWidth - labelStyle.OFFSET_X;
      const labelY = annotation.absoluteY + labelStyle.OFFSET_Y;

      const instructions = isSelected ? selectedLabelInstructions : defaultLabelInstructions;
      instructions.push({
        text: labelText,
        x: labelX,
        y: labelY,
        width: labelWidth,
        height: labelHeight,
        style: labelStyle,
        backgroundColor: isSelected ? COLORS.LABEL_BACKGROUND_SELECTED : COLORS.LABEL_BACKGROUND,
      });
    });

    const drawLabel = (instruction: LabelInstruction) => {
      ctx.font = instruction.style.FONT;
      ctx.fillStyle = instruction.backgroundColor;
      ctx.fillRect(instruction.x, instruction.y, instruction.width, instruction.height);
      ctx.fillStyle = COLORS.LABEL_TEXT;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(
        instruction.text,
        instruction.x + instruction.style.TEXT_OFFSET_X,
        instruction.y + instruction.height / 2
      );
    };

    defaultLabelInstructions.forEach(drawLabel);
    selectedLabelInstructions.forEach(drawLabel);

    // 5. 绘制框选框
    if (selectionBox && isSelecting) {
      const selectionBounds = getSelectionBounds(selectionBox);
      const { x, y, width, height, isLeftToRight } = selectionBounds;

      ctx.fillStyle = isLeftToRight ? 'rgba(24, 144, 255, 0.15)' : 'rgba(82, 196, 26, 0.15)';
      ctx.fillRect(x, y, width, height);
      ctx.strokeStyle = isLeftToRight ? 'rgba(24, 144, 255, 0.6)' : 'rgba(82, 196, 26, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, width, height);
    }

    // 恢复 ctx 状态
    ctx.restore();
  }, [
    annotations,
    selectedNodeIds,
    hoveredAnnotation,
    hoveredDSLNode,
    width,
    height,
    findAnnotationByDSLNodeId,
    showAllBorders,
    drawDSLNodeBorders,
    selectionBox,
    isSelecting,
    horizontalPadding,
    verticalPadding,
    findNodeByIdMemo,
    getNodeAbsolutePositionMemo,
  ]);

  // 辅助函数：检查节点A是否是节点B的祖先（父、祖父等）
  const isAncestorOf = useCallback(
    (ancestorId: string, descendantId: string): boolean => {
      if (ancestorId === descendantId) return false;

      const ancestorNode = findNodeByIdMemo(ancestorId);
      if (!ancestorNode) return false;

      const checkDescendant = (node: DSLNode): boolean => {
        if (node.id === descendantId) return true;
        if (node.children) {
          return node.children.some((child) => checkDescendant(child));
        }
        return false;
      };

      return checkDescendant(ancestorNode);
    },
    [findNodeByIdMemo]
  );

  // 辅助函数：检查annotation A是否包含annotation B
  const isAnnotationContaining = useCallback((containerAnnotation: any, innerAnnotation: any): boolean => {
    // 通过空间位置判断包含关系
    return (
      containerAnnotation.absoluteX <= innerAnnotation.absoluteX &&
      containerAnnotation.absoluteY <= innerAnnotation.absoluteY &&
      containerAnnotation.absoluteX + containerAnnotation.width >= innerAnnotation.absoluteX + innerAnnotation.width &&
      containerAnnotation.absoluteY + containerAnnotation.height >=
        innerAnnotation.absoluteY + innerAnnotation.height &&
      // 确保不是同一个
      containerAnnotation.id !== innerAnnotation.id
    );
  }, []);

  // 辅助函数：过滤掉有父子关系的项，只保留最外层
  const filterToOutermostItems = useCallback(
    (items: Array<{ type: 'annotation' | 'dsl'; id: string; node?: DSLNode }>) => {
      const result: typeof items = [];

      for (const item of items) {
        let isInner = false;

        // 检查当前项是否被其他项包含
        for (const other of items) {
          if (item === other) continue;

          if (item.type === 'dsl' && other.type === 'dsl') {
            // 两个都是DSL节点，检查是否有祖先关系
            if (isAncestorOf(other.id, item.id)) {
              isInner = true;
              break;
            }
          } else if (item.type === 'annotation' && other.type === 'annotation') {
            // 两个都是annotation，检查空间包含关系
            const itemAnnotation = annotations.find((a) => a.id === item.id);
            const otherAnnotation = annotations.find((a) => a.id === other.id);
            if (itemAnnotation && otherAnnotation && isAnnotationContaining(otherAnnotation, itemAnnotation)) {
              isInner = true;
              break;
            }
          } else if (item.type === 'dsl' && other.type === 'annotation') {
            // item是DSL，other是annotation，检查DSL是否在annotation内
            const otherAnnotation = annotations.find((a) => a.id === other.id);
            if (otherAnnotation) {
              // 检查DSL节点是否是annotation对应DSL节点的后代
              if (isAncestorOf(otherAnnotation.dslNodeId, item.id)) {
                isInner = true;
                break;
              }
            }
          } else if (item.type === 'annotation' && other.type === 'dsl') {
            // item是annotation，other是DSL，检查annotation是否在DSL内
            const itemAnnotation = annotations.find((a) => a.id === item.id);
            if (itemAnnotation) {
              // 检查annotation对应的DSL节点是否是other DSL节点的后代
              if (isAncestorOf(other.id, itemAnnotation.dslNodeId)) {
                isInner = true;
                break;
              }
            }
          }
        }

        if (!isInner) {
          result.push(item);
        }
      }

      return result;
    },
    [annotations, isAncestorOf, isAnnotationContaining]
  );

  // 处理鼠标按下
  const handleCanvasMouseDown = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (isSpacePressed && e.button === 0) {
        e.preventDefault();
        designDetectionActions.hoverAnnotation(null);
        designDetectionActions.hoverDSLNode(null);
        setIsSelecting(false);
        setSelectionBox(null);

        panSessionRef.current = {
          pointerX: e.clientX,
          pointerY: e.clientY,
          originX: panOffsetRef.current.x,
          originY: panOffsetRef.current.y,
        };
        setIsPanning(true);
        canvas.style.cursor = 'grabbing';

        const handleDocumentMouseMove = (moveEvent: MouseEvent) => {
          if (!panSessionRef.current) return;
          const deltaX = moveEvent.clientX - panSessionRef.current.pointerX;
          const deltaY = moveEvent.clientY - panSessionRef.current.pointerY;
          commitPanOffset({
            x: panSessionRef.current.originX + deltaX,
            y: panSessionRef.current.originY + deltaY,
          });
        };

        const handleDocumentMouseUp = () => {
          stopPanning();
        };

        documentPanMoveHandlerRef.current = handleDocumentMouseMove;
        documentPanUpHandlerRef.current = handleDocumentMouseUp;
        document.addEventListener('mousemove', handleDocumentMouseMove);
        document.addEventListener('mouseup', handleDocumentMouseUp);

        return;
      }

      const rect = canvas.getBoundingClientRect();
      const { x, y } = getCanvasPoint(e.nativeEvent, rect, effectiveScale, horizontalPadding, verticalPadding);

      // 如果按住 Shift，开始框选
      if (isShiftPressed) {
        setIsSelecting(true);
        setSelectionBox({
          startX: x,
          startY: y,
          currentX: x,
          currentY: y,
        });

        // 在 document 上添加 mousemove 和 mouseup 监听器，以支持超出边界的框选
        const handleDocumentMouseMove = (moveEvent: MouseEvent) => {
          const { x: moveX, y: moveY } = getCanvasPoint(
            moveEvent,
            rect,
            effectiveScale,
            horizontalPadding,
            verticalPadding
          );

          setSelectionBox((prev) => {
            if (!prev) return prev;
            return {
              ...prev,
              currentX: moveX,
              currentY: moveY,
            };
          });
        };

        const handleDocumentMouseUp = () => {
          // 清理监听器
          document.removeEventListener('mousemove', handleDocumentMouseMove);
          document.removeEventListener('mouseup', handleDocumentMouseUp);
          documentMouseMoveHandlerRef.current = null;
          documentMouseUpHandlerRef.current = null;

          // 触发框选完成逻辑
          setIsSelecting(false);
        };

        // 保存监听器引用，以便在 Shift 释放时清理
        documentMouseMoveHandlerRef.current = handleDocumentMouseMove;
        documentMouseUpHandlerRef.current = handleDocumentMouseUp;

        document.addEventListener('mousemove', handleDocumentMouseMove);
        document.addEventListener('mouseup', handleDocumentMouseUp);

        return;
      }

      // 检查是否多选模式
      const multiSelect = e.ctrlKey || e.metaKey;

      // 使用统一的交互目标检测
      const interactionTarget = getInteractionTarget(x, y);
      const clickedAnnotation =
        interactionTarget?.type === 'annotation' ? (interactionTarget.target as AnnotationNode) : null;
      const clickedDSLNode = interactionTarget?.type === 'dsl' ? (interactionTarget.target as DSLNode) : null;

      // 多选模式下的父子关系检查
      if (multiSelect && selectedNodeIds.length > 0) {
        const clickedItem = clickedAnnotation
          ? { type: 'annotation' as const, id: clickedAnnotation.id, dslNodeId: clickedAnnotation.dslNodeId }
          : clickedDSLNode
          ? { type: 'dsl' as const, id: clickedDSLNode.id, dslNodeId: clickedDSLNode.id }
          : null;

        if (clickedItem) {
          // 检查当前点击项与已选项的父子关系
          const itemsToRemove: string[] = [];

          // 遍历已选中的项
          for (const selectedId of selectedNodeIds) {
            const selectedItemDslNodeId =
              selectedId.type === NodeType.ANNOTATION
                ? annotations.find((a) => a.id === selectedId.id)?.dslNodeId
                : selectedId.id;

            if (!selectedItemDslNodeId) continue;

            // 检查点击项是否是已选项的祖先（父级）
            if (isAncestorOf(clickedItem.dslNodeId, selectedItemDslNodeId)) {
              // 点击了父级，需要移除这个子级
              itemsToRemove.push(selectedId.id);
            }
            // 检查点击项是否是已选项的后代（子级）
            else if (isAncestorOf(selectedItemDslNodeId, clickedItem.dslNodeId)) {
              // 点击了子级，但已经选中了父级，不允许选中子级
              return;
            }
          }

          // 如果点击的是父级，需要先移除所有子级
          if (itemsToRemove.length > 0) {
            // 移除子级选中状态
            itemsToRemove.forEach((id) => {
              const annotation = annotations.find((a) => a.id === id);
              if (annotation) {
                designDetectionActions.selectAnnotation(id, true); // 取消选中
              } else {
                const node = findNodeByIdMemo(id);
                if (node) {
                  designDetectionActions.selectDSLNode(node, true); // 取消选中
                }
              }
            });
          }
        }
      }

      // 3. 根据交互目标执行相应操作
      if (interactionTarget) {
        if (interactionTarget.type === 'annotation') {
          designDetectionActions.selectAnnotation(interactionTarget.target.id, multiSelect);
        } else if (interactionTarget.type === 'dsl') {
          // 检查该DSL节点是否已被标注
          const existingAnnotation = findAnnotationByDSLNodeId(interactionTarget.target.id);
          if (existingAnnotation) {
            // 如果已被标注，选择对应的annotation
            designDetectionActions.selectAnnotation(existingAnnotation.id, multiSelect);
          } else {
            // 如果未标注，选择DSL节点
            designDetectionActions.selectDSLNode(interactionTarget.target as DSLNode, multiSelect);
          }
        }
        return;
      }

      // 4. 点击空白区域，取消选择
      designDetectionActions.clearSelection();
    },
    [
      annotations,
      effectiveScale,
      getInteractionTarget,
      findAnnotationByDSLNodeId,
      findNodeByIdMemo,
      isShiftPressed,
      selectedNodeIds,
      isAncestorOf,
      horizontalPadding,
      verticalPadding,
      isSpacePressed,
      commitPanOffset,
      stopPanning,
    ]
  );

  // 处理鼠标移动
  const handleCanvasMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const canvas = canvasRef.current;
      if (!canvas) return;

      if (isPanning) {
        canvas.style.cursor = 'grabbing';
        return;
      }

      // 如果正在框选，不处理 hover 逻辑
      if (isSelecting) {
        canvas.style.cursor = 'crosshair';
        return;
      }

      if (isSpacePressed) {
        canvas.style.cursor = 'grab';
        return;
      }

      const rect = canvas.getBoundingClientRect();
      const { x, y } = getCanvasPoint(e.nativeEvent, rect, effectiveScale, horizontalPadding, verticalPadding);

      // 如果按住 Shift，显示十字光标
      if (isShiftPressed) {
        canvas.style.cursor = 'crosshair';
        return;
      }

      // 使用统一的交互目标检测
      const interactionTarget = getInteractionTarget(x, y);

      // 根据交互目标执行相应的hover操作
      if (interactionTarget) {
        if (interactionTarget.type === 'annotation') {
          designDetectionActions.hoverAnnotation(interactionTarget.target.id);
          designDetectionActions.hoverDSLNode(null);
          canvas.style.cursor = 'pointer';
        } else if (interactionTarget.type === 'dsl') {
          designDetectionActions.hoverAnnotation(null);
          designDetectionActions.hoverDSLNode(interactionTarget.target.id);
          canvas.style.cursor = 'pointer';
        }
      } else {
        // 没有hover任何内容
        designDetectionActions.hoverAnnotation(null);
        designDetectionActions.hoverDSLNode(null);
        canvas.style.cursor = 'default';
      }
    },
    [
      effectiveScale,
      getInteractionTarget,
      isSelecting,
      isShiftPressed,
      horizontalPadding,
      verticalPadding,
      isPanning,
      isSpacePressed,
    ]
  );

  // 处理鼠标离开
  const handleCanvasMouseLeave = useCallback(() => {
    // 只清除 hover 状态，不影响框选或拖拽
    if (!isSelecting && !isPanning) {
      designDetectionActions.hoverAnnotation(null);
      designDetectionActions.hoverDSLNode(null);
    }
  }, [isSelecting, isPanning]);

  // 处理框选完成逻辑
  useEffect(() => {
    if (!isSelecting && selectionBox) {
      const selectionBounds = getSelectionBounds(selectionBox);
      const selectedItems: Array<{ type: 'annotation' | 'dsl'; id: string; node?: DSLNode }> = [];

      // 检查标注组件
      annotations.forEach((annotation) => {
        if (annotation.isRoot) return;

        const annotationBounds = {
          x: annotation.absoluteX,
          y: annotation.absoluteY,
          right: annotation.absoluteX + annotation.width,
          bottom: annotation.absoluteY + annotation.height,
        };

        if (isItemInSelection(annotationBounds, selectionBounds)) {
          selectedItems.push({ type: 'annotation', id: annotation.id });
        }
      });

      // 检查未标注的DSL节点
      const traverseDSLNodes = (node: DSLNode, parentX = 0, parentY = 0) => {
        const bounds = getNodeBounds(node, parentX, parentY);

        if (!findAnnotationByDSLNodeId(node.id) && bounds.width > 0 && bounds.height > 0) {
          if (isItemInSelection(bounds, selectionBounds)) {
            selectedItems.push({ type: 'dsl', id: node.id, node });
          }
        }

        node.children?.forEach((child) => traverseDSLNodes(child, bounds.x, bounds.y));
      };

      traverseDSLNodes(rootNode);

      // 过滤掉有父子关系的项，只保留最外层
      const outermostItems = filterToOutermostItems(selectedItems);

      // 选中所有符合条件的项目
      if (outermostItems.length > 0) {
        designDetectionActions.clearSelection();
        outermostItems.forEach((item, index) => {
          const isFirst = index === 0;
          if (item.type === 'annotation') {
            designDetectionActions.selectAnnotation(item.id, !isFirst);
          } else if (item.type === 'dsl' && item.node) {
            designDetectionActions.selectDSLNode(item.node, !isFirst);
          }
        });
      } else {
        designDetectionActions.clearSelection();
      }

      setSelectionBox(null);
    }
  }, [isSelecting, selectionBox, rootNode, findAnnotationByDSLNodeId, annotations, filterToOutermostItems]);

  // 组件卸载时清理 document 监听器
  useEffect(() => {
    return () => {
      if (documentMouseMoveHandlerRef.current) {
        document.removeEventListener('mousemove', documentMouseMoveHandlerRef.current);
        documentMouseMoveHandlerRef.current = null;
      }
      if (documentMouseUpHandlerRef.current) {
        document.removeEventListener('mouseup', documentMouseUpHandlerRef.current);
        documentMouseUpHandlerRef.current = null;
      }
      if (documentPanMoveHandlerRef.current) {
        document.removeEventListener('mousemove', documentPanMoveHandlerRef.current);
        documentPanMoveHandlerRef.current = null;
      }
      if (documentPanUpHandlerRef.current) {
        document.removeEventListener('mouseup', documentPanUpHandlerRef.current);
        documentPanUpHandlerRef.current = null;
      }
      panSessionRef.current = null;
    };
  }, []);

  // 处理滚轮缩放
  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      if (!onScaleChange || !(e.ctrlKey || e.metaKey)) return;

      e.stopPropagation();

      // 1. 找到鼠标现在指向canvas的哪个点
      const mouseX = e.clientX;
      const mouseY = e.clientY;

      const containerRect = containerRef.current?.getBoundingClientRect();
      if (!containerRect) return;

      // 鼠标在容器中的位置
      const mouseInContainerX = mouseX - containerRect.left;
      const mouseInContainerY = mouseY - containerRect.top;

      // 计算当前鼠标指向的canvas坐标
      // 回到最初的正确逻辑
      const canvasX = (mouseInContainerX - contentOffset.x - panOffset.x) / effectiveScale;
      const canvasY = (mouseInContainerY - contentOffset.y - panOffset.y) / effectiveScale;

      // 检查鼠标是否在canvas范围内（包括padding区域）
      const isInCanvas = canvasX >= -horizontalPadding && canvasX <= width + horizontalPadding &&
                       canvasY >= -verticalPadding && canvasY <= height + verticalPadding;

      // 调试信息（可以删除，先保留看看）
      console.log('缩放调试:', {
        mouseInContainerX, mouseInContainerY,
        contentOffsetX: contentOffset.x,
        contentOffsetY: contentOffset.y,
        panOffsetX: panOffset.x,
        panOffsetY: panOffset.y,
        effectiveScale,
        canvasX, canvasY,
        width, height,
        horizontalPadding, verticalPadding,
        isInCanvas
      });

      // 2. 缩放
      const delta = e.deltaY > 0 ? -SCALE_CONFIG.WHEEL_SCALE_STEP : SCALE_CONFIG.WHEEL_SCALE_STEP;
      const newScale = Math.max(SCALE_CONFIG.MIN_SCALE, Math.min(SCALE_CONFIG.MAX_SCALE, scale + delta));

      if (newScale === scale) return;

      const newEffectiveScale = newScale === 0 ? 1 : newScale;

      // 3. 根据鼠标位置选择缩放方式
      if (isInCanvas) {
        // 鼠标在canvas内：以鼠标位置为中心缩放（指哪打哪）
        // 先计算下一帧的contentOffset（基于新缩放比例）
        const newScaledWidth = (width + horizontalPadding * 2) * newEffectiveScale;
        const newScaledHeight = (height + verticalPadding * 2) * newEffectiveScale;
        const nextContentOffsetX = containerSize.width ? (containerSize.width - newScaledWidth) / 2 : 0;
        const nextContentOffsetY = containerSize.height ? (containerSize.height - newScaledHeight) / 2 : 0;

        // 精确计算新的panOffset，确保canvas坐标完全保持在鼠标位置
        // 回到最初的正确逻辑
        const newPanOffsetX = mouseInContainerX - nextContentOffsetX - canvasX * newEffectiveScale;
        const newPanOffsetY = mouseInContainerY - nextContentOffsetY - canvasY * newEffectiveScale;

        // 确保偏移精确性：四舍五入到整数像素，避免亚像素偏移
        const precisePanOffsetX = Math.round(newPanOffsetX);
        const precisePanOffsetY = Math.round(newPanOffsetY);

        onScaleChange(newScale);
        commitPanOffset({ x: precisePanOffsetX, y: precisePanOffsetY });
      } else {
        // 鼠标在canvas外：以canvas中心点缩放（固定逻辑）
        onScaleChange(newScale);
      }
    },
    [scale, onScaleChange, width, height, horizontalPadding, verticalPadding,
       containerSize, panOffset, effectiveScale, commitPanOffset]
  );

  const styles = useMemo(() => {
    const contentWidth = width + horizontalPadding * 2;
    const contentHeight = height + verticalPadding * 2;

    return {
      container: {
        width: '100%',
        height: '100%',
        position: 'relative' as const,
        overflow: 'hidden',
        backgroundColor: COLORS.OUTER_BACKGROUND,
      },
      panWrapper: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        transform: `translate(${panOffset.x}px, ${panOffset.y}px)`,
        willChange: isPanning ? 'transform' : undefined,
      },
      scaledContent: {
        position: 'absolute' as const,
        top: contentOffset.y / effectiveScale,
        left: contentOffset.x / effectiveScale,
        width: contentWidth,
        height: contentHeight,
        transform: `scale(${effectiveScale})`,
        transformOrigin: 'top left',
        border: `1px solid ${COLORS.CONTAINER_BORDER}`,
        backgroundColor: COLORS.CONTAINER_BACKGROUND,
        overflow: 'hidden',
      },
      dslWrapper: {
        position: 'absolute' as const,
        top: verticalPadding,
        left: horizontalPadding,
        width,
        height,
        boxShadow: `0 0 0 2px ${COLORS.DSL_BOUNDARY}`,
      },
      canvas: {
        position: 'absolute' as const,
        top: 0,
        left: 0,
        width: contentWidth,
        height: contentHeight,
        pointerEvents: 'auto' as const,
      },
    };
  }, [
    width,
    height,
    horizontalPadding,
    verticalPadding,
    contentOffset.x,
    contentOffset.y,
    effectiveScale,
    panOffset.x,
    panOffset.y,
    isPanning,
  ]);

  return (
    <div
      id='detection-canvas-container-v2'
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.OUTER_BACKGROUND,
      }}
      onWheel={handleWheel}>
      <div ref={containerRef} style={styles.container}>
        <div style={styles.panWrapper}>
          <div style={styles.scaledContent}>
            <div style={styles.dslWrapper}>
              {/* Base DSL layer */}
              <DSLElement
                node={rootNode}
                dslData={dslData}
                selectedNodeId={highlightedNodeId}
                hoveredNodeId={hoveredNodeId}
              />
            </div>

            {/* Overlay canvas for annotations */}
            <canvas
              id='detection-canvas-v2'
              ref={canvasRef}
              style={styles.canvas}
              onMouseDown={handleCanvasMouseDown}
              onMouseMove={handleCanvasMouseMove}
              onMouseLeave={handleCanvasMouseLeave}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionCanvasV2;
