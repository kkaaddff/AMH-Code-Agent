import { z } from 'zod';
import { createTool, type ToolResult } from '../tool';
import { TOOL_NAMES } from '../constants';

export function createVerifyTool(opts: {
  cwd: string;
  toolProxy?: (toolName: string, params: any) => Promise<ToolResult>;
}) {
  return createTool({
    name: TOOL_NAMES.VERIFY,
    description: `Verify generated code files for fatal errors.
    
Usage:
- Call this tool after generating code to check for compilation/syntax errors
- Returns a list of errors and warnings found in the files
- Use this to ensure generated code is syntactically correct before completing the task

Note: This tool is designed to catch fatal errors like:
- Syntax errors
- Missing imports
- Type errors (for TypeScript files)
- Unresolved references`,
    parameters: z.object({}),
    getDescription: () => {
      return 'Verify generated files';
    },
    execute: async () => {
      // If toolProxy is available, delegate to frontend (IDE has better verification capabilities)
      if (opts.toolProxy) {
        try {
          const result = await opts.toolProxy(TOOL_NAMES.VERIFY, {});
          return result;
        } catch (error) {
          return {
            isError: true,
            llmContent: error instanceof Error ? error.message : 'Tool proxy execution failed',
          };
        }
      }

      // Local execution: no files to verify without toolProxy
      return {
        llmContent: 'Verify tool requires IDE integration. Please use toolProxy mode.',
        returnDisplay: 'Verification skipped (no IDE integration)',
      };
    },
    approval: {
      category: 'read',
    },
  });
}
