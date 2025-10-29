/**
 * API 服务统一导出
 * 提供所有服务模块的统一入口
 */

// 导出各个服务模块
export { projectService } from './projectService';
export { dslService } from './dslService';
export { componentService } from './componentService';
export { requirementService } from './requirementService';
export { layoutService } from './layoutService';

// 导出基础服务功能
export { BaseAPIService, resolveRequest, shouldUseMock } from './baseService';

// 导出统一的服务对象，保持向后兼容
import { projectService } from './projectService';
import { dslService } from './dslService';
import { componentService } from './componentService';
import { requirementService } from './requirementService';
import { layoutService } from './layoutService';

export const apiServices = {
  project: projectService,
  dsl: dslService,
  component: componentService,
  requirement: requirementService,
  layout: layoutService,
};