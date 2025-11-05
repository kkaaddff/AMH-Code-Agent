import type { RouteConfig } from '@/types/router';
import { Navigate } from 'react-router-dom';

import Layout from '@/components/Layout';
import EditorPageComponentDetect from '@/pages/EditorPage/EditorPageComponentDetect';
import EditorPageLayout from '@/pages/EditorPage/EditorPageLayout';
import HomePage from '@/pages/HomePage';
import RequirementPage from '@/pages/RequirementPage';
import TechnicalPage from '@/pages/TechnicalPage';

/**
 * 路由配置
 * 所有路由信息集中管理
 */
export const routes: RouteConfig[] = [
  {
    path: '/',
    element: <HomePage />,
    withLayout: true,
  },
  {
    path: '/requirements',
    element: <RequirementPage />,
    withLayout: true,
  },
  {
    path: '/technical',
    element: <TechnicalPage />,
    withLayout: true,
  },
  {
    path: '/editor',
    element: <Navigate to='/editor/component-detect-v2' replace />,
    withLayout: false, // 重定向路由不需要 Layout
    children: [
      {
        path: 'component-detect-v2',
        withLayout: true,
        element: <EditorPageComponentDetect />,
      },
      {
        path: 'layout',
        withLayout: true,
        element: <EditorPageLayout />,
      },
    ],
  },
];

/**
 * 包裹 Layout 组件的高阶函数
 */
export const wrapWithLayout = (element: React.ReactNode): React.ReactNode => {
  return <Layout>{element}</Layout>;
};
