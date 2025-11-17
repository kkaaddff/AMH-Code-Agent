import { App as AntApp, ConfigProvider, Spin, theme } from 'antd';
import 'antd/dist/reset.css';
import zhCN from 'antd/locale/zh_CN';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { routes } from './config/routes';
import { renderRoutes } from './utils/routerUtils';
import { callService } from './utils/workstationConnector';

function App() {
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    // 如果是开发环境，直接跳过用户信息初始化
    if (import.meta.env.MODE === 'development') {
      setInitializing(false);
      return;
    }

    const initUserInfo = async () => {
      try {
        if (!callService) {
          return;
        }

        // 获取用户信息
        const { userInfo } = await callService('common', 'getUserInfo');

        window.userInfo = userInfo;

        // 获取工作空间信息
        try {
          const projectPath = await callService('project', 'getProjectRootPath');
          const data = await callService('project', 'getProjectGitInfo');
          const tree: TreeNode[] = await callService('common', 'getTreeData', { dir: projectPath + '/src', depth: 2 });
          window.workspaceInfo = {
            gitUrl: data?.remoteUrl,
            workdir: projectPath,
            srcTree: tree,
          };
        } catch (err) {
          console.warn('Failed to get workspace info', err);
          window.workspaceInfo = {};
        }
      } catch (error) {
        console.error('Failed to initialize user info', error);
      } finally {
        setInitializing(false);
      }
    };

    initUserInfo();
  }, []);

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: [
          theme.compactAlgorithm, // 启用紧凑主题算法
        ],
      }}>
      <AntApp>
        {initializing ? (
          <Spin fullscreen />
        ) : (
          <Router>
            <Routes>{renderRoutes(routes)}</Routes>
          </Router>
        )}
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
