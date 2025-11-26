import DSLElement from '@/components/DSLElement';
import { AnnotationNode, DSLNode } from '@fta/shared-types';
import React, { useEffect, useMemo, useRef } from 'react';
import { useSnapshot } from 'valtio';
import { COLORS } from '../../constants/CanvasConstant';
import { designDetectionActions, designDetectionStore } from '../../contexts/DesignDetectionContext';
import { SelectedNodeItem } from '../../types/componentDetection';
import { DetectionCanvasV2Props, useContainerSize } from '../../utils/DetectionCanvasV2Helper';
import { CANVAS_EXTEND_SIZE, DetectionCanvasScene } from './scene';
import { detectionCanvasActions, detectionCanvasState } from './state';

const DetectionCanvasV2: React.FC<DetectionCanvasV2Props> = ({
  designData,
  scale = 1,
  onScaleChange,
  highlightedNodeId,
  hoveredNodeId,
}) => {
  const effectiveScale = scale === 0 ? 1 : scale;

  const { annotations, selectedNodeIds, hoveredAnnotation, hoveredDSLNode, showAllBorders } =
    useSnapshot(designDetectionStore);
  const canvasState = useSnapshot(detectionCanvasState);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<DetectionCanvasScene | null>(null);

  const { rootNode, width, height } = useMemo(() => {
    const node = designData?.dsl.nodes[0] ?? null;
    return {
      rootNode: node,
      width: node?.layoutStyle?.width || 720,
      height: node?.layoutStyle?.height || 1560,
    };
  }, [designData]);

  const containerSize = useContainerSize(containerRef);

  const horizontalPadding = useMemo(() => {
    if (!containerSize.width) return CANVAS_EXTEND_SIZE;
    return Math.max((containerSize.width / effectiveScale - width) / 2, CANVAS_EXTEND_SIZE);
  }, [containerSize.width, width, effectiveScale]);

  const verticalPadding = useMemo(() => {
    if (!containerSize.height) return CANVAS_EXTEND_SIZE;
    return Math.max((containerSize.height / effectiveScale - height) / 2, CANVAS_EXTEND_SIZE);
  }, [containerSize.height, height, effectiveScale]);

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
    if (canvasState.isSpacePressed) {
      designDetectionActions.hoverAnnotation(null);
      designDetectionActions.hoverDSLNode(null);
    }
  }, [canvasState.isSpacePressed]);

  useEffect(() => {
    if (!canvasRef.current || !containerRef.current || sceneRef.current) return;

    sceneRef.current = new DetectionCanvasScene({
      canvas: canvasRef.current,
      container: containerRef.current,
      onScaleChange,
    });

    return () => {
      sceneRef.current?.dispose();
      sceneRef.current = null;
      detectionCanvasActions.reset();
    };
  }, []);

  useEffect(() => {
    if (!sceneRef.current) return;
    sceneRef.current.updateState({
      rootNode,
      annotations: annotations as AnnotationNode[],
      selectedNodeIds: selectedNodeIds as SelectedNodeItem[],
      hoveredAnnotation: hoveredAnnotation as AnnotationNode | null,
      hoveredDSLNode: hoveredDSLNode as DSLNode | null,
      showAllBorders,
      width,
      height,
      horizontalPadding,
      verticalPadding,
      contentOffset,
      containerSize,
      effectiveScale,
    });
  }, [
    rootNode,
    annotations,
    selectedNodeIds,
    hoveredAnnotation,
    hoveredDSLNode,
    showAllBorders,
    width,
    height,
    horizontalPadding,
    verticalPadding,
    contentOffset,
    effectiveScale,
  ]);

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
        transform: `translate(${canvasState.panOffset.x}px, ${canvasState.panOffset.y}px)`,
        willChange: canvasState.isPanning ? 'transform' : undefined,
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
  }, [width, height, horizontalPadding, verticalPadding, contentOffset, effectiveScale, canvasState]);

  return (
    <div
      id='detection-canvas-container-v2'
      style={{
        width: '100%',
        height: '100%',
        backgroundColor: COLORS.OUTER_BACKGROUND,
      }}>
      <div ref={containerRef} style={styles.container}>
        <div style={styles.panWrapper}>
          <div style={styles.scaledContent}>
            <div id='detection-dsl-wrapper-v2' style={styles.dslWrapper}>
              <DSLElement
                node={rootNode}
                dslData={designData}
                selectedNodeId={highlightedNodeId}
                hoveredNodeId={hoveredNodeId}
              />
            </div>
            <canvas id='detection-canvas-v2' ref={canvasRef} style={styles.canvas} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DetectionCanvasV2;
