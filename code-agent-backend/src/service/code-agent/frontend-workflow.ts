import { runFrontendProjectWorkflow, type FrontendProjectWorkflowCallbacks } from '@fta/agent-core';
import { flattenAnnotation, formatAnnotationSummary } from '@fta/agent-core/dist/utils/annotation';
import { Config, Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import fs from 'fs';
import path from 'path';
import { ModelGatewayConfig } from '../common/model-gateway';
import { ProjectService } from './project';

// 读取 fta-specs 目录，生成 { 文件名: 文件绝对路径 } 的对象作为 specFiles
const ftaSpecsDir = path.join(__dirname, 'fta-specs');
let specFiles: Record<string, string> = {};
if (fs.existsSync(ftaSpecsDir) && fs.statSync(ftaSpecsDir).isDirectory()) {
  const entries = fs.readdirSync(ftaSpecsDir, { withFileTypes: true });
  specFiles = entries
    .filter((entry) => entry.isFile())
    .reduce<Record<string, string>>((acc, entry) => {
      const fileName = entry.name;
      const absolutePath = path.join(ftaSpecsDir, fileName);
      acc[fileName.replace('.md', '')] = absolutePath;
      return acc;
    }, {});
}

export interface FrontendWorkflowOptions {
  designDocId: string;
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
  private projectService: ProjectService;

  @Config('modelGateway.default')
  private modelConfig: ModelGatewayConfig;

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
    const { designDocId, productName, sessionId, callbacks } = options;

    try {
      // 获取 DSL 数据
      const { data: dsl, annotationData } = await this.projectService.getDocumentContent({ documentId: designDocId });

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
      const annotationSummary = formatAnnotationSummary(flattenAnnotation(annotationData));

      // 准备工作目录
      const cwd = this.getWorkflowCwd(sessionId);
      console.log('specFiles===================> ', specFiles);
      // 调用 workflow
      const result = await runFrontendProjectWorkflow({
        cwd,
        designDsl: JSON.stringify(dsl),
        pageAnnotation: annotationSummary,
        productName: productName || 'FTA-Frontend',
        version: '0.0.0',
        specFiles,
        configOverrides: {
          model: this.modelConfig.model,
          planModel: this.modelConfig.model,
        },
        callbacks,
        apiKey: this.modelConfig.apiKey,
        baseURL: this.modelConfig.baseURL,
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
