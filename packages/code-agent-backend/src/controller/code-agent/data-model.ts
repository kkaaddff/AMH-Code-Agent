import { Body, Controller, Del, Get, Inject, Param, Post, Put } from '@midwayjs/decorator';
import { Context } from '@midwayjs/web';
import { CreateNewDataModelRequest, UpdateNewDataModelRequest } from '../../dto/code-agent/req';
import {
  CreateNewDataModelResponse,
  DeleteNewDataModelResponse,
  NewDataModelDetailResponse,
  NewDataModelListResponse,
  UpdateNewDataModelResponse,
} from '../../dto/code-agent/res';
import { DataModelService } from '../../service/code-agent/data-model';

@Controller('/code-agent/data-model')
export class DataModelController {
  @Inject()
  private ctx: Context;

  @Inject()
  private dataModelService: DataModelService;

  /**
   * 创建数据模型
   */
  @Post('/')
  async create(@Body() body: CreateNewDataModelRequest): Promise<CreateNewDataModelResponse> {
    try {
      const dataModel = await this.dataModelService.create(body);
      return new CreateNewDataModelResponse(dataModel);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 更新数据模型
   */
  @Put('/:id')
  async update(@Param('id') id: string, @Body() body: UpdateNewDataModelRequest): Promise<UpdateNewDataModelResponse> {
    try {
      const dataModel = await this.dataModelService.update(id, body);
      return new UpdateNewDataModelResponse(dataModel);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 删除数据模型
   */
  @Del('/:id')
  async delete(@Param('id') id: string): Promise<DeleteNewDataModelResponse> {
    try {
      await this.dataModelService.delete(id);
      return new DeleteNewDataModelResponse();
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 获取项目的所有数据模型
   */
  @Get('/project/:projectId')
  async getByProjectId(@Param('projectId') projectId: string): Promise<NewDataModelListResponse> {
    try {
      const dataModels = await this.dataModelService.getByProjectId(projectId);
      return new NewDataModelListResponse(dataModels);
    } catch (error) {
      this.ctx.status = 500;
      throw error;
    }
  }

  /**
   * 获取分组内的数据模型
   */
  @Get('/group/:groupId')
  async getByGroupId(@Param('groupId') groupId: string): Promise<NewDataModelListResponse> {
    try {
      const dataModels = await this.dataModelService.getByGroupId(groupId);
      return new NewDataModelListResponse(dataModels);
    } catch (error) {
      this.ctx.status = 500;
      throw error;
    }
  }

  /**
   * 获取未分组的数据模型
   */
  @Get('/project/:projectId/ungrouped')
  async getUngrouped(@Param('projectId') projectId: string): Promise<NewDataModelListResponse> {
    try {
      const dataModels = await this.dataModelService.getUngrouped(projectId);
      return new NewDataModelListResponse(dataModels);
    } catch (error) {
      this.ctx.status = 500;
      throw error;
    }
  }

  /**
   * 获取单个数据模型详情
   */
  @Get('/:id')
  async getById(@Param('id') id: string): Promise<NewDataModelDetailResponse> {
    try {
      const dataModel = await this.dataModelService.getById(id);
      if (!dataModel) {
        this.ctx.status = 404;
        throw new Error('数据模型不存在');
      }
      return new NewDataModelDetailResponse(dataModel);
    } catch (error) {
      if (this.ctx.status !== 404) {
        this.ctx.status = 500;
      }
      throw error;
    }
  }
}
