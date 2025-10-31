import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { App } from 'antd';
import { DSLData, DSLNode } from '@/types/dsl';
import { componentDetectionDebugLog } from '@/utils/componentDetectionDebug';
import {
  AnnotationState,
  AnnotationNode,
  isContainerComponent,
  SelectedNodeItem,
  NodeType,
  ComponentCategory,
  getComponentCategory,
} from '../types/componentDetectionV2';
import { saveAnnotationState } from '../utils/componentStorage';

const VIRTUAL_ANNOTATION_PREFIX = 'virtual-annotation-';

interface ComponentDetectionContextValue extends AnnotationState {
  // 初始化
  initializeFromDSL: (dslData: DSLData) => void;

  // 标注管理
  createAnnotation: (
    dslNode: DSLNode,
    ftaComponent: string,
    additionalProps?: {
      name?: string;
      comment?: string;
      props?: Record<string, any>;
      layout?: any;
    }
  ) => Promise<boolean>;
  deleteAnnotation: (annotationId: string, options?: { deleteChildren?: boolean }) => void;
  updateAnnotation: (annotationId: string, updates: Partial<AnnotationNode>) => Promise<boolean>;

  // 保存和加载
  saveAnnotations: (designId: string) => Promise<void>;
  loadAnnotations: (rootAnnotation: AnnotationNode) => void;

  // 选择管理
  selectAnnotation: (annotationId: string | null, multiSelect?: boolean) => void;
  selectDSLNode: (dslNode: DSLNode | null, multiSelect?: boolean) => void;
  hoverAnnotation: (annotationId: string | null) => void;
  hoverDSLNode: (dslNodeId: string | null) => void;
  clearSelection: () => void;

  // 统一的多选支持
  selectedNodeIds: SelectedNodeItem[];

  // 组合节点功能
  combineSelectedDSLNodes: (ftaComponent: string) => boolean;

  // 拖拽管理
  validateMove: (
    sourceId: string,
    targetId: string,
    dropPosition: 'before' | 'inside' | 'after'
  ) => {
    valid: boolean;
    reason?: string;
  };
  moveAnnotation: (
    sourceId: string,
    targetId: string,
    dropPosition: 'before' | 'inside' | 'after'
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;

  // Tree展开管理
  setExpandedKeys: (keys: string[]) => void;
  expandAll: () => void;
  collapseAll: () => void;

  // 工具方法
  findAnnotationById: (id: string) => AnnotationNode | null;
  findAnnotationByDSLNodeId: (dslNodeId: string) => AnnotationNode | null;
  findDSLNodeById: (id: string) => DSLNode | null;
  calculateDSLNodeAbsolutePosition: (targetNode: DSLNode) => { x: number; y: number };
  getSelectedDSLNode: () => DSLNode | null;

  // DSL根节点
  dslRootNode: DSLNode | null;
  updateDslRootNode: (rootNode: DSLNode | null) => void;

  // 显示所有框线
  showAllBorders: boolean;
  toggleShowAllBorders: () => void;
}

const ComponentDetectionContext = createContext<ComponentDetectionContextValue | undefined>(undefined);

export const useComponentDetectionV2 = () => {
  const context = useContext(ComponentDetectionContext);
  if (!context) {
    throw new Error('useComponentDetectionV2 must be used within ComponentDetectionProviderV2');
  }
  return context;
};

interface ComponentDetectionProviderProps {
  children: ReactNode;
}

export const ComponentDetectionProviderV2: React.FC<ComponentDetectionProviderProps> = ({ children }) => {
  const { modal } = App.useApp();
  const [state, setState] = useState<AnnotationState>({
    rootAnnotation: null,
    annotations: [],
    selectedAnnotationId: null,
    hoveredAnnotationId: null,
    selectedDSLNodeId: null,
    hoveredDSLNodeId: null,
    expandedKeys: [],
    isLoading: false,
  });

  const [dslRootNode, setDslRootNode] = useState<DSLNode | null>(null);
  const [selectedDSLNodeRef, setSelectedDSLNodeRef] = useState<DSLNode | null>(null);
  const [showAllBorders, setShowAllBorders] = useState(false);
  // 统一的选择节点数组，包含节点ID和类型
  const [selectedNodeIds, setSelectedNodeIds] = useState<SelectedNodeItem[]>([]);

  // 排序 AnnotationNode 的 children，按照坐标顺序：从上到下，从左到右
  const sortAnnotationChildren = useCallback((node: AnnotationNode): AnnotationNode => {
    const sortedChildren = [...node.children].sort((a, b) => {
      // 首先按 Y 坐标排序（从上到下）
      const yDiff = a.absoluteY - b.absoluteY;
      if (Math.abs(yDiff) > 1) {
        // 允许1像素的误差
        return yDiff;
      }
      // Y 坐标相近时，按 X 坐标排序（从左到右）
      return a.absoluteX - b.absoluteX;
    });

    return {
      ...node,
      children: sortedChildren.map(sortAnnotationChildren),
    };
  }, []);

  // 扁平化 Annotation 树，确保所有节点都能被遍历到（用于绘制、交互等）
  const flattenAnnotationTree = useCallback((root: AnnotationNode): AnnotationNode[] => {
    const result: AnnotationNode[] = [];
    const traverse = (node: AnnotationNode) => {
      result.push(node);
      node.children.forEach(traverse);
    };
    traverse(root);
    return result;
  }, []);

  // 从DSL初始化，创建页面根节点
  const initializeFromDSL = useCallback(
    (dslData: DSLData) => {
      setState((prev) => ({ ...prev, isLoading: true }));

      try {
        const rootNode = dslData.dsl.nodes[0];
        if (!rootNode) {
          throw new Error('No root node found in DSL data');
        }

        // 保存DSL根节点
        setDslRootNode(rootNode);

        const now = Date.now();

        // 创建页面根节点
        const rootAnnotation: AnnotationNode = {
          id: 'root',
          dslNodeId: rootNode.id,
          dslNode: rootNode,
          ftaComponent: 'View',
          name: 'Page',
          isRoot: true,
          isContainer: true,
          children: [],
          absoluteX: 0,
          absoluteY: 0,
          width: rootNode.layoutStyle?.width || 720,
          height: rootNode.layoutStyle?.height || 1560,
          createdAt: now,
          updatedAt: now,
        };

        setState({
          rootAnnotation,
          annotations: flattenAnnotationTree(rootAnnotation),
          selectedAnnotationId: null,
          hoveredAnnotationId: null,
          selectedDSLNodeId: null,
          hoveredDSLNodeId: null,
          expandedKeys: ['root'], // 默认展开根节点
          isLoading: false,
        });
      } catch (error) {
        console.error('Failed to initialize from DSL:', error);
        setState((prev) => ({
          ...prev,
          isLoading: false,
        }));
      }
    },
    [flattenAnnotationTree]
  );

  // 查找标注节点
  const findAnnotationById = useCallback(
    (id: string): AnnotationNode | null => {
      const search = (node: AnnotationNode): AnnotationNode | null => {
        if (node.id === id) return node;
        for (const child of node.children) {
          const found = search(child);
          if (found) return found;
        }
        return null;
      };

      if (state.rootAnnotation) {
        return search(state.rootAnnotation);
      }
      return null;
    },
    [state.rootAnnotation]
  );

  // 通过DSL节点ID查找标注
  const findAnnotationByDSLNodeId = useCallback(
    (dslNodeId: string): AnnotationNode | null => {
      const search = (node: AnnotationNode): AnnotationNode | null => {
        if (node.dslNodeId === dslNodeId) return node;
        for (const child of node.children) {
          const found = search(child);
          if (found) return found;
        }
        return null;
      };

      if (state.rootAnnotation) {
        return search(state.rootAnnotation);
      }
      return null;
    },
    [state.rootAnnotation]
  );

  // 统一的DSL节点查找函数
  const findDSLNodeById = useCallback(
    (id: string): DSLNode | null => {
      if (!dslRootNode) return null;

      const search = (node: DSLNode): DSLNode | null => {
        if (node.id === id) return node;
        if (node.children) {
          for (const child of node.children) {
            const found = search(child);
            if (found) return found;
          }
        }
        return null;
      };

      return search(dslRootNode);
    },
    [dslRootNode]
  );

  // 计算DSL节点的绝对坐标
  const calculateDSLNodeAbsolutePosition = useCallback(
    (targetNode: DSLNode): { x: number; y: number } => {
      if (!dslRootNode) return { x: 0, y: 0 };

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

      return findPath(dslRootNode) || { x: 0, y: 0 };
    },
    [dslRootNode]
  );

  // 查找最佳父节点（包含该DSL节点的最小容器）
  const findBestParent = useCallback(
    (dslNode: DSLNode, rootAnnotation: AnnotationNode): AnnotationNode => {
      const dslAbsolutePos = calculateDSLNodeAbsolutePosition(dslNode);
      const dslX = dslAbsolutePos.x;
      const dslY = dslAbsolutePos.y;
      const dslWidth = dslNode.layoutStyle?.width || 0;
      const dslHeight = dslNode.layoutStyle?.height || 0;

      let bestParent = rootAnnotation;
      let smallestArea = rootAnnotation.width * rootAnnotation.height;

      const search = (node: AnnotationNode) => {
        // 检查是否为容器组件
        if (!node.isContainer) return;

        // 检查DSL节点是否完全在当前节点内
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

          // 继续搜索子节点
          node.children.forEach(search);
        }
      };

      rootAnnotation.children.forEach(search);
      return bestParent;
    },
    [calculateDSLNodeAbsolutePosition]
  );

  // 创建标注
  const createAnnotation = useCallback(
    async (
      dslNode: DSLNode,
      ftaComponent: string,
      additionalProps?: {
        name?: string;
        comment?: string;
        props?: Record<string, any>;
        layout?: any;
      }
    ): Promise<boolean> => {
      if (!state.rootAnnotation) {
        componentDetectionDebugLog('createAnnotation:skipNoRoot');
        return false;
      }

      componentDetectionDebugLog('createAnnotation:start', {
        dslNodeId: dslNode.id,
        ftaComponent,
      });

      // 如果已存在标注则直接跳过
      const existingAnnotation = state.annotations.find((a) => a.dslNodeId === dslNode.id);
      if (existingAnnotation) {
        console.warn('This DSL node is already annotated');
        componentDetectionDebugLog('createAnnotation:skipAlreadyAnnotated', { dslNodeId: dslNode.id });
        return false;
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
      const descendantAnnotations = state.annotations.filter((annotation) =>
        descendantDSLIdSet.has(annotation.dslNodeId)
      );

      const hasAnnotatedChildren = descendantAnnotations.length > 0;
      const componentCategory = getComponentCategory(ftaComponent);
      const isContainerLike =
        componentCategory === ComponentCategory.CONTAINER || componentCategory === ComponentCategory.SLOT;
      const isNonContainer =
        componentCategory === ComponentCategory.ATOMIC || componentCategory === ComponentCategory.BUSINESS;

      if (hasAnnotatedChildren && isNonContainer) {
        componentDetectionDebugLog('createAnnotation:promptForClear', {
          dslNodeId: dslNode.id,
          descendantCount: descendantAnnotations.length,
          componentCategory,
        });
        const confirmed = await new Promise<boolean>((resolve) => {
          const instance = modal.confirm({
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
          componentDetectionDebugLog('createAnnotation:userCancelled', { dslNodeId: dslNode.id });
          return false;
        }
      }

      let creationSucceeded = false;

      setState((prev) => {
        if (!prev.rootAnnotation) return prev;

        // 在更新函数中再次检查是否已经存在标注，避免并发问题
        const alreadyAnnotated = prev.annotations.find((a) => a.dslNodeId === dslNode.id);
        if (alreadyAnnotated) {
          componentDetectionDebugLog('createAnnotation:skipAlreadyAnnotatedDuringUpdate', { dslNodeId: dslNode.id });
          return prev;
        }

        const now = Date.now();
        const dslAbsolutePos = calculateDSLNodeAbsolutePosition(dslNode);
        const annotationId = dslNode.id;

        const parentCandidateBeforeDetach = findBestParent(dslNode, prev.rootAnnotation);
        const preserveAnnotationIds = new Set<string>([parentCandidateBeforeDetach.id, prev.rootAnnotation.id]);

        const detachDescendantAnnotations = (
          node: AnnotationNode,
          preserveIds: Set<string>
        ): { node: AnnotationNode; detached: AnnotationNode[] } => {
          let detached: AnnotationNode[] = [];
          let childrenChanged = false;
          const remainingChildren: AnnotationNode[] = [];

          node.children.forEach((child) => {
            if (descendantDSLIdSet.has(child.dslNodeId)) {
              detached.push(child);
              childrenChanged = true;
              return;
            }

            const result = detachDescendantAnnotations(child, preserveIds);

            if (result.node !== child) {
              childrenChanged = true;
            }

            const shouldRemoveVirtualContainer =
              result.node.id.startsWith(VIRTUAL_ANNOTATION_PREFIX) &&
              result.node.children.length === 0 &&
              !preserveIds.has(result.node.id);

            if (!shouldRemoveVirtualContainer) {
              remainingChildren.push(result.node);
            } else {
              childrenChanged = true;
            }

            if (result.detached.length > 0) {
              detached = detached.concat(result.detached);
            }
          });

          const updatedNode = childrenChanged ? { ...node, children: remainingChildren } : node;
          return { node: updatedNode, detached };
        };

        const shouldDetachDescendants = hasAnnotatedChildren;

        let updatedRoot = prev.rootAnnotation;
        let detachedChildren: AnnotationNode[] = [];

        if (shouldDetachDescendants) {
          const result = detachDescendantAnnotations(prev.rootAnnotation, preserveAnnotationIds);
          updatedRoot = result.node;
          detachedChildren = result.detached;
          componentDetectionDebugLog('createAnnotation:detachedDescendants', {
            dslNodeId: dslNode.id,
            detachedCount: detachedChildren.length,
          });
        }

        const newAnnotation: AnnotationNode = {
          id: annotationId,
          dslNodeId: dslNode.id,
          dslNode,
          ftaComponent,
          name: additionalProps?.name,
          comment: additionalProps?.comment,
          isRoot: false,
          isContainer: isContainerComponent(ftaComponent),
          children: hasAnnotatedChildren && isContainerLike ? detachedChildren : [],
          absoluteX: dslAbsolutePos.x,
          absoluteY: dslAbsolutePos.y,
          width: dslNode.layoutStyle?.width || 0,
          height: dslNode.layoutStyle?.height || 0,
          props: additionalProps?.props,
          layout: additionalProps?.layout,
          createdAt: now,
          updatedAt: now,
        };

        const findAnnotationByIdInTree = (node: AnnotationNode, targetId: string): AnnotationNode | null => {
          if (node.id === targetId) return node;
          for (const child of node.children) {
            const found = findAnnotationByIdInTree(child, targetId);
            if (found) return found;
          }
          return null;
        };

        let parent = findBestParent(dslNode, updatedRoot);
        const preservedParent = findAnnotationByIdInTree(updatedRoot, parentCandidateBeforeDetach.id);
        if (preservedParent) {
          parent = preservedParent;
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

        const rootWithInsertion = insertAnnotation(updatedRoot);
        const sortedRootAnnotation = sortAnnotationChildren(rootWithInsertion);
        const flattenedAnnotations = flattenAnnotationTree(sortedRootAnnotation);

        const removedAnnotationIds = detachedChildren.map((child) => child.id);
        const expandedKeysSet = new Set(prev.expandedKeys);
        expandedKeysSet.add(parent.id);
        expandedKeysSet.add(newAnnotation.id);

        if (hasAnnotatedChildren && isNonContainer) {
          removedAnnotationIds.forEach((id) => expandedKeysSet.delete(id));
        }

        creationSucceeded = true;
        componentDetectionDebugLog('createAnnotation:stateUpdated', {
          annotationId: newAnnotation.id,
          parentId: parent.id,
          detachedChildrenCount: detachedChildren.length,
        });

        return {
          ...prev,
          rootAnnotation: sortedRootAnnotation,
          annotations: flattenedAnnotations,
          selectedAnnotationId: newAnnotation.id,
          selectedDSLNodeId: null,
          expandedKeys: Array.from(expandedKeysSet),
        };
      });

      componentDetectionDebugLog('createAnnotation:completed', {
        dslNodeId: dslNode.id,
        success: creationSucceeded,
      });

      return creationSucceeded;
    },
    [state, findBestParent, calculateDSLNodeAbsolutePosition, sortAnnotationChildren, flattenAnnotationTree]
  );

  // 删除标注
  const deleteAnnotation = useCallback(
    (annotationId: string, options?: { deleteChildren?: boolean }) => {
      setState((prev) => {
        if (!prev.rootAnnotation || annotationId === 'root') {
          return prev; // 不能删除根节点
        }

        const { deleteChildren = false } = options ?? {};

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

        const target = findNodeWithParent(prev.rootAnnotation, null);
        if (!target) return prev;

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

        const newRootAnnotation = rebuildTree(prev.rootAnnotation);
        const sortedRootAnnotation = sortAnnotationChildren(newRootAnnotation);
        const flattenedAnnotations = flattenAnnotationTree(sortedRootAnnotation);

        let nextSelectedId = prev.selectedAnnotationId;
        if (nextSelectedId && idsToDelete.includes(nextSelectedId)) {
          nextSelectedId = parent ? parent.id : null;
        }

        return {
          ...prev,
          rootAnnotation: sortedRootAnnotation,
          annotations: flattenedAnnotations,
          selectedAnnotationId: nextSelectedId,
          expandedKeys: prev.expandedKeys.filter((key) => !idsToDelete.includes(key)),
        };
      });
    },
    [sortAnnotationChildren, flattenAnnotationTree]
  );

  // 更新标注
  const updateAnnotation = useCallback(
    async (annotationId: string, updates: Partial<AnnotationNode>): Promise<boolean> => {
      const targetAnnotation = findAnnotationById(annotationId);
      if (!targetAnnotation) {
        componentDetectionDebugLog('updateAnnotation:skipNotFound', { annotationId });
        return false;
      }

      componentDetectionDebugLog('updateAnnotation:start', {
        annotationId,
        updateKeys: Object.keys(updates),
      });

      const nextFTAComponent = updates.ftaComponent ?? targetAnnotation.ftaComponent;
      const nextIsContainer = isContainerComponent(nextFTAComponent);
      const shouldClearChildren = targetAnnotation.children.length > 0 && !nextIsContainer;

      if (shouldClearChildren) {
        componentDetectionDebugLog('updateAnnotation:promptForClear', {
          annotationId,
          currentComponent: targetAnnotation.ftaComponent,
          nextComponent: nextFTAComponent,
          childCount: targetAnnotation.children.length,
        });
        const confirmed = await new Promise<boolean>((resolve) => {
          const instance = modal.confirm({
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
          componentDetectionDebugLog('updateAnnotation:userCancelled', { annotationId });
          return false;
        }
      }

      let updatedSuccessfully = false;

      setState((prev) => {
        if (!prev.rootAnnotation) return prev;

        const now = Date.now();
        const removedChildIds: string[] = [];
        let hasChanges = false;

        const collectDescendantIds = (node: AnnotationNode) => {
          removedChildIds.push(node.id);
          node.children.forEach(collectDescendantIds);
        };

        const updateTree = (node: AnnotationNode): AnnotationNode => {
          let childrenChanged = false;
          const updatedChildren = node.children.map((child) => {
            const updatedChild = updateTree(child);
            if (updatedChild !== child) {
              childrenChanged = true;
            }
            return updatedChild;
          });

          if (node.id === annotationId) {
            hasChanges = true;

            const { children: _ignoredChildren, ...restUpdates } = updates;
            let nextChildren = updatedChildren;

            if (shouldClearChildren) {
              node.children.forEach(collectDescendantIds);
              nextChildren = [];
            }

            const updatedNode: AnnotationNode = {
              ...node,
              ...restUpdates,
              children: nextChildren,
              updatedAt: now,
            };

            if (updates.ftaComponent) {
              updatedNode.isContainer = isContainerComponent(updates.ftaComponent);
            } else if (shouldClearChildren) {
              updatedNode.isContainer = nextIsContainer;
            }

            return updatedNode;
          }

          if (!childrenChanged) {
            return node;
          }

          return {
            ...node,
            children: updatedChildren,
          };
        };

        const newRootAnnotation = updateTree(prev.rootAnnotation);
        if (!hasChanges) {
          componentDetectionDebugLog('updateAnnotation:noChanges', { annotationId });
          return prev;
        }

        const sortedRootAnnotation = sortAnnotationChildren(newRootAnnotation);
        const flattenedAnnotations = flattenAnnotationTree(sortedRootAnnotation);

        let nextSelectedId = prev.selectedAnnotationId;
        if (nextSelectedId && removedChildIds.includes(nextSelectedId)) {
          nextSelectedId = annotationId;
        }

        const nextExpandedKeys = prev.expandedKeys
          .filter((key) => !removedChildIds.includes(key))
          .concat(removedChildIds.length > 0 && !prev.expandedKeys.includes(annotationId) ? [annotationId] : []);

        updatedSuccessfully = true;
        componentDetectionDebugLog('updateAnnotation:stateUpdated', {
          annotationId,
          removedChildCount: removedChildIds.length,
        });

        return {
          ...prev,
          rootAnnotation: sortedRootAnnotation,
          annotations: flattenedAnnotations,
          selectedAnnotationId: nextSelectedId,
          expandedKeys: Array.from(new Set(nextExpandedKeys)),
        };
      });

      componentDetectionDebugLog('updateAnnotation:completed', {
        annotationId,
        success: updatedSuccessfully,
      });

      return updatedSuccessfully;
    },
    [findAnnotationById, sortAnnotationChildren, flattenAnnotationTree]
  );

  // 选择标注（支持多选）
  const selectAnnotation = useCallback((annotationId: string | null, multiSelect: boolean = false) => {
    if (annotationId === null) {
      // 清空选择
      setSelectedNodeIds([]);
      setState((prev) => ({
        ...prev,
        selectedAnnotationId: null,
        selectedDSLNodeId: null,
      }));
      return;
    }

    if (multiSelect) {
      // 多选模式：切换选中状态
      setSelectedNodeIds((prev) => {
        const existingIndex = prev.findIndex((item) => item.id === annotationId && item.type === NodeType.ANNOTATION);

        if (existingIndex !== -1) {
          // 如果已选中，取消选中
          const newIds = prev.filter((_, index) => index !== existingIndex);
          setState((state) => ({
            ...state,
            selectedAnnotationId:
              newIds.length > 0 && newIds[newIds.length - 1].type === NodeType.ANNOTATION
                ? newIds[newIds.length - 1].id
                : null,
            selectedDSLNodeId: null,
          }));
          return newIds;
        } else {
          // 如果未选中，添加到选中列表
          const newIds = [...prev, { id: annotationId, type: NodeType.ANNOTATION }];
          setState((state) => ({
            ...state,
            selectedAnnotationId: annotationId,
            selectedDSLNodeId: null,
          }));
          return newIds;
        }
      });
    } else {
      // 单选模式
      setSelectedNodeIds([{ id: annotationId, type: NodeType.ANNOTATION }]);
      setState((prev) => ({
        ...prev,
        selectedAnnotationId: annotationId,
        selectedDSLNodeId: null,
      }));
    }
  }, []);

  // 清空选择
  const clearSelection = useCallback(() => {
    setSelectedNodeIds([]);
    setSelectedDSLNodeRef(null);
    setState((prev) => ({
      ...prev,
      selectedAnnotationId: null,
      selectedDSLNodeId: null,
    }));
  }, []);

  // 选择DSL节点（支持多选）
  const selectDSLNode = useCallback(
    (dslNode: DSLNode | null, multiSelect: boolean = false) => {
      if (dslNode === null) {
        setSelectedNodeIds([]);
        setSelectedDSLNodeRef(null);
        setState((prev) => ({
          ...prev,
          selectedDSLNodeId: null,
          selectedAnnotationId: null,
        }));
        return;
      }

      if (multiSelect) {
        setSelectedNodeIds((prev) => {
          const existingIndex = prev.findIndex((item) => item.id === dslNode.id && item.type === NodeType.DSL);
          const isAlreadySelected = existingIndex !== -1;
          const newIds = isAlreadySelected
            ? prev.filter((_, index) => index !== existingIndex)
            : [...prev, { id: dslNode.id, type: NodeType.DSL }];

          // 找到最后一个DSL节点作为selectedDSLNodeRef
          const lastDSLNodeId = [...newIds].reverse().find((item) => item.type === NodeType.DSL)?.id;
          const lastNode = lastDSLNodeId ? findDSLNodeById(lastDSLNodeId) : null;
          setSelectedDSLNodeRef(lastNode);

          setState((state) => ({
            ...state,
            selectedDSLNodeId: lastDSLNodeId || null,
            selectedAnnotationId: null,
          }));

          return newIds;
        });
      } else {
        setSelectedNodeIds([{ id: dslNode.id, type: NodeType.DSL }]);
        setSelectedDSLNodeRef(dslNode);
        setState((prev) => ({
          ...prev,
          selectedDSLNodeId: dslNode.id,
          selectedAnnotationId: null,
        }));
      }
    },
    [findDSLNodeById]
  );

  // 获取选中的DSL节点
  const getSelectedDSLNode = useCallback(() => {
    return selectedDSLNodeRef;
  }, [selectedDSLNodeRef]);

  // Hover标注
  const hoverAnnotation = useCallback((annotationId: string | null) => {
    setState((prev) => ({
      ...prev,
      hoveredAnnotationId: annotationId,
    }));
  }, []);

  // Hover DSL节点
  const hoverDSLNode = useCallback((dslNodeId: string | null) => {
    setState((prev) => ({
      ...prev,
      hoveredDSLNodeId: dslNodeId,
    }));
  }, []);

  // 设置展开的keys
  const setExpandedKeys = useCallback((keys: string[]) => {
    setState((prev) => ({
      ...prev,
      expandedKeys: keys,
    }));
  }, []);

  // 展开全部
  const expandAll = useCallback(() => {
    const allKeys = state.annotations.map((a) => a.id);
    setState((prev) => ({
      ...prev,
      expandedKeys: allKeys,
    }));
  }, [state.annotations]);

  // 收起全部（保留根节点展开）
  const collapseAll = useCallback(() => {
    setState((prev) => ({
      ...prev,
      expandedKeys: ['root'],
    }));
  }, []);

  // 查找能够包含所有选中节点的最小DSL节点
  const findContainingDSLNode = useCallback(
    (selectedAnnotations: AnnotationNode[], selectedDSLNodes: DSLNode[]): DSLNode | null => {
      if (!dslRootNode) return null;

      // 计算所有选中项的边界
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

      search(dslRootNode);
      return bestNode;
    },
    [dslRootNode, calculateDSLNodeAbsolutePosition, findAnnotationByDSLNodeId]
  );

  // 组合选中的节点创建标注
  const combineSelectedDSLNodes = useCallback(
    (ftaComponent: string): boolean => {
      if (selectedNodeIds.length === 0) {
        componentDetectionDebugLog('combineSelectedDSLNodes:skipNoSelection');
        return false;
      }

      let combinedSuccessfully = false;

      setState((prev) => {
        if (!prev.rootAnnotation) {
          componentDetectionDebugLog('combineSelectedDSLNodes:skipNoRoot');
          return prev;
        }

        const now = Date.now();

        const selectedAnnotationIds = selectedNodeIds
          .filter((item) => item.type === NodeType.ANNOTATION)
          .map((item) => item.id);
        const selectedDSLNodeIds = selectedNodeIds.filter((item) => item.type === NodeType.DSL).map((item) => item.id);

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
          return prev;
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
          return prev;
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
        buildParentMap(prev.rootAnnotation);

        const annotationsInBounds = prev.annotations.filter((annotation) => {
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
          return prev;
        }

        const detachNodes = (node: AnnotationNode): AnnotationNode => {
          let childrenChanged = false;
          const remainingChildren = node.children
            .filter((child) => !nodesToRemove.has(child.id))
            .map((child) => {
              const updatedChild = detachNodes(child);
              if (updatedChild !== child) {
                childrenChanged = true;
              }
              return updatedChild;
            });

          const changedByRemoval = remainingChildren.length !== node.children.length;
          childrenChanged = childrenChanged || changedByRemoval;

          if (!childrenChanged) {
            return node;
          }

          return {
            ...node,
            children: remainingChildren,
          };
        };

        const rootAfterRemoval = detachNodes(prev.rootAnnotation);

        const createNewAnnotation = (
          dslNodeId: string,
          dslNode: DSLNode | null,
          absoluteX: number,
          absoluteY: number,
          width: number,
          height: number,
          children: AnnotationNode[],
          comment?: string
        ): AnnotationNode => ({
          id: dslNodeId,
          dslNodeId,
          dslNode,
          ftaComponent,
          name: undefined,
          comment,
          isRoot: false,
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
            containingNode,
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
            null,
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
        const flattenedAnnotations = flattenAnnotationTree(sortedRootAnnotation);

        const expandedKeysSet = new Set(prev.expandedKeys);
        permanentlyRemovedIds.forEach((id) => expandedKeysSet.delete(id));
        expandedKeysSet.add(parent.id);
        expandedKeysSet.add(newAnnotation.id);

        combinedSuccessfully = true;
        componentDetectionDebugLog('combineSelectedDSLNodes:stateUpdated', {
          annotationId: newAnnotation.id,
          parentId: parent.id,
          attachedChildCount: annotationsToAttach.length,
          bounds: { minX, minY, maxX, maxY },
        });

        return {
          ...prev,
          rootAnnotation: sortedRootAnnotation,
          annotations: flattenedAnnotations,
          selectedAnnotationId: newAnnotation.id,
          selectedDSLNodeId: null,
          expandedKeys: Array.from(expandedKeysSet),
        };
      });

      if (combinedSuccessfully) {
        setSelectedNodeIds([]);
        setSelectedDSLNodeRef(null);
      }

      componentDetectionDebugLog('combineSelectedDSLNodes:completed', { success: combinedSuccessfully });

      return combinedSuccessfully;
    },
    [
      selectedNodeIds,
      findAnnotationById,
      findDSLNodeById,
      calculateDSLNodeAbsolutePosition,
      sortAnnotationChildren,
      findContainingDSLNode,
      findBestParent,
      flattenAnnotationTree,
    ]
  );

  // 边界计算辅助函数
  const calculateContainerBounds = useCallback(
    (children: AnnotationNode[]): { minX: number; minY: number; maxX: number; maxY: number } => {
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
    },
    []
  );

  // 查找父节点的辅助函数
  const findParentAnnotation = useCallback(
    (childId: string): AnnotationNode | null => {
      if (!state.rootAnnotation) return null;

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

      return search(state.rootAnnotation);
    },
    [state.rootAnnotation]
  );

  // 检查是否为祖先节点
  const isAncestor = useCallback(
    (ancestorId: string, descendantId: string): boolean => {
      const ancestor = findAnnotationById(ancestorId);
      if (!ancestor) return false;

      const checkDescendant = (node: AnnotationNode): boolean => {
        if (node.id === descendantId) return true;
        return node.children.some(checkDescendant);
      };

      return checkDescendant(ancestor);
    },
    [findAnnotationById]
  );

  // 验证拖拽移动
  const validateMove = useCallback(
    (
      sourceId: string,
      targetId: string,
      dropPosition: 'before' | 'inside' | 'after'
    ): { valid: boolean; reason?: string } => {
      // 获取源节点和目标节点
      const sourceNode = findAnnotationById(sourceId);
      const targetNode = findAnnotationById(targetId);

      if (!sourceNode || !targetNode) {
        return { valid: false, reason: '节点不存在' };
      }

      // 1. 不允许拖拽根节点
      if (sourceNode.isRoot) {
        return { valid: false, reason: '页面根节点不允许拖拽' };
      }

      // 2. 不允许拖拽到自己
      if (sourceId === targetId) {
        return { valid: false, reason: '不能拖拽到自己' };
      }

      // 3. 不允许循环引用（拖拽到自己的子节点）
      if (isAncestor(sourceId, targetId)) {
        return { valid: false, reason: '不能将父节点拖入子节点' };
      }

      // 4. 如果是拖入（inside），目标必须是容器
      if (dropPosition === 'inside' && !targetNode.isContainer) {
        return { valid: false, reason: '该组件不支持子节点，无法拖入' };
      }

      // 5. 检查跨越兄弟节点的情况
      const sourceParent = findParentAnnotation(sourceId);
      if (sourceParent && dropPosition !== 'inside') {
        const siblings = sourceParent.children;
        const sourceIndex = siblings.findIndex((child) => child.id === sourceId);

        // 如果是拖出容器的操作（目标是父节点的兄弟或父节点）
        const targetParent = findParentAnnotation(targetId);
        const isEscapeMove = targetParent?.id === findParentAnnotation(sourceParent.id)?.id;

        if (isEscapeMove && siblings.length > 1) {
          // 检查是否是第一个或最后一个子节点
          const isFirst = sourceIndex === 0;
          const isLast = sourceIndex === siblings.length - 1;

          if (!isFirst && !isLast) {
            return {
              valid: false,
              reason: '该节点位于中间位置，请先调整为第一个或最后一个子节点',
            };
          }

          // 检查拖拽方向是否合法
          if (isFirst && dropPosition === 'after') {
            // 第一个节点只能向上拖出（before）
            return { valid: false, reason: '第一个子节点只能向上拖出' };
          }

          if (isLast && dropPosition === 'before') {
            // 最后一个节点只能向下拖出（after）
            return { valid: false, reason: '最后一个子节点只能向下拖出' };
          }
        }
      }

      return { valid: true };
    },
    [findAnnotationById, findParentAnnotation, isAncestor]
  );

  // 移动标注节点
  const moveAnnotation = useCallback(
    async (
      sourceId: string,
      targetId: string,
      dropPosition: 'before' | 'inside' | 'after'
    ): Promise<{ success: boolean; error?: string }> => {
      // 先验证
      const validation = validateMove(sourceId, targetId, dropPosition);
      if (!validation.valid) {
        return { success: false, error: validation.reason };
      }

      return new Promise((resolve) => {
        setState((prev) => {
          if (!prev.rootAnnotation) {
            resolve({ success: false, error: '根节点不存在' });
            return prev;
          }

          const now = Date.now();

          // 克隆树并执行移动操作
          const cloneNode = (node: AnnotationNode): AnnotationNode => ({
            ...node,
            children: node.children.map(cloneNode),
          });

          let newRoot = cloneNode(prev.rootAnnotation);
          let sourceNode: AnnotationNode | null = null;
          let moved = false;

          // 第一步：从原位置移除源节点
          const removeNode = (node: AnnotationNode): AnnotationNode => {
            const newChildren: AnnotationNode[] = [];
            for (const child of node.children) {
              if (child.id === sourceId) {
                sourceNode = child;
                continue; // 跳过源节点
              }
              newChildren.push(removeNode(child));
            }
            return { ...node, children: newChildren };
          };

          newRoot = removeNode(newRoot);

          if (!sourceNode) {
            resolve({ success: false, error: '源节点未找到' });
            return prev;
          }

          // 第二步：插入到目标位置
          const insertNode = (node: AnnotationNode): AnnotationNode => {
            if (node.id === targetId) {
              if (dropPosition === 'inside') {
                // 插入为子节点
                return {
                  ...node,
                  children: [...node.children, sourceNode!],
                  updatedAt: now,
                };
              }
              // before 和 after 由父节点处理
              return node;
            }

            // 处理子节点
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
            resolve({ success: false, error: '插入位置未找到' });
            return prev;
          }

          // 第三步：更新容器边界
          const updateBounds = (node: AnnotationNode): AnnotationNode => {
            if (node.children.length === 0) {
              return node;
            }

            // 递归更新子节点
            const updatedChildren = node.children.map(updateBounds);

            // 如果是容器，重新计算边界
            if (node.isContainer) {
              const bounds = calculateContainerBounds(updatedChildren);

              // 如果是虚拟容器，完全使用计算出的边界
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

              // 对于普通容器，扩展边界以包含所有子节点
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

          // 第四步：清理空的虚拟容器
          const cleanEmptyVirtualContainers = (node: AnnotationNode): AnnotationNode => {
            const cleanedChildren = node.children.map(cleanEmptyVirtualContainers).filter((child) => {
              // 移除空的虚拟容器
              return !(child.id.startsWith(VIRTUAL_ANNOTATION_PREFIX) && child.children.length === 0);
            });

            return { ...node, children: cleanedChildren };
          };

          newRoot = cleanEmptyVirtualContainers(newRoot);

          // 排序和扁平化
          const sortedRoot = sortAnnotationChildren(newRoot);
          const flattenedAnnotations = flattenAnnotationTree(sortedRoot);

          resolve({ success: true });

          return {
            ...prev,
            rootAnnotation: sortedRoot,
            annotations: flattenedAnnotations,
            selectedAnnotationId: sourceId, // 保持选中移动的节点
          };
        });
      });
    },
    [validateMove, calculateContainerBounds, sortAnnotationChildren, flattenAnnotationTree]
  );

  // 切换显示所有框线
  const toggleShowAllBorders = useCallback(() => {
    setShowAllBorders((prev) => !prev);
  }, []);

  const updateDslRootNode = useCallback((node: DSLNode | null) => {
    setDslRootNode(node);
  }, []);

  // 保存标注到服务端，并在本地缓存副本
  const saveAnnotations = useCallback(
    async (designId: string): Promise<void> => {
      try {
        if (!state.rootAnnotation) {
          throw new Error('No root annotation to save');
        }
        await saveAnnotationState(designId, state.rootAnnotation);
        componentDetectionDebugLog('saveAnnotations:success', { designId });
      } catch (error) {
        componentDetectionDebugLog('saveAnnotations:failed', { designId, error });
        throw error;
      }
    },
    [state.rootAnnotation]
  );

  // 加载标注从 localStorage
  const loadAnnotations = useCallback(
    (rootAnnotation: AnnotationNode) => {
      try {
        const flattenedAnnotations = flattenAnnotationTree(rootAnnotation);
        setState((prev) => ({
          ...prev,
          rootAnnotation,
          annotations: flattenedAnnotations,
          selectedAnnotationId: null,
          selectedDSLNodeId: null,
        }));
        componentDetectionDebugLog('loadAnnotations:success', {
          annotationCount: flattenedAnnotations.length,
        });
      } catch (error) {
        componentDetectionDebugLog('loadAnnotations:failed', { error });
        throw error;
      }
    },
    [flattenAnnotationTree]
  );

  const value: ComponentDetectionContextValue = {
    ...state,
    initializeFromDSL,
    createAnnotation,
    deleteAnnotation,
    updateAnnotation,
    saveAnnotations,
    loadAnnotations,
    selectAnnotation,
    selectDSLNode,
    hoverAnnotation,
    hoverDSLNode,
    clearSelection,
    combineSelectedDSLNodes,
    validateMove,
    moveAnnotation,
    setExpandedKeys,
    expandAll,
    collapseAll,
    findAnnotationById,
    findAnnotationByDSLNodeId,
    findDSLNodeById,
    calculateDSLNodeAbsolutePosition,
    getSelectedDSLNode,
    dslRootNode,
    updateDslRootNode,
    showAllBorders,
    toggleShowAllBorders,
    selectedNodeIds,
  };

  return <ComponentDetectionContext.Provider value={value}>{children}</ComponentDetectionContext.Provider>;
};
