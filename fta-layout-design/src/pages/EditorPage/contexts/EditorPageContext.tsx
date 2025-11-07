import { Page } from '@/types/project';
import { proxy } from 'valtio';
import { TDocumentKeys } from '../constants';
import { designDetectionActions } from './DesignDetectionContext';
import { createRootAnnotationFromDesignDoc } from '../components/LayerTreePanel/utils';

export interface SelectedDocument {
  type: keyof typeof TDocumentKeys;
  id: string;
}

interface EditorPageState {
  pageId: string;
  projectId: string;
  currentPage: Page | null;
  selectedDocument: SelectedDocument | null;
}

export const editorPageStore = proxy<EditorPageState>({
  pageId: '',
  projectId: '',
  currentPage: null,
  selectedDocument: null,
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
    editorPageStore.currentPage?.designDocuments.map((doc) => {
      const rootNode = doc.data?.dsl?.nodes?.[0] ?? null;
      if (!rootNode) {
        return;
      }
      designDetectionActions.hydrateDesignDocument(doc.id, {
        rootAnnotation: createRootAnnotationFromDesignDoc(doc),
        dslRootNode: rootNode,
      });
    });
  },
  setSelectedDocument: (
    value: SelectedDocument | null | ((prev: SelectedDocument | null) => SelectedDocument | null)
  ) => {
    editorPageStore.selectedDocument =
      typeof value === 'function' ? value(editorPageStore.selectedDocument || null) : value;
  },
};
