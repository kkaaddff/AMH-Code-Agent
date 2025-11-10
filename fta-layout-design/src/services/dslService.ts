/**
 * DSL 相关 API 服务
 * 处理 DSL 文件的上传、解析和导出
 */

import { DesignDSL, DSLData } from '@/types/dsl';
import { api } from '@/utils/apiService';

/**
 * DSL 服务
 */
export const dslService = {
  /**
   * 上传 DSL 文件
   */
  async uploadDSL(file: File, projectId?: string) {
    const response = await api.dsl.upload(file, projectId ? { projectId } : undefined);
    return response.data;
  },

  /**
   * 解析 DSL 内容
   */
  async parseDSL(data: { dslContent: string; projectId?: string }) {
    const response = await api.dsl.parse(data);
    return response.data;
  },

  /**
   * 导出 DSL
   */
  async exportDSL(params: { projectId: string; format?: string }) {
    const response = await api.dsl.export(params);
    return response.data;
  },

  /**
   * 处理 DSL 数据（转换 PATH 为 LAYER 等）
   */
  async processDSL(data: { dsl: DSLData; convertPaths?: boolean; keepOriginalPaths?: boolean }) {
    const response = await api.dsl.process(data);
    return response.data as DesignDSL;
  },
};
