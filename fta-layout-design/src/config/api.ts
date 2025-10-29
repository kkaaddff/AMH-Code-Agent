/**
 * API 配置文件
 * 根据环境变量自动切换本地开发与生产环境API地址
 */

// 环境类型定义
export type Environment = 'development' | 'production';

// 获取当前环境
export const getEnvironment = (): Environment => {
  return (import.meta.env.MODE as Environment) || 'development';
};

// API 基础配置
export const API_CONFIG = {
  development: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7001',
    timeout: Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 30000,
  },
  production: {
    baseURL: import.meta.env.VITE_API_BASE_URL || 'https://qa-fta-snapshot.amh-group.com',
    timeout: Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 30000,
  },
};

// 获取当前环境的API配置
export const getApiConfig = () => {
  const env = getEnvironment();
  return API_CONFIG[env];
};

// API 端点定义
export const API_ENDPOINTS = {
  // 项目相关
  project: {
    list: '/code-agent/project/list',
    create: '/code-agent/project/create',
    update: '/code-agent/project/update',
    delete: '/code-agent/project/delete',
    detail: '/code-agent/project/detail',
    page: {
      create: '/code-agent/project/page/create',
      update: '/code-agent/project/page/update',
      delete: '/code-agent/project/page/delete',
    },
    document: {
      updateStatus: '/code-agent/project/document/status',
      sync: '/code-agent/project/document/sync',
      getContent: '/code-agent/project/document/content',
      update: '/code-agent/project/document/update',
    },
  },
  // DSL 相关
  dsl: {
    upload: '/code-agent/dsl/upload',
    parse: '/code-agent/dsl/parse',
    export: '/code-agent/dsl/export',
  },
  // 组件识别相关
  component: {
    detect: '/code-agent/component/detect',
    recognize: '/code-agent/component/recognize',
    save: '/code-agent/component/save',
    list: '/code-agent/component/list',
  },
  // 需求文档相关
  requirement: {
    list: '/code-agent/requirement/list',
    generate: '/code-agent/requirement/generate',
    detail: '/code-agent/requirement/detail',
    update: '/code-agent/requirement/update',
    export: '/code-agent/requirement/export',
  },
  // 布局相关
  layout: {
    save: '/code-agent/layout/save',
    load: '/code-agent/layout/load',
    preview: '/code-agent/layout/preview',
  },
} as const;

// 完整的API URL构建函数
export const buildApiUrl = (endpoint: string): string => {
  const config = getApiConfig();
  const baseURL = config.baseURL.endsWith('/') ? config.baseURL.slice(0, -1) : config.baseURL;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${baseURL}${cleanEndpoint}`;
};

// 导出当前环境配置
export const currentApiConfig = getApiConfig();
