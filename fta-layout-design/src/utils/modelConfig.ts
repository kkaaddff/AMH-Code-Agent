/**
 * 模型配置管理工具
 * 用于管理 localStorage 中的 apiKey 和 baseURL 配置
 */

const STORAGE_KEY = 'fta_model_config';

export interface ModelConfig {
  apiKey?: string;
  baseURL?: string;
}

/**
 * 获取模型配置
 */
export function getModelConfig(): ModelConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('读取模型配置失败:', error);
  }
  return {};
}

/**
 * 保存模型配置
 */
export function saveModelConfig(config: ModelConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('保存模型配置失败:', error);
  }
}

/**
 * 清空模型配置
 */
export function clearModelConfig(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('清空模型配置失败:', error);
  }
}

/**
 * 检查配置是否完整
 */
export function isModelConfigComplete(config?: ModelConfig): boolean {
  const cfg = config || getModelConfig();
  return !!(cfg.apiKey && cfg.baseURL);
}
