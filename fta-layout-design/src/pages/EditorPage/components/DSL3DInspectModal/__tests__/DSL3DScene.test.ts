import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { DSL3DScene } from '../DSL3DScene';
import nodes1 from '../nodes1.json';
import nodes2 from '../nodes2.json';

// Mock DOM globals for Node environment
const mockCanvas = {
  width: 0,
  height: 0,
  style: {},
  getContext: vi.fn(() => ({
    font: '',
    measureText: vi.fn(() => ({ width: 10 })),
    clearRect: vi.fn(),
    fillStyle: '',
    textBaseline: '',
    fillText: vi.fn(),
  })),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
};

const mockContainer = {
  clientWidth: 1000,
  clientHeight: 800,
  appendChild: vi.fn(),
  removeChild: vi.fn(),
  contains: vi.fn(() => true),
} as unknown as HTMLElement;

// Setup global mocks
global.document = {
  createElement: vi.fn((tag) => {
    if (tag === 'canvas') return mockCanvas;
    return { style: {} };
  }),
} as any;

global.window = {
  devicePixelRatio: 1,
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
} as any;

global.requestAnimationFrame = vi.fn();
global.cancelAnimationFrame = vi.fn();
global.MouseEvent = vi.fn() as any;
global.KeyboardEvent = vi.fn() as any;

// Mock THREE.js
vi.mock('three', async () => {
  return {
    WebGLRenderer: vi.fn().mockImplementation(() => ({
      setSize: vi.fn(),
      setPixelRatio: vi.fn(),
      render: vi.fn(),
      dispose: vi.fn(),
      domElement: mockCanvas,
      shadowMap: { enabled: false },
    })),
    Scene: vi.fn().mockImplementation(() => ({
      add: vi.fn(),
      remove: vi.fn(),
      children: [],
      traverse: vi.fn(),
      background: null,
    })),
    PerspectiveCamera: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn() },
      aspect: 1,
      updateProjectionMatrix: vi.fn(),
      fov: 60,
    })),
    OrbitControls: vi.fn(),
    Group: vi.fn().mockImplementation(() => ({
      add: vi.fn(function (this: any, child: any) {
        this.children.push(child);
      }),
      remove: vi.fn(function (this: any, child: any) {
        const index = this.children.indexOf(child);
        if (index > -1) this.children.splice(index, 1);
      }),
      children: [],
    })),
    BoxGeometry: vi.fn(),
    EdgesGeometry: vi.fn(),
    LineBasicMaterial: vi.fn(),
    LineSegments: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn() },
      scale: { set: vi.fn() },
      userData: {},
      geometry: { dispose: vi.fn() },
      material: { dispose: vi.fn() },
    })),
    PlaneGeometry: vi.fn(),
    MeshBasicMaterial: vi.fn(),
    Mesh: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn() },
      userData: {},
      geometry: { dispose: vi.fn() },
      material: { dispose: vi.fn(), color: { setHex: vi.fn() } },
      rotation: { x: 0 },
    })),
    CanvasTexture: vi.fn(),
    Raycaster: vi.fn(),
    Vector2: vi.fn(),
    Color: vi.fn(),
    AmbientLight: vi.fn(),
    DirectionalLight: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn() },
    })),
    AxesHelper: vi.fn(),
    GridHelper: vi.fn().mockImplementation(() => ({
      position: { set: vi.fn(), y: 0 },
      material: { opacity: 0 },
    })),
    ShadowMaterial: vi.fn(),
    DoubleSide: 2,
  };
});

vi.mock('three/examples/jsm/controls/OrbitControls.js', () => ({
  OrbitControls: vi.fn().mockImplementation(() => ({
    enableDamping: false,
    update: vi.fn(),
    target: { set: vi.fn() },
  })),
}));

vi.mock('@tweenjs/tween.js', () => ({
  default: {
    Tween: vi.fn().mockImplementation(() => ({
      to: vi.fn().mockReturnThis(),
      easing: vi.fn().mockReturnThis(),
      start: vi.fn().mockReturnThis(),
      delay: vi.fn().mockReturnThis(),
    })),
    Easing: { Elastic: { Out: vi.fn() } },
    update: vi.fn(),
  },
}));

describe('DSL3DScene updateNodes', () => {
  let scene: DSL3DScene;

  beforeEach(() => {
    scene = new DSL3DScene(mockContainer);
  });

  afterEach(() => {
    scene.dispose();
  });

  it('should handle update from nodes1 to nodes2 correctly', () => {
    // Initial load
    console.log('Loading nodes1...');
    scene.updateNodes(nodes1 as any);

    const group = (scene as any).group;
    const initialChildrenCount = group.children.length;
    console.log(`Nodes1 loaded. Group children count: ${initialChildrenCount}`);

    expect(initialChildrenCount).toBeGreaterThan(0);

    // Update to nodes2
    console.log('Updating to nodes2...');
    scene.updateNodes(nodes2 as any);

    const finalChildrenCount = group.children.length;
    console.log(`Nodes2 loaded. Group children count: ${finalChildrenCount}`);

    // Check for duplicates
    const nodeIds = new Set();
    const duplicates: string[] = [];

    group.children.forEach((child: any) => {
      if (child.userData && child.userData.nodeId) {
        const key = `${child.userData.nodeId}-${child.userData.type}`;
        if (nodeIds.has(key)) {
          duplicates.push(key);
        }
        nodeIds.add(key);
      }
    });

    if (duplicates.length > 0) {
      console.error('Found duplicates:', duplicates);
    }
    expect(duplicates).toHaveLength(0);
  });
});
