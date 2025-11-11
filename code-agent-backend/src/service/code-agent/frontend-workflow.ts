import { runFrontendProjectWorkflow, type FrontendProjectWorkflowCallbacks } from '@fta/agent-core';
import { flattenAnnotation, formatAnnotationSummary } from '@fta/agent-core/dist/utils/annotation';
import { Config, Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import path from 'path';
import { DesignComponentAnnotationService } from '../design/component-annotation.service';
import { DesignDocumentService } from '../design/design-document.service';
import { ModelGatewayConfig } from '../common/model-gateway.service';

export interface FrontendWorkflowOptions {
  designDocId: string;
  version?: number;
  productName?: string;
  sessionId: string;
  callbacks?: FrontendProjectWorkflowCallbacks;
}

export interface FrontendWorkflowResult {
  success: boolean;
  sessionId: string;
  filesCount?: number;
  files?: Array<{ path: string; kind: string }>;
  error?: {
    message: string;
    name: string;
  };
}

@Provide()
@Scope(ScopeEnum.Request, { allowDowngrade: true })
export class FrontendWorkflowService {
  @Inject()
  private designDocumentService: DesignDocumentService;

  @Inject()
  private designComponentAnnotationService: DesignComponentAnnotationService;

  @Config('modelGateway.default')
  private modelConfig: ModelGatewayConfig;

  /**
   * 获取设计 DSL 数据
   */
  async getDesignDsl(designDocId: string) {
    const { dsl, revision } = await this.designDocumentService.getDesignDsl(designDocId);
    return { dsl, revision };
  }

  /**
   * 获取组件标注数据并转换为摘要格式
   */
  async getAnnotationSummary(designDocId: string, version?: number): Promise<string> {
    const annotation = await this.designComponentAnnotationService.getLatestAnnotation(designDocId, version);

    if (!annotation?.rootAnnotation) {
      return '';
    }

    return formatAnnotationSummary(flattenAnnotation(annotation.rootAnnotation as any));
  }

  /**
   * 准备工作目录路径
   */
  getWorkflowCwd(sessionId: string): string {
    return path.join(process.cwd(), 'files-cache', 'frontend-projects', sessionId);
  }

  /**
   * 执行前端项目生成工作流
   */
  async runWorkflow(options: FrontendWorkflowOptions): Promise<FrontendWorkflowResult> {
    const { designDocId, version, productName, sessionId, callbacks } = options;

    try {
      // 获取 DSL 数据
      const { dsl } = await this.getDesignDsl(designDocId);

      if (!dsl) {
        return {
          success: false,
          sessionId,
          error: {
            message: `Design document ${designDocId} not found or DSL data is missing`,
            name: 'DesignNotFoundError',
          },
        };
      }

      // 获取 annotation 摘要
      const annotationSummary = await this.getAnnotationSummary(designDocId, version);

      // 准备工作目录
      const cwd = this.getWorkflowCwd(sessionId);

      // 调用 workflow
      const result = await runFrontendProjectWorkflow({
        cwd: process.cwd(),
        designDsl: JSON.stringify(dsl),
        pageAnnotation: annotationSummary,
        productName: productName || 'FTA-Frontend',
        version: '0.0.0',
        specFiles: {},
        configOverrides: {
          model: this.modelConfig.model,
          planModel: this.modelConfig.model,
        },
        callbacks,
      });

      if (result.success === true) {
        return {
          success: true,
          sessionId,
          filesCount: result.files.length,
          files: result.files.map((f) => ({
            path: f.path,
            kind: f.kind,
          })),
        };
      }

      return {
        success: false,
        sessionId,
        error: result.error
          ? {
              message: result.error.message,
              name: result.error.type,
            }
          : undefined,
      };
    } catch (error: any) {
      return {
        success: false,
        sessionId,
        error: {
          message: error?.message || 'Frontend workflow failed',
          name: error?.name || 'WorkflowError',
        },
      };
    }
  }
}
