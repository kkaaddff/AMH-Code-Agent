import { Page } from '@/types/project';
import type { InterfaceDataModel } from '@/types/interfaceDataModel';
import { proxy } from 'valtio';
import { TDocumentKeys } from '../constants';
import { designDetectionActions } from './DesignDetectionContext';
import { createRootAnnotationFromDesignDoc } from '../components/LayerTreePanel/utils';
import { interfaceDataModelService } from '@/services/interfaceDataModelService';

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
});

export const editorPageActions = {
  setPageId: (value: string | ((prev: string) => string)) => {
    editorPageStore.pageId = typeof value === 'function' ? value(editorPageStore.pageId) : value;
  },
  setProjectId: (value: string | ((prev: string) => string)) => {
    editorPageStore.projectId = typeof value === 'function' ? value(editorPageStore.projectId) : value;
  },
  setCurrentPage: (value: Page | null | ((prev: Page | null) => Page | null)) => {
    editorPageStore.currentPage = typeof value === 'function' ? value(editorPageStore.currentPage || null) : value;
    editorPageStore.currentPage?.designDocuments.forEach((doc) => {
      if (!doc.data) {
        return;
      }
      designDetectionActions.hydrateDesignDocument(doc.id, {
        rootAnnotation: createRootAnnotationFromDesignDoc(doc),
        dslData: doc.data,
      });
    });
  },
  setSelectedDocument: (
    value: SelectedDocument | null | ((prev: SelectedDocument | null) => SelectedDocument | null)
  ) => {
    editorPageStore.selectedDocument =
      typeof value === 'function' ? value(editorPageStore.selectedDocument || null) : value;
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
