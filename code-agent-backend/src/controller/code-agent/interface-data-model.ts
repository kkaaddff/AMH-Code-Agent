import { Body, Controller, Del, Get, Inject, Param, Post, Put, Query } from '@midwayjs/decorator';
import { Context } from '@midwayjs/web';
import {
  CreateDataModelRequest,
  DeleteDataModelRequest,
  GetDataModelByIdRequest,
  GetDataModelsRequest,
  UpdateDataModelRequest,
} from '../../dto/code-agent/req';
import {
  CreateDataModelResponse,
  DataModelDetailResponse,
  DataModelListResponse,
  DeleteDataModelResponse,
  UpdateDataModelResponse,
} from '../../dto/code-agent/res';
import { InterfaceDataModelService } from '../../service/code-agent/interface-data-model';

@Controller('/code-agent/interface-data-model')
export class InterfaceDataModelController {
  @Inject()
  private ctx: Context;

  @Inject()
  private dataModelService: InterfaceDataModelService;

  /**
   * 创建数据模型
   */
  @Post('/')
  async createDataModel(@Body() body: CreateDataModelRequest): Promise<CreateDataModelResponse> {
    try {
      const dataModel = await this.dataModelService.createDataModel(body);
      return new CreateDataModelResponse(dataModel);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 更新数据模型
   */
  @Put('/:id')
  async updateDataModel(
    @Param('id') id: string,
    @Body() body: UpdateDataModelRequest
  ): Promise<UpdateDataModelResponse> {
    try {
      const dataModel = await this.dataModelService.updateDataModel(id, body);
      return new UpdateDataModelResponse(dataModel);
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 删除数据模型
   */
  @Del('/:id')
  async deleteDataModel(@Param('id') id: string): Promise<DeleteDataModelResponse> {
    try {
      await this.dataModelService.deleteDataModel(id);
      return new DeleteDataModelResponse();
    } catch (error) {
      this.ctx.status = 400;
      throw error;
    }
  }

  /**
   * 获取页面的所有数据模型
   */
  @Get('/page/:pageId')
  async getDataModels(@Param('pageId') pageId: string): Promise<DataModelListResponse> {
    try {
      const dataModels = await this.dataModelService.getDataModels(pageId);
      return new DataModelListResponse(dataModels);
    } catch (error) {
      this.ctx.status = 500;
      throw error;
    }
  }

  /**
   * 获取单个数据模型详情
   */
  @Get('/:id')
  async getDataModelById(@Param('id') id: string): Promise<DataModelDetailResponse> {
    try {
      const dataModel = await this.dataModelService.getDataModelById(id);
      if (!dataModel) {
        this.ctx.status = 404;
        throw new Error('数据模型不存在');
      }
      return new DataModelDetailResponse(dataModel);
    } catch (error) {
      if (this.ctx.status !== 404) {
        this.ctx.status = 500;
      }
      throw error;
    }
  }
}
