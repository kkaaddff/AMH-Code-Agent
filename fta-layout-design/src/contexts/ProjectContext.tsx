import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { App } from 'antd';
import { apiServices } from '@/services/apiServices';
import { Project, Page, DesignSpec, CreateProjectForm, CreatePageForm, ProjectListParams } from '../types/project';

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

interface ProjectContextValue {
  state: ProjectState;
  createProject: (formData: CreateProjectForm) => Promise<void>;
  updateProject: (id: string, updates: Partial<Project>) => Promise<void>;
  deleteProject: (id: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  createPage: (projectId: string, formData: CreatePageForm) => Promise<void>;
  updatePage: (
    projectId: string,
    pageId: string,
    updates: Partial<Page> & { designUrls?: string[]; prdUrls?: string[]; openapiUrls?: string[] }
  ) => Promise<void>;
  deletePage: (projectId: string, pageId: string) => Promise<void>;
  uploadDesignSpecs: (projectId: string, pageId: string, files: File[]) => Promise<void>;
  updateDesignSpecStatus: (
    projectId: string,
    pageId: string,
    designSpecId: string,
    status: DesignSpec['status'],
    progress?: number
  ) => void;
  syncDocuments: (
    projectId: string,
    pageId: string,
    type: 'design' | 'prd' | 'openapi',
    documentId: string
  ) => Promise<void>;
  updateDocumentStatus: (
    projectId: string,
    pageId: string,
    type: 'design' | 'prd' | 'openapi',
    documentId: string,
    status: string
  ) => Promise<void>;
  completeDocument: (
    projectId: string,
    pageId: string,
    type: 'design' | 'prd' | 'openapi',
    documentId: string
  ) => Promise<void>;
  loadProjects: (params?: ProjectListParams) => Promise<void>;
}

const ProjectContext = createContext<ProjectContextValue | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) throw new Error('useProject must be used within ProjectProvider');
  return context;
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

export const ProjectProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { message } = App.useApp();
  const [state, setState] = useState<ProjectState>(initialState);

  const setLoading = (loading: boolean) => setState((prev) => ({ ...prev, loading }));
  const setError = (error: string | null) => setState((prev) => ({ ...prev, error }));

  const replaceProjectInState = useCallback((nextProject: Project) => {
    setState((prev) => {
      const exists = prev.projects.some((project) => project.id === nextProject.id);
      const projects = exists
        ? prev.projects.map((project) => (project.id === nextProject.id ? nextProject : project))
        : [...prev.projects, nextProject];
      const currentProject = prev.currentProject?.id === nextProject.id ? nextProject : prev.currentProject;
      return { ...prev, projects, currentProject };
    });
  }, []);

  const mutateProjectState = useCallback((projectId: string, mutator: (project: Project) => Project) => {
    setState((prev) => {
      const target = prev.projects.find((project) => project.id === projectId);
      if (!target) return prev;
      const updatedProject = mutator(target);
      const projects = prev.projects.map((project) => (project.id === projectId ? updatedProject : project));
      const currentProject = prev.currentProject?.id === projectId ? updatedProject : prev.currentProject;
      return { ...prev, projects, currentProject };
    });
  }, []);

  const createProject = useCallback(
    async (formData: CreateProjectForm) => {
      setLoading(true);
      try {
        const createdProject = await apiServices.project.createProject(formData);
        replaceProjectInState(createdProject);
      } catch (error) {
        console.error(error);
        setError('创建项目失败');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [replaceProjectInState]
  );

  const updateProject = useCallback(
    async (id: string, updates: Partial<Project>) => {
      setLoading(true);
      try {
        const updatedProject = await apiServices.project.updateProject(id, updates);
        replaceProjectInState(updatedProject);
      } catch (error) {
        console.error(error);
        setError('更新项目失败');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [replaceProjectInState]
  );

  const deleteProject = useCallback(async (id: string) => {
    setLoading(true);
    try {
      await apiServices.project.deleteProject(id);
      setState((prev) => {
        const projects = prev.projects.filter((project) => project.id !== id);
        const currentProject = prev.currentProject?.id === id ? null : prev.currentProject;
        return { ...prev, projects, currentProject };
      });
    } catch (error) {
      console.error(error);
      setError('删除项目失败');
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const setCurrentProject = useCallback((project: Project | null) => {
    setState((prev) => ({ ...prev, currentProject: project }));
  }, []);

  const createPage = useCallback(
    async (projectId: string, formData: CreatePageForm) => {
      setLoading(true);
      try {
        const updatedProject = await apiServices.project.createPage(projectId, formData);
        replaceProjectInState(updatedProject);
      } catch (error) {
        console.error(error);
        setError('创建页面失败');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [replaceProjectInState]
  );

  const updatePage = useCallback(
    async (
      projectId: string,
      pageId: string,
      updates: Partial<Page> & { designUrls?: string[]; prdUrls?: string[]; openapiUrls?: string[] }
    ) => {
      setLoading(true);
      try {
        const updatedProject = await apiServices.project.updatePage(projectId, pageId, updates);
        replaceProjectInState(updatedProject);
      } catch (error) {
        console.error(error);
        setError('更新页面失败');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [replaceProjectInState]
  );

  const deletePage = useCallback(
    async (projectId: string, pageId: string) => {
      setLoading(true);
      try {
        const updatedProject = await apiServices.project.deletePage(projectId, pageId);
        replaceProjectInState(updatedProject);
      } catch (error) {
        console.error(error);
        setError('删除页面失败');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [replaceProjectInState]
  );

  const uploadDesignSpecs = useCallback(
    async (projectId: string, pageId: string, files: File[]) => {
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
      } catch (error) {
        setError('上传设计稿失败');
      } finally {
        setLoading(false);
      }
    },
    [mutateProjectState]
  );

  const updateDesignSpecStatus = useCallback(
    (projectId: string, pageId: string, designSpecId: string, status: DesignSpec['status'], progress?: number) => {
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

        const updatedPage: Page = { ...page, designSpecs: updatedDesignSpecs, updatedAt: new Date().toISOString() };
        const pages = project.pages.map((p) => (p.id === pageId ? updatedPage : p));
        return { ...project, pages, updatedAt: new Date().toISOString() };
      });
    },
    [mutateProjectState]
  );

  const updateDocumentStatus = useCallback(
    async (
      projectId: string,
      pageId: string,
      type: 'design' | 'prd' | 'openapi',
      documentId: string,
      status: string
    ) => {
      try {
        const updatedProject = await apiServices.project.updateDocumentStatus(
          projectId,
          pageId,
          type,
          documentId,
          status
        );
        replaceProjectInState(updatedProject);
      } catch (error) {
        console.error(error);
        setError('更新文档状态失败');
        throw error;
      }
    },
    [replaceProjectInState]
  );

  const syncDocuments = useCallback(
    async (projectId: string, pageId: string, type: 'design' | 'prd' | 'openapi', documentId: string) => {
      setLoading(true);
      try {
        await updateDocumentStatus(projectId, pageId, type, documentId, 'syncing');
        const updatedProject = await apiServices.project.syncDocument(projectId, pageId, type, documentId);
        replaceProjectInState(updatedProject);
        message.success(`${getDocumentTypeName(type)}同步成功！`);
      } catch (error) {
        console.error(error);
        message.error(`${getDocumentTypeName(type)}同步失败！`);
        try {
          await updateDocumentStatus(projectId, pageId, type, documentId, 'failed');
        } catch (innerError) {
          console.error(innerError);
        }
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [message, replaceProjectInState, updateDocumentStatus]
  );

  const completeDocument = useCallback(
    async (projectId: string, pageId: string, type: 'design' | 'prd' | 'openapi', documentId: string) => {
      try {
        await updateDocumentStatus(projectId, pageId, type, documentId, 'completed');
        message.success(`${getDocumentTypeName(type)}已标记为完成！`);
      } catch (error) {
        message.error(`${getDocumentTypeName(type)}标记失败`);
        throw error;
      }
    },
    [message, updateDocumentStatus]
  );

  const loadProjects = useCallback(
    async (params?: ProjectListParams) => {
      setLoading(true);
      try {
        const { list, total, page, size } = await apiServices.project.getProjects(params);
        setState((prev) => {
          const currentProject = prev.currentProject
            ? list.find((project) => project.id === prev.currentProject?.id) || null
            : null;
          return {
            ...prev,
            projects: list,
            currentProject,
            error: null,
            pagination: { total, page, size },
          };
        });
      } catch (error) {
        console.error(error);
        setError('加载项目失败');
        message.error('加载项目失败');
        throw error;
      } finally {
        setLoading(false);
      }
    },
    [message]
  );

  const value: ProjectContextValue = {
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

  return <ProjectContext.Provider value={value}>{children}</ProjectContext.Provider>;
};
