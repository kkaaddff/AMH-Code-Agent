import {
  Body,
  Controller,
  Get,
  Inject,
  Post,
  Query,
} from "@midwayjs/decorator";
import { Context } from "@midwayjs/web";
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
} from "../../dto/code-agent/req";
import {
  CreatePageResponse,
  CreateProjectResponse,
  DeletePageResponse,
  DeleteProjectResponse,
  GetDocumentContentResponse,
  PageDetailResponse,
  ProjectDetailResponse,
  ProjectListResponse,
  SyncDocumentResponse,
  UpdateDocumentResponse,
  UpdateDocumentStatusResponse,
  UpdatePageResponse,
  UpdateProjectResponse,
} from "../../dto/code-agent/res";
import { DocumentReference } from "../../entity/code-agent";
import { ProjectService } from "../../service/code-agent/project";

@Controller("/code-agent/project")
export class ProjectController {
  @Inject()
  private ctx: Context;

  @Inject()
  private projectService: ProjectService;

  /**
   * 获取项目列表
   */
  @Get("/list")
  async getProjects(
    @Query() query: ProjectListRequest
  ): Promise<ProjectListResponse> {
    try {
      const { projects, total } = await this.projectService.getProjects(query);
      return new ProjectListResponse(
        projects,
        total,
        query.page || 1,
        query.size || 10
      );
    } catch (error) {
      this.ctx.status = 500;
      throw error;
    }
  }

  /**
   * 创建项目
   */
  @Post("/create")
  async createProject(
    @Body() body: CreateProjectRequest
  ): Promise<CreateProjectResponse> {
    try {
      const project = await this.projectService.createProject(body);
      return new CreateProjectResponse(project);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 更新项目
   */
  @Post("/update")
  async updateProject(
    @Body() body: { id: string } & UpdateProjectRequest
  ): Promise<UpdateProjectResponse> {
    try {
      const project = await this.projectService.updateProject(body.id, body);
      return new UpdateProjectResponse(project);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 删除项目
   */
  @Post("/delete")
  async deleteProject(
    @Body() body: DeleteProjectRequest
  ): Promise<DeleteProjectResponse> {
    try {
      await this.projectService.deleteProject(body);
      return new DeleteProjectResponse();
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 获取项目详情
   */
  @Get("/detail")
  async getProjectDetail(
    @Query() query: GetProjectDetailRequest
  ): Promise<ProjectDetailResponse> {
    try {
      const project = await this.projectService.getProjectDetail(query);
      return new ProjectDetailResponse(project);
    } catch (error) {
      this.ctx.status = 404;
      throw error;
    }
  }

  /**
   * 创建页面
   */
  @Post("/page/create")
  async createPage(
    @Body() body: CreatePageRequest
  ): Promise<CreatePageResponse> {
    try {
      const project = await this.projectService.createPage(body);
      return new CreatePageResponse(project);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 更新页面
   */
  @Post("/page/update")
  async updatePage(
    @Body() body: UpdatePageRequest
  ): Promise<UpdatePageResponse> {
    try {
      const project = await this.projectService.updatePage(body);
      return new UpdatePageResponse(project);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 删除页面
   */
  @Post("/page/delete")
  async deletePage(
    @Body() body: DeletePageRequest
  ): Promise<DeletePageResponse> {
    try {
      const project = await this.projectService.deletePage(body);
      return new DeletePageResponse(project);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 获取页面详情
   */
  @Get("/page/detail")
  async getPageDetail(
    @Query() query: GetPageDetailRequest
  ): Promise<PageDetailResponse> {
    try {
      const page = await this.projectService.findPage(query);
      return new PageDetailResponse(page);
    } catch (error) {
      this.ctx.status = 404;
      throw error;
    }
  }

  /**
   * 更新文档状态
   */
  @Post("/document/status")
  async updateDocumentStatus(
    @Body() body: UpdateDocumentStatusRequest
  ): Promise<UpdateDocumentStatusResponse> {
    try {
      const project = await this.projectService.updateDocumentStatus(body);
      return new UpdateDocumentStatusResponse(project);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 同步文档
   */
  @Post("/document/sync")
  async syncDocument(
    @Body() body: SyncDocumentRequest
  ): Promise<SyncDocumentResponse> {
    try {
      const project = await this.projectService.syncDocument(body);
      return new SyncDocumentResponse(project);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 更新文档内容
   */
  @Post("/document/update")
  async updateDocument(
    @Body() body: DocumentReference
  ): Promise<UpdateDocumentResponse> {
    try {
      const document = await this.projectService.updateDocument(body);
      return new UpdateDocumentResponse(document);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 获取文档内容
   */
  @Get("/document/content")
  async getDocumentContent(
    @Query() query: GetDocumentContentRequest
  ): Promise<GetDocumentContentResponse> {
    try {
      const content = await this.projectService.getDocumentContent(query);
      return new GetDocumentContentResponse(content);
    } catch (error) {
      this.ctx.status = 404;
      throw error;
    }
  }
}
