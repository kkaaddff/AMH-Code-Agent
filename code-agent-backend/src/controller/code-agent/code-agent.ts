import { Body, Controller, Inject, Post } from '@midwayjs/decorator';
import { Context } from '@midwayjs/web';
import { GetGitlabProjectIdRequest } from '../../dto/code-agent/req';
import { GetGitlabProjectIdResponse } from '../../dto/code-agent/res';
import { ProcessDSLDataRequest, ProcessDSLDataResponse } from '../../dto/design-dsl';
import { DesignDSLService } from '../../service/code-agent/design-dsl';
import { GitlabService } from '../../service/code-agent/gitlab.service';
import { DesignData } from '../../types/design-dsl';

@Controller('/code-agent')
export class CodeAgentController {
  @Inject()
  private ctx: Context;

  @Inject()
  private designDSLService: DesignDSLService;

  @Inject()
  private gitlabService: GitlabService;

  /**
   * 处理DesignDSL数据
   */
  @Post('/dsl/process')
  async processDSLData(@Body() body: ProcessDSLDataRequest): Promise<ProcessDSLDataResponse> {
    if (!body.dsl) {
      this.ctx.status = 400;
      throw new Error('DSL data is required');
    }

    const originalDSL = body as unknown as DesignData;
    const processedDSL =
      body.convertPaths === false ? originalDSL : await this.designDSLService.processDesignDSL(originalDSL);
    const stats = await this.designDSLService.getDSLStats(processedDSL);

    return new ProcessDSLDataResponse(processedDSL, stats);
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
