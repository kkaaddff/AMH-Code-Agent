import { BrowserRouter as Router, Routes } from 'react-router-dom';
import { ConfigProvider, App as AntApp, theme } from 'antd';
import './App.css';
import 'antd/dist/reset.css';

import { ProjectProvider } from './contexts/ProjectContext';
import { routes } from './config/routes';
import { renderRoutes } from './utils/routerUtils';

function App() {
  return (
    <ConfigProvider theme={theme.defaultConfig}>
      <AntApp>
        <ProjectProvider>
          <Router>
            <Routes>{renderRoutes(routes)}</Routes>
          </Router>
        </ProjectProvider>
      </AntApp>
    </ConfigProvider>
  );
}

export default App;
