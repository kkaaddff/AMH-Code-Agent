/**
 * API 服务基础架构
 * 提供通用的请求处理和 Mock 功能
 */

const ENABLE_MOCK = import.meta.env.VITE_ENABLE_MOCK === 'true';

/**
 * 解析请求 - 根据 Mock 开关决定使用 Mock 数据还是真实 API
 */
export const resolveRequest = async <T>(
  useMock: boolean,
  mockHandler: () => Promise<T>,
  apiHandler: () => Promise<T>
): Promise<T> => {
  if (useMock) {
    return mockHandler();
  }
  return apiHandler();
};

/**
 * 检查是否启用 Mock
 */
export const shouldUseMock = (): boolean => ENABLE_MOCK;

/**
 * 基础 API 服务类
 * 提供通用的 API 调用方法
 */
export abstract class BaseAPIService {
  protected async makeRequest<T>(mockData: (() => Promise<T>) | null, apiCall: () => Promise<T>): Promise<T> {
    if (ENABLE_MOCK && mockData) {
      return mockData();
    }
    return apiCall();
  }

  protected async wrapAPIRequest<T>(apiCall: () => Promise<T>): Promise<T> {
    return this.makeRequest(null, apiCall);
  }
}
