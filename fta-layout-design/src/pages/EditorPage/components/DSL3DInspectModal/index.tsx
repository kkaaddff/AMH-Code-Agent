import DSLElement from '@/components/DSLElement';
import { DesignDSL, DSLNode } from '@/types/dsl';
import { Button, Modal } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useSnapshot } from 'valtio';
import { ORBIT_CONTROLS_CONFIG } from '../../constants/Three3DInspectConstants';
import { designDetectionActions, designDetectionStore } from '../../contexts/DesignDetectionContext';

import './style.css';

const SCENE_CONFIG = {
  BG_COLOR: 0xf0f2f5,
  WIREFRAME_COLOR: 0x1890ff,
  SELECTED_COLOR: 0xff4d4f,
  HOVER_COLOR: 0x40a9ff,
  SELECTED_FILL_COLOR: 0xff7875,
  TEXT_COLOR: 0x000000,
  DEPTH_OFFSET: 150,
  BASE_SCALE: 0.01,
};

interface DSL3DInspectModalProps {
  open: boolean;
  onClose: () => void;
}

interface DSLNodeInfo {
  id: string;
  name?: string;
  type: string;
  width: number;
  height: number;
  x: number;
  y: number;
  depth: number;
  rawNode: any;
}

const DSL3DInspectModal: React.FC<DSL3DInspectModalProps> = ({ open, onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { dslData } = useSnapshot(designDetectionStore);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const requestRef = useRef<number | null>(null);

  const hoverRef = useRef<string | null>(null);
  const selectionRef = useRef<string | null>(null);
  const isSpacePanningRef = useRef(false);
  const isMouseDownRef = useRef(false);

  const [selectedNode, setSelectedNode] = useState<DSLNodeInfo | null>(null);

  const flatNodes = useMemo(() => {
    if (!dslData) return [];

    const nodes: DSLNodeInfo[] = [];

    const traverse = (node: any, depth: number, parentX: number, parentY: number) => {
      if (!node) return;

      const layout = node.layoutStyle || {};
      const width = layout.width || 0;
      const height = layout.height || 0;

      const x = parentX + (layout.relativeX || layout.left || 0);
      const y = parentY + (layout.relativeY || layout.top || 0);

      nodes.push({
        id: node.id || `node-${Math.random()}`,
        name: node.name,
        type: node.type,
        width,
        height,
        x,
        y,
        depth,
        rawNode: node,
      });

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => traverse(child, depth + 1, x, y));
      } else if (node.layers && Array.isArray(node.layers)) {
        node.layers.forEach((child: any) => traverse(child, depth + 1, x, y));
      }
    };

    let rootNodes: any[] = [];

    if (dslData && typeof dslData === 'object' && 'dsl' in dslData && (dslData as any).dsl?.nodes) {
      rootNodes = (dslData as any).dsl.nodes;
    } else if (Array.isArray(dslData)) {
      rootNodes = dslData;
    } else {
      rootNodes = [dslData];
    }

    rootNodes.forEach((item) => traverse(item, 0, 0, 0));

    return nodes;
  }, [dslData]);

  const tmpDSLData: DesignDSL | null = useMemo(() => {
    if (!selectedNode || !dslData) return null;

    const targetNode = selectedNode.rawNode as DSLNode;

    return {
      ...dslData,
      dsl: {
        ...dslData.dsl,
        nodes: [targetNode],
      },
    };
  }, [selectedNode, dslData]);

  const createLabelTexture = (text: string) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const fontSize = 48;
    const padding = 10;
    ctx.font = `bold ${fontSize}px Arial`;

    const textMetrics = ctx.measureText(text);
    const width = textMetrics.width + padding * 2;
    const height = fontSize + padding * 2;

    canvas.width = width;
    canvas.height = height;

    ctx.clearRect(0, 0, width, height);

    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#000000';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, padding, height / 2);

    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    return { texture, width, height, aspectRatio: width / height };
  };

  useEffect(() => {
    if (!open || flatNodes.length === 0) return;

    if (rendererRef.current) {
      rendererRef.current.dispose();
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    }

    const initScene = () => {
      if (!containerRef.current) return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      if (width === 0 || height === 0) return;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0xffffff);
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
      camera.position.set(0, 0, 1000);
      cameraRef.current = camera;

      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      renderer.shadowMap.enabled = true;
      renderer.domElement.style.cursor = 'grab';
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = ORBIT_CONTROLS_CONFIG.ENABLE_DAMPING;
      controls.dampingFactor = ORBIT_CONTROLS_CONFIG.DAMPING_FACTOR;
      controls.rotateSpeed = ORBIT_CONTROLS_CONFIG.ROTATE_SPEED;
      controls.panSpeed = ORBIT_CONTROLS_CONFIG.PAN_SPEED * 2;
      controls.screenSpacePanning = true;
      controlsRef.current = controls;

      const ambientLight = new THREE.AmbientLight(0xf0f0f0, 1.2);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
      dirLight.position.set(10, 10, 10);
      scene.add(dirLight);

      const axesHelper = new THREE.AxesHelper(500);
      scene.add(axesHelper);

      const group = new THREE.Group();
      const fillMeshes: THREE.Mesh[] = [];
      const worldYPositions: number[] = [];

      let minX = Infinity,
        maxX = -Infinity,
        minY = Infinity,
        maxY = -Infinity;
      flatNodes.forEach((node) => {
        minX = Math.min(minX, node.x);
        maxX = Math.max(maxX, node.x + node.width);
        minY = Math.min(minY, node.y);
        maxY = Math.max(maxY, node.y + node.height);
      });

      const centerX = (minX + maxX) / 2;
      const centerY = (minY + maxY) / 2;

      flatNodes.forEach((node) => {
        const geometry = new THREE.BoxGeometry(node.width, node.height, 1);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: SCENE_CONFIG.WIREFRAME_COLOR });
        const wireframe = new THREE.LineSegments(edges, material);

        const x = node.x - centerX + node.width / 2 + 375;
        const y = -(node.y - centerY + node.height / 2);
        const z = node.depth * SCENE_CONFIG.DEPTH_OFFSET;

        wireframe.position.set(x, y, z);
        wireframe.userData = { nodeInfo: node, type: 'wireframe' };
        group.add(wireframe);
        worldYPositions.push(y - node.height / 2);

        const fillGeometry = new THREE.PlaneGeometry(node.width, node.height);
        const fillMaterial = new THREE.MeshBasicMaterial({
          color: SCENE_CONFIG.HOVER_COLOR,
          transparent: true,
          opacity: 0,
          side: THREE.DoubleSide,
          depthTest: false,
        });
        const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
        fillMesh.position.set(x, y, z);
        fillMesh.userData = { nodeInfo: node, type: 'fill', originalOpacity: 0 };
        group.add(fillMesh);
        fillMeshes.push(fillMesh);

        const labelData = createLabelTexture(node.id);
        if (labelData) {
          const labelHeight = 24;
          const labelWidth = labelHeight * labelData.aspectRatio;

          if (labelWidth <= node.width) {
            const labelMaterial = new THREE.MeshBasicMaterial({
              map: labelData.texture,
              transparent: true,
              side: THREE.DoubleSide,
            });

            const labelGeometry = new THREE.PlaneGeometry(labelWidth, labelHeight);
            const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);

            const padding = 4;
            const labelX = x - node.width / 2 + labelWidth / 2 + padding;
            const labelY = y + node.height / 2 - labelHeight / 2 - padding;

            labelMesh.position.set(labelX, labelY, z + 1);
            group.add(labelMesh);
          }
        }
      });

      scene.add(group);

      const sceneSize = Math.max(maxX - minX, maxY - minY);
      const maxDepth = flatNodes.reduce((max, n) => Math.max(max, n.depth), 0);
      const depthSize = maxDepth * SCENE_CONFIG.DEPTH_OFFSET;

      const canvas = renderer.domElement;
      const aspect = canvas.width / canvas.height;
      const fitHeight = Math.max(sceneSize, depthSize, 1200);
      const fitWidth = fitHeight * aspect;

      const groundSize = Math.max(4000, fitWidth * 2, fitHeight * 2);
      const lowestY = worldYPositions.length ? Math.min(...worldYPositions) : -groundSize / 4;
      const groundY = lowestY - 100;

      const groundGeometry = new THREE.PlaneGeometry(groundSize, groundSize);
      const groundMaterial = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.18 });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.set(0, groundY, 0);
      ground.receiveShadow = true;
      scene.add(ground);

      const gridHelper = new THREE.GridHelper(6000, 50);
      gridHelper.position.y = -199;
      gridHelper.material.opacity = 0.25;
      gridHelper.position.set(ground.position.x, groundY + 0.1, ground.position.z);
      scene.add(gridHelper);

      const fov = camera.fov * (Math.PI / 180);
      const distance = Math.abs(fitHeight / (2 * Math.tan(fov / 2)));

      camera.position.set(0, fitHeight * 0.6, distance * 1.5);
      controls.target.set(0, 0, 0);
      controls.update();

      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const updateHighlights = () => {
        fillMeshes.forEach((mesh) => {
          const info = mesh.userData.nodeInfo;
          const isSelected = selectionRef.current === info.id;
          const isHovered = hoverRef.current === info.id;

          const material = mesh.material as THREE.MeshBasicMaterial;

          if (isSelected) {
            material.color.setHex(SCENE_CONFIG.SELECTED_FILL_COLOR);
            material.opacity = 0.3;
          } else if (isHovered) {
            material.color.setHex(SCENE_CONFIG.HOVER_COLOR);
            material.opacity = 0.2;
          } else {
            material.opacity = 0;
          }
          material.needsUpdate = true;
        });
      };

      const onMouseMove = (event: MouseEvent) => {
        if (isSpacePanningRef.current) {
          renderer.domElement.style.cursor = 'move';
          return;
        }
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(fillMeshes, false);

        if (intersects.length > 0) {
          const hit = intersects[0];
          const info = hit.object.userData.nodeInfo;

          if (hoverRef.current !== info.id) {
            hoverRef.current = info.id;
            updateHighlights();
            renderer.domElement.style.cursor = 'pointer';
          }
        } else {
          if (hoverRef.current !== null) {
            hoverRef.current = null;
            updateHighlights();
            renderer.domElement.style.cursor = 'grab';
          }
        }
      };

      const onClick = (event: MouseEvent) => {
        if (isSpacePanningRef.current) return;

        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(fillMeshes, false);

        if (intersects.length > 0) {
          const hit = intersects[0];
          const info = hit.object.userData.nodeInfo;

          selectionRef.current = info.id;
          setSelectedNode(info);
        } else {
          selectionRef.current = null;
          setSelectedNode(null);
        }
        updateHighlights();
      };

      const onMouseDown = () => {
        isMouseDownRef.current = true;
        if (isSpacePanningRef.current) {
          renderer.domElement.style.cursor = 'move';
        } else {
          renderer.domElement.style.cursor = 'grabbing';
        }
      };

      const onMouseUp = () => {
        isMouseDownRef.current = false;
        if (isSpacePanningRef.current) {
          renderer.domElement.style.cursor = 'move';
        } else {
          renderer.domElement.style.cursor = hoverRef.current ? 'pointer' : 'grab';
        }
      };

      const onKeyDown = (event: KeyboardEvent) => {
        if (event.code === 'Space' && !isSpacePanningRef.current) {
          isSpacePanningRef.current = true;
          controls.mouseButtons = {
            LEFT: THREE.MOUSE.PAN,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.ROTATE,
          } as any;

          renderer.domElement.style.cursor = 'move';
          event.preventDefault();
        }
      };

      const onKeyUp = (event: KeyboardEvent) => {
        if (event.code === 'Space') {
          isSpacePanningRef.current = false;
          controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY,
            RIGHT: THREE.MOUSE.PAN,
          } as any;

          renderer.domElement.style.cursor = hoverRef.current ? 'pointer' : 'grab';
        }
      };

      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('click', onClick);
      renderer.domElement.addEventListener('mousedown', onMouseDown);
      renderer.domElement.addEventListener('mouseup', onMouseUp);
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);

      const animate = () => {
        requestRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      return () => {
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        renderer.domElement.removeEventListener('click', onClick);
        renderer.domElement.removeEventListener('mousedown', onMouseDown);
        renderer.domElement.removeEventListener('mouseup', onMouseUp);
        window.removeEventListener('keydown', onKeyDown);
        window.removeEventListener('keyup', onKeyUp);
      };
    };

    setTimeout(() => {
      initScene();
    }, 100);

    return () => {
      if (requestRef.current !== null) cancelAnimationFrame(requestRef.current);
      if (rendererRef.current) {
        rendererRef.current.dispose();
      }
      if (sceneRef.current) {
        sceneRef.current.traverse((object) => {
          if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Sprite) {
            if ((object as any).geometry) (object as any).geometry.dispose();
            if ((object as any).material) (object as any).material.dispose();
          }
        });
      }
    };
  }, [open, flatNodes]);

  const handleClose = () => {
    Modal.confirm({
      title: '确认关闭',
      content: '关闭 3D 结构预览前请确认。',
      okText: '确认',
      cancelText: '取消',
      onOk: () => onClose(),
    });
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      title={
        <div className='dsl-3d-inspect-modal__title'>
          <span>DSL 3D Structure Inspector</span>
          <Button size='small' danger onClick={handleClose}>
            关闭
          </Button>
        </div>
      }
      width='100vw'
      footer={null}
      centered={false}
      destroyOnHidden
      closable={false}
      maskClosable={false}
      keyboard={false}
      rootClassName='dsl-3d-inspect-modal'>
      <div className='dsl-3d-inspect-modal__layout'>
        <div className='dsl-3d-inspect-modal__viewport' data-testid='dsl-3d-modal-container'>
          <div ref={containerRef} className='dsl-3d-inspect-modal__canvas' />
        </div>

        <div className='dsl-3d-inspect-modal__sidebar'>
          <div className='dsl-3d-inspect-modal__sidebar-header'>
            <span>Selected Node Preview</span>
            {tmpDSLData?.dsl?.nodes?.[0]?.id ? (
              <Button
                size='small'
                onClick={() => {
                  if (tmpDSLData.dsl.nodes[0].hidden) {
                    designDetectionActions.showDSLNodeById(tmpDSLData.dsl.nodes[0].id);
                  } else {
                    designDetectionActions.hideDSLNodeById(tmpDSLData.dsl.nodes[0].id);
                  }
                }}>
                {tmpDSLData.dsl.nodes[0].hidden ? '显示节点' : '隐藏节点'}
              </Button>
            ) : null}
          </div>
          <div className='dsl-3d-inspect-modal__sidebar-body'>
            {tmpDSLData ? (
              <div className='dsl-3d-inspect-modal__preview'>
                <DSLElement dslData={tmpDSLData} />
              </div>
            ) : (
              <div className='dsl-3d-inspect-modal__empty'>Click on a wireframe box to view details</div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DSL3DInspectModal;
