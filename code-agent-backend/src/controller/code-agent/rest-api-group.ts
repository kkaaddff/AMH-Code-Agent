import { Body, Controller, Del, Get, Inject, Param, Post, Put } from '@midwayjs/decorator';
import { Context } from '@midwayjs/web';
import {
  CreateRestApiGroupRequest,
  UpdateRestApiGroupRequest,
  SyncRestApiGroupRequest,
} from '../../dto/code-agent/req';
import {
  CreateRestApiGroupResponse,
  RestApiGroupDetailResponse,
  RestApiGroupListResponse,
  DeleteRestApiGroupResponse,
  UpdateRestApiGroupResponse,
  SyncRestApiGroupResponse,
} from '../../dto/code-agent/res';
import { RestApiGroupService } from '../../service/code-agent/rest-api-group';

@Controller('/code-agent/rest-api-group')
export class RestApiGroupController {
  @Inject()
  private ctx: Context;

  @Inject()
  private groupService: RestApiGroupService;

  /**
   * 创建 REST API 组
   */
  @Post('/')
  async create(@Body() body: CreateRestApiGroupRequest): Promise<CreateRestApiGroupResponse> {
    try {
      const group = await this.groupService.create(body);
      return new CreateRestApiGroupResponse(group);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 更新 REST API 组
   */
  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateRestApiGroupRequest
  ): Promise<UpdateRestApiGroupResponse> {
    try {
      const group = await this.groupService.update(id, body);
      return new UpdateRestApiGroupResponse(group);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 删除 REST API 组
   */
  @Del('/:id')
  async delete(@Param('id') id: string): Promise<DeleteRestApiGroupResponse> {
    try {
      await this.groupService.delete(id);
      return new DeleteRestApiGroupResponse();
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 获取项目的所有 REST API 组
   */
  @Get('/project/:projectId')
  async getByProjectId(@Param('projectId') projectId: string): Promise<RestApiGroupListResponse> {
    try {
      const groups = await this.groupService.getByProjectId(projectId);
      return new RestApiGroupListResponse(groups);
    } catch (error) {
      this.ctx.status = 500;
      throw error;
    }
  }

  /**
   * 获取单个 REST API 组详情
   */
  @Get('/:id')
  async getById(@Param('id') id: string): Promise<RestApiGroupDetailResponse> {
    try {
      const group = await this.groupService.getById(id);
      if (!group) {
        this.ctx.status = 404;
        throw new Error('REST API 组不存在');
      }
      return new RestApiGroupDetailResponse(group);
    } catch (error) {
      if (this.ctx.status !== 404) {
        this.ctx.status = 500;
      }
      throw error;
    }
  }

  /**
   * 同步远程 OpenAPI 文档
   */
  @Post('/:id/sync')
  async sync(
    @Param('id') id: string,
    @Body() body: SyncRestApiGroupRequest
  ): Promise<SyncRestApiGroupResponse> {
    try {
      const result = await this.groupService.sync(id, body.syncUrl);
      return new SyncRestApiGroupResponse(result.syncedCount, result.apis);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }
}

