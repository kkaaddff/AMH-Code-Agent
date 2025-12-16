import type { FrontendProjectWorkflowCallbacks } from '@fta/agent-core';
import { runFrontendProjectWorkflow } from '@fta/agent-core';
import { flattenAnnotation, formatAnnotationSummary } from '@fta/agent-core/dist/utils/annotation';
import { Config, Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import path from 'path';
import { DesignData, DesignNode } from '../../types';
import { ModelGatewayConfig } from '../common/model-gateway';
import { DesignDSLService } from './design-dsl';
import { ProjectService } from './project';
import { DataModelService } from './data-model';
import { RestApiService } from './rest-api';
import { TreeNode } from '../../dto/code-agent/frontend-workflow.dto';
import { DataModel } from '../../entity/code-agent/data-model';
import { RestApi } from '../../entity/code-agent/rest-api';
import { minifyDSL } from '../../utils/minify';

const ftaSpecsDir = path.join(__dirname, 'fta-specs');
const ftaPromptsNewPath = path.join(__dirname, 'fta-prompts', 'frontend-project-new.md');
const ftaComponentsDir = path.join(__dirname, 'fta-components');

export interface FrontendWorkflowOptions {
  designDocId: string;
  productName?: string;
  sessionId: string;
  signal?: AbortSignal;
  callbacks?: FrontendProjectWorkflowCallbacks;
  srcTree?: TreeNode;
  apiKey?: string;
  baseURL?: string;
  model?: string;
  toolProxy?: (toolName: string, params: any) => Promise<any>;
}

export interface FrontendWorkflowResult {
  success: boolean;
  sessionId: string;
  filesCount?: number;
  files?: Array<{ path: string; kind: string }>;
  workflowLogPath?: string;
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

  @Inject()
  private dataModelService: DataModelService;

  @Inject()
  private restApiService: RestApiService;

  @Config('modelGateway.default')
  private modelConfig: ModelGatewayConfig;

  @Inject()
  private designDSLService: DesignDSLService;

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
    const { designDocId, productName, sessionId, signal, callbacks, srcTree, apiKey, baseURL, model } = options;
    const workflowStartTime = Date.now();

    // 优先使用入参，其次使用 modelConfig，都没有则报错
    const finalApiKey = apiKey || this.modelConfig?.apiKey;
    const finalBaseURL = baseURL || this.modelConfig?.baseURL;
    const finalModel = model || this.modelConfig?.model;

    if (!finalApiKey || !finalBaseURL) {
      const missingParams: string[] = [];
      if (!finalApiKey) missingParams.push('apiKey');
      if (!finalBaseURL) missingParams.push('baseURL');
      return {
        success: false,
        sessionId,
        error: {
          message: `缺少必需的模型配置参数: ${missingParams.join(', ')}。请通过请求参数或配置文件提供。`,
          name: 'MissingModelConfigError',
        },
      };
    }

    console.log(`frontend-workflow: [${sessionId}] 🏭 开始执行前端工作流服务`);

    try {
      // 获取 DSL 数据
      const documentContent = await this.projectService.getDocumentContent({
        documentId: designDocId,
      });
      const { data: dsl, annotationData, pageId } = documentContent;

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

      const processedDSL = await this.designDSLService.processDesignDSL(dsl as DesignData);
      const filteredDSL = {
        ...processedDSL,
        dsl: minifyDSL({
          ...processedDSL.dsl,
          nodes: this.filterVisibleNodes(processedDSL.dsl.nodes),
        }),
      };

      // 获取项目关联的数据模型和 REST API
      let dataModels: DataModel[] = [];
      let restApis: RestApi[] = [];
      if (pageId) {
        try {
          // 从 page 获取 projectId
          const page = await this.projectService.findPage({ pageId });
          if (page?.projectId) {
            const [models, apis] = await Promise.all([
              this.dataModelService.getByProjectId(page.projectId),
              this.restApiService.getByProjectId(page.projectId),
            ]);
            dataModels = models;
            restApis = apis;
            console.log(
              `frontend-workflow: [${sessionId}] 📊 获取到 ${dataModels.length} 个数据模型，${restApis.length} 个 REST API`
            );
          }
        } catch (error) {
          console.warn(`frontend-workflow: [${sessionId}] ⚠️ 获取数据模型失败，继续执行工作流`, error);
        }
      }

      // 获取 annotation 摘要，传入数据模型映射表以解析 dataModelId
      const dataModelMap = new Map(dataModels.map((m) => [m.id, m.name]));
      const annotationSummary = formatAnnotationSummary(flattenAnnotation(annotationData.rootAnnotation, dataModelMap));
      // 格式化数据模型和 REST API 为工作流可用格式
      const dataContextSummary = this.formatMockDataContext(dataModels, restApis);

      // 准备工作目录

      const cwd = this.getWorkflowCwd(sessionId);
      // 如果收到 abort 信号，抛出 AbortError
      if (signal?.aborted) {
        console.log(`frontend-workflow: [${sessionId}] ⛔️ 检测到中断信号，工作流在启动前被中止`);
        const error = new Error('Workflow aborted before start');
        error.name = 'AbortError';
        throw error;
      }

      console.log(`frontend-workflow: [${sessionId}] 🚀 开始调用核心工作流引擎`);
      const workflowEngineStart = Date.now();

      // 组合页面标注和数据上下文信息
      const fullPageContext = dataContextSummary
        ? annotationSummary + '\n\n---\n\n' + dataContextSummary
        : annotationSummary;
      // 调用 workflow
      const result = await runFrontendProjectWorkflow({
        cwd,
        srcTree,
        designData: JSON.stringify(filteredDSL),
        pageAnnotation: fullPageContext,
        productName: productName || 'FTA-Frontend',
        version: '0.0.0',
        specDirectories: [ftaSpecsDir],
        componentDocDirectories: [ftaComponentsDir],
        promptFilePath: ftaPromptsNewPath,
        rulesFilePath: null,
        configOverrides: {
          model: finalModel,
          planModel: finalModel,
        },
        todoStorageMode: 'memory',
        callbacks: signal
          ? {
              ...callbacks,
              // 包装回调函数，在每次回调时检查 abort 信号
              onMessage: callbacks?.onMessage
                ? async (opts) => {
                    if (signal.aborted) {
                      console.log(`frontend-workflow: [${sessionId}] ⏹️ 在消息回调中检测到中断信号`);
                      const error = new Error('Workflow aborted during execution');
                      error.name = 'AbortError';
                      throw error;
                    }
                    return callbacks.onMessage!(opts);
                  }
                : undefined,
              onText: callbacks?.onText
                ? async (text) => {
                    if (signal.aborted) {
                      console.log(`frontend-workflow: [${sessionId}] ⏹️ 在文本回调中检测到中断信号`);
                      const error = new Error('Workflow aborted during execution');
                      error.name = 'AbortError';
                      throw error;
                    }
                    return callbacks.onText!(text);
                  }
                : undefined,
            }
          : callbacks,
        apiKey: finalApiKey,
        baseURL: finalBaseURL,
        toolProxy: options.toolProxy,
      });

      const workflowEngineDuration = Date.now() - workflowEngineStart;
      const totalWorkflowDuration = Date.now() - workflowStartTime;

      console.log(
        `frontend-workflow: [${sessionId}] ✅ 核心工作流引擎执行完成 (引擎耗时: ${(
          workflowEngineDuration / 1000
        ).toFixed(2)}秒, 总耗时: ${(totalWorkflowDuration / 1000).toFixed(2)}秒)`
      );

      if (result.success === true) {
        return {
          success: true,
          sessionId,
          filesCount: result.files.length,
          workflowLogPath: result.workflowLogPath,
          files: result.files.map((f) => ({
            path: f.path,
            kind: f.kind,
          })),
        };
      }

      console.log(`frontend-workflow: [${sessionId}] ❌ 工作流执行失败:`, result.error);
      return {
        success: false,
        sessionId,
        workflowLogPath: result.workflowLogPath,
        error: result.error
          ? {
              message: result.error.message,
              name: result.error.type,
            }
          : undefined,
      };
    } catch (error: any) {
      const totalWorkflowDuration = Date.now() - workflowStartTime;
      console.log(
        `frontend-workflow: [${sessionId}] 💥 工作流执行异常 (总耗时: ${(totalWorkflowDuration / 1000).toFixed(2)}秒):`,
        error
      );
      console.log(`frontend-workflow: [${sessionId}] 🔍 异常详情:`, {
        name: error.name,
        message: error.message,
        stack: error.stack,
      });

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

  private filterVisibleNodes(nodes: DesignNode[]): DesignNode[] {
    return nodes
      .filter((node) => !node.hidden && node.mask !== 'outline')
      .map((node) => {
        if (node.children?.length) {
          return {
            ...node,
            children: this.filterVisibleNodes(node.children),
          };
        }
        return node;
      });
  }

  /**
   * 格式化数据上下文（MockData + REST API）为工作流可用的文本格式
   */
  private formatMockDataContext(dataModels: DataModel[], restApis: RestApi[]): string {
    const sections: string[] = [];

    // 格式化 MockData（含 store + action type）
    if (dataModels && dataModels.length > 0) {
      const mockSection = this.formatMockStores(dataModels);
      if (mockSection) {
        sections.push(mockSection);
      }
    }

    // 格式化 REST API
    if (restApis && restApis.length > 0) {
      const restApiSection = this.formatRestApis(restApis, dataModels);
      sections.push(restApiSection);
    }

    return '# MockData\n\n' + sections.join('\n\n---\n\n');
  }

  /**
   * 格式化 Mock Store 数据
   */
  private formatMockStores(dataModels: DataModel[]): string {
    const modelSections = dataModels
      .filter((model) => model.tsContent && model.tsContent.trim())
      .map((model) => {
        const lines: string[] = [];
        lines.push(`## Store: ${model.name}`);
        if (model.description) lines.push(`Description: ${model.description}`);
        lines.push('```jsonc');
        lines.push(model.tsContent.trim());
        lines.push('```');
        return lines.join('\n');
      });

    if (modelSections.length === 0) {
      return '';
    }

    return modelSections.join('\n\n---\n\n');
  }

  /**
   * 格式化 REST API
   */
  private formatRestApis(restApis: RestApi[], dataModels: DataModel[]): string {
    // 创建数据模型 ID -> 名称的映射
    const modelMap = new Map(dataModels.map((m) => [m.id, m.name]));

    const apiSections = restApis.map((api) => {
      const lines: string[] = [];
      lines.push('## ' + api.name);
      if (api.description) lines.push('Description: ' + api.description);
      if (api.url) lines.push('API: ' + (api.method || 'GET') + ' ' + api.url);
      lines.push('ID: ' + api.id);

      // Request models
      if (api.requestModelIds && api.requestModelIds.length > 0) {
        const modelNames = api.requestModelIds.map((id) => modelMap.get(id) || id).join(', ');
        lines.push('Request Models: ' + modelNames);
      }
      // Response models
      if (api.responseModelIds && api.responseModelIds.length > 0) {
        const modelNames = api.responseModelIds.map((id) => modelMap.get(id) || id).join(', ');
        lines.push('Response Models: ' + modelNames);
      }

      return lines.join('\n');
    });

    return '# REST APIs\n\n' + apiSections.join('\n\n---\n\n');
  }
}
