import { createOpenAI } from '@ai-sdk/openai';
import type { LanguageModelV2 } from '@ai-sdk/provider';
import assert from 'assert';
import type { Context } from './context';

export type ModelMeta = {
  id: string;
  reasoning: boolean;
  limit: {
    context: number;
    output: number;
  };
};

export type ModelInfo = {
  model: ModelMeta;
  m: LanguageModelV2;
};

const DEFAULT_LIMIT = { context: 128_000, output: 8_192 };

const BUILTIN_MODELS: Record<string, ModelMeta> = {
  'glm-4.6': {
    id: 'glm-4.6',
    reasoning: false,
    limit: DEFAULT_LIMIT,
  },
};

function resolveModelMeta(modelId: string): ModelMeta {
  return (
    BUILTIN_MODELS[modelId] || {
      id: modelId,
      reasoning: false,
      limit: DEFAULT_LIMIT,
    }
  );
}

export async function resolveModelWithContext(name: string | null, context: Context) {
  const modelId = name || context.config.model;
  assert(modelId, 'A language model must be specified in config or arguments.');
  const model = await createOpenAIModel(modelId);
  return { model };
}

async function createOpenAIModel(modelId: string): Promise<ModelInfo> {
  const apiKey = process.env.OPENAI_API_KEY;
  assert(apiKey, 'OPENAI_API_KEY is required to call the agent.');
  const llmTimeoutMs = getConfiguredLlmTimeout();
  const client = createOpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL,
    ...(llmTimeoutMs ? { fetch: createTimeoutFetch(llmTimeoutMs) } : {}),
  });
  return {
    model: resolveModelMeta(modelId),
    m: client.chat(modelId),
  };
}

const DEFAULT_LLM_TIMEOUT = 120_000; // 默认 2 分钟

function getConfiguredLlmTimeout(): number {
  return process.env.LLM_TIMEOUT ? Number(process.env.LLM_TIMEOUT) : DEFAULT_LLM_TIMEOUT;
}

function createTimeoutFetch(timeoutMs: number): (input: RequestInfo | URL, init?: RequestInit) => Promise<Response> {
  const baseFetch = globalThis.fetch?.bind(globalThis);
  assert(baseFetch, 'Global fetch implementation is required for enforcing LLM timeouts.');
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const timeoutController = new AbortController();
    const timeoutId = setTimeout(() => {
      timeoutController.abort();
    }, timeoutMs);

    try {
      const signal = init?.signal ? mergeAbortSignals(init.signal, timeoutController.signal) : timeoutController.signal;
      const nextInit: RequestInit = {
        ...(init || {}),
        signal,
      };
      return await baseFetch(input as any, nextInit);
    } finally {
      clearTimeout(timeoutId);
    }
  };
}

function mergeAbortSignals(signalA: AbortSignal, signalB: AbortSignal): AbortSignal {
  if (signalA === signalB) {
    return signalA;
  }
  const anyMethod = (AbortSignal as any).any;
  if (typeof anyMethod === 'function') {
    return anyMethod([signalA, signalB]);
  }
  const controller = new AbortController();
  const abort = (signal: AbortSignal) => {
    if (controller.signal.aborted) {
      return;
    }
    controller.abort((signal as any).reason);
  };

  for (const signal of [signalA, signalB]) {
    if (signal.aborted) {
      abort(signal);
    } else {
      signal.addEventListener('abort', () => abort(signal), { once: true });
    }
  }
  return controller.signal;
}
