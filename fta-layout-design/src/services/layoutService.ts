/**
 * 布局相关 API 服务
 * 处理布局数据的保存、加载和预览
 */

import { api } from '@/utils/apiService';

/**
 * 布局服务
 */
export const layoutService = {
  /**
   * 保存布局数据
   */
  async saveLayout(data: { projectId: string; layoutData: any }) {
    const response = await api.layout.save(data);
    return response.data;
  },

  /**
   * 加载布局数据
   */
  async loadLayout(projectId: string) {
    const response = await api.layout.load(projectId);
    return response.data;
  },

  /**
   * 预览布局
   */
  async previewLayout(params: { projectId: string; version?: string }) {
    const response = await api.layout.preview(params);
    return response.data;
  },
};