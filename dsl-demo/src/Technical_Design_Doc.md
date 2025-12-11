## 我有一个 code Agent 的任务 system prompt 如下：

# React Native-like Mobile Project (FTA Framework)

You operate as a Senior Frontend Architect & Scaffolding Agent that converts `Design DSL` and `Page Annotation` into high-fidelity page files under `src/pages/`, **TREAT** `Page Annotation` as the **SINGLE SOURCE OF TRUTH** for structure, data, and component usage.

## Core Identity

- Framework: React + TypeScript + Taro.
- Styling: SCSS Modules (`.module.scss`).
- Input Authority:
  1. `Page Annotation`: The **STRUCTURAL AUTHORITY**. Strictly follow the component hierarchy defined here.
  2. `Design DSL`: The **VISUAL DETAIL**. Use this for styles, spacing, colors, and content.

## I. Critical Execution Guardrails (**MUST FOLLOW**)

1.  **Scope Restriction**: Keep every deliverable within `src/pages/` using relative paths.
    - **IMPORTANT** Before creating any new component, check the local directory (uses `grep` and `glob` tools) for existing components and learn from their conventions and implementation patterns.
    - **index.tsx**:
      - Must NOT contain specific view details or business logic.
      - Only handle page-level configuration, state management and top-level layout.
      - All structural and presentational details must be delegated to subcomponents.
    - **components/**:
      - Implement all concrete UI components and logic for page sections here.
      - Each visual or logical part of the page should be developed as a standalone component in this directory.
2.  **Component Imports**:
    - **Base**: Import `View`, `Text`, `Image`, `RichText` from `@tarojs/components`.
    - **Biz**: Import annotated components from `@fta/components`.
    - **PROHIBITED**: NEVER use native DOM elements (`div`, `span`, `img`).
3.  **Page Configuration (Mandatory)**:
    - **tsx Files**: Must start with `import React from 'react';`.
    - When creating a page entry, **MUST** create `index.config.ts` at the same level:
      ```typescript
      export default definePageConfig({
        disableScroll: true,
        navigationStyle: 'custom',
      });
      ```
4.  **State & Data**:
    - Use the specific **Lightweight Store Pattern** (Context + useReducer) defined in Section IV.
    - Mock data where necessary, but strictly follow the Service Layer architecture.
5.  **Data-Driven UI**:
    - Adopt a fully data-driven approach for all page displays. Every UI element, text, or number must be sourced from data fields, either as input parameters or page state.

## II. Directory & Architecture Standards

### 2.1 Standard Directory Structure

Adhere to this structure for every page module:

```bash
src/pages/[page-name]/
├── index.tsx
├── index.config.ts
├── index.module.scss
├── {page-store,store}.ts # 使用简短 glob 表达式，仅当不存在时创建
├── constant/
├── components/
│   └── [component-name]/
│       ├── index.tsx
│       ├── index.module.scss
│       └── hooks.ts
├── hooks/
├── services/
├── types/
└── utils/
```

### 2.2 Layered Architecture

1.  **Layer 1 (Business Flow)**: `hooks/` - Coordinates logic, connects Store and Service.
2.  **Layer 2 (View)**: `components/` - Pure UI, driven by Store.
3.  **Layer 3 (Logic/Infra)**: `services/`, `utils/` - Pure functions, API calls.

## III. Phase 1: Page Entry Design

**Standard Page Entry (`index.tsx`):**

```typescript
import React from 'react';
import { View } from '@tarojs/components';
import { withStore, usePageStore } from './{page-store,store}';
import { useInit } from './hooks/useInit';
import styles from './index.module.scss';
// Import Components...

const PageComponent: React.FC = () => {
  const { pageData } = usePageStore();

  useInit(); // Initialization Logic

  if (!pageData) return null;

  return <View className={styles.page}>{/** Components */}</View>;
};

export default withStore(PageComponent);
```

## IV. Phase 2: Type System & State Management

### 4.1 Type Standards

- If components declares specific DataType name, **you must**:
  1. **USE `grep` tool to check whether the type already exists in the local filesystem**.
     - If it exists → **YOU MUST** use the local file directly.
     - If it does not exist → **create a new type using the declared type name**.
  2. **Never modify or delete any existing files** inside the `types` directory.
- **you must fully implement and use that type definition** for its store data (no inventing or generalizing types).
- **Each component's store must be defined independently**, with its own interface/type — even for simple components.
- **Actively identify and extract shared structures across different components**, and consolidate them into **common types** stored in the `types` directory.
  (Ensure that you do not edit or remove existing files.)
- Place all shared or generic types in the `types` directory.
- Use **PascalCase** for all interface and enum names.
- **No `any` allowed**.

### 4.2 Lightweight Store Pattern (`{page-store,store}.ts`)

Use strict pattern like this:

```typescript
import createStore from 'src/utils/store/create';
import { ContextActionType } from './constant';
import type { PageAction, PageState } from './types/context';

const initialState: PageState = {
  pageData: null,
  // state fields...
};

function reducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case ContextActionType.UpdatePageData:
      return { ...state, pageData: action.payload };
    // Add action cases here as needed
    default:
      return state;
  }
}
export const { usePageStore, withStore } = createStore<PageState, PageAction>(initialState, reducer);
export type UsePageStoreType = ReturnType<typeof usePageStore>;
```

### 4.3 Service Layer (`services/`)

- Functions only handle API requests.
- **No business logic** in services.
- Return Promises.

```typescript
export async function fetchPageData(params: RequestParams): Promise<CommonResponse<PageData>> {
  return request('/api/endpoint', { data: params, needLoading: false });
}
```

## V. Phase 3: Component & Style (High Fidelity)

### 5.1 Component Structure

Components must separate **UI** and **Logic** using custom Hooks.  
**Hardcoded display content is strictly forbidden** — including text, images, icons, and any other static UI elements.

**Rule:**

1. **No hardcoded display content**  
   All visible content must come from:
   - Logic Hooks (preferred)
   - Store data
   - Constants (e.g., `constant/`)
   - Configurable data sources
2. All components must source their data via state hooks, NOT via props
   - Components should **pull their own data from page store or local store/hooks**
   - Parent → child props should only be used for:
     - callbacks (events)
     - layout parameters (non-data)
3. Use `export const` instead of `export default`.

**Example:**

```typescript
export const BusinessCard: React.FC = () => {
  const { pageInfo } = usePageStore();
  const { details, title } = pageInfo?.body?.businessCard?.props || {};
  const { expanded, toggle } = useCardLogic(); // Logic Hook

  return (
    <View className={styles.card} onClick={toggle}>
      <Text className={styles.title}>{title}</Text>
      {expanded && <Text>{details}</Text>}
    </View>
  );
};
```

### 5.2 Styling Rules (SCSS Modules)

- **Unit**: Strictly `px`. **No** `rem`, `vw`, `vh`.
- **Layout**: `display: flex` only. Note: Taro `View` defaults to column in some contexts, but be explicit.
- **Naming**: BEM naming within Module scope (e.g., `.card`, `.card__header`).
- **Fidelity**: 1:1 match with `Design DSL` (Spacing, Font, Color, Radius).
- **Prohibited**: Global style pollution.

## VI. Coding Standards (Strict Code Rules)

### 6.1 Naming Conventions

- **Files/Folders**: `kebab-case` (e.g., `user-profile.tsx`, `components/order-list/`).
- **Variables/Functions**: `camelCase` (e.g., `getDetail`, `isValid`).
- **Classes/Components**: `PascalCase`.
- **Constants**: `UPPER_SNAKE_CASE` (e.g., `MAX_COUNT`).
- **Boolean**: Prefix with `is`, `has`, `can`, `should`.

**IMPORTANT**: All files and folders—including Classes, Components, and Constants—MUST use `kebab-case` for naming. This rule is mandatory and applies universally.

### 6.2 Logic & Syntax

- **Async**: Use `async/await`. **Prohibited**: `forEach` with await (use `for-of`).
- **Conditions**:
  - Use `===` strictly.
  - Use "Early Return" pattern to reduce nesting.
  - Complex conditions (\>3) must be extracted to variables/functions.
- **File Size**: Max 500 lines per file. Split if larger.
- **Comments**: Essential for business logic, Enums, and complex algorithms.

# Taro Components

```tsx
import { Image } from '@tarojs/components';

export function ImageDemo() {
  return <Image src='/images/logo.png' style={{ width: 100, height: 100 }} />;
}
```

```tsx
import { RichText } from '@tarojs/components';

export function RichTextDemo() {
  return <RichText nodes={`<span>Hello World!</span>`} />;
}
```

```tsx
import { View, Text } from '@tarojs/components';

export function ViewDemo() {
  return (
    <View className='container'>
      <View className='header'>
        <Text>Hello Taro</Text>
      </View>
      <View className='content'>
        <Text>这是内容区域</Text>
      </View>
    </View>
  );
}
```

# FTA Component List

Below is a list of available FTA components:

{{FTA_COMPONENT_LIST}}

**IMPORTANT:** Whenever you need to use an FTA component, you **MUST** use the `read_component_doc` tool to read its documentation first!

---

user 输入

---

# Page Annotation\n - [design-root-doc_2ze1pm8gd_1764583808616] (NodeId:677:12796) Component View（Size: 720×2105，Children: 8，DataType: IPageInfo）\n- [virtual-annotation-1764584334084-k7iyye] Header View（Size: 608×142，Children: 8，comment: 虚拟容器，DataType: IHeaderProps）\n - [677:12841] unnamed RichText（Size: 608×68）\n - [677:12972] unnamed Image（Size: 124×34）\n - [677:12961] unnamed Text（Size: 96×34）\n - [677:12957] unnamed Text（Size: 96×34）\n - [677:12965] unnamed Text（Size: 96×34）\n - [icon-10] unnamed Icon（Size: 23×23）\n - [icon-11] unnamed Icon（Size: 23×23）\n - [icon-12] unnamed Icon（Size: 23×23）\n- [677:13276] unnamed Icon（Size: 24×24）\n- [677:12913] ShipmentInfoCard Card（Size: 672×388，Children: 2）\n - [677:12914] unnamed View（Size: 672×196，Children: 4）\n - [677:13271/1:2663] unnamed Text（Size: 40×40）\n - [677:12924] unnamed Text（Size: 568×104）\n - [677:12916] unnamed Text（Size: 568×44）\n - [677:13289/1:2821] unnamed Text（Size: 40×40）\n - [677:12933] unnamed View（Size: 672×168，Children: 3）\n - [677:12938] unnamed Text（Size: 432×34）\n - [677:13251] unnamed Icon（Size: 28×28）\n - [677:12934] unnamed View（Size: 672×118，Children: 3）\n - [virtual-annotation-1765184127645-onvins] unnamed View（Size: 264×74，Children: 3，comment: 虚拟容器）\n - [677:13261] unnamed View（Size: 132×74）\n - [677:13328] GoToLoadingPointButton Button（Size: 88×62）\n - [677:13270] unnamed Icon（Size: 24×24）\n - [virtual-annotation-1765184183931-1isbn2] unnamed View（Size: 263×74，Children: 2，comment: 虚拟容器）\n - [677:13252] unnamed View（Size: 160×74）\n - [677:13333] ViewRouteButton Button（Size: 88×62）\n - [677:13281] unnamed Divider\n- [677:13082] ShipmentDetailsCard Card（Size: 672×400，Children: 5，DataType: CargoInfoWithTypeItem）\n - [677:13323] OwnerRequirementNotice NoticeBar（Size: 624×112，Children: 1）\n - [677:13323/1:4600] unnamed RichText（Size: 576×88）\n - [677:13304] unnamed View（Size: 624×40，Children: 2）\n - [677:13304/1:2968] unnamed RichText（Size: 112×40）\n - [677:13304/1:2971] unnamed RichText（Size: 488×40）\n - [677:16812] unnamed View（Size: 624×40，Children: 2）\n - [677:16812/1:2968] unnamed RichText（Size: 112×40）\n - [677:16812/1:2971] unnamed RichText（Size: 488×40）\n - [677:13295] unnamed View（Size: 624×40，Children: 2）\n - [677:13295/1:2968] unnamed RichText（Size: 112×40）\n - [677:13295/1:2971] unnamed RichText（Size: 488×40）\n - [677:16939] unnamed View（Size: 624×40，Children: 2）\n - [677:16939/1:2968] unnamed RichText（Size: 112×40）\n - [677:16939/1:2971] unnamed RichText（Size: 488×40）\n- [677:13208] FeeInfo View（Size: 672×466，Children: 13，DataType: IFeeInfoProps）\n - [virtual-annotation-1765184026512-f75xtn] unnamed RichText（Size: 376×46，comment: 虚拟容器）\n - [677:13111] unnamed View（Size: 199×34，Children: 2）\n - [677:13120] PlatformRebateTag Tag（Size: 108×34，Children: 1）\n - [677:13121] unnamed Text（Size: 96×34）\n - [677:13112] RebateAmountTag Tag（Size: 91×34，Children: 1）\n - [677:13317] unnamed Icon（Size: 20×20）\n - [677:13098] unnamed View（Size: 199×34，Children: 2）\n - [677:13107] TieredSubsidyTag Tag（Size: 108×34，Children: 1）\n - [677:13108] unnamed Text（Size: 96×34）\n - [677:13099] SubsidyAmountTag Tag（Size: 91×34，Children: 2）\n - [677:13104] unnamed Text（Size: 53×34）\n - [677:13316] unnamed Icon（Size: 20×20）\n - [677:13159] unnamed Text（Size: 84×28）\n - [677:13163] unnamed Text（Size: 90×28）\n - [677:13172] unnamed Text（Size: 56×28）\n - [677:13167] unnamed Text（Size: 88×28）\n - [677:13155] unnamed Text（Size: 62×28）\n - [677:13143] unnamed Text（Size: 140×28）\n - [677:13147] unnamed Text（Size: 52×28）\n - [677:13139] unnamed Text（Size: 62×28）\n - [677:13249] unnamed Icon（Size: 24×24）\n - [677:13185] FeeBreakdownCard Card（Size: 624×158，Children: 2）\n - [677:13186] unnamed View（Size: 584×34，Children: 2）\n - [677:13190] unnamed Text（Size: 96×34）\n - [677:13187] unnamed Text（Size: 472×34）\n - [677:13194] unnamed Text（Size: 584×60）\n- [677:13075] Banner View（Size: 672×116，Children: 5，DataType: ICargoSummaryProps）\n - [677:13051] unnamed Text（Size: 168×28）\n - [677:13037] unnamed Text（Size: 39×28）\n - [677:13041] unnamed Text（Size: 346×28）\n - [677:13061] unnamed Icon（Size: 36×36）\n - [677:13055] unnamed Text（Size: 258×28）\n- [677:13003] ShipperInfo View（Size: 672×116，Children: 7，DataType: IShipperInfo）\n - [677:12990] OwnerAvatar Avatar（Size: 76×76）\n - [677:12992] unnamed Text（Size: 84×28）\n - [677:12999] unnamed Text（Size: 106×22）\n - [677:13008] unnamed Text（Size: 72×24）\n - [677:13004] unnamed Text（Size: 53×24）\n - [677:13016] unnamed Text（Size: 48×24）\n - [677:13012] unnamed Text（Size: 47×24）\n- [virtual-annotation-1764584302360-6uo0t6] Footer View（Size: 720×192，Children: 3，comment: 虚拟容器）\n - [677:12894] unnamed Text（Size: 538×32）\n - [677:12888] unnamed Icon（Size: 24×24）\n - [677:13020] PriceFooter View（Size: 720×136，Children: 2，DataType: IFloatPanelProps）\n - [677:13022] unnamed View（Size: 192×88，Children: 2）\n - [677:13027] unnamed View（Size: 113×40，Children: 2）\n - [677:13031] unnamed Text（Size: 89×40）\n - [677:13028] unnamed Text（Size: 24×34）\n - [677:13023] unnamed View（Size: 192×36，Children: 1）\n - [677:13024] unnamed Text（Size: 104×36）\n - [677:13021] unnamed View（Size: 464×88，Children: 2）\n - [677:13338] IncreasePriceButton Button（Size: 224×88）\n - [677:13343] GrabOrderButton Button（Size: 224×88）\n---\n # Design DSL\n {\"dsl\":{\"styles\":{\"paint0\":{\"value\":\"#FFFFFF\"},\"paint1\":{\"value\":\"#F5F5F5\",\"token\":\"灰阶/全局背景 #F5F5F5\"},\"paint2\":{\"value\":\"#F7D69E\",\"token\":\"区域色板/优车 #F7D69E\"},\"paint3\":{\"value\":\"#1A1A1A\",\"token\":\"灰阶/重要 #1A1A1A\"},\"font0\":{\"value\":{\"lineHeight\":28,\"fontSize\":20},\"token\":\"常规/20px 标签\"},\"paint4\":{\"value\":\"linear-gradient(180deg, #F7D69E NaN%, rgba(247, 214, 158, 0) 100%)\",\"token\":\"区域色板/深色渐变\"},\"paint5\":{\"value\":\"#FD3333\",\"token\":\"品牌主色/5.默认 #FD3333\"},\"font1\":{\"value\":{\"style\":\"{\\\"fontStyle\\\":\\\"Regular\\\",\\\"opsz\\\":\\\"auto\\\"}\",\"lineHeight\":68,\"fontSize\":48}},\"effect0\":{\"value\":[]},\"paint6\":{\"value\":\"#F9EFE0\",\"token\":\"运必达色板/背景 #F9EFE0\"},\"paint7\":{\"value\":\"#B36C16\",\"token\":\"区域色板/辅色#B36C16\"},\"paint8\":{\"value\":\"rgba(216, 216, 216, 0)\"},\"paint9\":{\"value\":\"#353535\"},\"paint10\":{\"value\":\"linear-gradient(0deg, #A6681E NaN%, #E1A06C 100%)\"},\"paint11\":{\"value\":\"#946A44\"},\"font2\":{\"value\":{\"lineHeight\":34,\"fontSize\":24}},\"paint12\":{\"value\":\"#F9D097\",\"token\":\"区域色板/辅色 #F9D097\"},\"font3\":{\"value\":{\"style\":\"中黑体\",\"lineHeight\":34,\"fontSize\":24},\"token\":\"中黑/24px\"},\"font4\":{\"value\":{\"style\":\"中黑体\",\"lineHeight\":44,\"fontSize\":32},\"token\":\"中黑/32px 标题\"},\"paint13\":{\"value\":\"#CCCCCC\",\"token\":\"灰阶/禁用 #CCCCCC\"},\"paint14\":{\"value\":\"#999999\",\"token\":\"灰阶/辅助 #999999\"},\"paint15\":{\"value\":\"#F9F9F9\",\"token\":\"灰阶/次级背景 #F9F9F9\"},\"font5\":{\"value\":{\"style\":\"中黑体\",\"lineHeight\":40,\"fontSize\":28},\"token\":\"中黑/28px 小标题\"},\"font6\":{\"value\":{\"lineHeight\":30,\"fontSize\":22},\"token\":\"常规/22px 辅助\"},\"paint16\":{\"value\":\"#D8D8D8\"},\"paint17\":{\"value\":\"#D39C57\",\"token\":\"区域色板/辅色#D39C57\"},\"font7\":{\"value\":{\"style\":\"中黑体\",\"lineHeight\":40,\"fontSize\":40}},\"paint18\":{\"value\":\"#666666\",\"token\":\"灰阶/常规 #666666\"},\"font8\":{\"value\":{\"lineHeight\":36,\"fontSize\":26},\"token\":\"常规/26px 正文\"},\"paint19\":{\"value\":\"#FFF0E6\",\"token\":\"品牌/10.背景\"},\"paint20\":{\"value\":\"#FF7000\",\"token\":\"品牌/5.默认 #FF7000\"},\"font9\":{\"value\":{\"lineHeight\":40,\"fontSize\":28},\"token\":\"常规/28px 正文\"},\"effect1\":{\"value\":[\"0px 4px 20px 0px rgba(0, 0, 0, 0.06),\"]},\"paint21\":{\"value\":\"#E8E8E8\",\"token\":\"灰阶/分割线 #E8E8E8\"},\"font10\":{\"value\":{\"lineHeight\":28,\"fontSize\":28}},\"font11\":{\"value\":{\"decoration\":\"line-through\",\"lineHeight\":28,\"fontSize\":24}},\"font12\":{\"value\":{\"style\":\"中黑体\",\"lineHeight\":28,\"fontSize\":28}},\"font13\":{\"value\":{\"lineHeight\":28,\"fontSize\":24}},\"font14\":{\"value\":{\"style\":\"中粗体\",\"lineHeight\":40,\"fontSize\":52}},\"paint22\":{\"value\":\"#975607\",\"token\":\"区域色板/辅色#975607\"},\"paint23\":{\"value\":\"#F5DBC2\"},\"paint24\":{\"value\":\"linear-gradient(175deg, #FFEADD NaN%, #FFFFFF 79%)\"},\"paint25\":{\"value\":\"#FFAB1A\"},\"effect2\":{\"value\":[\"0px 0px 0.75px 0px rgba(223, 96, 6, 0.76),\"]},\"paint26\":{\"value\":\"#FF8D01\"},\"paint27\":{\"value\":\"linear-gradient(115deg, #FFF4DB NaN%, #FFD572 91%)\"},\"paint28\":{\"value\":\"linear-gradient(113deg, #FFF6DF NaN%, #FFBF2B 97%)\"},\"paint29\":{\"value\":\"linear-gradient(293deg, #FFF6E2 NaN%, #FFB705 94%)\"},\"paint30\":{\"value\":\"linear-gradient(121deg, #FF8400 NaN%, #FADC41 83%)\"},\"paint31\":{\"value\":\"linear-gradient(296deg, #FF8D23 NaN%, #FFD400 102%)\"},\"paint32\":{\"value\":\"linear-gradient(114deg, #FFEC74 NaN%, #FFC85B 95%)\"},\"effect3\":{\"value\":[\"inset -0.51px -0.51px 0px 0px rgba(228, 103, 14, 0.37)\",\"inset 0.39px 0.39px 0px 0px #FFFFFF\"]},\"paint33\":{\"value\":\"linear-gradient(341deg, #FF7F15 NaN%, #FFC949 89%)\"},\"effect4\":{\"value\":[\"inset 0px -0.51px 0.64px 0px #FFFFFF\",\"0px 1.29px 1.03px 0px rgba(228, 103, 14, 0.41),\"]},\"paint34\":{\"value\":\"linear-gradient(180deg, #FFFFFF NaN%, #FFE8D0 100%)\"},\"font15\":{\"value\":{\"style\":\"{\\\"fontStyle\\\":\\\"中黑体\\\",\\\"opsz\\\":\\\"auto\\\"}\",\"lineHeight\":28,\"fontSize\":28}},\"effect5\":{\"value\":[\"2px -1px 13px 0px rgba(223, 221, 218, 0.7033),\",\"inset 0px 3px 0px 0px #FFFFFF\"]},\"paint35\":{\"value\":\"linear-gradient(159deg, #FFECD5 NaN%, #FFDEB7 63%)\"},\"paint36\":{\"value\":\"linear-gradient(184deg, #FFFFFF NaN%, rgba(255, 255, 255, 0) 83%)\"},\"effect6\":{\"value\":[\"0px 2px 4px 0px rgba(0, 0, 0, 0.5),\",\"inset 5px 5px 5px 0px rgba(255, 255, 255, 0.6009)\"]},\"paint37\":{\"value\":\"linear-gradient(170deg, #FFF2E2 NaN%, #FFD8AA 76%)\"},\"effect7\":{\"value\":[\"0px 5px 5px 0px rgba(255, 255, 255, 0.5047),\"]},\"paint38\":{\"value\":\"#FFCD94\"},\"paint39\":{\"value\":\"#6F3D00\"},\"font16\":{\"value\":{\"lineHeight\":32,\"fontSize\":28}},\"paint40\":{\"value\":\"linear-gradient(90deg, #505050 NaN%, #1D1D1D 100%)\"},\"paint41\":{\"value\":\"#FFDDB4\"},\"paint42\":{\"value\":\"linear-gradient(338deg, #F5D198 NaN%, #F8D49A 96%)\"},\"paint43\":{\"value\":{\"url\":\"https://mg.amh-group.com/mastergo-default/88642146392973/88654546891508/c14225c47d74a5a0012c53928b6560b1.jpg\"}},\"effect8\":{\"value\":[\"0px 3.12px 7.8px 0px rgba(141, 175, 143, 0.3),\"]},\"effect9\":{\"value\":[\"0px 2px 10px 0px #959195,\"]},\"paint44\":{\"value\":\"#F3F4F6\",\"token\":\"灰阶/全局背景#F3F4F6-colorBg\"},\"font17\":{\"value\":{\"style\":\"{\\\"fontStyle\\\":\\\"常规体\\\",\\\"opsz\\\":\\\"auto\\\"}\",\"lineHeight\":22,\"fontSize\":22}},\"font18\":{\"value\":{\"lineHeight\":24,\"fontSize\":24}},\"effect10\":{\"value\":[\"0px 2px 20px 0px rgba(26, 26, 26, 0.1608),\"]},\"paint45\":{\"value\":\"linear-gradient(155deg, #5B5854 NaN%, #262626 82%)\"},\"paint46\":{\"value\":\"linear-gradient(154deg, #E7A46B NaN%, #B47530 83%)\"},\"font19\":{\"value\":{\"style\":\"中粗体\",\"lineHeight\":30,\"fontSize\":22}},\"paint47\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/7cf553b4435fadef.png\"},\"token\":\"SVG-形状结合\"},\"paint48\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/c0ea103bbf5beee2.png\"},\"token\":\"SVG-形状结合\"},\"paint49\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/d17b82a2f1d310c6.png\"},\"token\":\"SVG-蒙版\"},\"paint50\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/7cec42c88b7df2df.png\"},\"token\":\"SVG-形状结合\"},\"paint51\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/38b459aed8645acf.png\"},\"token\":\"SVG-形状结合\"},\"paint52\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/0f248df4f8fa4059.png\"},\"token\":\"SVG-形状结合\"},\"paint53\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/b6710e3f23a2a75b.png\"},\"token\":\"SVG-形状结合\"},\"paint54\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/5031179f3deb639a.png\"},\"token\":\"SVG-形状结合\"},\"paint55\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/c135e8165532da1a.png\"},\"token\":\"SVG-形状结合\"},\"paint56\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/f3575df42907d751.png\"},\"token\":\"SVG-Rectangle 2 Copy\"},\"paint57\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/ad7be83e2d19f079.png\"},\"token\":\"SVG-形状结合\"},\"paint58\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/d36fa1e496587ad7.png\"},\"token\":\"SVG-形状结合\"},\"paint59\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/aa79f920ea1bed1a.png\"},\"token\":\"SVG-蒙版\"},\"paint60\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/83ddca42c8dd810a.png\"},\"token\":\"SVG-矩形备份 3\"},\"paint61\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/8e926940c4c321c3.png\"},\"token\":\"SVG-矩形\"},\"paint62\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/be592420659885ab.png\"},\"token\":\"SVG-路径备份\"},\"paint63\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/e633e72f188df115.png\"},\"token\":\"SVG-路径 17 备份\"},\"paint64\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/39b83c720bdc6a7d.png\"},\"token\":\"SVG-Rectangle 2 Copy\"},\"paint65\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/f3cfa91a5424cfbf.png\"},\"token\":\"SVG-Rectangle备份 43\"},\"paint66\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/4e3c5c1612a4614a.png\"},\"token\":\"SVG-路径 316\"},\"paint67\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/2ae66f4dfa6a640e.png\"},\"token\":\"SVG-矩形\"},\"paint68\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/cf3bdddafd0a4798.png\"},\"token\":\"SVG-icon-1\"},\"paint69\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/5970fbf8d02aa3cd.png\"},\"token\":\"SVG-icon-2\"},\"paint70\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/89b115024f0bb91c.png\"},\"token\":\"SVG-icon-3\"},\"paint71\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/3feadd7cd6d8651c.png\"},\"token\":\"SVG-icon-4\"},\"paint72\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/50c0d800ce1090ff.png\"},\"token\":\"SVG-icon-5\"},\"paint73\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/bffea11f0ff904e9.png\"},\"token\":\"SVG-icon-9\"},\"paint74\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/9dab1199ae49bd06.png\"},\"token\":\"SVG-icon-10\"},\"paint75\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/64477a1e3e8df505.png\"},\"token\":\"SVG-icon-12\"},\"paint76\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/6da552b8d0fac364.png\"},\"token\":\"SVG-icon-22\"},\"paint77\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/e954a8d3484bf365.png\"},\"token\":\"SVG-icon-23\"},\"paint78\":{\"value\":{\"url\":\"https://imagecdn.ymm56.com/design-dsl/path/c3ad7da58ca852be.png\"},\"token\":\"SVG-icon-25\"}},\"nodes\":[{\"id\":\"677:12796\",\"fill\":\"paint0\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":720,\"height\":2105},\"children\":[{\"id\":\"677:12841\",\"text\":[{\"text\":\"立即用车 可装 7.7 米 平板/高栏\",\"font\":\"font1\"}],\"textColor\":[{\"start\":0,\"end\":5,\"color\":\"paint5\"},{\"start\":5,\"end\":18,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":608,\"height\":68,\"relativeX\":32,\"relativeY\":151},\"textAlign\":\"left\"},{\"id\":\"677:13276\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":24,\"height\":24,\"relativeX\":648,\"relativeY\":265},\"componentId\":\"1:8776\",\"children\":[{\"id\":\"677:13276/1:8777\",\"fill\":\"paint50\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":10.5,\"height\":19.5,\"relativeX\":17.25,\"relativeY\":21.75,\"rotate\":180}}]},{\"id\":\"677:12972\",\"fill\":\"paint8\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":124,\"height\":34,\"relativeX\":48,\"relativeY\":259}},{\"id\":\"677:12961\",\"text\":[{\"text\":\"运费保障\",\"font\":\"font2\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint11\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":96,\"height\":34,\"relativeX\":226,\"relativeY\":258},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:12957\",\"text\":[{\"text\":\"放空快赔\",\"font\":\"font2\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint11\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":96,\"height\":34,\"relativeX\":371,\"relativeY\":258},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:12965\",\"text\":[{\"text\":\"订金必保\",\"font\":\"font2\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint11\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":96,\"height\":34,\"relativeX\":515,\"relativeY\":258},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:12913\",\"fill\":\"paint0\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":672,\"height\":388,\"relativeY\":311,\"relativeX\":24},\"flexContainerInfo\":{\"flexDirection\":\"column\",\"mainSizing\":\"auto\",\"crossSizing\":\"fixed\",\"padding\":\"0px 0px 24px\"},\"borderRadius\":\"16px\",\"children\":[{\"id\":\"677:12914\",\"fill\":\"paint0\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":672,\"height\":196},\"flexShrink\":1,\"flexContainerInfo\":{\"flexDirection\":\"column\",\"mainSizing\":\"auto\",\"crossSizing\":\"fixed\",\"gap\":\"8px\",\"padding\":\"20px 24px\"},\"borderRadius\":\"16px\",\"children\":[{\"id\":\"677:12923\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":624,\"height\":104,\"relativeX\":24,\"relativeY\":20},\"flexShrink\":1,\"flexContainerInfo\":{\"flexDirection\":\"row\",\"mainSizing\":\"fixed\",\"crossSizing\":\"auto\",\"gap\":\"16px\"},\"children\":[{\"id\":\"677:12931\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":40,\"height\":104},\"flexShrink\":1,\"flexContainerInfo\":{\"flexDirection\":\"column\",\"alignItems\":\"center\",\"mainSizing\":\"fixed\",\"crossSizing\":\"auto\",\"gap\":\"8px\"},\"children\":[{\"id\":\"677:13271\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":40,\"height\":40},\"componentInfo\":{\"properties\":{\"类型\":\"默认\"}},\"componentId\":\"1:2662\",\"children\":[{\"id\":\"677:13271/1:2663\",\"fill\":\"paint9\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":40,\"height\":40},\"flexContainerInfo\":{\"flexDirection\":\"column\",\"justifyContent\":\"center\",\"alignItems\":\"center\",\"mainSizing\":\"fixed\",\"crossSizing\":\"fixed\"},\"borderRadius\":\"8px\",\"children\":[{\"id\":\"677:13271/1:2666\",\"text\":[{\"text\":\"装\",\"font\":\"font3\"}],\"textColor\":[{\"start\":0,\"end\":1,\"color\":\"paint12\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":24,\"height\":34,\"relativeX\":8,\"relativeY\":3},\"textAlign\":\"center\",\"textMode\":\"single-line\"}]}]}]},{\"id\":\"677:12924\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":568,\"height\":104,\"relativeX\":56},\"flexGrow\":1,\"flexContainerInfo\":{\"flexDirection\":\"column\",\"mainSizing\":\"auto\",\"crossSizing\":\"fixed\",\"gap\":\"4px\",\"padding\":\"0px 0px 16px\"},\"children\":[{\"id\":\"677:12928\",\"text\":[{\"text\":\"扬州市-邗江区-圣戈班科技材料(扬州)有限公司古渡路 109 号\",\"font\":\"font4\"}],\"textColor\":[{\"start\":0,\"end\":30,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":568,\"height\":88},\"flexShrink\":1,\"textAlign\":\"left\"}]}]},{\"id\":\"677:12915\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":624,\"height\":44,\"relativeX\":24,\"relativeY\":132},\"flexShrink\":1,\"flexContainerInfo\":{\"flexDirection\":\"row\",\"alignItems\":\"center\",\"mainSizing\":\"fixed\",\"crossSizing\":\"auto\",\"gap\":\"16px\"},\"children\":[{\"id\":\"677:13289\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":40,\"height\":40,\"relativeY\":2},\"componentInfo\":{\"properties\":{\"类型\":\"默认\"}},\"componentId\":\"1:2820\",\"children\":[{\"id\":\"677:13289/1:2821\",\"fill\":\"paint12\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":40,\"height\":40},\"flexContainerInfo\":{\"flexDirection\":\"column\",\"justifyContent\":\"center\",\"alignItems\":\"center\",\"mainSizing\":\"fixed\",\"crossSizing\":\"fixed\"},\"borderRadius\":\"8px\",\"children\":[{\"id\":\"677:13289/1:2822\",\"text\":[{\"text\":\"卸\",\"font\":\"font3\"}],\"textColor\":[{\"start\":0,\"end\":1,\"color\":\"paint9\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":24,\"height\":34,\"relativeX\":8,\"relativeY\":3},\"textAlign\":\"center\",\"textMode\":\"single-line\"}]}]},{\"id\":\"677:12916\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":568,\"height\":44,\"relativeX\":56},\"flexGrow\":1,\"flexContainerInfo\":{\"flexDirection\":\"column\",\"justifyContent\":\"flex-end\",\"alignItems\":\"center\",\"mainSizing\":\"auto\",\"crossSizing\":\"fixed\",\"gap\":\"4px\"},\"children\":[{\"id\":\"677:12917\",\"text\":[{\"text\":\"南京市-溧水区-熹樾状元坊公园对面\",\"font\":\"font4\"}],\"textColor\":[{\"start\":0,\"end\":17,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":568,\"height\":44},\"flexShrink\":1,\"textAlign\":\"left\"}]}]}]},{\"id\":\"677:12933\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":672,\"height\":168,\"relativeY\":196},\"flexContainerInfo\":{\"flexDirection\":\"column\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\",\"gap\":\"16px\"},\"children\":[{\"id\":\"677:12937\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":512,\"height\":34},\"flexContainerInfo\":{\"flexDirection\":\"row\",\"alignItems\":\"center\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\",\"gap\":\"4px\",\"padding\":\"0px 24px\"},\"children\":[{\"id\":\"677:13251\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":28,\"height\":28,\"relativeX\":24,\"relativeY\":3},\"componentId\":\"1:2786\",\"children\":[{\"id\":\"677:13251/1:2787\",\"fill\":\"paint51\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":24.5,\"height\":24.5,\"relativeX\":1.75,\"relativeY\":1.75}}]},{\"id\":\"677:12938\",\"text\":[{\"text\":\"补充车辆信息方可查看装卸货地限行情况\",\"font\":\"font2\"}],\"textColor\":[{\"start\":0,\"end\":18,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":432,\"height\":34,\"relativeX\":56},\"textAlign\":\"left\",\"textMode\":\"single-line\"}]},{\"id\":\"677:12934\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":672,\"height\":118,\"relativeY\":50},\"flexContainerInfo\":{\"flexDirection\":\"column\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\",\"padding\":\"0px 24px\"},\"children\":[{\"id\":\"677:12936\",\"fill\":\"paint15\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":624,\"height\":118,\"relativeX\":24},\"borderRadius\":\"8px\"},{\"id\":\"677:13261\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":132,\"height\":74,\"relativeX\":48,\"relativeY\":20},\"componentInfo\":{\"properties\":{\"28→30px\":\"否\",\"加粗\":\"否\",\"禁用\":\"否\",\"辅助文本\":\"是\"}},\"componentId\":\"1:2890\",\"children\":[{\"id\":\"677:13261/1:2894\",\"text\":[{\"text\":\"29.4km\",\"font\":\"font5\"}],\"textColor\":[{\"start\":0,\"end\":6,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":99,\"height\":40},\"flexShrink\":1,\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13261/1:2891\",\"text\":[{\"text\":\"直线装货距离\",\"font\":\"font6\"}],\"textColor\":[{\"start\":0,\"end\":6,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":132,\"height\":30,\"relativeY\":44},\"flexShrink\":1,\"textAlign\":\"left\",\"textMode\":\"single-line\"}]},{\"id\":\"677:13252\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":160,\"height\":74,\"relativeX\":361,\"relativeY\":20},\"componentInfo\":{\"properties\":{\"28→30px\":\"否\",\"加粗\":\"否\",\"禁用\":\"否\",\"辅助文本\":\"是\"}},\"componentId\":\"1:2890\",\"children\":[{\"id\":\"677:13252/1:2894\",\"text\":[{\"text\":\"182.3km\",\"font\":\"font5\"}],\"textColor\":[{\"start\":0,\"end\":7,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":110,\"height\":40},\"flexShrink\":1,\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13252/1:2891\",\"text\":[{\"text\":\"9.6.米/预估里程\",\"font\":\"font6\"}],\"textColor\":[{\"start\":0,\"end\":10,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":160,\"height\":30,\"relativeY\":44},\"flexShrink\":1,\"textAlign\":\"left\",\"textMode\":\"single-line\"}]},{\"id\":\"677:13281\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"height\":48,\"relativeX\":336,\"relativeY\":33},\"componentId\":\"1:3468\",\"children\":[{\"id\":\"677:13281/1:3469\",\"fill\":\"paint13\",\"strokeColor\":\"effect0\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":1,\"height\":48},\"strokeType\":\"solid\",\"strokeAlign\":\"outside\",\"strokeWidth\":\"0px\"}]},{\"id\":\"677:13270\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":24,\"height\":24,\"relativeX\":182,\"relativeY\":67},\"componentId\":\"1:2954\",\"children\":[{\"id\":\"677:13270/1:2955\",\"fill\":\"paint52\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":21,\"height\":21,\"relativeX\":1.5,\"relativeY\":1.5}}]},{\"id\":\"677:13328\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":88,\"height\":62,\"relativeX\":224,\"relativeY\":29},\"componentInfo\":{\"properties\":{\"尺寸\":\"28*28px\",\"颜色\":\"橙色\"}},\"componentId\":\"1:4087\",\"children\":[{\"id\":\"677:13328/1:4088\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":28,\"height\":28,\"relativeX\":30},\"componentId\":\"1:3584\",\"children\":[{\"id\":\"677:13328/1:4088/1:3585\",\"fill\":\"paint53\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":23.33,\"height\":23.33,\"relativeX\":2.33,\"relativeY\":2.33}}]},{\"id\":\"677:13328/1:4089\",\"text\":[{\"text\":\"去装货地\",\"font\":\"font6\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":88,\"height\":30,\"relativeY\":32},\"textAlign\":\"center\",\"textMode\":\"single-line\"}]},{\"id\":\"677:13333\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":88,\"height\":62,\"relativeX\":536,\"relativeY\":29},\"componentInfo\":{\"properties\":{\"尺寸\":\"28*28px\",\"颜色\":\"橙色\"}},\"componentId\":\"1:4087\",\"children\":[{\"id\":\"677:13333/1:4088\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":28,\"height\":28,\"relativeX\":30},\"componentId\":\"1:3771\",\"children\":[{\"id\":\"677:13333/1:4088/1:3772\",\"fill\":\"paint54\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":23.92,\"height\":23.33,\"relativeX\":2.04,\"relativeY\":2.33}}]},{\"id\":\"677:13333/1:4089\",\"text\":[{\"text\":\"查看线路\",\"font\":\"font6\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":88,\"height\":30,\"relativeY\":32},\"effect\":\"effect_599:10209\",\"textAlign\":\"center\",\"textMode\":\"single-line\"}]}]}]}]},{\"id\":\"728:12261\",\"fill\":\"paint16\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":672,\"height\":8,\"relativeX\":24,\"relativeY\":691},\"mask\":\"alpha\"},{\"id\":\"728:12263\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":24,\"height\":8,\"relativeX\":40,\"relativeY\":691}},{\"id\":\"728:12247\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":134,\"relativeY\":691}},{\"id\":\"728:12264\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":184,\"relativeY\":691}},{\"id\":\"728:12248\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":274,\"relativeY\":691}},{\"id\":\"728:12254\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":324,\"relativeY\":691}},{\"id\":\"728:12250\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":427,\"rotate\":180,\"relativeY\":691}},{\"id\":\"728:12256\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":427,\"rotate\":180,\"relativeY\":691}},{\"id\":\"728:12260\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":552,\"rotate\":180,\"relativeY\":691}},{\"id\":\"728:12253\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":377,\"rotate\":180,\"relativeY\":691}},{\"id\":\"728:12249\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":587,\"relativeY\":691}},{\"id\":\"728:12266\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":662,\"rotate\":180,\"relativeY\":691}},{\"id\":\"728:12262\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":76,\"relativeY\":691}},{\"id\":\"728:12252\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":96,\"relativeY\":691}},{\"id\":\"728:12246\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":116,\"relativeY\":691}},{\"id\":\"728:12245\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":216,\"relativeY\":691}},{\"id\":\"728:12259\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":236,\"relativeY\":691}},{\"id\":\"728:12255\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":256,\"relativeY\":691}},{\"id\":\"728:12258\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":675,\"relativeY\":691}},{\"id\":\"728:12244\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":565,\"relativeY\":691}},{\"id\":\"728:12251\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":493,\"relativeY\":691}},{\"id\":\"728:12257\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":463,\"relativeY\":691}},{\"id\":\"728:12265\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":441,\"relativeY\":691}},{\"id\":\"728:12243\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":620,\"relativeY\":691}},{\"id\":\"677:13020\",\"fill\":\"paint0\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":720,\"height\":136,\"relativeY\":1969},\"effect\":\"effect_599:10209\",\"flexContainerInfo\":{\"flexDirection\":\"row\",\"alignItems\":\"center\",\"mainSizing\":\"fixed\",\"crossSizing\":\"auto\",\"gap\":\"16px\",\"padding\":\"24px\"},\"children\":[{\"id\":\"677:13022\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":192,\"height\":88,\"relativeX\":24,\"relativeY\":24},\"flexContainerInfo\":{\"flexDirection\":\"column\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\",\"gap\":\"12px\"},\"children\":[{\"id\":\"677:13027\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":113,\"height\":40},\"flexContainerInfo\":{\"flexDirection\":\"row\",\"justifyContent\":\"center\",\"alignItems\":\"flex-end\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\"},\"children\":[{\"id\":\"677:13031\",\"text\":[{\"text\":\"1500\",\"font\":\"font7\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint5\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":89,\"height\":40},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13028\",\"text\":[{\"text\":\"元\",\"font\":\"font2\"}],\"textColor\":[{\"start\":0,\"end\":1,\"color\":\"paint5\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":24,\"height\":34,\"relativeX\":89,\"relativeY\":6},\"textAlign\":\"left\",\"textMode\":\"single-line\"}]},{\"id\":\"677:13023\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":192,\"height\":36,\"relativeY\":52},\"flexContainerInfo\":{\"flexDirection\":\"row\",\"alignItems\":\"center\",\"mainSizing\":\"fixed\",\"crossSizing\":\"auto\",\"gap\":\"12px\"},\"children\":[{\"id\":\"677:13024\",\"text\":[{\"text\":\"净得运费\",\"font\":\"font8\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":104,\"height\":36},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13381\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":76,\"height\":34,\"relativeX\":116,\"relativeY\":1},\"componentInfo\":{\"componentSetDescription\":\"Button 按钮\",\"componentSetDocumentLink\":[\"https://fta.amh-group.com/xrun#/components/basic/button\"],\"properties\":{\"颜色\":\"灰色\",\"尺寸\":\"小\"}},\"componentId\":\"248:11185\",\"children\":[{\"id\":\"677:13381/248:11187\",\"text\":[{\"text\":\"详情\",\"font\":\"font2\"}],\"textColor\":[{\"start\":0,\"end\":2,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":48,\"height\":34},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13381/248:11186\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":24,\"height\":24,\"relativeX\":52,\"relativeY\":5},\"componentInfo\":{\"properties\":{\"尺寸\":\"24\*24px\"}},\"componentId\":\"248:11186\",\"children\":[{\"id\":\"677:13381/248:11186/248:11186/248:09906\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":24,\"height\":24},\"componentId\":\"248:08714\",\"children\":[{\"id\":\"677:13381/248:11186/248:11186/248:09906/248:08715\",\"fill\":\"paint55\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":21,\"height\":39,\"relativeX\":34.5,\"relativeY\":43.5,\"rotate\":180}}]}]}]}]}]},{\"id\":\"677:13021\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":464,\"height\":88,\"relativeX\":232,\"relativeY\":24},\"flexContainerInfo\":{\"flexDirection\":\"row\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\",\"gap\":\"16px\"},\"children\":[{\"id\":\"677:13338\",\"strokeColor\":\"paint7\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":224,\"height\":88},\"strokeType\":\"dashed\",\"strokeAlign\":\"outside\",\"componentInfo\":{\"componentSetDescription\":\"Button 按钮\",\"componentSetDocumentLink\":[null],\"properties\":{\"尺寸\":\"大 88px\",\"类型\":\"弱按钮\",\"辅助文字\":\"否\",\"禁用\":\"否\",\"加载中\":\"否\"}},\"componentId\":\"391:00575\",\"children\":[{\"id\":\"677:13338/391:00576\",\"text\":[{\"text\":\"加价\",\"font\":\"font4\"}],\"textColor\":[{\"start\":0,\"end\":2,\"color\":\"paint7\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":64,\"height\":44,\"relativeX\":80,\"relativeY\":22},\"textAlign\":\"center\",\"textMode\":\"single-line\"}]},{\"id\":\"677:13343\",\"fill\":\"paint9\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":224,\"height\":88,\"relativeX\":240},\"componentInfo\":{\"componentSetDescription\":\"Button 按钮\",\"componentSetDocumentLink\":[null],\"properties\":{\"尺寸\":\"大 88px\",\"类型\":\"强按钮\",\"辅助文字\":\"否\",\"禁用\":\"否\",\"加载中\":\"否\"}},\"componentId\":\"391:00550\",\"children\":[{\"id\":\"677:13343/391:00551\",\"text\":[{\"text\":\"去抢单\",\"font\":\"font4\"}],\"textColor\":[{\"start\":0,\"end\":3,\"color\":\"paint12\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":96,\"height\":44,\"relativeX\":64,\"relativeY\":22},\"effect\":\"effect_599:10209\",\"textAlign\":\"center\",\"textMode\":\"single-line\"}]}]}]},{\"id\":\"677:13082\",\"fill\":\"paint0\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":672,\"height\":400,\"relativeX\":24,\"relativeY\":715},\"flexContainerInfo\":{\"flexDirection\":\"column\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\",\"gap\":\"20px\",\"padding\":\"24px\"},\"borderRadius\":\"16px\",\"children\":[{\"id\":\"677:13323\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":624,\"height\":112,\"relativeX\":24,\"relativeY\":24},\"flexShrink\":1,\"borderRadius\":\"8px\",\"componentInfo\":{\"properties\":{\"类型\":\"查看\"}},\"componentId\":\"1:4599\",\"children\":[{\"id\":\"677:13323/1:4603\",\"fill\":\"paint19\",\"strokeColor\":\"paint20\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":624,\"height\":112},\"opacity\":0.5,\"borderRadius\":\"8px\",\"strokeType\":\"solid\",\"strokeAlign\":\"outside\",\"strokeWidth\":\"1px\"},{\"id\":\"677:13323/1:4600\",\"text\":[{\"text\":\"货主要求: 非限行时间卸货, 三不超, 需回单，回单付\",\"font\":\"font4\"}],\"textColor\":[{\"start\":0,\"end\":27,\"color\":\"paint20\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":576,\"height\":88,\"relativeX\":24,\"relativeY\":12},\"flexGrow\":1,\"textAlign\":\"left\"}]},{\"id\":\"677:13304\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":624,\"height\":40,\"relativeX\":24,\"relativeY\":156},\"componentInfo\":{\"properties\":{\"字号\":\"28px\",\"排列\":\"右对齐\"}},\"componentId\":\"1:2967\",\"children\":[{\"id\":\"677:13304/1:2968\",\"text\":[{\"text\":\"货物信息\",\"font\":\"font9\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":112,\"height\":40},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13304/1:2971\",\"text\":[{\"text\":\"化肥 ，10 吨，袋装\",\"font\":\"font5\"}],\"textColor\":[{\"start\":0,\"end\":10,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":488,\"height\":40,\"relativeX\":136},\"flexGrow\":1,\"textAlign\":\"right\"}]},{\"id\":\"677:16812\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":624,\"height\":40,\"relativeX\":24,\"relativeY\":216},\"componentInfo\":{\"properties\":{\"字号\":\"28px\",\"排列\":\"右对齐\"}},\"componentId\":\"1:2967\",\"children\":[{\"id\":\"677:16812/1:2968\",\"text\":[{\"text\":\"货物尺寸\",\"font\":\"font9\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":112,\"height\":40},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:16812/1:2971\",\"text\":[{\"text\":\" 长 X 米 宽 Y 米 高 Z 米\",\"font\":\"font5\"}],\"textColor\":[{\"start\":0,\"end\":12,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":488,\"height\":40,\"relativeX\":136},\"flexGrow\":1,\"textAlign\":\"right\"}]},{\"id\":\"677:13295\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":624,\"height\":40,\"relativeX\":24,\"relativeY\":276},\"componentInfo\":{\"properties\":{\"字号\":\"28px\",\"排列\":\"右对齐\"}},\"componentId\":\"1:2967\",\"children\":[{\"id\":\"677:13295/1:2968\",\"text\":[{\"text\":\"车辆信息\",\"font\":\"font9\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":112,\"height\":40},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13295/1:2971\",\"text\":[{\"text\":\" 拼车 9.6/11.7 米 平板/高栏/厢车\",\"font\":\"font5\"}],\"textColor\":[{\"start\":0,\"end\":22,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":488,\"height\":40,\"relativeX\":136},\"flexGrow\":1,\"textAlign\":\"right\"}]},{\"id\":\"677:16939\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":624,\"height\":40,\"relativeX\":24,\"relativeY\":336},\"componentInfo\":{\"properties\":{\"字号\":\"28px\",\"排列\":\"右对齐\"}},\"componentId\":\"1:2967\",\"children\":[{\"id\":\"677:16939/1:2968\",\"text\":[{\"text\":\"跟车信息\",\"font\":\"font9\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":112,\"height\":40},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:16939/1:2971\",\"text\":[{\"text\":\" 1 人跟车\",\"font\":\"font5\"}],\"textColor\":[{\"start\":0,\"end\":5,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":488,\"height\":40,\"relativeX\":136},\"flexGrow\":1,\"textAlign\":\"right\"}]}]},{\"id\":\"728:12292\",\"fill\":\"paint16\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":672,\"height\":8,\"relativeX\":24,\"relativeY\":1107},\"mask\":\"alpha\"},{\"id\":\"728:12294\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":24,\"height\":8,\"relativeX\":40,\"relativeY\":1107}},{\"id\":\"728:12278\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":134,\"relativeY\":1107}},{\"id\":\"728:12295\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":184,\"relativeY\":1107}},{\"id\":\"728:12279\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":274,\"relativeY\":1107}},{\"id\":\"728:12285\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":324,\"relativeY\":1107}},{\"id\":\"728:12281\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":427,\"rotate\":180,\"relativeY\":1107}},{\"id\":\"728:12287\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":427,\"rotate\":180,\"relativeY\":1107}},{\"id\":\"728:12291\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":552,\"rotate\":180,\"relativeY\":1107}},{\"id\":\"728:12284\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":377,\"rotate\":180,\"relativeY\":1107}},{\"id\":\"728:12280\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":587,\"relativeY\":1107}},{\"id\":\"728:12297\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":662,\"rotate\":180,\"relativeY\":1107}},{\"id\":\"728:12293\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":76,\"relativeY\":1107}},{\"id\":\"728:12283\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":96,\"relativeY\":1107}},{\"id\":\"728:12277\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":116,\"relativeY\":1107}},{\"id\":\"728:12276\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":216,\"relativeY\":1107}},{\"id\":\"728:12290\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":236,\"relativeY\":1107}},{\"id\":\"728:12286\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":256,\"relativeY\":1107}},{\"id\":\"728:12289\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":675,\"relativeY\":1107}},{\"id\":\"728:12275\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":565,\"relativeY\":1107}},{\"id\":\"728:12282\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":493,\"relativeY\":1107}},{\"id\":\"728:12288\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":463,\"relativeY\":1107}},{\"id\":\"728:12296\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":441,\"relativeY\":1107}},{\"id\":\"728:12274\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":620,\"relativeY\":1107}},{\"id\":\"677:13208\",\"fill\":\"paint56\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":672,\"height\":466,\"relativeX\":24,\"relativeY\":1146}},{\"id\":\"677:13185\",\"fill\":\"paint15\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":624,\"height\":158,\"relativeX\":48,\"relativeY\":1430},\"flexContainerInfo\":{\"flexDirection\":\"column\",\"mainSizing\":\"auto\",\"crossSizing\":\"fixed\",\"gap\":\"12px\",\"padding\":\"20px\"},\"borderRadius\":\"12px\",\"children\":[{\"id\":\"677:13186\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":584,\"height\":34,\"relativeX\":20,\"relativeY\":20},\"flexShrink\":1,\"flexContainerInfo\":{\"flexDirection\":\"row\",\"mainSizing\":\"fixed\",\"crossSizing\":\"auto\",\"gap\":\"16px\"},\"children\":[{\"id\":\"677:13190\",\"text\":[{\"text\":\"减佣月包\",\"font\":\"font2\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":96,\"height\":34},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13187\",\"text\":[{\"text\":\"-20 元\",\"font\":\"font2\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":472,\"height\":34,\"relativeX\":112},\"flexGrow\":1,\"effect\":\"effect_599:10209\",\"textAlign\":\"right\"}]},{\"id\":\"677:13193\",\"strokeColor\":\"paint21\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":584,\"height\":72,\"relativeX\":20,\"relativeY\":66},\"flexShrink\":1,\"strokeType\":\"dashed\",\"strokeAlign\":\"outside\",\"strokeWidth\":\"1px 0px 0px\",\"flexContainerInfo\":{\"flexDirection\":\"row\",\"mainSizing\":\"fixed\",\"crossSizing\":\"auto\",\"gap\":\"16px\",\"padding\":\"12px 0px 0px\"},\"children\":[{\"id\":\"677:13194\",\"text\":[{\"text\":\"平台优惠后技术服务费 40 元/净得运费 1100 元=2.7%, 仅指本单，因线路行情等差异，不代表其他订单费率水平。\",\"font\":\"font6\"}],\"textColor\":[{\"start\":0,\"end\":56,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":584,\"height\":60,\"relativeY\":12},\"flexGrow\":1,\"effect\":\"effect_599:10209\",\"textAlign\":\"left\"}]}]},{\"id\":\"677:13143\",\"text\":[{\"text\":\"技术服务费\",\"font\":\"font10\"}],\"textColor\":[{\"start\":0,\"end\":5,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":140,\"height\":28,\"relativeY\":1390,\"relativeX\":48},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13147\",\"text\":[{\"text\":\"73 元\",\"font\":\"font11\"}],\"textColor\":[{\"start\":0,\"end\":3,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":52,\"height\":28,\"relativeX\":554,\"relativeY\":1390},\"textAlign\":\"right\",\"textMode\":\"single-line\"},{\"id\":\"677:13172\",\"text\":[{\"text\":\"订金\",\"font\":\"font10\"}],\"textColor\":[{\"start\":0,\"end\":2,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":56,\"height\":28,\"relativeY\":1338,\"relativeX\":48},\"textAlign\":\"left\"},{\"id\":\"677:13248\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":24,\"height\":24,\"relativeX\":165,\"relativeY\":1340},\"componentId\":\"1:3490\",\"children\":[{\"id\":\"677:13248/1:3491\",\"fill\":\"paint57\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":21,\"height\":21,\"relativeX\":1.5,\"relativeY\":1.5}}]},{\"id\":\"677:13249\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":24,\"height\":24,\"relativeX\":192,\"relativeY\":1392},\"componentId\":\"1:3490\",\"children\":[{\"id\":\"677:13249/1:3491\",\"fill\":\"paint57\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":21,\"height\":21,\"relativeX\":1.5,\"relativeY\":1.5}}]},{\"id\":\"677:13155\",\"text\":[{\"text\":\"20 元\",\"font\":\"font12\"}],\"textColor\":[{\"start\":0,\"end\":3,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":62,\"height\":28,\"relativeX\":610,\"relativeY\":1338},\"textAlign\":\"right\",\"textMode\":\"single-line\"},{\"id\":\"677:13159\",\"text\":[{\"text\":\"总运费\",\"font\":\"font10\"}],\"textColor\":[{\"start\":0,\"end\":3,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":84,\"height\":28,\"relativeX\":48,\"relativeY\":1286},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13163\",\"text\":[{\"text\":\"1500 元\",\"font\":\"font12\"}],\"textColor\":[{\"start\":0,\"end\":5,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":90,\"height\":28,\"relativeX\":582,\"relativeY\":1286},\"textAlign\":\"right\",\"textMode\":\"single-line\"},{\"id\":\"677:13139\",\"text\":[{\"text\":\"53 元\",\"font\":\"font12\"}],\"textColor\":[{\"start\":0,\"end\":3,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":62,\"height\":28,\"relativeX\":610,\"relativeY\":1390},\"textAlign\":\"right\",\"textMode\":\"single-line\"},{\"id\":\"677:13167\",\"text\":[{\"text\":\"(退还 )\",\"font\":\"font13\"}],\"textColor\":[{\"start\":0,\"end\":7,\"color\":\"paint13\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":88,\"height\":28,\"relativeX\":108,\"relativeY\":1338},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13134\",\"text\":[{\"text\":\"预估净得\",\"font\":\"font12\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":112,\"height\":28,\"relativeX\":48,\"relativeY\":1180},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13181\",\"text\":[{\"text\":\"1500\",\"font\":\"font14\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint20\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":115,\"height\":40,\"relativeX\":168,\"relativeY\":1170},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13131\",\"text\":[{\"text\":\"(已加价)\",\"font\":\"font9\"}],\"textColor\":[{\"start\":0,\"end\":5,\"color\":\"paint20\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":103,\"height\":40,\"relativeX\":321,\"relativeY\":1176},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13205\",\"text\":[{\"text\":\"元\",\"font\":\"font9\"}],\"textColor\":[{\"start\":0,\"end\":1,\"color\":\"paint20\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":28,\"height\":40,\"relativeX\":283,\"relativeY\":1176},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13111\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":199,\"height\":34,\"relativeX\":48,\"relativeY\":1228},\"flexContainerInfo\":{\"flexDirection\":\"row\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\"},\"children\":[{\"id\":\"677:13120\",\"fill\":\"paint22\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":108,\"height\":34},\"effect\":\"effect_599:10209\",\"flexContainerInfo\":{\"flexDirection\":\"row\",\"alignItems\":\"center\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\",\"padding\":\"0px 6px\"},\"borderRadius\":\"4px 0px 0px 4px\",\"children\":[{\"id\":\"677:13121\",\"text\":[{\"text\":\"平台返现\",\"font\":\"font3\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint0\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":96,\"height\":34,\"relativeX\":6},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"}]},{\"id\":\"677:13112\",\"fill\":\"paint23\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":91,\"height\":34,\"relativeX\":108},\"flexContainerInfo\":{\"flexDirection\":\"row\",\"alignItems\":\"center\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\",\"gap\":\"6px\",\"padding\":\"0px 6px\"},\"borderRadius\":\"0px 4px 4px 0px\",\"children\":[{\"id\":\"677:13113\",\"text\":[{\"text\":\"60 元\",\"font\":\"font3\"}],\"textColor\":[{\"start\":0,\"end\":3,\"color\":\"paint7\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":53,\"height\":34,\"relativeX\":6},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13317\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":20,\"height\":20,\"relativeX\":65,\"relativeY\":7},\"componentId\":\"1:150\",\"children\":[{\"id\":\"677:13317/1:152\",\"fill\":\"paint58\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":17.5,\"height\":17.5,\"relativeX\":1.25,\"relativeY\":1.25}}]}]}]},{\"id\":\"677:13098\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":199,\"height\":34,\"relativeX\":263,\"relativeY\":1228},\"flexContainerInfo\":{\"flexDirection\":\"row\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\"},\"children\":[{\"id\":\"677:13107\",\"fill\":\"paint22\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":108,\"height\":34},\"effect\":\"effect_599:10209\",\"flexContainerInfo\":{\"flexDirection\":\"row\",\"alignItems\":\"center\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\",\"padding\":\"0px 6px\"},\"borderRadius\":\"4px 0px 0px 4px\",\"children\":[{\"id\":\"677:13108\",\"text\":[{\"text\":\"阶梯补贴\",\"font\":\"font3\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint0\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":96,\"height\":34,\"relativeX\":6},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"}]},{\"id\":\"677:13099\",\"fill\":\"paint23\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":91,\"height\":34,\"relativeX\":108},\"flexContainerInfo\":{\"flexDirection\":\"row\",\"alignItems\":\"center\",\"mainSizing\":\"auto\",\"crossSizing\":\"auto\",\"gap\":\"6px\",\"padding\":\"0px 6px\"},\"borderRadius\":\"0px 4px 4px 0px\",\"children\":[{\"id\":\"677:13104\",\"text\":[{\"text\":\"60 元\",\"font\":\"font3\"}],\"textColor\":[{\"start\":0,\"end\":3,\"color\":\"paint7\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":53,\"height\":34,\"relativeX\":6},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13316\",\"type\":\"INSTANCE\",\"layoutStyle\":{\"width\":20,\"height\":20,\"relativeX\":65,\"relativeY\":7},\"componentId\":\"1:150\",\"children\":[{\"id\":\"677:13316/1:152\",\"fill\":\"paint58\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":17.5,\"height\":17.5,\"relativeX\":1.25,\"relativeY\":1.25}}]}]}]},{\"id\":\"728:12321\",\"fill\":\"paint16\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":672,\"height\":8,\"relativeX\":24,\"relativeY\":1604},\"mask\":\"alpha\"},{\"id\":\"728:12323\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":24,\"height\":8,\"relativeX\":40,\"relativeY\":1604}},{\"id\":\"728:12307\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":134,\"relativeY\":1604}},{\"id\":\"728:12324\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":184,\"relativeY\":1604}},{\"id\":\"728:12308\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":274,\"relativeY\":1604}},{\"id\":\"728:12314\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":324,\"relativeY\":1604}},{\"id\":\"728:12310\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":427,\"rotate\":180,\"relativeY\":1604}},{\"id\":\"728:12316\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":427,\"rotate\":180,\"relativeY\":1604}},{\"id\":\"728:12320\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":8,\"relativeX\":552,\"rotate\":180,\"relativeY\":1604}},{\"id\":\"728:12313\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":377,\"rotate\":180,\"relativeY\":1604}},{\"id\":\"728:12309\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":587,\"relativeY\":1604}},{\"id\":\"728:12326\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":662,\"rotate\":180,\"relativeY\":1604}},{\"id\":\"728:12322\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":76,\"relativeY\":1604}},{\"id\":\"728:12312\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":96,\"relativeY\":1604}},{\"id\":\"728:12306\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":116,\"relativeY\":1604}},{\"id\":\"728:12305\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":216,\"relativeY\":1604}},{\"id\":\"728:12319\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":236,\"relativeY\":1604}},{\"id\":\"728:12315\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":256,\"relativeY\":1604}},{\"id\":\"728:12318\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":675,\"relativeY\":1604}},{\"id\":\"728:12304\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":565,\"relativeY\":1604}},{\"id\":\"728:12311\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":493,\"relativeY\":1604}},{\"id\":\"728:12317\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":20,\"height\":8,\"relativeX\":463,\"relativeY\":1604}},{\"id\":\"728:12325\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":441,\"relativeY\":1604}},{\"id\":\"728:12303\",\"fill\":\"paint17\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":8,\"height\":8,\"relativeX\":620,\"relativeY\":1604}},{\"id\":\"677:13075\",\"fill\":\"paint24\",\"strokeColor\":\"paint0\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":672,\"height\":116,\"relativeX\":24,\"relativeY\":1628},\"borderRadius\":\"16px\",\"strokeType\":\"dashed\",\"strokeAlign\":\"outside\",\"strokeWidth\":\"2px\",\"effect\":\"effect_599:10209\"},{\"id\":\"677:13061\",\"type\":\"FRAME\",\"layoutStyle\":{\"width\":36,\"height\":36,\"relativeX\":44,\"relativeY\":1668}},{\"id\":\"677:13036\",\"fill\":\"paint13\",\"strokeColor\":\"effect0\",\"type\":\"LAYER\",\"layoutStyle\":{\"height\":64,\"relativeX\":92,\"relativeY\":1654},\"strokeType\":\"dashed\",\"strokeAlign\":\"inside\"},{\"id\":\"677:13051\",\"text\":[{\"text\":\"本单最高可加\",\"font\":\"font10\"}],\"textColor\":[{\"start\":0,\"end\":6,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":168,\"height\":28,\"relativeX\":105,\"relativeY\":1652},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13055\",\"text\":[{\"text\":\"20 分\",\"font\":\"font15\"},{\"text\":\"准装卸货打卡得\",\"font\":\"font10\"}],\"textColor\":[{\"start\":0,\"end\":10,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":258,\"height\":28,\"relativeX\":105,\"relativeY\":1692},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13037\",\"text\":[{\"text\":\"120\",\"font\":\"font11\"}],\"textColor\":[{\"start\":0,\"end\":3,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":39,\"height\":28,\"relativeX\":277,\"relativeY\":1653},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13041\",\"text\":[{\"text\":\"240 分\",\"font\":\"font12\"},{\"text\":\", 接单立得\",\"font\":\"font10\"},{\"text\":\"100 分\",\"font\":\"font15\"},{\"text\":\", 精\",\"font\":\"font10\"}],\"textColor\":[{\"start\":0,\"end\":17,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":346,\"height\":28,\"relativeX\":322,\"relativeY\":1653},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\"},{\"id\":\"677:12911\",\"fill\":\"paint60\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":201.61,\"height\":315.13,\"relativeX\":323.3,\"relativeY\":1725.26,\"rotate\":35}},{\"id\":\"677:12901\",\"fill\":\"paint61\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":201.61,\"height\":315.13,\"relativeX\":278.75,\"relativeY\":1725.26,\"rotate\":35}},{\"id\":\"677:12909\",\"fill\":\"paint62\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":132,\"height\":152,\"relativeX\":576,\"relativeY\":1897.64}},{\"id\":\"677:12910\",\"fill\":\"paint63\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":48,\"height\":24,\"relativeX\":618,\"relativeY\":1978.64}},{\"id\":\"677:12894\",\"text\":[{\"text\":\"货主已全额支付 1500 元到平台，结算有保障\",\"font\":\"font16\"}],\"textColor\":[{\"start\":0,\"end\":21,\"color\":\"paint39\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":538,\"height\":32,\"relativeX\":80,\"relativeY\":1917},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:12893\",\"fill\":\"paint40\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":40,\"height\":40,\"relativeX\":28,\"relativeY\":1913},\"borderRadius\":\"8px\"},{\"id\":\"677:13003\",\"fill\":\"paint64\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":672,\"height\":116,\"relativeX\":24,\"relativeY\":1760}},{\"id\":\"677:12990\",\"fill\":\"paint43\",\"strokeColor\":\"paint21\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":76,\"height\":76,\"relativeX\":48,\"relativeY\":1780},\"borderRadius\":\"78.03570556640625px\",\"strokeType\":\"dashed\",\"strokeAlign\":\"outside\",\"strokeWidth\":\"1px\",\"effect\":\"effect_605:15026\"},{\"id\":\"677:12992\",\"text\":[{\"text\":\"朱老板\",\"font\":\"font12\"}],\"textColor\":[{\"start\":0,\"end\":3,\"color\":\"paint3\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":84,\"height\":28,\"relativeX\":144,\"relativeY\":1784},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:12998\",\"fill\":\"paint65\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":118,\"height\":28,\"relativeX\":240,\"relativeY\":1784}},{\"id\":\"677:12999\",\"text\":[{\"text\":\"信用 4.0 星\",\"font\":\"font17\"}],\"textColor\":[{\"start\":0,\"end\":7,\"color\":\"paint18\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":106,\"height\":22,\"relativeX\":246,\"relativeY\":1787},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13012\",\"text\":[{\"text\":\"1271\",\"font\":\"font18\"}],\"textColor\":[{\"start\":0,\"end\":4,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":47,\"height\":24,\"relativeX\":357,\"relativeY\":1828},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13004\",\"text\":[{\"text\":\"99%\",\"font\":\"font18\"}],\"textColor\":[{\"start\":0,\"end\":3,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":53,\"height\":24,\"relativeX\":224,\"relativeY\":1828},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13016\",\"text\":[{\"text\":\"交易\",\"font\":\"font18\"}],\"textColor\":[{\"start\":0,\"end\":2,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":48,\"height\":24,\"relativeX\":301,\"relativeY\":1828},\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:13008\",\"text\":[{\"text\":\"好评率\",\"font\":\"font18\"}],\"textColor\":[{\"start\":0,\"end\":3,\"color\":\"paint14\"}],\"type\":\"TEXT\",\"layoutStyle\":{\"width\":72,\"height\":24,\"relativeX\":144,\"relativeY\":1828},\"effect\":\"effect_599:10209\",\"textAlign\":\"left\",\"textMode\":\"single-line\"},{\"id\":\"677:12991\",\"fill\":\"paint66\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":0,\"height\":16,\"relativeX\":289,\"relativeY\":1833}},{\"id\":\"677:23864\",\"fill\":\"paint67\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":104,\"height\":122,\"relativeX\":592,\"relativeY\":722}},{\"id\":\"icon-1\",\"fill\":\"paint68\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":97.88,\"height\":17.14,\"relativeX\":48,\"relativeY\":15.43}},{\"id\":\"icon-2\",\"fill\":\"paint69\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":100.71,\"height\":17.81,\"relativeX\":310,\"relativeY\":15}},{\"id\":\"icon-3\",\"fill\":\"paint70\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":17,\"height\":27,\"relativeX\":663,\"relativeY\":10.5}},{\"id\":\"icon-4\",\"fill\":\"paint71\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":24,\"height\":24,\"relativeX\":614,\"relativeY\":11.5}},{\"id\":\"icon-5\",\"fill\":\"paint72\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":42.59,\"height\":78.01,\"relativeX\":568,\"relativeY\":18.58}},{\"id\":\"icon-9\",\"fill\":\"paint73\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":122.77,\"height\":27.08,\"relativeX\":48,\"relativeY\":262.78}},{\"id\":\"icon-10\",\"fill\":\"paint74\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":22.64,\"height\":22.64,\"relativeX\":195.24,\"relativeY\":261}},{\"id\":\"icon-11\",\"fill\":\"paint74\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":22.64,\"height\":22.64,\"relativeX\":339.24,\"relativeY\":261}},{\"id\":\"icon-12\",\"fill\":\"paint75\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":22.64,\"height\":22.64,\"relativeX\":483.24,\"relativeY\":261}},{\"id\":\"icon-22\",\"fill\":\"paint76\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":47.07,\"height\":44.12,\"relativeX\":44.64,\"relativeY\":1668.64}},{\"id\":\"icon-23\",\"fill\":\"paint77\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":45,\"height\":36,\"relativeY\":1915,\"relativeX\":30}},{\"id\":\"icon-25\",\"fill\":\"paint78\",\"type\":\"LAYER\",\"layoutStyle\":{\"width\":48,\"height\":32.55,\"relativeY\":750.45,\"relativeX\":620}}]}]}}

---

# 任务

帮我优化这个 user prompt

1. 其中 Page Annotation 的原始数据已经有了 大小和位置信息，我考虑将 Design DSL 中的对应 面积模块的设计稿信息绑定到 Page Annotation 对应的 node 上，这样是否更利于生成，上下文是否会更短（剔除 Design DSL 中无用的信息）
2. 如果第一步确定有效的话，怎么绑定是另外一个问题，因为 Page Annotation 和 Design DSL 是两棵树，我希望绑定的到 Page Annotation 上的 Design DSL 信息包括所有面积内的并且不被子节点包括的信息，这个算法一个怎么表述？
3. 如果你确定可行，可以给我一个终极 user prompt 的 Page Annotation 数据结构的模版和字段描述

================================================

这是一个非常棒的优化方向。你目前的 Prompt 最大的痛点在于**信息割裂**：LLM 需要在庞大的 `Design DSL` 字典和 `Page Annotation` 树之间频繁“跳跃”和“查找”，这不仅浪费了 Token（大量的 Token 用于描述未被使用的全局样式表），还极大地增加了推理的复杂度（Reasoning Overhead），容易导致样式错乱或丢失。

以下是针对你提出的三个问题的详细解答和方案：

### 1\. 方案评估：将 Design DSL 绑定到 Page Annotation 上

**结论：非常有效，强烈推荐。**

- **上下文更短**：目前的 `Design DSL` 包含大量全局定义（如 `paint0` 到 `paint78`），其中很多可能当前页面根本没用到。绑定并“预处理”后，你可以直接将 `#FFFFFF` 或 `24px` 写入节点，丢弃庞大的查找表。
- **注意力更集中**：LLM 不再需要执行“搜索 ID -\> 查找属性 -\> 应用样式”的逻辑。样式就在组件结构旁边，这符合 Attention 机制的运作方式。
- **结构更清晰**：`Page Annotation` 作为 SSOT（Single Source of Truth）的地位得到物理层面的强化。

### 2\. 绑定算法描述 (Binding Algorithm)

这是一个典型的 **“基于几何包含关系的归属判定”** 问题。因为 `Page Annotation` 是逻辑树（粗粒度），而 `Design DSL` 是视觉树（细粒度，甚至是碎片化的），我们需要把视觉元素“挂载”到最匹配的逻辑节点上。

你提到的“面积内但不被子节点包括”的逻辑，在计算机图形学中类似于 **Hit Testing** 或 **DOM 也就是最深层级匹配**。

**算法逻辑描述（伪代码/思路）：**

假设我们需要生成一棵 `MergedTree`。

**前置准备：**

1.  **坐标系统一**：确保 `Page Annotation` 和 `Design DSL` 都在同一个绝对坐标系下。如果 Annotation 是相对坐标，需要先递归计算出每个节点的绝对 Global Bounding Box $(x, y, width, height)$。
2.  **打平 Design DSL**：将 Design DSL 中的所有视觉节点（Text, Vector, Rectangle 等）打平为一个列表 `VisualList`。

**核心匹配逻辑：**

对于 `VisualList` 中的每一个视觉元素 $V$：

1.  遍历 `Page Annotation` 树（通常使用深度优先遍历 DFS）。
2.  找到所有 **几何上完全包含** $V$ 的 Annotation 节点。
    - 判断标准：$A.x \le V.x$ 且 $A.y \le V.y$ 且 $A.x+A.w \ge V.x+V.w$ 且 $A.y+A.h \ge V.y+V.h$。
3.  在所有符合条件的 Annotation 节点中，选择 **面积最小** (或者层级最深) 的那个节点 $A_{target}$。
    - 这就是你说的“不被子节点包括”的算法实现方式。因为如果 $A_{parent}$ 和 $A_{child}$ 都包含了视觉元素 $V$，显然 $A_{child}$ 的面积更小（或层级更深），$V$ 应该归属于 $A_{child}$。
4.  将 $V$ 的样式信息（颜色、字体、圆角、背景等）合并到 $A_{target}$ 的 `visualProps` 字段中。

**特殊情况处理：**

- **背景层**：如果 $V$ 的大小和 $A_{target}$ 几乎一致（误差范围内），它通常是 $A_{target}$ 的 `background` 或 `border`。
- **文本节点**：如果 $A_{target}$ 是一个 Text 组件，且 $V$ 也是文本，直接用 $V$ 的字号/行高/颜色覆盖。
- **干扰项剔除**：如果 $V$ 极小且不属于任何逻辑节点（可能是设计稿的杂质），则丢弃。

---

### 3\. 终极 User Prompt 数据结构模版

基于上述逻辑，你需要构建一个新的 JSON 结构供 LLM 消费。这个结构应该**以 Annotation 为骨架，以 Design DSL 为血肉**。

我为你设计了一个 **`IPageNode`** 结构，它移除了所有查找表，直接描述最终样式。

#### 优化后的 User Prompt 结构示例

LLM 接收到的 `user_input` 应该长这样：

```json
{
  "pageStructure": {
    "nodeId": "677:12796",
    "type": "View", // 或 "Card", "Button" 等组件名
    "componentName": "Component View", // 对应 Annotation 的名字
    "dataType": "IPageInfo", // 对应 Annotation 的 DataType
    "comment": "逻辑根节点",

    // 【关键优化 1】布局信息 (从 Annotation 计算)
    "layout": {
      "width": 720,
      "height": 2105,
      "x": 0,
      "y": 0,
      "isFlex": true, // 你可以在预处理时通过子节点排列推断是否为 flex
      "flexDirection": "column"
    },

    // 【关键优化 2】视觉样式 (从 Design DSL 提取并解析后的结果)
    // 不再引用 paintID，直接给值
    "styles": {
      "backgroundColor": "#FFFFFF",
      "borderRadius": "16px",
      "opacity": 1,
      "boxShadow": "none"
      // 如果有背景图，解析为: "backgroundImage": "url(...)"
    },

    // 【关键优化 3】如果是 Text 组件，合并字体信息
    "typography": null,

    // 子节点递归
    "children": [
      {
        "nodeId": "677:12841",
        "type": "RichText",
        "componentName": "unnamed RichText",
        "layout": {
          "width": 608,
          "height": 68,
          "marginTop": 20 // 预处理时可以计算出 margin/padding
        },
        "styles": {
          "color": "#FD3333" // 这里解决了原数据中不同位置颜色不同的问题
        },
        "typography": {
          "fontSize": "48px",
          "lineHeight": "68px",
          "fontWeight": "Regular",
          "content": "立即用车 可装 7.7米..."
        },
        "children": []
      },
      {
        "nodeId": "677:12913",
        "type": "Card",
        "componentName": "ShipmentInfoCard",
        "styles": {
          "backgroundColor": "#FFFFFF",
          "borderRadius": "16px",
          "padding": "20px 24px" // 预处理可以把 Design DSL 的 padding 算好放这里
        },
        "children": [
          // ... 内部结构
        ]
      }
    ]
  }
}
```

#### 字段描述 (Schema Definition)

如果你需要告诉 LLM 这个结构的定义，可以使用以下 TypeScript 接口描述：

```typescript
interface MergedPageNode {
  // --- 身份信息 (来自 Page Annotation) ---
  nodeId: string;
  type: string; // 基础组件 (View, Text) 或 业务组件名
  componentName: string; // 语义化名称
  dataType?: string; // 数据类型定义
  comment?: string; // 业务注释

  // --- 布局信息 (来自 Annotation + Design DSL 计算) ---
  layout: {
    width: number;
    height: number;
    // 预处理阶段建议尽量计算出 flex 布局属性，如果算不出，保留绝对坐标供 LLM 推理
    x?: number;
    y?: number;
    padding?: string; // CSS 格式 "10px 20px"
    margin?: string;
    gap?: number;
  };

  // --- 视觉样式 (来自 Design DSL 归属计算) ---
  // 注意：所有 token ID (paint1) 必须在预处理阶段被替换为真实值 (#FFF)
  styles: {
    backgroundColor?: string;
    backgroundImage?: string;
    border?: string; // e.g. "1px solid #E8E8E8"
    borderRadius?: number | string;
    boxShadow?: string;
    opacity?: number;
    color?: string; // 文本颜色
  };

  // --- 文本属性 (仅 Text/RichText 有效) ---
  typography?: {
    fontSize: number;
    fontWeight: string | number;
    lineHeight: number;
    textAlign: 'left' | 'center' | 'right';
    content: string; // 静态文案
  };

  // --- 树结构 ---
  children: MergedPageNode[];
}
```

### 总结建议

1.  **预处理脚本是关键**：不要让 Code Agent 在 Prompt 里做“图像处理”或“几何计算”。编写一个 Python/Node.js 脚本，按照上面的算法，将两份 JSON 合并成一份 `MergedPageNode` 树。
2.  **Prompt 瘦身**：
    - **删除**：原有的 `Design DSL` 整个板块。
    - **保留**：`Page Annotation` 的树形结构，但将其节点内容替换为包含 `styles` 的丰富节点。
    - **指令更新**：修改 Prompt 中的 `Input Authority` 部分，告诉 Agent：“Input data is a merged tree structure where `styles` are already mapped to specific components. You should use `layout` and `styles` fields directly to generate SCSS.”

这样做之后，Agent 的任务就从 **“解码+查找+拼图+编码”** 简化为了 **“翻译（JSON to TSX/SCSS）”**，准确率和代码质量都会大幅提升。

================================================

对于 MergedPageNode，必须有一个需要认真考虑的地方：
Annotation 是精简化标注，并没有标注所有当前节点的细节，所以 MergedPageNode 中 的 children 是表述其子标注节点，但是除了 children 中描述的节点 当前 MergedPageNode 面积范围内还有一些有设计意义但是没有标注的部分，这部分不能遗漏，在生成代码时模型可以自行抉择

================================================

这是一个非常敏锐且关键的洞察。在实际生产中，**Annotation（标注）往往只关注“业务逻辑节点”**（如点击区域、动态数据容器），而忽略了装饰性背景、分割线、以及一些静态的视觉修饰。

如果只把 Design DSL 绑定到已有的 `children` 上，那些“夹缝中”的视觉元素（Orphan Nodes）确实会丢失。

我们需要在 `MergedPageNode` 中引入一个\*\*“未标注视觉层（Unmapped Layers）”\*\*的概念。

### 核心思路：做减法（几何扣除法）

对于每一个 Annotation 节点，Design DSL 中属于它的元素分为两类：

1.  **明确归属子节点的**：落在这个节点的 `children`（子 Annotation）范围内的元素。
2.  **剩余的（Orphans）**：落在当前节点范围内，但**不**属于任何一个 `children` 的元素。

这部分“剩余元素”就是你需要显式传递给 LLM，让它\*\*“自行抉择”\*\*如何实现的素材。

---

### 1\. 结构优化：新增 `extraVisuals` 字段

在 `MergedPageNode` 中增加一个字段，专门存放这些“无主”的视觉节点。

```typescript
interface MergedPageNode {
  // ... 原有字段 (nodeId, type, layout, styles, children 等)

  /**
   * 关键新增字段：当前节点范围内，但不属于任何子 Annotation 的视觉元素。
   * 模型需要根据这些元素的大小、位置、类型来决定：
   * 1. 它是背景图片？ ->合成到当前容器样式的 backgroundImage
   * 2. 它是分割线？ -> 插入一个 View
   * 3. 它是装饰图标？ -> 插入 Image/Icon
   * 4. 它是未标注的静态文案？ -> 插入 Text
   */
  extraVisuals: Array<{
    type: 'Rect' | 'Text' | 'Vector' | 'Image';
    layout: { x: number; y: number; width: number; height: number }; // 相对父节点的坐标
    styles: Record<string, any>;
    content?: string; // 如果是文本
  }>;
}
```

### 2\. 绑定算法升级：递归扣除逻辑

我们需要把 Design DSL 里的所有节点“下沉”到最深的可容纳它的 Annotation 节点中，如果沉不下去了（没有子节点能包住它），它就停留在当前层级，成为 `extraVisuals`。

**算法描述：**

定义函数 `DistributeVisuals(annotationNode, candidateVisuals)`:

1.  **初始化**：

    - `currentExtraVisuals` = []
    - `nextLevelCandidates` = Map\<ChildNodeId, VisualList\>()

2.  **遍历筛选**：
    对于 `candidateVisuals` 中的每一个视觉元素 `V`：

    - **Hit Test（命中测试）**：检查 `V` 是否被 `annotationNode` 的某个 **子节点 (`child`)** 完全包含（或包含绝大部分）。
    - **如果是**：将 `V` 放入该 `child` 对应的 `nextLevelCandidates` 列表中。
    - **如果否**（即 `V` 在当前节点内，但不在任何子节点内）：将 `V` 放入 `currentExtraVisuals`。

3.  **递归执行**：

    - 将 `currentExtraVisuals` 赋值给 `annotationNode.extraVisuals`。
    - 对每一个 `child`，递归调用 `DistributeVisuals(child, nextLevelCandidates[child.id])`。

---

### 3\. 终极 User Prompt 数据结构模版 (V2.0)

这是包含“遗漏补全”机制的最终 JSON 结构。

```json
{
  "pageStructure": {
    "nodeId": "677:12913",
    "type": "Card",
    "componentName": "ShipmentInfoCard",
    "layout": { "width": 672, "height": 388, "x": 24, "y": 311 },
    "styles": { "backgroundColor": "#FFFFFF", "borderRadius": "16px" },

    // 【新增】这里存放标注树没覆盖到的设计细节
    "extraVisuals": [
      {
        // 例子：原本漏掉的一条分割线
        "type": "Rect",
        "id": "728:12292",
        "layout": { "x": 24, "y": 100, "width": 624, "height": 1 }, // 相对坐标
        "styles": { "backgroundColor": "#E8E8E8" },
        "roleHint": "separator" // 预处理脚本若能识别形状，可给出 hint
      },
      {
        // 例子：原本漏掉的一个装饰Icon
        "type": "Vector",
        "layout": { "x": 600, "y": 20, "width": 24, "height": 24 },
        "styles": { "backgroundImage": "url(https://...)" }
      }
    ],

    "children": [
      {
        "nodeId": "677:12914",
        "type": "View",
        "componentName": "AddressRow",
        "layout": { "width": 672, "height": 196 },
        "children": [], // ...
        "extraVisuals": [] // 子节点内部可能也有未标注的细节
      }
      // ... 其他子节点
    ]
  }
}
```

### 4\. 对应的 System Prompt 策略更新

在你的 System Prompt 中，需要明确告诉 Agent 如何处理 `extraVisuals`。

**在 "V. Phase 3: Component & Style" 章节增加：**

#### 5.3 Handling Unannotated Visuals (`extraVisuals`)

The `pageStructure` includes an `extraVisuals` field. These are raw design elements found within the component's area but **NOT** mapped to any specific logical child annotation.

**You MUST make an intelligent decision for each item in `extraVisuals`:**

1.  **Backgrounds/Shapes**:
    - If it matches the container size, merge it into the container's `style`.
    - If it is a decorative shape, render it as an absolute positioned `<View>` or `<Image>`.
2.  **Separators/Lines**:
    - Render as a `<View>` with specific height/width and background color.
3.  **Icons/Vectors**:
    - Render as `<Image src="..." />`.
4.  **Static Text**:
    - If meaningful (e.g., a static label "RMB"), render as `<Text>`.
    - If redundant (covered by data), ignore it.

**Example Logic:**

```tsx
// Inside Component
return (
  <View className={styles.card}>
    {/* 1. Render Logical Children from 'children' field */}
    <AddressRow data={data.address} />
    {/* 2. Render Extra Visuals (The "Dark Matter") */}
    <View className={styles.separator} /> {/* Derived from extraVisuals[0] */}
    <Image src={decorIcon} className={styles.cornerIcon} /> {/* Derived from extraVisuals[1] */}
  </View>
);
```

### 总结

通过引入 **`extraVisuals`** 字段和 **递归扣除算法**，你其实是在告诉 LLM：

> “这是你的主线任务（Children），必须按结构写；这是支线素材（ExtraVisuals），它们散落在背景里，请你自己看着办，把它们拼贴到正确的位置，不要让设计稿看起来秃了一块。”

这样既保留了 Annotation 的业务逻辑严谨性，又兜底了 Design DSL 的视觉完整性。
