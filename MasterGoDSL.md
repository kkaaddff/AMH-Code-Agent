# 会话导出：Design DSL 分析与归一化处理

## 1. 用户提问：JSON 数据分析与类型定义

**User:**

(上传了 `dsl.json` 文件，内容包含了样式表 `styles` 和节点树 `nodes`)

分析理解这个 json 描述的信息，这个 json 现在还原展示的有很大的问题，我会给你列举一下存在的情况：
1，兄弟节点间相互遮挡
2，子节点比父节点还大
等其他情况

我需要整理成满足一下类型定义：

```typescript
// DesignData 数据类型定义
export interface StyleValue {
  family?: string;
  size?: number;
  style?: string;
  decoration?: string;
  case?: string;
  lineHeight?: string;
  letterSpacing?: string;
}

export interface ImageValue {
  url: string;
  filters?: string;
}

export interface Style {
  value: string[] | StyleValue | ImageValue[];
  token?: string;
}

export interface PathItem {
  fill: string;
  data: string;
}

export interface LayoutStyle {
  width: number;
  height: number;
  relativeX: number;
  relativeY: number;
}

export interface BaseNode {
  type: string;
  id: string;
  name: string;
  layoutStyle: LayoutStyle;
}

export interface PathNode extends BaseNode {
  type: 'PATH';
  path: PathItem[];
}

export interface GroupNode extends BaseNode {
  type: 'GROUP';
  children: DesignNode[];
}

export interface FrameNode extends BaseNode {
  type: 'FRAME';
  children?: DesignNode[];
}

export type DesignNode = PathNode | GroupNode | FrameNode | LayerNode;

export interface DSLData {
  styles: Record<string, Style>;
  nodes: DesignNode[];
}

export interface DesignData {
  dsl: DSLData;
}

// 转换后的 LAYER 类型
export interface LayerStyle {
  value: ImageValue[];
  token: string;
}

export interface LayerNode extends BaseNode {
  type: 'LAYER';
  fill: string;
}
```

## 2. AI 回答：归一化策略与基础实现

这是一个非常经典且复杂的**"Design-to-Code"（设计稿转代码）工程化问题**。

直接回答你的核心问题：**强烈建议使用构建归一化函数（Algorithmic approach）来解决这个问题，而不是依赖 Prompt 让大模型直接处理整个 JSON 的修复。**

### 为什么不推荐纯 LLM（大模型）处理？

1.  **上下文窗口与计算成本**：真实的 DSL JSON 通常非常巨大（嵌套深、节点多）。将完整的坐标树扔给 LLM 会消耗大量 token，且容易超出窗口限制。
2.  **几何计算能力的弱点**：LLM 擅长语义理解，但对于复杂的递归几何计算（如：`子节点 A 的 x + width > 父节点 B 的 width，所以 B 需要变宽`）非常容易出错，且极其不稳定。
3.  **确定性与幂等性**：工程链路需要确定性。你希望每次输入的 JSON 都能得到相同的修复结果，而 LLM 的输出具有随机性。

### 推荐方案：基于规则的归一化函数 (Algorithmic Normalization)

你应该编写一个 **TypeScript 预处理管道 (Preprocessing Pipeline)**。只有在涉及"语义判断"（例如：这个 div 是不是一个 Card 组件？这堆乱七八糟的图层是不是一个 Navbar？）时，才引入 LLM。

针对你提出的两个核心问题（遮挡、溢出），以下是算法解决思路及代码实现：

#### 1. 解决子节点比父节点大的问题 (Overflow Correction)

**逻辑**：采用**自底向上（Bottom-up）**的递归遍历。先计算所有子节点的包围盒（Bounding Box），如果子节点的边界超出了父节点，强制撑大父节点的 `width/height`，或者重新计算父节点的 `width/height`。

#### 2. 解决兄弟节点遮挡问题 (Overlap & Z-index)

**逻辑**：

- **绝对定位模式**：在 DSL 中，通常数组后出现的元素 Z-index 更高。可以通过检测碰撞（Collision Detection），如果发现遮挡，根据业务逻辑决定是“保留遮挡”还是“转换为 Flex 流式布局推开”。
- **自动布局模式**：你的 JSON 中包含 `flexContainerInfo`，这意味着这些节点本不应该用绝对坐标渲染，而应该遵循 Flex 协议。归一化函数应该清洗掉冲突的 `relativeX/Y`，强制优先使用 Flex 规则。

### 代码实现：归一化转换器 (TypeScript)

这是一个满足你 Interface 定义的转换脚本框架。它包含了**类型清洗**和**几何修复**的核心逻辑。

```typescript
import type {
  DesignData,
  DSLData,
  DesignNode,
  Style,
  LayoutStyle,
  BaseNode,
  GroupNode,
  FrameNode,
  PathNode,
  LayerNode,
  StyleValue,
  ImageValue,
} from './your-types'; // 引入你的类型定义

// 假设 rawJson 是你上传的那个原始大 JSON 对象
type RawNode = any; // 这里简化原始类型，实际应为原始 DSL 的类型

/**
 * 核心归一化类
 */
class DSLNormalizer {
  private styles: Record<string, Style> = {};

  constructor(private rawDsl: any) {
    this.styles = rawDsl.dsl.styles || {};
  }

  public process(): DesignData {
    const rawNodes = this.rawDsl.dsl.nodes || [];

    // 1. 递归处理节点树
    const normalizedNodes = rawNodes.map((node) => this.normalizeNode(node));

    return {
      dsl: {
        styles: this.styles,
        nodes: normalizedNodes,
      },
    };
  }

  /**
   * 递归处理单个节点
   */
  private normalizeNode(rawNode: RawNode): DesignNode {
    // 1. 基础属性映射
    const base: BaseNode = {
      type: this.mapType(rawNode.type),
      id: rawNode.id,
      name: rawNode.name,
      layoutStyle: {
        width: rawNode.layoutStyle?.width || 0,
        height: rawNode.layoutStyle?.height || 0,
        relativeX: rawNode.layoutStyle?.relativeX || 0,
        relativeY: rawNode.layoutStyle?.relativeY || 0,
      },
    };

    // 2. 根据类型分别处理
    let node: DesignNode;

    // 处理子节点 (针对 GROUP, FRAME, 以及原始数据里的 INSTANCE 映射为 FRAME)
    const rawChildren = rawNode.children || [];
    let processedChildren: DesignNode[] = [];

    if (rawChildren.length > 0) {
      processedChildren = rawChildren.map((child: RawNode) => this.normalizeNode(child));

      // === 关键修复逻辑：解决子节点比父节点大 ===
      this.fixParentOverflow(base.layoutStyle, processedChildren);
    }

    switch (base.type) {
      case 'PATH':
        node = {
          ...base,
          type: 'PATH',
          path: rawNode.path || [], // 需确保符合 PathItem 接口
        } as PathNode;
        break;

      case 'LAYER': // 假设原始数据里的 RECTANGLE/VECTOR 等映射为 LAYER
      case 'RECTANGLE':
        node = {
          ...base,
          type: 'LAYER',
          fill: rawNode.fill || '', // 确保这里引用的 style id 存在于 styles 中
        } as LayerNode;
        break;

      case 'FRAME':
      case 'INSTANCE': // 将 INSTANCE 降级为 FRAME 处理
        node = {
          ...base,
          type: 'FRAME',
          children: processedChildren,
        } as FrameNode;
        break;

      case 'GROUP':
      default:
        node = {
          ...base,
          type: 'GROUP',
          children: processedChildren,
        } as GroupNode;
        break;
    }

    return node;
  }

  /**
   * 核心算法：修复父容器尺寸，使其包含所有子节点
   * 解决问题：子节点比父节点还大
   */
  private fixParentOverflow(parentLayout: LayoutStyle, children: DesignNode[]) {
    if (children.length === 0) return;

    let minX = 0;
    let minY = 0;
    let maxX = parentLayout.width; // 初始以父节点自身尺寸为界
    let maxY = parentLayout.height;

    children.forEach((child) => {
      const childX = child.layoutStyle.relativeX;
      const childY = child.layoutStyle.relativeY;
      const childR = childX + child.layoutStyle.width;
      const childB = childY + child.layoutStyle.height;

      // 1. 检测负坐标（子节点在父节点左上角外面）
      if (childX < minX) minX = childX;
      if (childY < minY) minY = childY;

      // 2. 检测溢出（子节点在父节点右下角外面）
      if (childR > maxX) maxX = childR;
      if (childB > maxY) maxY = childB;
    });

    // 如果发现溢出，修正父节点尺寸
    // 注意：如果 minX < 0，说明需要移动所有子节点，或者扩大父节点并改变父节点坐标（这里简化为撑大尺寸）
    const newWidth = maxX - minX;
    const newHeight = maxY - minY;

    if (newWidth > parentLayout.width || newHeight > parentLayout.height) {
      // 可以在这里打标，标记该节点被自动修正过
      parentLayout.width = Math.max(parentLayout.width, newWidth);
      parentLayout.height = Math.max(parentLayout.height, newHeight);
    }

    // 进阶：如果 minX < 0，你可能需要遍历 children 将它们的 relativeX 加上 offset，以保证相对坐标正确
  }

  /**
   * 类型映射辅助函数
   */
  private mapType(rawType: string): string {
    const typeMap: Record<string, string> = {
      INSTANCE: 'FRAME',
      RECTANGLE: 'LAYER',
      TEXT: 'LAYER', // 你的接口里没有 TEXT，暂时归为 LAYER 或需扩展接口
      // ... 其他映射
    };
    return typeMap[rawType] || rawType;
  }
}
```

### 针对“兄弟节点遮挡”的进一步处理建议

你的代码中，`nodes` 数组的顺序天然决定了层级（后面的覆盖前面的）。如果视觉上 A 挡住了 B，且这是**不合理**的，通常是因为转换过程丢失了 Auto Layout (Flex) 信息。

在你的 JSON 中，我看到了大量的 `flexContainerInfo` 字段。

**修复建议：**
在你的 `BaseNode` 或 `FrameNode` 接口中，**必须**保留 `flexContainerInfo`。
如果在渲染端（Frontend Renderer）使用了 `absolute position` (通过 `relativeX/Y`)，就会导致遮挡。
**正确的渲染逻辑应该是**：

1.  检查节点是否有 `flexContainerInfo`。
2.  如果有，**忽略**子节点的 `relativeX/Y`，直接使用 Flex 布局渲染（让浏览器或布局引擎自动处理不遮挡）。
3.  如果没有 Flex 信息，才使用 `relativeX/Y` 进行绝对定位。

---

## 3. 用户提问：进阶清洗与排序

**User:**

运行归一化脚本：使用上面的 TypeScript 逻辑清洗数据，确保 children 永远在 parent 的盒子内（通过撑大 Parent）
有没有可能针对 不合理或者没有实际意义的 组件进行删除，或者调整其顺序？

---

## 4. AI 回答：增强版 DSL 清洗脚本

是的，非常必要。在处理设计稿转代码（Design-to-Code）的 DSL 时，**"清洗"（Sanitization）**和**"优化"（Optimization）**是比单纯的类型转换更关键的步骤。

设计工具（如 Figma/MasterGo）生成的原始数据通常包含大量的“脏数据”：为了对齐而画的透明矩形、被删空了但还留着的空分组、层级混乱的图层等。

我为你设计了一套**增强版 TypeScript 归一化策略**，包含三个核心步骤：

1.  **垃圾回收 (Pruning)**：删除无意义的空节点、不可见节点、零尺寸节点。
2.  **层级重排 (Reordering)**：基于启发式算法（Heuristics），尝试修复“文字被背景遮挡”的问题。
3.  **容器修正 (Expansion)**：前文提到的，让父容器包住子元素。

### 增强版 DSL 清洗脚本

这个脚本可以直接加入到你的工程中。

```typescript
import type { DesignNode, BaseNode, LayoutStyle, FrameNode, GroupNode } from './your-types';

/**
 * 节点权重枚举：数字越大，Z轴层级应该越高（越靠前）
 * 用于解决遮挡问题
 */
enum NodeTypeWeight {
  BACKGROUND = 0, // 大面积色块
  IMAGE = 1, // 图片
  SHAPE = 2, // 装饰性图形
  FRAME = 3, // 容器
  GROUP = 4, // 组
  TEXT = 10, // 文字通常应该在最上层
  BUTTON = 11, // 交互组件最高
}

export class DSLCleaner {
  public clean(nodes: DesignNode[]): DesignNode[] {
    // 1. 过滤 & 递归处理 (自底向上)
    const validNodes = nodes.map((node) => this.processNode(node)).filter((node) => node !== null) as DesignNode[];

    // 2. 层级重排序 (解决兄弟遮挡)
    return this.reorderSiblings(validNodes);
  }

  private processNode(node: DesignNode): DesignNode | null {
    // === 规则 A: 删除不可见或无意义的节点 ===

    // 1. 检查可见性 (假设 DSL 有 opacity 或 visible 字段，这里模拟检查)
    // if (node.visible === false || node.opacity === 0) return null;

    // 2. 检查极小尺寸 (如果是线条 path 除外)
    const isLine = node.type === 'PATH' && (node.layoutStyle.width < 1 || node.layoutStyle.height < 1);
    if (!isLine && (node.layoutStyle.width <= 0 || node.layoutStyle.height <= 0)) {
      return null; // 剔除宽高为 0 的节点
    }

    // 3. 递归处理子节点
    if ('children' in node && node.children) {
      // 递归清洗子节点
      const cleanedChildren = this.clean(node.children);

      // === 规则 B: 移除空组/空容器 ===
      // 如果一个 GROUP/FRAME 里面没有子节点，且自身没有填充/描边（即它是透明的），则视为垃圾节点
      const hasVisuals = this.checkVisuals(node);
      if (cleanedChildren.length === 0 && !hasVisuals) {
        return null;
      }

      // === 规则 C: 扁平化冗余嵌套 (Flattening) ===
      // 例如: Group A -> [ Group B ] -> [ Content ]
      // 可以优化为: Group A -> [ Content ] (需视业务逻辑而定，这里暂只做基础清理)

      // === 规则 D: 容器修正 (撑大父容器) ===
      // 使用上一条回复中的逻辑，重新计算当前 node 的尺寸以包含 cleanedChildren
      const newLayout = this.fixParentOverflow(node.layoutStyle, cleanedChildren);
      node.layoutStyle = newLayout;

      (node as any).children = cleanedChildren;
    }

    return node;
  }

  /**
   * 规则 E: 智能重排兄弟节点 (Z-Index 修复)
   * 逻辑：如果两个节点发生碰撞(Overlap)，体积大的/背景色的应该在下面，文字/小图标应该在上面。
   */
  private reorderSiblings(nodes: DesignNode[]): DesignNode[] {
    if (nodes.length <= 1) return nodes;

    // 使用稳定排序
    return nodes.sort((a, b) => {
      // 1. 首先判断是否发生空间重叠
      if (!this.isOverlapping(a.layoutStyle, b.layoutStyle)) {
        return 0; // 不重叠则保持原样 (保持设计稿意图)
      }

      // 2. 如果重叠，比较权重
      const weightA = this.getNodeWeight(a);
      const weightB = this.getNodeWeight(b);

      if (weightA !== weightB) {
        return weightA - weightB; // 权重小的在左边(底层)，权重大的在右边(上层)
      }

      // 3. 如果权重相同，比较面积 (面积大的通常是背景，往下层放)
      const areaA = a.layoutStyle.width * a.layoutStyle.height;
      const areaB = b.layoutStyle.width * b.layoutStyle.height;

      // 只有当面积差异巨大(比如 > 2倍)时才调整，避免误伤相似大小的元素
      if (areaA > areaB * 2) return -1; // A 大，A 放到底层
      if (areaB > areaA * 2) return 1; // B 大，B 放到底层

      return 0;
    });
  }

  // --- 辅助函数 ---

  // 判断该节点是否有视觉表现 (填充、描边、图片等)
  private checkVisuals(node: DesignNode): boolean {
    if (node.type === 'LAYER' || node.type === 'PATH' || node.type === 'TEXT') return true;
    // 检查 Frame 是否有背景色
    if ((node as any).fill && (node as any).fill.length > 0) return true;
    return false;
  }

  // 获取节点类型权重
  private getNodeWeight(node: DesignNode): number {
    // 简单映射，实际可以根据你的 DSL 字段做更细致判断
    if (node.type === 'TEXT') return NodeTypeWeight.TEXT;
    if (node.type === 'LAYER') return NodeTypeWeight.SHAPE; // 需结合 fill 判断是否为 Image
    if (node.type === 'FRAME') return NodeTypeWeight.FRAME;
    return NodeTypeWeight.BACKGROUND;
  }

  // 简单的矩形碰撞检测
  private isOverlapping(a: LayoutStyle, b: LayoutStyle): boolean {
    return !(
      a.relativeX + a.width <= b.relativeX ||
      b.relativeX + b.width <= a.relativeX ||
      a.relativeY + a.height <= b.relativeY ||
      b.relativeY + b.height <= a.relativeY
    );
  }

  // 修复溢出逻辑 (复用之前的思路)
  private fixParentOverflow(parentLayout: LayoutStyle, children: DesignNode[]): LayoutStyle {
    let maxX = parentLayout.width;
    let maxY = parentLayout.height;

    // 如果是 Flex 布局，通常不需要撑大，或者需要根据 Flex 流计算，这里假设是绝对定位修正
    children.forEach((child) => {
      const right = child.layoutStyle.relativeX + child.layoutStyle.width;
      const bottom = child.layoutStyle.relativeY + child.layoutStyle.height;
      if (right > maxX) maxX = right;
      if (bottom > maxY) maxY = bottom;
    });

    return { ...parentLayout, width: maxX, height: maxY };
  }
}
```

### 策略说明：怎么删？怎么排？

#### 1. 关于“删除无意义组件” (Pruning)

我在代码中实现了 `processNode` 方法，它定义了什么是“垃圾”：

- **幽灵节点**：宽高为 0 的节点（除非它是线条 Path）。
- **空壳容器**：`Group` 或 `Frame`，如果它既没有子节点，自己又没有背景色/描边，那它就是多余的嵌套，直接删除。这能极大减少生成的 HTML DOM 深度。

#### 2. 关于“调整顺序” (Reordering)

这是最难也是最有价值的部分。Figma 等工具中，图层顺序是随意的，或者设计师仅仅为了方便选中而调整了顺序，但在 Web 中，DOM 顺序决定了遮挡关系。

我在 `reorderSiblings` 中引入了**“权重碰撞算法”**：

1.  **只处理重叠**：如果两个元素在空间上完全没交集，不要动它们的顺序（保持设计原意）。
2.  **类型权重**：
    - `TEXT` (文字) 权重最高 -> 永远浮在上面。
    - `SHAPE/LAYER` (图形) 权重居中。
    - `FRAME/GROUP` (容器) 权重较低。
3.  **面积启发**：如果类型相同（比如都是 Frame），判断面积。**面积大的更有可能是背景容器**，应该沉底；面积小的是内容，应该浮起。

### 风险提示与兜底

虽然算法可以解决 90% 的问题，但仍有 10% 的“设计意图”可能会被误伤：

- **误伤示例**：设计师故意放了一个透明的 Frame 在最上层作为“点击热区”（Hotspot）。
- **解决方案**：
  1.  在清理逻辑中，检查节点名称。如果 `node.name` 包含 "hotspot" 或 "click" 字样，即使它是透明空节点也不删除，且强制 Z-index 最高。
  2.  保留 `flexContainerInfo`。如果节点处于 Flex 布局模式下，**不要**执行重排逻辑，因为 Flex 的顺序决定了位置，而不是层级。

```

```
