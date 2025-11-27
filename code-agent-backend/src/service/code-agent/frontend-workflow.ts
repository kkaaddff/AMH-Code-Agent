import type { FrontendProjectWorkflowCallbacks } from '@fta/agent-core';
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

let agentCorePromise: Promise<typeof import('@fta/agent-core')> | null = null;
let annotationUtilsPromise: Promise<typeof import('@fta/agent-core/dist/utils/annotation')> | null = null;

const getAgentCore = () => {
  if (!agentCorePromise) {
    agentCorePromise = import('@fta/agent-core');
  }
  return agentCorePromise;
};

const getAnnotationUtils = () => {
  if (!annotationUtilsPromise) {
    annotationUtilsPromise = import('@fta/agent-core/dist/utils/annotation');
  }
  return annotationUtilsPromise;
};

const ftaSpecsDir = path.join(__dirname, 'fta-specs');
const ftaPromptsPath = path.join(__dirname, 'fta-prompts', 'frontend-project.md');
const ftaPromptsNewPath = path.join(__dirname, 'fta-prompts', 'frontend-project-new.md');
const ftaRulesPath = path.join(__dirname, 'fta-prompts', 'fta-project-spec-4agent.md');
const ftaComponentsDir = path.join(__dirname, 'fta-components');

export interface FrontendWorkflowOptions {
  designDocId: string;
  productName?: string;
  sessionId: string;
  signal?: AbortSignal;
  callbacks?: FrontendProjectWorkflowCallbacks;
  srcTree?: TreeNode;
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
    const { designDocId, productName, sessionId, signal, callbacks, srcTree } = options;
    const workflowStartTime = Date.now();

    console.log(`frontend-workflow: [${sessionId}] 🏭 开始执行前端工作流服务`);

    const [{ runFrontendProjectWorkflow }, { flattenAnnotation, formatAnnotationSummary }] = await Promise.all([
      getAgentCore(),
      getAnnotationUtils(),
    ]);

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
        dsl: {
          ...processedDSL.dsl,
          nodes: this.filterVisibleNodes(processedDSL.dsl.nodes),
        },
      };

      // 获取 annotation 摘要
      const annotationSummary = formatAnnotationSummary(flattenAnnotation(annotationData.rootAnnotation));

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
            console.log(`frontend-workflow: [${sessionId}] 📊 获取到 ${dataModels.length} 个数据模型，${restApis.length} 个 REST API`);
          }
        } catch (error) {
          console.warn(`frontend-workflow: [${sessionId}] ⚠️ 获取数据模型失败，继续执行工作流`, error);
        }
      }

      // 格式化数据模型和 REST API 为工作流可用格式
      const dataContextSummary = this.formatDataContext(dataModels, restApis);

      // 准备工作目录

      const cwd = this.getWorkflowCwd(sessionId);
      // 如果收到 abort 信号，抛出 AbortError
      if (signal?.aborted) {
        console.log(`frontend-workflow: [${sessionId}] ⏹️ 检测到中断信号，工作流在启动前被中止`);
        const error = new Error('Workflow aborted before start');
        error.name = 'AbortError';
        throw error;
      }

      console.log(`frontend-workflow: [${sessionId}] 🚀 开始调用核心工作流引擎`);
      const workflowEngineStart = Date.now();

      // 组合页面标注和数据上下文信息
      const fullPageContext = dataContextSummary
        ? `${annotationSummary}\n\n---\n\n${dataContextSummary}`
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
        rulesFilePath: ftaRulesPath,
        configOverrides: {
          model: this.modelConfig.model,
          planModel: this.modelConfig.model,
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
        apiKey: this.modelConfig.apiKey,
        baseURL: this.modelConfig.baseURL,
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
   * 格式化数据上下文（数据模型 + REST API）为工作流可用的文本格式
   */
  private formatDataContext(dataModels: DataModel[], restApis: RestApi[]): string {
    const sections: string[] = [];

    // 格式化数据模型
    if (dataModels && dataModels.length > 0) {
      const dataModelSection = this.formatDataModels(dataModels);
      sections.push(dataModelSection);
    }

    // 格式化 REST API
    if (restApis && restApis.length > 0) {
      const restApiSection = this.formatRestApis(restApis, dataModels);
      sections.push(restApiSection);
    }

    return sections.join('\n\n---\n\n');
  }

  /**
   * 格式化数据模型
   */
  private formatDataModels(dataModels: DataModel[]): string {
    const formatSchema = (fields: any[], indent = 2): string => {
      if (!fields || fields.length === 0) return '无';

      return fields
        .map((field) => {
          const prefix = ' '.repeat(indent);
          let result = `${prefix}- ${field.name}: ${field.type}`;
          if (field.description) result += ` // ${field.description}`;
          if (field.required) result += ' (必填)';
          if (field.enum?.length) result += ` [${field.enum.join(', ')}]`;

          if (field.properties?.length) {
            result += '\n' + formatSchema(field.properties, indent + 2);
          }
          if (field.items) {
            result += ` (元素类型: ${field.items.type})`;
            if (field.items.properties?.length) {
              result += '\n' + formatSchema(field.items.properties, indent + 2);
            }
          }

          return result;
        })
        .join('\n');
    };

    const modelSections = dataModels.map((model) => {
      const lines: string[] = [];
      lines.push(`## ${model.name}`);
      if (model.description) lines.push(`描述: ${model.description}`);
      lines.push(`ID: ${model.id}`);
      lines.push('');
      lines.push('### Schema');
      lines.push(formatSchema(model.schema));
      return lines.join('\n');
    });

    return `# 数据模型\n\n${modelSections.join('\n\n---\n\n')}`;
  }

  /**
   * 格式化 REST API
   */
  private formatRestApis(restApis: RestApi[], dataModels: DataModel[]): string {
    // 创建数据模型 ID -> 名称的映射
    const modelMap = new Map(dataModels.map((m) => [m.id, m.name]));

    const apiSections = restApis.map((api) => {
      const lines: string[] = [];
      lines.push(`## ${api.name}`);
      if (api.description) lines.push(`描述: ${api.description}`);
      if (api.url) lines.push(`API 地址: ${api.method || 'GET'} ${api.url}`);
      lines.push(`ID: ${api.id}`);

      // 关联的请求数据模型
      if (api.requestModelIds && api.requestModelIds.length > 0) {
        const modelNames = api.requestModelIds.map((id) => modelMap.get(id) || id).join(', ');
        lines.push(`请求数据模型: ${modelNames}`);
      }
      // 关联的响应数据模型
      if (api.responseModelIds && api.responseModelIds.length > 0) {
        const modelNames = api.responseModelIds.map((id) => modelMap.get(id) || id).join(', ');
        lines.push(`响应数据模型: ${modelNames}`);
      }

      return lines.join('\n');
    });

    return `# REST API 接口\n\n${apiSections.join('\n\n---\n\n')}`;
  }
}
