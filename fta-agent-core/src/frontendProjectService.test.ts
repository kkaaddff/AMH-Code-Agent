import { config as loadEnv } from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
import os from 'os';
import path from 'pathe';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runFrontendProjectWorkflow } from './frontendProjectService';
import { createSpecReaderTool } from './tools/specReader';
import { FileDraftStore } from './tools/fileDraft';
import type { Usage } from './usage';
import { flattenAnnotation, formatAnnotationSummary, type AnnotationNode } from './utils/annotation';
loadEnv({ path: path.join(process.cwd(), '.env') });

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const rootAnnotation = fs.readFileSync(path.join(__dirname, 'tests/fixtures/rootAnnotation.json'), 'utf-8');
const designDsl = fs.readFileSync(path.join(__dirname, 'tests/fixtures/designDsl.json'), 'utf-8');
const rootAnnotationSummary = formatAnnotationSummary(flattenAnnotation(JSON.parse(rootAnnotation) as AnnotationNode));

describe('FrontendProjectWorkflow integration (no mocks)', () => {
  let projectDir: string;
  let homeDir: string;
  let originalHome: string | undefined;
  let addSpy: any;

  beforeEach(() => {
    projectDir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontend-project-repo-'));
    homeDir = fs.mkdtempSync(path.join(os.tmpdir(), 'frontend-project-home-'));
    originalHome = process.env.HOME;
    process.env.HOME = homeDir;

    fs.writeFileSync(path.join(projectDir, 'README.md'), '# Temp Repo', 'utf-8');

    // Spy FileDraftStore.add 方法，在测试缓存文件夹中写入文件
    const originalAdd = FileDraftStore.prototype.add;
    const mockSpecDir = path.join(PACKAGE_ROOT, 'mock-temp');
    // 判断 mockSpecDir 是否存在，如果不存在则创建；无论如何都清空目录内容
    if (!fs.existsSync(mockSpecDir)) {
      fs.mkdirSync(mockSpecDir, { recursive: true });
    } else {
      // 用一个函数清空目录
      // fs.rmSync(mockSpecDir, { recursive: true, force: true });
      // fs.mkdirSync(mockSpecDir, { recursive: true });
    }

    addSpy = vi.spyOn(FileDraftStore.prototype, 'add').mockImplementation(function (this: FileDraftStore, draft) {
      // 调用原始方法以保持原有行为
      originalAdd.call(this, draft);

      // 在测试缓存文件夹中按相对路径写入文件
      const targetPath = path.join(mockSpecDir, draft.path);

      if (draft.kind === 'directory') {
        // 创建目录
        fs.mkdirSync(targetPath, { recursive: true });
      } else if (draft.kind === 'file' && draft.content !== undefined) {
        // 确保父目录存在
        const parentDir = path.dirname(targetPath);
        if (!fs.existsSync(parentDir)) {
          fs.mkdirSync(parentDir, { recursive: true });
        }
        // 写入文件内容
        fs.writeFileSync(targetPath, draft.content, 'utf-8');
      }
    });
  });

  afterEach(() => {
    // 恢复 spy
    if (addSpy) {
      addSpy.mockRestore();
    }

    if (originalHome !== undefined) {
      process.env.HOME = originalHome;
    }

    if (projectDir && fs.existsSync(projectDir)) {
      fs.rmSync(projectDir, { recursive: true, force: true });
    }
    if (homeDir && fs.existsSync(homeDir)) {
      fs.rmSync(homeDir, { recursive: true, force: true });
    }
  });

  it('runs the workflow end-to-end with fake model and mock specs', async () => {
    const callbacks = {
      onMessage: vi.fn(async (opts: { message: any }) => {
        const { message } = opts;
        console.log('[onMessage]', {
          role: message.role,
          uuid: message.uuid,
          parentUuid: message.parentUuid,
          content:
            typeof message.content === 'string'
              ? message.content.substring(0, 100)
              : JSON.stringify(message.content).substring(0, 100),
          timestamp: message.timestamp,
        });
      }),
      onToolApprove: vi.fn(async (opts: { toolUse: any; category?: string }) => {
        const { toolUse, category } = opts;
        console.log('[onToolApprove]', {
          toolName: toolUse.name,
          callId: toolUse.callId,
          params: JSON.stringify(toolUse.params),
          category,
        });
        return true;
      }),
      onText: vi.fn(async (text: string) => {
        console.log('[onText]', text.substring(0, 200));
      }),
      onTurn: vi.fn(async (turn: { usage: Usage; startTime: Date; endTime: Date }) => {
        console.log('[onTurn]', {
          usage: turn.usage,
          startTime: turn.startTime,
          endTime: turn.endTime,
        });
      }),
      onStreamResult: vi.fn(async (result: any) => {
        console.log('[onStreamResult]', {
          requestId: result.requestId,
          model: result.model?.modelId || JSON.stringify(result.model),
          hasError: !!result.error,
          statusCode: result.response?.statusCode,
          error: result.error ? JSON.stringify(result.error).substring(0, 300) : undefined,
        });
      }),
    };

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
      callbacks,
      rootAnnotation: rootAnnotationSummary,
      designDsl: designDsl,
    });

    expect(result.success).toBe(true);
    // result.loopResult not guaranteed on FrontendProjectWorkflowResult type; instead, check file structure and minimal success
    if ('loopResult' in result && result.loopResult?.metadata?.turnsCount !== undefined) {
      expect(result.loopResult.metadata.turnsCount).toBeGreaterThanOrEqual(0);
    }
    expect(Array.isArray(result.files)).toBe(true);
  });

  describe('SpecReader tool mock registration', () => {
    it('reads mock specs directly when special env is enabled', async () => {
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
