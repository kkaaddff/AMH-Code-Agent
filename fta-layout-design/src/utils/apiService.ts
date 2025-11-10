/**
 * API 服务工具类
 * 统一管理所有服务端调用，包括请求拦截、响应处理、错误处理等
 */

import { buildApiUrl, currentApiConfig, API_ENDPOINTS } from '@/config/api';
import type { DocumentReference } from '@/types/project';
import { DSLData } from '@/types/dsl';

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
    /**
     * 获取项目列表数据。
     * @param params 分页与过滤参数
     * @returns 项目列表响应 Promise
     */
    list: (params?: { page?: number; size?: number }) => ApiService.get(API_ENDPOINTS.project.list, { params }),
    /**
     * 创建新项目。
     * @param data 项目创建请求体
     * @returns 创建结果响应 Promise
     */
    create: (data: Record<string, any>) => ApiService.post(API_ENDPOINTS.project.create, data),
    /**
     * 更新指定项目。
     * @param id 项目标识
     * @param data 项目更新请求体
     * @returns 更新结果响应 Promise
     */
    update: (id: string, data: Record<string, any>) => ApiService.post(`${API_ENDPOINTS.project.update}/${id}`, data),
    /**
     * 删除指定项目。
     * @param id 项目标识
     * @returns 删除结果响应 Promise
     */
    delete: (id: string) => ApiService.get(`${API_ENDPOINTS.project.delete}/${id}`),
    /**
     * 获取项目详情。
     * @param id 项目标识
     * @returns 项目详情响应 Promise
     */
    detail: (id: string) => ApiService.get(`${API_ENDPOINTS.project.detail}/${id}`),
    page: {
      /**
       * 创建项目页面。
       * @param payload 页面创建参数，需包含项目 ID
       * @returns 页面创建响应 Promise
       */
      create: (payload: { projectId: string } & Record<string, any>) =>
        ApiService.post(API_ENDPOINTS.project.page.create, payload),
      /**
       * 更新项目页面。
       * @param payload 页面更新参数，需包含项目和页面 ID
       * @returns 页面更新响应 Promise
       */
      update: (payload: { projectId: string; pageId: string } & Record<string, any>) =>
        ApiService.post(API_ENDPOINTS.project.page.update, payload),
      /**
       * 删除项目页面。
       * @param params 页面删除参数，需包含项目和页面 ID
       * @returns 页面删除响应 Promise
       */
      delete: (params: { projectId: string; pageId: string }) =>
        ApiService.post(API_ENDPOINTS.project.page.delete, params),
      /**
       * 查询页面详情。
       * @param pageId 页面标识
       * @returns 页面详情响应 Promise
       */
      detail: (pageId: string) => ApiService.get(API_ENDPOINTS.project.page.detail, { params: { pageId } }),
    },
    document: {
      /**
       * 更新项目文档状态。
       * @param payload 状态更新参数
       * @returns 状态更新响应 Promise
       */
      updateStatus: (payload: {
        projectId: string;
        pageId: string;
        documentId: string;
        type: 'design' | 'prd' | 'openapi';
        status: string;
      }) => ApiService.post(API_ENDPOINTS.project.document.updateStatus, payload),
      /**
       * 同步项目文档。
       * @param payload 同步参数
       * @returns 文档同步响应 Promise
       */
      sync: (payload: { projectId: string; pageId: string; documentId: string; type: 'design' | 'prd' | 'openapi' }) =>
        ApiService.post(API_ENDPOINTS.project.document.sync, payload),
      /**
       * 获取文档内容。
       * @param params 查询参数，需包含文档 ID
       * @returns 文档内容响应 Promise
       */
      getContent: (params: { documentId: string }) =>
        ApiService.get<DocumentReference>(API_ENDPOINTS.project.document.getContent, { params }),
      /**
       * 更新文档信息。
       * @param payload 文档更新请求体
       * @returns 文档更新响应 Promise
       */
      update: (payload: Partial<DocumentReference>) => ApiService.post(API_ENDPOINTS.project.document.update, payload),
    },
  },

  // DSL 相关
  dsl: {
    /**
     * 上传 DSL 文件。
     * @param file 待上传的文件
     * @param additionalData 额外附带参数
     * @returns 上传结果响应 Promise
     */
    upload: (file: File, additionalData?: { projectId?: string }) =>
      ApiService.upload(API_ENDPOINTS.dsl.upload, file, additionalData || {}),
    /**
     * 解析 DSL 数据。
     * @param data 包含 DSL 内容的请求体
     * @returns 解析结果响应 Promise
     */
    parse: (data: { dslContent: string; projectId?: string }) => ApiService.post(API_ENDPOINTS.dsl.parse, data),
    /**
     * 导出 DSL 数据。
     * @param params 导出参数，需包含项目 ID
     * @returns 导出结果响应 Promise
     */
    export: (params: { projectId: string; format?: string }) => ApiService.get(API_ENDPOINTS.dsl.export, { params }),
    /**
     * 处理 DSL 数据（转换 PATH 为 LAYER 等）。
     * @param data 包含 DSL 数据的请求体
     * @returns 处理后的 DSL 数据响应 Promise
     */
    process: (data: { dsl: DSLData; convertPaths?: boolean; keepOriginalPaths?: boolean }) =>
      ApiService.post(API_ENDPOINTS.dsl.process, data),
  },

  // 组件识别相关
  component: {
    /**
     * 触发组件检测。
     * @param data 检测请求体
     * @returns 检测结果响应 Promise
     */
    detect: (data: { dslData: any; options?: any }) => ApiService.post(API_ENDPOINTS.component.detect, data),
    /**
     * 识别组件内容。
     * @param data 识别请求体
     * @returns 识别结果响应 Promise
     */
    recognize: (data: { imageData: string; components: any[] }) =>
      ApiService.post(API_ENDPOINTS.component.recognize, data),
    /**
     * 保存组件信息。
     * @param data 保存请求体
     * @returns 保存结果响应 Promise
     */
    save: (data: { projectId: string; components: any[] }) => ApiService.post(API_ENDPOINTS.component.save, data),
    /**
     * 查询组件列表。
     * @param projectId 项目标识
     * @returns 组件列表响应 Promise
     */
    list: (projectId: string) => ApiService.get(API_ENDPOINTS.component.list, { params: { projectId } }),
  },

  // 需求文档相关
  requirement: {
    /**
     * 获取需求文档列表。
     * @param params 查询参数
     * @returns 列表响应 Promise
     */
    list: (params: { designId: string; page?: number; size?: number }) =>
      ApiService.get(API_ENDPOINTS.requirement.list, { params }),
    /**
     * 生成需求文档。
     * @param payload 生成请求体
     * @returns 生成结果响应 Promise
     */
    generate: (payload: {
      designId: string;
      rootAnnotation?: any;
      templateKey?: string;
      annotationVersion?: number;
      annotationSchemaVersion?: string;
    }) =>
      ApiService.post(API_ENDPOINTS.requirement.generate, {
        designId: payload.designId,
        templateKey: payload.templateKey,
        rootAnnotation: payload.rootAnnotation,
        annotationVersion: payload.annotationVersion,
        annotationSchemaVersion: payload.annotationSchemaVersion,
      }),
    /**
     * 获取需求文档详情。
     * @param docId 文档标识
     * @returns 文档详情响应 Promise
     */
    detail: (docId: string) => ApiService.get(API_ENDPOINTS.requirement.detail, { params: { docId } }),
    /**
     * 更新需求文档信息。
     * @param payload 更新内容
     * @returns 更新结果响应 Promise
     */
    update: (payload: { docId: string; title?: string; content?: string; status?: string }) =>
      ApiService.post(API_ENDPOINTS.requirement.update, payload),
    /**
     * 导出需求文档。
     * @param docId 文档标识
     * @returns 导出结果响应 Promise
     */
    export: (docId: string) => ApiService.post(API_ENDPOINTS.requirement.export, { docId }),
  },

  // 布局相关
  layout: {
    /**
     * 保存布局数据。
     * @param data 布局保存请求体
     * @returns 保存结果响应 Promise
     */
    save: (data: { projectId: string; layoutData: any }) => ApiService.post(API_ENDPOINTS.layout.save, data),
    /**
     * 加载布局数据。
     * @param projectId 项目标识
     * @returns 布局数据响应 Promise
     */
    load: (projectId: string) => ApiService.get(API_ENDPOINTS.layout.load, { params: { projectId } }),
    /**
     * 预览布局版本。
     * @param params 预览参数
     * @returns 预览结果响应 Promise
     */
    preview: (params: { projectId: string; version?: string }) =>
      ApiService.get(API_ENDPOINTS.layout.preview, { params }),
  },
};

// 导出默认实例
export default api;
