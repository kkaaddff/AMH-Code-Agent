import { proxy } from 'valtio';
import { useSnapshot } from 'valtio/react';
import { apiServices } from '@/services';
import { Project, Page, DesignSpec, CreateProjectForm, CreatePageForm, ProjectListParams } from '../types/project';
import { MessageInstance } from 'antd/es/message/interface';

interface ProjectPagination {
  total: number;
  page: number;
  size: number;
}

interface ProjectState {
  projects: Project[];
  currentProject: Project | null;
  loading: boolean;
  error: string | null;
  pagination: ProjectPagination;
}

const initialState: ProjectState = {
  projects: [],
  currentProject: null,
  loading: false,
  error: null,
  pagination: {
    total: 0,
    page: 1,
    size: 10,
  },
};

const generateId = () => `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const getDocumentTypeName = (type: 'design' | 'prd' | 'openapi') => {
  switch (type) {
    case 'design':
      return '设计稿';
    case 'prd':
      return 'PRD文档';
    case 'openapi':
      return 'OpenAPI文档';
    default:
      return '文档';
  }
};

const projectStore = proxy<ProjectState>({
  ...initialState,
});

const setLoading = (loading: boolean) => {
  projectStore.loading = loading;
};

const setError = (error: string | null) => {
  projectStore.error = error;
};

const replaceProjectInState = (nextProject: Project) => {
  const index = projectStore.projects.findIndex((project) => project.id === nextProject.id);
  if (index >= 0) {
    projectStore.projects[index] = nextProject;
  } else {
    projectStore.projects.push(nextProject);
  }

  if (projectStore.currentProject?.id === nextProject.id) {
    projectStore.currentProject = nextProject;
  }
};

const mutateProjectState = (projectId: string, mutator: (project: Project) => Project) => {
  const index = projectStore.projects.findIndex((project) => project.id === projectId);
  if (index === -1) return;

  const updatedProject = mutator(projectStore.projects[index]);
  projectStore.projects[index] = updatedProject;

  if (projectStore.currentProject?.id === projectId) {
    projectStore.currentProject = updatedProject;
  }
};

const createProject = async (formData: CreateProjectForm) => {
  setLoading(true);
  try {
    const createdProject = await apiServices.project.createProject(formData);
    replaceProjectInState(createdProject);
    setError(null);
  } catch (error) {
    console.error(error);
    setError('创建项目失败');
    throw error;
  } finally {
    setLoading(false);
  }
};

const updateProject = async (id: string, updates: Partial<Project>) => {
  setLoading(true);
  try {
    const updatedProject = await apiServices.project.updateProject(id, updates);
    replaceProjectInState(updatedProject);
    setError(null);
  } catch (error) {
    console.error(error);
    setError('更新项目失败');
    throw error;
  } finally {
    setLoading(false);
  }
};

const deleteProject = async (id: string) => {
  setLoading(true);
  try {
    await apiServices.project.deleteProject(id);
    projectStore.projects = projectStore.projects.filter((project) => project.id !== id);
    if (projectStore.currentProject?.id === id) {
      projectStore.currentProject = null;
    }
    setError(null);
  } catch (error) {
    console.error(error);
    setError('删除项目失败');
    throw error;
  } finally {
    setLoading(false);
  }
};

const setCurrentProject = (project: Project | null) => {
  projectStore.currentProject = project;
};

const createPage = async (projectId: string, formData: CreatePageForm) => {
  setLoading(true);
  try {
    const updatedProject = await apiServices.project.createPage(projectId, formData);
    replaceProjectInState(updatedProject);
    setError(null);
  } catch (error) {
    console.error(error);
    setError('创建页面失败');
    throw error;
  } finally {
    setLoading(false);
  }
};

const updatePage = async (
  projectId: string,
  pageId: string,
  updates: Partial<Page> & { designUrls?: string[]; prdUrls?: string[]; openapiUrls?: string[] }
) => {
  setLoading(true);
  try {
    const updatedProject = await apiServices.project.updatePage(projectId, pageId, updates);
    replaceProjectInState(updatedProject);
    setError(null);
  } catch (error) {
    console.error(error);
    setError('更新页面失败');
    throw error;
  } finally {
    setLoading(false);
  }
};

const deletePage = async (projectId: string, pageId: string) => {
  setLoading(true);
  try {
    const updatedProject = await apiServices.project.deletePage(projectId, pageId);
    replaceProjectInState(updatedProject);
    setError(null);
  } catch (error) {
    console.error(error);
    setError('删除页面失败');
    throw error;
  } finally {
    setLoading(false);
  }
};

const uploadDesignSpecs = async (projectId: string, pageId: string, files: File[]) => {
  setLoading(true);
  try {
    mutateProjectState(projectId, (project) => {
      const targetPage = project.pages.find((page) => page.id === pageId);
      if (!targetPage) return project;

      const now = new Date().toISOString();
      const newSpecs = files.map((file) => ({
        id: generateId(),
        pageId,
        name: file.name.split('.')[0],
        originalName: file.name,
        size: file.size,
        type: file.type,
        url: URL.createObjectURL(file),
        status: 'pending' as const,
        progress: 0,
        createdAt: now,
        updatedAt: now,
        layoutEdited: false,
        processingHistory: [
          {
            id: generateId(),
            status: 'pending' as const,
            message: '文件上传完成，等待处理',
            timestamp: now,
          },
        ],
      }));

      const updatedPage: Page = {
        ...targetPage,
        designSpecs: [...targetPage.designSpecs, ...newSpecs],
        updatedAt: now,
      };

      const pages = project.pages.map((page) => (page.id === pageId ? updatedPage : page));
      return { ...project, pages, updatedAt: now };
    });
    setError(null);
  } catch (error) {
    console.error(error);
    setError('上传设计稿失败');
  } finally {
    setLoading(false);
  }
};

const updateDesignSpecStatus = (
  projectId: string,
  pageId: string,
  designSpecId: string,
  status: DesignSpec['status'],
  progress?: number
) => {
  mutateProjectState(projectId, (project) => {
    const page = project.pages.find((p) => p.id === pageId);
    if (!page) return project;

    const updatedDesignSpecs = page.designSpecs.map((spec) => {
      if (spec.id !== designSpecId) return spec;
      const updatedAt = new Date().toISOString();
      return {
        ...spec,
        status,
        updatedAt,
        ...(progress !== undefined && { progress }),
        ...(status === 'completed' && { progress: 100, processedAt: updatedAt }),
        processingHistory: [
          ...(spec.processingHistory || []),
          {
            id: generateId(),
            status,
            message: `状态更新为: ${status}`,
            timestamp: updatedAt,
          },
        ],
      };
    });

    const updatedAt = new Date().toISOString();
    const updatedPage: Page = { ...page, designSpecs: updatedDesignSpecs, updatedAt };
    const pages = project.pages.map((p) => (p.id === pageId ? updatedPage : p));
    return { ...project, pages, updatedAt };
  });
};

const updateDocumentStatus = async (
  projectId: string,
  pageId: string,
  type: 'design' | 'prd' | 'openapi',
  documentId: string,
  status: string
) => {
  try {
    const updatedProject = await apiServices.project.updateDocumentStatus(projectId, pageId, type, documentId, status);
    replaceProjectInState(updatedProject);
    setError(null);
  } catch (error) {
    console.error(error);
    setError('更新文档状态失败');
    throw error;
  }
};

const syncDocuments = async (
  projectId: string,
  pageId: string,
  type: 'design' | 'prd' | 'openapi',
  documentId: string,
  messageApi: MessageInstance
) => {
  setLoading(true);
  try {
    await updateDocumentStatus(projectId, pageId, type, documentId, 'syncing');
    const updatedProject = await apiServices.project.syncDocument(projectId, pageId, type, documentId);
    replaceProjectInState(updatedProject);
    messageApi?.success(`${getDocumentTypeName(type)}同步成功！`);
  } catch (error) {
    console.error(error);
    messageApi?.error(`${getDocumentTypeName(type)}同步失败！`);
    try {
      await updateDocumentStatus(projectId, pageId, type, documentId, 'failed');
    } catch (innerError) {
      console.error(innerError);
    }
    throw error;
  } finally {
    setLoading(false);
  }
};

const completeDocument = async (
  projectId: string,
  pageId: string,
  type: 'design' | 'prd' | 'openapi',
  documentId: string,
  messageApi: MessageInstance
) => {
  try {
    await updateDocumentStatus(projectId, pageId, type, documentId, 'completed');
    messageApi?.success(`${getDocumentTypeName(type)}已标记为完成！`);
  } catch (error) {
    messageApi?.error(`${getDocumentTypeName(type)}标记失败`);
    throw error;
  }
};

const loadProjects = async (params: ProjectListParams, messageApi: MessageInstance) => {
  setLoading(true);
  try {
    const { list, total, page, size } = await apiServices.project.getProjects(params);
    const previousCurrentProjectId = projectStore.currentProject?.id;
    projectStore.projects = list;
    projectStore.currentProject = previousCurrentProjectId
      ? list.find((project) => project.id === previousCurrentProjectId) || null
      : null;
    projectStore.pagination = { total, page, size };
    setError(null);
  } catch (error) {
    console.error(error);
    setError('加载项目失败');
    messageApi?.error('加载项目失败');
    throw error;
  } finally {
    setLoading(false);
  }
};

export const useProject = () => {
  const state = useSnapshot(projectStore);
  return {
    state,
    createProject,
    updateProject,
    deleteProject,
    setCurrentProject,
    createPage,
    updatePage,
    deletePage,
    uploadDesignSpecs,
    updateDesignSpecStatus,
    syncDocuments,
    updateDocumentStatus,
    completeDocument,
    loadProjects,
  };
};
