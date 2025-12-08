// ==================== 类型定义 ====================

import type { DSLNode, DSLLayoutStyle } from '@fta/shared';

type LayoutStyle = DSLLayoutStyle;

// 带有绝对坐标的节点类型别名（内部使用）
// 这些属性现在已定义在 DSLBaseNode 中作为可选属性
// DSLNode 本身已包含这些可选属性，这里的类型别名仅用于语义明确
type NodeWithAbsolutePos = DSLNode;

interface CleanerConfig {
  // 节点过滤配置
  removeEmptyNodes: boolean; // 移除空节点
  removeLayoutHelpers: boolean; // 移除布局辅助容器
  removeMaskLayers: boolean; // 移除蒙版层
  removeOutOfBounds: boolean; // 移除超界节点
  removeInvisibleNodes: boolean; // 移除不可见节点

  // Icon 处理配置
  detectIcons: boolean; // 检测 Icon
  mergeIconLayers: boolean; // 合并 Icon 图层
  iconMaxSize: number; // Icon 最大尺寸阈值
  iconMinLayers: number; // Icon 最小图层数

  // 层级优化配置
  buildZIndex: boolean; // 计算 z-index
  checkOverlapping: boolean; // 检查遮挡关系
  removeCompletelyHidden: boolean; // 移除完全被遮挡的节点

  // 树结构优化配置
  flattenSingleChild: boolean; // 扁平化单子节点
  mergeSimilarNodes: boolean; // 合并相似节点
  optimizeDepth: boolean; // 优化树深度
  preserveSemantics: boolean; // 保留语义化结构

  // 调试配置
  verbose: boolean; // 详细日志
  dryRun: boolean; // 干运行模式（不实际修改）
}

interface CleanResult {
  nodes: DSLNode[];
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
  removeLayoutHelpers: false, // 禁用，使用 flattenSingleChild 代替
  removeMaskLayers: true,
  removeOutOfBounds: true,
  removeInvisibleNodes: true,

  detectIcons: true,
  mergeIconLayers: true,
  iconMaxSize: 100,
  iconMinLayers: 2,

  buildZIndex: true,
  checkOverlapping: true,
  removeCompletelyHidden: true,

  flattenSingleChild: true,
  mergeSimilarNodes: false, // 禁用，容易造成问题
  optimizeDepth: true,
  preserveSemantics: true,

  verbose: false,
  dryRun: false,
};

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
   * 主清洗入口
   * 支持多种输入格式：
   * - { nodes: DSLNode[] }
   * - { dsl: { nodes: DSLNode[] } }
   * - { dsl: { nodes: DSLNode[], styles: ... } }
   */
  public clean(dslData: { nodes: DSLNode[] } | { dsl: { nodes: DSLNode[]; styles?: any } }): CleanResult {
    this.startTime = Date.now();
    this.removed = [];
    this.icons = [];

    // 提取 nodes 数组，支持多种输入格式
    let nodes: DSLNode[];
    if ('dsl' in dslData && dslData.dsl) {
      nodes = dslData.dsl.nodes;
    } else if ('nodes' in dslData) {
      nodes = dslData.nodes;
    } else {
      throw new Error('Invalid DSL data format. Expected { nodes: ... } or { dsl: { nodes: ... } }');
    }

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
    // 阶段 2：Icon 检测与合并
    // =====================================================
    if (this.config.detectIcons) {
      filteredNodes = this.processIcons(filteredNodes);
      this.log('Icon 处理完成，检测到', this.icons.length, '个 Icons');
    }

    // =====================================================
    // 阶段 3：层级分析与优化（使用绝对坐标）
    // =====================================================
    if (this.config.buildZIndex) {
      filteredNodes = this.optimizeLayering(filteredNodes);
      this.log('层级优化完成');
    }

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

    return {
      nodes: this.config.dryRun ? nodes : finalNodes,
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
  private calculateAbsolutePositions(nodes: DSLNode[], parentAbsX: number, parentAbsY: number): NodeWithAbsolutePos[] {
    return nodes.map((node) => {
      const relX = node.layoutStyle?.relativeX || 0;
      const relY = node.layoutStyle?.relativeY || 0;
      const width = node.layoutStyle?.width || 0;
      const height = node.layoutStyle?.height || 0;

      const absX = parentAbsX + relX;
      const absY = parentAbsY + relY;

      const result: NodeWithAbsolutePos = {
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

  private filterNodes(nodes: NodeWithAbsolutePos[], parent?: NodeWithAbsolutePos): NodeWithAbsolutePos[] {
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
      .filter((node): node is NodeWithAbsolutePos => node !== null);
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
  private isOutOfBoundsAbsolute(node: NodeWithAbsolutePos, parent: NodeWithAbsolutePos): boolean {
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

  private processIcons(nodes: NodeWithAbsolutePos[]): NodeWithAbsolutePos[] {
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

  private detectIcon(node: NodeWithAbsolutePos): IconNode | null {
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

  private optimizeLayering(nodes: NodeWithAbsolutePos[]): NodeWithAbsolutePos[] {
    if (!this.config.checkOverlapping) {
      return nodes;
    }

    const withZIndex = nodes.map((node, index) => ({
      ...node,
      zIndex: index,
      isVisible: true,
    }));

    for (let i = withZIndex.length - 1; i >= 0; i--) {
      const current = withZIndex[i];

      if (!current.isVisible) continue;

      for (let j = i + 1; j < withZIndex.length; j++) {
        const upper = withZIndex[j];

        if (upper.isVisible && this.isCompletelyOverlappedAbsolute(current, upper)) {
          current.isVisible = false;
          if (this.config.removeCompletelyHidden) {
            this.markRemoved(current, 'completely hidden by upper layer', 'removeCompletelyHidden');
          }
          break;
        }
      }
    }

    return this.config.removeInvisibleNodes ? withZIndex.filter((n) => n.isVisible) : withZIndex;
  }

  /**
   * 使用绝对坐标判断下层节点是否被上层节点完全遮挡
   */
  private isCompletelyOverlappedAbsolute(lower: NodeWithAbsolutePos, upper: NodeWithAbsolutePos): boolean {
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

  // ==================== 阶段 4：树结构优化 ====================

  private optimizeTreeStructure(nodes: NodeWithAbsolutePos[]): NodeWithAbsolutePos[] {
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
  private flattenSingleChild(node: NodeWithAbsolutePos): NodeWithAbsolutePos {
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
  private recalculateRelativePositions(
    nodes: NodeWithAbsolutePos[],
    parentAbsX: number,
    parentAbsY: number
  ): DSLNode[] {
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
