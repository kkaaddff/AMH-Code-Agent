import type { DSLNode } from '@/types/dsl';
import { COLORS, DASH_PATTERNS, DRAW_STYLES } from '../../constants/CanvasConstant';
import { designDetectionStore, findAnnotationByDSLNodeId } from '../../contexts/DesignDetectionContext';
import type { LabelInstruction } from '../../types/componentDetection';
import { drawBorder, getNodeBounds } from '../../utils/DetectionCanvasV2Helper';

export const drawLabel = (ctx: CanvasRenderingContext2D, instruction: LabelInstruction) => {
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

export const drawDSLNodeBorders = (ctx: CanvasRenderingContext2D, node: DSLNode, parentX = 0, parentY = 0) => {
  if (node.hidden || node.mask === 'outline') return;

  const bounds = getNodeBounds(node, parentX, parentY);

  if (
    bounds.width > 0 &&
    bounds.height > 0 &&
    !findAnnotationByDSLNodeId(node.id, designDetectionStore.rootAnnotation)
  ) {
    drawBorder(ctx, bounds.x, bounds.y, bounds.width, bounds.height, {
      color: COLORS.UNANNOTATED_BORDER,
      width: DRAW_STYLES.UNANNOTATED_BORDER_WIDTH,
      dash: DASH_PATTERNS.UNANNOTATED_DASH,
    });
  }

  node.children?.forEach((child) => drawDSLNodeBorders(ctx, child, bounds.x, bounds.y));
};
