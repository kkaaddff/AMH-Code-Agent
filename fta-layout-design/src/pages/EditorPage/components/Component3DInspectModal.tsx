import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Modal, Spin } from 'antd';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import html2canvas from 'html2canvas';

import { useComponentDetectionV2 } from '../contexts/ComponentDetectionContextV2';
import type { AnnotationNode } from '../types/componentDetectionV2';
import {
  MODAL_CONFIG,
  SCENE_LAYOUT,
  RENDERER_CONFIG,
  CAMERA_CONFIG,
  ORBIT_CONTROLS_CONFIG,
  LIGHTING_CONFIG,
  PANEL_MATERIAL_CONFIG,
  EDGE_CONFIG,
  LABEL_3D_CONFIG,
  HTML2CANVAS_CONFIG,
  DEPTH_CALCULATION,
  LOADING_CONFIG,
  COLOR_CONFIG,
} from '../constants/ThreeDInspectConstants';

interface Component3DInspectModalProps {
  open: boolean;
  onClose: () => void;
}

interface AnnotationWithDepth {
  node: AnnotationNode;
  depth: number;
}

const collectAnnotations = (
  node: AnnotationNode | null,
  depth = 0,
  acc: AnnotationWithDepth[] = []
): AnnotationWithDepth[] => {
  if (!node) return acc;

  acc.push({ node, depth });
  node.children.forEach((child) => collectAnnotations(child, depth + 1, acc));
  return acc;
};

const getMaxDepth = (items: AnnotationWithDepth[]) => {
  return items.reduce((max, item) => Math.max(max, item.depth), 0);
};

const drawRoundedRect = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) => {
  const cornerRadius = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + cornerRadius, y);
  ctx.lineTo(x + width - cornerRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + cornerRadius);
  ctx.lineTo(x + width, y + height - cornerRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - cornerRadius, y + height);
  ctx.lineTo(x + cornerRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - cornerRadius);
  ctx.lineTo(x, y + cornerRadius);
  ctx.quadraticCurveTo(x, y, x + cornerRadius, y);
  ctx.closePath();
};

const Component3DInspectModal: React.FC<Component3DInspectModalProps> = ({ open, onClose }) => {
  const { rootAnnotation, calculateDSLNodeAbsolutePosition } = useComponentDetectionV2();
  const containerRef = useRef<HTMLDivElement>(null);
  const textureCacheRef = useRef<Map<string, THREE.Texture>>(new Map());
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const preInitFrameRef = useRef<number | null>(null);
  const initFrameRef = useRef<number | null>(null);
  const disposablesRef = useRef<Array<() => void>>([]);
  const [initializing, setInitializing] = useState(false);

  const annotations = useMemo(() => collectAnnotations(rootAnnotation), [rootAnnotation]);

  const resolveAnnotationMetrics = useCallback(
    (annotation: AnnotationNode) => {
      const width = annotation.width || annotation.dslNode?.layoutStyle?.width || 0;
      const height = annotation.height || annotation.dslNode?.layoutStyle?.height || 0;
      if (annotation.dslNode) {
        const absolute = calculateDSLNodeAbsolutePosition(annotation.dslNode);
        return {
          width,
          height,
          absoluteX: absolute.x,
          absoluteY: absolute.y,
        };
      }
      return {
        width,
        height,
        absoluteX: annotation.absoluteX,
        absoluteY: annotation.absoluteY,
      };
    },
    [calculateDSLNodeAbsolutePosition]
  );

  // 从 DetectionCanvas 获取已渲染的 DSLElement DOM 节点
  const getDSLElementFromCanvas = useCallback((annotation: AnnotationNode): HTMLElement | null => {
    if (!annotation.dslNode) {
      return null;
    }

    // 在整个文档中查找对应的 DSLElement
    // DSLElement 渲染 data-dsl-id 属性来标识对应的 DSL 节点
    const dslElement = document.querySelector(`[data-dsl-id="${annotation.dslNode.id}"]`) as HTMLElement;

    return dslElement;
  }, []);

  // 创建用于捕获的容器，复制原始 DSLElement 的样式和内容
  const createCaptureContainer = useCallback(
    (sourceElement: HTMLElement, width: number, height: number): HTMLElement => {
      const container = document.createElement('div');
      container.style.width = `${width}px`;
      container.style.height = `${height}px`;
      container.style.position = 'absolute';
      container.style.left = '0';
      container.style.top = '0';
      container.style.pointerEvents = 'none';
      container.style.overflow = 'hidden';

      // 克隆原始元素以保持所有样式和渲染状态
      const clonedElement = sourceElement.cloneNode(true) as HTMLElement;
      clonedElement.style.transform = 'none'; // 移除可能的 transform
      clonedElement.style.position = 'absolute';
      clonedElement.style.left = '0';
      clonedElement.style.top = '0';

      container.appendChild(clonedElement);
      return container;
    },
    []
  );

  useEffect(() => {
    if (!open && textureCacheRef.current.size) {
      textureCacheRef.current.forEach((texture) => texture.dispose());
      textureCacheRef.current.clear();
    }
  }, [open]);

  useEffect(() => {
    textureCacheRef.current.forEach((texture) => texture.dispose());
    textureCacheRef.current.clear();
  }, [rootAnnotation]);

  useEffect(() => {
    if (!open || !rootAnnotation) {
      return;
    }

    let isMounted = true;
    disposablesRef.current = [];

    const disposeSceneResources = () => {
      disposablesRef.current.forEach((dispose) => {
        try {
          dispose();
        } catch {
          // ignore dispose errors
        }
      });
      disposablesRef.current = [];

      if (controlsRef.current) {
        controlsRef.current.dispose();
        controlsRef.current = null;
      }

      if (rendererRef.current) {
        const renderer = rendererRef.current;
        (renderer as any).renderLists?.dispose?.();
        renderer.dispose();
        renderer.forceContextLoss();
        renderer.domElement?.remove();
        rendererRef.current = null;
      }

      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          const mesh = object as THREE.Mesh;
          if (mesh.geometry) {
            mesh.geometry.dispose?.();
          }
          const material = (mesh as THREE.Mesh).material;
          if (Array.isArray(material)) {
            material.forEach((mat) => mat?.dispose?.());
          } else {
            material?.dispose?.();
          }
        });
        sceneRef.current.clear();
        sceneRef.current = null;
      }

      cameraRef.current = null;
    };

    const ensureTexture = async (annotation: AnnotationNode): Promise<THREE.Texture | null> => {
      const { width, height } = resolveAnnotationMetrics(annotation);
      if (!annotation.dslNode || width <= 0 || height <= 0) {
        return null;
      }

      const cached = textureCacheRef.current.get(annotation.id);
      if (cached) {
        return cached;
      }

      let captureElement: HTMLElement | null = null;

      try {
        // 从 DetectionCanvas 获取已渲染的元素
        const canvasElement = getDSLElementFromCanvas(annotation);
        if (!canvasElement) {
          console.warn('Cannot find DSLElement for annotation:', annotation.name || annotation.id);
          return null;
        }

        // 创建捕获容器
        captureElement = createCaptureContainer(canvasElement, width, height);
        document.body.appendChild(captureElement);

        // 处理 WebGL canvas 元素
        const canvases = Array.from(captureElement.querySelectorAll('canvas'));
        canvases.forEach((canvas) => {
          const webglContext =
            canvas.getContext?.('webgl') || canvas.getContext?.('webgl2') || canvas.getContext?.('experimental-webgl');
          if (webglContext) {
            canvas.setAttribute('data-html2canvas-ignore', 'true');
          }
        });

        const canvasBitmap = await html2canvas(captureElement, {
          backgroundColor: HTML2CANVAS_CONFIG.BACKGROUND_COLOR,
          useCORS: HTML2CANVAS_CONFIG.USE_CORS,
          allowTaint: HTML2CANVAS_CONFIG.ALLOW_TAINT,
          scale: HTML2CANVAS_CONFIG.SCALE,
          logging: HTML2CANVAS_CONFIG.LOGGING,
          removeContainer: HTML2CANVAS_CONFIG.REMOVE_CONTAINER,
        });

        if (!isMounted) {
          return null;
        }

        const texture = new THREE.CanvasTexture(canvasBitmap);
        texture.colorSpace = THREE.SRGBColorSpace;
        texture.needsUpdate = true;

        textureCacheRef.current.set(annotation.id, texture);
        return texture;
      } catch (error) {
        console.warn('Failed to capture annotation for 3D preview', error);
        return null;
      } finally {
        // 清理捕获容器
        if (captureElement && captureElement.parentNode) {
          captureElement.parentNode.removeChild(captureElement);
        }
      }
    };

    const initialiseScene = async () => {
      if (!isMounted) return;

      const container = containerRef.current;
      if (!container) {
        return;
      }

      setInitializing(true);

      const width = container.clientWidth || RENDERER_CONFIG.DEFAULT_CANVAS_WIDTH;
      const height = container.clientHeight || RENDERER_CONFIG.DEFAULT_CANVAS_HEIGHT;

      // 首先计算场景相关变量
      const maxDepth = getMaxDepth(annotations);
      const { width: rootWidthRaw, height: rootHeightRaw } = resolveAnnotationMetrics(rootAnnotation);
      const rootWidth = Math.max(rootWidthRaw, SCENE_LAYOUT.MIN_WIDTH);
      const rootHeight = Math.max(rootHeightRaw, SCENE_LAYOUT.MIN_HEIGHT);
      const scale = SCENE_LAYOUT.BASE_WIDTH_UNITS / Math.max(rootWidth, SCENE_LAYOUT.MIN_WIDTH);
      const depthOffset = Math.max(
        SCENE_LAYOUT.DEPTH_GAP,
        (SCENE_LAYOUT.BASE_WIDTH_UNITS / (maxDepth + 1)) * DEPTH_CALCULATION.MIN_DEPTH_GAP_RATIO
      );

      const renderer = new THREE.WebGLRenderer({
        antialias: RENDERER_CONFIG.ANTIALIAS,
        alpha: RENDERER_CONFIG.ALPHA,
        preserveDrawingBuffer: RENDERER_CONFIG.PRESERVE_DRAWING_BUFFER,
      });
      renderer.setPixelRatio(window.devicePixelRatio || RENDERER_CONFIG.DEFAULT_PIXEL_RATIO);
      renderer.setSize(width, height);
      renderer.setClearColor(RENDERER_CONFIG.CLEAR_COLOR, RENDERER_CONFIG.CLEAR_ALPHA);
      renderer.domElement.setAttribute('data-html2canvas-ignore', 'true');

      container.innerHTML = '';
      container.appendChild(renderer.domElement);

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(RENDERER_CONFIG.CLEAR_COLOR);

      // 计算场景边界和相机位置
      const sceneWidth = rootWidth * scale;
      const sceneHeight = rootHeight * scale;
      const sceneDepth = maxDepth * depthOffset;

      // 计算场景的最大尺寸（用于确定相机距离）
      const maxSceneDimension = Math.max(sceneWidth, sceneHeight, sceneDepth);

      // 计算相机距离，确保缩到最小时能看到整个场景
      const cameraDistance = maxSceneDimension * CAMERA_CONFIG.VIEW_DISTANCE_RATIO;
      const cameraHeight = maxSceneDimension * CAMERA_CONFIG.VIEW_HEIGHT_RATIO;

      // 设置相机位置（45度俯视角）
      const pitchRad = (CAMERA_CONFIG.DEFAULT_PITCH_ANGLE * Math.PI) / 180;
      const cameraX = CAMERA_CONFIG.POSITION_X;
      const cameraY = cameraHeight;
      const cameraZ = cameraDistance * Math.cos(pitchRad);

      const camera = new THREE.PerspectiveCamera(
        CAMERA_CONFIG.FIELD_OF_VIEW,
        width / height,
        CAMERA_CONFIG.NEAR_PLANE,
        CAMERA_CONFIG.FAR_PLANE
      );
      camera.position.set(cameraX, cameraY, cameraZ);
      camera.lookAt(0, 0, (depthOffset * maxDepth * DEPTH_CALCULATION.LAYER_DIRECTION) / 2);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = ORBIT_CONTROLS_CONFIG.ENABLE_DAMPING;
      controls.dampingFactor = ORBIT_CONTROLS_CONFIG.DAMPING_FACTOR;
      controls.rotateSpeed = ORBIT_CONTROLS_CONFIG.ROTATE_SPEED;
      controls.panSpeed = ORBIT_CONTROLS_CONFIG.PAN_SPEED;

      // 根据场景尺寸动态设置最小和最大距离
      const minDistance = maxSceneDimension * ORBIT_CONTROLS_CONFIG.MIN_DISTANCE_RATIO;
      const maxDistance = maxSceneDimension * ORBIT_CONTROLS_CONFIG.MAX_DISTANCE_RATIO;
      controls.minDistance = Math.min(ORBIT_CONTROLS_CONFIG.MIN_DISTANCE, minDistance);
      controls.maxDistance = Math.max(ORBIT_CONTROLS_CONFIG.MAX_DISTANCE, maxDistance);

      rendererRef.current = renderer;
      sceneRef.current = scene;
      cameraRef.current = camera;
      controlsRef.current = controls;

      const ambientLight = new THREE.AmbientLight(LIGHTING_CONFIG.AMBIENT_COLOR, LIGHTING_CONFIG.AMBIENT_INTENSITY);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(
        LIGHTING_CONFIG.DIRECTIONAL_COLOR,
        LIGHTING_CONFIG.DIRECTIONAL_INTENSITY
      );
      directionalLight.position.set(
        LIGHTING_CONFIG.DIRECTIONAL_POSITION_X,
        LIGHTING_CONFIG.DIRECTIONAL_POSITION_Y,
        LIGHTING_CONFIG.DIRECTIONAL_POSITION_Z
      );
      scene.add(directionalLight);

      const group = new THREE.Group();
      scene.add(group);

      const centerOffsetX = (rootWidth * scale) / 2;
      const centerOffsetY = (rootHeight * scale) / 2;

      for (const item of annotations) {
        if (!isMounted) {
          break;
        }

        const texture = await ensureTexture(item.node);
        if (!isMounted) {
          break;
        }

        const { width, height, absoluteX, absoluteY } = resolveAnnotationMetrics(item.node);
        const widthWorld = Math.max(width, SCENE_LAYOUT.MIN_WIDTH) * scale;
        const heightWorld = Math.max(height, SCENE_LAYOUT.MIN_HEIGHT) * scale;
        const x = (absoluteX + width / 2) * scale - centerOffsetX;
        const y = centerOffsetY - (absoluteY + height / 2) * scale;
        const z = item.depth * depthOffset * DEPTH_CALCULATION.LAYER_DIRECTION;

        const nodeGroup = new THREE.Group();
        nodeGroup.position.set(x, y, z);

        const panelGeometry = new THREE.PlaneGeometry(widthWorld, heightWorld);
        const panelMaterial = texture
          ? new THREE.MeshBasicMaterial({
              map: texture,
              transparent: true,
              side: PANEL_MATERIAL_CONFIG.SIDE,
            })
          : new THREE.MeshBasicMaterial({
              color: new THREE.Color(
                `hsl(${(item.depth * PANEL_MATERIAL_CONFIG.HSL_HUE_STEP) % 360}, ${
                  PANEL_MATERIAL_CONFIG.HSL_SATURATION
                }%, ${PANEL_MATERIAL_CONFIG.HSL_LIGHTNESS}%)`
              ),
              opacity: PANEL_MATERIAL_CONFIG.OPACITY,
              transparent: true,
              side: PANEL_MATERIAL_CONFIG.SIDE,
            });

        const panelMesh = new THREE.Mesh(panelGeometry, panelMaterial);
        panelMesh.position.set(0, 0, depthOffset * DEPTH_CALCULATION.DEPTH_OFFSET_RATIO);
        nodeGroup.add(panelMesh);

        disposablesRef.current.push(() => {
          panelGeometry.dispose();
          panelMaterial.dispose();
        });

        const boxGeometry = new THREE.BoxGeometry(widthWorld, heightWorld, depthOffset * EDGE_CONFIG.WIDTH_RATIO);
        const edges = new THREE.EdgesGeometry(boxGeometry);
        const edgeMaterial = new THREE.LineBasicMaterial({
          color: new THREE.Color(EDGE_CONFIG.COLOR).offsetHSL((item.depth * EDGE_CONFIG.HSL_OFFSET_STEP) % 1, 0, 0),
        });
        const wireframe = new THREE.LineSegments(edges, edgeMaterial);
        nodeGroup.add(wireframe);

        disposablesRef.current.push(() => {
          boxGeometry.dispose();
          edges.dispose();
          edgeMaterial.dispose();
        });

        if (0) {
          const labelCanvas = document.createElement('canvas');
          const labelCtx = labelCanvas.getContext('2d');
          if (labelCtx) {
            const labelWidth = LABEL_3D_CONFIG.CANVAS_WIDTH;
            const labelHeight = LABEL_3D_CONFIG.CANVAS_HEIGHT;
            labelCanvas.width = labelWidth;
            labelCanvas.height = labelHeight;

            labelCtx.clearRect(0, 0, labelWidth, labelHeight);
            labelCtx.fillStyle = COLOR_CONFIG.LABEL_BG;
            drawRoundedRect(
              labelCtx,
              LABEL_3D_CONFIG.PADDING,
              LABEL_3D_CONFIG.PADDING,
              labelWidth - LABEL_3D_CONFIG.PADDING * 2,
              labelHeight - LABEL_3D_CONFIG.PADDING * 2,
              LABEL_3D_CONFIG.CORNER_RADIUS
            );
            labelCtx.fill();

            labelCtx.strokeStyle = COLOR_CONFIG.LABEL_BORDER;
            labelCtx.lineWidth = LABEL_3D_CONFIG.BORDER_WIDTH;
            drawRoundedRect(
              labelCtx,
              LABEL_3D_CONFIG.PADDING,
              LABEL_3D_CONFIG.PADDING,
              labelWidth - LABEL_3D_CONFIG.PADDING * 2,
              labelHeight - LABEL_3D_CONFIG.PADDING * 2,
              LABEL_3D_CONFIG.CORNER_RADIUS
            );
            labelCtx.stroke();

            labelCtx.fillStyle = COLOR_CONFIG.LABEL_TEXT;
            labelCtx.font = LABEL_3D_CONFIG.FONT_STYLE;
            labelCtx.textAlign = 'center';
            labelCtx.textBaseline = 'middle';
            labelCtx.fillText(
              item.node.name || item.node.ftaComponent || item.node.dslNodeId,
              labelWidth / 2,
              labelHeight / 2
            );

            const labelTexture = new THREE.CanvasTexture(labelCanvas);
            labelTexture.needsUpdate = true;

            const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true });
            const labelSprite = new THREE.Sprite(labelMaterial);
            labelSprite.scale.set(
              (widthWorld + heightWorld) * LABEL_3D_CONFIG.SCALE_RATIO,
              ((widthWorld + heightWorld) * LABEL_3D_CONFIG.SCALE_RATIO * labelHeight) / labelWidth,
              1
            );
            labelSprite.position.set(
              0,
              heightWorld / 2 + (widthWorld + heightWorld) * LABEL_3D_CONFIG.VERTICAL_OFFSET_RATIO,
              0
            );
            nodeGroup.add(labelSprite);

            disposablesRef.current.push(() => {
              labelTexture.dispose();
              labelMaterial.dispose();
            });
          }
        }
        group.add(nodeGroup);
      }

      controls.target.set(0, 0, (depthOffset * maxDepth * DEPTH_CALCULATION.LAYER_DIRECTION) / 2);
      controls.update();

      const animate = () => {
        if (!isMounted || !rendererRef.current || !sceneRef.current || !cameraRef.current) {
          return;
        }
        controls.update();
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();
      if (isMounted) {
        setInitializing(false);
      }
    };

    preInitFrameRef.current = requestAnimationFrame(() => {
      initFrameRef.current = requestAnimationFrame(() => {
        initialiseScene().catch((error) => {
          console.error('Failed to initialise 3D scene', error);
          if (isMounted) {
            setInitializing(false);
          }
        });
      });
    });

    return () => {
      isMounted = false;
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      if (preInitFrameRef.current !== null) {
        cancelAnimationFrame(preInitFrameRef.current);
        preInitFrameRef.current = null;
      }
      if (initFrameRef.current !== null) {
        cancelAnimationFrame(initFrameRef.current);
        initFrameRef.current = null;
      }
      disposeSceneResources();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
      setInitializing(false);
    };
  }, [annotations, open, resolveAnnotationMetrics, rootAnnotation]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title="3D 检视"
      width={MODAL_CONFIG.WIDTH}
      centered
      /** 隐藏时销毁组件 （必须是这个属性不能乱改）*/
      destroyOnHidden
      styles={{
        content: { background: COLOR_CONFIG.MODAL_CONTENT_BG },
        header: {
          background: COLOR_CONFIG.MODAL_HEADER_BG,
          borderBottom: `1px solid ${COLOR_CONFIG.MODAL_HEADER_BORDER}`,
          color: COLOR_CONFIG.MODAL_HEADER_TEXT,
        },
        body: { padding: 0 },
      }}
    >
      <div style={{ height: MODAL_CONFIG.HEIGHT, position: 'relative', background: COLOR_CONFIG.MODAL_BG }}>
        <div ref={containerRef} style={{ height: '100%', width: '100%' }} />
        {initializing && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `rgba(255, 255, 255, ${LOADING_CONFIG.BACKGROUND_OPACITY})`,
              pointerEvents: 'none',
              backdropFilter: LOADING_CONFIG.BACKDROP_BLUR,
            }}
          >
            <Spin tip={LOADING_CONFIG.SPIN_TIP} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default Component3DInspectModal;
