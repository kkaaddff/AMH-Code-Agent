/**
 * 需求文档相关 API 服务
 * 处理需求文档的生成、保存、导出和查询
 */

import { api } from '@/utils/apiService';
import { requirementMockService } from './mockRequirementService';
import { resolveRequest, shouldUseMock } from './baseService';

/**
 * 需求文档服务
 */
export const requirementService = {
  /**
   * 生成需求文档
   */
  async generateRequirement(params: {
    designId: string;
    rootAnnotation?: any;
    templateKey?: string;
    annotationVersion?: number;
    annotationSchemaVersion?: string;
  }) {
    return resolveRequest(
      shouldUseMock(),
      () => requirementMockService.generateRequirement(params),
      async () => {
        const response = await api.requirement.generate(params);
        return response.data;
      }
    );
  },

  /**
   * 保存需求文档
   */
  async saveRequirement(data: { docId: string; title?: string; content?: string; status?: string }) {
    return resolveRequest(
      shouldUseMock(),
      () => requirementMockService.saveRequirement(data),
      async () => {
        const response = await api.requirement.update(data);
        return response.data;
      }
    );
  },

  /**
   * 导出需求文档
   */
  async exportRequirement(params: { docId: string }) {
    return resolveRequest(
      shouldUseMock(),
      () => requirementMockService.exportRequirement(params),
      async () => {
        const response = await api.requirement.export(params.docId);
        return response.data;
      }
    );
  },

  /**
   * 获取需求文档详情
   */
  async getRequirementDetail(docId: string) {
    return resolveRequest(
      shouldUseMock(),
      () => requirementMockService.getRequirementDetail({ docId }),
      async () => {
        const response = await api.requirement.detail(docId);
        return response.data;
      }
    );
  },

  /**
   * 获取需求文档列表
   */
  async getRequirementList(params: { designId: string; page?: number; size?: number }) {
    return resolveRequest(
      shouldUseMock(),
      () => requirementMockService.getRequirementList(params),
      async () => {
        const response = await api.requirement.list(params);
        return response.data;
      }
    );
  },
};