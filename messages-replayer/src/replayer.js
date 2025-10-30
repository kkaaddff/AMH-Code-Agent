import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { groupEventsByUid } from './parser.js';
import { createClient } from './llmClient.js';

const ensureDir = dir => {
  fs.mkdirSync(dir, { recursive: true });
};

const writeFile = (filePath, content) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, content, 'utf8');
};

const formatLine = (timestamp, uid, event, payload) => {
  const serialised =
    typeof payload === 'string' ? payload : JSON.stringify(payload);
  return `${timestamp} uid=${uid} ${event}: ${serialised}`;
};

const clonePayload = payload => {
  if (payload === null || typeof payload !== 'object') {
    return payload;
  }

  return JSON.parse(JSON.stringify(payload));
};

const applyModelOverrides = (payload, overrides) => {
  if (
    !overrides ||
    payload === null ||
    typeof payload !== 'object' ||
    Array.isArray(payload)
  ) {
    return payload;
  }

  const next = { ...payload };

  if (overrides.name) {
    next.model = overrides.name;
  }

  if (overrides.temperature !== undefined) {
    next.temperature = overrides.temperature;
  }

  return next;
};

const buildReplayUid = sourceUid => {
  if (sourceUid) {
    return `${sourceUid}-replay`;
  }

  return `replay-${randomUUID()}`;
};

export const writeRecordedReplay = ({ content }, outputDir, filename) => {
  const outputName = filename ?? 'messages-replay.log';
  const outputPath = path.resolve(outputDir, outputName);
  writeFile(outputPath, content.endsWith('\n') ? content : `${content}\n`);
  return outputPath;
};

export const replayWithLiveClient = async (
  { entries },
  { apiConfig, modelOverrides, outputDir }
) => {
  const groups = groupEventsByUid(entries);
  const client = createClient(apiConfig);
  const now = new Date();
  const header = `---Replay ${now.toISOString()}---`;
  const logLines = [header, ''];
  const results = [];

  for (const group of groups) {
    if (!group.request) {
      continue;
    }

    const uid = buildReplayUid(group.uid);
    const requestPayload = applyModelOverrides(
      clonePayload(group.request.payload),
      modelOverrides
    );
    const requestTimestamp = new Date().toISOString();
    logLines.push(
      formatLine(requestTimestamp, uid, 'input', requestPayload),
      ''
    );

    try {
      const data = await client.sendRequest(requestPayload);
      const responseTimestamp = new Date().toISOString();
      logLines.push(
        formatLine(responseTimestamp, uid, 'stream.final', data),
        ''
      );
      results.push({ uid, status: 'ok' });
    } catch (error) {
      const responseTimestamp = new Date().toISOString();
      logLines.push(
        formatLine(
          responseTimestamp,
          uid,
          'stream.error',
          error?.response?.data ?? { message: error.message }
        ),
        ''
      );
      results.push({ uid, status: 'error', error: error.message });
    }
  }

  const logContent = logLines.join('\n');
  ensureDir(outputDir);
  const outputPath = path.resolve(
    outputDir,
    `messages-replay-live-${now.getTime()}.log`
  );
  writeFile(outputPath, logContent.endsWith('\n') ? logContent : `${logContent}\n`);

  return { outputPath, results };
};
