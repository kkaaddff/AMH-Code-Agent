/**
 * Component detection debug logging helpers.
 *
 * Usage:
 *   window.__toggleComponentDetectionDebug()  // Toggle debug logging (persisted in localStorage)
 * Shared logs appear with the "[ComponentDetectionV2]" prefix. Copy them when reporting issues.
 */

const LOG_STORAGE_KEY = 'component-detection-debug';
const LOG_GLOBAL_FLAG = '__FTA_COMPONENT_DETECTION_DEBUG__';

declare global {
  interface Window {
    __FTA_COMPONENT_DETECTION_DEBUG__?: boolean;
    __toggleComponentDetectionDebug?: () => void;
  }
}

const isLoggingEnabled = (): boolean => {
  if (typeof window === 'undefined') return false;

  const globalFlag = (window as any)[LOG_GLOBAL_FLAG] as boolean | undefined;
  if (typeof globalFlag === 'boolean') {
    return globalFlag;
  }

  try {
    const stored = window.localStorage?.getItem(LOG_STORAGE_KEY);
    if (stored !== null) {
      return stored === 'true';
    }
  } catch (error) {
    // Swallow storage access errors silently.
  }

  return false;
};

/**
 * 输出组件识别调试日志，需在调试模式开启后才会生效。
 * @param event 日志事件名称
 * @param payload 可选的附加数据
 */
export const componentDetectionDebugLog = (event: string, payload?: unknown) => {
  if (!isLoggingEnabled()) {
    return;
  }

  if (typeof payload !== 'undefined') {
    console.log('[ComponentDetectionV2]', event, payload);
  } else {
    console.log('[ComponentDetectionV2]', event);
  }
};

/**
 * 确保浏览器环境中注册调试开关，方便随时启用或关闭日志。
 */
export const ensureComponentDetectionDebugToggle = () => {
  if (typeof window === 'undefined') return;
  if (typeof window.__toggleComponentDetectionDebug === 'function') return;

  window.__toggleComponentDetectionDebug = () => {
    const currentState = isLoggingEnabled();
    const newState = !currentState;
    
    try {
      window.localStorage?.setItem(LOG_STORAGE_KEY, newState ? 'true' : 'false');
    } catch (error) {
      // Ignore persistence failures.
    }

    (window as any)[LOG_GLOBAL_FLAG] = newState;
    const status = newState ? 'enabled' : 'disabled';
    console.log(`[ComponentDetectionV2] debug logging ${status}`);
  };

  // Initialize the flag from storage so logging state is consistent across reloads.
  try {
    const stored = window.localStorage?.getItem(LOG_STORAGE_KEY);
    if (stored !== null) {
      (window as any)[LOG_GLOBAL_FLAG] = stored === 'true';
    }
  } catch (error) {
    // Ignore storage access errors.
  }
};

ensureComponentDetectionDebugToggle();

export {};
