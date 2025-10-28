/**
 * API 服务包装器
 * 为各个业务模块提供专门的 API 服务方法
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

const ENABLE_PROJECT_MOCK = import.meta.env.VITE_ENABLE_MOCK === 'true';

const resolveRequest = async <T>(mockHandler: () => Promise<T>, apiHandler: () => Promise<T>) => {
  if (ENABLE_PROJECT_MOCK) {
    return mockHandler();
  }
  return apiHandler();
};

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
 * 项目相关 API 服务
 */
export const projectService = {
  /**
   * 获取项目列表
   */
  async getProjects(params?: ProjectListParams): Promise<ProjectListResponse> {
    return resolveRequest(
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
      () => projectMockService.getProjectDetail(id),
      async () => {
        const response = await api.project.detail(id);
        return response.data;
      }
    );
  },

  /**
   * 创建页面
   */
  async createPage(projectId: string, data: CreatePageForm) {
    return resolveRequest(
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
      () => projectMockService.updateDocument(payload),
      async () => {
        const response = await api.project.document.update(payload);
        return response.data;
      }
    );
  },
};

/**
 * DSL 相关 API 服务
 */
export const dslService = {
  /**
   * 上传 DSL 文件
   */
  async uploadDSL(file: File, projectId?: string) {
    const response = await api.dsl.upload(file, projectId ? { projectId } : undefined);
    return response.data;
  },

  /**
   * 解析 DSL 内容
   */
  async parseDSL(data: { dslContent: string; projectId?: string }) {
    const response = await api.dsl.parse(data);
    return response.data;
  },

  /**
   * 导出 DSL
   */
  async exportDSL(params: { projectId: string; format?: string }) {
    const response = await api.dsl.export(params);
    return response.data;
  },
};

/**
 * 组件识别相关 API 服务
 */
export const componentService = {
  /**
   * 检测组件
   */
  async detectComponents(data: { dslData: any; options?: any }) {
    const response = await api.component.detect(data);
    return response.data;
  },

  /**
   * AI 识别组件
   */
  async recognizeComponents(data: { imageData: string; components: any[] }) {
    const response = await api.component.recognize(data);
    return response.data;
  },

  /**
   * 保存组件识别结果
   */
  async saveComponents(data: { projectId: string; components: any[] }) {
    const response = await api.component.save(data);
    return response.data;
  },

  /**
   * 获取组件列表
   */
  async getComponents(projectId: string) {
    const response = await api.component.list(projectId);
    return response.data;
  },
};

/**
 * 需求文档相关 API 服务
 */
export const requirementService = {
  /**
   * 生成需求文档
   */
  async generateRequirement(data: { projectId: string; requirements: any[] }) {
    const response = await api.requirement.generate(data);
    return response.data;
  },

  /**
   * 保存需求文档
   */
  async saveRequirement(data: { projectId: string; document: any }) {
    const response = await api.requirement.save(data);
    return response.data;
  },

  /**
   * 导出需求文档
   */
  async exportRequirement(params: { projectId: string; format?: string }) {
    const response = await api.requirement.export(params);
    return response.data;
  },
};

/**
 * 布局相关 API 服务
 */
export const layoutService = {
  /**
   * 保存布局数据
   */
  async saveLayout(data: { projectId: string; layoutData: any }) {
    const response = await api.layout.save(data);
    return response.data;
  },

  /**
   * 加载布局数据
   */
  async loadLayout(projectId: string) {
    const response = await api.layout.load(projectId);
    return response.data;
  },

  /**
   * 预览布局
   */
  async previewLayout(params: { projectId: string; version?: string }) {
    const response = await api.layout.preview(params);
    return response.data;
  },
};

// 导出统一的服务对象
export const apiServices = {
  project: projectService,
  dsl: dslService,
  component: componentService,
  requirement: requirementService,
  layout: layoutService,
};
