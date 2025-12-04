/**
 * 基础数据模型类型定义
 */
import type { HttpMethod } from '@fta/shared-types';

// 重新导出共享类型
export type { HttpMethod };

/**
 * HTTP 方法选项（用于下拉选择）
 */
export const HTTP_METHOD_OPTIONS: { value: HttpMethod; label: string; color: string }[] = [
  { value: 'GET', label: 'GET', color: 'blue' },
  { value: 'POST', label: 'POST', color: 'green' },
  { value: 'PUT', label: 'PUT', color: 'orange' },
  { value: 'DELETE', label: 'DELETE', color: 'red' },
  { value: 'PATCH', label: 'PATCH', color: 'purple' },
  { value: 'HEAD', label: 'HEAD', color: 'default' },
  { value: 'OPTIONS', label: 'OPTIONS', color: 'default' },
];
