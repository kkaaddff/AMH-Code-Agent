import type { FrontendProjectWorkflowCallbacks } from '@fta/agent-core';
import { Config, Inject, Provide, Scope, ScopeEnum } from '@midwayjs/core';
import path from 'path';
import { DesignDSL } from '../../types';
import { ModelGatewayConfig } from '../common/model-gateway';
import { DesignDSLService } from './design-dsl';
import { ProjectService } from './project';
import { TreeNode } from '../../dto/code-agent/frontend-workflow.dto';

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
      const { data: dsl, annotationData } = await this.projectService.getDocumentContent({
        documentId: designDocId,
      });

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

      const processedDSL = await this.designDSLService.processDesignDSL(dsl as DesignDSL);

      // 获取 annotation 摘要
      const annotationSummary = formatAnnotationSummary(flattenAnnotation(annotationData.rootAnnotation));

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

      // 调用 workflow
      const result = await runFrontendProjectWorkflow({
        cwd,
        srcTree,
        designDsl: JSON.stringify(processedDSL),
        pageAnnotation: annotationSummary,
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
}
