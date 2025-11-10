import { Body, Controller, Inject, Post } from '@midwayjs/decorator';
import type { Context } from '@midwayjs/web';
import path from 'path';
import { Context as AgentContext } from '../../service/neovate-code/context';
import { type NormalizedMessage } from '../../service/neovate-code/message';
import { Project } from '../../service/neovate-code/project';
import { omitUndefined } from '../../utils';

type ProjectSendBody = {
  message?: string | null;
  sessionId?: string;
  cwd?: string;
  productName?: string;
  productASCIIArt?: string;
  version?: string;
  model?: string;
  planModel?: string;
  smallModel?: string;
  plugins?: string[];
  config?: Record<string, any>;
  parentUuid?: string;
  thinking?: {
    effort: 'low' | 'medium' | 'high';
  };
};

@Controller('/neo')
export class NeovateController {
  @Inject()
  private ctx: Context;

  @Post('/send')
  async projectSend(@Body() body: ProjectSendBody) {
    const {
      message = null,
      sessionId,
      cwd,
      productName,
      productASCIIArt,
      version,
      planModel,
      smallModel,
      plugins,
      config,
      parentUuid,
      thinking,
    } = body;

    const resolvedCwd = cwd ? path.resolve(cwd) : process.cwd();
    const resolvedProductName = productName || 'CodeAgent';
    const resolvedVersion = version || process.env.CODE_AGENT_VERSION || '0.0.0';

    const baseConfig = typeof config === 'object' && config ? { ...config } : {};
    const primaryModel = process.env.MODEL_NAME;

    const argvConfig = omitUndefined({
      ...baseConfig,
      model: primaryModel,
      planModel,
      smallModel,
    });
    if (Array.isArray(plugins) && plugins.length) {
      argvConfig.plugins = plugins;
    }

    // 设置 SSE 响应头
    this.ctx.status = 200;
    this.ctx.set('Content-Type', 'text/event-stream');
    this.ctx.set('Cache-Control', 'no-cache');
    this.ctx.set('Connection', 'keep-alive');
    this.ctx.set('Access-Control-Allow-Origin', '*');

    const res = this.ctx.res;

    // SSE 事件发送辅助函数
    const sendSSE = (event: string, data: any) => {
      const payload = JSON.stringify(data);
      res.write(`event: ${event}\ndata: ${payload}\n\n`);
    };

    let agentContext: AgentContext | null = null;
    try {
      agentContext = await AgentContext.create({
        cwd: resolvedCwd,
        productName: resolvedProductName,
        productASCIIArt,
        version: resolvedVersion,
        argvConfig,
        plugins: [],
      });

      const project = new Project({
        context: agentContext,
        sessionId,
      });

      const sendOptions = omitUndefined({
        model: primaryModel,
        parentUuid,
        thinking,
        onMessage: (opts: { message: NormalizedMessage }) => {
          console.log('opts.message====>', JSON.stringify(opts.message));
        },
        onTextDelta: async (text: string) => {
          sendSSE('text_delta', { text });
        },
        onTodoUpdate: async (todos: any[]) => {
          sendSSE('todo_update', { todos });
        },
        onTurn: async (turn: { iteration: number; startTime: Date; endTime: Date }) => {
          sendSSE('iteration_start', { iteration: turn.iteration });
          // 迭代结束会在下次迭代开始前或会话完成时发送
        },
      });

      let lastIteration = 0;
      const originalOnTurn = sendOptions.onTurn;
      sendOptions.onTurn = async (turn: { iteration: number; startTime: Date; endTime: Date }) => {
        if (lastIteration > 0) {
          sendSSE('iteration_end', { iteration: lastIteration });
        }
        lastIteration = turn.iteration;
        await originalOnTurn?.(turn);
      };

      const result = await project.send(message, sendOptions);

      // 发送最后一次迭代结束
      if (lastIteration > 0) {
        sendSSE('iteration_end', { iteration: lastIteration });
      }

      // 发送完成事件
      sendSSE('complete', {
        success: result.success,
        sessionId: project.session.id,
      });

      res.end();
    } catch (error: any) {
      console.error('SSE Error:', error);
      sendSSE('error', { message: error?.message || 'Project send failed' });
      res.end();
    } finally {
      if (agentContext) {
        await agentContext.destroy();
      }
    }

    // 返回空，防止 Midway 自动处理响应
    return;
  }
}
