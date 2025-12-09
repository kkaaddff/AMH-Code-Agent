// ==================== 类型定义 ====================

import type { DSLNode, DSLLayoutStyle } from '@fta/shared';

type LayoutStyle = DSLLayoutStyle;

interface CleanerConfig {
  // 节点过滤配置
  /** 移除空节点 */
  removeEmptyNodes: boolean;
  /** 移除蒙版层 */
  removeMaskLayers: boolean;
  /** 移除超界节点 */
  removeOutOfBounds: boolean;
  /** 移除不可见节点 */
  removeInvisibleNodes: boolean;

  // Icon 处理配置
  /** 检测 Icon */
  detectIcons: boolean;
  /** 合并 Icon 图层 */
  mergeIconLayers: boolean;
  /** Icon 最大尺寸阈值 */
  iconMaxSize: number;
  /** Icon 最小图层数 */
  iconMinLayers: number;
  /** Icon 路径邻近合并阈值 */
  iconProximityThreshold: number;

  // 层级优化配置
  /** 计算 z-index */
  buildZIndex: boolean;
  /** 检查遮挡关系 */
  checkOverlapping: boolean;
  /** 移除完全被遮挡的节点 */
  removeCompletelyHidden: boolean;

  // 树结构优化配置
  /** 扁平化单子节点 */
  flattenSingleChild: boolean;
  /** 优化树深度 */
  optimizeDepth: boolean;
  /** 保留语义化结构 */
  preserveSemantics: boolean;

  // 调试配置
  /** 详细日志 */
  verbose: boolean;
  /** 干运行模式（不实际修改） */
  dryRun: boolean;
}

interface CleanResult {
  root: DSLNode;
  icons: IconNode[];
  removed: RemovedNode[];
  statistics: Statistics;
}

interface IconNode {
  type: 'ICON';
  id: string;
  name: string;
  layoutStyle: LayoutStyle;
  paths: IconPath[];
  needsConversion: boolean;
  originalChildren: DSLNode[];
}

interface IconPath {
  fill: any;
  layoutStyle: LayoutStyle;
  name?: string;
}

interface RemovedNode {
  node: DSLNode;
  reason: string;
  config: string;
}

export interface Statistics {
  totalNodes: number;
  processedNodes: number;
  removedNodes: number;
  iconsDetected: number;
  depthReduced: number;
  processingTime: number;
  // 新增：处理前后节点数量统计（递归计算）
  nodeCountBefore: number;
  nodeCountAfter: number;
}

// ==================== 默认配置 ====================

const DEFAULT_CONFIG: CleanerConfig = {
  removeEmptyNodes: true,

  removeMaskLayers: true,
  removeOutOfBounds: true,
  removeInvisibleNodes: true,

  detectIcons: true,
  mergeIconLayers: true,
  iconMaxSize: 100,
  iconMinLayers: 2,
  iconProximityThreshold: 10,

  buildZIndex: true,
  checkOverlapping: true,
  removeCompletelyHidden: true,

  flattenSingleChild: true,
  optimizeDepth: true,
  preserveSemantics: true,

  verbose: false,
  dryRun: false,
};

const Z_INDEX_DEPTH_WEIGHT = 100000;

// ==================== 主清洗类 ====================

class DSLCleaner {
  private config: CleanerConfig;
  private removed: RemovedNode[] = [];
  private icons: IconNode[] = [];
  private startTime = 0;

  constructor(config: Partial<CleanerConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * 主清洗入口（单 root 节点）
   */
  public clean(root: DSLNode): CleanResult {
    this.startTime = Date.now();
    this.removed = [];
    this.icons = [];

    const nodes: DSLNode[] = [root];

    this.log('开始清洗 DSL...', nodes.length, '个根节点');

    // =====================================================
    // 阶段 0：预处理 - 计算所有节点的绝对坐标
    // =====================================================
    const nodesWithAbsPos = this.calculateAbsolutePositions(nodes, 0, 0);
    this.log('绝对坐标计算完成');

    // =====================================================
    // 阶段 1：节点过滤（使用绝对坐标）
    // =====================================================
    let filteredNodes = this.filterNodes(nodesWithAbsPos);
    this.log('节点过滤完成，剩余', filteredNodes.length, '个节点');

    // =====================================================
    // 阶段 2：层级分析与优化（使用绝对坐标）
    // =====================================================
    if (this.config.buildZIndex) {
      filteredNodes = this.optimizeLayering(filteredNodes);
      this.log('层级优化完成');
    }

    // =====================================================
    // 阶段 3：Icon 处理（邻近合并 + 检测）
    // =====================================================
    filteredNodes = this.processIconsWithMerge(filteredNodes);
    this.log('Icon 处理完成，检测到', this.icons.length, '个 Icons');

    // =====================================================
    // 阶段 4：树结构优化
    // =====================================================
    filteredNodes = this.optimizeTreeStructure(filteredNodes);
    this.log('树结构优化完成');

    // =====================================================
    // 阶段 5：后处理 - 根据绝对坐标重新计算相对坐标
    // =====================================================
    const finalNodes = this.recalculateRelativePositions(filteredNodes, 0, 0);
    this.log('相对坐标重新计算完成');

    const processingTime = Date.now() - this.startTime;

    const finalRoot = finalNodes[0];

    return {
      root: this.config.dryRun ? root : finalRoot,
      icons: this.icons,
      removed: this.removed,
      statistics: {
        totalNodes: this.countNodes(nodes),
        processedNodes: this.countNodes(finalNodes),
        removedNodes: this.removed.length,
        iconsDetected: this.icons.length,
        depthReduced: this.calculateDepthReduction(nodes, finalNodes),
        processingTime,
        nodeCountBefore: this.countNodesRecursive(nodes),
        nodeCountAfter: this.countNodesRecursive(finalNodes),
      },
    };
  }

  // ==================== 阶段 0：计算绝对坐标 ====================

  /**
   * 遍历所有节点，计算每个节点的绝对坐标
   */
  private calculateAbsolutePositions(nodes: DSLNode[], parentAbsX: number, parentAbsY: number): DSLNode[] {
    return nodes.map((node) => {
      const relX = node.layoutStyle?.relativeX || 0;
      const relY = node.layoutStyle?.relativeY || 0;
      const width = node.layoutStyle?.width || 0;
      const height = node.layoutStyle?.height || 0;

      const absX = parentAbsX + relX;
      const absY = parentAbsY + relY;

      const result: DSLNode = {
        ...node,
        _absoluteX: absX,
        _absoluteY: absY,
        _absoluteWidth: width,
        _absoluteHeight: height,
      };

      if (node.children && node.children.length > 0) {
        result.children = this.calculateAbsolutePositions(node.children, absX, absY);
      }

      return result;
    });
  }

  // ==================== 阶段 1：节点过滤（使用绝对坐标） ====================

  private filterNodes(nodes: DSLNode[], parent?: DSLNode): DSLNode[] {
    return nodes
      .map((node) => {
        // 检查各种过滤条件
        if (this.config.removeInvisibleNodes && this.isInvisible(node)) {
          this.markRemoved(node, 'invisible node', 'removeInvisibleNodes');
          return null;
        }

        if (this.config.removeEmptyNodes && this.isEmpty(node)) {
          this.markRemoved(node, 'empty node', 'removeEmptyNodes');
          return null;
        }

        if (this.config.removeMaskLayers && this.isMaskLayer(node)) {
          this.markRemoved(node, 'mask layer', 'removeMaskLayers');
          return null;
        }

        // 使用绝对坐标判断是否越界
        if (this.config.removeOutOfBounds && parent && this.isOutOfBoundsAbsolute(node, parent)) {
          this.markRemoved(node, 'out of bounds', 'removeOutOfBounds');
          return null;
        }

        // 递归处理子节点
        if (node.children && node.children.length > 0) {
          const filteredChildren = this.filterNodes(node.children, node);
          node = { ...node, children: filteredChildren };
        }

        return node;
      })
      .filter((node): node is DSLNode => node !== null);
  }

  /**
   * 判断是否为空节点
   */
  private isEmpty(node: DSLNode): boolean {
    const hasFill =
      (node as any).fill ||
      (node.type === 'PATH' && (node as any).path) ||
      (node.type === 'LAYER' && (node as any).fill);

    const hasText = node.type === 'TEXT' && (node as any).text;
    const hasStroke = (node as any).strokeColor || (node as any).strokeWidth;
    const hasEffect = (node as any).effect;
    const hasContent = hasFill || hasText || hasStroke || hasEffect;
    const hasChildren = node.children && node.children.length > 0;
    return !hasContent && !hasChildren;
  }

  /**
   * 判断是否为蒙版层
   */
  private isMaskLayer(node: DSLNode): boolean {
    const name = (node.name || '').toLowerCase();
    const hasMaskKeyword =
      name.includes('蒙版') || name.includes('mask') || name.includes('遮罩') || name.includes('遮挡');

    const opacity = typeof node.opacity === 'string' ? parseFloat(node.opacity) : node.opacity;
    const isTransparent = opacity === 0;
    const hasMaskProperty = node.mask === 'alpha' || node.mask === 'outline';

    let hasTransparentFill = false;
    const fill = (node as any).fill;
    if (typeof fill === 'string') {
      hasTransparentFill = fill.includes('rgba') && fill.includes(', 0)');
    }

    return hasMaskKeyword || isTransparent || hasMaskProperty || hasTransparentFill;
  }

  /**
   * 使用绝对坐标判断是否超出父容器边界
   */
  private isOutOfBoundsAbsolute(node: DSLNode, parent: DSLNode): boolean {
    // 检查父容器是否裁剪内容
    const parentClips =
      (parent as any).mask === 'outline' ||
      (parent as any).overflow === 'hidden' ||
      (parent as any).overflow === 'scroll' ||
      (parent as any).overflow === 'auto' ||
      (parent.name && (parent.name.includes('蒙版') || parent.name.includes('Mask')));

    // 如果父容器不裁剪，允许子节点超出边界
    if (!parentClips) {
      return false;
    }

    // 使用绝对坐标计算边界
    const nodeLeft = node._absoluteX || 0;
    const nodeTop = node._absoluteY || 0;
    const nodeRight = (node._absoluteX || 0) + (node._absoluteWidth || 0);
    const nodeBottom = (node._absoluteY || 0) + (node._absoluteHeight || 0);

    const parentLeft = parent._absoluteX || 0;
    const parentTop = parent._absoluteY || 0;
    const parentRight = (parent._absoluteX || 0) + (parent._absoluteWidth || 0);
    const parentBottom = (parent._absoluteY || 0) + (parent._absoluteHeight || 0);

    // 完全在左侧或上方
    if (nodeRight < parentLeft || nodeBottom < parentTop) {
      return true;
    }

    // 完全在右侧或下方
    if (nodeLeft > parentRight || nodeTop > parentBottom) {
      return true;
    }

    return false;
  }

  // ==================== 阶段 2：Icon 处理 ====================

  private processIcons(nodes: DSLNode[]): DSLNode[] {
    return nodes.map((node) => {
      const iconNode = this.detectIcon(node);
      if (iconNode) {
        this.icons.push(iconNode);
        return { ...node, ...iconNode } as any;
      }

      if (node.children && node.children.length > 0) {
        node = { ...node, children: this.processIcons(node.children) };
      }

      return node;
    });
  }

  /**
   * Icon 处理统一入口：可选邻近合并 + 检测
   */
  private processIconsWithMerge(nodes: DSLNode[]): DSLNode[] {
    let workingNodes = nodes;

    if (this.config.detectIcons && this.config.mergeIconLayers) {
      const mergeResult = this.mergeProximatePaths(workingNodes);
      workingNodes = mergeResult.nodes;
      this.icons.push(...mergeResult.icons);
      this.log('Icon 邻近路径合并完成，新增', mergeResult.icons.length, '个 Icons');
    }

    if (this.config.detectIcons) {
      workingNodes = this.processIcons(workingNodes);
    }

    return workingNodes;
  }

  private detectIcon(node: DSLNode): IconNode | null {
    if (node.type !== 'GROUP' && node.type !== 'FRAME') {
      return null;
    }

    const width = node._absoluteWidth || 0;
    const height = node._absoluteHeight || 0;

    const isSmallEnough = width <= this.config.iconMaxSize && height <= this.config.iconMaxSize;

    if (!isSmallEnough) {
      return null;
    }

    const svgLayers = this.extractSvgLayers(node);

    if (svgLayers.length < this.config.iconMinLayers) {
      return null;
    }

    const name = (node.name || '').toLowerCase();
    const hasIconKeyword =
      name.includes('icon') || name.includes('图标') || name.includes('路径') || name.includes('形状');

    if (svgLayers.length >= this.config.iconMinLayers && (isSmallEnough || hasIconKeyword)) {
      return {
        type: 'ICON',
        id: node.id,
        name: node.name || 'icon',
        layoutStyle: node.layoutStyle!,
        paths: svgLayers,
        needsConversion: this.config.mergeIconLayers,
        originalChildren: node.children || [],
      };
    }

    return null;
  }

  private extractSvgLayers(node: DSLNode): IconPath[] {
    const paths: IconPath[] = [];

    const traverse = (n: DSLNode) => {
      if (n.type === 'LAYER') {
        const fill = (n as any).fill;
        if (fill) {
          const hasSvgFill =
            Array.isArray(fill) && fill.some((f) => (typeof f === 'object' && f.url) || typeof f === 'string');

          if (hasSvgFill || n.name?.includes('路径') || n.name?.includes('形状')) {
            paths.push({
              fill: fill,
              layoutStyle: n.layoutStyle!,
              name: n.name,
            });
          }
        }
      }

      if (n.type === 'PATH' && (n as any).path) {
        paths.push({
          fill: (n as any).path,
          layoutStyle: n.layoutStyle!,
          name: n.name,
        });
      }

      (n.children || []).forEach(traverse);
    };

    traverse(node);
    return paths;
  }

  // ==================== 阶段 3：层级优化（使用绝对坐标） ====================
  private optimizeLayering(nodes: DSLNode[]): DSLNode[] {
    if (!this.config.checkOverlapping) {
      return nodes;
    }

    const counter = { value: 0 };
    const withZIndex = this.applyZIndex(nodes, 0, counter);
    const flattened = this.flattenNodes(withZIndex).sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const visibility = new Map<string, boolean>();

    flattened.forEach((n) => visibility.set(n.id, true));

    for (let i = 0; i < flattened.length; i++) {
      const current = flattened[i];
      if (!visibility.get(current.id)) {
        continue;
      }

      for (let j = i + 1; j < flattened.length; j++) {
        const upper = flattened[j];
        if (!visibility.get(upper.id)) {
          continue;
        }

        if (this.isCompletelyOverlappedAbsolute(current, upper)) {
          visibility.set(current.id, false);
          if (this.config.removeCompletelyHidden) {
            this.markRemoved(current, 'completely hidden by upper layer', 'removeCompletelyHidden');
          }
          break;
        }
      }
    }

    return this.applyVisibility(
      withZIndex,
      visibility,
      this.config.removeInvisibleNodes && this.config.removeCompletelyHidden
    );
  }

  /**
   * 使用绝对坐标判断下层节点是否被上层节点完全遮挡
   */
  private isCompletelyOverlappedAbsolute(lower: DSLNode, upper: DSLNode): boolean {
    const upperOpacity = typeof upper.opacity === 'string' ? parseFloat(upper.opacity) : upper.opacity;
    const isOpaque = !upperOpacity || upperOpacity >= 0.99;
    const upperFill = (upper as any).fill;
    const hasFill = upperFill && !this.isTransparentFill(upperFill);

    if (!isOpaque || !hasFill) {
      return false;
    }

    // 使用绝对坐标计算边界
    const lowerLeft = lower._absoluteX || 0;
    const lowerTop = lower._absoluteY || 0;
    const lowerRight = (lower._absoluteX || 0) + (lower._absoluteWidth || 0);
    const lowerBottom = (lower._absoluteY || 0) + (lower._absoluteHeight || 0);

    const upperLeft = upper._absoluteX || 0;
    const upperTop = upper._absoluteY || 0;
    const upperRight = (upper._absoluteX || 0) + (upper._absoluteWidth || 0);
    const upperBottom = (upper._absoluteY || 0) + (upper._absoluteHeight || 0);

    // 判断 lower 是否完全在 upper 内部
    return lowerLeft >= upperLeft && lowerTop >= upperTop && lowerRight <= upperRight && lowerBottom <= upperBottom;
  }

  private isTransparentFill(fill: any): boolean {
    if (typeof fill === 'string') {
      return fill.includes('transparent') || (fill.includes('rgba') && fill.includes(', 0)'));
    }

    if (Array.isArray(fill)) {
      return fill.every((f) => this.isTransparentFill(f));
    }

    return false;
  }

  private isInvisible(node: DSLNode): boolean {
    if (node.hidden === true) {
      return true;
    }

    const opacity = typeof node.opacity === 'string' ? parseFloat(node.opacity) : node.opacity;
    if (opacity !== undefined && opacity <= 0.01) {
      return true;
    }

    return false;
  }

  /**
   * 根据树深度 + 兄弟顺序计算 zIndex
   */
  private applyZIndex(nodes: DSLNode[], depth: number, counter: { value: number }): DSLNode[] {
    return nodes.map((node) => {
      const order = counter.value++;
      const currentZIndex = depth * Z_INDEX_DEPTH_WEIGHT + order;
      const result: DSLNode = {
        ...node,
        zIndex: currentZIndex,
      };

      if (node.children && node.children.length > 0) {
        result.children = this.applyZIndex(node.children, depth + 1, counter);
      }

      return result;
    });
  }

  /**
   * 展平节点列表（保留计算后的 zIndex）
   */
  private flattenNodes(nodes: DSLNode[]): DSLNode[] {
    const list: DSLNode[] = [];
    const walk = (items: DSLNode[]) => {
      items.forEach((n) => {
        list.push(n);
        if (n.children && n.children.length > 0) {
          walk(n.children);
        }
      });
    };
    walk(nodes);
    return list;
  }

  /**
   * 根据可见性重新组装树；可选移除被遮挡节点
   */
  private applyVisibility(nodes: DSLNode[], visibility: Map<string, boolean>, removeHidden: boolean): DSLNode[] {
    return nodes
      .map((node) => {
        const isVisible = visibility.get(node.id) !== false;
        const next: DSLNode = { ...node, isVisible };

        if (node.children && node.children.length > 0) {
          next.children = this.applyVisibility(node.children, visibility, removeHidden);
        }

        if (removeHidden && !isVisible) {
          return null;
        }

        return next;
      })
      .filter((n): n is DSLNode => n !== null);
  }

  // ==================== 阶段 4：树结构优化 ====================

  private optimizeTreeStructure(nodes: DSLNode[]): DSLNode[] {
    return nodes.map((node) => {
      let optimizedNode = { ...node };

      if (optimizedNode.children && optimizedNode.children.length > 0) {
        optimizedNode.children = this.optimizeTreeStructure(optimizedNode.children);
      }

      if (this.config.flattenSingleChild) {
        optimizedNode = this.flattenSingleChild(optimizedNode);
      }

      return optimizedNode;
    });
  }

  /**
   * 扁平化单子节点容器（保留绝对坐标）
   */
  private flattenSingleChild(node: DSLNode): DSLNode {
    if (!node.children || node.children.length !== 1) {
      return node;
    }

    if (this.config.preserveSemantics) {
      const hasImportantStyle =
        (node as any).fill ||
        (node as any).strokeColor ||
        (node as any).effect ||
        (node as any).flexContainerInfo ||
        (node as any).borderRadius ||
        (node as any).opacity !== undefined ||
        (node as any).mask ||
        (node as any).overflow;

      if (hasImportantStyle) {
        return node;
      }
    }

    // 返回子节点，保留其原有的绝对坐标
    const child = node.children[0];
    return child;
  }

  // ==================== 阶段 5：重新计算相对坐标 ====================

  /**
   * 根据清洗后的树结构，重新计算每个节点的相对坐标
   * 并清除临时的绝对坐标属性
   */
  private recalculateRelativePositions(nodes: DSLNode[], parentAbsX: number, parentAbsY: number): DSLNode[] {
    return nodes.map((node) => {
      // 根据绝对坐标和新的父节点位置计算新的相对坐标
      const newRelativeX = (node._absoluteX || 0) - parentAbsX;
      const newRelativeY = (node._absoluteY || 0) - parentAbsY;

      // 创建新节点，更新相对坐标
      const result: any = {
        ...node,
        layoutStyle: {
          ...node.layoutStyle,
          relativeX: newRelativeX,
          relativeY: newRelativeY,
        },
      };

      // 清除临时属性
      delete result._absoluteX;
      delete result._absoluteY;
      delete result._absoluteWidth;
      delete result._absoluteHeight;

      // 递归处理子节点，使用当前节点的绝对坐标作为父坐标
      if (node.children && node.children.length > 0) {
        result.children = this.recalculateRelativePositions(node.children, node._absoluteX || 0, node._absoluteY || 0);
      }

      return result as DSLNode;
    });
  }

  // ==================== 辅助方法 ====================

  private markRemoved(node: DSLNode, reason: string, config: string): void {
    this.removed.push({ node, reason, config });
  }

  private countNodes(nodes: DSLNode[]): number {
    let count = nodes.length;

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        count += this.countNodes(node.children);
      }
    }

    return count;
  }

  /**
   * 递归统计节点数量（用于处理前后对比）
   */
  private countNodesRecursive(nodes: DSLNode[]): number {
    let count = 0;

    for (const node of nodes) {
      count += 1; // 计算当前节点
      if (node.children && node.children.length > 0) {
        count += this.countNodesRecursive(node.children);
      }
    }

    return count;
  }

  private calculateDepthReduction(original: DSLNode[], optimized: DSLNode[]): number {
    const originalDepth = this.getMaxDepth(original);
    const optimizedDepth = this.getMaxDepth(optimized);
    return originalDepth - optimizedDepth;
  }

  private getMaxDepth(nodes: DSLNode[], currentDepth = 0): number {
    if (!nodes || nodes.length === 0) {
      return currentDepth;
    }

    let maxDepth = currentDepth;

    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        const childDepth = this.getMaxDepth(node.children, currentDepth + 1);
        maxDepth = Math.max(maxDepth, childDepth);
      }
    }

    return maxDepth;
  }

  private log(...args: any[]): void {
    if (this.config.verbose) {
      console.log('[DSLCleaner]', ...args);
    }
  }

  // ==================== Icon 邻近路径合并 ====================

  private mergeProximatePaths(nodes: DSLNode[]): { nodes: DSLNode[]; icons: IconNode[] } {
    const pathEntries: { node: DSLNode }[] = [];

    const collectPaths = (list: DSLNode[]) => {
      for (const n of list) {
        if (n.type === 'PATH') {
          pathEntries.push({ node: n });
        }
        if (n.children && n.children.length > 0) {
          collectPaths(n.children as DSLNode[]);
        }
      }
    };

    collectPaths(nodes);

    if (pathEntries.length < this.config.iconMinLayers) {
      return { nodes, icons: [] };
    }

    const groups: number[][] = [];
    const visited = new Set<number>();
    const threshold = this.config.iconProximityThreshold;

    const isAdjacent = (a: DSLNode, b: DSLNode) => {
      const ax = a._absoluteX || 0;
      const ay = a._absoluteY || 0;
      const aw = a._absoluteWidth || 0;
      const ah = a._absoluteHeight || 0;

      const bx = b._absoluteX || 0;
      const by = b._absoluteY || 0;
      const bw = b._absoluteWidth || 0;
      const bh = b._absoluteHeight || 0;

      const overlapX = ax <= bx + bw && bx <= ax + aw;
      const overlapY = ay <= by + bh && by <= ay + ah;
      if (overlapX && overlapY) {
        return true;
      }

      const gapX = Math.max(0, Math.max(ax - (bx + bw), bx - (ax + aw)));
      const gapY = Math.max(0, Math.max(ay - (by + bh), by - (ay + ah)));
      const distance = Math.max(gapX, gapY);
      return distance <= threshold;
    };

    const buildGroup = (startIndex: number) => {
      const queue = [startIndex];
      visited.add(startIndex);
      const indices: number[] = [];

      while (queue.length) {
        const idx = queue.shift()!;
        indices.push(idx);
        const nodeA = pathEntries[idx].node;
        for (let j = 0; j < pathEntries.length; j++) {
          if (visited.has(j)) continue;
          const nodeB = pathEntries[j].node;
          if (isAdjacent(nodeA, nodeB)) {
            visited.add(j);
            queue.push(j);
          }
        }
      }
      return indices;
    };

    for (let i = 0; i < pathEntries.length; i++) {
      if (visited.has(i)) continue;
      groups.push(buildGroup(i));
    }

    const iconNodes: IconNode[] = [];
    const iconDSLNodes: DSLNode[] = [];
    const removedIds = new Set<string>();

    groups.forEach((g, idx) => {
      if (g.length < this.config.iconMinLayers) {
        return;
      }

      const grouped = g.map((gi) => pathEntries[gi].node);

      const minX = Math.min(...grouped.map((n) => n._absoluteX || 0));
      const minY = Math.min(...grouped.map((n) => n._absoluteY || 0));
      const maxX = Math.max(...grouped.map((n) => (n._absoluteX || 0) + (n._absoluteWidth || 0)));
      const maxY = Math.max(...grouped.map((n) => (n._absoluteY || 0) + (n._absoluteHeight || 0)));

      const width = maxX - minX;
      const height = maxY - minY;

      const paths: IconPath[] = grouped.map((p, pi) => ({
        fill: (p as any).path || (p as any).fill,
        layoutStyle: {
          ...p.layoutStyle,
          relativeX: (p._absoluteX || 0) - minX,
          relativeY: (p._absoluteY || 0) - minY,
        } as LayoutStyle,
        name: p.name || `path-${pi + 1}`,
      }));

      const icon: IconNode = {
        type: 'ICON',
        id: `icon-${idx + 1}`,
        name: `icon-${idx + 1}`,
        layoutStyle: {
          ...grouped[0].layoutStyle,
          width,
          height,
          relativeX: minX,
          relativeY: minY,
        } as LayoutStyle,
        paths,
        needsConversion: true,
        originalChildren: grouped,
      };

      iconNodes.push(icon);

      const mergedPathItems = grouped.flatMap((p) => {
        const pathItems = (p as any).path;
        return Array.isArray(pathItems) ? pathItems : [];
      });

      const iconDSL: DSLNode = {
        id: icon.id,
        type: 'PATH',
        name: icon.name,
        layoutStyle: {
          ...icon.layoutStyle,
          relativeX: minX,
          relativeY: minY,
          width,
          height,
        },
        _absoluteX: minX,
        _absoluteY: minY,
        _absoluteWidth: width,
        _absoluteHeight: height,
        path: mergedPathItems,
      };

      iconDSLNodes.push(iconDSL);
      grouped.forEach((p) => removedIds.add(p.id));
    });

    if (iconNodes.length === 0) {
      return { nodes, icons: [] };
    }

    const cleanedNodes = this.removeNodesById(nodes, removedIds);
    const rootNode = cleanedNodes[0];

    if (rootNode) {
      const existingChildren = Array.isArray(rootNode.children) ? (rootNode.children as DSLNode[]) : [];
      rootNode.children = [...existingChildren, ...iconDSLNodes];
    }

    return { nodes: rootNode ? [rootNode] : cleanedNodes, icons: iconNodes };
  }

  private removeNodesById(nodes: DSLNode[], removedIds: Set<string>): DSLNode[] {
    return nodes
      .map((node) => {
        if (removedIds.has(node.id)) {
          return null;
        }

        if (node.children && node.children.length > 0) {
          const keptChildren = this.removeNodesById(node.children as DSLNode[], removedIds);
          return { ...node, children: keptChildren };
        }

        return node;
      })
      .filter((n): n is DSLNode => n !== null);
  }
}

// ==================== SVG 转 PNG 工具类 ====================

class IconConverter {
  static async convertToPNG(icon: IconNode, scale = 2): Promise<Blob> {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;

    const { width = 48, height = 48 } = icon.layoutStyle;
    canvas.width = width * scale;
    canvas.height = height * scale;

    ctx.scale(scale, scale);

    for (const path of icon.paths) {
      const { relativeX = 0, relativeY = 0, width: w = 0, height: h = 0 } = path.layoutStyle;

      if (Array.isArray(path.fill)) {
        ctx.fillStyle = this.parseFill(path.fill[0]);
      } else {
        ctx.fillStyle = this.parseFill(path.fill);
      }

      ctx.fillRect(relativeX, relativeY, w, h);
    }

    return new Promise((resolve) => {
      canvas.toBlob((blob) => resolve(blob!), 'image/png');
    });
  }

  static async convertToPNGNode(_icon: IconNode): Promise<Buffer> {
    throw new Error('Puppeteer not implemented in this example');
  }

  private static generateSVG(icon: IconNode): string {
    const { width = 48, height = 48 } = icon.layoutStyle;

    let pathsStr = '';
    for (const path of icon.paths) {
      const fill = this.parseFill(Array.isArray(path.fill) ? path.fill[0] : path.fill);
      const { relativeX = 0, relativeY = 0, width: w = 0, height: h = 0 } = path.layoutStyle;

      pathsStr += `<rect x="${relativeX}" y="${relativeY}" width="${w}" height="${h}" fill="${fill}" />`;
    }

    return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">${pathsStr}</svg>`;
  }

  private static parseFill(fill: any): string {
    if (typeof fill === 'string') {
      return fill;
    }

    if (Array.isArray(fill) && fill.length > 0) {
      return fill[0];
    }

    return '#000000';
  }
}

export { DSLCleaner, IconConverter, DEFAULT_CONFIG };
export type { CleanerConfig, CleanResult, IconNode };
export type { DSLNode } from '@fta/shared';
