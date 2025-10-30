# AI Code Agent 项目生成规范
> 定义从页面架构、类型系统、服务层、组件样式到高保真还原的完整生成标准，确保一致性、可维护性与高保真。

## 阶段1：页面创建
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
|2|视图层：UI与交互|
|3|通用逻辑层：API/工具|
规范：禁止跨层调用；业务层无UI；通用层纯函数。  
模板：
```tsx
const Page:React.FC=()=>{const s=usePageStore();if(!s.pageData)return null;return(<View><Header/><Body/><Footer/></View>)};export default withStore(withLayer(Page));
```

## 阶段2：类型系统
目标：TypeScript 强类型约束。原则：无`any`、语义清晰、复用优先、不准使用 enum！  
结构：
```ts
export interface BaseResponse<T>{code:number;message:string;data:T;}
export const Status = {PENDING: 'pending',PROCESSING: 'processing',COMPLETED: 'completed',FAILED: 'failed'} as const;
export interface BizData{id:string;name:string;status:Status;createTime:string;}
```
组织：全局`src/types/`；页面`pages/**/types/`；组件`components/**/types.ts`。

## 阶段3：服务层与状态
目标：统一数据流架构。
```ts
export interface PageState{pageData?:PageData;}
const{usePageStore,withStore}=createStore<PageState,PageAction>(initialState,reducer);
export async function fetchPageData(p:Req):Promise<CommonResponse<Res>>{return request('/api',{data:p,needLoading:false});}
const useFetch=()=>{const{dispatch}=usePageStore();const fetchData=useCallback(async()=>{const r=await fetchPageData();if(r.data)dispatch({type:'UpdatePageData',payload:r.data})},[dispatch]);return{fetchData};};
```
规则：服务层仅请求、不含业务逻辑；错误与loading由request统一；状态更新仅dispatch；结构扁平、类型安全。

## 阶段4：组件与样式
目标：同步结构与样式，确保高保真。
原则：设计稿为唯一标准(px,2x)；禁止全局污染与样式复用；UI元素使用`@tarojs/components`。  
模板：
```tsx
const Card:React.FC<Props>=({data,onClick})=>(!data?null:<View className={s.card} onClick={()=>onClick?.(data)}><View className={s.head}><Text className={s.title}>{data.title}</Text><Text className={s.status}>{data.status}</Text></View><Text className={s.content}>{data.content}</Text></View>));
```
```scss
.card{background:#fff;border-radius:8px;padding:16px;margin-bottom:12px;.head{display:flex;justify-content:space-between;margin-bottom:12px;.title{font-size:16px;font-weight:600;color:#333}.status{font-size:12px;color:#666;background:#f0f0f0;padding:4px 8px;border-radius:4px}}.content{font-size:14px;color:#666;line-height:1.4}}
```
Hook：使用`useCallback`/`useMemo`优化，依赖明确，错误统一处理。  
样式：模块化CSS；禁止scss变量；多端适配；含hover/active/disabled；性能优化减少重绘。

## 阶段5：编码规范 
结构：按功能组织；单文件≤500行；工程内页面逻辑相关。  
命名：文件kebab-case；变量camelCase；类UpperCamel；常量UPPER_CASE；Hook以use开头；异步以Async结尾。  
状态驱动：仅dispatch或setState；禁DOM操作与forceUpdate。  
控制与异步：使用`===`；Promise与async/await勿混；for-of配await；条件>3抽函数；循环需终止条件。  
异常：就近捕获、禁止空catch、不可替代逻辑判断。  
日志：分级error/warning/info；catch必须打日志。  
注释：同步更新，枚举须注释。  
URL：https、禁止中文、使用encodeURIComponent。  
风格：eslint+prettier；禁拼写错误。

## 阶段6：MasterGo 高保真
目标：像素级还原。原则：尺寸颜色圆角完全匹配；使用系统字体、数值字重、无单位行高；禁止CSS变量/letter-spacing/GoogleFonts/HTML标签。  
模板：
```scss
.container{width:343px;background:#fff;border-radius:12px;padding:16px;box-shadow:0 2px 8px rgba(0,0,0,.1)}
.title{font-size:18px;font-weight:600;line-height:1.333;color:#1f2937}
```
检查：尺寸颜色字体行高一致；动画状态完整；禁不合规CSS。

## 一致性总表
|阶段|输出|目标|
|-|-|-|
|1|架构模板|分层职责|
|2|类型系统|强类型|
|3|服务与状态|统一数据流|
|4|组件样式|高保真组件|
|5|编码规范|一致质量|
|6|MasterGo|像素级一致|

**重要** 所有生成代码必须符合六阶段规范：一致性、类型安全、可维护、视觉完美。
