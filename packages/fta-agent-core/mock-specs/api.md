# API 设计规范

## API 架构原则

### 1. RESTful 设计

- 使用标准的 HTTP 方法：GET（查询）、POST（创建）、PUT（更新）、DELETE（删除）
- 使用语义化的 URL 结构
- 使用合适的 HTTP 状态码

### 2. 统一响应格式

```typescript
interface ApiResponse<T> {
  code: number; // 业务状态码
  message: string; // 响应消息
  data: T; // 响应数据
  timestamp: number; // 时间戳
  traceId?: string; // 链路追踪 ID
}

interface ApiError {
  code: number;
  message: string;
  details?: any;
  timestamp: number;
}
```

### 3. 版本控制

- API 版本通过 URL 路径管理：`/api/v1/...`
- 重大变更需要新版本，向后兼容的变更可保持版本不变

## 服务端交互规范

### 请求拦截器

```typescript
// src/services/interceptors.ts
import axios from 'axios';
import { getToken } from '@/utils/auth';

const requestInterceptor = (config: AxiosRequestConfig) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  config.headers['X-Request-ID'] = generateRequestId();
  return config;
};

const responseInterceptor = (response: AxiosResponse) => {
  const { code, message, data } = response.data;

  if (code === 0) {
    return data;
  } else if (code === 401) {
    // 未授权，跳转到登录
    redirectToLogin();
  } else {
    throw new ApiError(code, message);
  }
};
```

### 错误处理

```typescript
interface ErrorCodeMap {
  [key: number]: string;
}

const ERROR_CODE_MAP: ErrorCodeMap = {
  400: '请求参数错误',
  401: '未授权访问',
  403: '权限不足',
  404: '资源不存在',
  500: '服务器内部错误',
  502: '网关错误',
  503: '服务不可用',
};

class ApiError extends Error {
  constructor(public code: number, message: string, public details?: any) {
    super(message);
    this.name = 'ApiError';
  }
}
```

## API 服务组织

### 目录结构

```
src/services/
├── api/                    # API 接口定义
│   ├── types/             # API 类型定义
│   ├── endpoints/         # 端点配置
│   └── clients/           # API 客户端
├── auth/                  # 认证服务
├── cache/                 # 缓存服务
├── storage/               # 存储服务
└── websocket/             # WebSocket 服务
```

### API 客户端封装

```typescript
// src/services/api/clients/baseClient.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class BaseApiClient {
  protected client: AxiosInstance;

  constructor(baseURL: string, config?: AxiosRequestConfig) {
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      ...config,
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    this.client.interceptors.request.use(requestInterceptor);
    this.client.interceptors.response.use(responseInterceptor);
  }
}
```

### 具体业务 API

```typescript
// src/services/api/userApi.ts
import { BaseApiClient } from './clients/baseClient';
import type { User, UserProfile, UpdateUserRequest } from './types/user';

class UserApi extends BaseApiClient {
  constructor() {
    super('/api/v1/users');
  }

  async getUserProfile(userId: string): Promise<UserProfile> {
    return this.client.get(`/${userId}/profile`);
  }

  async updateUser(userId: string, data: UpdateUserRequest): Promise<User> {
    return this.client.put(`/${userId}`, data);
  }

  async uploadAvatar(userId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append('avatar', file);

    return this.client.post(`/${userId}/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  }
}

export const userApi = new UserApi();
```

## 数据缓存策略

### 缓存层级

1. **内存缓存**：当前会话数据
2. **本地存储**：用户偏好设置
3. **IndexedDB**：大量结构化数据
4. **Service Worker**：离线缓存

### 缓存失效策略

```typescript
interface CacheConfig {
  ttl: number; // 生存时间（毫秒）
  staleWhileRevalidate?: boolean; // 过期后是否继续使用旧数据
  key: string; // 缓存键
}

class CacheManager {
  async get<T>(key: string): Promise<T | null> {
    const cached = await this.storage.get(key);
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }
    return null;
  }

  async set<T>(key: string, data: T, config: CacheConfig): Promise<void> {
    const cacheItem = {
      data,
      expireAt: Date.now() + config.ttl,
      staleWhileRevalidate: config.staleWhileRevalidate,
    };
    await this.storage.set(key, cacheItem);
  }

  private isExpired(cached: any): boolean {
    return Date.now() > cached.expireAt;
  }
}
```

## 平台适配

### 多平台 API 适配

```typescript
// src/services/api/clients/platformClient.ts
import { BaseApiClient } from './baseClient';

export class PlatformApiClient extends BaseApiClient {
  constructor(platform: string) {
    const platformConfig = {
      weapp: { baseURL: 'https://api.weapp.com/v1' },
      alipay: { baseURL: 'https://api.alipay.com/v1' },
      h5: { baseURL: 'https://api.h5.com/v1' },
      mw: { baseURL: 'https://api.mw.com/v1' },
    };

    super(platformConfig[platform].baseURL);
  }
}
```

## 性能优化

### 请求合并

```typescript
class RequestBatcher {
  private batchQueue: Map<string, Promise<any>[]> = new Map();
  private batchTimer: NodeJS.Timeout | null = null;

  async batchRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
    if (!this.batchQueue.has(key)) {
      this.batchQueue.set(key, []);
      this.scheduleBatch();
    }

    return new Promise((resolve, reject) => {
      this.batchQueue.get(key)!.push({ resolve, reject, request });
    });
  }

  private scheduleBatch() {
    if (this.batchTimer) return;

    this.batchTimer = setTimeout(() => {
      this.executeBatch();
      this.batchTimer = null;
    }, 50); // 50ms 延迟
  }
}
```

### 请求去重

```typescript
class RequestDeduplicator {
  private pendingRequests: Map<string, Promise<any>> = new Map();

  async deduplicatedRequest<T>(key: string, request: () => Promise<T>): Promise<T> {
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key);
    }

    const promise = request().finally(() => {
      this.pendingRequests.delete(key);
    });

    this.pendingRequests.set(key, promise);
    return promise;
  }
}
```

## 安全规范

### 敏感数据处理

1. **不在 URL 中传输敏感信息**
2. **使用 HTTPS 进行加密传输**
3. **Token 存储在安全位置**
4. **输入验证和输出编码**

### CORS 处理

```typescript
const corsConfig = {
  origin: process.env.NODE_ENV === 'production' ? 'https://your-domain.com' : 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};
```

## 监控和日志

### API 调用监控

```typescript
interface ApiMetric {
  endpoint: string;
  method: string;
  status: number;
  duration: number;
  timestamp: number;
}

class ApiMonitor {
  recordMetric(metric: ApiMetric) {
    // 发送到监控系统
    this.sendToMonitor(metric);

    // 本地日志记录
    console.log(`[API] ${metric.method} ${metric.endpoint} - ${metric.status} (${metric.duration}ms)`);
  }
}
```
