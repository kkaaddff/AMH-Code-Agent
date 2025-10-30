import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const projectDir = fileURLToPath(new URL("..", import.meta.url));
const defaultLogPath = path.resolve(projectDir, "messages.log");
const defaultOutputDir = path.resolve(projectDir, "output");

const toInt = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
};

const toFloat = (value, fallback) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }

  const parsed = Number.parseFloat(value);
  return Number.isNaN(parsed) ? fallback : parsed;
};

export const loadConfig = (overrides = {}) => {
  const env = process.env;

  const merged = {
    mode: overrides.mode ?? env.MODEL_MODE ?? env.LLM_MODE ?? "recorded",
    logPath:
      overrides.logPath ??
      env.MODEL_LOG_PATH ??
      env.LLM_LOG_PATH ??
      defaultLogPath,
    outputDir:
      overrides.outputDir ??
      env.MODEL_OUTPUT_DIR ??
      env.LLM_OUTPUT_DIR ??
      defaultOutputDir,
    api: {
      url:
        overrides.api?.url ??
        overrides.api?.endpoint ??
        env.MODEL_ENDPOINT ??
        env.LLM_API_URL ??
        "",
      key:
        overrides.api?.key ??
        overrides.api?.token ??
        env.MODEL_API_KEY ??
        env.LLM_API_KEY ??
        "",
      path: overrides.api?.path ?? env.LLM_API_PATH ?? "",
      timeout:
        overrides.api?.timeout ??
        toInt(env.MODEL_TIMEOUT ?? env.LLM_API_TIMEOUT, 60000),
    },
    model: {
      name: overrides.model?.name ?? env.MODEL_NAME ?? "",
      temperature:
        overrides.model?.temperature ??
        toFloat(env.MODEL_TEMPERATURE, undefined),
    },
  };

  return merged;
};
