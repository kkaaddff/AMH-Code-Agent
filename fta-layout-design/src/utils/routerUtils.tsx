import { Route } from 'react-router-dom';
import type { RouteConfig } from '@/types/router';
import { wrapWithLayout } from '@/config/routes';

/**
 * 将路由配置转换为 React Router 的 Route 组件
 * @param routes 路由配置数组
 * @returns Route 组件数组
 */
export const renderRoutes = (routes: RouteConfig[]) => {
  return routes.map((route, index) => {
    const { path, element, withLayout, children } = route;

    // 处理需要 Layout 包裹的路由
    const wrappedElement = withLayout && element ? wrapWithLayout(element) : element;

    // 如果有子路由
    if (children && children.length > 0) {
      return (
        <Route key={path || index} path={path}>
          {/* 如果父路由有 element，作为 index 路由（默认路由） */}
          {wrappedElement && <Route index element={wrappedElement} />}
          {/* 渲染所有子路由 */}
          {children.map((child, childIndex) => (
            <Route
              key={child.path || childIndex}
              path={child.path}
              element={child.withLayout && child.element ? wrapWithLayout(child.element) : child.element}
            />
          ))}
        </Route>
      );
    }

    // 普通路由
    return <Route key={path || index} path={path} element={wrappedElement} />;
  });
};

