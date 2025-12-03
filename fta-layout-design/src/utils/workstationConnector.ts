import { callService as originCallService, TCallServiceFunc } from '@fta/workstation-connector';

// 判断是否在 VSCode 环境下，通过 window.acquireVsCodeApi 判断
export const isInVscode: boolean = typeof (window as any).acquireVsCodeApi === 'function';

// 原始的 callService（可能为 undefined）
const rawCallService: TCallServiceFunc | undefined = isInVscode ? originCallService : undefined;

/**
 * Mock 数据辅助函数
 */
function getMockFileContent(filePath: string): string {
  // 根据文件路径返回 mock 内容
  if (filePath.includes('package.json')) {
    return JSON.stringify({ name: 'mock-project', version: '1.0.0' }, null, 2);
  }
  if (filePath.includes('.tsx') || filePath.includes('.ts')) {
    return `// Mock file content for ${filePath}\nexport default function MockComponent() {\n  return <div>Mock</div>;\n}`;
  }
  if (filePath.includes('.css')) {
    return `/* Mock CSS for ${filePath} */\n.mock-class {\n  color: #000;\n}`;
  }
  return `// Mock content for ${filePath}`;
}

function getMockDirectoryList(_dirPath: string): any[] {
  // 返回 mock 目录列表
  return [
    { name: 'src', type: 'directory' },
    { name: 'package.json', type: 'file' },
    { name: 'README.md', type: 'file' },
  ];
}

/**
 * 统一的 callService 包装函数
 * 如果存在真实的 callService，则使用真实服务；否则使用 mock 数据
 */
export const callService = async (service: string, method: string, params?: any): Promise<any> => {
  // 如果存在真实的 callService，直接使用
  if (rawCallService) {
    return rawCallService(service, method, params);
  }

  // 否则使用 mock 数据
  console.log(`[Mock] ${service}.${method}`, params);

  switch (service) {
    case 'common':
      switch (method) {
        case 'readFile':
          return getMockFileContent(params?.filePath || '');
        case 'writeFile':
          return `File ${params?.filePath || ''} written successfully (mock)`;
        case 'listDirectory':
          return getMockDirectoryList(params?.dirPath || '');
        case 'grep':
          // 返回与后端 grep 工具一致的格式
          return {
            returnDisplay: 'Found 0 files in 0ms. (mock)',
            llmContent: JSON.stringify({
              filenames: [],
              durationMs: 0,
              totalFiles: 0,
              returnedFiles: 0,
              truncated: false,
            }),
          };
        case 'glob':
          // 返回与后端 glob 工具一致的格式
          return {
            returnDisplay: 'Found 0 files in 0ms. (mock)',
            llmContent: JSON.stringify({
              filenames: [],
              durationMs: 0,
              numFiles: 0,
              truncated: false,
            }),
          };
        case 'editFile':
          // 返回与后端 edit 工具一致的格式
          return {
            llmContent: `File ${params?.file_path || ''} successfully edited. (mock)`,
            returnDisplay: {
              type: 'diff_viewer',
              filePath: params?.file_path || '',
              originalContent: { inputKey: 'old_string' },
              newContent: { inputKey: 'new_string' },
              absoluteFilePath: params?.file_path || '',
            },
          };
        case 'executeCommand':
          // 返回与后端 bash 工具一致的格式
          return {
            llmContent: [
              `Command: ${params?.command || ''}`,
              `Directory: (root)`,
              `Stdout: (mock output)`,
              `Stderr: (empty)`,
              `Error: (none)`,
              `Exit Code: 0`,
              `Signal: (none)`,
              `Background PIDs: (none)`,
              `Process Group PGID: (none)`,
            ].join('\n'),
            returnDisplay: 'Command executed successfully. (mock)',
          };
        case 'getBackgroundTaskOutput':
          // 返回与后端 bash_output 工具一致的格式
          return {
            llmContent: [
              `Command: (mock command)`,
              `Status: completed`,
              `PID: 12345`,
              `Created: ${new Date().toISOString()}`,
              '',
              'Output:',
              '(mock output)',
            ].join('\n'),
          };
        case 'killBackgroundTask':
          // 返回与后端 kill_bash 工具一致的格式
          return {
            llmContent: `Successfully terminated task ${params?.task_id || ''} (mock)`,
            isError: false,
          };
        default:
          throw new Error(`Mock method ${method} not implemented for service ${service}`);
      }
    default:
      throw new Error(`Mock service ${service} not implemented`);
  }
};
