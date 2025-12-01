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
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: Number(import.meta.env.VITE_REQUEST_TIMEOUT) || 30000,
  },
  production: {
    baseURL: import.meta.env.VITE_API_BASE_URL,
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
    internal: {
      resolve: '/code-agent/project/internal/resolve',
      bind: '/code-agent/project/internal/bind',
    },
    page: {
      create: '/code-agent/project/page/create',
      update: '/code-agent/project/page/update',
      delete: '/code-agent/project/page/delete',
      detail: '/code-agent/project/page/detail',
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
    process: '/code-agent/dsl/process',
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
  // 模型指标
  metrics: {
    latest: '/code-agent/metrics',
  },
  // 数据模型组相关
  dataModelGroup: {
    create: '/code-agent/data-model-group',
    update: (id: string) => `/code-agent/data-model-group/${id}`,
    delete: (id: string) => `/code-agent/data-model-group/${id}`,
    list: (projectId: string) => `/code-agent/data-model-group/project/${projectId}`,
    detail: (id: string) => `/code-agent/data-model-group/${id}`,
  },
  // 数据模型相关（新版，项目级别）
  dataModel: {
    create: '/code-agent/data-model',
    update: (id: string) => `/code-agent/data-model/${id}`,
    delete: (id: string) => `/code-agent/data-model/${id}`,
    list: (projectId: string) => `/code-agent/data-model/project/${projectId}`,
    listByGroup: (groupId: string) => `/code-agent/data-model/group/${groupId}`,
    listUngrouped: (projectId: string) => `/code-agent/data-model/project/${projectId}/ungrouped`,
    detail: (id: string) => `/code-agent/data-model/${id}`,
  },
  // REST API 接口组相关
  restApiGroup: {
    create: '/code-agent/rest-api-group',
    update: (id: string) => `/code-agent/rest-api-group/${id}`,
    delete: (id: string) => `/code-agent/rest-api-group/${id}`,
    list: (projectId: string) => `/code-agent/rest-api-group/project/${projectId}`,
    detail: (id: string) => `/code-agent/rest-api-group/${id}`,
    sync: (id: string) => `/code-agent/rest-api-group/${id}/sync`,
  },
  // REST API 接口相关
  restApi: {
    create: '/code-agent/rest-api',
    update: (id: string) => `/code-agent/rest-api/${id}`,
    delete: (id: string) => `/code-agent/rest-api/${id}`,
    list: (projectId: string) => `/code-agent/rest-api/project/${projectId}`,
    listByGroup: (groupId: string) => `/code-agent/rest-api/group/${groupId}`,
    listUngrouped: (projectId: string) => `/code-agent/rest-api/project/${projectId}/ungrouped`,
    detail: (id: string) => `/code-agent/rest-api/${id}`,
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
