# API 服务层规范

## 服务层架构

### 整体设计原则

1. **分层架构**：UI → Service → API Client → HTTP Client
2. **单一职责**：每个服务类负责一个特定的业务领域
3. **依赖注入**：通过接口实现依赖倒置
4. **错误处理**：统一的错误处理机制
5. **类型安全**：完整的 TypeScript 类型定义

### 目录结构

```
src/services/
├── api/                    # API 接口定义
│   ├── auth.ts            # 认证相关接口
│   ├── user.ts            # 用户相关接口
│   └── common.ts          # 通用接口定义
├── http/                  # HTTP 客户端
│   ├── client.ts          # HTTP 客户端配置
│   ├── interceptors.ts    # 请求/响应拦截器
│   └── errorHandler.ts    # 错误处理
├── auth/                  # 认证服务
│   ├── authService.ts     # 认证业务逻辑
│   └── tokenManager.ts    # Token 管理
├── user/                  # 用户服务
│   ├── userService.ts     # 用户业务逻辑
│   └── profileService.ts  # 用户资料服务
└── types/                 # 服务层类型定义
    ├── api.ts             # API 响应类型
    └── common.ts          # 通用类型
```

## HTTP 客户端配置

### 基础客户端

```typescript
// http/client.ts
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { setupInterceptors } from './interceptors';

export interface HttpClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
}

export class HttpClient {
  private instance: AxiosInstance;

  constructor(config: HttpClientConfig) {
    this.instance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 10000,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers,
      },
    });

    setupInterceptors(this.instance);
  }

  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.get<T>(url, config);
    return response.data;
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.post<T>(url, data, config);
    return response.data;
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.put<T>(url, data, config);
    return response.data;
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.delete<T>(url, config);
    return response.data;
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response = await this.instance.patch<T>(url, data, config);
    return response.data;
  }
}

// 单例实例
export const httpClient = new HttpClient({
  baseURL: process.env.REACT_APP_API_BASE_URL || '/api',
  timeout: 15000,
});
```

### 请求/响应拦截器

```typescript
// http/interceptors.ts
import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { TokenManager } from '../auth/tokenManager';
import { refreshToken } from '../auth/authService';
import { ApiError } from './errorHandler';

export const setupInterceptors = (instance: AxiosInstance) => {
  // 请求拦截器
  instance.interceptors.request.use(
    (config: AxiosRequestConfig) => {
      const token = TokenManager.getAccessToken();
      if (token) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${token}`,
        };
      }

      // 添加请求 ID 用于追踪
      config.headers = {
        ...config.headers,
        'X-Request-ID': generateRequestId(),
      };

      return config;
    },
    (error) => {
      return Promise.reject(error);
    }
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response: AxiosResponse) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        try {
          const newToken = await refreshToken();
          TokenManager.setAccessToken(newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return instance(originalRequest);
        } catch (refreshError) {
          TokenManager.clearTokens();
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }

      return Promise.reject(new ApiError(error));
    }
  );
};
```

## 类型定义

### API 响应类型

```typescript
// types/api.ts
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  code?: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

export interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

### 实体类型定义

```typescript
// types/entities.ts
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: 'admin' | 'user' | 'guest';
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: 'Bearer';
}

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  confirmPassword: string;
}
```

## 服务层实现

### 基础服务类

```typescript
// services/baseService.ts
import { httpClient } from '../http/client';
import { ApiResponse, PaginatedResponse } from '../types/api';

export abstract class BaseService {
  protected http = httpClient;
  protected abstract basePath: string;

  protected async request<T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
    endpoint: string,
    data?: any,
    config?: any
  ): Promise<T> {
    const url = `${this.basePath}${endpoint}`;

    switch (method) {
      case 'GET':
        return this.http.get<T>(url, config);
      case 'POST':
        return this.http.post<T>(url, data, config);
      case 'PUT':
        return this.http.put<T>(url, data, config);
      case 'DELETE':
        return this.http.delete<T>(url, config);
      case 'PATCH':
        return this.http.patch<T>(url, data, config);
      default:
        throw new Error(`Unsupported HTTP method: ${method}`);
    }
  }

  protected async getPaginated<T>(
    endpoint: string,
    params?: {
      page?: number;
      pageSize?: number;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
      [key: string]: any;
    }
  ): Promise<PaginatedResponse<T>> {
    return this.request<PaginatedResponse<T>>('GET', endpoint, undefined, { params });
  }
}
```

### 认证服务

```typescript
// services/auth/authService.ts
import { BaseService } from '../baseService';
import { LoginRequest, RegisterRequest, AuthTokens, User } from '../types/entities';
import { ApiResponse } from '../types/api';

export class AuthService extends BaseService {
  protected basePath = '/auth';

  async login(credentials: LoginRequest): Promise<ApiResponse<AuthTokens>> {
    const response = await this.request<ApiResponse<AuthTokens>>('POST', '/login', credentials);

    if (response.success && response.data) {
      TokenManager.setTokens(response.data);
    }

    return response;
  }

  async register(userData: RegisterRequest): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('POST', '/register', userData);
  }

  async logout(): Promise<void> {
    try {
      await this.request('POST', '/logout');
    } finally {
      TokenManager.clearTokens();
    }
  }

  async refreshToken(): Promise<string> {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await this.request<ApiResponse<{ accessToken: string }>>('POST', '/refresh', {
      refreshToken,
    });

    if (response.success && response.data) {
      TokenManager.setAccessToken(response.data.accessToken);
      return response.data.accessToken;
    }

    throw new Error('Token refresh failed');
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('GET', '/me');
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('POST', '/change-password', {
      oldPassword,
      newPassword,
    });
  }
}

export const authService = new AuthService();
```

### 用户服务

```typescript
// services/user/userService.ts
import { BaseService } from '../baseService';
import { User } from '../types/entities';
import { ApiResponse, PaginatedResponse } from '../types/api';

export interface UpdateUserProfileRequest {
  name?: string;
  avatar?: string;
  bio?: string;
}

export class UserService extends BaseService {
  protected basePath = '/users';

  async getProfile(userId: string): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('GET', `/${userId}`);
  }

  async updateProfile(userId: string, data: UpdateUserProfileRequest): Promise<ApiResponse<User>> {
    return this.request<ApiResponse<User>>('PUT', `/${userId}`, data);
  }

  async searchUsers(query: string, page = 1, pageSize = 20): Promise<PaginatedResponse<User>> {
    return this.getPaginated<User>('/search', {
      q: query,
      page,
      pageSize,
    });
  }

  async uploadAvatar(userId: string, file: File): Promise<ApiResponse<{ avatarUrl: string }>> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.request<ApiResponse<{ avatarUrl: string }>>('POST', `/${userId}/avatar`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  }

  async deleteAccount(userId: string): Promise<ApiResponse<void>> {
    return this.request<ApiResponse<void>>('DELETE', `/${userId}`);
  }
}

export const userService = new UserService();
```

### Token 管理

```typescript
// services/auth/tokenManager.ts
export interface TokenStorage {
  getAccessToken(): string | null;
  getRefreshToken(): string | null;
  setTokens(tokens: AuthTokens): void;
  setAccessToken(token: string): void;
  clearTokens(): void;
  isTokenExpired(token: string): boolean;
}

export class LocalStorageTokenManager implements TokenStorage {
  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly TOKEN_EXPIRY_KEY = 'token_expiry';

  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, tokens.accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, tokens.refreshToken);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, String(Date.now() + tokens.expiresIn * 1000));
  }

  setAccessToken(token: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, token);
  }

  clearTokens(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.TOKEN_EXPIRY_KEY);
  }

  isTokenExpired(token?: string): boolean {
    const expiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!expiry) return true;

    return Date.now() > parseInt(expiry, 10);
  }
}

export const TokenManager = new LocalStorageTokenManager();
```

## 错误处理

### 自定义错误类

```typescript
// http/errorHandler.ts
export class ApiError extends Error {
  public readonly code: string;
  public readonly status: number;
  public readonly details?: Record<string, any>;

  constructor(error: any) {
    super(error.response?.data?.error?.message || error.message || 'API Error');
    this.name = 'ApiError';
    this.code = error.response?.data?.error?.code || 'UNKNOWN_ERROR';
    this.status = error.response?.status || 500;
    this.details = error.response?.data?.error?.details;
  }

  public isNetworkError(): boolean {
    return this.code === 'NETWORK_ERROR' || this.status === 0;
  }

  public isAuthenticationError(): boolean {
    return this.status === 401;
  }

  public isAuthorizationError(): boolean {
    return this.status === 403;
  }

  public isValidationError(): boolean {
    return this.status === 422;
  }

  public isNotFoundError(): boolean {
    return this.status === 404;
  }
}
```

### 全局错误处理

```typescript
// services/errorHandler.ts
import { toast } from 'react-toastify';
import { ApiError } from '../http/errorHandler';

export class GlobalErrorHandler {
  static handle(error: any): void {
    if (error instanceof ApiError) {
      this.handleApiError(error);
    } else if (error instanceof Error) {
      this.handleGenericError(error);
    } else {
      this.handleUnknownError(error);
    }
  }

  private static handleApiError(error: ApiError): void {
    switch (true) {
      case error.isNetworkError():
        toast.error('网络连接失败，请检查网络设置');
        break;
      case error.isAuthenticationError():
        toast.error('登录已过期，请重新登录');
        // 跳转到登录页
        break;
      case error.isAuthorizationError():
        toast.error('没有权限执行此操作');
        break;
      case error.isValidationError():
        this.handleValidationError(error.details);
        break;
      case error.isNotFoundError():
        toast.error('请求的资源不存在');
        break;
      default:
        toast.error(error.message || '操作失败');
    }
  }

  private static handleValidationError(details?: Record<string, any>): void {
    if (details && typeof details === 'object') {
      Object.entries(details).forEach(([field, messages]) => {
        const message = Array.isArray(messages) ? messages.join(', ') : messages;
        toast.error(`${field}: ${message}`);
      });
    } else {
      toast.error('输入数据验证失败');
    }
  }

  private static handleGenericError(error: Error): void {
    console.error('Generic error:', error);
    toast.error(error.message || '操作失败');
  }

  private static handleUnknownError(error: any): void {
    console.error('Unknown error:', error);
    toast.error('发生未知错误，请稍后重试');
  }
}
```

## 缓存策略

### 简单缓存实现

```typescript
// services/cache.ts
export interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiry: number;
}

export class SimpleCache {
  private cache = new Map<string, CacheItem<any>>();

  set<T>(key: string, data: T, ttlMs = 5 * 60 * 1000): void {
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
      expiry: Date.now() + ttlMs,
    };

    this.cache.set(key, item);
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  clear(): void {
    this.cache.clear();
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiry) {
        this.cache.delete(key);
      }
    }
  }
}

export const cache = new SimpleCache();

// 定期清理过期缓存
setInterval(() => cache.cleanup(), 60 * 1000);
```

### 带缓存的服务

```typescript
// services/user/userService.ts (扩展)
export class UserService extends BaseService {
  private cache = new SimpleCache();

  async getProfile(userId: string, useCache = true): Promise<ApiResponse<User>> {
    const cacheKey = `user-profile-${userId}`;

    if (useCache) {
      const cached = this.cache.get<ApiResponse<User>>(cacheKey);
      if (cached) return cached;
    }

    const response = await this.request<ApiResponse<User>>('GET', `/${userId}`);

    if (useCache && response.success) {
      this.cache.set(cacheKey, response, 10 * 60 * 1000); // 10分钟缓存
    }

    return response;
  }

  async updateProfile(userId: string, data: UpdateUserProfileRequest): Promise<ApiResponse<User>> {
    const response = await this.request<ApiResponse<User>>('PUT', `/${userId}`, data);

    // 更新后清除缓存
    this.cache.delete(`user-profile-${userId}`);

    return response;
  }
}
```

## 服务使用示例

### 在 React Hook 中使用

```typescript
// hooks/useAuth.ts
import { useState, useEffect, useCallback } from 'react';
import { authService } from '../services/auth/authService';
import { User } from '../services/types/entities';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      const response = await authService.login({ email, password });

      if (response.success) {
        const userResponse = await authService.getCurrentUser();
        if (userResponse.success) {
          setUser(userResponse.data);
        }
      }
    } catch (err) {
      setError(err as Error);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
      // 即使 API 调用失败，也要清除本地状态
      setUser(null);
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (TokenManager.getAccessToken()) {
          const response = await authService.getCurrentUser();
          if (response.success) {
            setUser(response.data);
          }
        }
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  return {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    logout,
  };
};
```

## 最佳实践

### 1. 环境配置

```typescript
// config/api.ts
export const API_CONFIG = {
  BASE_URL: process.env.REACT_APP_API_BASE_URL || '/api',
  TIMEOUT: parseInt(process.env.REACT_APP_API_TIMEOUT || '15000'),
  RETRY_ATTEMPTS: parseInt(process.env.REACT_APP_API_RETRY_ATTEMPTS || '3'),
  RETRY_DELAY: parseInt(process.env.REACT_APP_API_RETRY_DELAY || '1000'),
};
```

### 2. 请求重试机制

```typescript
// utils/retry.ts
export const withRetry = async <T>(fn: () => Promise<T>, maxAttempts = 3, delay = 1000): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        break;
      }

      // 指数退避
      await new Promise((resolve) => setTimeout(resolve, delay * Math.pow(2, attempt - 1)));
    }
  }

  throw lastError!;
};
```

### 3. 请求取消

```typescript
// hooks/useApiRequest.ts
import { useState, useEffect, useRef } from 'react';

export const useApiRequest = <T>(requestFn: () => Promise<T>, dependencies: any[] = []) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      // 取消之前的请求
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();
      setLoading(true);
      setError(null);

      try {
        const result = await requestFn();
        setData(result);
      } catch (err) {
        if (err instanceof Error && err.name !== 'AbortError') {
          setError(err);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, dependencies);

  return { data, loading, error };
};
```

## 测试策略

### Mock 服务

```typescript
// __tests__/mocks/mockUserService.ts
export const mockUserService = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
  searchUsers: jest.fn(),
  uploadAvatar: jest.fn(),
  deleteAccount: jest.fn(),
};

// 测试示例
describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch user profile successfully', async () => {
    const mockUser = { id: '1', name: 'John Doe', email: 'john@example.com' };
    mockUserService.getProfile.mockResolvedValue({
      success: true,
      data: mockUser,
    });

    const result = await userService.getProfile('1');

    expect(mockUserService.getProfile).toHaveBeenCalledWith('1');
    expect(result.data).toEqual(mockUser);
  });
});
```

通过这套完整的服务层规范，可以确保 API 调用的统一性、可维护性和可扩展性，同时提供良好的错误处理和缓存机制。
