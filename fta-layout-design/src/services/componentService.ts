/**
 * 组件识别相关 API 服务
 * 处理组件检测、AI识别和组件管理
 */

import { api } from '@/utils/apiService';

/**
 * 组件服务
 */
export const componentService = {
  /**
   * 检测组件
   */
  async detectComponents(data: { dslData: any; options?: any }) {
    const response = await api.component.detect(data);
    return response.data;
  },

  /**
   * AI 识别组件
   */
  async recognizeComponents(data: { imageData: string; components: any[] }) {
    const response = await api.component.recognize(data);
    return response.data;
  },

  /**
   * 保存组件识别结果
   */
  async saveComponents(data: { projectId: string; components: any[] }) {
    const response = await api.component.save(data);
    return response.data;
  },

  /**
   * 获取组件列表
   */
  async getComponents(projectId: string) {
    const response = await api.component.list(projectId);
    return response.data;
  },
};