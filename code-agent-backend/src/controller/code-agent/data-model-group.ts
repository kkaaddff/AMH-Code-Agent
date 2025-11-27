import { Body, Controller, Del, Get, Inject, Param, Post, Put } from '@midwayjs/decorator';
import { Context } from '@midwayjs/web';
import {
  CreateDataModelGroupRequest,
  UpdateDataModelGroupRequest,
} from '../../dto/code-agent/req';
import {
  CreateDataModelGroupResponse,
  DataModelGroupDetailResponse,
  DataModelGroupListResponse,
  DeleteDataModelGroupResponse,
  UpdateDataModelGroupResponse,
} from '../../dto/code-agent/res';
import { DataModelGroupService } from '../../service/code-agent/data-model-group';

@Controller('/code-agent/data-model-group')
export class DataModelGroupController {
  @Inject()
  private ctx: Context;

  @Inject()
  private groupService: DataModelGroupService;

  /**
   * 创建数据模型组
   */
  @Post('/')
  async create(@Body() body: CreateDataModelGroupRequest): Promise<CreateDataModelGroupResponse> {
    try {
      const group = await this.groupService.create(body);
      return new CreateDataModelGroupResponse(group);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 更新数据模型组
   */
  @Put('/:id')
  async update(
    @Param('id') id: string,
    @Body() body: UpdateDataModelGroupRequest
  ): Promise<UpdateDataModelGroupResponse> {
    try {
      const group = await this.groupService.update(id, body);
      return new UpdateDataModelGroupResponse(group);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 删除数据模型组
   */
  @Del('/:id')
  async delete(@Param('id') id: string): Promise<DeleteDataModelGroupResponse> {
    try {
      await this.groupService.delete(id);
      return new DeleteDataModelGroupResponse();
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 获取项目的所有数据模型组
   */
  @Get('/project/:projectId')
  async getByProjectId(@Param('projectId') projectId: string): Promise<DataModelGroupListResponse> {
    try {
      const groups = await this.groupService.getByProjectId(projectId);
      return new DataModelGroupListResponse(groups);
    } catch (error) {
      this.ctx.status = 500;
      throw error;
    }
  }

  /**
   * 获取单个数据模型组详情
   */
  @Get('/:id')
  async getById(@Param('id') id: string): Promise<DataModelGroupDetailResponse> {
    try {
      const group = await this.groupService.getById(id);
      if (!group) {
        this.ctx.status = 404;
        throw new Error('数据模型组不存在');
      }
      return new DataModelGroupDetailResponse(group);
    } catch (error) {
      if (this.ctx.status !== 404) {
        this.ctx.status = 500;
      }
      throw error;
    }
  }
}

