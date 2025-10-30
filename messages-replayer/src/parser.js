import fs from 'fs';

const SESSION_HEADER_REGEX = /^---Session (.+)---$/;
const EVENT_LINE_REGEX =
  /^(\d{4}-\d{2}-\d{2}T[0-9:.+-]+Z) uid=([^\s]+) ([^:]+): (.+)$/;

const parseEventPayload = raw => {
  try {
    return JSON.parse(raw);
  } catch (error) {
    return raw;
  }
};

export const parseMessagesLog = logPath => {
  const content = fs.readFileSync(logPath, 'utf8');
  const lines = content.split(/\r?\n/);

  const entries = [];
  let currentSession = null;

  for (const line of lines) {
    if (line.length === 0) {
      entries.push({ type: 'blank', raw: line, session: currentSession });
      continue;
    }

    const sessionMatch = SESSION_HEADER_REGEX.exec(line);
    if (sessionMatch) {
      currentSession = sessionMatch[1];
      entries.push({
        type: 'session',
        raw: line,
        session: currentSession
      });
      continue;
    }

    const eventMatch = EVENT_LINE_REGEX.exec(line);
    if (eventMatch) {
      const [, timestamp, uid, event, payloadRaw] = eventMatch;
      entries.push({
        type: 'event',
        raw: line,
        session: currentSession,
        timestamp,
        uid,
        event,
        payloadRaw,
        payload: parseEventPayload(payloadRaw)
      });
      continue;
    }

    entries.push({
      type: 'unknown',
      raw: line,
      session: currentSession
    });
  }

  return { entries, content };
};

export const groupEventsByUid = entries => {
  const groups = [];
  const map = new Map();

  for (const entry of entries) {
    if (entry.type !== 'event') {
      continue;
    }

    let bucket = map.get(entry.uid);
    if (!bucket) {
      bucket = {
        uid: entry.uid,
        session: entry.session,
        events: [],
        request: null
      };
      map.set(entry.uid, bucket);
      groups.push(bucket);
    }

    bucket.events.push(entry);
    if (!bucket.request && entry.event === 'input') {
      bucket.request = entry;
    }
  }

  return groups;
};

export const summariseLog = entries => {
  const groups = groupEventsByUid(entries);
  const sessions = new Set(entries.filter(e => e.session).map(e => e.session));
  const requestCount = groups.filter(group => group.request).length;

  return {
    totalLines: entries.length,
    sessions: sessions.size,
    requests: requestCount,
    groups
  };
};
