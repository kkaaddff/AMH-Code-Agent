import { config as loadEnv } from 'dotenv';
import fs from 'fs';
import { fileURLToPath } from 'node:url';
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

// 推荐：输入给 LLM 的 JSON 一律压缩
const rootAnnotation = JSON.stringify(
  JSON.parse(fs.readFileSync(path.join(__dirname, 'tests/fixtures/rootAnnotation.json'), 'utf-8'))
);
const designDsl = JSON.stringify(
  JSON.parse(fs.readFileSync(path.join(__dirname, 'tests/fixtures/designDsl.json'), 'utf-8'))
);
const rulesFilePath = path.join(__dirname, 'tests/fixtures/fta-project-spec-4agent.md');

const rootAnnotationSummary = formatAnnotationSummary(flattenAnnotation(JSON.parse(rootAnnotation) as AnnotationNode));

const mockSpecDir = path.join(PACKAGE_ROOT, 'mock-temp');
// 判断 mockSpecDir 是否存在，如果不存在则创建，无论如何都清空目录内容
if (!fs.existsSync(mockSpecDir)) {
  fs.mkdirSync(mockSpecDir, { recursive: true });
} else {
  fs.rmSync(mockSpecDir, { recursive: true, force: true });
  fs.mkdirSync(mockSpecDir, { recursive: true });
}

describe('FrontendProjectWorkflow integration (no mocks)', () => {
  let homeDir: string;
  let originalHome: string | undefined;
  let addSpy: any;

  beforeEach(() => {
    homeDir = fs.mkdtempSync(path.join(mockSpecDir, 'frontend-project-home-'));
    originalHome = process.env.HOME;
    process.env.HOME = homeDir;

    // Spy FileDraftStore.add 方法，在测试缓存文件夹中写入文件
    const originalAdd = FileDraftStore.prototype.add;

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
  });

  it('runs the workflow end-to-end with fake model and mock specs', async () => {
    const callbacks = {
      onMessage: vi.fn(async (opts: { message: any }) => {
        const { message } = opts;
        console.log('[onMessage]', {
          role: message.role,
          uuid: message.uuid,
          parentUuid: message.parentUuid,
          content: typeof message.content === 'string' ? message.content : JSON.stringify(message.content),
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
        console.log('[onText]', text.substring(0, 500));
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
          error: result.error ? JSON.stringify(result.error).substring(0, 500) : undefined,
        });
      }),
    };

    const result = await runFrontendProjectWorkflow({
      cwd: homeDir,
      productName: 'frontendProjectTest',
      version: '0.0.0-test',
      specFiles: {},
      configOverrides: {
        model: 'glm-4.6',
        planModel: 'glm-4.6',
      },
      callbacks,
      pageAnnotation: rootAnnotationSummary,
      designDsl: designDsl,
      rulesFilePath: rulesFilePath,
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
