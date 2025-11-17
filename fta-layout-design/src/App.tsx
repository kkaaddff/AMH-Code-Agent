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
        const { userInfo } = await callService('common', 'getUserInfo');
        (window as any).userInfo = userInfo;
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
