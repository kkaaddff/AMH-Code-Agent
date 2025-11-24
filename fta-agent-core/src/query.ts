import assert from 'assert';
import type { Context } from './context';
import { runLoop } from './loop';
import type { NormalizedMessage } from './message';
import { type ModelInfo, resolveModelWithContext } from './model';
import { Tools } from './tool';
import { randomUUID } from './utils/randomUUID';

export async function query(opts: {
  userPrompt: string;
  messages?: NormalizedMessage[];
  context?: Context;
  model?: ModelInfo;
  systemPrompt?: string;
  onMessage?: (message: NormalizedMessage) => Promise<void>;
}) {
  const messages: NormalizedMessage[] = [
    ...(opts.messages || []),
    {
      role: 'user',
      content: opts.userPrompt,
      type: 'message',
      timestamp: new Date().toISOString(),
      uuid: randomUUID(),
      parentUuid: null,
    },
  ];
  assert(opts.model || opts.context, 'model or context is required');
  const apiKey = process.env.OPENAI_API_KEY;
  const baseURL = process.env.OPENAI_BASE_URL;
  assert(apiKey, 'OPENAI_API_KEY is required to call the agent.');
  const model = opts.model || (await resolveModelWithContext(null, opts.context!, apiKey, baseURL)).model!;
  return await runLoop({
    input: messages,
    model,
    tools: new Tools([]),
    cwd: '',
    systemPrompt: opts.systemPrompt || '',
    onMessage: async (message) => {
      await opts.onMessage?.(message);
    },
    autoCompact: false,
  });
}
