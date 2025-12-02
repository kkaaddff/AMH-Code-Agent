import type { Page, DocumentReference } from '@/types/project';
import type { DataModel, DataModelGroup } from '@/types/dataModel';
import type { RestApi, RestApiGroup } from '@/types/restApi';
import { proxy } from 'valtio';
import { TDocumentKeys } from '../constants';
import { designDetectionActions } from './DesignDetectionContext';
import { createRootAnnotationFromDesignDoc } from '../components/LayerTreePanel/utils';
import { dataModelService, dataModelGroupService } from '@/services/dataModelService';
import { restApiService, restApiGroupService } from '@/services/restApiService';
import { projectService } from '@/services/projectService';

/** 数据视图类型：接口或数据模型 */
export type DataViewType = 'restApi' | 'dataModel';

export interface SelectedDocument {
  type: keyof typeof TDocumentKeys;
  id: string | undefined;
}

interface EditorPageState {
  pageId: string;
  projectId: string;
  currentPage: Page | null;
  selectedDocument: SelectedDocument | null;
  // 数据管理（项目级别）
  dataViewType: DataViewType;
  dataModels: DataModel[];
  dataModelGroups: DataModelGroup[];
  restApis: RestApi[];
  restApiGroups: RestApiGroup[];
  loadingDataView: boolean;
  selectedDataModelId: string | null;
  selectedRestApiId: string | null;
  selectedGroupId: string | null;
  selectedRestApiGroupId: string | null;
  // 页面加载状态
  pageLoading: boolean;
  pageError: string | null;
}

export const editorPageStore = proxy<EditorPageState>({
  pageId: '',
  projectId: '',
  currentPage: null,
  selectedDocument: null,
  // 数据管理
  dataViewType: 'dataModel',
  dataModels: [],
  dataModelGroups: [],
  restApis: [],
  restApiGroups: [],
  loadingDataView: false,
  selectedDataModelId: null,
  selectedRestApiId: null,
  selectedGroupId: null,
  selectedRestApiGroupId: null,
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

  // ========== 数据管理 Actions ==========

  /**
   * 设置数据视图类型
   */
  setDataViewType: (type: DataViewType) => {
    editorPageStore.dataViewType = type;
    // 切换视图时清空选中状态
    editorPageStore.selectedDataModelId = null;
    editorPageStore.selectedRestApiId = null;
  },

  /**
   * 设置选中的分组
   */
  setSelectedGroupId: (id: string | null) => {
    editorPageStore.selectedGroupId = id;
  },

  /**
   * 设置选中的数据模型
   */
  setSelectedDataModelId: (id: string | null) => {
    editorPageStore.selectedDataModelId = id;
  },

  /**
   * 设置选中的 REST API
   */
  setSelectedRestApiId: (id: string | null) => {
    editorPageStore.selectedRestApiId = id;
  },

  /**
   * 加载项目的数据模型和分组
   */
  loadDataModels: async () => {
    const { projectId } = editorPageStore;
    if (!projectId) {
      editorPageStore.dataModels = [];
      editorPageStore.dataModelGroups = [];
      return;
    }

    editorPageStore.loadingDataView = true;
    try {
      const [models, groups] = await Promise.all([
        dataModelService.getByProjectId(projectId),
        dataModelGroupService.getByProjectId(projectId),
      ]);
      editorPageStore.dataModels = models;
      editorPageStore.dataModelGroups = groups;
    } catch (error) {
      console.error('加载数据模型失败:', error);
      editorPageStore.dataModels = [];
      editorPageStore.dataModelGroups = [];
    } finally {
      editorPageStore.loadingDataView = false;
    }
  },

  /**
   * 加载项目的 REST API 和 REST API 组
   */
  loadRestApis: async () => {
    const { projectId } = editorPageStore;
    if (!projectId) {
      editorPageStore.restApis = [];
      editorPageStore.restApiGroups = [];
      return;
    }

    editorPageStore.loadingDataView = true;
    try {
      const [apis, groups] = await Promise.all([
        restApiService.getByProjectId(projectId),
        restApiGroupService.getByProjectId(projectId),
      ]);
      editorPageStore.restApis = apis;
      editorPageStore.restApiGroups = groups;
    } catch (error) {
      console.error('加载 REST API 失败:', error);
      editorPageStore.restApis = [];
      editorPageStore.restApiGroups = [];
    } finally {
      editorPageStore.loadingDataView = false;
    }
  },

  /**
   * 加载所有数据视图数据
   */
  loadAllDataView: async () => {
    const { projectId } = editorPageStore;
    if (!projectId) {
      return;
    }

    editorPageStore.loadingDataView = true;
    try {
      const [models, dataGroups, apis, apiGroups] = await Promise.all([
        dataModelService.getByProjectId(projectId),
        dataModelGroupService.getByProjectId(projectId),
        restApiService.getByProjectId(projectId),
        restApiGroupService.getByProjectId(projectId),
      ]);
      editorPageStore.dataModels = models;
      editorPageStore.dataModelGroups = dataGroups;
      editorPageStore.restApis = apis;
      editorPageStore.restApiGroups = apiGroups;
    } catch (error) {
      console.error('加载数据视图失败:', error);
    } finally {
      editorPageStore.loadingDataView = false;
    }
  },

  /**
   * 设置选中的 REST API 组
   */
  setSelectedRestApiGroupId: (id: string | null) => {
    editorPageStore.selectedRestApiGroupId = id;
  },

  // 数据模型 CRUD
  addDataModel: (model: DataModel) => {
    editorPageStore.dataModels = [model, ...editorPageStore.dataModels];
  },

  updateDataModel: (id: string, model: DataModel) => {
    const index = editorPageStore.dataModels.findIndex((m) => m.id === id);
    if (index !== -1) {
      editorPageStore.dataModels[index] = model;
    }
  },

  removeDataModel: (id: string) => {
    editorPageStore.dataModels = editorPageStore.dataModels.filter((m) => m.id !== id);
    if (editorPageStore.selectedDataModelId === id) {
      editorPageStore.selectedDataModelId = null;
    }
  },

  // 数据模型组 CRUD
  addDataModelGroup: (group: DataModelGroup) => {
    editorPageStore.dataModelGroups = [group, ...editorPageStore.dataModelGroups];
  },

  updateDataModelGroup: (id: string, group: DataModelGroup) => {
    const index = editorPageStore.dataModelGroups.findIndex((g) => g.id === id);
    if (index !== -1) {
      editorPageStore.dataModelGroups[index] = group;
    }
  },

  removeDataModelGroup: (id: string) => {
    editorPageStore.dataModelGroups = editorPageStore.dataModelGroups.filter((g) => g.id !== id);
    if (editorPageStore.selectedGroupId === id) {
      editorPageStore.selectedGroupId = null;
    }
  },

  // REST API 组 CRUD
  addRestApiGroup: (group: RestApiGroup) => {
    editorPageStore.restApiGroups = [group, ...editorPageStore.restApiGroups];
  },

  updateRestApiGroup: (id: string, group: RestApiGroup) => {
    const index = editorPageStore.restApiGroups.findIndex((g) => g.id === id);
    if (index !== -1) {
      editorPageStore.restApiGroups[index] = group;
    }
  },

  removeRestApiGroup: (id: string) => {
    editorPageStore.restApiGroups = editorPageStore.restApiGroups.filter((g) => g.id !== id);
    // 同时移除该组下的所有接口
    editorPageStore.restApis = editorPageStore.restApis.filter((a) => a.groupId !== id);
    if (editorPageStore.selectedRestApiGroupId === id) {
      editorPageStore.selectedRestApiGroupId = null;
    }
  },

  // REST API CRUD
  addRestApi: (api: RestApi) => {
    editorPageStore.restApis = [api, ...editorPageStore.restApis];
  },

  addRestApis: (apis: RestApi[]) => {
    editorPageStore.restApis = [...apis, ...editorPageStore.restApis];
  },

  updateRestApi: (id: string, api: RestApi) => {
    const index = editorPageStore.restApis.findIndex((a) => a.id === id);
    if (index !== -1) {
      editorPageStore.restApis[index] = api;
    }
  },

  removeRestApi: (id: string) => {
    editorPageStore.restApis = editorPageStore.restApis.filter((a) => a.id !== id);
    if (editorPageStore.selectedRestApiId === id) {
      editorPageStore.selectedRestApiId = null;
    }
  },

  /**
   * 根据 ID 获取数据模型
   */
  getDataModelById: (id: string): DataModel | undefined => {
    return editorPageStore.dataModels.find((m) => m.id === id);
  },

  /**
   * 根据 ID 获取数据模型组
   */
  getDataModelGroupById: (id: string): DataModelGroup | undefined => {
    return editorPageStore.dataModelGroups.find((g) => g.id === id);
  },

  /**
   * 根据 ID 获取 REST API
   */
  getRestApiById: (id: string): RestApi | undefined => {
    return editorPageStore.restApis.find((a) => a.id === id);
  },

  /**
   * 获取指定分组的数据模型
   */
  getDataModelsByGroupId: (groupId: string | null): DataModel[] => {
    if (groupId === null) {
      // 返回未分组的数据模型
      return editorPageStore.dataModels.filter((m) => !m.groupId);
    }
    return editorPageStore.dataModels.filter((m) => m.groupId === groupId);
  },

  /**
   * 根据 ID 获取 REST API 组
   */
  getRestApiGroupById: (id: string): RestApiGroup | undefined => {
    return editorPageStore.restApiGroups.find((g) => g.id === id);
  },

  /**
   * 获取指定组的 REST API
   */
  getRestApisByGroupId: (groupId: string | null): RestApi[] => {
    if (groupId === null) {
      // 返回全部
      return editorPageStore.restApis;
    }
    if (groupId === '__ungrouped__') {
      // 返回未分组的接口
      return editorPageStore.restApis.filter((a) => !a.groupId);
    }
    return editorPageStore.restApis.filter((a) => a.groupId === groupId);
  },
};
