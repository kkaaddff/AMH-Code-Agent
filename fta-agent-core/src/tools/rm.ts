import fs from 'fs';
import path from 'pathe';
import { z } from 'zod';
import { createTool, type ToolResult } from '../tool';

export function createRmTool(opts: {
  cwd: string;
  toolProxy?: (toolName: string, params: any) => Promise<ToolResult>;
}) {
  return createTool({
    name: 'rm',
    description: `Delete a file from the local filesystem.
    
Usage:
- Provide the relative file path to delete
- Only files can be deleted, not directories
- The file must exist and be within the current working directory for safety`,
    parameters: z.object({
      file_path: z.string().describe('The path to the file to delete (absolute or relative to cwd)'),
    }),
    getDescription: ({ params, cwd }) => {
      if (!params.file_path || typeof params.file_path !== 'string') {
        return 'No file path provided';
      }
      return `Delete: ${path.relative(cwd, params.file_path)}`;
    },
    execute: async ({ file_path }) => {
      // If toolProxy is available, delegate to frontend
      if (opts.toolProxy) {
        try {
          const result = await opts.toolProxy('rm', { file_path });
          return result;
        } catch (error) {
          return {
            isError: true,
            llmContent: error instanceof Error ? error.message : 'Tool proxy execution failed',
          };
        }
      }

      // Otherwise, execute locally
      try {
        const fullFilePath = path.isAbsolute(file_path) ? file_path : path.resolve(opts.cwd, file_path);

        // Security: Validate file path to prevent traversal attacks
        const resolvedPath = path.resolve(fullFilePath);
        if (!resolvedPath.startsWith(opts.cwd)) {
          return {
            isError: true,
            llmContent:
              'Invalid file path: path traversal detected. File must be within the current working directory.',
          };
        }

        // Check if file exists
        if (!fs.existsSync(fullFilePath)) {
          return {
            isError: true,
            llmContent: `File does not exist: ${file_path}`,
          };
        }

        // Check if it's a file (not a directory)
        const stats = fs.statSync(fullFilePath);
        if (stats.isDirectory()) {
          return {
            isError: true,
            llmContent: `Cannot delete directory: ${file_path}. Use this tool only for files.`,
          };
        }

        // Read old content for potential undo/display
        const oldContent = fs.readFileSync(fullFilePath, 'utf-8');

        // Delete the file
        fs.unlinkSync(fullFilePath);

        return {
          llmContent: `File successfully deleted: ${file_path}`,
          returnDisplay: {
            type: 'diff_viewer',
            filePath: path.relative(opts.cwd, fullFilePath),
            absoluteFilePath: fullFilePath,
            originalContent: oldContent,
            newContent: '',
            writeType: 'delete',
          },
        };
      } catch (e) {
        return {
          isError: true,
          llmContent: e instanceof Error ? e.message : 'Unknown error',
        };
      }
    },
    approval: {
      category: 'write',
    },
  });
}
