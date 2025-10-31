import { TodoItem } from "./types";

/**
 * 伪 API 调用 - 日志记录
 */
export function logToFile(uid: string, type: string, data: any): void {
  // 这是一个伪函数调用，实际应该写入日志文件
  const timestamp = new Date().toISOString();
  console.log(`[Log] ${timestamp} uid=${uid} ${type}:`, JSON.stringify(data, null, 2));
}

// ==================== 辅助函数 ====================

/**
 * 生成唯一 UID
 */
export function generateUID(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 9);
  return `${timestamp}-${random}`;
}

/**
 * 格式化 TODO 列表为字符串
 */
export function formatTodos(todos: TodoItem[]): string {
  return todos
    .map((todo, index) => {
      const status = todo.status === 'completed' ? '✓' : todo.status === 'in_progress' ? '→' : '○';
      return `${status} ${index + 1}. ${todo.content}`;
    })
    .join('\n');
}

/**
 * 解析工具调用结果
 */
export function parseToolResult(result: string): any {
  try {
    return JSON.parse(result);
  } catch {
    return result;
  }
}
