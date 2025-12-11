import { Tokenizer } from '@mlc-ai/web-tokenizers';
import tokenizerJsonRaw from '../data/qwen-tokenizer.json?raw';

let cachedTokenizer: Tokenizer | null = null;

async function getTokenizer() {
  if (cachedTokenizer) return cachedTokenizer;
  const encoder = new TextEncoder();
  const buffer = encoder.encode(tokenizerJsonRaw).buffer;
  cachedTokenizer = await Tokenizer.fromJSON(buffer);
  return cachedTokenizer;
}

export async function estimateQwenTokens(content: string): Promise<number> {
  if (!content) return 0;
  const tokenizer = await getTokenizer();
  const ids = tokenizer.encode(content);
  return ids.length;
}

export async function estimateTokenDiff(before: string, after: string) {
  const [beforeCount, afterCount] = await Promise.all([estimateQwenTokens(before), estimateQwenTokens(after)]);
  return {
    before: beforeCount,
    after: afterCount,
    delta: afterCount - beforeCount,
    saving: beforeCount - afterCount,
  };
}

