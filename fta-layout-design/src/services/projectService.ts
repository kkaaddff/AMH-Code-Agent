/**
 * 项目相关 API 服务
 * 处理项目、页面和文档的 CRUD 操作
 */

import { api } from '@/utils/apiService';
import type {
  CreatePageForm,
  CreateProjectForm,
  Page,
  Project,
  ProjectListParams,
  ProjectListResponse,
  DocumentReference,
} from '@/types/project';
import { projectMockService } from './mockProjectService';
import { resolveRequest, shouldUseMock } from './baseService';

/**
 * 标准化项目列表响应格式
 */
const normalizeProjectListResponse = (payload: any, params?: ProjectListParams): ProjectListResponse => {
  const fallbackPage = params?.page ?? 1;
  const fallbackSize = params?.size ?? 0;

  if (Array.isArray(payload)) {
    return {
      list: payload,
      total: payload.length,
      page: fallbackPage,
      size: params?.size ?? payload.length,
    };
  }

  if (payload && Array.isArray(payload.list)) {
    return {
      list: payload.list,
      total: typeof payload.total === 'number' ? payload.total : payload.list.length,
      page: typeof payload.page === 'number' ? payload.page : fallbackPage,
      size: typeof payload.size === 'number' ? payload.size : params?.size ?? payload.list.length,
    };
  }

  return {
    list: [],
    total: typeof payload?.total === 'number' ? payload.total : 0,
    page: typeof payload?.page === 'number' ? payload.page : fallbackPage,
    size: typeof payload?.size === 'number' ? payload.size : fallbackSize,
  };
};

/**
 * 项目服务
 */
export const projectService = {
  /**
   * 获取项目列表
   */
  async getProjects(params?: ProjectListParams): Promise<ProjectListResponse> {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.getProjects(params),
      async () => {
        const response = await api.project.list(params);
        return normalizeProjectListResponse(response.data, params);
      }
    );
  },

  /**
   * 创建项目
   */
  async createProject(data: CreateProjectForm) {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.createProject(data),
      async () => {
        const response = await api.project.create(data);
        return response.data;
      }
    );
  },

  /**
   * 更新项目
   */
  async updateProject(id: string, data: Partial<Project>) {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.updateProject(id, data),
      async () => {
        const response = await api.project.update(id, data);
        return response.data;
      }
    );
  },

  /**
   * 删除项目
   */
  async deleteProject(id: string) {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.deleteProject(id),
      async () => {
        const response = await api.project.delete(id);
        return response.data;
      }
    );
  },

  /**
   * 获取项目详情
   */
  async getProjectDetail(id: string) {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.getProjectDetail(id),
      async () => {
        const response = await api.project.detail(id);
        return response.data;
      }
    );
  },

  /**
   * 获取页面详情
   */
  async getPageDetail(pageId: string): Promise<Page> {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.getPageDetail(pageId),
      async () => {
        const response = await api.project.page.detail(pageId);
        return response.data;
      }
    );
  },

  /**
   * 创建页面
   */
  async createPage(projectId: string, data: CreatePageForm) {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.createPage(projectId, data),
      async () => {
        const response = await api.project.page.create({ projectId, ...data });
        return response.data;
      }
    );
  },

  /**
   * 更新页面
   */
  async updatePage(
    projectId: string,
    pageId: string,
    updates: Partial<Page> & { designUrls?: string[]; prdUrls?: string[]; openapiUrls?: string[] }
  ) {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.updatePage(projectId, pageId, updates),
      async () => {
        const response = await api.project.page.update({ projectId, pageId, ...updates });
        return response.data;
      }
    );
  },

  /**
   * 删除页面
   */
  async deletePage(projectId: string, pageId: string) {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.deletePage(projectId, pageId),
      async () => {
        const response = await api.project.page.delete({ projectId, pageId });
        return response.data;
      }
    );
  },

  /**
   * 更新文档状态
   */
  async updateDocumentStatus(
    projectId: string,
    pageId: string,
    type: 'design' | 'prd' | 'openapi',
    documentId: string,
    status: string
  ) {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.updateDocumentStatus(projectId, pageId, type, documentId, status as any),
      async () => {
        const response = await api.project.document.updateStatus({
          projectId,
          pageId,
          type,
          documentId,
          status,
        });
        return response.data;
      }
    );
  },

  /**
   * 同步文档
   */
  async syncDocument(projectId: string, pageId: string, type: 'design' | 'prd' | 'openapi', documentId: string) {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.syncDocument(projectId, pageId, type, documentId),
      async () => {
        const response = await api.project.document.sync({
          projectId,
          pageId,
          type,
          documentId,
        });
        return response.data;
      }
    );
  },

  /**
   * 获取文档内容
   */
  async getDocumentContent(params: { documentId: string }): Promise<DocumentReference> {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.getDocumentContent(params),
      async () => {
        const response = await api.project.document.getContent(params);
        return response.data as DocumentReference;
      }
    );
  },

  /**
   * 更新文档内容
   */
  async updateDocument(payload: Partial<DocumentReference>) {
    return resolveRequest(
      shouldUseMock(),
      () => projectMockService.updateDocument(payload),
      async () => {
        const response = await api.project.document.update(payload);
        return response.data;
      }
    );
  },
};
