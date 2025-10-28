# 组件识别编辑器 - 图层树拖拽功能需求规格文档

## 1. 功能概述

为 `EditorPageComponentDetectV2` 的图层树面板（`LayerTreePanel`）添加节点拖拽功能，允许用户通过拖拽操作调整组件的层级结构和父子关系，实现组件树的可视化重组。

## 2. 目标用户场景

### 场景 1：将外部节点拖入容器

- 用户将 Search 组件拖入 Flex 容器
- 系统自动将 Search 添加为 Flex 的子节点
- Flex 容器自动调整边界以包含新加入的子节点

### 场景 2：将子节点拖出容器

- 用户将 Flex 内的子组件（如内部的 Flex 或 Text）拖出父容器
- 子节点脱离原父容器，提升为父容器的同级节点
- 原父容器边界相应调整

### 场景 3：防止破坏性拖拽

- 不允许跨越兄弟节点的拖拽（例如：不能直接将深层嵌套的节点跨过其他节点拖出）
- 确保树结构的一致性和完整性

## 3. 核心拖拽规则（通用规则）

### 3.1 拖入容器规则（场景 1）

**前置条件：**

- 源节点 S 和目标容器节点 T 满足以下条件：
  - T 必须是容器类型组件（`isContainer === true`）
  - S 不是 T 的祖先节点（防止循环引用）
  - S 不是页面根节点（`isRoot === false`）

**执行逻辑：**

1. **位置确定**：

   - 根据拖拽位置（dropPosition）确定插入顺序
   - 如果拖到容器节点上方/内部，插入为第一个子节点
   - 如果拖到容器节点下方，根据容器是否展开决定：
     - 容器已展开：插入为最后一个子节点
     - 容器未展开：插入为容器的下一个兄弟节点

2. **从原父节点移除 S**：
   ```typescript
   // 伪代码
   removeFromParent(S)
   ```

3. **添加到目标容器 T**：
   ```typescript
   T.children.insert(S, position)
   ```

4. **边界调整**：

   - 重新计算 T 的边界：
     ```typescript
     const bounds = calculateContainerBounds(T.children)
     T.absoluteX = Math.min(T.absoluteX, bounds.minX)
     T.absoluteY = Math.min(T.absoluteY, bounds.minY)
     T.width = Math.max(T.width, bounds.maxX - T.absoluteX)
     T.height = Math.max(T.height, bounds.maxY - T.absoluteY)
     ```

   - 如果 T 是虚拟容器（`id.startsWith('virtual-annotation-')`），完全重新计算边界

5. **DSL 节点处理**：

   - 如果 S 和 T 都关联真实 DSL 节点，检查空间关系一致性
   - 如果 T 是虚拟容器，允许任意空间关系的节点加入

### 3.2 拖出容器规则（场景 2）

**前置条件：**

- 源节点 S 的父节点 P 是容器节点
- S 不是页面根节点
- 目标位置是 P 的父节点（记为 G）或 P 的兄弟位置

**拖出条件（必须满足其一）：**

1. S 是 P 的第一个子节点，且拖拽方向向上
2. S 是 P 的最后一个子节点，且拖拽方向向下

**执行逻辑：**

1. **从 P 移除 S**：
   ```typescript
   P.children.remove(S)
   ```

2. **插入到祖父节点 G**：
   ```typescript
   const targetIndex = G.children.indexOf(P) + offset
   G.children.insert(S, targetIndex)
   ```


   - 向上拖出：offset = 0（插入到 P 之前）
   - 向下拖出：offset = 1（插入到 P 之后）

3. **边界调整**：

   - 重新计算 P 的边界（可能缩小）：
     ```typescript
     if (P.children.length > 0) {
       const bounds = calculateContainerBounds(P.children)
       P.absoluteX = bounds.minX
       P.absoluteY = bounds.minY
       P.width = bounds.maxX - bounds.minX
       P.height = bounds.maxY - bounds.minY
     }
     ```

   - 如果 P 是虚拟容器且子节点为空，自动删除 P

4. **祖父容器边界调整**（如果 G 也是容器）：

   - 根据新加入的 S 调整 G 的边界

### 3.3 禁止拖拽规则（场景 3）

**以下情况禁止拖拽：**

1. **跨越兄弟节点拖出**：

   - 如果 S 不是 P 的第一个或最后一个子节点
   - 不允许直接拖出到 P 的父级

示例：

   ```
   Flex P
     ├─ Flex S1 (第一个)
     ├─ Flex S2 (中间) ❌ 不能直接拖出
     └─ Text S3 (最后一个)
   ```

2. **页面根节点**：

   - 根节点（`isRoot === true`）不允许被拖拽

3. **拖入非容器节点**：

   - 目标节点的 `isContainer === false`
   - 提示用户："该组件不支持子节点"

4. **循环引用**：

   - 不允许将祖先节点拖入后代节点
   - 检查逻辑：
     ```typescript
     function isAncestor(ancestor: AnnotationNode, descendant: AnnotationNode): boolean {
       let current = descendant.parent
       while (current) {
         if (current.id === ancestor.id) return true
         current = current.parent
       }
       return false
     }
     ```


5. **同位置拖拽**：

   - 源节点和目标位置相同，不执行任何操作

## 4. 拖拽交互设计

### 4.1 视觉反馈

**拖拽中状态：**

- 被拖拽节点显示半透明（opacity: 0.6）
- 鼠标光标改变为 `move` 或 `grabbing`

**可放置区域指示：**

- 有效放置位置显示蓝色插入线（2px高度）或高亮容器边框
- 无效放置位置显示红色禁止图标，鼠标光标改变为 `not-allowed`

**容器展开提示：**

- 拖拽到折叠的容器节点上停留 800ms，自动展开该容器
- 展开后显示内部插入位置

### 4.2 错误提示

**操作被阻止时，显示 Ant Design Message 提示：**

| 场景 | 提示文案 |

|------|---------|

| 拖入非容器 | "该组件不支持子节点，无法拖入" |

| 跨越兄弟节点 | "该节点位于中间位置，请先调整为第一个或最后一个子节点" |

| 循环引用 | "不能将父节点拖入子节点" |

| 拖拽根节点 | "页面根节点不允许拖拽" |

| DSL 空间冲突 | "该操作会导致组件空间关系冲突" |

## 5. 技术实现要点

### 5.1 涉及文件

**核心文件：**

- `src/pages/EditorPage/components/LayerTreePanel.tsx` - 添加拖拽事件处理
- `src/pages/EditorPage/contexts/ComponentDetectionContextV2.tsx` - 添加拖拽操作 API

**新增 API（ComponentDetectionContextV2）：**

```typescript
interface ComponentDetectionContextValue {
  // 现有 API...
  
  // 新增拖拽相关 API
  moveAnnotation: (
    sourceId: string,
    targetId: string,
    dropPosition: 'before' | 'inside' | 'after'
  ) => Promise<{
    success: boolean;
    error?: string;
  }>;
  
  validateMove: (
    sourceId: string,
    targetId: string,
    dropPosition: 'before' | 'inside' | 'after'
  ) => {
    valid: boolean;
    reason?: string;
  };
}
```

### 5.2 实现步骤

**步骤 1：启用 Ant Design Tree 拖拽**

```typescript
// LayerTreePanel.tsx
<Tree
  draggable={{
    icon: false,
    nodeDraggable: (node) => node.key !== 'root'
  }}
  onDrop={handleDrop}
  allowDrop={handleAllowDrop}
  // ... 其他 props
/>
```

**步骤 2：实现 validateMove 验证逻辑**

- 检查循环引用
- 检查容器类型
- 检查跨越兄弟节点
- 检查 DSL 空间关系

**步骤 3：实现 moveAnnotation 核心逻辑**

- 从源父节点移除
- 插入到目标位置
- 重新计算容器边界
- 更新 DSL 节点引用（如果需要）
- 更新扁平化列表（annotations）
- 重新排序子节点

**步骤 4：同步画布更新**

- 拖拽完成后，触发 `DetectionCanvasV2` 重新渲染
- 边界框实时更新
- 选中状态保持在拖拽后的节点

### 5.3 边界计算辅助函数

```typescript
function calculateContainerBounds(children: AnnotationNode[]): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  if (children.length === 0) {
    return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  }
  
  const bounds = children.map(child => ({
    x1: child.absoluteX,
    y1: child.absoluteY,
    x2: child.absoluteX + child.width,
    y2: child.absoluteY + child.height,
  }));
  
  return {
    minX: Math.min(...bounds.map(b => b.x1)),
    minY: Math.min(...bounds.map(b => b.y1)),
    maxX: Math.max(...bounds.map(b => b.x2)),
    maxY: Math.max(...bounds.map(b => b.y2)),
  };
}
```

## 6. 测试用例

### 6.1 功能测试

| 用例 ID | 描述 | 前置条件 | 操作步骤 | 预期结果 |

|---------|------|----------|----------|----------|

| TC-01 | 拖入容器 | 存在 Search 和 Flex 节点，Search 在 Flex 外 | 拖拽 Search 到 Flex 上 | Search 成为 Flex 子节点，Flex 边界扩大 |

| TC-02 | 第一个子节点拖出 | Flex 内有多个子节点 | 拖拽第一个子节点向上 | 子节点脱离 Flex，成为 Flex 的前一个兄弟节点 |

| TC-03 | 最后一个子节点拖出 | Flex 内有多个子节点 | 拖拽最后一个子节点向下 | 子节点脱离 Flex，成为 Flex 的后一个兄弟节点 |

| TC-04 | 中间节点禁止拖出 | Flex 内有 3 个子节点 | 拖拽中间节点向上/下 | 操作被阻止，显示提示信息 |

| TC-05 | 拖入非容器节点 | 存在 Text 节点 | 拖拽任意节点到 Text 上 | 操作被阻止，显示提示信息 |

| TC-06 | 根节点拖拽 | 存在页面根节点 | 拖拽根节点 | 操作被阻止，显示提示信息 |

| TC-07 | 循环引用阻止 | 存在父子关系的节点 | 拖拽父节点到子节点内 | 操作被阻止，显示提示信息 |

| TC-08 | 虚拟容器清理 | 虚拟容器内只有 1 个子节点 | 拖出最后一个子节点 | 虚拟容器自动删除 |

### 6.2 边界情况测试

- 拖拽到折叠节点上（应自动展开）
- 拖拽大容器到小容器内（边界调整）
- 连续快速拖拽（防抖处理）
- 拖拽过程中取消（ESC 键）

## 7. 性能优化

- 使用 React.memo 优化树节点渲染
- 拖拽过程中节流边界计算（throttle 50ms）
- 大型树（>100 节点）启用虚拟滚动
- 延迟重新计算扁平化列表，直到拖拽结束

## 8. 后续扩展

- 支持多选拖拽（批量移动节点）
- 撤销/重做功能集成
- 拖拽时显示目标容器预览效果
- 支持键盘快捷键（Shift/Ctrl）调整拖拽行为

## 9. 验收标准

1. ✅ 所有 8 个功能测试用例通过
2. ✅ 拖拽操作流畅，无明显卡顿（<100ms 响应）
3. ✅ 错误提示清晰，用户友好
4. ✅ 拖拽后画布实时同步更新
5. ✅ 拖拽操作可记录到操作历史（为撤销功能做准备）
6. ✅ 代码通过 TypeScript 类型检查
7. ✅ 代码符合项目 ESLint 规范
