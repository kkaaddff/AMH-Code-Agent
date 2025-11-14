import { BrowserRouter as Router, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import './App.css';
import 'antd/dist/reset.css';

import { routes } from './config/routes';
import { renderRoutes } from './utils/routerUtils';

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: [
          theme.compactAlgorithm, // 启用紧凑主题算法
        ],
      }}>
      <AntApp>
        <Router>
          <Routes>{renderRoutes(routes)}</Routes>
        </Router>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
