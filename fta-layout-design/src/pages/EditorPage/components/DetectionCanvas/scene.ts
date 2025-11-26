import type { DSLNode } from '@/types/dsl';
import { COLORS, DASH_PATTERNS, DRAW_STYLES, LABEL_STYLES, SCALE_CONFIG } from '../../constants/CanvasConstant';
import {
  calculateDSLNodeAbsolutePosition,
  designDetectionActions,
  designDetectionStore,
  findAnnotationByDSLNodeId,
  findDSLNodeById,
} from '../../contexts/DesignDetectionContext';
import type { AnnotationNode, LabelInstruction, SelectedNodeItem } from '../../types/componentDetection';
import { NodeType } from '../../types/componentDetection';
import {
  drawBorder,
  drawGridBackground,
  findAnnotationNodeAtPosition,
  findDSLNodeAtPosition,
  type FlattenedDSLNode,
  getCanvasPoint,
  getNodeBounds,
  getSelectionBounds,
  isItemInSelection,
} from '../../utils/DetectionCanvasV2Helper';
import { detectionCanvasActions, detectionCanvasState, type SelectionBox } from './state';
import { drawDSLNodeBorders, drawLabel } from './utils';

export const CANVAS_EXTEND_SIZE = 80;

export interface DetectionCanvasRenderState {
  width: number;
  height: number;
  horizontalPadding: number;
  verticalPadding: number;
  contentOffset: { x: number; y: number };
  containerSize: { width: number; height: number };
  effectiveScale: number;
}

export interface DetectionCanvasSceneOptions {
  canvas: HTMLCanvasElement;
  container: HTMLDivElement;
  onScaleChange?: (scale: number) => void;
}

export class DetectionCanvasScene {
  private renderState: DetectionCanvasRenderState;
  private canvas: HTMLCanvasElement;
  private container: HTMLDivElement;
  private onScaleChange?: (scale: number) => void;

  private documentMouseMoveHandler: ((e: MouseEvent) => void) | null = null;
  private documentMouseUpHandler: (() => void) | null = null;
  private documentPanMoveHandler: ((e: MouseEvent) => void) | null = null;
  private documentPanUpHandler: (() => void) | null = null;

  private panSession: { pointerX: number; pointerY: number; originX: number; originY: number } | null = null;

  constructor(options: DetectionCanvasSceneOptions) {
    const { canvas, container, onScaleChange } = options;
    this.canvas = canvas;
    this.container = container;
    this.onScaleChange = onScaleChange;

    this.renderState = {
      width: 0,
      height: 0,
      horizontalPadding: CANVAS_EXTEND_SIZE,
      verticalPadding: CANVAS_EXTEND_SIZE,
      contentOffset: { x: 0, y: 0 },
      containerSize: { width: 0, height: 0 },
      effectiveScale: 1,
    };

    this.bindEvents();
  }

  public updateState(nextState: Partial<DetectionCanvasRenderState>) {
    this.renderState = { ...this.renderState, ...nextState };
    this.draw();
  }

  public dispose() {
    this.unbindEvents();
    this.clearDocumentListeners();
  }

  private bindEvents() {
    this.canvas.addEventListener('mousedown', this.handleMouseDown);
    this.canvas.addEventListener('mousemove', this.handleMouseMove);
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave);
    this.container.addEventListener('wheel', this.handleWheel, { passive: false });
    window.addEventListener('keydown', this.handleKeyDown);
    window.addEventListener('keyup', this.handleKeyUp);
  }

  private unbindEvents() {
    this.canvas.removeEventListener('mousedown', this.handleMouseDown);
    this.canvas.removeEventListener('mousemove', this.handleMouseMove);
    this.canvas.removeEventListener('mouseleave', this.handleMouseLeave);
    this.container.removeEventListener('wheel', this.handleWheel);
    window.removeEventListener('keydown', this.handleKeyDown);
    window.removeEventListener('keyup', this.handleKeyUp);
  }

  private clearDocumentListeners() {
    if (this.documentMouseMoveHandler) {
      document.removeEventListener('mousemove', this.documentMouseMoveHandler);
      this.documentMouseMoveHandler = null;
    }
    if (this.documentMouseUpHandler) {
      document.removeEventListener('mouseup', this.documentMouseUpHandler);
      this.documentMouseUpHandler = null;
    }
    if (this.documentPanMoveHandler) {
      document.removeEventListener('mousemove', this.documentPanMoveHandler);
      this.documentPanMoveHandler = null;
    }
    if (this.documentPanUpHandler) {
      document.removeEventListener('mouseup', this.documentPanUpHandler);
      this.documentPanUpHandler = null;
    }
    this.panSession = null;
  }

  private handleKeyDown = (e: KeyboardEvent) => {
    if (this.isEditableTarget(e.target)) return;

    if (e.code === 'Space' || e.key === ' ') {
      if (!detectionCanvasState.isSpacePressed) {
        detectionCanvasActions.setSpacePressed(true);
      }
      if (!detectionCanvasState.isPanning) {
        this.canvas.style.cursor = 'grab';
      }
      e.preventDefault();
      return;
    }

    if (e.key === 'Escape') {
      designDetectionActions.clearSelection();
    }
  };

  private handleKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift') {
      // Shift 释放时，如果正在框选则取消
      if (detectionCanvasState.isSelecting) {
        detectionCanvasActions.resetSelection();
        this.clearDocumentListeners();
        this.draw();
      }
      return;
    }

    if (e.code === 'Space' || e.key === ' ') {
      if (detectionCanvasState.isSpacePressed) {
        detectionCanvasActions.setSpacePressed(false);
      }
      if (detectionCanvasState.isPanning) {
        this.stopPanning();
      } else {
        this.canvas.style.cursor = 'default';
      }
    }
  };

  private stopPanning() {
    this.clearDocumentListeners();
    this.panSession = null;
    detectionCanvasActions.stopPanning();
    this.canvas.style.cursor = detectionCanvasState.isSpacePressed ? 'grab' : 'default';
  }

  private isEditableTarget(target: EventTarget | null) {
    if (!(target instanceof HTMLElement)) return false;
    const tagName = target.tagName;
    return target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tagName);
  }

  private getInteractionTarget(x: number, y: number) {
    const { flatAnnotationList, flatDSLNodeList } = designDetectionStore;
    let result: { type: NodeType; target: AnnotationNode | FlattenedDSLNode } | null = null;

    const hitAnnotation = findAnnotationNodeAtPosition(x, y, flatAnnotationList);
    const hitDSLNode = findDSLNodeAtPosition(x, y, flatDSLNodeList);

    // 过滤掉根节点
    const validAnnotation = hitAnnotation && !hitAnnotation.isRoot ? hitAnnotation : null;

    if (validAnnotation && hitDSLNode) {
      // 两者都匹配到，返回面积更小的节点
      const annotationArea = validAnnotation.width * validAnnotation.height;
      const dslArea = (hitDSLNode.layoutStyle?.width || 0) * (hitDSLNode.layoutStyle?.height || 0);

      if (annotationArea <= dslArea) {
        result = { type: NodeType.ANNOTATION, target: validAnnotation };
      } else {
        result = { type: NodeType.DSL, target: hitDSLNode };
      }
    } else if (validAnnotation) {
      result = { type: NodeType.ANNOTATION, target: validAnnotation };
    } else if (hitDSLNode) {
      result = { type: NodeType.DSL, target: hitDSLNode };
    }

    return result;
  }

  private handleMouseDown = (e: MouseEvent) => {
    const { horizontalPadding, verticalPadding, effectiveScale } = this.renderState;

    /** 空格键按下且鼠标左键按下，开始平移 */
    if (detectionCanvasState.isSpacePressed && e.button === 0) {
      e.preventDefault();
      designDetectionActions.hoverAnnotation(null);
      designDetectionActions.hoverDSLNode(null);
      detectionCanvasActions.resetSelection();
      this.clearDocumentListeners();

      this.panSession = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        originX: detectionCanvasState.panOffset.x,
        originY: detectionCanvasState.panOffset.y,
      };
      detectionCanvasActions.startPanning();
      this.canvas.style.cursor = 'grabbing';

      const handleDocumentMouseMove = (moveEvent: MouseEvent) => {
        if (!this.panSession) return;
        const deltaX = moveEvent.clientX - this.panSession.pointerX;
        const deltaY = moveEvent.clientY - this.panSession.pointerY;
        const nextOffset = {
          x: this.panSession.originX + deltaX,
          y: this.panSession.originY + deltaY,
        };
        detectionCanvasActions.setPanOffset(nextOffset);
        this.draw();
      };

      const handleDocumentMouseUp = () => {
        this.stopPanning();
      };

      this.documentPanMoveHandler = handleDocumentMouseMove;
      this.documentPanUpHandler = handleDocumentMouseUp;
      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const { x, y } = getCanvasPoint(e, rect, effectiveScale, horizontalPadding, verticalPadding);

    /** 按下 Shift 键且鼠标左键按下，开始选择 */
    if (e.shiftKey && e.button === 0) {
      detectionCanvasActions.startSelection({
        startX: x,
        startY: y,
        currentX: x,
        currentY: y,
      });

      const handleDocumentMouseMove = (moveEvent: MouseEvent) => {
        const { x: moveX, y: moveY } = getCanvasPoint(
          moveEvent,
          rect,
          effectiveScale,
          horizontalPadding,
          verticalPadding
        );
        detectionCanvasActions.updateSelection({
          startX: detectionCanvasState.selectionBox?.startX ?? moveX,
          startY: detectionCanvasState.selectionBox?.startY ?? moveY,
          currentX: moveX,
          currentY: moveY,
        } as SelectionBox);
        this.draw();
      };

      const handleDocumentMouseUp = () => {
        document.removeEventListener('mousemove', handleDocumentMouseMove);
        document.removeEventListener('mouseup', handleDocumentMouseUp);
        this.documentMouseMoveHandler = null;
        this.documentMouseUpHandler = null;
        detectionCanvasActions.finishSelection();
        this.draw();
      };

      this.documentMouseMoveHandler = handleDocumentMouseMove;
      this.documentMouseUpHandler = handleDocumentMouseUp;

      document.addEventListener('mousemove', handleDocumentMouseMove);
      document.addEventListener('mouseup', handleDocumentMouseUp);
      return;
    }

    const multiSelect = e.ctrlKey || e.metaKey;
    const interactionTarget = this.getInteractionTarget(x, y);
    const clickedAnnotation =
      interactionTarget?.type === NodeType.ANNOTATION ? (interactionTarget.target as AnnotationNode) : null;
    const clickedDSLNode = interactionTarget?.type === NodeType.DSL ? (interactionTarget.target as DSLNode) : null;

    const { flatAnnotationList, selectedNodeIds } = designDetectionStore;

    if (multiSelect && selectedNodeIds.length > 0) {
      const clickedItem = clickedAnnotation
        ? { type: NodeType.ANNOTATION, id: clickedAnnotation.id }
        : clickedDSLNode
        ? { type: NodeType.DSL, id: clickedDSLNode.id }
        : null;

      if (clickedItem) {
        const itemsToRemove: string[] = [];

        for (const selectedId of selectedNodeIds) {
          if (this.isAncestorOf(clickedItem, selectedId)) {
            itemsToRemove.push(selectedId.id);
          } else if (this.isAncestorOf(selectedId, clickedItem)) {
            return;
          }
        }

        if (itemsToRemove.length > 0) {
          itemsToRemove.forEach((id) => {
            const annotation = flatAnnotationList.find((a) => a.id === id);
            if (annotation) {
              designDetectionActions.selectAnnotation(id, true);
            } else {
              const node = findDSLNodeById(id);
              if (node) designDetectionActions.selectDSLNode(node, true);
            }
          });
        }
      }
    }

    if (interactionTarget) {
      if (interactionTarget.type === NodeType.ANNOTATION) {
        designDetectionActions.selectAnnotation(interactionTarget.target.id, multiSelect);
      } else if (interactionTarget.type === NodeType.DSL) {
        const existingAnnotation = findAnnotationByDSLNodeId(interactionTarget.target.id);
        if (existingAnnotation) {
          designDetectionActions.selectAnnotation(existingAnnotation.id, multiSelect);
        } else {
          designDetectionActions.selectDSLNode(interactionTarget.target as DSLNode, multiSelect);
        }
      }
      return;
    }

    designDetectionActions.clearSelection();
  };

  private handleMouseMove = (e: MouseEvent) => {
    const { horizontalPadding, verticalPadding, effectiveScale } = this.renderState;

    if (detectionCanvasState.isPanning) {
      this.canvas.style.cursor = 'grabbing';
      return;
    }

    if (detectionCanvasState.isSelecting) {
      this.canvas.style.cursor = 'crosshair';
      return;
    }

    if (detectionCanvasState.isSpacePressed) {
      this.canvas.style.cursor = 'grab';
      return;
    }

    const rect = this.canvas.getBoundingClientRect();
    const { x, y } = getCanvasPoint(e, rect, effectiveScale, horizontalPadding, verticalPadding);

    if (e.shiftKey) {
      this.canvas.style.cursor = 'crosshair';
      return;
    }

    const interactionTarget = this.getInteractionTarget(x, y);

    if (interactionTarget) {
      if (interactionTarget.type === NodeType.ANNOTATION) {
        designDetectionActions.hoverAnnotation(interactionTarget.target.id);
        designDetectionActions.hoverDSLNode(null);
        this.canvas.style.cursor = 'pointer';
      } else if (interactionTarget.type === NodeType.DSL) {
        designDetectionActions.hoverAnnotation(null);
        designDetectionActions.hoverDSLNode(interactionTarget.target.id);
        this.canvas.style.cursor = 'pointer';
      }
    } else {
      designDetectionActions.hoverAnnotation(null);
      designDetectionActions.hoverDSLNode(null);
      this.canvas.style.cursor = 'default';
    }
  };

  private handleMouseLeave = () => {
    if (!detectionCanvasState.isSelecting && !detectionCanvasState.isPanning) {
      designDetectionActions.hoverAnnotation(null);
      designDetectionActions.hoverDSLNode(null);
    }
  };

  private handleWheel = (e: WheelEvent) => {
    if (!this.onScaleChange || !(e.ctrlKey || e.metaKey)) return;

    e.stopPropagation();

    const { horizontalPadding, verticalPadding, width, height, containerSize, contentOffset, effectiveScale } =
      this.renderState;

    const mouseX = e.clientX;
    const mouseY = e.clientY;

    const containerRect = this.container.getBoundingClientRect();
    const mouseInContainerX = mouseX - containerRect.left;
    const mouseInContainerY = mouseY - containerRect.top;

    const canvasX = (mouseInContainerX - contentOffset.x - detectionCanvasState.panOffset.x) / effectiveScale;
    const canvasY = (mouseInContainerY - contentOffset.y - detectionCanvasState.panOffset.y) / effectiveScale;

    const isInCanvas =
      canvasX >= -horizontalPadding &&
      canvasX <= width + horizontalPadding &&
      canvasY >= -verticalPadding &&
      canvasY <= height + verticalPadding;

    const delta = e.deltaY > 0 ? -SCALE_CONFIG.WHEEL_SCALE_STEP : SCALE_CONFIG.WHEEL_SCALE_STEP;
    const newScale = Math.max(SCALE_CONFIG.MIN_SCALE, Math.min(SCALE_CONFIG.MAX_SCALE, effectiveScale + delta));
    if (newScale === effectiveScale) return;

    const newEffectiveScale = newScale === 0 ? 1 : newScale;

    if (isInCanvas) {
      const newScaledWidth = (width + horizontalPadding * 2) * newEffectiveScale;
      const newScaledHeight = (height + verticalPadding * 2) * newEffectiveScale;
      const nextContentOffsetX = containerSize.width ? (containerSize.width - newScaledWidth) / 2 : 0;
      const nextContentOffsetY = containerSize.height ? (containerSize.height - newScaledHeight) / 2 : 0;

      const newPanOffsetX = mouseInContainerX - nextContentOffsetX - canvasX * newEffectiveScale;
      const newPanOffsetY = mouseInContainerY - nextContentOffsetY - canvasY * newEffectiveScale;

      const precisePanOffsetX = Math.round(newPanOffsetX);
      const precisePanOffsetY = Math.round(newPanOffsetY);

      this.onScaleChange(newScale);
      detectionCanvasActions.setPanOffset({ x: precisePanOffsetX, y: precisePanOffsetY });
    } else {
      this.onScaleChange(newScale);
    }
  };

  /**
   * 判断节点间的祖先关系（基于绝对坐标的包含关系）
   * 不再依赖 DSL 树结构递归，而是根据节点类型从 flatDSLNodeList 或 flatAnnotationList 中取出节点，使用矩形包含判断。
   * 在画布中父级区域完全包裹子级区域时，视为存在祖先关系。
   */
  private isAncestorOf(ancestor: SelectedNodeItem, descendant: SelectedNodeItem): boolean {
    if (ancestor.id === descendant.id && ancestor.type === descendant.type) return false;

    const { flatDSLNodeList, flatAnnotationList } = designDetectionStore;

    const ancestorNode =
      ancestor.type === NodeType.ANNOTATION
        ? flatAnnotationList.find((node) => node.id === ancestor.id)
        : flatDSLNodeList.find((node) => node.id === ancestor.id);

    const descendantNode =
      descendant.type === NodeType.ANNOTATION
        ? flatAnnotationList.find((node) => node.id === descendant.id)
        : flatDSLNodeList.find((node) => node.id === descendant.id);

    if (!ancestorNode || !descendantNode) return false;

    return this.isAnnotationContaining(ancestorNode, descendantNode);
  }

  /** 提取统一的绝对边界信息，兼容标注节点与扁平化 DSL 节点 */
  private getNodeAbsoluteBounds(node: AnnotationNode | FlattenedDSLNode | null) {
    if (!node) return null;
    const width = 'width' in node ? node.width : node.layoutStyle?.width || 0;
    const height = 'height' in node ? node.height : node.layoutStyle?.height || 0;

    return {
      id: node.id,
      x: node.absoluteX || 0,
      y: node.absoluteY || 0,
      right: (node.absoluteX || 0) + width,
      bottom: (node.absoluteY || 0) + height,
    };
  }

  /**
   * 判断一个节点是否包含其他一个或多个节点（支持标注与 DSL 混合）
   *
   * @remarks
   * - 采用矩形包含逻辑，需容器完全覆盖子节点范围
   * - 同一节点不会被视为包含关系（ID 相同直接返回 false）
   */
  private isAnnotationContaining(
    containerAnnotation: AnnotationNode | FlattenedDSLNode,
    ...innerAnnotations: Array<AnnotationNode | FlattenedDSLNode>
  ) {
    if (innerAnnotations.length === 0) return false;

    const containerBounds = this.getNodeAbsoluteBounds(containerAnnotation);
    if (!containerBounds) return false;

    return innerAnnotations.every((inner) => {
      const innerBounds = this.getNodeAbsoluteBounds(inner);
      if (!innerBounds || containerBounds.id === innerBounds.id) return false;

      return (
        containerBounds.x <= innerBounds.x &&
        containerBounds.y <= innerBounds.y &&
        containerBounds.right >= innerBounds.right &&
        containerBounds.bottom >= innerBounds.bottom
      );
    });
  }

  /**
   * 过滤选择结果，只保留最外层的节点
   *
   * 当框选同时包含父子节点或标注/DSL 混合节点时，避免内层节点重复出现在最终选择列表中。
   * 该方法会逐个比对选中项，判断当前项是否被其他项包含或是其子节点，若是则剔除。
   *
   * @description
   * - 通过 `isAncestorOf` 统一判断层级关系（支持 DSL/标注混合）
   * - 父级存在则移除子级
   *
   * @remarks
   * - `isAncestorOf` 内部根据节点类型自动从对应列表获取节点
   * - 返回的列表已剔除内层节点，供后续选择更新使用
   */
  private filterToOutermostItems(items: SelectedNodeItem[]) {
    const result: SelectedNodeItem[] = [];

    for (const item of items) {
      let isInner = false;

      for (const other of items) {
        if (item === other) continue;

        if (this.isAncestorOf(other, item)) {
          isInner = true;
          break;
        }
      }

      if (!isInner) result.push(item);
    }

    return result;
  }

  public draw() {
    const { width, height, horizontalPadding, verticalPadding } = this.renderState;

    const { flatAnnotationList, selectedNodeIds, hoveredAnnotation, hoveredDSLNode, showAllBorders, dslRootNode } =
      designDetectionStore;

    const selectionBox = detectionCanvasState.selectionBox;
    const isSelecting = detectionCanvasState.isSelecting;

    if (!dslRootNode) return;

    const ctx = this.canvas.getContext('2d');
    if (!ctx) return;

    const canvasWidth = width + horizontalPadding * 2;
    const canvasHeight = height + verticalPadding * 2;

    this.canvas.width = canvasWidth;
    this.canvas.height = canvasHeight;
    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    drawGridBackground(ctx, canvasWidth, canvasHeight, {
      x: horizontalPadding - 3,
      y: verticalPadding - 3,
      width: width + 6,
      height: height + 6,
    });

    ctx.save();
    ctx.translate(horizontalPadding, verticalPadding);

    if (showAllBorders) {
      drawDSLNodeBorders(ctx, dslRootNode);
    }

    if (hoveredDSLNode) {
      const bounds = calculateDSLNodeAbsolutePosition(hoveredDSLNode as DSLNode);
      const nodeWidth = hoveredDSLNode.layoutStyle?.width || 0;
      const nodeHeight = hoveredDSLNode.layoutStyle?.height || 0;
      drawBorder(ctx, bounds.x, bounds.y, nodeWidth, nodeHeight, {
        color: COLORS.DSL_NODE_HOVERED,
        width: DRAW_STYLES.HOVER_DSL_NODE_WIDTH,
        dash: DASH_PATTERNS.HOVER_DSL_NODE_DASH,
      });
    }

    const selectedDSLNodeIdsList = selectedNodeIds.map((item) => item.id);
    selectedDSLNodeIdsList.forEach((nodeId) => {
      const selectedNode = findDSLNodeById(nodeId);
      if (selectedNode) {
        const bounds = calculateDSLNodeAbsolutePosition(selectedNode);
        const nodeWidth = selectedNode.layoutStyle?.width || 0;
        const nodeHeight = selectedNode.layoutStyle?.height || 0;
        drawBorder(ctx, bounds.x, bounds.y, nodeWidth, nodeHeight, {
          color: COLORS.DSL_NODE_SELECTED,
          width: DRAW_STYLES.SELECTED_DSL_NODE_WIDTH,
          dash: DASH_PATTERNS.SELECTED_DSL_NODE_DASH,
        });
      }
    });

    const selectedAnnotationIdsList = selectedNodeIds.map((item) => item.id);

    const defaultLabelInstructions: LabelInstruction[] = [];
    const selectedLabelInstructions: LabelInstruction[] = [];

    flatAnnotationList.forEach((annotation) => {
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

    defaultLabelInstructions.forEach((instruction) => drawLabel(ctx, instruction));
    selectedLabelInstructions.forEach((instruction) => drawLabel(ctx, instruction));

    if (selectionBox && isSelecting) {
      const selectionBounds = getSelectionBounds(selectionBox);
      const { x, y, width: selectionWidth, height: selectionHeight, isLeftToRight } = selectionBounds;

      ctx.fillStyle = isLeftToRight ? 'rgba(24, 144, 255, 0.15)' : 'rgba(82, 196, 26, 0.15)';
      ctx.fillRect(x, y, selectionWidth, selectionHeight);
      ctx.strokeStyle = isLeftToRight ? 'rgba(24, 144, 255, 0.6)' : 'rgba(82, 196, 26, 0.6)';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, selectionWidth, selectionHeight);
    }

    ctx.restore();

    if (!detectionCanvasState.isSelecting && selectionBox) {
      this.handleSelectionFinish();
    }
  }

  /**
   * 处理框选操作完成后的逻辑
   *
   * 当用户通过 Shift + 拖拽完成框选操作后，此方法会被调用以处理选择结果。
   * 该方法会：
   * 1. 从当前选择框（selectionBox）中提取所有被框选中的节点
   * 2. 遍历所有已标注的节点（AnnotationNode），检查其是否在选择框范围内
   * 3. 遍历所有 DSL 节点树，找出未被标注且在选择框范围内的节点
   * 4. 过滤出最外层的节点（避免选择嵌套的父子节点）
   * 5. 更新全局选择状态，将选中的节点添加到选择列表中
   *
   * @description
   * 选择逻辑说明：
   * - 已标注节点（AnnotationNode）：直接检查其绝对位置是否在选择框内
   * - 未标注 DSL 节点：仅选择那些没有对应标注的节点，且节点必须有有效的宽高
   * - 去重过滤：通过 filterToOutermostItems 方法过滤掉被其他选中节点包含的嵌套节点
   * - 多选处理：第一个节点作为主选择（multiSelect=false），后续节点作为追加选择（multiSelect=true）
   *
   * @remarks
   * - 依赖状态：
   *   - `detectionCanvasState.selectionBox`: 当前选择框的坐标信息（startX, startY, currentX, currentY）
   *   - `designDetectionStore.dslRootNode`: DSL 根节点，用于遍历所有 DSL 节点
   *   - `designDetectionStore.flatAnnotationList`: 扁平化的标注节点列表
   *
   * - 副作用：
   *   - 调用 `designDetectionActions.clearSelection()` 清空当前选择
   *   - 调用 `designDetectionActions.selectAnnotation()` 或 `designDetectionActions.selectDSLNode()` 更新选择状态
   *   - 调用 `detectionCanvasActions.resetSelection()` 和 `detectionCanvasActions.updateSelection(null)` 重置选择框状态
   *
   * - 边界情况：
   *   - 如果 selectionBox 或 rootNode 不存在，方法直接返回，不执行任何操作
   *   - 如果选择框内没有任何节点，会清空当前选择状态
   *   - 根节点（isRoot=true）的标注不会被选择
   *
   *
   * @see {@link filterToOutermostItems} 用于过滤嵌套节点的辅助方法
   * @see {@link getSelectionBounds} 用于计算选择框边界的辅助函数
   * @see {@link isItemInSelection} 用于判断节点是否在选择框内的辅助函数
   * @see {@link getNodeBounds} 用于计算 DSL 节点边界的辅助函数
   */
  private handleSelectionFinish() {
    const { selectionBox } = detectionCanvasState;
    const { dslRootNode, flatAnnotationList } = designDetectionStore;
    if (!selectionBox || !dslRootNode) return;

    const selectionBounds = getSelectionBounds(selectionBox);
    const selectedItems: SelectedNodeItem[] = [];

    flatAnnotationList.forEach((annotation) => {
      if (annotation.isRoot) return;

      const annotationBounds = {
        x: annotation.absoluteX,
        y: annotation.absoluteY,
        right: annotation.absoluteX + annotation.width,
        bottom: annotation.absoluteY + annotation.height,
      };

      if (isItemInSelection(annotationBounds, selectionBounds)) {
        selectedItems.push({ type: NodeType.ANNOTATION, id: annotation.id });
      }
    });

    const traverseDSLNodes = (node: DSLNode, parentX = 0, parentY = 0) => {
      if (node.hidden || node.mask === 'outline') {
        return;
      }
      const bounds = getNodeBounds(node, parentX, parentY);

      if (!findAnnotationByDSLNodeId(node.id) && bounds.width > 0 && bounds.height > 0) {
        if (isItemInSelection(bounds, selectionBounds)) {
          selectedItems.push({ type: NodeType.DSL, id: node.id });
        }
      }

      node.children?.forEach((child) => traverseDSLNodes(child, bounds.x, bounds.y));
    };

    traverseDSLNodes(dslRootNode);

    const outermostItems = this.filterToOutermostItems(selectedItems);

    designDetectionActions.clearSelection();

    if (outermostItems.length > 0) {
      outermostItems.forEach((item, index) => {
        const isFirst = index === 0;
        if (item.type === NodeType.ANNOTATION) {
          designDetectionActions.selectAnnotation(item.id, !isFirst);
        } else if (item.type === NodeType.DSL) {
          designDetectionActions.selectDSLNode(findDSLNodeById(item.id) as DSLNode, !isFirst);
        }
      });
    }

    detectionCanvasActions.resetSelection();
  }
}
