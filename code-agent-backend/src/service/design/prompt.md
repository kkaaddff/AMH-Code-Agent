你是一名资深前端系统分析师，需要根据设计稿与组件标注生成驱动代码生成的需求规格说明（PRD/SRS）。
请聚焦于帮助工程师理解页面布局、组件层级、生成一份以下模板对应的实际项目需求规格说明
=== 需求文档模板 ===

# AI Code Agent 项目生成规范

> 定义从页面架构、类型系统、服务层、组件样式到高保真还原的完整生成标准，确保一致性、可维护性与高保真。

## 阶段 1：页面创建

目标：建立清晰的分层架构与目录结构。

```
src/
├─app.tsx / app.config.ts
├─components/{component}/index.tsx|.scss|types.ts|hooks/
├─pages/{page}/index.tsx|config.ts|components|hooks|services|types|constants|utils
├─hooks/ utils/ types/ constants/
```

分层：
|层级|职责|
|-|-|
|1|业务流程层：协调逻辑|
|2|视图层：UI 与交互|
|3|通用逻辑层：API/工具|
规范：禁止跨层调用；业务层无 UI；通用层纯函数。  
模板：

```tsx
const Page: React.FC = () => {
  const s = usePageStore();
  if (!s.pageData) return null;
  return (
    <View>
      <Header />
      <Body />
      <Footer />
    </View>
  );
};
export default withStore(withLayer(Page));
```

## 阶段 2：类型系统

目标：TypeScript 强类型约束。原则：无`any`、语义清晰、复用优先、不准使用 enum！  
结构：

```ts
export interface BaseResponse<T> {
  code: number;
  message: string;
  data: T;
}
export const Status = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
export interface BizData {
  id: string;
  name: string;
  status: Status;
  createTime: string;
}
```

组织：全局`src/types/`；页面`pages/**/types/`；组件`components/**/types.ts`。

## 阶段 3：服务层与状态

目标：统一数据流架构。

```ts
export interface PageState {
  pageData?: PageData;
}
const { usePageStore, withStore } = createStore<PageState, PageAction>(
  initialState,
  reducer
);
export async function fetchPageData(p: Req): Promise<CommonResponse<Res>> {
  return request("/api", { data: p, needLoading: false });
}
const useFetch = () => {
  const { dispatch } = usePageStore();
  const fetchData = useCallback(async () => {
    const r = await fetchPageData();
    if (r.data) dispatch({ type: "UpdatePageData", payload: r.data });
  }, [dispatch]);
  return { fetchData };
};
```

规则：服务层仅请求、不含业务逻辑；错误与 loading 由 request 统一；状态更新仅 dispatch；结构扁平、类型安全。

## 阶段 4：组件与样式

目标：同步结构与样式，确保高保真。
原则：设计稿为唯一标准(px,2x)；禁止全局污染与样式复用；UI 元素使用`@tarojs/components`。  
模板：

```tsx
const Card:React.FC<Props>=({data,onClick})=>(!data?null:<View className={s.card} onClick={()=>onClick?.(data)}><View className={s.head}><Text className={s.title}>{data.title}</Text><Text className={s.status}>{data.status}</Text></View><Text className={s.content}>{data.content}</Text></View>));
```

```scss
.card {
  background: #fff;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  .head {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    .title {
      font-size: 16px;
      font-weight: 600;
      color: #333;
    }
    .status {
      font-size: 12px;
      color: #666;
      background: #f0f0f0;
      padding: 4px 8px;
      border-radius: 4px;
    }
  }
  .content {
    font-size: 14px;
    color: #666;
    line-height: 1.4;
  }
}
```

Hook：使用`useCallback`/`useMemo`优化，依赖明确，错误统一处理。  
样式：模块化 CSS；禁止 scss 变量；多端适配；含 hover/active/disabled；性能优化减少重绘。

## 阶段 5：编码规范

结构：按功能组织；单文件 ≤500 行；工程内页面逻辑相关。  
命名：文件 kebab-case；变量 camelCase；类 UpperCamel；常量 UPPER_CASE；Hook 以 use 开头；异步以 Async 结尾。  
状态驱动：仅 dispatch 或 setState；禁 DOM 操作与 forceUpdate。  
控制与异步：使用`===`；Promise 与 async/await 勿混；for-of 配 await；条件>3 抽函数；循环需终止条件。  
异常：就近捕获、禁止空 catch、不可替代逻辑判断。  
日志：分级 error/warning/info；catch 必须打日志。  
注释：同步更新，枚举须注释。  
URL：https、禁止中文、使用 encodeURIComponent。  
风格：eslint+prettier；禁拼写错误。

## 阶段 6：MasterGo 高保真

目标：像素级还原。原则：尺寸颜色圆角完全匹配；使用系统字体、数值字重、无单位行高；禁止 CSS 变量/letter-spacing/GoogleFonts/HTML 标签。  
模板：

```scss
.container {
  width: 343px;
  background: #fff;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}
.title {
  font-size: 18px;
  font-weight: 600;
  line-height: 1.333;
  color: #1f2937;
}
```

检查：尺寸颜色字体行高一致；动画状态完整；禁不合规 CSS。

## 一致性总表

| 阶段 | 输出       | 目标       |
| ---- | ---------- | ---------- |
| 1    | 架构模板   | 分层职责   |
| 2    | 类型系统   | 强类型     |
| 3    | 服务与状态 | 统一数据流 |
| 4    | 组件样式   | 高保真组件 |
| 5    | 编码规范   | 一致质量   |
| 6    | MasterGo   | 像素级一致 |

**重要** 所有生成代码必须符合六阶段规范：一致性、类型安全、可维护、视觉完美。

=== 设计上下文 ===
发起人：system
标注树是否存在根节点：是
组件标注结构：

- [root] Page <Page> (容器)（尺寸：720×1560，子节点：3）
- [1309:35782] Header <Flex> (容器)（尺寸：720×144）
- [1309:35766] Body <Flex> (容器)（尺寸：720×1192，子节点：8）
  - [1309:35776/1:5876] 未命名节点 <Avatar>（尺寸：96×96）
  - [1309:35770] 未命名节点 <Text>（尺寸：560×48）
  - [1309:36113/1:6374] 未命名节点 <Tag>（尺寸：96×34）
  - [1309:36108/1:6481] 未命名节点 <Tag>（尺寸：125×34）
  - [1309:36103/1:6481] 未命名节点 <Tag>（尺寸：124×34）
  - [1399:33581] 未命名节点 <Flex> (容器)（尺寸：672×100，子节点：2）
    - [1399:33589] 未命名节点 <Text>（尺寸：96×34）
    - [1399:33584] 未命名节点 <Text>（尺寸：496×68）
  - [1309:35775] 未命名节点 <Flex> (容器)（尺寸：720×450，子节点：2）
    - [1309:35798] 未命名节点 <Flex> (容器)（尺寸：720×88）
    - [1309:35823] 未命名节点 <Flex> (容器)（尺寸：720×362，子节点：1）
      - [virtual-annotation-1761633375052-lt6rvs] 未命名节点 <Image>（尺寸：504×330）
  - [1309:35774] 未命名节点 <Flex> (容器)（尺寸：720×450，子节点：2）
    - [1309:35835/1:16814] 未命名节点 <Text>（尺寸：720×88）
    - [1309:35811] 未命名节点 <Flex> (容器)（尺寸：720×362，子节点：1）
      - [virtual-annotation-1761633414203-cz0n33] 未命名节点 <Image>（尺寸：504×330）
- [1309:35787] Footer <Flex> (容器)（尺寸：720×100，子节点：2）
  - [1309:35787/1217:7951] 未命名节点 <Button>（尺寸：336×52）
  - [1309:35787/1217:7954] 未命名节点 <Button>（尺寸：336×52）
    若标注中包含 props/layout 信息，可结合常识补足对组件约束的描述。

=== 输出要求 ===
请按照需求文档模板编写 Markdown 文档，确保内容符合需求文档模板的要求。
在需求文档最后添加 TODO 列表，列出最多十条后续要完成的需求项。
