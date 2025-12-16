import { Body, Controller, Del, Get, Inject, Param, Post, Put } from '@midwayjs/decorator';
import { Context } from '@midwayjs/web';
import {
  CreateRestApiRequest,
  UpdateRestApiRequest,
} from '../../dto/code-agent/req';
import {
  CreateRestApiResponse,
  DeleteRestApiResponse,
  RestApiDetailResponse,
  RestApiListResponse,
  UpdateRestApiResponse,
} from '../../dto/code-agent/res';
import { RestApiService } from '../../service/code-agent/rest-api';

@Controller('/code-agent/rest-api')
export class RestApiController {
  @Inject()
  private ctx: Context;

  @Inject()
  private restApiService: RestApiService;

  /**
   * 创建 REST API
   */
  @Post('/')
  async create(@Body() body: CreateRestApiRequest): Promise<CreateRestApiResponse> {
    try {
      const restApi = await this.restApiService.create(body);
      return new CreateRestApiResponse(restApi);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 更新 REST API
   */
  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateRestApiRequest
  ): Promise<UpdateRestApiResponse> {
    try {
      const restApi = await this.restApiService.update(id, body);
      return new UpdateRestApiResponse(restApi);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 删除 REST API
   */
  @Del('/:id')
  async delete(@Param('id') id: string): Promise<DeleteRestApiResponse> {
    try {
      await this.restApiService.delete(id);
      return new DeleteRestApiResponse();
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 获取项目的所有 REST API
   */
  @Get('/project/:projectId')
  async getByProjectId(@Param('projectId') projectId: string): Promise<RestApiListResponse> {
    try {
      const restApis = await this.restApiService.getByProjectId(projectId);
      return new RestApiListResponse(restApis);
    } catch (error) {
      this.ctx.status = 500;
      throw error;
    }
  }

  /**
   * 获取组内的所有 REST API
   */
  @Get('/group/:groupId')
  async getByGroupId(@Param('groupId') groupId: string): Promise<RestApiListResponse> {
    try {
      const restApis = await this.restApiService.getByGroupId(groupId);
      return new RestApiListResponse(restApis);
    } catch (error) {
      this.ctx.status = 500;
      throw error;
    }
  }

  /**
   * 获取项目内未分组的 REST API
   */
  @Get('/project/:projectId/ungrouped')
  async getUngrouped(@Param('projectId') projectId: string): Promise<RestApiListResponse> {
    try {
      const restApis = await this.restApiService.getUngrouped(projectId);
      return new RestApiListResponse(restApis);
    } catch (error) {
      this.ctx.status = 500;
      throw error;
    }
  }

  /**
   * 获取单个 REST API 详情
   */
  @Get('/:id')
  async getById(@Param('id') id: string): Promise<RestApiDetailResponse> {
    try {
      const restApi = await this.restApiService.getById(id);
      if (!restApi) {
        this.ctx.status = 404;
        throw new Error('REST API 不存在');
      }
      return new RestApiDetailResponse(restApi);
    } catch (error) {
      if (this.ctx.status !== 404) {
        this.ctx.status = 500;
      }
      throw error;
    }
  }
}

