import { z } from 'zod';
import { createTool } from '../tool';

export type FileDraft = {
  path: string;
  kind: 'file' | 'directory';
  content?: string;
  description?: string;
  tags?: string[];
};

export class FileDraftStore {
  drafts: FileDraft[];
  constructor() {
    this.drafts = [];
  }

  add(draft: FileDraft) {
    const existingIndex = this.drafts.findIndex((item) => item.path === draft.path && item.kind === draft.kind);
    if (existingIndex >= 0) {
      this.drafts[existingIndex] = draft;
    } else {
      this.drafts.push(draft);
    }
  }
}

export function createFileDraftTool(store: FileDraftStore) {
  return createTool({
    name: 'propose_file',
    description: `
登记即将生成的目录或文件。使用该工具输出文件路径、用途说明以及（若为文件）完整内容，供服务端在会话结束后真正落地。
`.trim(),
    parameters: z.object({
      path: z.string().describe('相对于项目根目录的路径，例如 src/pages/Home.tsx'),
      kind: z.enum(['file', 'directory']).describe('是生成文件还是目录'),
      description: z.string().optional().describe('说明该文件/目录的作用'),
      content: z
        .string()
        .optional()
        .describe('若 kind=file，则提供完整文件内容；目录无需填写'),
      tags: z.array(z.string()).optional().describe('可选标签，例如 ["layout","state"]'),
    }),
    getDescription: ({ params }) => {
      if (!params.path) {
        return '登记待生成的文件或目录';
      }
      return `登记 ${params.kind}：${params.path}`;
    },
    execute: async ({ path, kind, description, content, tags }) => {
      store.add({
        path,
        kind,
        description,
        content,
        tags,
      });
      return {
        llmContent: `已记录${kind === 'directory' ? '目录' : '文件'} ${path}`,
        returnDisplay: `记录 ${kind}: ${path}`,
      };
    },
    approval: {
      category: 'write',
    },
  });
}
