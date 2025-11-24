import type { NormalizedMessage } from './message';
import type { ModelInfo } from './model';
import { COMPACT_SYSTEM_PROMPT, COMPACT_USER_PROMPT } from './prompts/compact';
import { query } from './query';
import { normalizeMessagesForCompact } from './utils/messageNormalization';

type CompactOptions = {
  messages: NormalizedMessage[];
  model: ModelInfo;
};

export const COMPACT_MESSAGE = `Chat history compacted successfully.`;

export async function compact(opts: CompactOptions): Promise<string> {
  // why: The toolConfig field must be defined when using toolUse and toolResult content blocks
  const normalizedMessages = normalizeMessagesForCompact(opts.messages);

  const result = await query({
    messages: normalizedMessages,
    userPrompt: COMPACT_USER_PROMPT,
    systemPrompt: COMPACT_SYSTEM_PROMPT,
    model: opts.model,
  });
  if (result.success) {
    const summary = result.data.text;
    if (!summary || summary.trim() === '') {
      throw new Error('Failed to compact: received empty summary from model');
    }
    return summary;
  }
  throw new Error(`Failed to compact: ${result.error.message}`);
}
