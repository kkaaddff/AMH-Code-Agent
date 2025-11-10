// 判断是否为 macOS 系统
export function isLocal(): boolean {
  return process.platform === 'darwin';
}
