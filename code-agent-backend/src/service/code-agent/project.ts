import { Inject, Provide } from '@midwayjs/decorator';
import { InjectEntityModel } from '@midwayjs/typegoose';
import { Context } from '@midwayjs/web';
import { ReturnModelType } from '@typegoose/typegoose';
import {
  BindProjectContextRequest,
  CreatePageRequest,
  CreateProjectRequest,
  DeletePageRequest,
  DeleteProjectRequest,
  GetDocumentContentRequest,
  GetPageDetailRequest,
  GetProjectDetailRequest,
  ProjectListRequest,
  ResolveProjectContextRequest,
  SyncDocumentRequest,
  UpdateDocumentStatusRequest,
  UpdatePageRequest,
  UpdateProjectRequest,
} from '../../dto/code-agent/req';
import { DocumentReference, Page, Project } from '../../entity/code-agent/project';
import { MasterGoServiceV1 } from './mastergo.service';
import { GitlabService } from './gitlab.service';

@Provide()
export class ProjectService {
  @InjectEntityModel(Project)
  projectEntity: ReturnModelType<typeof Project>;

  @InjectEntityModel(Page)
  pageEntity: ReturnModelType<typeof Page>;

  @InjectEntityModel(DocumentReference)
  documentReferenceEntity: ReturnModelType<typeof DocumentReference>;

  @Inject()
  masterGoServiceV1: MasterGoServiceV1;

  @Inject()
  ctx: Context;

  @Inject()
  gitlabService: GitlabService;

  private resolveUserId(): string {
    const userId = this.ctx.get('user-id');
    if (userId) {
      return userId;
    }
    const user = this.ctx.state?.user;
    if (user) {
      return user.id;
    }
    return undefined;
  }

  private readonly projectPagesPopulateOptions = {
    path: 'pages',
    populate: [{ path: 'designDocuments' }, { path: 'prdDocuments' }, { path: 'openapiDocuments' }],
  };

  private sanitizeWorkdirs(workdirs?: string[]): string[] {
    if (!Array.isArray(workdirs)) {
      return [];
    }
    return Array.from(
      new Set(
        workdirs
          .map((item) => (typeof item === 'string' ? item.trim() : ''))
          .filter((item): item is string => Boolean(item))
      )
    );
  }

  private normalizeWorkdir(workdir?: string): string | null {
    if (!workdir || typeof workdir !== 'string') {
      return null;
    }
    const normalized = workdir.trim();
    return normalized.length > 0 ? normalized : null;
  }

  /**
   * Generate a unique ID with prefix
   */
  private generateId(prefix: string): string {
    return `${prefix}_${Math.random().toString(36).slice(2, 11)}_${Date.now()}`;
  }

  /**
   * Derive document name from URL
   */
  private deriveDocumentName(url: string, fallback: string): string {
    try {
      const parsed = new URL(url);
      const pathname = parsed.pathname.split('/').filter(Boolean).pop();
      return pathname || fallback;
    } catch {
      return fallback;
    }
  }

  /**
   * Create document references from URLs
   */
  private async createDocumentReferences(urls: string[] = [], pageId: string): Promise<DocumentReference[]> {
    const now = new Date();
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    const documents = (urls || [])
      .filter((url) => Boolean(url))
      .map((url, index) => ({
        id: this.generateId('doc'),
        url,
        name: this.deriveDocumentName(url, `文档-${index + 1}`),
        status: 'pending' as const,
        progress: 0,
        createdAt: now,
        updatedAt: now,
        pageId,
        userId,
        gitId: 'empty',
      }));

    // Save documents to database
    if (documents.length === 0) {
      return [];
    }

    const savedDocuments = await this.documentReferenceEntity.insertMany(documents);
    return savedDocuments;
  }

  /**
   * Merge document references with existing ones
   * Returns array of document _ids for reference storage
   */
  private async mergeDocumentReferences(
    existingIds: any[] = [],
    urls: string[] = [],
    pageId: string
  ): Promise<DocumentReference[]> {
    const now = new Date();
    const result: DocumentReference[] = [];
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    // Fetch existing documents by their _ids
    const existingDocs = await this.documentReferenceEntity.find({
      _id: { $in: existingIds },
    });

    for (const url of urls || []) {
      if (!url) continue;

      const matched = existingDocs.find((doc) => doc.url === url);
      if (matched) {
        // Update existing document
        await this.documentReferenceEntity.updateOne({ id: matched.id }, { updatedAt: now });
        result.push(matched._id);
      } else {
        // Create new document
        const newDoc: Omit<DocumentReference, '_id'> = {
          id: this.generateId('doc'),
          url,
          name: this.deriveDocumentName(url, `文档-${result.length + 1}`),
          status: 'pending' as const,
          progress: 0,
          createdAt: now,
          updatedAt: now,
          pageId,
        };
        const savedDoc = await this.documentReferenceEntity.create(newDoc);
        result.push(savedDoc._id);
      }
    }

    return result;
  }

  private async findProject(projectId: string): Promise<Project> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    const project = await this.projectEntity
      .findOne({ id: projectId, userId })
      .populate(this.projectPagesPopulateOptions);

    if (!project) {
      throw new Error('项目不存在');
    }
    return project;
  }

  private async findPageInProject(projectId: string, pageId: string): Promise<{ project: Project; page: Page }> {
    const project = await this.findProject(projectId);
    const page = project.pages.find((item) => item.id === pageId);

    if (!page) {
      throw new Error('页面不存在');
    }
    return { project, page };
  }

  /**
   * Find page by ID with optional project ID
   */
  async findPage(params: GetPageDetailRequest): Promise<Page> {
    const { pageId, projectId } = params;

    let page: Page | null = null;

    if (projectId) {
      // Find page within specific project
      const project = await this.findProject(projectId);
      page = project.pages.find((item) => item.id === pageId) || null;
    } else {
      // Find page across all projects
      page = await this.pageEntity
        .findOne({ id: pageId })
        .populate([{ path: 'designDocuments' }, { path: 'prdDocuments' }, { path: 'openapiDocuments' }])
        .exec();
    }

    if (!page) {
      throw new Error('页面不存在');
    }

    return page;
  }

  /**
   * Get projects list
   */
  async getProjects(params: ProjectListRequest): Promise<{ projects: Project[]; total: number }> {
    const page = Number(params.page) || 1;
    const size = Number(params.size) || 10;
    const skip = (page - 1) * size;
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    const filter = { userId };
    const [projects, total] = await Promise.all([
      this.projectEntity
        .find(filter)
        .populate(this.projectPagesPopulateOptions)
        .skip(skip)
        .limit(size)
        .sort({ updatedAt: -1 }),
      this.projectEntity.countDocuments(filter),
    ]);

    return { projects, total };
  }

  /**
   * Create project
   */
  async createProject(data: CreateProjectRequest): Promise<Project> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    const timestamp = new Date();
    const newProject: Partial<Project> = {
      id: this.generateId('project'),
      name: data.name,
      description: data.description,
      gitRepository: data.gitRepository,
      manager: data.manager,
      createdAt: timestamp,
      updatedAt: timestamp,
      status: data.status || 'active',
      progress: data.progress ?? 0,
      members: data.members ?? 1,
      tags: data.tags || [],
      avatar: data.avatar || '📁',
      pages: [],
      userId,
      gitId: 'empty',
      workdirs: this.sanitizeWorkdirs(data.workdirs),
    };

    const createdProject = await this.projectEntity.create(newProject);
    return createdProject;
  }

  /**
   * Update project
   */
  async updateProject(id: string, updates: UpdateProjectRequest): Promise<Project> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    const { workdirs, ...otherUpdates } = updates as Record<string, any>;
    const updatePayload: Record<string, any> = {
      ...otherUpdates,
      updatedAt: new Date(),
    };
    if (workdirs !== undefined) {
      updatePayload.workdirs = this.sanitizeWorkdirs(workdirs);
    }
    const updatedProject = await this.projectEntity
      .findOneAndUpdate({ id, userId }, updatePayload, { new: true, runValidators: true })
      .populate(this.projectPagesPopulateOptions);

    if (!updatedProject) {
      throw new Error('项目不存在');
    }

    return updatedProject;
  }

  /**
   * Delete project
   */
  async deleteProject(params: DeleteProjectRequest): Promise<boolean> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    const result = await this.projectEntity.deleteOne({ id: params.id, userId });

    if (result.deletedCount === 0) {
      throw new Error('项目不存在');
    }

    return true;
  }

  /**
   * Get project detail
   */
  async getProjectDetail(params: GetProjectDetailRequest): Promise<Project> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    return await this.findProject(params.id);
  }

  /**
   * Create page
   */
  async createPage(data: CreatePageRequest): Promise<Project> {
    const timestamp = new Date();
    const pageId = this.generateId('page');
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    await this.findProject(data.projectId);

    // Create document references asynchronously
    const [designDocuments, prdDocuments, openapiDocuments] = await Promise.all([
      this.createDocumentReferences(data.designUrls, pageId),
      this.createDocumentReferences(data.prdUrls, pageId),
      this.createDocumentReferences(data.openapiUrls, pageId),
    ]);

    const newPage: Partial<Page> = {
      id: pageId,
      projectId: data.projectId,
      name: data.name,
      routePath: data.routePath,
      description: data.description,
      createdAt: timestamp,
      updatedAt: timestamp,
      designSpecs: [],
      prds: [],
      components: [],
      designDocuments: designDocuments.map((doc) => doc._id) as any,
      prdDocuments: prdDocuments.map((doc) => doc._id) as any,
      openapiDocuments: openapiDocuments.map((doc) => doc._id) as any,
    };

    // Save page to database
    const createdPage = await this.pageEntity.create(newPage);

    // Add page reference to project
    const updatedProject = await this.projectEntity
      .findOneAndUpdate(
        { id: data.projectId, userId },
        { $push: { pages: createdPage._id }, updatedAt: timestamp },
        { new: true, runValidators: true }
      )
      .populate(this.projectPagesPopulateOptions);

    if (!updatedProject) {
      throw new Error('项目不存在');
    }

    return updatedProject;
  }

  /**
   * Update page
   */
  async updatePage(data: UpdatePageRequest): Promise<Project> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    const { page } = await this.findPageInProject(data.projectId, data.pageId);
    const timestamp = new Date();

    const updateData: Partial<Page> = {
      updatedAt: timestamp,
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.routePath !== undefined) updateData.routePath = data.routePath;
    if (data.description !== undefined) updateData.description = data.description;

    if (data.designUrls !== undefined) {
      updateData.designDocuments = await this.mergeDocumentReferences(
        page.designDocuments,
        data.designUrls,
        data.pageId
      );
    }
    if (data.prdUrls !== undefined) {
      updateData.prdDocuments = await this.mergeDocumentReferences(page.prdDocuments, data.prdUrls, data.pageId);
    }
    if (data.openapiUrls !== undefined) {
      updateData.openapiDocuments = await this.mergeDocumentReferences(
        page.openapiDocuments,
        data.openapiUrls,
        data.pageId
      );
    }

    // Update page in database
    await this.pageEntity.updateOne({ id: data.pageId }, updateData);

    // Update project's updatedAt
    const updatedProject = await this.projectEntity
      .findOneAndUpdate({ id: data.projectId, userId }, { updatedAt: timestamp }, { new: true, runValidators: true })
      .populate(this.projectPagesPopulateOptions);

    if (!updatedProject) {
      throw new Error('项目不存在');
    }

    return updatedProject;
  }

  /**
   * Delete page
   */
  async deletePage(data: DeletePageRequest): Promise<Project> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    const { page } = await this.findPageInProject(data.projectId, data.pageId);
    const timestamp = new Date();

    // Delete page from database
    await this.pageEntity.deleteOne({ id: data.pageId, userId });

    // Remove page reference from project
    const updatedProject = await this.projectEntity
      .findOneAndUpdate(
        { id: data.projectId, userId },
        { $pull: { pages: page._id }, updatedAt: timestamp },
        { new: true, runValidators: true }
      )
      .populate(this.projectPagesPopulateOptions);

    if (!updatedProject) {
      throw new Error('项目不存在');
    }

    return updatedProject;
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(data: UpdateDocumentStatusRequest): Promise<Project> {
    await this.findPageInProject(data.projectId, data.pageId);
    const timestamp = new Date();

    const updateData = {
      status: data.status,
      progress: ['synced', 'completed'].includes(data.status) ? 100 : data.status === 'syncing' ? 50 : undefined,
      lastSyncAt: data.status === 'synced' ? timestamp : undefined,
      updatedAt: timestamp,
    };

    // Update document in database
    await this.documentReferenceEntity.updateOne({ id: data.documentId }, updateData);

    // Update page's updatedAt
    await this.pageEntity.updateOne({ id: data.pageId }, { updatedAt: timestamp });

    // Update project's updatedAt
    const updatedProject = await this.projectEntity
      .findOneAndUpdate({ id: data.projectId }, { updatedAt: timestamp }, { new: true, runValidators: true })
      .populate(this.projectPagesPopulateOptions);

    if (!updatedProject) {
      throw new Error('项目不存在');
    }

    return updatedProject;
  }

  /**
   * Sync document
   * This method performs document synchronization based on type and updates the document
   * with the fetched data in a transaction.
   */
  async syncDocument(data: SyncDocumentRequest): Promise<Project> {
    const { projectId, pageId, type, documentId } = data;
    const timestamp = new Date();

    // Verify page exists
    await this.findPageInProject(projectId, pageId);

    // Get document reference to fetch the URL
    const document = await this.documentReferenceEntity.findOne({
      id: documentId,
    });
    if (!document) {
      throw new Error('文档不存在');
    }

    // Fetch data based on document type
    let documentData: Record<string, any> | undefined;

    try {
      if (type === 'design') {
        // For design documents, call MasterGo service to get DSL
        const dslResponse = await this.masterGoServiceV1.getDslFromUrl(document.url);
        documentData = {
          dsl: dslResponse.dsl,
          componentDocumentLinks: dslResponse.componentDocumentLinks,
        };
      }
      // TODO: Add handling for 'prd' and 'openapi' types
      // else if (type === 'prd') {
      //   Handle PRD document synchronization
      // } else if (type === 'openapi') {
      //   Handle OpenAPI document synchronization
      // }
    } catch (error) {
      // If data fetching fails, update status to 'failed'
      await this.documentReferenceEntity.updateOne(
        { id: documentId },
        {
          status: 'failed',
          progress: 0,
          updatedAt: timestamp,
        }
      );
      throw error;
    }

    const updateData: any = {
      status: 'synced',
      progress: 100,
      lastSyncAt: timestamp,
      updatedAt: timestamp,
    };

    if (documentData) {
      updateData.data = documentData;
    }

    await this.documentReferenceEntity.updateOne({ id: documentId }, updateData);

    const updatedProject = await this.projectEntity
      .findOne({ id: projectId })
      .populate(this.projectPagesPopulateOptions);

    if (!updatedProject) {
      throw new Error('项目不存在');
    }

    return updatedProject;
  }

  /**
   * Get document content
   * Retrieves the cached content of a synchronized document
   */
  async getDocumentContent(data: GetDocumentContentRequest): Promise<DocumentReference> {
    const { documentId } = data;
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }

    // Get document reference
    const document = await this.documentReferenceEntity.findOne(
      {
        _id: documentId,
        userId,
      },
      null,
      { lean: true }
    );
    if (!document) {
      // throw new Error('文档不存在');
      return null;
    }

    return document;
  }

  /**
   * Update document content
   * Updates the content and other properties of a document
   */
  async updateDocument(data: DocumentReference): Promise<DocumentReference> {
    const { id } = data;

    const timestamp = new Date();

    const document = await this.documentReferenceEntity.findOne({ id });
    if (!document) {
      throw new Error('文档不存在');
    }

    // Extract updatable fields and filter out undefined values
    const { id: _, _id, createdAt, ...updateFields } = data;
    const updateData = {
      ...Object.fromEntries(Object.entries(updateFields).filter(([_, value]) => value !== undefined)),
      updatedAt: timestamp,
    };

    // Update document in database
    await this.documentReferenceEntity.updateOne({ id }, updateData);

    // Return the updated document
    const updatedDocument = await this.documentReferenceEntity.findOne({ id });
    return updatedDocument!;
  }

  async resolveProjectContext(params: ResolveProjectContextRequest): Promise<{
    matchedProject: Project | null;
    matchedBy: 'gitId' | 'workdir' | null;
    requestedWorkdir: string | null;
    projects: Project[];
  }> {
    const requestedWorkdir = this.normalizeWorkdir(params.workdir);
    let matchedProject: Project | null = null;
    let matchedBy: 'gitId' | 'workdir' | null = null;
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    let resolvedGitId = 'empty';

    try {
      resolvedGitId = await this.gitlabService.getGitlabProjectId(params.gitUrl);
    } catch (error) {
      console.warn('Failed to get GitLab project ID', params.gitUrl);
    }

    if (params.gitUrl) {
      matchedProject = await this.projectEntity
        .findOne({ userId, gitId: resolvedGitId })
        .populate(this.projectPagesPopulateOptions);
      if (matchedProject) {
        matchedBy = 'gitId';
      }
    }

    if (!matchedProject && requestedWorkdir) {
      matchedProject = await this.projectEntity
        .findOne({
          userId,
          $or: [{ gitId: requestedWorkdir }, { workdirs: requestedWorkdir }],
        })
        .populate(this.projectPagesPopulateOptions);
      if (matchedProject) {
        matchedBy = 'workdir';
      }
    }

    if (!matchedProject && resolvedGitId !== 'empty' && !resolvedGitId) {
      matchedProject = await this.projectEntity
        .findOne({ userId, gitId: resolvedGitId })
        .populate(this.projectPagesPopulateOptions);
      if (matchedProject) {
        matchedBy = 'gitId';
      }
    }

    const projects = await this.projectEntity
      .find({ userId })
      .populate(this.projectPagesPopulateOptions)
      .sort({ updatedAt: -1 });

    return {
      matchedProject,
      matchedBy,
      requestedWorkdir,
      projects,
    };
  }

  async bindProjectContext(params: BindProjectContextRequest): Promise<Project> {
    const userId = this.resolveUserId();
    if (!userId) {
      throw new Error('用户 ID 不能为空');
    }
    const projectId = params.projectId?.trim();
    if (!projectId) {
      throw new Error('项目ID不能为空');
    }

    const normalizedWorkdir = this.normalizeWorkdir(params.workdir);
    if (!params.gitUrl && !normalizedWorkdir) {
      throw new Error('gitUrl 或 workdir 至少需要提供一个');
    }

    let resolvedGitId = 'empty';
    if (params.gitUrl) {
      resolvedGitId = await this.gitlabService.getGitlabProjectId(params.gitUrl);
    }

    const timestamp = new Date();
    const updateData: Record<string, any> = {
      $set: {
        updatedAt: timestamp,
      },
    };

    if (resolvedGitId) {
      updateData.$set.gitId = resolvedGitId;
    }

    if (normalizedWorkdir) {
      updateData.$addToSet = { workdirs: normalizedWorkdir };
    }

    const updatedProject = await this.projectEntity
      .findOneAndUpdate({ id: projectId, userId }, updateData, {
        new: true,
        runValidators: true,
      })
      .populate(this.projectPagesPopulateOptions);

    if (!updatedProject) {
      throw new Error('项目不存在');
    }

    return updatedProject;
  }
}
