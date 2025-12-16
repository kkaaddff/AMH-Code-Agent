/**
 * 最近选择组件的 LRU 存储管理
 *
 * 逻辑：
 * - 最多保存 5 条最近选择
 * - 第一条固定展示上次选择，以此类推
 * - 使用 LRU 算法更新数组：新选择的组件移至最前，超过 5 条时移除最旧的
 */

const STORAGE_KEY = 'fta-recent-components';
const MAX_RECENT_COUNT = 5;

/**
 * 获取最近选择的组件列表
 */
export function getRecentComponents(): string[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    if (!Array.isArray(parsed)) return [];
    // 过滤掉非字符串项并限制数量
    return parsed.filter((item): item is string => typeof item === 'string').slice(0, MAX_RECENT_COUNT);
  } catch {
    return [];
  }
}

/**
 * 添加组件到最近选择列表（LRU 更新）
 *
 * @param componentName 组件名称
 * @returns 更新后的最近选择列表
 */
export function addRecentComponent(componentName: string): string[] {
  if (!componentName) return getRecentComponents();

  const recent = getRecentComponents();

  // LRU 更新：移除已存在的相同项
  const filtered = recent.filter((name) => name !== componentName);

  // 将新项插入到最前面
  const updated = [componentName, ...filtered].slice(0, MAX_RECENT_COUNT);

  // 保存到 localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch {
    // localStorage 写入失败时静默处理
  }

  return updated;
}

/**
 * 清空最近选择列表
 */
export function clearRecentComponents(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // 静默处理
  }
}
