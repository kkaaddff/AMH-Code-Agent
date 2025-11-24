// when run in local, it's should be runned with bun
export function isLocal(): boolean {
  return process.platform === 'darwin';
}
