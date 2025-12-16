import { ReactNode } from 'react';

/**
 * 路由配置项类型
 */
export interface RouteConfig {
  /** 路由路径 */
  path: string;
  /** 路由对应的组件 */
  element: ReactNode;
  /** 是否需要包裹 Layout */
  withLayout?: boolean;
  /** 子路由 */
  children?: RouteConfig[];
}

