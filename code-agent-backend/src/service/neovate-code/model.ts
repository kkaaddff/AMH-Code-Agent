import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { createXai } from "@ai-sdk/xai";
import {
  createOpenRouter,
  type LanguageModelV2,
} from "@openrouter/ai-sdk-provider";
import assert from "assert";
import defu from "defu";
import path from "path";
import type { Context } from "./context";

export interface ModelModalities {
  input: ("text" | "image" | "audio" | "video" | "pdf")[];
  output: ("text" | "audio" | "image")[];
}

interface ModelCost {
  input: number;
  output: number;
  cache_read?: number;
  cache_write?: number;
}

interface ModelLimit {
  context: number;
  output: number;
}

export interface Model {
  id: string;
  name: string;
  shortName?: string;
  attachment: boolean;
  reasoning: boolean;
  temperature: boolean;
  tool_call: boolean;
  knowledge: string;
  release_date: string;
  last_updated: string;
  modalities: ModelModalities;
  open_weights: boolean;
  cost: ModelCost;
  limit: ModelLimit;
}

export type ModelMap = Record<string, Omit<Model, "id" | "cost">>;

export const models: ModelMap = {
  "qwen3-coder-480b-a35b-instruct": {
    name: "Qwen3 Coder 480B A35B Instruct",
    shortName: "Qwen3 Coder",
    attachment: false,
    reasoning: false,
    temperature: true,
    tool_call: true,
    knowledge: "2025-04",
    release_date: "2025-07-23",
    last_updated: "2025-07-23",
    modalities: { input: ["text"], output: ["text"] },
    open_weights: true,
    limit: { context: 262144, output: 66536 },
  },
  "qwen3-235b-a22b-07-25": {
    name: "Qwen3 235B A22B Instruct 2507",
    shortName: "Qwen3",
    attachment: false,
    reasoning: false,
    temperature: true,
    tool_call: true,
    knowledge: "2025-04",
    release_date: "2025-04-28",
    last_updated: "2025-07-21",
    modalities: { input: ["text"], output: ["text"] },
    open_weights: true,
    limit: { context: 262144, output: 131072 },
  },

  "glm-4.6": {
    name: "GLM-4.6",
    attachment: false,
    reasoning: true,
    temperature: true,
    tool_call: true,
    knowledge: "2025-04",
    release_date: "2025-09-30",
    last_updated: "2025-09-30",
    modalities: { input: ["text"], output: ["text"] },
    open_weights: true,
    limit: { context: 204800, output: 131072 },
  },
  "claude-4-5-sonnet": {
    name: "Claude Sonnet 4.5 (Preview)",
    attachment: true,
    reasoning: true,
    temperature: true,
    tool_call: true,
    knowledge: "2025-03-31",
    release_date: "2025-09-29",
    last_updated: "2025-09-29",
    modalities: { input: ["text", "image"], output: ["text"] },
    open_weights: false,
    limit: { context: 200000, output: 32000 },
  },
};

export const defaultModelCreator = (name: string): LanguageModelV2 => {
  const baseURL = process.env[`OPENAI_API_BASE`] || "";
  const apiKey = process.env[`OPENAI_API_KEY`] || "";
  return createOpenAI({
    baseURL,
    apiKey,
  }).chat(name);
};

export type ModelInfo = {
  // provider: Provider;
  model: Omit<Model, "cost">;
  m: LanguageModelV2;
};

export async function resolveModelWithContext(
  name: string | null,
  context: Context
) {
  return {
    model: {
      model: models["glm-4.6"],
      m: defaultModelCreator("glm-4.6"),
    } as ModelInfo,
  };
}

export async function resolveModel(name: string): Promise<ModelInfo> {
  return {
    model: { ...models[name], id: name },
    m: defaultModelCreator(name),
  };
}
