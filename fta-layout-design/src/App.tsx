import { loader } from '@monaco-editor/react';
import { App as AntApp, ConfigProvider, Spin, theme } from 'antd';
import 'antd/dist/reset.css';
import zhCN from 'antd/locale/zh_CN';
import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes } from 'react-router-dom';
import './App.css';
import { routes } from './config/routes';
import { renderRoutes } from './utils/routerUtils';
import { callService, isInVscode } from './utils/workstationConnector';

// 配置 CDN 地址
loader.config({
  paths: {
    vs: 'https://unpkg.com/monaco-editor@0.55.1/min/vs',
  },
});

function App() {
  const [initializing, setInitializing] = useState<boolean>(true);

  useEffect(() => {
    const initUserInfo = async () => {
      try {
        if (!isInVscode) {
          // 如果不是 VSCode 环境，从环境变量读取配置

          const devWorkspaceInfo = import.meta.env.VITE_DEV_WORKSPACE_INFO;
          const devUserInfo = import.meta.env.VITE_DEV_USER_INFO;

          window.workspaceInfo = devWorkspaceInfo
            ? JSON.parse(devWorkspaceInfo)
            : {
                gitUrl: 'https://github.com/amh-group/fta-demo.git',
                workdir: '/test/demo',
                srcTree: null,
              };

          window.userInfo = devUserInfo
            ? JSON.parse(devUserInfo)
            : {
                avatarUrl: 'https://img.yzcdn.cn/vant/cat.jpeg',
                departmentId: 1,
                departmentName: '测试部门',
                departmentRole: 1,
                gender: 1,
                id: 1,
                jobNumber: '1234567890',
                name: '测试用户',
                telephone: '1234567890',
                userType: 1,
                cookies: {
                  ymmoa_online: '1234567890',
                  ymmoa_passport: '1234567890',
                  qa_passport: '1234567890',
                  dev_passport: '1234567890',
                },
              };
          return;
        }

        // 获取用户信息
        const { userInfo } = await callService('common', 'getUserInfo');

        window.userInfo = userInfo;

        // 获取工作空间信息
        try {
          const projectPath = await callService('project', 'getProjectRootPath');
          const data = await callService('project', 'getProjectGitInfo');
          const tree: TreeNode = await callService('common', 'getTreeData', { dir: projectPath + '/src', depth: 4 });

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
