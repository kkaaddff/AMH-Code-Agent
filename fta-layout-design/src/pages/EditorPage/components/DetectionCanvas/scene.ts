import type { DSLNode } from '@/types/dsl';
import { COLORS, DASH_PATTERNS, DRAW_STYLES, LABEL_STYLES, SCALE_CONFIG } from '../../constants/CanvasConstant';
import {
  calculateDSLNodeAbsolutePosition,
  designDetectionActions,
  findAnnotationByDSLNodeId,
  findDSLNodeById,
} from '../../contexts/DesignDetectionContext';
import type { AnnotationNode, LabelInstruction, SelectedNodeItem } from '../../types/componentDetection';
import { NodeType } from '../../types/componentDetection';
import {
  drawBorder,
  drawGridBackground,
  findNodeAtPosition,
  getCanvasPoint,
  getNodeBounds,
  getSelectionBounds,
  isItemInSelection,
} from '../../utils/DetectionCanvasV2Helper';
import { detectionCanvasActions, detectionCanvasState, type SelectionBox } from './state';

export const CANVAS_EXTEND_SIZE = 80;

export interface DetectionCanvasRenderState {
  rootNode: DSLNode | null;
  annotations: AnnotationNode[];
  selectedNodeIds: SelectedNodeItem[];
  hoveredAnnotation: AnnotationNode | null;
  hoveredDSLNode: DSLNode | null;
  showAllBorders: boolean;
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

const drawDSLNodeBorders = (ctx: CanvasRenderingContext2D, node: DSLNode, parentX = 0, parentY = 0) => {
  const bounds = getNodeBounds(node, parentX, parentY);

  if (
    !findAnnotationByDSLNodeId(node.id) &&
    bounds.width > 0 &&
    bounds.height > 0 &&
    !node.hidden &&
    node.mask !== 'outline'
  ) {
    drawBorder(ctx, bounds.x, bounds.y, bounds.width, bounds.height, {
      color: COLORS.UNANNOTATED_BORDER,
      width: DRAW_STYLES.UNANNOTATED_BORDER_WIDTH,
      dash: DASH_PATTERNS.UNANNOTATED_DASH,
    });
  }

  node.children?.forEach((child) => drawDSLNodeBorders(ctx, child, bounds.x, bounds.y));
};

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
      rootNode: null,
      annotations: [],
      selectedNodeIds: [],
      hoveredAnnotation: null,
      hoveredDSLNode: null,
      showAllBorders: false,
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

    if (e.key === 'Shift') {
      detectionCanvasActions.setShiftPressed(true);
      return;
    }

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
      detectionCanvasActions.setShiftPressed(false);
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
    const { annotations, rootNode } = this.renderState;
    const hoveredAnnotation = [...annotations].reverse().find((annotation) => {
      if (annotation.isRoot) return false;
      return (
        x >= annotation.absoluteX &&
        x <= annotation.absoluteX + annotation.width &&
        y >= annotation.absoluteY &&
        y <= annotation.absoluteY + annotation.height
      );
    });

    const hoveredDSLNode = rootNode ? findNodeAtPosition(x, y, rootNode) : null;

    if (hoveredAnnotation && hoveredDSLNode) {
      if (hoveredAnnotation.isContainer && hoveredDSLNode.id !== hoveredAnnotation.id) {
        return { type: 'dsl', target: hoveredDSLNode };
      } else {
        return { type: 'annotation', target: hoveredAnnotation };
      }
    }

    if (hoveredAnnotation) return { type: 'annotation', target: hoveredAnnotation };
    if (hoveredDSLNode) return { type: 'dsl', target: hoveredDSLNode };
    return null;
  }

  private handleMouseDown = (e: MouseEvent) => {
    const { horizontalPadding, verticalPadding, effectiveScale } = this.renderState;

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

    if (detectionCanvasState.isShiftPressed) {
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
      interactionTarget?.type === 'annotation' ? (interactionTarget.target as AnnotationNode) : null;
    const clickedDSLNode = interactionTarget?.type === 'dsl' ? (interactionTarget.target as DSLNode) : null;

    const { selectedNodeIds, annotations } = this.renderState;

    if (multiSelect && selectedNodeIds.length > 0) {
      const clickedItem = clickedAnnotation
        ? { type: 'annotation' as const, id: clickedAnnotation.id }
        : clickedDSLNode
        ? { type: 'dsl' as const, id: clickedDSLNode.id }
        : null;

      if (clickedItem) {
        const itemsToRemove: string[] = [];

        for (const selectedId of selectedNodeIds) {
          const selectedItemDslNodeId =
            selectedId.type === NodeType.ANNOTATION
              ? annotations.find((a) => a.id === selectedId.id)?.id
              : selectedId.id;

          if (!selectedItemDslNodeId) continue;

          if (this.isAncestorOf(clickedItem.id, selectedItemDslNodeId)) {
            itemsToRemove.push(selectedId.id);
          } else if (this.isAncestorOf(selectedItemDslNodeId, clickedItem.id)) {
            return;
          }
        }

        if (itemsToRemove.length > 0) {
          itemsToRemove.forEach((id) => {
            const annotation = annotations.find((a) => a.id === id);
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
      if (interactionTarget.type === 'annotation') {
        designDetectionActions.selectAnnotation(interactionTarget.target.id, multiSelect);
      } else if (interactionTarget.type === 'dsl') {
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

    if (detectionCanvasState.isShiftPressed) {
      this.canvas.style.cursor = 'crosshair';
      return;
    }

    const interactionTarget = this.getInteractionTarget(x, y);

    if (interactionTarget) {
      if (interactionTarget.type === 'annotation') {
        designDetectionActions.hoverAnnotation(interactionTarget.target.id);
        designDetectionActions.hoverDSLNode(null);
        this.canvas.style.cursor = 'pointer';
      } else if (interactionTarget.type === 'dsl') {
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

  private isAncestorOf(ancestorId: string, descendantId: string): boolean {
    if (ancestorId === descendantId) return false;
    const ancestorNode = findDSLNodeById(ancestorId);
    if (!ancestorNode) return false;
    const checkDescendant = (node: DSLNode): boolean => {
      if (node.id === descendantId) return true;
      if (node.children) {
        return node.children.some((child) => checkDescendant(child));
      }
      return false;
    };
    return checkDescendant(ancestorNode);
  }

  private isAnnotationContaining(containerAnnotation: AnnotationNode, innerAnnotation: AnnotationNode) {
    return (
      containerAnnotation.absoluteX <= innerAnnotation.absoluteX &&
      containerAnnotation.absoluteY <= innerAnnotation.absoluteY &&
      containerAnnotation.absoluteX + containerAnnotation.width >= innerAnnotation.absoluteX + innerAnnotation.width &&
      containerAnnotation.absoluteY + containerAnnotation.height >=
        innerAnnotation.absoluteY + innerAnnotation.height &&
      containerAnnotation.id !== innerAnnotation.id
    );
  }

  private filterToOutermostItems(items: Array<{ type: 'annotation' | 'dsl'; id: string; node?: DSLNode }>) {
    const { annotations } = this.renderState;
    const result: typeof items = [];

    for (const item of items) {
      let isInner = false;

      for (const other of items) {
        if (item === other) continue;

        if (item.type === 'dsl' && other.type === 'dsl') {
          if (this.isAncestorOf(other.id, item.id)) {
            isInner = true;
            break;
          }
        } else if (item.type === 'annotation' && other.type === 'annotation') {
          const itemAnnotation = annotations.find((a) => a.id === item.id);
          const otherAnnotation = annotations.find((a) => a.id === other.id);
          if (itemAnnotation && otherAnnotation && this.isAnnotationContaining(otherAnnotation, itemAnnotation)) {
            isInner = true;
            break;
          }
        } else if (item.type === 'dsl' && other.type === 'annotation') {
          const otherAnnotation = annotations.find((a) => a.id === other.id);
          if (otherAnnotation && this.isAncestorOf(otherAnnotation.id, item.id)) {
            isInner = true;
            break;
          }
        } else if (item.type === 'annotation' && other.type === 'dsl') {
          const itemAnnotation = annotations.find((a) => a.id === item.id);
          if (itemAnnotation && this.isAncestorOf(other.id, itemAnnotation.id)) {
            isInner = true;
            break;
          }
        }
      }

      if (!isInner) result.push(item);
    }

    return result;
  }

  private draw() {
    const {
      annotations,
      selectedNodeIds,
      hoveredAnnotation,
      hoveredDSLNode,
      width,
      height,
      showAllBorders,
      selectionBox,
      isSelecting,
      horizontalPadding,
      verticalPadding,
      rootNode,
    } = {
      ...this.renderState,
      selectionBox: detectionCanvasState.selectionBox,
      isSelecting: detectionCanvasState.isSelecting,
    };

    if (!rootNode) return;

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
      drawDSLNodeBorders(ctx, rootNode);
    }

    if (hoveredDSLNode) {
      const bounds = calculateDSLNodeAbsolutePosition(hoveredDSLNode as DSLNode);
      const nodeWidth = hoveredDSLNode.layoutStyle?.width || 0;
      const nodeHeight = hoveredDSLNode.layoutStyle?.height || 0;
      drawBorder(ctx, bounds.x, bounds.y, nodeWidth, nodeHeight, {
        color: COLORS.HOVER_DSL_NODE,
        width: DRAW_STYLES.HOVER_DSL_NODE_WIDTH,
        dash: DASH_PATTERNS.HOVER_DSL_NODE_DASH,
      });
    }

    const selectedDSLNodeIdsList = selectedNodeIds.filter((item) => item.type === NodeType.DSL).map((item) => item.id);
    selectedDSLNodeIdsList.forEach((nodeId) => {
      const selectedNode = findDSLNodeById(nodeId);
      if (selectedNode) {
        const bounds = calculateDSLNodeAbsolutePosition(selectedNode);
        const nodeWidth = selectedNode.layoutStyle?.width || 0;
        const nodeHeight = selectedNode.layoutStyle?.height || 0;
        drawBorder(ctx, bounds.x, bounds.y, nodeWidth, nodeHeight, {
          color: COLORS.ANNOTATED_SELECTED,
          width: DRAW_STYLES.SELECTED_DSL_NODE_WIDTH,
          dash: DASH_PATTERNS.SELECTED_DSL_NODE_DASH,
        });
      }
    });

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

  private handleSelectionFinish() {
    const { selectionBox } = detectionCanvasState;
    const { rootNode, annotations } = this.renderState;
    if (!selectionBox || !rootNode) return;

    const selectionBounds = getSelectionBounds(selectionBox);
    const selectedItems: Array<{ type: 'annotation' | 'dsl'; id: string; node?: DSLNode }> = [];

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

    const outermostItems = this.filterToOutermostItems(selectedItems);

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

    detectionCanvasActions.resetSelection();
    detectionCanvasActions.updateSelection(null);
  }
}
