### 一、 Styles 字典优化 (High Impact)

`styles` 字段占据了大量 tokens，且存在大量冗余。

#### 1\. Style ID 映射与短码化 (你的想法 1 的延伸)

目前的 Key 如 `paint_17:5555` 包含了设计工具的内部版本信息，对 LLM 生成代码无意义且太长。

- **策略**：建立映射表，将 Key 重命名为短 ID。
  - Paint -\> `p0`, `p1`, `p2`...
  - Font -\> `f0`, `f1`, `f2`...
  - Effect -\> `e0`, `e1`...
- **收益**：在 `nodes` 树中引用这些 ID 时，Token 数显著减少。

#### 2\. 值去重 (Value Deduplication) (你的想法 2 的延伸)

目前的 DSL 中，相同的颜色或图片 URL 可能因为设计工具中的不同引用而被定义为不同的 ID。

- **案例**：文件中 `paint_1:32268` 和 `paint_1:97957` 可能指向完全相同的 SVG/PNG URL。
- **策略**：计算 Style 值的 Hash。如果 Hash 相同，合并为一个 ID。所有引用该样式的 Node 指向同一个新 ID。
- **收益**：大幅减少 `styles` 字典的体积，特别是针对重复的 Icon 和图片。

#### 3\. Font 属性清洗 (你的想法 3 的延伸)

字体定义中包含大量 Web 开发中的“默认值”或“非必要值”。

- **剔除 `family`**: `"family": "PingFang SC"` 在中文移动端开发通常是全局默认字体，除非是特殊字体（如数字 DIN），否则可以直接剔除。
- **剔除 CSS 默认值**:
  - `"decoration": "none"`
  - `"case": "none"`
  - `"letterSpacing": "auto"`
  - `"style": "常规体"` (Regular 是 font-weight: 400 的默认值)
- **数据类型转换**:
  - `"lineHeight": "28"` (字符串) -\> `"lineHeight": 28` (数字)，减少引号 Token。

#### 4\. Paint/Effect 属性精简

- **颜色缩写**: 若颜色为 `#FFFFFF`，在 LLM 上下文中可能不需要缩写，但如果出现 `#AABBCC` 可考虑。重点是移除 `rgba(r,g,b, 1)` 中的 `1` (Alpha 通道满值)。
- **Token 字段处理**: `"token": "灰阶/全局背景 #F5F5F5"` 非常重要，**不要删除**。这是 LLM 生成语义化变量名（如 `const GrayBackground = ...`）的关键依据。

---

### 二、 Nodes 树结构优化 (Structural Optimization)

Nodes 树的深度和广度是 Token 消耗的大户。

#### 1\. Node 属性精简

- **ID 简化**: 同样将 `677:12796` 映射为短 ID（如 `n1`），或者如果父子关系通过 JSON 嵌套已经明确，且不需要跨节点引用（Ref），甚至可以**移除 Node ID**。
- **Layout 默认值**:
  - `"relativeX": 0`, `"relativeY": 0` -\> 移除。
  - `"rotation": 0` -\> 移除。
  - `"visible": true` -\> 移除。
  - `"opacity": 1` -\> 移除。

#### 2\. 文本节点优化

- `textMode`: `"auto-height"` 等属性如果能通过 CSS 默认行为推导，可移除。
- `text` 数组: 如果一段文字只有一个样式，不需要数组包裹，直接打平。

---

### 三、 数据格式 (Precision & Formatting)

#### 1\. 移除空值键

- `"children": []` -\> 直接移除该 Key。
- `"fill": []` (空数组) -\> 直接移除。

---
