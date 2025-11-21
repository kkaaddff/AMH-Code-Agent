import DSLElement from '@/components/DSLElement';
import { DesignDSL, DSLNode } from '@/types/dsl';
import { Button, Modal } from 'antd';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { useSnapshot } from 'valtio';
import { designDetectionActions, designDetectionStore } from '../contexts/DesignDetectionContext';

import { COLOR_CONFIG, ORBIT_CONTROLS_CONFIG, RENDERER_CONFIG } from '../constants/Three3DInspectConstants';

// Constants for the 3D scene
const SCENE_CONFIG = {
  BG_COLOR: 0xf0f2f5,
  WIREFRAME_COLOR: 0x1890ff,
  SELECTED_COLOR: 0xff4d4f,
  HOVER_COLOR: 0x40a9ff, // Light blue for hover
  SELECTED_FILL_COLOR: 0xff7875, // Light red for selection
  TEXT_COLOR: 0x000000,
  DEPTH_OFFSET: 150, // Increased layer spacing
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

  // Track hover/selection state for 3D objects
  const hoverRef = useRef<string | null>(null);
  const selectionRef = useRef<string | null>(null);

  const [selectedNode, setSelectedNode] = useState<DSLNodeInfo | null>(null);

  // Flatten the DSL tree into a list of renderable items with absolute positions
  const flatNodes = useMemo(() => {
    console.log('DSL3DInspectModal: Recalculating flatNodes', { dslDataPresent: !!dslData });
    if (!dslData) return [];

    const nodes: DSLNodeInfo[] = [];

    const traverse = (node: any, depth: number, parentX: number, parentY: number) => {
      if (!node) return;

      const layout = node.layoutStyle || {};
      const width = layout.width || 0;
      const height = layout.height || 0;

      // Calculate absolute position
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

    // Handle DesignDSL structure (wrapper object)
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

  // Construct temporary DSL data for the selected node to render in the side panel
  const tmpDSLData: DesignDSL | null = useMemo(() => {
    if (!selectedNode || !dslData) return null;

    // Ensure the node is a valid DSLNode
    // The rawNode from flatNodes should be the original DSL node object
    const targetNode = selectedNode.rawNode as DSLNode;

    return {
      ...dslData,
      dsl: {
        ...dslData.dsl,
        nodes: [targetNode],
      },
    };
  }, [selectedNode, dslData]);

  // Create a texture for the ID label
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

    // Transparent background
    ctx.clearRect(0, 0, width, height);

    // Text
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

    console.log('DSL3DInspectModal: Initializing scene...', { open, flatNodesLength: flatNodes.length });

    // Cleanup previous scene
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

      // Setup Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(RENDERER_CONFIG.CLEAR_COLOR);
      sceneRef.current = scene;

      // Setup Camera
      const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 10000);
      camera.position.set(0, 0, 1000);
      cameraRef.current = camera;

      // Setup Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      containerRef.current.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Setup Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = ORBIT_CONTROLS_CONFIG.ENABLE_DAMPING;
      controls.dampingFactor = ORBIT_CONTROLS_CONFIG.DAMPING_FACTOR;
      controls.rotateSpeed = ORBIT_CONTROLS_CONFIG.ROTATE_SPEED;
      controls.panSpeed = ORBIT_CONTROLS_CONFIG.PAN_SPEED;
      controlsRef.current = controls;

      // Lights
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
      scene.add(ambientLight);
      const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
      dirLight.position.set(10, 10, 10);
      scene.add(dirLight);

      // Coordinate System
      const axesHelper = new THREE.AxesHelper(500);
      scene.add(axesHelper);

      // Build Meshes
      const group = new THREE.Group();
      const fillMeshes: THREE.Mesh[] = [];

      // Calculate center
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
        // 1. Wireframe Box
        const geometry = new THREE.BoxGeometry(node.width, node.height, 1);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({ color: SCENE_CONFIG.WIREFRAME_COLOR });
        const wireframe = new THREE.LineSegments(edges, material);

        // Position
        // Offset X by 375 as requested
        const x = node.x - centerX + node.width / 2 + 375;
        const y = -(node.y - centerY + node.height / 2);
        const z = node.depth * SCENE_CONFIG.DEPTH_OFFSET;

        wireframe.position.set(x, y, z);
        wireframe.userData = { nodeInfo: node, type: 'wireframe' };
        group.add(wireframe);

        // 2. Fill Mesh (for hover/click highlight)
        // Use PlaneGeometry to fill the face
        const fillGeometry = new THREE.PlaneGeometry(node.width, node.height);
        const fillMaterial = new THREE.MeshBasicMaterial({
          color: SCENE_CONFIG.HOVER_COLOR,
          transparent: true,
          opacity: 0, // Invisible by default
          side: THREE.DoubleSide,
          depthTest: false, // Ensure it renders on top/with wireframe without z-fighting issues if offset slightly
        });
        const fillMesh = new THREE.Mesh(fillGeometry, fillMaterial);
        fillMesh.position.set(x, y, z); // Same position
        fillMesh.userData = { nodeInfo: node, type: 'fill', originalOpacity: 0 };
        group.add(fillMesh);
        fillMeshes.push(fillMesh);

        // 3. ID Label (Planar Mesh)
        const labelData = createLabelTexture(node.id);
        if (labelData) {
          // Fixed height for label, width based on aspect ratio
          const labelHeight = 24;
          const labelWidth = labelHeight * labelData.aspectRatio;

          // Check if label fits inside the node width
          if (labelWidth <= node.width) {
            const labelMaterial = new THREE.MeshBasicMaterial({
              map: labelData.texture,
              transparent: true,
              side: THREE.DoubleSide,
            });

            const labelGeometry = new THREE.PlaneGeometry(labelWidth, labelHeight);
            const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);

            // Position: Inside Top-Left corner
            // Box center is (x,y). Top-left of box is (x - w/2, y + h/2).
            // Label center needs to be offset from that.
            const padding = 4;
            const labelX = x - node.width / 2 + labelWidth / 2 + padding;
            const labelY = y + node.height / 2 - labelHeight / 2 - padding;

            // Ensure z is slightly above the fill mesh to avoid z-fighting if they are coplanar
            // But fill mesh has depthTest: false so it shouldn't matter much, but let's be safe
            labelMesh.position.set(labelX, labelY, z + 1);
            group.add(labelMesh);
          }
        }
      });

      scene.add(group);

      // Adjust camera
      const sceneSize = Math.max(maxX - minX, maxY - minY);
      const maxDepth = flatNodes.reduce((max, n) => Math.max(max, n.depth), 0);
      const depthSize = maxDepth * SCENE_CONFIG.DEPTH_OFFSET;
      const fitHeight = Math.max(sceneSize, depthSize);
      const fov = camera.fov * (Math.PI / 180);
      const distance = Math.abs(fitHeight / (2 * Math.tan(fov / 2)));

      camera.position.z = distance * 1.5;
      controls.target.set(0, 0, depthSize / 2);
      controls.update();

      // Interaction
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
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        // Intersect with fill meshes for easier hit testing
        const intersects = raycaster.intersectObjects(fillMeshes, false);

        if (intersects.length > 0) {
          // Sort by distance (default) but also prioritize front layers if needed
          // Actually raycaster sorts by distance automatically.
          const hit = intersects[0];
          const info = hit.object.userData.nodeInfo;

          if (hoverRef.current !== info.id) {
            hoverRef.current = info.id;
            updateHighlights();
            // Change cursor
            renderer.domElement.style.cursor = 'pointer';
          }
        } else {
          if (hoverRef.current !== null) {
            hoverRef.current = null;
            updateHighlights();
            renderer.domElement.style.cursor = 'default';
          }
        }
      };

      const onClick = (event: MouseEvent) => {
        // If we have a hover, that's our click target (since mouse move updates hover)
        // But we should double check raycast to be sure (or just use hoverRef)
        // Let's re-raycast to be safe and consistent
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
          // Clicked empty space
          selectionRef.current = null;
          setSelectedNode(null);
        }
        updateHighlights();
      };

      renderer.domElement.addEventListener('mousemove', onMouseMove);
      renderer.domElement.addEventListener('click', onClick);

      // Animation Loop
      const animate = () => {
        requestRef.current = requestAnimationFrame(animate);
        controls.update();
        renderer.render(scene, camera);
      };
      animate();

      // Cleanup function for this effect
      return () => {
        renderer.domElement.removeEventListener('mousemove', onMouseMove);
        renderer.domElement.removeEventListener('click', onClick);
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

  return (
    <Modal
      open={open}
      onCancel={onClose}
      title='DSL 3D Structure Inspector'
      width={1500}
      footer={null}
      centered
      destroyOnHidden
      styles={{
        content: { background: COLOR_CONFIG.MODAL_CONTENT_BG },
        header: {
          background: COLOR_CONFIG.MODAL_HEADER_BG,
          borderBottom: `1px solid ${COLOR_CONFIG.MODAL_HEADER_BORDER}`,
          color: COLOR_CONFIG.MODAL_HEADER_TEXT,
        },
        body: { padding: 0, height: '80vh', overflow: 'hidden' },
      }}>
      <div style={{ display: 'flex', height: '100%', background: COLOR_CONFIG.MODAL_BG }}>
        {/* 3D Viewport */}
        <div style={{ flex: 1, position: 'relative' }} data-testid='dsl-3d-modal-container'>
          <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
        </div>

        {/* Side Panel */}
        <div
          style={{
            width: 400,
            borderLeft: '1px solid #eee',
            background: '#fff',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}>
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid #eee',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
            }}>
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
          <div style={{ flex: 1, overflow: 'auto', padding: '16px', position: 'relative' }}>
            {tmpDSLData ? (
              <div style={{ transform: 'scale(0.5)', transformOrigin: 'top left' }}>
                <DSLElement dslData={tmpDSLData} />
              </div>
            ) : (
              <div style={{ color: '#999', textAlign: 'center', marginTop: 40 }}>
                Click on a wireframe box to view details
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default DSL3DInspectModal;
