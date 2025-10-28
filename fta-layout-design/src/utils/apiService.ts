/**
 * API 服务工具类
 * 统一管理所有服务端调用，包括请求拦截、响应处理、错误处理等
 */

import { buildApiUrl, currentApiConfig, API_ENDPOINTS } from '@/config/api';
import type { DocumentReference } from '@/types/project';

// 请求配置接口
export interface RequestConfig {
  timeout?: number;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  data?: any;
}

// API 响应接口
export interface ApiResponse<T = any> {
  code?: number;
  message?: string;
  data: T;
  success?: boolean;
  timestamp?: number;
}

const isSuccessfulResponse = (result: ApiResponse) => {
  if (typeof result.code === 'number') {
    return result.code === 0 || result.code === 200;
  }
  if (typeof result.success === 'boolean') {
    return result.success !== false;
  }
  return true;
};

// 错误处理类
export class ApiError extends Error {
  constructor(message: string, public code: number, public response?: Response) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * 基础 HTTP 请求函数
 */
async function request<T = any>(
  endpoint: string,
  options: RequestConfig & { method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' } = { method: 'GET' }
): Promise<ApiResponse<T>> {
  const url = buildApiUrl(endpoint);
  const { timeout = currentApiConfig.timeout, headers = {}, params, data, method } = options;

  // 构建请求头
  const requestHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
    ...headers,
  };

  // 构建查询参数
  let finalUrl = url;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        searchParams.append(key, String(value));
      }
    });
    finalUrl = `${url}?${searchParams.toString()}`;
  }

  // 创建 AbortController 用于超时控制
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(finalUrl, {
      method,
      headers: requestHeaders,
      body: data ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // 检查响应状态
    if (!response.ok) {
      throw new ApiError(`HTTP Error: ${response.status} ${response.statusText}`, response.status, response);
    }

    // 解析响应数据
    const result: ApiResponse<T> = await response.json();

    // 检查业务状态码（兼容 code / success 双格式）
    if (!isSuccessfulResponse(result)) {
      const errorCode =
        typeof result.code === 'number' ? result.code : result.success === false ? 400 : response.status;
      throw new ApiError(result.message || '请求失败', errorCode);
    }

    return result;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof ApiError) {
      throw error;
    }

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new ApiError('请求超时', 408);
      }
      throw new ApiError(error.message, 500);
    }

    throw new ApiError('未知错误', 500);
  }
}

/**
 * API 服务类
 */
export class ApiService {
  /**
   * GET 请求
   */
  static async get<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { ...config, method: 'GET' });
  }

  /**
   * POST 请求
   */
  static async post<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { ...config, method: 'POST', data });
  }

  /**
   * PUT 请求
   */
  static async put<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { ...config, method: 'PUT', data });
  }

  /**
   * DELETE 请求
   */
  static async delete<T = any>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  /**
   * PATCH 请求
   */
  static async patch<T = any>(endpoint: string, data?: any, config?: RequestConfig): Promise<ApiResponse<T>> {
    return request<T>(endpoint, { ...config, method: 'PATCH', data });
  }

  /**
   * 文件上传
   */
  static async upload<T = any>(
    endpoint: string,
    file: File,
    additionalData?: Record<string, any>,
    config?: Omit<RequestConfig, 'headers'>
  ): Promise<ApiResponse<T>> {
    const url = buildApiUrl(endpoint);
    const { timeout = currentApiConfig.timeout, params } = config || {};

    // 构建表单数据
    const formData = new FormData();
    formData.append('file', file);

    if (additionalData) {
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });
    }

    // 构建查询参数
    let finalUrl = url;
    if (params && Object.keys(params).length > 0) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      finalUrl = `${url}?${searchParams.toString()}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(finalUrl, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new ApiError(`Upload Error: ${response.status} ${response.statusText}`, response.status, response);
      }

      const result: ApiResponse<T> = await response.json();

      if (!isSuccessfulResponse(result)) {
        const errorCode = typeof result.code === 'number' ? result.code : response.status;
        throw new ApiError(result.message || '上传失败', errorCode);
      }

      return result;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError('上传超时', 408);
        }
        throw new ApiError(error.message, 500);
      }

      throw new ApiError('上传失败', 500);
    }
  }
}

/**
 * 具体的 API 服务方法
 */
export const api = {
  // 项目相关
  project: {
    list: (params?: { page?: number; size?: number }) => ApiService.get(API_ENDPOINTS.project.list, { params }),
    create: (data: Record<string, any>) => ApiService.post(API_ENDPOINTS.project.create, data),
    update: (id: string, data: Record<string, any>) => ApiService.post(`${API_ENDPOINTS.project.update}/${id}`, data),
    delete: (id: string) => ApiService.get(`${API_ENDPOINTS.project.delete}/${id}`),
    detail: (id: string) => ApiService.get(`${API_ENDPOINTS.project.detail}/${id}`),
    page: {
      create: (payload: { projectId: string } & Record<string, any>) =>
        ApiService.post(API_ENDPOINTS.project.page.create, payload),
      update: (payload: { projectId: string; pageId: string } & Record<string, any>) =>
        ApiService.post(API_ENDPOINTS.project.page.update, payload),
      delete: (params: { projectId: string; pageId: string }) =>
        ApiService.post(API_ENDPOINTS.project.page.delete, params),
    },
    document: {
      updateStatus: (payload: {
        projectId: string;
        pageId: string;
        documentId: string;
        type: 'design' | 'prd' | 'openapi';
        status: string;
      }) => ApiService.post(API_ENDPOINTS.project.document.updateStatus, payload),
      sync: (payload: { projectId: string; pageId: string; documentId: string; type: 'design' | 'prd' | 'openapi' }) =>
        ApiService.post(API_ENDPOINTS.project.document.sync, payload),
      getContent: (params: { documentId: string }) =>
        ApiService.get<DocumentReference>(API_ENDPOINTS.project.document.getContent, { params }),
      update: (payload: Partial<DocumentReference>) => ApiService.post(API_ENDPOINTS.project.document.update, payload),
    },
  },

  // DSL 相关
  dsl: {
    upload: (file: File, additionalData?: { projectId?: string }) =>
      ApiService.upload(API_ENDPOINTS.dsl.upload, file, additionalData || {}),
    parse: (data: { dslContent: string; projectId?: string }) => ApiService.post(API_ENDPOINTS.dsl.parse, data),
    export: (params: { projectId: string; format?: string }) => ApiService.get(API_ENDPOINTS.dsl.export, { params }),
  },

  // 组件识别相关
  component: {
    detect: (data: { dslData: any; options?: any }) => ApiService.post(API_ENDPOINTS.component.detect, data),
    recognize: (data: { imageData: string; components: any[] }) =>
      ApiService.post(API_ENDPOINTS.component.recognize, data),
    save: (data: { projectId: string; components: any[] }) => ApiService.post(API_ENDPOINTS.component.save, data),
    list: (projectId: string) => ApiService.get(API_ENDPOINTS.component.list, { params: { projectId } }),
  },

  // 需求文档相关
  requirement: {
    generate: (data: { projectId: string; requirements: any[] }) =>
      ApiService.post(API_ENDPOINTS.requirement.generate, data),
    save: (data: { projectId: string; document: any }) => ApiService.post(API_ENDPOINTS.requirement.save, data),
    export: (params: { projectId: string; format?: string }) =>
      ApiService.get(API_ENDPOINTS.requirement.export, { params }),
  },

  // 布局相关
  layout: {
    save: (data: { projectId: string; layoutData: any }) => ApiService.post(API_ENDPOINTS.layout.save, data),
    load: (projectId: string) => ApiService.get(API_ENDPOINTS.layout.load, { params: { projectId } }),
    preview: (params: { projectId: string; version?: string }) =>
      ApiService.get(API_ENDPOINTS.layout.preview, { params }),
  },
};

// 导出默认实例
export default api;
