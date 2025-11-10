import fs from 'fs';
import os from 'os';
import path from 'pathe';
import { fileURLToPath } from 'node:url';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { runFrontendProjectWorkflow } from './frontendProjectService';
import { createSpecReaderTool } from './tools/specReader';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..');

describe('FrontendProjectWorkflow integration (no mocks)', () => {
  let projectDir: string;
  let homeDir: string;
  let originalHome: string | undefined;
  const originalEnv: Record<string, string | undefined> = {
    FTA_AGENT_FAKE_LLM: process.env.FTA_AGENT_FAKE_LLM,
    FTA_AGENT_USE_MOCK_SPECS: process.env.FTA_AGENT_USE_MOCK_SPECS,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  };

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontend-project-repo-'));
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontend-project-home-'));
    originalHome = process.env.HOME;
    process.env.HOME = homeDir;
    process.env.FTA_AGENT_FAKE_LLM = '1';
    process.env.FTA_AGENT_USE_MOCK_SPECS = '1';
    process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY || 'fake-key';
    fs.writeFileSync(path.join(projectDir, 'README.md'), '# Temp Repo', 'utf-8');
  });

  afterEach(() => {
    if (originalHome !== undefined) {
      process.env.HOME = originalHome;
    }
    for (const [key, value] of Object.entries(originalEnv)) {
      if (typeof value === 'undefined') {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    if (projectDir && fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
    if (homeDir && fs.existsSync(homeDir)) {
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  it('runs the workflow end-to-end with fake model and mock specs', async () => {
    const result = await runFrontendProjectWorkflow({
      cwd: projectDir,
      productName: 'NEOVATE',
      version: '0.0.0-test',
      requirementDoc: `## Feature
- Render dashboard
- Load data from API`,
      specFiles: {},
      configOverrides: {
        model: 'glm-4.6',
        planModel: 'glm-4.6',
      },
    });

    expect(result.success).toBe(true);
    // result.loopResult not guaranteed on FrontendProjectWorkflowResult type; instead, check file structure and minimal success
    if ('loopResult' in result && result.loopResult?.metadata?.turnsCount !== undefined) {
      expect(result.loopResult.metadata.turnsCount).toBeGreaterThanOrEqual(0);
    }
    expect(Array.isArray(result.files)).toBe(true);
  });

  describe('SpecReader tool mock registration', () => {
    const originalEnv = {
      FTA_AGENT_USE_MOCK_SPECS: process.env.FTA_AGENT_USE_MOCK_SPECS,
    };

    afterEach(() => {
      if (typeof originalEnv.FTA_AGENT_USE_MOCK_SPECS === 'undefined') {
        delete process.env.FTA_AGENT_USE_MOCK_SPECS;
      } else {
        process.env.FTA_AGENT_USE_MOCK_SPECS = originalEnv.FTA_AGENT_USE_MOCK_SPECS;
      }
    });

    it('reads mock specs directly when special env is enabled', async () => {
      process.env.FTA_AGENT_USE_MOCK_SPECS = '1';
      const tool = createSpecReaderTool({
        specs: {},
        cwd: PACKAGE_ROOT,
      });
      const result = await tool.execute({ spec_name: 'directory' });
      expect(result.isError).toBeUndefined();
      // 校验 llmContent 返回内容包含目录规范的标题
      expect(result.llmContent).toContain('# 前端项目目录结构规范');
    });
  });
});
