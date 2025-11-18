import { Body, Controller, Get, Inject, Post, Query } from '@midwayjs/decorator';
import { Context } from '@midwayjs/web';
import * as path from 'path';
import {
  ConvertPathRequest,
  ConvertPathResponse,
  GetDSLDataResponse,
  ProcessDSLDataRequest,
  ProcessDSLDataResponse,
  RedisGetResponse,
  RedisSetRequest,
  RedisSetResponse,
} from '../../dto/design-dsl';
import { GetGitlabProjectIdRequest } from '../../dto/code-agent/req';
import { GetGitlabProjectIdResponse } from '../../dto/code-agent/res';
import { DesignDSLService } from '../../service/code-agent/design-dsl';
import { GitlabService } from '../../service/code-agent/gitlab.service';
import { DesignDSL } from '../../types/design-dsl';

@Controller('/code-agent')
export class CodeAgentController {
  @Inject()
  private ctx: Context;

  @Inject()
  private designDSLService: DesignDSLService;

  @Inject()
  private gitlabService: GitlabService;

  /**
   * 获取DSLData原始数据
   */
  @Get('/dsl')
  async getDSLData(): Promise<GetDSLDataResponse> {
    const dslPath = path.join(process.cwd(), 'DesignDSL.json');
    const dslData = await this.designDSLService.readDesignDSLFile(dslPath);
    return new GetDSLDataResponse(dslData);
  }

  /**
   * 处理DesignDSL数据
   */
  @Post('/dsl/process')
  async processDSLData(@Body() body: ProcessDSLDataRequest): Promise<ProcessDSLDataResponse> {
    if (!body.dsl) {
      this.ctx.status = 400;
      throw new Error('DSL data is required');
    }

    const originalDSL = body as unknown as DesignDSL;
    const processedDSL =
      body.convertPaths === false ? originalDSL : await this.designDSLService.processDesignDSL(originalDSL);
    const stats = await this.designDSLService.getDSLStats(processedDSL);

    return new ProcessDSLDataResponse(processedDSL, stats);
  }

  /**
   * 获取Redis缓存
   */
  @Get('/dsl/cache')
  async getDslCache(@Query('key') key?: string): Promise<RedisGetResponse> {
    if (!key) {
      this.ctx.status = 400;
      return new RedisGetResponse(null);
    }
    const value = await this.designDSLService.redisGet(key);
    return new RedisGetResponse(value);
  }

  /**
   * 设置Redis缓存
   */
  @Post('/dsl/cache')
  async setDslCache(@Body() body: RedisSetRequest): Promise<RedisSetResponse> {
    if (!body?.key || typeof body.value !== 'string') {
      this.ctx.status = 400;
      return new RedisSetResponse(false);
    }
    await this.designDSLService.redisSet(body.key, body.value, body.ttlSeconds);
    return new RedisSetResponse(true);
  }

  /**
   * 获取 GitLab 项目 ID
   */
  @Post('/gitlab/project-id')
  async getGitlabProjectId(@Body() body: GetGitlabProjectIdRequest): Promise<GetGitlabProjectIdResponse> {
    if (!body.gitUrl) {
      this.ctx.status = 400;
      throw new Error('GitLab URL is required');
    }

    try {
      const gitId = await this.gitlabService.getGitlabProjectId(body.gitUrl);
      return new GetGitlabProjectIdResponse(gitId);
    } catch (error: any) {
      this.ctx.status = error.message.includes('not found') ? 404 : 500;
      throw error;
    }
  }
}
