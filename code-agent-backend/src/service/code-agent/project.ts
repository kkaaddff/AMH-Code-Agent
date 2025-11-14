import { Inject, Provide } from '@midwayjs/decorator';
import { DocumentReference, Page, Project } from '../../entity/code-agent/project';
import {
  CreatePageRequest,
  CreateProjectRequest,
  DeletePageRequest,
  DeleteProjectRequest,
  GetDocumentContentRequest,
  GetPageDetailRequest,
  GetProjectDetailRequest,
  ProjectListRequest,
  SyncDocumentRequest,
  UpdateDocumentStatusRequest,
  UpdatePageRequest,
  UpdateProjectRequest,
} from '../../dto/code-agent/req';

import { InjectEntityModel } from '@midwayjs/typegoose';
import { ReturnModelType } from '@typegoose/typegoose';
import { MasterGoServiceV1 } from './mastergo.service';

type UserContext = { userId: string; gitId: string };

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

  private resolveUserContext(userId: string, gitId?: string): UserContext {
    if (!userId || !userId.trim()) {
      throw new Error('用户 ID 不能为空');
    }
    return {
      userId: userId.trim(),
      gitId: gitId && gitId.trim() ? gitId.trim() : 'empty',
    };
  }

  private buildUserFilter(context: UserContext) {
    return {
      userId: context.userId,
      gitId: context.gitId,
    };
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
  private async createDocumentReferences(
    urls: string[] = [],
    context: UserContext,
    pageId: string
  ): Promise<DocumentReference[]> {
    const now = new Date();
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
        userId: context.userId,
        gitId: context.gitId,
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
    pageId: string,
    context: UserContext
  ): Promise<DocumentReference[]> {
    const now = new Date();
    const result: DocumentReference[] = [];

    // Fetch existing documents by their _ids
    const existingDocs = await this.documentReferenceEntity.find({
      _id: { $in: existingIds },
      ...this.buildUserFilter(context),
    });

    for (const url of urls || []) {
      if (!url) continue;

      const matched = existingDocs.find((doc) => doc.url === url);
      if (matched) {
        // Update existing document
        await this.documentReferenceEntity.updateOne(
          { id: matched.id, ...this.buildUserFilter(context) },
          { updatedAt: now }
        );
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
          userId: context.userId,
          gitId: context.gitId,
        };
        const savedDoc = await this.documentReferenceEntity.create(newDoc);
        result.push(savedDoc._id);
      }
    }

    return result;
  }

  private async findProject(projectId: string, context: UserContext): Promise<Project> {
    const project = await this.projectEntity.findOne({ id: projectId, ...this.buildUserFilter(context) }).populate({
      path: 'pages',
      populate: [{ path: 'designDocuments' }, { path: 'prdDocuments' }, { path: 'openapiDocuments' }],
    });

    if (!project) {
      throw new Error('项目不存在');
    }
    return project;
  }

  private async findPageInProject(
    projectId: string,
    pageId: string,
    context: UserContext
  ): Promise<{ project: Project; page: Page }> {
    const project = await this.findProject(projectId, context);
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
    const context = this.resolveUserContext(params.userId, params.gitId);

    let page: Page | null = null;

    if (projectId) {
      // Find page within specific project
      const project = await this.findProject(projectId, context);
      page = project.pages.find((item) => item.id === pageId) || null;
    } else {
      // Find page across all projects
      page = await this.pageEntity
        .findOne({ id: pageId, ...this.buildUserFilter(context) })
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
    const context = this.resolveUserContext(params.userId, params.gitId);
    const filter = this.buildUserFilter(context);

    const [projects, total] = await Promise.all([
      this.projectEntity
        .find(filter)
        .populate({
          path: 'pages',
          populate: [{ path: 'designDocuments' }, { path: 'prdDocuments' }, { path: 'openapiDocuments' }],
        })
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
    const context = this.resolveUserContext(data.userId, data.gitId);
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
      userId: context.userId,
      gitId: context.gitId,
    };

    const createdProject = await this.projectEntity.create(newProject);
    return createdProject;
  }

  /**
   * Update project
   */
  async updateProject(id: string, updates: UpdateProjectRequest): Promise<Project> {
    const context = this.resolveUserContext(updates.userId, updates.gitId);
    const { userId: _discardUserId, gitId: _discardGitId, ...rest } = updates;
    const updatedProject = await this.projectEntity
      .findOneAndUpdate(
        { id, ...this.buildUserFilter(context) },
        { ...rest, updatedAt: new Date() },
        { new: true, runValidators: true }
      )
      .populate({
        path: 'pages',
        populate: [{ path: 'designDocuments' }, { path: 'prdDocuments' }, { path: 'openapiDocuments' }],
      });

    if (!updatedProject) {
      throw new Error('项目不存在');
    }

    return updatedProject;
  }

  /**
   * Delete project
   */
  async deleteProject(params: DeleteProjectRequest): Promise<boolean> {
    const context = this.resolveUserContext(params.userId, params.gitId);
    const result = await this.projectEntity.deleteOne({ id: params.id, ...this.buildUserFilter(context) });

    if (result.deletedCount === 0) {
      throw new Error('项目不存在');
    }

    return true;
  }

  /**
   * Get project detail
   */
  async getProjectDetail(params: GetProjectDetailRequest): Promise<Project> {
    const context = this.resolveUserContext(params.userId, params.gitId);
    return await this.findProject(params.id, context);
  }

  /**
   * Create page
   */
  async createPage(data: CreatePageRequest): Promise<Project> {
    const context = this.resolveUserContext(data.userId, data.gitId);
    const timestamp = new Date();
    const pageId = this.generateId('page');

    await this.findProject(data.projectId, context);

    // Create document references asynchronously
    const [designDocuments, prdDocuments, openapiDocuments] = await Promise.all([
      this.createDocumentReferences(data.designUrls, context, pageId),
      this.createDocumentReferences(data.prdUrls, context, pageId),
      this.createDocumentReferences(data.openapiUrls, context, pageId),
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
      userId: context.userId,
      gitId: context.gitId,
    };

    // Save page to database
    const createdPage = await this.pageEntity.create(newPage);

    // Add page reference to project
    const updatedProject = await this.projectEntity
      .findOneAndUpdate(
        { id: data.projectId, ...this.buildUserFilter(context) },
        { $push: { pages: createdPage._id }, updatedAt: timestamp },
        { new: true, runValidators: true }
      )
      .populate({
        path: 'pages',
        populate: [{ path: 'designDocuments' }, { path: 'prdDocuments' }, { path: 'openapiDocuments' }],
      });

    if (!updatedProject) {
      throw new Error('项目不存在');
    }

    return updatedProject;
  }

  /**
   * Update page
   */
  async updatePage(data: UpdatePageRequest): Promise<Project> {
    const context = this.resolveUserContext(data.userId, data.gitId);
    const { page } = await this.findPageInProject(data.projectId, data.pageId, context);
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
        data.pageId,
        context
      );
    }
    if (data.prdUrls !== undefined) {
      updateData.prdDocuments = await this.mergeDocumentReferences(
        page.prdDocuments,
        data.prdUrls,
        data.pageId,
        context
      );
    }
    if (data.openapiUrls !== undefined) {
      updateData.openapiDocuments = await this.mergeDocumentReferences(
        page.openapiDocuments,
        data.openapiUrls,
        data.pageId,
        context
      );
    }

    // Update page in database
    await this.pageEntity.updateOne({ id: data.pageId, ...this.buildUserFilter(context) }, updateData);

    // Update project's updatedAt
    const updatedProject = await this.projectEntity
      .findOneAndUpdate(
        { id: data.projectId, ...this.buildUserFilter(context) },
        { updatedAt: timestamp },
        { new: true, runValidators: true }
      )
      .populate({
        path: 'pages',
        populate: [{ path: 'designDocuments' }, { path: 'prdDocuments' }, { path: 'openapiDocuments' }],
      });

    if (!updatedProject) {
      throw new Error('项目不存在');
    }

    return updatedProject;
  }

  /**
   * Delete page
   */
  async deletePage(data: DeletePageRequest): Promise<Project> {
    const context = this.resolveUserContext(data.userId, data.gitId);
    const { page } = await this.findPageInProject(data.projectId, data.pageId, context);
    const timestamp = new Date();

    // Delete page from database
    await this.pageEntity.deleteOne({ id: data.pageId, ...this.buildUserFilter(context) });

    // Remove page reference from project
    const updatedProject = await this.projectEntity
      .findOneAndUpdate(
        { id: data.projectId, ...this.buildUserFilter(context) },
        { $pull: { pages: page._id }, updatedAt: timestamp },
        { new: true, runValidators: true }
      )
      .populate({
        path: 'pages',
        populate: [{ path: 'designDocuments' }, { path: 'prdDocuments' }, { path: 'openapiDocuments' }],
      });

    if (!updatedProject) {
      throw new Error('项目不存在');
    }

    return updatedProject;
  }

  /**
   * Update document status
   */
  async updateDocumentStatus(data: UpdateDocumentStatusRequest): Promise<Project> {
    const context = this.resolveUserContext(data.userId, data.gitId);
    await this.findPageInProject(data.projectId, data.pageId, context);
    const timestamp = new Date();

    const updateData = {
      status: data.status,
      progress: ['synced', 'completed'].includes(data.status) ? 100 : data.status === 'syncing' ? 50 : undefined,
      lastSyncAt: data.status === 'synced' ? timestamp : undefined,
      updatedAt: timestamp,
    };

    // Update document in database
    await this.documentReferenceEntity.updateOne({ id: data.documentId, ...this.buildUserFilter(context) }, updateData);

    // Update page's updatedAt
    await this.pageEntity.updateOne({ id: data.pageId, ...this.buildUserFilter(context) }, { updatedAt: timestamp });

    // Update project's updatedAt
    const updatedProject = await this.projectEntity
      .findOneAndUpdate(
        { id: data.projectId, ...this.buildUserFilter(context) },
        { updatedAt: timestamp },
        { new: true, runValidators: true }
      )
      .populate({
        path: 'pages',
        populate: [{ path: 'designDocuments' }, { path: 'prdDocuments' }, { path: 'openapiDocuments' }],
      });

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
    const context = this.resolveUserContext(data.userId, data.gitId);
    const timestamp = new Date();

    // Verify page exists
    await this.findPageInProject(projectId, pageId, context);

    // Get document reference to fetch the URL
    const document = await this.documentReferenceEntity.findOne({
      id: documentId,
      ...this.buildUserFilter(context),
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
        { id: documentId, ...this.buildUserFilter(context) },
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

    await this.documentReferenceEntity.updateOne({ id: documentId, ...this.buildUserFilter(context) }, updateData);

    const updatedProject = await this.projectEntity
      .findOne({ id: projectId, ...this.buildUserFilter(context) })
      .populate({
        path: 'pages',
        populate: [{ path: 'designDocuments' }, { path: 'prdDocuments' }, { path: 'openapiDocuments' }],
      });

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
    const context = this.resolveUserContext(data.userId, data.gitId);

    // Get document reference
    const document = await this.documentReferenceEntity.findOne(
      {
        _id: documentId,
        ...this.buildUserFilter(context),
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
    const context = this.resolveUserContext(data.userId, data.gitId);
    const timestamp = new Date();

    const document = await this.documentReferenceEntity.findOne({ id, ...this.buildUserFilter(context) });
    if (!document) {
      throw new Error('文档不存在');
    }

    // Extract updatable fields and filter out undefined values
    const { id: _, _id, createdAt, userId, gitId, ...updateFields } = data;
    const updateData = {
      ...Object.fromEntries(Object.entries(updateFields).filter(([_, value]) => value !== undefined)),
      updatedAt: timestamp,
    };

    // Update document in database
    await this.documentReferenceEntity.updateOne({ id, ...this.buildUserFilter(context) }, updateData);

    // Return the updated document
    const updatedDocument = await this.documentReferenceEntity.findOne({ id, ...this.buildUserFilter(context) });
    return updatedDocument!;
  }
}
