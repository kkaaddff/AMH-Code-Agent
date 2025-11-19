import fs from 'fs';
import { fileURLToPath } from 'node:url';
import path from 'pathe';
import { generateSystemPrompt } from './systemPrompt';

type FrontendProjectPromptOptions = {
  specs: string[];
  promptFilePath?: string;

  cwd?: string;
};

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));

function resolvePromptPath(opts: FrontendProjectPromptOptions) {
  const cwd = opts.cwd ?? process.cwd();
  if (opts.promptFilePath) {
    return path.isAbsolute(opts.promptFilePath) ? opts.promptFilePath : path.resolve(cwd, opts.promptFilePath);
  } else {
    return path.join(THIS_DIR, 'frontend-project.md');
  }
}

export function generateFrontendProjectPrompt(opts: FrontendProjectPromptOptions) {
  const promptPath = resolvePromptPath(opts);
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt file not found: ${promptPath}`);
  }
  const specList =
    opts.specs.length > 0
      ? opts.specs.map((spec) => `- ${spec}`).join('\n')
      : '- (No shared specs. Confirm with the caller.)';
  const rawPrompt = fs.readFileSync(promptPath, 'utf-8');
  const appendSystemPrompt = rawPrompt.replace('{{SPEC_LIST}}', specList).trim();

  return generateSystemPrompt({ appendSystemPrompt });
}
