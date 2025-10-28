import { AnnotationNode } from '@/pages/EditorPage/types/componentDetectionV2';
import { DSLData } from './dsl';

export interface Project {
  id: string;
  name: string;
  description?: string;
  gitRepository?: string;
  manager: string;
  createdAt: string;
  updatedAt: string;
  status: 'active' | 'archived' | 'draft' | 'completed' | 'paused';
  progress: number;
  members: number;
  tags: string[];
  avatar?: string;
  pages: Page[];
}

export interface ProjectListParams {
  page?: number;
  size?: number;
}

export interface ProjectListResponse {
  list: Project[];
  total: number;
  page: number;
  size: number;
}

export interface Page {
  id: string;
  projectId: string;
  name: string;
  routePath: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
  designSpecs: DesignSpec[];
  prds: PRD[];
  components: Component[];
  // 关联文档字段 - 统一的对象数组，同时维护URL和状态
  designDocuments: DocumentReference[]; // 设计稿文档列表
  prdDocuments: DocumentReference[]; // PRD文档列表
  openapiDocuments: DocumentReference[]; // OpenAPI文档列表
}

export interface DesignSpec {
  id: string;
  pageId: string;
  name: string;
  originalName: string;
  size: number;
  type: string;
  url: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  createdAt: string;
  updatedAt: string;
  processedAt?: string;
  layoutEdited: boolean;
  processingHistory: ProcessingHistoryItem[];
}

export interface PRD {
  id: string;
  pageId: string;
  title: string;
  content: string;
  version: string;
  createdAt: string;
  updatedAt: string;
  url?: string;
  status: 'pending' | 'synced' | 'editing' | 'completed';
  syncHistory: SyncHistoryItem[];
}

export interface Component {
  id: string;
  pageId: string;
  name: string;
  type: string;
  code: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectForm {
  name: string;
  description?: string;
  gitRepository?: string;
  manager: string;
  avatar?: string;
  tags?: string[];
  status?: Project['status'];
  progress?: number;
  members?: number;
}

export interface CreatePageForm {
  name: string;
  routePath: string;
  description?: string;
  designUrls?: string[]; // 支持多个设计稿URL（兼容旧接口）
  prdUrls?: string[]; // 支持多个PRD文档URL（兼容旧接口）
  openapiUrls?: string[]; // 支持多个OpenAPI文档URL（兼容旧接口）
}

export interface ProcessingHistoryItem {
  id: string;
  status: DesignSpec['status'];
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'editing' | 'completed' | 'failed';

export interface AnnotationSnapshot {
  rootAnnotation: AnnotationNode | null;
  savedAt: number;
  version: string;
}
export interface DocumentReference {
  id: string;
  url: string;
  name?: string;
  status: SyncStatus;
  type?: 'design' | 'prd' | 'openapi';
  lastSyncAt?: string;
  progress?: number;
  error?: string;
  createdAt: string;
  updatedAt: string;
  annotationData?: AnnotationSnapshot;
  data?: DSLData;
}

export interface SyncHistoryItem {
  id: string;
  action: 'sync' | 'edit' | 'complete';
  status: SyncStatus;
  message: string;
  timestamp: string;
  details?: Record<string, any>;
}
