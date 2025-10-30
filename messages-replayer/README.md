# messages-replayer

Replay the recorded Claude conversation stored in `../messages.log`. The project re-creates the log verbatim (for a 100% match) and can optionally re-send each logged request to a live large language model endpoint using `axios`.

## Prerequisites

- Node.js 18+
- `messages.log` present one directory above this project (default from the workspace)

## Installation

```bash
npm install
```

## Usage

### Parse the log

```bash
npm run parse
```

Outputs a quick summary (sessions, requests, total lines).

### Reproduce the log exactly

```bash
npm run replay
```

Creates `output/messages-replay.log`, which is identical to the source log (including blank lines) so you can diff or redistribute it safely.

### Re-run requests against a live LLM

Configure your endpoint first (these can live in `.env`):

```
MODEL_ENDPOINT=https://your-llm-endpoint/api/paas/v4/chat/completions
MODEL_API_KEY=sk-...
MODEL_NAME=glm-4.6            # optional override for the recorded payload
MODEL_TIMEOUT=60000           # optional timeout in ms
MODEL_TEMPERATURE=0.2         # optional override for temperature
```

Then trigger live mode:

```bash
npm run replay:live
```

Each request uses `axios` to call the configured endpoint. Results (or errors) are logged under `output/messages-replay-live-<timestamp>.log`, preserving an event format similar to the original file.

## CLI Options

You can override defaults on any run:

- `--mode=recorded|live`
- `--log=/path/to/messages.log`
- `--output=/path/to/output-dir`
- `--api-url=...` / `--api-endpoint=...`
- `--api-key=...` / `--api-token=...`
- `--api-path=...`
- `--api-timeout=75000`
- `--model-name=glm-4.6`
- `--model-temperature=0.2`

Example:

```bash
npm run replay -- --mode=live --api-url=https://host/v1/messages
```

## Project Notes

- `src/parser.js` extracts sessions, requests, and event payloads from the log.
- `src/replayer.js` handles recorded and live replay flows, optionally applying model overrides from the environment.
- `src/llmClient.js` wraps `axios` so every live request uses the same client configuration.
- Outputs live in `output/` and are ignored by Git.
