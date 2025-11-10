import fs from 'fs';
import path from 'pathe';
import { fileURLToPath } from 'node:url';
import { z } from 'zod';
import { createTool } from '../tool';
import { safeStringify } from '../utils/safeStringify';

export type SpecRegistry = Record<string, string>;

const THIS_DIR = path.dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = path.resolve(THIS_DIR, '../..');
const MOCK_SPEC_DIR = path.join(PACKAGE_ROOT, 'mock-specs');

export function createSpecReaderTool(opts: { specs: SpecRegistry; cwd: string }) {
  const normalizedSpecs = Object.entries(opts.specs).reduce<Record<string, string>>((acc, [key, value]) => {
    if (value) {
      acc[key] = path.isAbsolute(value) ? value : path.resolve(opts.cwd, value);
    }
    return acc;
  }, {});
  loadMockSpecsIfNeeded(normalizedSpecs);

  return createTool({
    name: 'read_spec',
    description: `
读取并返回预先注册的规范文档内容。使用该工具来了解目录架构、状态管理、页面设计、服务端约定等规范后再做决策。
`.trim(),
    parameters: z.object({
      spec_name: z.string().describe('需要读取的规范名称（例如 directory, state, page, service 等）'),
    }),
    getDescription: ({ params }) => {
      if (!params.spec_name) {
        return '读取指定规范文档';
      }
      return `读取规范：${params.spec_name}`;
    },
    execute: async ({ spec_name }) => {
      const filePath = normalizedSpecs[spec_name];
      if (!filePath) {
        return {
          isError: true,
          llmContent: `规范 "${spec_name}" 未注册。可用规范：${Object.keys(normalizedSpecs).join(', ') || '无'}`,
        };
      }
      if (!fs.existsSync(filePath)) {
        return {
          isError: true,
          llmContent: `规范 "${spec_name}" 的文件不存在：${filePath}`,
        };
      }
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        return {
          llmContent: safeStringify({
            spec: spec_name,
            path: filePath,
            content,
          }),
          returnDisplay: `已读取规范 ${spec_name}`,
        };
      } catch (error: any) {
        return {
          isError: true,
          llmContent: `读取规范 "${spec_name}" 失败：${error.message}`,
        };
      }
    },
    approval: {
      category: 'read',
    },
  });
}

function loadMockSpecsIfNeeded(registry: Record<string, string>) {
  const shouldLoadMock = process.env.VITEST === 'true';
  if (!shouldLoadMock) return;
  if (!fs.existsSync(MOCK_SPEC_DIR)) {
    return;
  }
  const entries = fs.readdirSync(MOCK_SPEC_DIR, { withFileTypes: true });
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    const absolutePath = path.join(MOCK_SPEC_DIR, entry.name);
    const baseName = path.basename(entry.name, path.extname(entry.name));
    if (!registry[baseName]) {
      registry[baseName] = absolutePath;
    }
    if (!registry[entry.name]) {
      registry[entry.name] = absolutePath;
    }
  }
}
