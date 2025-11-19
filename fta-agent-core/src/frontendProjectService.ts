import type { LanguageModelV2Message } from '@ai-sdk/provider';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'pathe';
import type { Config } from './config';
import { Context } from './context';
import { JsonlLogger, RequestLogger } from './jsonl';
import { LlmsContext } from './llmsContext';
import { runLoop, type LoopResult } from './loop';
import type { NormalizedMessage } from './message';
import { resolveModelWithContext } from './model';
import type { ProjectTaskCallbacks } from './project';
import { generateFrontendProjectPrompt } from './prompts/frontendProject';
import { Session } from './session';
import type { Tool } from './tool';
import { Tools } from './tool';
import { createFileDraftTool, FileDraftStore } from './tools/fileDraft';
import { createComponentDocReaderTool } from './tools/componentDocReader';
import { createSpecReaderTool, loadSpecsFromDirectories } from './tools/specReader';
import { createInMemoryTodoStorage, createTodoTool } from './tools/todo';
import { randomUUID } from './utils/randomUUID';

export type FrontendProjectWorkflowCallbacks = ProjectTaskCallbacks;

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

export type FrontendProjectWorkflowOptions = {
  designDsl: string;
  srcTree?: TreeNode;
  pageAnnotation: string;
  productName: string;
  version: string;
  specDirectories?: string[];
  componentDocDirectories?: string[];
  cwd?: string;
  configOverrides?: Partial<Config>;
  callbacks?: FrontendProjectWorkflowCallbacks;
  rulesFilePath?: string;
  promptFilePath?: string;
  apiKey: string;
  baseURL: string;
  todoStorageMode?: 'file' | 'memory';
};

export type FrontendProjectWorkflowResult =
  | {
      success: true;
      files: FileDraftStore['drafts'];
      loopResult: Extract<LoopResult, { success: true }>;
      workflowLogPath: string;
    }
  | {
      success: false;
      error: Extract<LoopResult, { success: false }>['error'];
      files: FileDraftStore['drafts'];
      workflowLogPath: string;
    };
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const defaultRulesFilePath = path.join(__dirname, 'prompts/fta-project-spec-4agent.md');

type WorkflowHistoryLog = {
  sessionId: string;
  startedAt: string;
  finishedAt: string;
  initialMessages: LanguageModelV2Message[];
  context: {
    cwd: string;
    productName: string;
    version: string;
    specDirectories?: string[];
    componentDocDirectories?: string[];
    hasSrcTree: boolean;
  };
  history: Array<NormalizedMessage & { sessionId: string }>;
  files: FileDraftStore['drafts'];
};

/**
 * 将目录树转换为紧凑的路径列表格式
 * 只输出文件路径和空目录，中间目录通过路径自然体现
 * 空目录以 / 结尾标记
 */
function formatTreeToCompactList(node: TreeNode, basePath = ''): string {
  const lines: string[] = [];

  function traverse(current: TreeNode, parentPath: string) {
    const fullPath = parentPath ? `${parentPath}/${current.name}` : current.name;

    if (current.type === 'directory') {
      if (!current.children || current.children.length === 0) {
        // 空目录直接加入
        lines.push(`${fullPath}/`);
      } else {
        // 递归子节点
        for (const child of current.children) {
          traverse(child, fullPath);
        }
      }
    } else {
      // 文件直接加入
      lines.push(fullPath);
    }
  }

  traverse(node, basePath);
  return lines.join('\n');
}

function resolveRulesFilePath(opts: { providedRulesPath?: string; cwd: string }) {
  const candidate = opts.providedRulesPath || defaultRulesFilePath;
  return candidate;
}

function generateLogPaths() {
  const logDir = path.join(process.cwd(), 'logs', 'api');
  // 日志文件名包含当前从当天0点到现在的秒数
  const now = new Date();
  const dayStr = now.toISOString().split('T')[0];
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const secondsSinceZero = Math.floor((now.getTime() - startOfDay.getTime()) / 1000);
  const logFile = path.join(logDir, `frontend-workflow-${dayStr}-${secondsSinceZero}.json`);
  return { logDir, logFile };
}

function writeWorkflowHistoryLog(opts: { filePath: string; payload: WorkflowHistoryLog }) {
  const dir = path.dirname(opts.filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(opts.filePath, JSON.stringify(opts.payload) + '\n');
}

export async function runFrontendProjectWorkflow(
  opts: FrontendProjectWorkflowOptions
): Promise<FrontendProjectWorkflowResult> {
  const context = await Context.create({
    cwd: opts.cwd ?? process.cwd(),
    productName: opts.productName,
    version: opts.version,
    argvConfig: opts.configOverrides || {},
  });
  const session = Session.create();
  const fileDraftStore = new FileDraftStore();
  const jsonlLogger = new JsonlLogger({
    filePath: context.paths.getSessionLogPath(session.id),
  });
  const requestLogger = new RequestLogger({
    globalProjectDir: context.paths.globalProjectDir,
  });
  const startedAt = new Date();
  const { logFile } = generateLogPaths();

  try {
    const todoFilePath = path.join(context.paths.globalConfigDir, 'todos', `${session.id}-frontend.json`);
    const useMemoryTodoStorage = opts.todoStorageMode === 'memory';
    const todoToolConfig = useMemoryTodoStorage ? { storage: createInMemoryTodoStorage() } : { filePath: todoFilePath };

    const { todoReadTool, todoWriteTool } = createTodoTool(todoToolConfig);

    const specReaderTool = createSpecReaderTool({
      specDirectories: opts.specDirectories,
      cwd: context.cwd,
    });

    const componentDocReaderTool = createComponentDocReaderTool({
      docDirectories: opts.componentDocDirectories,
      cwd: context.cwd,
    });

    const fileDraftTool = createFileDraftTool(fileDraftStore);

    const toolset: Tool[] = [todoReadTool, todoWriteTool, specReaderTool, componentDocReaderTool, fileDraftTool];
    const toolsManager = new Tools(toolset);

    const userInitPrompt = `# Page Layout Annotation
    ${opts.pageAnnotation}

    # Design DSL
    ${opts.designDsl}

    ${opts.srcTree ? `# 项目 src 目录结构\n${formatTreeToCompactList(opts.srcTree)}` : ''}`;

    const llmsContext = await LlmsContext.create({
      context,
      sessionId: session.id,
      userPrompt: userInitPrompt,
      rulesFilePath: resolveRulesFilePath({
        providedRulesPath: opts.rulesFilePath,
        cwd: context.cwd,
      }),
    });

    const specRegistry = loadSpecsFromDirectories(opts.specDirectories ?? [], context.cwd);
    // 读取  opts.componentDocDirectories 中的某个 json（假设读取第一个目录下的所有 .json 文件中的第一个）
    let componentDocRegistry: { components: string[] } = { components: [] };
    if (opts.componentDocDirectories && opts.componentDocDirectories.length > 0) {
      const dir = opts.componentDocDirectories[0];
      const absoluteDir = path.isAbsolute(dir) ? dir : path.resolve(context.cwd, dir);
      if (fs.existsSync(absoluteDir) && fs.statSync(absoluteDir).isDirectory()) {
        const files = fs.readdirSync(absoluteDir).filter((name) => name.endsWith('.json'));
        if (files.length > 0) {
          const jsonPath = path.join(absoluteDir, files[0]);
          try {
            const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
            componentDocRegistry = JSON.parse(jsonContent);
          } catch (e) {
            console.error(`[frontendProjectService] 读取组件文档 json 失败: ${jsonPath}`, e);
          }
        }
      }
    }

    const systemPrompt = generateFrontendProjectPrompt({
      specs: Object.keys(specRegistry),
      components: componentDocRegistry?.components ?? [],
      promptFilePath: opts.promptFilePath,
      cwd: context.cwd,
    });

    const model = (await resolveModelWithContext(context.config.model, context, opts.apiKey, opts.baseURL)).model!;

    const initialMessage: NormalizedMessage = {
      parentUuid: null,
      uuid: randomUUID(),
      role: 'user',
      content: userInitPrompt,
      type: 'message',
      timestamp: new Date().toISOString(),
    };

    const callbacks = opts.callbacks;

    const initialMessageWithSessionId = {
      ...initialMessage,
      sessionId: session.id,
    };
    jsonlLogger.addMessage({ message: initialMessageWithSessionId });
    await callbacks?.onMessage?.({ message: initialMessage });

    const loopResult = await runLoop({
      input: [initialMessage],
      model,
      tools: toolsManager,
      cwd: context.cwd,
      systemPrompt,
      llmsContexts: llmsContext.messages,
      autoCompact: context.config.autoCompact,
      onMessage: async (message) => {
        const normalizedMessage = {
          ...message,
          sessionId: session.id,
        };
        jsonlLogger.addMessage({
          message: normalizedMessage,
        });
        await callbacks?.onMessage?.({
          message: normalizedMessage,
        });
      },
      onTextDelta: callbacks?.onTextDelta,
      onStreamResult: async (result) => {
        requestLogger.logMetadata({
          requestId: result.requestId,
          prompt: result.prompt,
          model: result.model,
          tools: result.tools,
          request: result.request,
          response: result.response,
          error: result.error,
        });
        await callbacks?.onStreamResult?.(result);
      },
      onChunk: async (chunk, requestId) => {
        requestLogger.logChunk(requestId, chunk);
        await callbacks?.onChunk?.(chunk, requestId);
      },
      onText: callbacks?.onText,
      onTurn: callbacks?.onTurn,
      onToolApprove: async (toolUse) => {
        if (!callbacks?.onToolApprove) {
          return true;
        }
        const tool = toolsManager.get(toolUse.name);
        return await callbacks.onToolApprove({
          toolUse,
          category: tool?.approval?.category,
        });
      },
      thinking: {
        effort: 'medium',
      },
    });

    const finishedAt = new Date();
    const historyMessagesForLog = loopResult.history.messages.map((message) => {
      return {
        ...message,
        sessionId: session.id,
      };
    });
    writeWorkflowHistoryLog({
      filePath: logFile,
      payload: {
        sessionId: session.id,
        startedAt: startedAt.toISOString(),
        finishedAt: finishedAt.toISOString(),
        context: {
          cwd: context.cwd,
          productName: opts.productName,
          version: opts.version,
          specDirectories: opts.specDirectories,
          componentDocDirectories: opts.componentDocDirectories,
          hasSrcTree: !!opts.srcTree,
        },
        history: historyMessagesForLog,
        initialMessages: loopResult.initialMessages,
        files: fileDraftStore.drafts,
      },
    });

    if (loopResult.success) {
      return {
        success: true,
        files: fileDraftStore.drafts,
        loopResult,
        workflowLogPath: logFile,
      };
    }
    return {
      success: false,
      error: loopResult.error,
      files: fileDraftStore.drafts,
      workflowLogPath: logFile,
    };
  } finally {
    await context.destroy();
  }
}
