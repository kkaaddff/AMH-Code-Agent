import fs from 'fs';
import { z } from 'zod';
import { createTool } from '../tool';
import { safeStringify } from '../utils/safeStringify';
import { loadSpecsFromDirectories } from './specReader';

type ComponentDocReaderOptions = {
  docDirectories?: string[];
  cwd: string;
};

// 将字符串转为 kebab-case
function toKebabCase(str: string): string {
  return str
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/([A-Z])([A-Z][a-z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
}

export function createComponentDocReaderTool(opts: ComponentDocReaderOptions) {
  const registry = loadSpecsFromDirectories(opts.docDirectories ?? [], opts.cwd);

  return createTool({
    name: 'read_component_doc',
    description:
      "Read the usage documentation of specified components from the fta-component library. Call this tool to fetch the relevant documentation when you need to understand a component's props, usage patterns, and important notes before making implementation decisions.",
    parameters: z.object({
      component_names: z
        .array(z.string())
        .min(1)
        .describe('List of component names to read documentation for, e.g., ["Button", "Modal"]'),
    }),
    getDescription: ({ params }) => {
      if (!params.component_names || params.component_names.length === 0) {
        return 'Read component usage documentation';
      }
      if (params.component_names.length === 1) {
        return `Read component documentation: ${params.component_names[0]}`;
      }
      return `Read documentation for multiple components: ${params.component_names.join(', ')}`;
    },
    execute: async ({ component_names }) => {
      const uniqueNames = Array.from(new Set(component_names));
      const missingComponents: string[] = [];
      const missingFiles: Array<{ component: string; path: string }> = [];
      const docs: Array<{ component: string; content: string }> = [];

      for (const name of uniqueNames) {
        // Always use kebab-case version of the name to lookup
        const kebabName = toKebabCase(name);
        const filePath = registry[kebabName];
        if (!filePath) {
          console.log(`🚩 组件 "${name}" (kebab-case: "${kebabName}") 的文档未注册`);
          missingComponents.push(name);
          continue;
        }
        if (!fs.existsSync(filePath)) {
          console.log(`🚩 组件 "${name}" 的文档不存在：${filePath}`);
          missingFiles.push({ component: name, path: filePath });
          continue;
        }
        try {
          const content = fs.readFileSync(filePath, 'utf-8');
          console.log(`🚩 组件 "${name}" 的文档存在：${filePath}`);
          docs.push({
            component: name,
            content,
          });
        } catch (error: any) {
          return {
            isError: true,
            llmContent: `读取组件 "${name}" 文档失败：${error.message}`,
          };
        }
      }

      if (missingComponents.length > 0 || missingFiles.length > 0) {
        return {
          isError: true,
          llmContent: [
            missingComponents.length > 0 ? `以下组件未注册：${missingComponents.join(', ')}` : undefined,
            missingFiles.length > 0
              ? `以下组件的文档文件不存在：${missingFiles.map((item) => `${item.component}(${item.path})`).join(', ')}`
              : undefined,
            docs.length > 0 ? '其余组件文档已读取' : undefined,
            `可用组件：${Object.keys(registry).join(', ') || '无'}`,
          ]
            .filter(Boolean)
            .join('\n'),
        };
      }

      return {
        llmContent: safeStringify({
          components: docs,
        }),
        returnDisplay: `已读取 ${docs.length} 个组件文档`,
      };
    },
    approval: {
      category: 'read',
    },
  });
}
