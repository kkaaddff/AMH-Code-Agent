import { dslService } from '@/services/dslService';
import { DesignData, DSLNode } from '@/types/dsl';
import type { DocumentReference } from '@/types/project';
import type { FlattenedDSLNode } from '../utils/DetectionCanvasV2Helper';
import { api } from '@/utils/apiService';
import { componentDetectionDebugLog } from '@/utils/componentDetectionDebug';
import { FileImageOutlined, ReloadOutlined } from '@ant-design/icons';
import { Button, Modal, Space, Typography } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { useMemo } from 'react';
import { proxy, useSnapshot } from 'valtio';

import { convertToTreeData, createRootAnnotationFromDesignDoc } from '../components/LayerTreePanel/utils';
import {
  AnnotationNode,
  AnnotationState,
  ComponentCategory,
  getComponentCategory,
  isContainerComponent,
  NodeType,
  SelectedNodeItem,
} from '../types/componentDetection';
import { saveAnnotationState } from '../utils/componentStorage';
import { editorPageStore } from './EditorPageContext';

type PartialExcept<T, K extends keyof T> = Partial<T> & Pick<T, K>;

const { Text } = Typography;

const VIRTUAL_ANNOTATION_PREFIX = 'virtual-annotation-';

//#region ==================== 工具函数 ====================

// 排序 AnnotationNode 的 children，按照坐标顺序：从上到下，从左到右
const sortAnnotationChildren = (node: AnnotationNode): AnnotationNode => {
  const sortedChildren = [...node.children].sort((a, b) => {
    const yDiff = a.absoluteY - b.absoluteY;
    if (Math.abs(yDiff) > 1) {
      return yDiff;
    }
    return a.absoluteX - b.absoluteX;
  });

  return {
    ...node,
    children: sortedChildren.map(sortAnnotationChildren),
  };
};

// 扁平化 Annotation 树
const flattenAnnotationTree = (root: AnnotationNode): AnnotationNode[] => {
  const result: AnnotationNode[] = [];
  const traverse = (node: AnnotationNode) => {
    result.push(node);
    node.children.forEach(traverse);
  };
  traverse(root);
  return result;
};

// 查找标注节点
const findAnnotationById = (id: string): AnnotationNode | null => {
  const search = (node: AnnotationNode): AnnotationNode | null => {
    if (node.id === id) return node;
    for (const child of node.children) {
      const found = search(child);
      if (found) return found;
    }
    return null;
  };

  if (designDetectionStore.rootAnnotation) {
    return search(designDetectionStore.rootAnnotation);
  }
  return null;
};

// 通过DSL节点ID查找标注
const findAnnotationByDSLNodeId = (dslNodeId: string): AnnotationNode | null => {
  const search = (node: AnnotationNode): AnnotationNode | null => {
    if (node.id === dslNodeId) return node;
    for (const child of node.children) {
      const found = search(child);
      if (found) return found;
    }
    return null;
  };

  if (designDetectionStore.rootAnnotation) {
    return search(designDetectionStore.rootAnnotation);
  }
  return null;
};

// 统一的DSL节点查找函数
const findDSLNodeById = (id: string): DSLNode | null => {
  if (!designDetectionStore.designData) return null;

  const search = (node: DSLNode | null): DSLNode | null => {
    if (!node) return null;
    if (node.id === id) return node;
    if (node.children) {
      for (const child of node.children) {
        const found = search(child);
        if (found) return found;
      }
    }
    return null;
  };

  return search(designDetectionStore.dslRootNode);
};

/** 扁平化 DSLNode 树，同时计算每个节点的绝对坐标 */
export const flattenDSLNodeTree = (root: DSLNode | null, hidden = false): FlattenedDSLNode[] => {
  if (!root) return [];
  const result: FlattenedDSLNode[] = [];
  const traverse = (node: DSLNode, parentX = 0, parentY = 0) => {
    if (hidden && (node.hidden || node.mask === 'outline')) return;
    const absoluteX = parentX + (node.layoutStyle?.relativeX || 0);
    const absoluteY = parentY + (node.layoutStyle?.relativeY || 0);
    result.push({ ...node, absoluteX, absoluteY });
    if (node.children && Array.isArray(node.children)) {
      node.children.forEach((child) => traverse(child, absoluteX, absoluteY));
    }
  };
  traverse(root);
  return result;
};

// 计算DSL节点的绝对坐标
const calculateDSLNodeAbsolutePosition = (targetNode: DSLNode): { x: number; y: number } => {
  if (!designDetectionStore.dslRootNode) return { x: 0, y: 0 };

  const findPath = (node: DSLNode, parentX = 0, parentY = 0): { x: number; y: number } | null => {
    const relativeX = node.layoutStyle?.relativeX || 0;
    const relativeY = node.layoutStyle?.relativeY || 0;
    const absoluteX = parentX + relativeX;
    const absoluteY = parentY + relativeY;

    if (node.id === targetNode.id) {
      return { x: absoluteX, y: absoluteY };
    }

    if (node.children) {
      for (const child of node.children) {
        const found = findPath(child, absoluteX, absoluteY);
        if (found) return found;
      }
    }

    return null;
  };

  return findPath(designDetectionStore.dslRootNode) || { x: 0, y: 0 };
};

// 查找最佳父节点
const findBestParent = (dslNode: DSLNode, rootAnnotation: AnnotationNode): AnnotationNode => {
  const dslAbsolutePos = calculateDSLNodeAbsolutePosition(dslNode);
  const dslX = dslAbsolutePos.x;
  const dslY = dslAbsolutePos.y;
  const dslWidth = dslNode.layoutStyle?.width || 0;
  const dslHeight = dslNode.layoutStyle?.height || 0;

  let bestParent = rootAnnotation;
  let smallestArea = rootAnnotation.width * rootAnnotation.height;

  const search = (node: AnnotationNode) => {
    if (!node.isContainer) return;

    const isInside =
      dslX >= node.absoluteX &&
      dslY >= node.absoluteY &&
      dslX + dslWidth <= node.absoluteX + node.width &&
      dslY + dslHeight <= node.absoluteY + node.height;

    if (isInside) {
      const area = node.width * node.height;
      if (area < smallestArea) {
        smallestArea = area;
        bestParent = node;
      }
      node.children.forEach(search);
    }
  };

  rootAnnotation.children.forEach(search);
  return bestParent;
};

// 边界计算辅助函数
const calculateContainerBounds = (
  children: AnnotationNode[]
): { minX: number; minY: number; maxX: number; maxY: number } => {
  if (children.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }

  const bounds = children.map((child) => ({
    x1: child.absoluteX,
    y1: child.absoluteY,
    x2: child.absoluteX + child.width,
    y2: child.absoluteY + child.height,
  }));

  return {
    minX: Math.min(...bounds.map((b) => b.x1)),
    minY: Math.min(...bounds.map((b) => b.y1)),
    maxX: Math.max(...bounds.map((b) => b.x2)),
    maxY: Math.max(...bounds.map((b) => b.y2)),
  };
};

// 查找父节点
const findParentAnnotation = (childId: string): AnnotationNode | null => {
  if (!designDetectionStore.rootAnnotation) return null;

  const search = (node: AnnotationNode): AnnotationNode | null => {
    for (const child of node.children) {
      if (child.id === childId) {
        return node;
      }
      const found = search(child);
      if (found) return found;
    }
    return null;
  };

  return search(designDetectionStore.rootAnnotation);
};

// 检查是否为祖先节点
const isAncestor = (ancestorId: string, descendantId: string): boolean => {
  const ancestor = findAnnotationById(ancestorId);
  if (!ancestor) return false;

  const checkDescendant = (node: AnnotationNode): boolean => {
    if (node.id === descendantId) return true;
    return node.children.some(checkDescendant);
  };

  return checkDescendant(ancestor);
};

// 查找能够包含所有选中节点的最小DSL节点
const findContainingDSLNode = (selectedAnnotations: AnnotationNode[], selectedDSLNodes: DSLNode[]): DSLNode | null => {
  if (!designDetectionStore.dslRootNode) return null;

  const bounds = [
    ...selectedAnnotations.map((a) => ({
      x: a.absoluteX,
      y: a.absoluteY,
      width: a.width,
      height: a.height,
    })),
    ...selectedDSLNodes.map((node) => {
      const pos = calculateDSLNodeAbsolutePosition(node);
      return {
        x: pos.x,
        y: pos.y,
        width: node.layoutStyle?.width || 0,
        height: node.layoutStyle?.height || 0,
      };
    }),
  ];

  const minX = Math.min(...bounds.map((item) => item.x));
  const minY = Math.min(...bounds.map((item) => item.y));
  const maxX = Math.max(...bounds.map((item) => item.x + item.width));
  const maxY = Math.max(...bounds.map((item) => item.y + item.height));

  let bestNode: DSLNode | null = null;
  let smallestArea = Infinity;

  const search = (node: DSLNode, parentX = 0, parentY = 0) => {
    const relativeX = node.layoutStyle?.relativeX || 0;
    const relativeY = node.layoutStyle?.relativeY || 0;
    const absoluteX = parentX + relativeX;
    const absoluteY = parentY + relativeY;
    const nodeWidth = node.layoutStyle?.width || 0;
    const nodeHeight = node.layoutStyle?.height || 0;

    const isAnnotated = findAnnotationByDSLNodeId(node.id);
    const isSelectedNode = selectedDSLNodes.some((n) => n.id === node.id);
    const contains =
      !isAnnotated &&
      !isSelectedNode &&
      minX >= absoluteX &&
      minY >= absoluteY &&
      maxX <= absoluteX + nodeWidth &&
      maxY <= absoluteY + nodeHeight;

    if (contains) {
      const area = nodeWidth * nodeHeight;
      if (area < smallestArea) {
        smallestArea = area;
        bestNode = node;
      }
    }

    node.children?.forEach((child) => search(child, absoluteX, absoluteY));
  };

  search(designDetectionStore.dslRootNode);
  return bestNode;
};

//#endregion ==================== 工具函数 ====================

// ==================== Valtio 状态存储 ====================

interface DesignDocumentDetectionState {
  rootAnnotation: AnnotationNode | null;
  readonly flatAnnotationList: AnnotationNode[];
  designData: DesignData | null;
  readonly dslRootNode: DSLNode | null;
  isLoading: boolean;
  error: string | null;
  versionToken: string | null;
}

interface DesignDetectionState extends AnnotationState {
  showAllBorders: boolean;
  selectedNodeIds: SelectedNodeItem[];
  designStoreMap: Record<string, DesignDocumentDetectionState>;
  designData: DesignData | null;
  readonly flatAnnotationList: AnnotationNode[];
  readonly dslRootNode: DSLNode | null;
  readonly flatDSLNodeList: FlattenedDSLNode[];
  readonly currentDesignId: string | undefined;
}

const createEmptyDesignDocumentState = (): DesignDocumentDetectionState => {
  const state = {
    rootAnnotation: null,
    designData: null as DesignData | null,
    isLoading: false,
    error: null,
    versionToken: null,
  };
  return {
    ...state,
    get flatAnnotationList() {
      return state.rootAnnotation ? flattenAnnotationTree(state.rootAnnotation) : [];
    },
    get dslRootNode() {
      return state.designData?.dsl.nodes?.[0] ?? null;
    },
  };
};

export const designDetectionStore = proxy<DesignDetectionState>({
  designStoreMap: {},
  get currentDesignId() {
    return editorPageStore.selectedDocument?.type === 'design' ? editorPageStore.selectedDocument.id : undefined;
  },
  get rootAnnotation() {
    if (!this.currentDesignId) {
      return null;
    }
    return this.designStoreMap[this.currentDesignId]?.rootAnnotation ?? null;
  },
  set rootAnnotation(value: AnnotationNode | null) {
    if (!this.currentDesignId) return;
    if (!this.designStoreMap[this.currentDesignId]) {
      this.designStoreMap[this.currentDesignId] = createEmptyDesignDocumentState();
    }
    const target = this.designStoreMap[this.currentDesignId];
    target.rootAnnotation = value;
  },
  get flatAnnotationList() {
    if (!this.currentDesignId) {
      return [];
    }
    return this.designStoreMap[this.currentDesignId]?.flatAnnotationList ?? [];
  },

  expandedKeys: [],
  isLoading: false,
  get designData() {
    if (!this.currentDesignId) {
      return null;
    }
    return this.designStoreMap[this.currentDesignId]?.designData ?? null;
  },
  set designData(value: DesignData | null) {
    if (!this.currentDesignId) return;
    if (!this.designStoreMap[this.currentDesignId]) {
      this.designStoreMap[this.currentDesignId] = createEmptyDesignDocumentState();
    }
    this.designStoreMap[this.currentDesignId].designData = value;
  },

  get dslRootNode() {
    if (!this.currentDesignId) {
      return null;
    }
    return this.designStoreMap[this.currentDesignId]?.designData?.dsl.nodes?.[0] ?? null;
  },
  get flatDSLNodeList() {
    return flattenDSLNodeTree(this.dslRootNode, true);
  },
  // 下面是和 绘制 canvas 相关的状态
  selectedAnnotation: null,
  hoveredAnnotation: null,
  selectedDSLNode: null,
  hoveredDSLNode: null,
  showAllBorders: true,
  selectedNodeIds: [],
});

const ensureDesignDocumentState = (designId: string): DesignDocumentDetectionState => {
  if (!designDetectionStore.designStoreMap[designId]) {
    designDetectionStore.designStoreMap[designId] = createEmptyDesignDocumentState();
  }
  return designDetectionStore.designStoreMap[designId];
};

const setDesignRootAnnotation = (designId: string, root: AnnotationNode | null) => {
  const target = ensureDesignDocumentState(designId);
  target.rootAnnotation = root;
};

const setDesignData = (designId: string, data: DesignData | null) => {
  const target = ensureDesignDocumentState(designId);
  target.designData = data;
};

const updateDSLNodeHiddenState = (id: string) => {
  if (!id || !designDetectionStore.currentDesignId) {
    return;
  }

  const designState = designDetectionStore.designStoreMap[designDetectionStore.currentDesignId];
  if (!designState?.designData?.dsl?.nodes?.length) {
    return;
  }

  const findAndToggleNode = (node: DSLNode): boolean => {
    if (node.id === id) {
      node.hidden = !node.hidden;
      return true;
    }

    if (node.children) {
      for (const child of node.children) {
        if (findAndToggleNode(child)) {
          return true;
        }
      }
    }

    return false;
  };

  designState.designData?.dsl.nodes.some((node) => findAndToggleNode(node));
};

const getDocumentVersionToken = (doc: PartialExcept<DocumentReference, 'id'>) =>
  doc.updatedAt || doc.lastSyncAt || doc.createdAt || '';

const shouldFetchDesignDocument = (doc: PartialExcept<DocumentReference, 'id'>, force?: boolean): boolean => {
  if (force) {
    return true;
  }
  const target = designDetectionStore.designStoreMap[doc.id];
  if (!target) {
    return true;
  }
  if (!target.designData || !target.rootAnnotation) {
    return true;
  }
  const nextVersion = getDocumentVersionToken(doc);
  return target.versionToken !== nextVersion;
};

const fetchDesignDocumentDSLInternal = async (doc: PartialExcept<DocumentReference, 'id'>): Promise<void> => {
  const versionToken = getDocumentVersionToken(doc);
  const target = ensureDesignDocumentState(doc.id);
  target.isLoading = true;
  target.error = null;

  try {
    const response = await api.project.document.getContent({ documentId: doc.id });
    const rawDslData: DesignData | undefined = response?.data?.data;
    if (!rawDslData) {
      throw new Error('没有获取到DSL数据');
    }

    // 通过后端接口处理 DSL 数据（转换 PATH 为 LAYER 等）
    const processedDesignDSL = await dslService.processDSL({
      dsl: rawDslData.dsl,
      convertPaths: true,
    });

    const rootAnnotation = createRootAnnotationFromDesignDoc(doc);
    if (!rootAnnotation) {
      throw new Error('DSL数据中缺少根节点');
    }
    setDesignData(doc.id, {
      dsl: processedDesignDSL.dsl,
    });
    setDesignRootAnnotation(doc.id, rootAnnotation);
    target.versionToken = versionToken;
  } catch (error) {
    target.error = error instanceof Error ? error.message : '获取设计文档DSL失败';
    throw error;
  } finally {
    target.isLoading = false;
  }
};

// ==================== Actions ====================

export const designDetectionActions = {
  // 切换当前设计文档
  setActiveDesignDocument: () => {
    if (!designDetectionStore.currentDesignId) {
      designDetectionStore.selectedAnnotation = null;
      designDetectionStore.hoveredAnnotation = null;
      designDetectionStore.selectedDSLNode = null;
      designDetectionStore.hoveredDSLNode = null;
      designDetectionStore.selectedNodeIds = [];
      return;
    }

    designDetectionStore.selectedAnnotation = null;
    designDetectionStore.hoveredAnnotation = null;
    designDetectionStore.selectedDSLNode = null;
    designDetectionStore.hoveredDSLNode = null;
    designDetectionStore.selectedNodeIds = [];
  },

  // 直接写入设计文档的DSL/标注数据（不切换当前激活文档）
  hydrateDesignDocument: async (
    designId: string,
    payload: {
      rootAnnotation?: AnnotationNode | null;
      dslData?: DesignData | null;
    }
  ) => {
    if (!designId) return;
    if ('dslData' in payload && payload.dslData) {
      // 通过后端接口处理 DSL 数据（转换 PATH 为 LAYER 等）
      const processedDesignDSL = await dslService.processDSL({
        dsl: payload.dslData.dsl,
        convertPaths: true,
      });

      setDesignData(designId, {
        dsl: processedDesignDSL.dsl,
      });
    } else if ('dslData' in payload) {
      setDesignData(designId, null);
    }
    if ('rootAnnotation' in payload) {
      setDesignRootAnnotation(designId, payload.rootAnnotation ?? null);
    }
  },

  fetchDesignDocumentDSL: async (doc: PartialExcept<DocumentReference, 'id'>, options?: { force?: boolean }) => {
    if (!doc?.id) return;
    if (!shouldFetchDesignDocument(doc, options?.force)) {
      return;
    }
    await fetchDesignDocumentDSLInternal(doc);
  },

  resetDesignDocumentState: (designId: string) => {
    if (!designId) return;
    designDetectionStore.designStoreMap[designId] = createEmptyDesignDocumentState();
  },

  toggleDSLNodeById: (id: string) => {
    updateDSLNodeHiddenState(id);
  },

  // 创建标注
  createAnnotation: async (
    dslNode: DSLNode,
    ftaComponent: string,
    additionalProps?: {
      name?: string;
      comment?: string;
      props?: Record<string, any>;
      layout?: any;
      force?: boolean;
    }
  ): Promise<boolean> => {
    if (!designDetectionStore.rootAnnotation) {
      return false;
    }

    // 覆盖三种情况: additionalProps 无值; additionalProps 有值且 force 无值; additionalProps.force 为 false
    const shouldCheckDuplicate =
      !additionalProps ||
      (additionalProps && typeof additionalProps.force === 'undefined') ||
      (additionalProps && additionalProps.force === false);

    if (shouldCheckDuplicate) {
      const existingAnnotation = designDetectionStore.flatAnnotationList.find((a) => a.id === dslNode.id);
      if (existingAnnotation) {
        console.warn('This DSL node is already annotated');
        return false;
      }
    } else {
      // 强制创建，删除重复标注
      const existingAnnotation = designDetectionStore.flatAnnotationList.find((a) => a.id === dslNode.id);
      if (existingAnnotation) {
        designDetectionActions.deleteAnnotation(existingAnnotation.id, {
          docId: designDetectionStore.currentDesignId!,
        });
      }
    }

    const collectDescendantDSLIds = (node: DSLNode): Set<string> => {
      const ids = new Set<string>();
      const traverse = (current: DSLNode | undefined) => {
        if (!current?.children) return;
        current.children.forEach((child) => {
          ids.add(child.id);
          traverse(child);
        });
      };
      traverse(node);
      return ids;
    };

    const descendantDSLIdSet = collectDescendantDSLIds(dslNode);
    const descendantAnnotations = designDetectionStore.flatAnnotationList.filter((annotation) =>
      descendantDSLIdSet.has(annotation.id)
    );

    const hasAnnotatedChildren = descendantAnnotations.length > 0;
    const componentCategory = getComponentCategory(ftaComponent);
    const isNonContainer =
      componentCategory === ComponentCategory.ATOMIC || componentCategory === ComponentCategory.BUSINESS;

    if (hasAnnotatedChildren && isNonContainer) {
      const confirmed = await new Promise<boolean>((resolve) => {
        const instance = Modal.confirm({
          title: '检测到内部已有标注',
          content: `该节点内部存在 ${descendantAnnotations.length} 个已标注节点。若创建为非容器组件，将清空其内部标注。`,
          okText: '强制创建并清空',
          cancelText: '取消',
          centered: true,
          onOk: () => {
            resolve(true);
            instance.destroy();
          },
          onCancel: () => {
            resolve(false);
            instance.destroy();
          },
        });
      });

      if (!confirmed) {
        return false;
      }
    }

    const now = Date.now();
    const dslAbsolutePos = calculateDSLNodeAbsolutePosition(dslNode);
    const annotationId = dslNode.id;

    const isContainerLike =
      componentCategory === ComponentCategory.CONTAINER || componentCategory === ComponentCategory.SLOT;

    // 处理需要分离的子标注
    let detachedChildren: AnnotationNode[] = [];
    let updatedRoot = designDetectionStore.rootAnnotation;

    if (hasAnnotatedChildren) {
      const detachDescendantAnnotations = (
        node: AnnotationNode
      ): { node: AnnotationNode; detached: AnnotationNode[] } => {
        let detached: AnnotationNode[] = [];
        const remainingChildren: AnnotationNode[] = [];

        node.children.forEach((child) => {
          if (descendantDSLIdSet.has(child.id)) {
            detached.push(child);
            return;
          }

          const result = detachDescendantAnnotations(child);
          const shouldRemoveVirtualContainer =
            result.node.id.startsWith(VIRTUAL_ANNOTATION_PREFIX) && result.node.children.length === 0;

          if (!shouldRemoveVirtualContainer) {
            remainingChildren.push(result.node);
          }

          if (result.detached.length > 0) {
            detached = detached.concat(result.detached);
          }
        });

        return { node: { ...node, children: remainingChildren }, detached };
      };

      const result = detachDescendantAnnotations(updatedRoot);
      updatedRoot = result.node;
      detachedChildren = result.detached;
    }

    const newAnnotation: AnnotationNode = {
      id: annotationId,
      ftaComponent,
      name: additionalProps?.name,
      comment: additionalProps?.comment,
      isRoot: false,
      isMainPage: false,
      isContainer: isContainerComponent(ftaComponent),
      children: hasAnnotatedChildren && isContainerLike ? detachedChildren : [],
      absoluteX: dslAbsolutePos.x,
      absoluteY: dslAbsolutePos.y,
      width: dslNode.layoutStyle?.width || 0,
      height: dslNode.layoutStyle?.height || 0,
      props: additionalProps?.props,
      createdAt: now,
      updatedAt: now,
    };

    const parent = findBestParent(dslNode, updatedRoot);

    const insertAnnotation = (node: AnnotationNode): AnnotationNode => {
      if (node.id === parent.id) {
        return {
          ...node,
          children: [...node.children, newAnnotation],
        };
      }

      if (node.children.length === 0) {
        return node;
      }

      return {
        ...node,
        children: node.children.map(insertAnnotation),
      };
    };

    const rootWithInsertion = insertAnnotation(updatedRoot);
    const sortedRootAnnotation = sortAnnotationChildren(rootWithInsertion);

    const expandedKeysSet = new Set(designDetectionStore.expandedKeys);
    expandedKeysSet.add(parent.id);
    expandedKeysSet.add(newAnnotation.id);

    if (hasAnnotatedChildren && isNonContainer) {
      detachedChildren.forEach((child) => expandedKeysSet.delete(child.id));
    }

    designDetectionStore.rootAnnotation = sortedRootAnnotation;

    designDetectionStore.selectedAnnotation = newAnnotation;
    designDetectionStore.selectedDSLNode = null;
    designDetectionStore.expandedKeys = Array.from(expandedKeysSet);

    return true;
  },

  // 删除标注
  deleteAnnotation: (annotationId: string, options: { docId: string; deleteChildren?: boolean }) => {
    const { docId, deleteChildren = false } = options;

    if (!designDetectionStore.rootAnnotation || annotationId === `design-root-${docId}`) {
      return;
    }

    const findNodeWithParent = (
      node: AnnotationNode,
      parent: AnnotationNode | null
    ): { node: AnnotationNode; parent: AnnotationNode | null } | null => {
      if (node.id === annotationId) {
        return { node, parent };
      }

      for (const child of node.children) {
        const found = findNodeWithParent(child, node);
        if (found) {
          return found;
        }
      }

      return null;
    };

    const target = findNodeWithParent(designDetectionStore.rootAnnotation, null);
    if (!target) return;

    const { node: nodeToDelete, parent } = target;

    const collectIdsToDelete = (node: AnnotationNode): string[] => {
      const ids = [node.id];
      node.children.forEach((child) => {
        ids.push(...collectIdsToDelete(child));
      });
      return ids;
    };

    const idsToDelete = deleteChildren ? collectIdsToDelete(nodeToDelete) : [nodeToDelete.id];

    const rebuildTree = (node: AnnotationNode): AnnotationNode => {
      const newChildren: AnnotationNode[] = [];

      node.children.forEach((child) => {
        if (child.id === annotationId) {
          if (deleteChildren) {
            return;
          }
          child.children.forEach((grandChild) => {
            newChildren.push(rebuildTree(grandChild));
          });
          return;
        }
        newChildren.push(rebuildTree(child));
      });

      return {
        ...node,
        children: newChildren,
      };
    };

    const newRootAnnotation = rebuildTree(designDetectionStore.rootAnnotation);
    const sortedRootAnnotation = sortAnnotationChildren(newRootAnnotation);

    let nextSelected = designDetectionStore.selectedAnnotation;
    if (nextSelected && idsToDelete.includes(nextSelected.id)) {
      nextSelected = parent ? parent : null;
    }

    designDetectionStore.rootAnnotation = sortedRootAnnotation;
    designDetectionStore.selectedAnnotation = nextSelected;
    designDetectionStore.expandedKeys = designDetectionStore.expandedKeys.filter((key) => !idsToDelete.includes(key));
  },

  // 更新标注
  updateAnnotation: async (annotationId: string, updates: Partial<AnnotationNode>): Promise<boolean> => {
    const targetAnnotation = findAnnotationById(annotationId);
    if (!targetAnnotation) {
      return false;
    }

    const nextFTAComponent = updates.ftaComponent ?? targetAnnotation.ftaComponent;
    const nextIsContainer = isContainerComponent(nextFTAComponent);
    const shouldClearChildren = targetAnnotation.children.length > 0 && !nextIsContainer;

    if (shouldClearChildren) {
      const confirmed = await new Promise<boolean>((resolve) => {
        const instance = Modal.confirm({
          title: '检测到内部已有标注',
          content: '当前组件内部存在已标注的子节点，转换为非容器组件将清空这些子标注，是否继续？',
          okText: '强制清空并保存',
          cancelText: '取消',
          centered: true,
          onOk: () => {
            resolve(true);
            instance.destroy();
          },
          onCancel: () => {
            resolve(false);
            instance.destroy();
          },
        });
      });

      if (!confirmed) {
        return false;
      }
    }

    if (!designDetectionStore.rootAnnotation) return false;

    const now = Date.now();
    const removedChildIds: string[] = [];

    const collectDescendantIds = (node: AnnotationNode) => {
      removedChildIds.push(node.id);
      node.children.forEach(collectDescendantIds);
    };

    const updateTree = (node: AnnotationNode): AnnotationNode => {
      const updatedChildren = node.children.map((child) => updateTree(child));

      if (node.id === annotationId) {
        const { children: _ignoredChildren, ...restUpdates } = updates;
        let nextChildren = updatedChildren;

        if (shouldClearChildren) {
          node.children.forEach(collectDescendantIds);
          nextChildren = [];
        }

        // 克隆 node，合并更新字段
        const updatedNode: AnnotationNode = {
          ...node,
          ...restUpdates,
          children: nextChildren,
          updatedAt: now,
        };

        if (typeof updates.isMainPage === 'boolean' && updates.isMainPage !== node.isMainPage) {
          updatedNode.name = updates.isMainPage ? 'Page' : 'Component';
        }

        if (updates.ftaComponent) {
          updatedNode.isContainer = isContainerComponent(updates.ftaComponent);
        } else if (shouldClearChildren) {
          updatedNode.isContainer = nextIsContainer;
        }

        return updatedNode;
      }

      return {
        ...node,
        children: updatedChildren,
      };
    };

    const newRootAnnotation = updateTree(designDetectionStore.rootAnnotation);
    const sortedRootAnnotation = sortAnnotationChildren(newRootAnnotation);

    let nextSelected = designDetectionStore.selectedAnnotation;
    if (nextSelected && removedChildIds.includes(nextSelected.id)) {
      nextSelected = findAnnotationById(annotationId);
    }

    designDetectionStore.rootAnnotation = sortedRootAnnotation;
    designDetectionStore.selectedAnnotation = nextSelected;

    return true;
  },

  // 选择标注
  selectAnnotation: (annotationId: string | null, multiSelect: boolean = false) => {
    if (annotationId === null) {
      designDetectionStore.selectedNodeIds = [];
      designDetectionStore.selectedAnnotation = null;
      designDetectionStore.selectedDSLNode = null;
      return;
    }

    if (multiSelect) {
      const existingIndex = designDetectionStore.selectedNodeIds.findIndex((item) => item.id === annotationId);

      if (existingIndex !== -1) {
        designDetectionStore.selectedNodeIds = designDetectionStore.selectedNodeIds.filter(
          (_, index) => index !== existingIndex
        );
        const newIds = designDetectionStore.selectedNodeIds;
        designDetectionStore.selectedAnnotation =
          newIds.length > 0 ? findAnnotationById(newIds[newIds.length - 1].id) : null;
        designDetectionStore.selectedDSLNode = null;
      } else {
        designDetectionStore.selectedNodeIds = [
          ...designDetectionStore.selectedNodeIds,
          { id: annotationId, type: NodeType.ANNOTATION },
        ];
        designDetectionStore.selectedAnnotation = findAnnotationById(annotationId);
        designDetectionStore.selectedDSLNode = null;
      }
    } else {
      designDetectionStore.selectedNodeIds = [{ id: annotationId, type: NodeType.ANNOTATION }];
      designDetectionStore.selectedAnnotation = findAnnotationById(annotationId);
      designDetectionStore.selectedDSLNode = null;
    }
  },

  // 选择DSL节点
  selectDSLNode: (dslNode: DSLNode | null, multiSelect: boolean = false) => {
    if (dslNode === null) {
      designDetectionStore.selectedNodeIds = [];
      designDetectionStore.selectedDSLNode = null;
      designDetectionStore.selectedAnnotation = null;
      return;
    }

    if (multiSelect) {
      const existingIndex = designDetectionStore.selectedNodeIds.findIndex((item) => item.id === dslNode.id);
      const isAlreadySelected = existingIndex !== -1;
      const newIds = isAlreadySelected
        ? designDetectionStore.selectedNodeIds.filter((_, index) => index !== existingIndex)
        : [...designDetectionStore.selectedNodeIds, { id: dslNode.id, type: NodeType.DSL }];

      const lastDSLNodeId = [...newIds].reverse()[0]?.id;
      const lastNode = lastDSLNodeId ? findDSLNodeById(lastDSLNodeId) : null;

      designDetectionStore.selectedNodeIds = newIds;
      designDetectionStore.selectedDSLNode = lastNode;
      designDetectionStore.selectedAnnotation = null;
    } else {
      designDetectionStore.selectedNodeIds = [{ id: dslNode.id, type: NodeType.DSL }];
      designDetectionStore.selectedDSLNode = dslNode;
      designDetectionStore.selectedAnnotation = null;
    }
  },

  // Hover标注
  hoverAnnotation: (annotationId: string | null) => {
    designDetectionStore.hoveredAnnotation = annotationId ? findAnnotationById(annotationId) : null;
  },

  // Hover DSL节点
  hoverDSLNode: (dslNodeId: string | null) => {
    designDetectionStore.hoveredDSLNode = dslNodeId ? findDSLNodeById(dslNodeId) : null;
  },

  // 清空选择
  clearSelection: () => {
    designDetectionStore.selectedNodeIds = [];
    designDetectionStore.selectedDSLNode = null;
    designDetectionStore.selectedAnnotation = null;
  },

  // 设置展开的keys
  setExpandedKeys: (keys: string[]) => {
    designDetectionStore.expandedKeys = keys;
  },

  // 展开全部
  expandAll: () => {
    const allKeys = designDetectionStore.flatAnnotationList.map((a) => a.id);
    designDetectionStore.expandedKeys = allKeys;
  },

  // 收起全部
  collapseAll: () => {
    designDetectionStore.expandedKeys = [];
  },

  // 切换显示所有框线
  toggleShowAllBorders: () => {
    designDetectionStore.showAllBorders = !designDetectionStore.showAllBorders;
  },

  // 保存标注
  saveAnnotations: async (designId: string): Promise<void> => {
    try {
      const target = designDetectionStore.designStoreMap[designId];
      if (!target?.rootAnnotation) {
        throw new Error('No root annotation to save');
      }
      await saveAnnotationState(designId, target.rootAnnotation);
      componentDetectionDebugLog('saveAnnotations:success', { designId });
    } catch (error) {
      componentDetectionDebugLog('saveAnnotations:failed', { designId, error });
      throw error;
    }
  },

  // 加载标注
  loadAnnotations: (designId: string, rootAnnotation: AnnotationNode | null) => {
    try {
      setDesignRootAnnotation(designId, rootAnnotation);
      if (designDetectionStore.currentDesignId === designId) {
        designDetectionStore.selectedAnnotation = null;
        designDetectionStore.selectedDSLNode = null;
      }
      componentDetectionDebugLog('loadAnnotations:success', {
        annotationCount: designDetectionStore.designStoreMap[designId]?.flatAnnotationList.length ?? 0,
      });
    } catch (error) {
      componentDetectionDebugLog('loadAnnotations:failed', { error });
      throw error;
    }
  },

  // 组合选中的节点创建标注
  combineSelectedDSLNodes: (ftaComponent: string): boolean => {
    if (designDetectionStore.selectedNodeIds.length === 0) {
      componentDetectionDebugLog('combineSelectedDSLNodes:skipNoSelection');
      return false;
    }

    if (!designDetectionStore.rootAnnotation) {
      componentDetectionDebugLog('combineSelectedDSLNodes:skipNoRoot');
      return false;
    }

    const now = Date.now();

    const selectedAnnotationIds = designDetectionStore.selectedNodeIds
      .filter((item) => item.type === NodeType.ANNOTATION)
      .map((item) => item.id);
    const selectedDSLNodeIds = designDetectionStore.selectedNodeIds
      .filter((item) => item.type === NodeType.DSL)
      .map((item) => item.id);

    const selectedAnnotationsRaw = selectedAnnotationIds
      .map((id) => findAnnotationById(id))
      .filter((a): a is AnnotationNode => a !== null && !a.isRoot);

    const selectedDSLNodes = selectedDSLNodeIds
      .map((id) => findDSLNodeById(id))
      .filter((n): n is DSLNode => n !== null);

    componentDetectionDebugLog('combineSelectedDSLNodes:start', {
      ftaComponent,
      selectedAnnotationCount: selectedAnnotationsRaw.length,
      selectedDSLCount: selectedDSLNodes.length,
    });

    if (selectedAnnotationsRaw.length === 0 && selectedDSLNodes.length === 0) {
      componentDetectionDebugLog('combineSelectedDSLNodes:skipNoTargets');
      return false;
    }

    const cloneAnnotationTree = (annotation: AnnotationNode): AnnotationNode => ({
      ...annotation,
      children: annotation.children.map(cloneAnnotationTree),
      updatedAt: now,
    });

    const collectAnnotationBounds = (annotation: AnnotationNode) => {
      const results: Array<{ x: number; y: number; width: number; height: number }> = [];
      const traverse = (node: AnnotationNode) => {
        results.push({
          x: node.absoluteX,
          y: node.absoluteY,
          width: node.width,
          height: node.height,
        });
        node.children.forEach(traverse);
      };
      traverse(annotation);
      return results;
    };

    const annotationBounds = selectedAnnotationsRaw.flatMap(collectAnnotationBounds);
    const dslBounds = selectedDSLNodes.map((node) => {
      const pos = calculateDSLNodeAbsolutePosition(node);
      return {
        x: pos.x,
        y: pos.y,
        width: node.layoutStyle?.width || 0,
        height: node.layoutStyle?.height || 0,
      };
    });

    const combinedBounds = [...annotationBounds, ...dslBounds];
    if (combinedBounds.length === 0) {
      componentDetectionDebugLog('combineSelectedDSLNodes:skipNoBounds');
      return false;
    }

    const minX = Math.min(...combinedBounds.map((b) => b.x));
    const minY = Math.min(...combinedBounds.map((b) => b.y));
    const maxX = Math.max(...combinedBounds.map((b) => b.x + b.width));
    const maxY = Math.max(...combinedBounds.map((b) => b.y + b.height));

    const parentMap = new Map<string, AnnotationNode>();
    const buildParentMap = (node: AnnotationNode) => {
      node.children.forEach((child) => {
        parentMap.set(child.id, node);
        buildParentMap(child);
      });
    };
    buildParentMap(designDetectionStore.rootAnnotation);

    const annotationsInBounds = designDetectionStore.flatAnnotationList.filter((annotation) => {
      if (annotation.isRoot) return false;
      const width = annotation.width || 0;
      const height = annotation.height || 0;
      return (
        annotation.absoluteX >= minX &&
        annotation.absoluteY >= minY &&
        annotation.absoluteX + width <= maxX &&
        annotation.absoluteY + height <= maxY
      );
    });

    componentDetectionDebugLog('combineSelectedDSLNodes:annotationsInBounds', {
      count: annotationsInBounds.length,
      bounds: { minX, minY, maxX, maxY },
    });

    const annotationsInBoundsSet = new Set(annotationsInBounds.map((annotation) => annotation.id));
    const nodesToRemove = new Set<string>();
    const permanentlyRemovedIds = new Set<string>();
    const annotationsToAttach: AnnotationNode[] = [];

    annotationsInBounds.forEach((annotation) => {
      const parent = parentMap.get(annotation.id);
      if (parent && annotationsInBoundsSet.has(parent.id)) {
        return;
      }

      if (annotation.id.startsWith(VIRTUAL_ANNOTATION_PREFIX)) {
        nodesToRemove.add(annotation.id);
        permanentlyRemovedIds.add(annotation.id);
        annotation.children.forEach((child) => {
          annotationsToAttach.push(cloneAnnotationTree(child));
        });
      } else {
        nodesToRemove.add(annotation.id);
        annotationsToAttach.push(cloneAnnotationTree(annotation));
      }
    });

    componentDetectionDebugLog('combineSelectedDSLNodes:attachmentsPrepared', {
      attachmentCount: annotationsToAttach.length,
      removedCount: nodesToRemove.size,
    });

    if (annotationsToAttach.length === 0 && selectedDSLNodes.length === 0) {
      componentDetectionDebugLog('combineSelectedDSLNodes:skipNoAttachments');
      return false;
    }

    const detachNodes = (node: AnnotationNode): AnnotationNode => {
      const remainingChildren = node.children
        .filter((child) => !nodesToRemove.has(child.id))
        .map((child) => detachNodes(child));

      return {
        ...node,
        children: remainingChildren,
      };
    };

    const rootAfterRemoval = detachNodes(designDetectionStore.rootAnnotation);

    const createNewAnnotation = (
      dslNodeId: string,
      absoluteX: number,
      absoluteY: number,
      width: number,
      height: number,
      children: AnnotationNode[],
      comment?: string
    ): AnnotationNode => ({
      id: dslNodeId,
      ftaComponent,
      name: undefined,
      comment,
      isRoot: false,
      isMainPage: false,
      isContainer: isContainerComponent(ftaComponent),
      children,
      absoluteX,
      absoluteY,
      width,
      height,
      createdAt: now,
      updatedAt: now,
    });

    const containingNode = findContainingDSLNode(annotationsToAttach, selectedDSLNodes);

    let newAnnotation: AnnotationNode;
    let parent: AnnotationNode;

    if (containingNode) {
      const absolutePos = calculateDSLNodeAbsolutePosition(containingNode);
      newAnnotation = createNewAnnotation(
        containingNode.id,
        absolutePos.x,
        absolutePos.y,
        containingNode.layoutStyle?.width || 0,
        containingNode.layoutStyle?.height || 0,
        annotationsToAttach
      );
      parent = findBestParent(containingNode, rootAfterRemoval);
      componentDetectionDebugLog('combineSelectedDSLNodes:usingContainingNode', {
        annotationId: newAnnotation.id,
        parentId: parent.id,
      });
    } else {
      const virtualAnnotationId = `${VIRTUAL_ANNOTATION_PREFIX}${now}-${Math.random().toString(36).slice(2, 8)}`;
      newAnnotation = createNewAnnotation(
        virtualAnnotationId,
        minX,
        minY,
        maxX - minX,
        maxY - minY,
        annotationsToAttach,
        '虚拟容器'
      );

      parent = rootAfterRemoval;
      let smallestArea = parent.width * parent.height;

      const searchParent = (node: AnnotationNode) => {
        if (!node.isContainer) return;

        const isInside =
          minX >= node.absoluteX &&
          minY >= node.absoluteY &&
          maxX <= node.absoluteX + node.width &&
          maxY <= node.absoluteY + node.height;

        if (isInside) {
          const area = node.width * node.height;
          if (area < smallestArea) {
            smallestArea = area;
            parent = node;
          }
          node.children.forEach(searchParent);
        }
      };

      rootAfterRemoval.children.forEach(searchParent);
      componentDetectionDebugLog('combineSelectedDSLNodes:usingVirtualContainer', {
        annotationId: newAnnotation.id,
        parentId: parent.id,
      });
    }

    const insertAnnotation = (node: AnnotationNode): AnnotationNode => {
      if (node.id === parent.id) {
        return {
          ...node,
          children: [...node.children, newAnnotation],
        };
      }

      if (node.children.length === 0) {
        return node;
      }

      return {
        ...node,
        children: node.children.map(insertAnnotation),
      };
    };

    const rootWithInsertion = insertAnnotation(rootAfterRemoval);
    const sortedRootAnnotation = sortAnnotationChildren(rootWithInsertion);

    const expandedKeysSet = new Set(designDetectionStore.expandedKeys);
    permanentlyRemovedIds.forEach((id) => expandedKeysSet.delete(id));
    expandedKeysSet.add(parent.id);
    expandedKeysSet.add(newAnnotation.id);

    designDetectionStore.rootAnnotation = sortedRootAnnotation;
    designDetectionStore.selectedAnnotation = newAnnotation;
    designDetectionStore.expandedKeys = Array.from(expandedKeysSet);
    designDetectionStore.selectedNodeIds = [];
    designDetectionStore.selectedDSLNode = null;

    componentDetectionDebugLog('combineSelectedDSLNodes:completed', { success: true });

    return true;
  },

  // 验证拖拽移动
  validateMove: (
    sourceId: string,
    targetId: string,
    dropPosition: 'before' | 'inside' | 'after'
  ): { valid: boolean; reason?: string } => {
    const sourceNode = findAnnotationById(sourceId);
    const targetNode = findAnnotationById(targetId);

    if (!sourceNode || !targetNode) {
      return { valid: false, reason: '节点不存在' };
    }

    if (sourceNode.isRoot) {
      return { valid: false, reason: '页面根节点不允许拖拽' };
    }

    if (sourceId === targetId) {
      return { valid: false, reason: '不能拖拽到自己' };
    }

    if (isAncestor(sourceId, targetId)) {
      return { valid: false, reason: '不能将父节点拖入子节点' };
    }

    if (dropPosition === 'inside' && !targetNode.isContainer) {
      return { valid: false, reason: '该组件不支持子节点，无法拖入' };
    }

    const sourceParent = findParentAnnotation(sourceId);
    if (sourceParent && dropPosition !== 'inside') {
      const siblings = sourceParent.children;
      const sourceIndex = siblings.findIndex((child) => child.id === sourceId);

      const targetParent = findParentAnnotation(targetId);
      const isEscapeMove = targetParent?.id === findParentAnnotation(sourceParent.id)?.id;

      if (isEscapeMove && siblings.length > 1) {
        const isFirst = sourceIndex === 0;
        const isLast = sourceIndex === siblings.length - 1;

        if (!isFirst && !isLast) {
          return {
            valid: false,
            reason: '该节点位于中间位置，请先调整为第一个或最后一个子节点',
          };
        }

        if (isFirst && dropPosition === 'after') {
          return { valid: false, reason: '第一个子节点只能向上拖出' };
        }

        if (isLast && dropPosition === 'before') {
          return { valid: false, reason: '最后一个子节点只能向下拖出' };
        }
      }
    }

    return { valid: true };
  },

  // 移动标注节点
  moveAnnotation: async (
    sourceId: string,
    targetId: string,
    dropPosition: 'before' | 'inside' | 'after'
  ): Promise<{ success: boolean; error?: string }> => {
    const validation = designDetectionActions.validateMove(sourceId, targetId, dropPosition);
    if (!validation.valid) {
      return { success: false, error: validation.reason };
    }

    if (!designDetectionStore.rootAnnotation) {
      return { success: false, error: '根节点不存在' };
    }

    const now = Date.now();

    const cloneNode = (node: AnnotationNode): AnnotationNode => ({
      ...node,
      children: node.children.map(cloneNode),
    });

    let newRoot = cloneNode(designDetectionStore.rootAnnotation);
    let sourceNode: AnnotationNode | null = null;
    let moved = false;

    // 从原位置移除源节点
    const removeNode = (node: AnnotationNode): AnnotationNode => {
      const newChildren: AnnotationNode[] = [];
      for (const child of node.children) {
        if (child.id === sourceId) {
          sourceNode = child;
          continue;
        }
        newChildren.push(removeNode(child));
      }
      return { ...node, children: newChildren };
    };

    newRoot = removeNode(newRoot);

    if (!sourceNode) {
      return { success: false, error: '源节点未找到' };
    }

    // 插入到目标位置
    const insertNode = (node: AnnotationNode): AnnotationNode => {
      if (node.id === targetId) {
        if (dropPosition === 'inside') {
          return {
            ...node,
            children: [...node.children, sourceNode!],
            updatedAt: now,
          };
        }
        return node;
      }

      const newChildren: AnnotationNode[] = [];
      for (const child of node.children) {
        if (child.id === targetId) {
          if (dropPosition === 'before') {
            newChildren.push(sourceNode!);
            newChildren.push(child);
            moved = true;
          } else if (dropPosition === 'after') {
            newChildren.push(child);
            newChildren.push(sourceNode!);
            moved = true;
          } else {
            newChildren.push(insertNode(child));
          }
        } else {
          newChildren.push(insertNode(child));
        }
      }

      return { ...node, children: newChildren };
    };

    newRoot = insertNode(newRoot);

    if (!moved && dropPosition !== 'inside') {
      return { success: false, error: '插入位置未找到' };
    }

    // 更新容器边界
    const updateBounds = (node: AnnotationNode): AnnotationNode => {
      if (node.children.length === 0) {
        return node;
      }

      const updatedChildren = node.children.map(updateBounds);

      if (node.isContainer) {
        const bounds = calculateContainerBounds(updatedChildren);

        if (node.id.startsWith(VIRTUAL_ANNOTATION_PREFIX)) {
          return {
            ...node,
            children: updatedChildren,
            absoluteX: bounds.minX,
            absoluteY: bounds.minY,
            width: bounds.maxX - bounds.minX,
            height: bounds.maxY - bounds.minY,
            updatedAt: now,
          };
        }

        return {
          ...node,
          children: updatedChildren,
          absoluteX: Math.min(node.absoluteX, bounds.minX),
          absoluteY: Math.min(node.absoluteY, bounds.minY),
          width: Math.max(node.width, bounds.maxX - Math.min(node.absoluteX, bounds.minX)),
          height: Math.max(node.height, bounds.maxY - Math.min(node.absoluteY, bounds.minY)),
          updatedAt: now,
        };
      }

      return { ...node, children: updatedChildren };
    };

    newRoot = updateBounds(newRoot);

    // 清理空的虚拟容器
    const cleanEmptyVirtualContainers = (node: AnnotationNode): AnnotationNode => {
      const cleanedChildren = node.children.map(cleanEmptyVirtualContainers).filter((child) => {
        return !(child.id.startsWith(VIRTUAL_ANNOTATION_PREFIX) && child.children.length === 0);
      });

      return { ...node, children: cleanedChildren };
    };

    newRoot = cleanEmptyVirtualContainers(newRoot);

    const sortedRoot = sortAnnotationChildren(newRoot);

    designDetectionStore.rootAnnotation = sortedRoot;
    designDetectionStore.selectedAnnotation = findAnnotationById(sourceId);

    return { success: true };
  },

  // 获取选中的DSL节点
  getSelectedDSLNode: () => {
    return designDetectionStore.selectedDSLNode;
  },
};

//#region ==================== React Hooks ====================

interface DesignTreeDataOptions {
  onSyncDesignDocument?: (doc: DocumentReference) => void;
  onSettingsClick?: (documentId: string) => void;
  syncing?: boolean;
}

export const useDesignTreeData = (options?: DesignTreeDataOptions): DataNode[] => {
  const { currentPage, selectedDocument } = useSnapshot(editorPageStore);
  const { designStoreMap } = useSnapshot(designDetectionStore);
  const designDocs = currentPage?.designDocuments ?? [];
  const isSyncing = options?.syncing ?? false;

  return useMemo(() => {
    if (designDocs.length === 0) {
      return [];
    }

    return designDocs
      .map((doc) => {
        const isDesignSelected = selectedDocument?.type === 'design' && selectedDocument?.id === doc.id;
        const docState = designStoreMap?.[doc.id];
        const resolvedAnnotation = (docState?.rootAnnotation ?? null) as AnnotationNode | null;

        if (resolvedAnnotation) {
          return convertToTreeData(resolvedAnnotation, {
            isFirstLevel: true,
            isActiveDoc: isDesignSelected,
            documentName: doc.name || doc.id.substring(0, 6),
            documentId: doc.id,
            isMainPage: resolvedAnnotation.isMainPage,
            onSettingsClick: options?.onSettingsClick,
          });
        }

        const statusText = doc?.status === 'failed' ? '加载失败' : doc?.status === 'pending' ? '待加载' : '加载中...';
        const iconColor = doc?.status === 'failed' ? 'rgb(245, 34, 45)' : 'rgb(24, 144, 255)';
        const isPending = doc?.status === 'pending';

        const title = (
          <Space size={4} style={{ width: '100%', justifyContent: 'space-between' }}>
            <Space size={4}>
              <FileImageOutlined style={{ color: iconColor }} />
              <span style={{ fontWeight: 500 }}>{doc.name || `文档 ${doc.id.substring(0, 6)}`}</span>
            </Space>
            {isPending ? (
              <Button
                type='link'
                size='small'
                icon={<ReloadOutlined />}
                loading={docState?.isLoading || isSyncing}
                onClick={(e) => {
                  e.stopPropagation();
                  options?.onSyncDesignDocument?.(doc as DocumentReference);
                }}
                style={{ padding: 0, fontSize: 12 }}>
                同步
              </Button>
            ) : (
              <Text type='secondary' style={{ fontSize: 12 }}>
                {statusText}
              </Text>
            )}
          </Space>
        );

        return {
          key: `design-doc-${doc.id}`,
          title,
          isLeaf: true,
          selectable: true,
        } as DataNode;
      })
      .filter(Boolean) as DataNode[];
  }, [designDocs, designStoreMap, selectedDocument?.id, selectedDocument?.type, isSyncing]);
};

//#endregion

// ==================== 工具方法导出 ====================

export { calculateDSLNodeAbsolutePosition, findAnnotationByDSLNodeId, findAnnotationById, findDSLNodeById };
