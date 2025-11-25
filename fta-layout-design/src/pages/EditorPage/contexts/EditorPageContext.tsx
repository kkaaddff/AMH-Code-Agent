import type { Page, DocumentReference } from '@/types/project';
import type { InterfaceDataModel } from '@/types/interfaceDataModel';
import { proxy } from 'valtio';
import { TDocumentKeys } from '../constants';
import { designDetectionActions } from './DesignDetectionContext';
import { createRootAnnotationFromDesignDoc } from '../components/LayerTreePanel/utils';
import { interfaceDataModelService } from '@/services/interfaceDataModelService';
import { projectService } from '@/services/projectService';

export interface SelectedDocument {
  type: keyof typeof TDocumentKeys;
  id: string | undefined;
}

interface EditorPageState {
  pageId: string;
  projectId: string;
  currentPage: Page | null;
  selectedDocument: SelectedDocument | null;
  // 接口数据模型相关
  interfaceDataModels: InterfaceDataModel[];
  loadingDataModels: boolean;
  selectedApiId: string | null;
  // 页面加载状态
  pageLoading: boolean;
  pageError: string | null;
}

export const editorPageStore = proxy<EditorPageState>({
  pageId: '',
  projectId: '',
  currentPage: null,
  selectedDocument: null,
  // 接口数据模型
  interfaceDataModels: [],
  loadingDataModels: false,
  selectedApiId: null,
  // 页面加载状态
  pageLoading: false,
  pageError: null,
});

/**
 * 内部方法：处理页面数据并初始化设计文档
 */
const hydratePageData = (page: Page | null) => {
  editorPageStore.currentPage = page;
  page?.designDocuments.forEach((doc) => {
    if (!doc.data) {
      return;
    }
    designDetectionActions.hydrateDesignDocument(doc.id, {
      rootAnnotation: createRootAnnotationFromDesignDoc(doc),
      dslData: doc.data,
    });
  });
};

export const editorPageActions = {
  setPageId: (value: string | ((prev: string) => string)) => {
    editorPageStore.pageId = typeof value === 'function' ? value(editorPageStore.pageId) : value;
  },
  setProjectId: (value: string | ((prev: string) => string)) => {
    editorPageStore.projectId = typeof value === 'function' ? value(editorPageStore.projectId) : value;
  },
  setCurrentPage: (value: Page | null | ((prev: Page | null) => Page | null)) => {
    const newPage = typeof value === 'function' ? value(editorPageStore.currentPage || null) : value;
    hydratePageData(newPage);
  },
  setSelectedDocument: (
    value: SelectedDocument | null | ((prev: SelectedDocument | null) => SelectedDocument | null)
  ) => {
    editorPageStore.selectedDocument =
      typeof value === 'function' ? value(editorPageStore.selectedDocument || null) : value;
  },

  // ========== Page CRUD 操作 ==========

  /**
   * 获取页面详情
   */
  fetchPageDetail: async (pageId: string): Promise<Page> => {
    editorPageStore.pageLoading = true;
    editorPageStore.pageError = null;
    try {
      const pageData = await projectService.getPageDetail(pageId);
      hydratePageData(pageData);
      // 默认选中第一个设计文档
      editorPageStore.selectedDocument = {
        type: 'design',
        id: pageData.designDocuments?.[0]?.id || undefined,
      };
      return pageData;
    } catch (error: any) {
      console.error('获取页面数据失败:', error);
      editorPageStore.pageError = error.message || '获取页面数据失败';
      throw error;
    } finally {
      editorPageStore.pageLoading = false;
    }
  },

  /**
   * 刷新当前页面数据
   */
  refreshCurrentPage: async (): Promise<Page | null> => {
    const { pageId } = editorPageStore;
    if (!pageId) {
      return null;
    }
    try {
      const pageData = await projectService.getPageDetail(pageId);
      hydratePageData(pageData);
      return pageData;
    } catch (error: any) {
      console.error('刷新页面数据失败:', error);
      throw error;
    }
  },

  /**
   * 更新页面
   */
  updatePage: async (
    updates: Partial<Page> & { designUrls?: string[]; prdUrls?: string[]; openapiUrls?: string[] }
  ): Promise<Page | null> => {
    const { currentPage } = editorPageStore;
    if (!currentPage) {
      throw new Error('当前页面数据未加载');
    }
    try {
      await projectService.updatePage(currentPage.projectId, currentPage.id, updates);
      // 更新后刷新页面数据
      return await editorPageActions.refreshCurrentPage();
    } catch (error: any) {
      console.error('更新页面失败:', error);
      throw error;
    }
  },

  /**
   * 删除文档（设计稿/PRD/OpenAPI）
   */
  deleteDocument: async (type: keyof typeof TDocumentKeys, docId: string): Promise<void> => {
    const { currentPage, selectedDocument } = editorPageStore;
    if (!currentPage) {
      throw new Error('页面数据未加载');
    }

    // 获取当前该类型的所有文档 URL（过滤掉要删除的文档）
    const currentDocs = currentPage[TDocumentKeys[type]] as DocumentReference[];
    const updatedUrls = currentDocs.filter((doc) => doc.id !== docId).map((doc) => doc.url);

    // 构建更新数据
    const updateData: { designUrls?: string[]; prdUrls?: string[]; openapiUrls?: string[] } = {};
    if (type === 'design') {
      updateData.designUrls = updatedUrls;
    } else if (type === 'prd') {
      updateData.prdUrls = updatedUrls;
    } else if (type === 'openapi') {
      updateData.openapiUrls = updatedUrls;
    }

    // 调用 API 更新页面
    await projectService.updatePage(currentPage.projectId, currentPage.id, updateData);

    // 如果删除的是当前选中的文档，清空选择
    if (selectedDocument?.type === type && selectedDocument?.id === docId) {
      editorPageStore.selectedDocument = null;
    }

    // 刷新页面数据
    await editorPageActions.refreshCurrentPage();
  },

  /**
   * 更新文档状态
   */
  updateDocumentStatus: async (
    type: 'design' | 'prd' | 'openapi',
    documentId: string,
    status: string
  ): Promise<void> => {
    const { currentPage } = editorPageStore;
    if (!currentPage) {
      throw new Error('页面数据未加载');
    }
    await projectService.updateDocumentStatus(currentPage.projectId, currentPage.id, type, documentId, status);
    // 刷新页面数据
    await editorPageActions.refreshCurrentPage();
  },

  /**
   * 同步文档
   */
  syncDocument: async (type: 'design' | 'prd' | 'openapi', documentId: string): Promise<void> => {
    const { currentPage } = editorPageStore;
    if (!currentPage) {
      throw new Error('页面数据未加载');
    }
    await projectService.syncDocument(currentPage.projectId, currentPage.id, type, documentId);
    // 刷新页面数据
    await editorPageActions.refreshCurrentPage();
  },

  // 接口数据模型相关 actions
  setInterfaceDataModels: (models: InterfaceDataModel[]) => {
    editorPageStore.interfaceDataModels = models;
  },

  setLoadingDataModels: (loading: boolean) => {
    editorPageStore.loadingDataModels = loading;
  },

  setSelectedApiId: (id: string | null) => {
    editorPageStore.selectedApiId = id;
  },

  /**
   * 加载当前页面的接口数据模型
   */
  loadInterfaceDataModels: async () => {
    const { pageId } = editorPageStore;
    if (!pageId) {
      editorPageStore.interfaceDataModels = [];
      return;
    }

    editorPageStore.loadingDataModels = true;
    try {
      const models = await interfaceDataModelService.getByPageId(pageId);
      editorPageStore.interfaceDataModels = models;
    } catch (error) {
      console.error('加载接口数据模型失败:', error);
      editorPageStore.interfaceDataModels = [];
    } finally {
      editorPageStore.loadingDataModels = false;
    }
  },

  /**
   * 添加新的接口数据模型
   */
  addInterfaceDataModel: (model: InterfaceDataModel) => {
    editorPageStore.interfaceDataModels = [model, ...editorPageStore.interfaceDataModels];
  },

  /**
   * 更新接口数据模型
   */
  updateInterfaceDataModel: (id: string, model: InterfaceDataModel) => {
    const index = editorPageStore.interfaceDataModels.findIndex((m) => m.id === id);
    if (index !== -1) {
      editorPageStore.interfaceDataModels[index] = model;
    }
  },

  /**
   * 删除接口数据模型
   */
  removeInterfaceDataModel: (id: string) => {
    editorPageStore.interfaceDataModels = editorPageStore.interfaceDataModels.filter((m) => m.id !== id);
    // 如果删除的是当前选中的，清空选中
    if (editorPageStore.selectedApiId === id) {
      editorPageStore.selectedApiId = null;
    }
  },

  /**
   * 根据 ID 获取数据模型
   */
  getInterfaceDataModelById: (id: string): InterfaceDataModel | undefined => {
    return editorPageStore.interfaceDataModels.find((m) => m.id === id);
  },
};
