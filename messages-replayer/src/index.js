import { parseArgs } from "util";
import path from "path";
import { loadConfig } from "./config.js";
import { parseMessagesLog, summariseLog } from "./parser.js";
import { writeRecordedReplay, replayWithLiveClient } from "./replayer.js";

const printSummary = (summary) => {
  console.log(`Sessions: ${summary.sessions}`);
  console.log(`Requests: ${summary.requests}`);
  console.log(`Total lines: ${summary.totalLines}`);
};

const parseCliArgs = () => {
  const { values, positionals } = parseArgs({
    options: {
      mode: {
        type: "string",
      },
      log: {
        type: "string",
      },
      output: {
        type: "string",
      },
      "api-url": {
        type: "string",
      },
      "api-key": {
        type: "string",
      },
      "api-path": {
        type: "string",
      },
      "api-timeout": {
        type: "string",
      },
      "api-endpoint": {
        type: "string",
      },
      "api-token": {
        type: "string",
      },
      "model-name": {
        type: "string",
      },
      "model-temperature": {
        type: "string",
      },
    },
    allowPositionals: true,
  });

  const command = positionals[0] ?? "replay";

  return { values, command };
};

const resolveConfig = (values) => {
  const parseOptionalInt = (input) => {
    if (input === undefined) {
      return undefined;
    }
    const parsed = Number.parseInt(input, 10);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const parseOptionalFloat = (input) => {
    if (input === undefined) {
      return undefined;
    }
    const parsed = Number.parseFloat(input);
    return Number.isNaN(parsed) ? undefined : parsed;
  };

  const overrides = {
    mode: values.mode,
    logPath: values.log,
    outputDir: values.output,
    api: {
      url: values["api-url"],
      endpoint: values["api-endpoint"],
      key: values["api-key"],
      token: values["api-token"],
      path: values["api-path"],
      timeout: parseOptionalInt(values["api-timeout"]),
    },
    model: {
      name: values["model-name"],
      temperature: parseOptionalFloat(values["model-temperature"]),
    },
  };

  return loadConfig(overrides);
};

const replayRecorded = (parsed, config) => {
  const outputPath = writeRecordedReplay(
    parsed,
    config.outputDir,
    "messages-replay.log"
  );
  console.log(
    `Recorded replay written to ${path.relative(process.cwd(), outputPath)}`
  );
};

const replayLive = async (parsed, config) => {
  if (!config.api.url) {
    throw new Error(
      "Live mode requires MODEL_ENDPOINT (or --api-url/--api-endpoint) to be configured."
    );
  }

  const { outputPath, results } = await replayWithLiveClient(parsed, {
    apiConfig: config.api,
    modelOverrides: config.model,
    outputDir: config.outputDir,
  });

  const success = results.filter((r) => r.status === "ok").length;
  const failed = results.length - success;

  console.log(
    `Live replay finished. Success: ${success}, Failed: ${failed}, Log: ${path.relative(
      process.cwd(),
      outputPath
    )}`
  );
};

const main = async () => {
  const { values, command } = parseCliArgs();
  const config = resolveConfig(values);
  const parsed = parseMessagesLog(config.logPath);

  if (command === "parse") {
    const summary = summariseLog(parsed.entries);
    printSummary(summary);
    return;
  }

  if (command !== "replay") {
    throw new Error(`Unknown command "${command}". Supported: parse, replay.`);
  }

  if (config.mode === "live") {
    await replayLive(parsed, config);
  } else {
    replayRecorded(parsed, config);
  }
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
