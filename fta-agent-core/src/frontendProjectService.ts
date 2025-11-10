import path from 'pathe';
import type { Config } from './config';
import type { ProjectTaskCallbacks } from './project';
import { Context } from './context';
import { LlmsContext } from './llmsContext';
import { runLoop, type LoopResult } from './loop';
import type { NormalizedMessage } from './message';
import { resolveModelWithContext } from './model';
import { generateFrontendProjectPrompt } from './prompts/frontendProject';
import { Session } from './session';
import type { Tool } from './tool';
import { Tools } from './tool';
import { randomUUID } from './utils/randomUUID';
import { createTodoTool } from './tools/todo';
import { createSpecReaderTool, type SpecRegistry } from './tools/specReader';
import { createFileDraftTool, FileDraftStore } from './tools/fileDraft';

export type FrontendProjectWorkflowCallbacks = ProjectTaskCallbacks;

export type FrontendProjectWorkflowOptions = {
  cwd: string;
  productName: string;
  version: string;
  requirementDoc: string;
  specFiles: SpecRegistry;
  configOverrides?: Partial<Config>;
  callbacks?: FrontendProjectWorkflowCallbacks;
};

export type FrontendProjectWorkflowResult =
  | {
      success: true;
      files: FileDraftStore['drafts'];
      loopResult: Extract<LoopResult, { success: true }>;
    }
  | {
      success: false;
      error: Extract<LoopResult, { success: false }>['error'];
      files: FileDraftStore['drafts'];
    };

export async function runFrontendProjectWorkflow(
  opts: FrontendProjectWorkflowOptions
): Promise<FrontendProjectWorkflowResult> {
  const context = await Context.create({
    cwd: opts.cwd,
    productName: opts.productName,
    version: opts.version,
    argvConfig: opts.configOverrides || {},
  });
  const session = Session.create();
  const fileDraftStore = new FileDraftStore();

  try {
    const todoFilePath = path.join(context.paths.globalConfigDir, 'todos', `${session.id}-frontend.json`);
    const { todoReadTool, todoWriteTool } = createTodoTool({
      filePath: todoFilePath,
    });

    const specReaderTool = createSpecReaderTool({
      specs: opts.specFiles,
      cwd: context.cwd,
    });
    const fileDraftTool = createFileDraftTool(fileDraftStore);

    const toolset: Tool[] = [todoReadTool, todoWriteTool, specReaderTool, fileDraftTool];
    const toolsManager = new Tools(toolset);

    const llmsContext = await LlmsContext.create({
      context,
      sessionId: session.id,
      userPrompt: opts.requirementDoc,
    });

    const systemPrompt = generateFrontendProjectPrompt({
      specs: Object.keys(opts.specFiles),
    });

    const model = (await resolveModelWithContext(context.config.model, context)).model!;

    const initialMessage: NormalizedMessage = {
      parentUuid: null,
      uuid: randomUUID(),
      role: 'user',
      content: opts.requirementDoc,
      type: 'message',
      timestamp: new Date().toISOString(),
    };

    const callbacks = opts.callbacks;

    await callbacks?.onMessage?.({
      message: initialMessage,
    });

    const loopResult = await runLoop({
      input: [initialMessage],
      model,
      tools: toolsManager,
      cwd: context.cwd,
      systemPrompt,
      llmsContexts: llmsContext.messages,
      autoCompact: context.config.autoCompact,
      onMessage: callbacks?.onMessage
        ? async (message) => {
            await callbacks.onMessage!({
              message,
            });
          }
        : undefined,
      onTextDelta: callbacks?.onTextDelta,
      onStreamResult: callbacks?.onStreamResult,
      onChunk: callbacks?.onChunk,
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

    if (loopResult.success) {
      return {
        success: true,
        files: fileDraftStore.drafts,
        loopResult,
      };
    }
    return {
      success: false,
      error: loopResult.error,
      files: fileDraftStore.drafts,
    };
  } finally {
    await context.destroy();
  }
}
