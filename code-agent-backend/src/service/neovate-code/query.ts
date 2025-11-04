import type { Context } from "./context";
import { type LoopResult, runLoop } from "./loop";
import type { NormalizedMessage } from "./message";
import { type ModelInfo, resolveModelWithContext } from "./model";
import { Tools } from "./tool";
import { randomUUID } from "./utils/randomUUID";

export async function query(opts: {
  userPrompt: string;
  messages?: NormalizedMessage[];
  context?: Context;
  model?: ModelInfo;
  systemPrompt?: string;
  onMessage?: (message: NormalizedMessage) => Promise<void>;
}): Promise<LoopResult> {
  const messages: NormalizedMessage[] = [
    ...(opts.messages || []),
    {
      role: "user",
      content: opts.userPrompt,
      type: "message",
      timestamp: new Date().toISOString(),
      uuid: randomUUID(),
      parentUuid: null,
    },
  ];
  let model: ModelInfo;
  if (opts.model) {
    model = opts.model;
  } else if (opts.context) {
    const resolved = await resolveModelWithContext(null, opts.context);
    if (!resolved.model) {
      throw new Error("Failed to resolve model from context");
    }
    model = resolved.model;
  } else {
    throw new Error("model or context is required");
  }
  return await runLoop({
    input: messages,
    model,
    tools: new Tools([]),
    cwd: "",
    systemPrompt: opts.systemPrompt || "",
    onMessage: async (message) => {
      await opts.onMessage?.(message);
    },
    autoCompact: false,
  });
}
