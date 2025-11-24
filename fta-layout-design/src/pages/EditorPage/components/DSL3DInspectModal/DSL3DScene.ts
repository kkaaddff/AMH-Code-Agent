import { DSLNode } from '@/types/dsl';
import TWEEN from '@tweenjs/tween.js';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface NodeComponents {
  wireframe?: THREE.LineSegments;
  fill?: THREE.Mesh;
  label?: THREE.Mesh;
  nodeInfo?: DSLNodeInfo;
}

export interface DSLNodeInfo {
  id: string;
  name?: string;
  type: string;
  width: number;
  height: number;
  x: number;
  y: number;
  depth: number;
  rawNode: DSLNode;
}

export interface DSL3DSceneOptions {
  onSelect?: (node: DSLNodeInfo | null) => void;
  onHover?: (node: DSLNodeInfo | null) => void;
}

const SCENE_CONFIG = {
  BG_COLOR: 0xf0f2f5,
  WIREFRAME_COLOR: 0x1890ff,
  SELECTED_COLOR: 0xff4d4f,
  HOVER_COLOR: 0x40a9ff,
  SELECTED_FILL_COLOR: 0xd4380d,
  TEXT_COLOR: 0x000000,
  DEPTH_OFFSET: 150,
  BASE_SCALE: 0.01,
};

const ORBIT_CONTROLS_CONFIG = {
  ENABLE_DAMPING: true,
  DAMPING_FACTOR: 0.05,
  ROTATE_SPEED: 0.5,
  PAN_SPEED: 0.5,
  FOV: 30,
};

export class DSL3DScene {
  private container: HTMLElement;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private controls: OrbitControls;
  private requestAnimationId: number | null = null;
  private options: DSL3DSceneOptions;

  private raycaster: THREE.Raycaster;
  private mouse: THREE.Vector2;
  private fillMeshes: THREE.Mesh[] = [];
  private group: THREE.Group;

  private ground: THREE.Mesh;
  private gridHelper: THREE.GridHelper;

  private hoveredNodeId: string | null = null;
  private selectedNodeId: string | null = null;

  private isSpacePanning: boolean = false;
  private isMouseDown: boolean = false;
  private hasDragged: boolean = false;
  private lastMousePosition: { x: number; y: number } | null = null;
  private readonly dragThreshold = 5;

  constructor(container: HTMLElement, options: DSL3DSceneOptions = {}) {
    console.log('DSL3DScene constructor ====');
    this.container = container;
    this.options = options;

    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xffffff);

    // Camera
    this.camera = new THREE.PerspectiveCamera(ORBIT_CONTROLS_CONFIG.FOV, width / height, 0.1, 10000);
    this.camera.position.set(0, 0, 1000);

    // Renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.shadowMap.enabled = true;
    this.renderer.domElement.style.cursor = 'grab';
    container.appendChild(this.renderer.domElement);

    // Controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = ORBIT_CONTROLS_CONFIG.ENABLE_DAMPING;
    this.controls.dampingFactor = ORBIT_CONTROLS_CONFIG.DAMPING_FACTOR;
    this.controls.rotateSpeed = ORBIT_CONTROLS_CONFIG.ROTATE_SPEED;
    this.controls.panSpeed = ORBIT_CONTROLS_CONFIG.PAN_SPEED * 2;
    this.controls.screenSpacePanning = true;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xf0f0f0, 1.2);
    this.scene.add(ambientLight);
    const dirLight = new THREE.DirectionalLight(0xffffff, 0.5);
    dirLight.position.set(10, 10, 10);
    this.scene.add(dirLight);

    // Helpers
    const axesHelper = new THREE.AxesHelper(500);
    this.scene.add(axesHelper);

    // Ground (Initial)
    const groundGeometry = new THREE.PlaneGeometry(4000, 4000);
    const groundMaterial = new THREE.ShadowMaterial({ color: 0x000000, opacity: 0.18 });
    this.ground = new THREE.Mesh(groundGeometry, groundMaterial);
    this.ground.rotation.x = -Math.PI / 2;
    this.ground.position.set(0, -200, 0);
    this.ground.receiveShadow = true;
    this.scene.add(this.ground);

    // Grid Helper (Initial)
    this.gridHelper = new THREE.GridHelper(6000, 50);
    this.gridHelper.position.y = -199;
    this.gridHelper.material.opacity = 0.25;
    this.scene.add(this.gridHelper);

    // Group for nodes
    this.group = new THREE.Group();
    this.scene.add(this.group);

    // Raycaster
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    // Event Listeners
    this.bindEvents();

    // Start Animation Loop
    this.animate();
  }

  private bindEvents() {
    this.renderer.domElement.addEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.addEventListener('click', this.onClick);
    this.renderer.domElement.addEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('resize', this.onResize);
  }

  private unbindEvents() {
    this.renderer.domElement.removeEventListener('mousemove', this.onMouseMove);
    this.renderer.domElement.removeEventListener('click', this.onClick);
    this.renderer.domElement.removeEventListener('mousedown', this.onMouseDown);
    this.renderer.domElement.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    window.removeEventListener('resize', this.onResize);
  }

  private onResize = () => {
    if (!this.container) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  };

  private onMouseMove = (event: MouseEvent) => {
    if (this.isMouseDown && this.lastMousePosition) {
      const deltaX = event.clientX - this.lastMousePosition.x;
      const deltaY = event.clientY - this.lastMousePosition.y;
      if (!this.hasDragged && Math.hypot(deltaX, deltaY) > this.dragThreshold) {
        this.hasDragged = true;
      }
    }

    if (this.isSpacePanning) {
      this.renderer.domElement.style.cursor = 'move';
      return;
    }
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.fillMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const info = hit.object.userData.nodeInfo;

      if (this.hoveredNodeId !== info.id) {
        this.hoveredNodeId = info.id;
        this.updateHighlights();
        this.renderer.domElement.style.cursor = 'pointer';
        if (this.options.onHover) this.options.onHover(info);
      }
    } else {
      if (this.hoveredNodeId !== null) {
        this.hoveredNodeId = null;
        this.updateHighlights();
        this.renderer.domElement.style.cursor = 'grab';
        if (this.options.onHover) this.options.onHover(null);
      }
    }
  };

  private onClick = (event: MouseEvent) => {
    if (this.isSpacePanning) return;
    if (this.hasDragged) {
      this.hasDragged = false;
      return;
    }

    const rect = this.renderer.domElement.getBoundingClientRect();
    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.fillMeshes, false);

    if (intersects.length > 0) {
      const hit = intersects[0];
      const info = hit.object.userData.nodeInfo;

      this.selectedNodeId = info.id;
      if (this.options.onSelect) this.options.onSelect(info);
    } else {
      return;
    }
    this.updateHighlights();
  };

  private onMouseDown = (event: MouseEvent) => {
    this.isMouseDown = true;
    this.hasDragged = false;
    this.lastMousePosition = { x: event.clientX, y: event.clientY };
    if (this.isSpacePanning) {
      this.renderer.domElement.style.cursor = 'move';
    } else {
      this.renderer.domElement.style.cursor = 'grabbing';
    }
  };

  private onMouseUp = () => {
    this.isMouseDown = false;
    this.lastMousePosition = null;
    if (this.isSpacePanning) {
      this.renderer.domElement.style.cursor = 'move';
    } else {
      this.renderer.domElement.style.cursor = this.hoveredNodeId ? 'pointer' : 'grab';
    }
  };

  private onKeyDown = (event: KeyboardEvent) => {
    if (event.code === 'Escape') {
      this.clearSelection();
      return;
    }
    if (event.code === 'Space' && !this.isSpacePanning) {
      this.isSpacePanning = true;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.PAN,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.ROTATE,
      } as any;
      this.renderer.domElement.style.cursor = 'move';
      event.preventDefault();
    }
  };

  private onKeyUp = (event: KeyboardEvent) => {
    if (event.code === 'Space') {
      this.isSpacePanning = false;
      this.controls.mouseButtons = {
        LEFT: THREE.MOUSE.ROTATE,
        MIDDLE: THREE.MOUSE.DOLLY,
        RIGHT: THREE.MOUSE.PAN,
      } as any;
      this.renderer.domElement.style.cursor = this.hoveredNodeId ? 'pointer' : 'grab';
    }
  };

  private clearSelection() {
    if (this.selectedNodeId !== null) {
      this.selectedNodeId = null;
      if (this.options.onSelect) this.options.onSelect(null);
      this.updateHighlights();
      this.renderer.domElement.style.cursor = this.hoveredNodeId ? 'pointer' : 'grab';
    }
  }

  private updateHighlights() {
    const selectedInfo = this.selectedNodeId ? this.nodeComponentsMap.get(this.selectedNodeId)?.nodeInfo : null;
    const descendantDepthMap = new Map<string, number>();

    if (selectedInfo?.rawNode) {
      const collectDescendants = (node: DSLNode, depth: number) => {
        if (!node || !node.id) return;
        descendantDepthMap.set(node.id, depth);

        const children = Array.isArray(node.children)
          ? node.children
          : // : Array.isArray(node.layers) ? node.layers
            [];

        children.forEach((child) => collectDescendants(child, depth + 1));
      };

      collectDescendants(selectedInfo.rawNode, 0);
    }

    const baseSelectedColor = new THREE.Color(SCENE_CONFIG.SELECTED_FILL_COLOR);
    const white = new THREE.Color(0xffffff);

    this.fillMeshes.forEach((mesh) => {
      const material = mesh.material as THREE.MeshBasicMaterial;
      const info = mesh.userData.nodeInfo as DSLNodeInfo;
      const isHovered = this.hoveredNodeId === info.id;
      const depth = descendantDepthMap.get(info.id);

      if (depth !== undefined) {
        const lightenFactor = Math.min(0.6, depth * 0.12); // 子节点越深越浅
        const color = baseSelectedColor.clone().lerp(white, lightenFactor);
        const opacity = Math.max(0.08, 0.3 - depth * 0.04);

        material.color.copy(color);
        material.opacity = opacity;
      } else if (isHovered) {
        material.color.setHex(SCENE_CONFIG.HOVER_COLOR);
        material.opacity = 0.2;
      } else {
        material.opacity = 0;
      }
      material.needsUpdate = true;
    });
  }

  private createLabelTexture(text: string) {
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
  }

  private nodeComponentsMap: Map<string, NodeComponents> = new Map();

  public updateNodes(nodes: DSLNodeInfo[]) {
    if (nodes.length === 0) {
      this.clearAllNodes();
      return;
    }
    console.log('Updating nodes:', nodes);

    let minX = Infinity,
      maxX = -Infinity,
      minY = Infinity,
      maxY = -Infinity;

    nodes.forEach((node) => {
      minX = Math.min(minX, node.x);
      maxX = Math.max(maxX, node.x + node.width);
      minY = Math.min(minY, node.y);
      maxY = Math.max(maxY, node.y + node.height);
    });

    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;

    // --- Diffing Logic ---

    const newNodesMap = new Map<string, DSLNodeInfo>();
    nodes.forEach((node) => newNodesMap.set(node.id, node));

    // 1. Identify Removed Nodes
    const nodesToRemove: string[] = [];
    this.nodeComponentsMap.forEach((_, id) => {
      if (!newNodesMap.has(id)) {
        nodesToRemove.push(id);
      }
    });

    // 2. Remove Nodes
    nodesToRemove.forEach((id) => {
      const components = this.nodeComponentsMap.get(id);
      if (components) {
        this.removeNodeComponents(components);
        this.nodeComponentsMap.delete(id);
      }
    });

    // 3. Add or Update Nodes
    nodes.forEach((node) => {
      const x = node.x - centerX + node.width / 2 + 375;
      const y = -(node.y - centerY + node.height / 2);
      const z = node.depth * SCENE_CONFIG.DEPTH_OFFSET;

      let components = this.nodeComponentsMap.get(node.id);

      if (components) {
        // --- Update Existing Node ---
        const oldNodeInfo = components.nodeInfo;
        const positionChanged =
          oldNodeInfo && (oldNodeInfo.x !== node.x || oldNodeInfo.y !== node.y || oldNodeInfo.depth !== node.depth);
        const sizeChanged = oldNodeInfo && (oldNodeInfo.width !== node.width || oldNodeInfo.height !== node.height);

        if (positionChanged || sizeChanged) {
          if (components.wireframe) components.wireframe.position.set(x, y, z);
          if (components.fill) components.fill.position.set(x, y, z);
          if (components.label) this.updateLabelPosition(components.label, node, centerX, centerY);

          if (sizeChanged) {
            // Recreate geometries
            if (components.wireframe) {
              components.wireframe.geometry.dispose();
              const newBoxGeometry = new THREE.BoxGeometry(node.width, node.height, 1);
              components.wireframe.geometry = new THREE.EdgesGeometry(newBoxGeometry);
            }
            if (components.fill) {
              components.fill.geometry.dispose();
              components.fill.geometry = new THREE.PlaneGeometry(node.width, node.height);
            }
          }
        }
        // Update reference
        if (components.wireframe) components.wireframe.userData.nodeInfo = node;
        if (components.fill) components.fill.userData.nodeInfo = node;
        if (components.label) components.label.userData.nodeInfo = node;
        components.nodeInfo = node;
      } else {
        // --- Add New Node ---
        this.createNodeComponents(node, x, y, z, centerX, centerY);
      }
    });

    this.updateGroundAndCamera(nodes, minX, maxX, minY, maxY, (fitHeight) => {
      // Only adjust camera if it's the very first update
      if (!this.cameraInitialized) {
        const fov = this.camera.fov * (Math.PI / 180);
        const distance = Math.abs(fitHeight / (2 * Math.tan(fov / 2)));

        this.camera.position.set(0, fitHeight * 0.6, distance * 1.5);
        this.controls.target.set(0, 0, 0);
        this.controls.update();
        this.cameraInitialized = true;
      }
    });
    this.updateHighlights();
  }

  private clearAllNodes() {
    this.nodeComponentsMap.forEach((components) => {
      this.removeNodeComponents(components);
    });
    this.nodeComponentsMap.clear();
    this.fillMeshes = [];
  }

  private removeNodeComponents(components: NodeComponents) {
    if (components.wireframe) {
      this.group.remove(components.wireframe);
      components.wireframe.geometry.dispose();
      if (Array.isArray(components.wireframe.material)) {
        components.wireframe.material.forEach((m) => m.dispose());
      } else {
        components.wireframe.material.dispose();
      }
    }
    if (components.fill) {
      this.group.remove(components.fill);
      components.fill.geometry.dispose();
      if (Array.isArray(components.fill.material)) {
        components.fill.material.forEach((m) => m.dispose());
      } else {
        components.fill.material.dispose();
      }
      const index = this.fillMeshes.indexOf(components.fill);
      if (index > -1) this.fillMeshes.splice(index, 1);
    }
    if (components.label) {
      this.group.remove(components.label);
      components.label.geometry.dispose();
      if (Array.isArray(components.label.material)) {
        components.label.material.forEach((m) => m.dispose());
      } else {
        components.label.material.dispose();
      }
    }
  }

  private createNodeComponents(node: DSLNodeInfo, x: number, y: number, z: number, centerX: number, centerY: number) {
    const components: NodeComponents = { nodeInfo: node };

    // Wireframe
    const geometry = new THREE.BoxGeometry(node.width, node.height, 1);
    const edges = new THREE.EdgesGeometry(geometry);
    const material = new THREE.LineBasicMaterial({
      color: SCENE_CONFIG.WIREFRAME_COLOR,
      transparent: true,
      opacity: 0,
    });
    const wireframe = new THREE.LineSegments(edges, material);
    wireframe.position.set(x, y, z);
    wireframe.userData = { nodeInfo: node, type: 'wireframe', nodeId: node.id };

    // Animation
    wireframe.scale.set(0, 0, 0);
    new TWEEN.Tween(wireframe.scale).to({ x: 1, y: 1, z: 1 }, 500).easing(TWEEN.Easing.Elastic.Out).start();
    new TWEEN.Tween(material).to({ opacity: 1 }, 300).start();

    this.group.add(wireframe);
    components.wireframe = wireframe;

    // Fill
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
    fillMesh.userData = { nodeInfo: node, type: 'fill', originalOpacity: 0, nodeId: node.id };
    this.group.add(fillMesh);
    this.fillMeshes.push(fillMesh);
    components.fill = fillMesh;

    // Label
    const labelMesh = this.addLabel(node, centerX, centerY);
    if (labelMesh) {
      components.label = labelMesh;
    }

    this.nodeComponentsMap.set(node.id, components);
  }

  private updateGroundAndCamera(
    nodes: DSLNodeInfo[],
    minX: number,
    maxX: number,
    minY: number,
    maxY: number,
    onFitHeightCalculated: (fitHeight: number) => void
  ) {
    const sceneSize = Math.max(maxX - minX, maxY - minY);
    const maxDepth = nodes.reduce((max, n) => Math.max(max, n.depth), 0);
    const depthSize = maxDepth * SCENE_CONFIG.DEPTH_OFFSET;

    const canvas = this.renderer.domElement;
    const aspect = canvas.width / canvas.height;
    const fitHeight = Math.max(sceneSize, depthSize, 1200);
    const fitWidth = fitHeight * aspect;

    const groundSize = Math.max(4000, fitWidth * 2, fitHeight * 2);

    const centerY = (minY + maxY) / 2;
    let globalMinY = Infinity;
    nodes.forEach((node) => {
      const y = -(node.y - centerY + node.height / 2);
      globalMinY = Math.min(globalMinY, y - node.height / 2);
    });

    const lowestY = globalMinY !== Infinity ? globalMinY : -groundSize / 4;
    const groundY = lowestY - 100;

    // Update Ground
    this.ground.geometry.dispose();
    this.ground.geometry = new THREE.PlaneGeometry(groundSize, groundSize);
    this.ground.position.set(0, groundY, 0);

    // Update GridHelper
    this.gridHelper.position.set(0, groundY + 0.1, 0);

    onFitHeightCalculated(fitHeight);
  }

  private cameraInitialized = false;

  private addLabel(node: DSLNodeInfo, centerX: number, centerY: number): THREE.Mesh | null {
    const labelData = this.createLabelTexture(node.id);
    if (labelData) {
      const labelHeight = 24;
      const labelWidth = labelHeight * labelData.aspectRatio;

      if (labelWidth <= node.width) {
        const labelMaterial = new THREE.MeshBasicMaterial({
          map: labelData.texture,
          transparent: true,
          side: THREE.DoubleSide,
          opacity: 0,
        });

        const labelGeometry = new THREE.PlaneGeometry(labelWidth, labelHeight);
        const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);

        this.updateLabelPosition(labelMesh, node, centerX, centerY);
        labelMesh.userData = { type: 'label', nodeId: node.id, nodeInfo: node };

        // Animate label
        new TWEEN.Tween(labelMaterial).to({ opacity: 1 }, 500).delay(200).start();

        this.group.add(labelMesh);
        return labelMesh;
      }
    }
    return null;
  }

  private updateLabelPosition(labelMesh: THREE.Mesh, node: DSLNodeInfo, centerX: number, centerY: number) {
    const labelData = this.createLabelTexture(node.id); // Re-create to get aspect ratio
    if (!labelData) return;

    const labelHeight = 24;
    const labelWidth = labelHeight * labelData.aspectRatio;

    const padding = 4;
    const x = node.x - centerX + node.width / 2 + 375;
    const y = -(node.y - centerY + node.height / 2);
    const z = node.depth * SCENE_CONFIG.DEPTH_OFFSET;

    const labelX = x - node.width / 2 + labelWidth / 2 + padding;
    const labelY = y + node.height / 2 - labelHeight / 2 - padding;

    labelMesh.position.set(labelX, labelY, z + 1);
  }

  private animate = () => {
    this.requestAnimationId = requestAnimationFrame(this.animate);
    TWEEN.update();
    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  };

  public dispose() {
    if (this.requestAnimationId !== null) {
      cancelAnimationFrame(this.requestAnimationId);
    }
    this.unbindEvents();
    this.renderer.dispose();

    // Dispose scene objects
    this.scene.traverse((object) => {
      if (object instanceof THREE.Mesh || object instanceof THREE.LineSegments || object instanceof THREE.Sprite) {
        if ((object as any).geometry) (object as any).geometry.dispose();
        if ((object as any).material) {
          if (Array.isArray((object as any).material)) {
            (object as any).material.forEach((m: any) => m.dispose());
          } else {
            (object as any).material.dispose();
          }
        }
      }
    });

    if (this.container.contains(this.renderer.domElement)) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
