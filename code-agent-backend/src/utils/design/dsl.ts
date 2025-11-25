import { DesignDSL } from '@fta/shared-types';

/**
 * 将数字保留两位小数
 */
export function roundNumber(value: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return value;
  }
  return Number(value.toFixed(2));
}

/**
 * 递归处理 DesignDSL 数据中的所有数值字段，保留两位小数
 * 修复类型：递归处理 DSLData/DesignNode，避免类型错配
 */
export function normalizeNumericValues(obj: DesignDSL): DesignDSL {
  if (!obj || typeof obj !== 'object' || !('dsl' in obj)) return obj;

  const normalize = (value: any): any => {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return roundNumber(value);
    }
    if (Array.isArray(value)) {
      return value.map(normalize);
    }
    if (value && typeof value === 'object') {
      const output: any = {};
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          output[key] = normalize(value[key]);
        }
      }
      return output;
    }
    return value;
  };

  // 只对 obj.dsl（DSLData）递归
  return {
    ...obj,
    dsl: normalize(obj.dsl),
  } as DesignDSL;
}
