import type {
  CreatePageForm,
  CreateProjectForm,
  DocumentReference,
  Page,
  Project,
  ProjectListParams,
  ProjectListResponse,
  SyncStatus,
} from '@/types/project';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

const deepClone = <T>(value: T): T => JSON.parse(JSON.stringify(value));

const generateId = (prefix: string) => `${prefix}_${Math.random().toString(36).slice(2, 11)}`;

const deriveDocumentName = (url: string, fallback: string) => {
  try {
    const parsed = new URL(url);
    const pathname = parsed.pathname.split('/').filter(Boolean).pop();
    return pathname || fallback;
  } catch {
    return fallback;
  }
};

const createDocumentReferences = (urls: string[] = []): DocumentReference[] => {
  const now = new Date().toISOString();
  return (urls || [])
    .filter((url) => Boolean(url))
    .map((url, index) => ({
      id: generateId('doc'),
      url,
      name: deriveDocumentName(url, `文档-${index + 1}`),
      status: 'pending' as SyncStatus,
      progress: 0,
      createdAt: now,
      updatedAt: now,
    }));
};

const mergeDocumentReferences = (existing: DocumentReference[] = [], urls: string[] = []): DocumentReference[] => {
  const now = new Date().toISOString();
  return (urls || [])
    .filter((url) => Boolean(url))
    .map((url, index) => {
      const matched = existing.find((doc) => doc.url === url);
      if (matched) {
        return {
          ...matched,
          updatedAt: now,
        };
      }
      return {
        id: generateId('doc'),
        url,
        name: deriveDocumentName(url, `文档-${index + 1}`),
        status: 'pending' as SyncStatus,
        progress: 0,
        createdAt: now,
        updatedAt: now,
      };
    });
};

const now = new Date().toISOString();

let mockProjects: Project[] = [
  {
    id: 'project_mock_1',
    name: 'DSL 布局演示项目',
    description: '用于验证 FTA DSL 转换链路的示例项目',
    gitRepository: 'https://github.com/example/fta-demo',
    manager: '张伟',
    createdAt: now,
    updatedAt: now,
    status: 'active',
    progress: 45,
    members: 6,
    tags: ['MasterGo', 'DSL', 'Demo'],
    avatar: '📁',
    pages: [
      {
        id: 'page_mock_1',
        projectId: 'project_mock_1',
        name: '登录页',
        routePath: '/signin',
        description: '移动端登录页面',
        createdAt: now,
        updatedAt: now,
        designSpecs: [],
        prds: [],
        components: [],
        designDocuments: createDocumentReferences(['https://MasterGo.com/login']),
        prdDocuments: createDocumentReferences(['https://docs.company.com/prd/login']),
        openapiDocuments: createDocumentReferences(['https://api.company.com/openapi/login.json']),
      },
    ],
  },
  {
    id: 'project_mock_2',
    name: '项目中台管理',
    description: '演示项目管理模块操作流转',
    gitRepository: '',
    manager: '李静',
    createdAt: now,
    updatedAt: now,
    status: 'paused',
    progress: 70,
    members: 4,
    tags: ['中台', '管理后台'],
    avatar: '🛒',
    pages: [],
  },
];

const findProject = (projectId: string) => {
  const project = mockProjects.find((item) => item.id === projectId);
  if (!project) {
    throw new Error('项目不存在');
  }
  return project;
};

const findPage = (projectId: string, pageId: string) => {
  const project = findProject(projectId);
  const page = project.pages.find((item) => item.id === pageId);
  if (!page) {
    throw new Error('页面不存在');
  }
  return { project, page };
};

const DOCUMENT_COLLECTION_KEYS = ['designDocuments', 'prdDocuments', 'openapiDocuments'] as const;

const findDocument = (documentId: string) => {
  for (const project of mockProjects) {
    for (const page of project.pages) {
      for (const key of DOCUMENT_COLLECTION_KEYS) {
        const documents = page[key] as DocumentReference[];
        const document = documents.find((doc) => doc.id === documentId);
        if (document) {
          return {
            project,
            page,
            document,
            collectionKey: key,
          };
        }
      }
    }
  }
  throw new Error('文档不存在');
};

const buildPagePayload = (projectId: string, formData: CreatePageForm): Page => {
  const timestamp = new Date().toISOString();
  return {
    id: generateId('page'),
    projectId,
    name: formData.name,
    routePath: formData.routePath,
    description: formData.description,
    createdAt: timestamp,
    updatedAt: timestamp,
    designSpecs: [],
    prds: [],
    components: [],
    designDocuments: createDocumentReferences(formData.designUrls),
    prdDocuments: createDocumentReferences(formData.prdUrls),
    openapiDocuments: createDocumentReferences(formData.openapiUrls),
  };
};

export const projectMockService = {
  async getProjects(params?: ProjectListParams): Promise<ProjectListResponse> {
    await delay();
    const total = mockProjects.length;
    const size = params?.size && params.size > 0 ? params.size : total || 10;
    const page = params?.page && params.page > 0 ? params.page : 1;
    const startIndex = (page - 1) * size;
    const list = deepClone(mockProjects.slice(startIndex, startIndex + size));
    return {
      list,
      total,
      page,
      size,
    };
  },

  async createProject(formData: CreateProjectForm) {
    await delay();
    const timestamp = new Date().toISOString();
    const newProject: Project = {
      id: generateId('project'),
      name: formData.name,
      description: formData.description,
      gitRepository: formData.gitRepository,
      manager: formData.manager,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: formData.status || 'active',
      progress: formData.progress ?? 0,
      members: formData.members ?? 1,
      tags: formData.tags || [],
      avatar: formData.avatar || '📁',
      pages: [],
    };
    mockProjects = [...mockProjects, newProject];
    return deepClone(newProject);
  },

  async updateProject(id: string, updates: Partial<Project>) {
    await delay();
    mockProjects = mockProjects.map((project) =>
      project.id === id
        ? {
            ...project,
            ...updates,
            updatedAt: new Date().toISOString(),
          }
        : project
    );
    return deepClone(findProject(id));
  },

  async deleteProject(id: string) {
    await delay();
    mockProjects = mockProjects.filter((project) => project.id !== id);
    return true;
  },

  async getProjectDetail(id: string) {
    await delay();
    return deepClone(findProject(id));
  },

  async createPage(projectId: string, formData: CreatePageForm) {
    await delay();
    const project = findProject(projectId);
    const page = buildPagePayload(projectId, formData);
    project.pages = [...project.pages, page];
    project.updatedAt = new Date().toISOString();
    return deepClone(project);
  },

  async updatePage(
    projectId: string,
    pageId: string,
    updates: Partial<Page> & {
      name?: string;
      routePath?: string;
      description?: string;
      designUrls?: string[];
      prdUrls?: string[];
      openapiUrls?: string[];
    }
  ) {
    await delay();
    const { project, page } = findPage(projectId, pageId);
    const timestamp = new Date().toISOString();

    page.name = updates.name ?? page.name;
    page.routePath = updates.routePath ?? page.routePath;
    page.description = updates.description ?? page.description;
    page.designDocuments = mergeDocumentReferences(page.designDocuments, updates.designUrls);
    page.prdDocuments = mergeDocumentReferences(page.prdDocuments, updates.prdUrls);
    page.openapiDocuments = mergeDocumentReferences(page.openapiDocuments, updates.openapiUrls);
    page.updatedAt = timestamp;
    project.updatedAt = timestamp;

    return deepClone(project);
  },

  async deletePage(projectId: string, pageId: string) {
    await delay();
    const project = findProject(projectId);
    project.pages = project.pages.filter((page) => page.id !== pageId);
    project.updatedAt = new Date().toISOString();
    return deepClone(project);
  },

  async updateDocumentStatus(
    projectId: string,
    pageId: string,
    type: 'design' | 'prd' | 'openapi',
    documentId: string,
    status: SyncStatus
  ) {
    await delay();
    const { project, page } = findPage(projectId, pageId);
    const collectionKey = type === 'design' ? 'designDocuments' : type === 'prd' ? 'prdDocuments' : 'openapiDocuments';
    const documents = page[collectionKey] as DocumentReference[];
    page[collectionKey] = documents.map((doc) =>
      doc.id === documentId
        ? {
            ...doc,
            status,
            progress: status === 'synced' || status === 'completed' ? 100 : status === 'syncing' ? 50 : doc.progress,
            lastSyncAt: status === 'synced' ? new Date().toISOString() : doc.lastSyncAt,
            updatedAt: new Date().toISOString(),
          }
        : doc
    );
    page.updatedAt = new Date().toISOString();
    project.updatedAt = page.updatedAt;
    return deepClone(project);
  },

  async syncDocument(projectId: string, pageId: string, type: 'design' | 'prd' | 'openapi', documentId: string) {
    await delay(800);
    return this.updateDocumentStatus(projectId, pageId, type, documentId, 'synced');
  },

  async getDocumentContent({ documentId }: { documentId: string }): Promise<DocumentReference> {
    await delay();
    const { document, collectionKey } = findDocument(documentId);
    const timestamp = document.lastSyncAt || document.updatedAt || new Date().toISOString();
    const type = collectionKey === 'designDocuments' ? 'design' : collectionKey === 'prdDocuments' ? 'prd' : 'openapi';

    return {
      id: document.id,
      url: document.url,
      name: document.name || '文档内容',
      status: document.status,
      type,
      lastSyncAt: timestamp,
      progress: 0,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
      annotationData: document.annotationData,
      data: document.data,
    };
  },

  async updateDocument(payload: Partial<DocumentReference>) {
    await delay();
    const { project, document } = findDocument(payload.id as string);
    const timestamp = new Date().toISOString();

    if (payload.status) {
      document.status = payload.status;
    }

    if (payload.name) {
      document.name = payload.name;
    }

    if (payload.url) {
      document.url = payload.url;
    }

    document.updatedAt = timestamp;
    project.updatedAt = timestamp;

    return deepClone(project);
  },
};
