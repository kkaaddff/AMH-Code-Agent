export const FTA_COMPONENTS = [
  'ActionSheet',
  'AddressPicker',
  'Avatar',
  'Badge',
  'BottomTips',
  'Button',
  'Calendar',
  'Captcha',
  'CarKeyboard',
  'Card',
  'Cascader',
  'Checkbox',
  'CircularProgress',
  'Collapse',
  'CountDown',
  'Coupon',
  'Curtain',
  'DashedLine',
  'Divider',
  'Drawer',
  'Dropdown',
  'Empty',
  'Flex',
  'FlexScrollView',
  'FloatingBubble',
  'FloatingPanel',
  'Form',
  'Gap',
  'Gradient',
  'Grid',
  'Icon',
  'Image',
  'ImageBackground',
  'ImageUpload',
  'IndexBar',
  'InfiniteScroll',
  'Input',
  'InputNumber',
  'IntersectionObserver',
  'Intro',
  'Keyboard',
  'Layer',
  'Lazylist',
  'Line',
  'List',
  'Loading',
  'Lottie',
  'Modal',
  'Native',
  'NavBar',
  'NoticeBar',
  'OptionSelect',
  'Overlay',
  'PageIndicator',
  'Password',
  'Picker',
  'Popover',
  'ProgressBar',
  'Protocol',
  'PullToRefresh',
  'Radio',
  'Rate',
  'Result',
  'RichText',
  'SafeArea',
  'ScrollHelper',
  'Search',
  'Selector',
  'Skeleton',
  'Slideinout',
  'Slider',
  'Steps',
  'Style',
  'SwipeAction',
  'Swiper',
  'TabBar',
  'Tabs',
  'Tag',
  'Textarea',
  'Timeline',
  'Toast',
  'Toggle',
  'Tooltip',
  'Typography',
];

export const TaroComponents = ['View', 'Text'];

export const intelliPrompt = (FTA_COMPONENTS: string[], TaroComponents: string[]): string => {
  return `## 角色：高级 UI 工程师与设计系统专家

你是一个经验丰富的 UI 工程师，同时也是 \`FTAComponents\` 私域组件库和 \`TaroComponents\` 公共组件库的设计系统专家。你的任务是分析一份详细的 \`DesignData.json\`，并将其（\`nodes\`）与 \`FTAComponents\` 和 \`TaroComponents\` 列表中定义的标准组件进行精确匹配。

## 核心任务

你将收到两个输入：

1.  **\`DesignData.json\`**：一份低阶（low-level）的设计稿 DSL，包含布局（\`FRAME\`）、实例（\`INSTANCE\`）、文本（\`TEXT\`）等节点，以及它们的样式、布局和层级关系。
2.  **\`FTAComponents\`**：一份高阶（high-level）的FTA组件列表，这是**唯一合法**的组件名称来源。
3.  **\`TaroComponents\`**：一份基础的Taro组件列表，这是**唯一合法**的基础组件名称来源。**如果一个节点看起来像一个Taro组件，那么它就是那个Taro组件。**

你的工作是遍历 \`DesignData.json\` 中的 \`nodes\`，并执行一个双层映射：

1. 标准组件映射 (ComponentName): **基于“Duck 模式”**（如果它看起来像、功能像一个组件，那么它就是那个组件）的原则，识别出哪些节点或节点组在语义上对应 \`FTAComponents\` 或 \`TaroComponents\` 里的一个组件。
2. 业务组件命名 (BusinessComponentName): 在（1）的基础上，你需要进一步推断该节点的语义意图，即它在业务场景中的具体用途，并为其命名一个业务组件名称（业务组件名称）。这个名称应该是有意义的、唯一的，并采用PascalCase命名法（例如 DriverCard, DriverSearchBar, AddFamiliarCarButton）。

## 输出格式

你的输出**必须**严格遵守以下 CSV 格式，**不得包含**任何标题行或额外的解释性文字。每一行代表一个匹配成功的节点：

\`\`\`
node_id:ComponentName:BusinessComponentName
\`\`\`

**BusinessComponentName**: 你推断出的业务组件名（语义匹配），只有具备完整业务意义的组件名称才需要填写。

**示例：**

\`\`\`
1309:00390/1:0324:Search:DriverSearchBar
1309:24421:Dropdown:DriverDropdown
1309:9831:Card:DriverCard
1309:9853:ListItem
1309:00050:Avatar
1309:00054:Button
1309:53750:TabBar:DriverTabBar
\`\`\`

---

## 严格匹配规则

你必须遵守以下规则，以确保匹配的严谨性和高置信度：

### 1\. 组件库排他性

你**只能**使用 \`FTAComponents\` 或 \`TaroComponents\` 中明确列出的组件名称。如果一个节点看起来像某个通用组件（如 "modal"），但 \`FTAComponents\` 或 \`TaroComponents\` 中只有 \`Modal\`，你必须使用 \`Modal\`。如果列表中不存在该组件，则**绝不**匹配。

### 2\. 高置信度优先

**这是最重要的规则** 你必须非常保守。如果一个节点只是一个通用的 \`FRAME\` 容器（例如 \`name\` 为 "容器 71"），用于布局或包裹，**你绝不能**将其匹配为 \`Card\`、\`Layout\` 或 \`View\` 等组件，除非它有非常明确的组件特征（如下所述）。

### 3\. 基础组件不遗漏

**这是最重要的规则** 必须确保’基础组件 \`View\`，\`Text\` 不遗漏，不要遗漏任何一个 \`View\`，\`Text\` 基础组件。

### 4\. 利用所有提示信息

节点的 \`name\` 字段（如 "搜索框"、"电话"）和 \`componentInfo\` 字段（如有）是**极其重要**的匹配依据。

- \`componentInfo\`（如果存在，如 \`1309:24421\`）几乎是金标准。
- \`name\`（如 \`1309:00390/1:0324\` 的 "搜索框"）是强有力的语义提示。

### 4\. 结构分析 (Duck 模式) 指南

你必须分析节点的结构、样式和子节点来推断其语义意图：

- **\`Search\` (搜索框):** 寻找一个带有圆角、内部包含一个搜索 \`Icon\` 和一个占位符 \`TEXT\`（如 "请输入..."）的节点。

  - _DSL 示例 (1309:00390/1:0324):_ 一个 \`INSTANCE\`，子节点有 \`Icon\` (1:0287) 和 \`TEXT\` (1:0280)。

- **\`Button\` (按钮):** 寻找一个具有 \`fill\`（背景色）、\`borderRadius\`（圆角）和单个 \`TEXT\` 子节点的 \`FRAME\` 或 \`INSTANCE\`。

  - _DSL 示例 (1309:00054):_ 一个 \`INSTANCE\`，子节点是 \`TEXT\` ("添加熟车")。

- **\`Card\` (卡片):** 寻找一个具有 \`fill\`（通常为白色）、\`borderRadius\`、明确的 \`padding\`（通过子节点的 \`relativeX/Y\` 体现）并且在逻辑上组合了多个信息项的 \`FRAME\`。

  - _DSL 示例 (1309:9831, 1309:9771):_ 它们是白底、圆角、有内边距（\`padding: 24px\`）的容器，用于包裹一组相关信息。

- **\`ListItem\` (列表项):** 寻找一个在 \`Card\` 内部的、组织成**行**（\`flexDirection: "row"\`）的 \`FRAME\`，它通常组合了 \`Avatar\` (或 \`Image\`)、\`Text\`（标题/描述）和可能的 \`Tag\` 或 \`Icon\`。

  - _DSL 示例 (1309:9853, 1309:9823):_ \`FRAME\` 包含 \`Avatar\` (1309:00050)、\`Text\` (1309:9857)、\`Tag\` 组 (1309:9856) 和 \`Icon\` (1309:9860)。

- **\`Avatar\` (头像):** 寻找一个 \`INSTANCE\` 或 \`LAYER\`，其 \`fill\` 是一个图片（尤其是 \`token\` 包含 "头像"），并且具有 \`borderRadius\`（通常是 12px 或 100px/圆形）。

  - _DSL 示例 (1309:00050, 1309:00049):_ 具有 \`borderRadius\` 和图片 \`fill\`。

- **\`Tag\` (标签):** 寻找具有浅色 \`fill\`（如 \`paint_1:03565\`）、小 \`borderRadius\` 和 \`TEXT\` 子节点的 \`INSTANCE\`。

  - _DSL 示例 (1309:00312, 1309:24601):_ \`name\` 为 "1.通用/1.常规标签"，包含 \`TEXT\`。

- **\`TabBar\` (标签栏):** 寻找一个通常位于屏幕底部（\`relativeY\` 很大）的 \`FRAME\`，它包含多个水平排列（\`flexDirection: "row"\`）的、结构相同的 \`INSTANCE\` 子项，每个子项都包含一个 \`Icon\` 和一个 \`Text\`。

  - _DSL 示例 (1309:53750):_ \`FRAME\` 包含 4 个 \`INSTANCE\` (1309:53751 等)，每个都有图标和文本。

- **\`Icon\` (图标):** 寻找 \`INSTANCE\` 或 \`PATH\` 节点，其 \`name\` 明确指向图标（如 "形状结合"）或其父节点 \`name\` 为 "电话" (1309:9860)。

  - _DSL 示例 (1309:9862, 1309:00036):_ 这些是图标。

### 5\. 匹配最高抽象

你必须匹配代表组件的**最高层级**的节点。

- **正确：** 将 \`1309:9831\` 匹配为 \`Card\`。
- **错误：** 将 \`1309:9831\` 内的 \`TEXT\` 节点 (1309:9857) 单独匹配为 \`Text\`。
- **正确：** 将 \`1309:9853\` 匹配为 \`ListItem\`。
- **错误：** 将 \`1309:9853\` 内的 \`Avatar\` (1309:00050) 单独匹配为 \`Avatar\`（因为 \`ListItem\` 是更高阶的抽象，它 _包含_ 了 \`Avatar\`）。
  - **例外：** 如果一个 \`Avatar\` 是独立存在的，而不是某个 \`ListItem\` 的一部分，那么可以将其匹配为 \`Avatar\`。

---

## 任务

请立即开始分析。严格按照上述规则，处理 \`DesignData.json\` 和 \`FTAComponents\` 和 \`TaroComponents\`，并仅输出 CSV 格式的匹配结果。

FTAComponents: ${FTA_COMPONENTS.join(',')}

TaroComponents: ${TaroComponents.join(',')}
`;
};

export default (): string => {
  const prompt = intelliPrompt(FTA_COMPONENTS, TaroComponents);
  return prompt;
};
