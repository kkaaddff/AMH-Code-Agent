import { ApiProperty } from '@midwayjs/swagger';

// Common Response Types
export class BaseResponse<T = any> {
  @ApiProperty({ description: '是否成功' })
  success: boolean;

  @ApiProperty({ description: '响应数据' })
  data?: T;

  @ApiProperty({ description: '响应消息' })
  message?: string;

  @ApiProperty({ description: '响应代码' })
  code?: number;

  constructor(data?: T, success: boolean = true, message?: string, code?: number) {
    this.success = success;
    this.data = data;
    this.message = message;
    this.code = code;
  }
}

export class PaginatedResponse<T = any> extends BaseResponse {
  @ApiProperty({
    description: '分页数据',
    properties: {
      list: {
        type: 'array',
        description: '数据列表',
        items: { type: 'object' },
      },
      total: { type: 'number', description: '总数量' },
      page: { type: 'number', description: '当前页码' },
      size: { type: 'number', description: '每页数量' },
    },
  })
  data: {
    list: T[];
    total: number;
    page: number;
    size: number;
  };

  constructor(list: T[], total: number, page: number, size: number) {
    super({
      list,
      total,
      page,
      size,
    });
    this.data = {
      list,
      total,
      page,
      size,
    };
  }
}

// Simple project type for Swagger (avoiding entity references)
interface SimpleProject {
  id: string;
  name: string;
  description?: string;
  gitRepository?: string;
  manager: string;
  status: string;
  progress: number;
  members: number;
  tags: string[];
  avatar: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: string;
  gitId: string;
  workdirs: string[];
}

// Project Response Types
export class ProjectListResponse extends PaginatedResponse<SimpleProject> {
  constructor(list: SimpleProject[] | any[], total: number, page: number, size: number) {
    super(list as SimpleProject[], total, page, size);
  }
}

export class ProjectDetailResponse extends BaseResponse<SimpleProject> {
  constructor(project: SimpleProject | any) {
    super(project as SimpleProject, true, 'Project retrieved successfully');
  }
}

export class CreateProjectResponse extends BaseResponse<SimpleProject> {
  constructor(project: SimpleProject | any) {
    super(project as SimpleProject, true, 'Project created successfully');
  }
}

export class UpdateProjectResponse extends BaseResponse<SimpleProject> {
  constructor(project: SimpleProject | any) {
    super(project as SimpleProject, true, 'Project updated successfully');
  }
}

export class DeleteProjectResponse extends BaseResponse<boolean> {
  constructor() {
    super(true, true, 'Project deleted successfully');
  }
}

export class CreatePageResponse extends BaseResponse<SimpleProject> {
  constructor(project: SimpleProject | any) {
    super(project as SimpleProject, true, 'Page created successfully');
  }
}

export class UpdatePageResponse extends BaseResponse<SimpleProject> {
  constructor(project: SimpleProject | any) {
    super(project as SimpleProject, true, 'Page updated successfully');
  }
}

export class DeletePageResponse extends BaseResponse<SimpleProject> {
  constructor(project: SimpleProject | any) {
    super(project as SimpleProject, true, 'Page deleted successfully');
  }
}

// Simple page type for Swagger
interface SimplePage {
  id: string;
  projectId?: string;
  name: string;
  routePath: string;
  description?: string;
  designUrls?: string[];
  prdUrls?: string[];
  openapiUrls?: string[];
  documents?: any[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  gitId: string;
}

export class PageDetailResponse extends BaseResponse<SimplePage> {
  constructor(page: SimplePage | any) {
    super(page as SimplePage, true, 'Page retrieved successfully');
  }
}

export class UpdateDocumentStatusResponse extends BaseResponse<SimpleProject> {
  constructor(project: SimpleProject | any) {
    super(project as SimpleProject, true, 'Document status updated successfully');
  }
}

export class SyncDocumentResponse extends BaseResponse<SimpleProject> {
  constructor(project: SimpleProject | any) {
    super(project as SimpleProject, true, 'Document synced successfully');
  }
}

export class GetDocumentContentResponse extends BaseResponse<any> {
  constructor(content: any) {
    super(content, true, 'Document content retrieved successfully');
  }
}

export class UpdateDocumentResponse extends BaseResponse<SimpleProject> {
  constructor(project: SimpleProject | any) {
    super(project as SimpleProject, true, 'Document updated successfully');
  }
}

export class ResolveProjectContextResponse extends BaseResponse<{
  matchedProject?: SimpleProject | null;
  matchedBy?: 'gitId' | 'workdir' | null;
  resolvedGitId?: string | null;
  requestedWorkdir?: string | null;
  projects: SimpleProject[];
}> {
  constructor(payload: {
    matchedProject?: SimpleProject | null;
    matchedBy?: 'gitId' | 'workdir' | null;
    resolvedGitId?: string | null;
    requestedWorkdir?: string | null;
    projects: SimpleProject[];
  }) {
    super(payload, true, 'Project context resolved successfully');
  }
}

export class BindProjectContextResponse extends BaseResponse<SimpleProject> {
  constructor(project: SimpleProject | any) {
    super(project as SimpleProject, true, 'Project binding updated successfully');
  }
}

// GitLab Response Types
export class GetGitlabProjectIdResponse extends BaseResponse<{ gitId: string }> {
  constructor(gitId: string) {
    super({ gitId }, true, 'GitLab project ID retrieved successfully');
  }
}

// Interface Data Model Response Types
interface SimpleDataModel {
  id: string;
  pageId: string;
  name: string;
  description?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  requestSchema?: any[];
  responseSchema?: any[];
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: string;
}

export class DataModelListResponse extends BaseResponse<SimpleDataModel[]> {
  constructor(dataModels: SimpleDataModel[] | any[]) {
    super(dataModels as SimpleDataModel[], true, 'Data models retrieved successfully');
  }
}

export class DataModelDetailResponse extends BaseResponse<SimpleDataModel> {
  constructor(dataModel: SimpleDataModel | any) {
    super(dataModel as SimpleDataModel, true, 'Data model retrieved successfully');
  }
}

export class CreateDataModelResponse extends BaseResponse<SimpleDataModel> {
  constructor(dataModel: SimpleDataModel | any) {
    super(dataModel as SimpleDataModel, true, 'Data model created successfully');
  }
}

export class UpdateDataModelResponse extends BaseResponse<SimpleDataModel> {
  constructor(dataModel: SimpleDataModel | any) {
    super(dataModel as SimpleDataModel, true, 'Data model updated successfully');
  }
}

export class DeleteDataModelResponse extends BaseResponse<boolean> {
  constructor() {
    super(true, true, 'Data model deleted successfully');
  }
}

// ============ 新数据模型相关响应 DTO ============

// DataModelGroup 响应类型
interface SimpleDataModelGroup {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: string;
}

export class DataModelGroupListResponse extends BaseResponse<SimpleDataModelGroup[]> {
  constructor(groups: SimpleDataModelGroup[] | any[]) {
    super(groups as SimpleDataModelGroup[], true, 'Data model groups retrieved successfully');
  }
}

export class DataModelGroupDetailResponse extends BaseResponse<SimpleDataModelGroup> {
  constructor(group: SimpleDataModelGroup | any) {
    super(group as SimpleDataModelGroup, true, 'Data model group retrieved successfully');
  }
}

export class CreateDataModelGroupResponse extends BaseResponse<SimpleDataModelGroup> {
  constructor(group: SimpleDataModelGroup | any) {
    super(group as SimpleDataModelGroup, true, 'Data model group created successfully');
  }
}

export class UpdateDataModelGroupResponse extends BaseResponse<SimpleDataModelGroup> {
  constructor(group: SimpleDataModelGroup | any) {
    super(group as SimpleDataModelGroup, true, 'Data model group updated successfully');
  }
}

export class DeleteDataModelGroupResponse extends BaseResponse<boolean> {
  constructor() {
    super(true, true, 'Data model group deleted successfully');
  }
}

// 新 DataModel 响应类型（项目级别）
interface SimpleNewDataModel {
  id: string;
  projectId: string;
  groupId?: string;
  name: string;
  description?: string;
  schema?: any[];
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: string;
}

export class NewDataModelListResponse extends BaseResponse<SimpleNewDataModel[]> {
  constructor(dataModels: SimpleNewDataModel[] | any[]) {
    super(dataModels as SimpleNewDataModel[], true, 'Data models retrieved successfully');
  }
}

export class NewDataModelDetailResponse extends BaseResponse<SimpleNewDataModel> {
  constructor(dataModel: SimpleNewDataModel | any) {
    super(dataModel as SimpleNewDataModel, true, 'Data model retrieved successfully');
  }
}

export class CreateNewDataModelResponse extends BaseResponse<SimpleNewDataModel> {
  constructor(dataModel: SimpleNewDataModel | any) {
    super(dataModel as SimpleNewDataModel, true, 'Data model created successfully');
  }
}

export class UpdateNewDataModelResponse extends BaseResponse<SimpleNewDataModel> {
  constructor(dataModel: SimpleNewDataModel | any) {
    super(dataModel as SimpleNewDataModel, true, 'Data model updated successfully');
  }
}

export class DeleteNewDataModelResponse extends BaseResponse<boolean> {
  constructor() {
    super(true, true, 'Data model deleted successfully');
  }
}

// RestApiGroup 响应类型
interface SimpleRestApiGroup {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  syncUrl?: string;
  lastSyncAt?: string | Date;
  syncStatus?: 'idle' | 'syncing' | 'success' | 'failed';
  syncError?: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: string;
}

export class RestApiGroupListResponse extends BaseResponse<SimpleRestApiGroup[]> {
  constructor(groups: SimpleRestApiGroup[] | any[]) {
    super(groups as SimpleRestApiGroup[], true, 'REST API groups retrieved successfully');
  }
}

export class RestApiGroupDetailResponse extends BaseResponse<SimpleRestApiGroup> {
  constructor(group: SimpleRestApiGroup | any) {
    super(group as SimpleRestApiGroup, true, 'REST API group retrieved successfully');
  }
}

export class CreateRestApiGroupResponse extends BaseResponse<SimpleRestApiGroup> {
  constructor(group: SimpleRestApiGroup | any) {
    super(group as SimpleRestApiGroup, true, 'REST API group created successfully');
  }
}

export class UpdateRestApiGroupResponse extends BaseResponse<SimpleRestApiGroup> {
  constructor(group: SimpleRestApiGroup | any) {
    super(group as SimpleRestApiGroup, true, 'REST API group updated successfully');
  }
}

export class DeleteRestApiGroupResponse extends BaseResponse<boolean> {
  constructor() {
    super(true, true, 'REST API group deleted successfully');
  }
}

export class SyncRestApiGroupResponse extends BaseResponse<{ syncedCount: number; apis: any[] }> {
  constructor(syncedCount: number, apis: any[]) {
    super({ syncedCount, apis }, true, `Synced ${syncedCount} REST APIs successfully`);
  }
}

// RestApi 响应类型
interface SimpleRestApi {
  id: string;
  projectId: string;
  groupId?: string;
  name: string;
  description?: string;
  url?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  requestModelIds: string[];
  responseModelIds: string[];
  createdAt: string | Date;
  updatedAt: string | Date;
  userId: string;
}

export class RestApiListResponse extends BaseResponse<SimpleRestApi[]> {
  constructor(restApis: SimpleRestApi[] | any[]) {
    super(restApis as SimpleRestApi[], true, 'REST APIs retrieved successfully');
  }
}

export class RestApiDetailResponse extends BaseResponse<SimpleRestApi> {
  constructor(restApi: SimpleRestApi | any) {
    super(restApi as SimpleRestApi, true, 'REST API retrieved successfully');
  }
}

export class CreateRestApiResponse extends BaseResponse<SimpleRestApi> {
  constructor(restApi: SimpleRestApi | any) {
    super(restApi as SimpleRestApi, true, 'REST API created successfully');
  }
}

export class UpdateRestApiResponse extends BaseResponse<SimpleRestApi> {
  constructor(restApi: SimpleRestApi | any) {
    super(restApi as SimpleRestApi, true, 'REST API updated successfully');
  }
}

export class DeleteRestApiResponse extends BaseResponse<boolean> {
  constructor() {
    super(true, true, 'REST API deleted successfully');
  }
}

// AI 解析 Schema 响应
export class ParseSchemaResponse extends BaseResponse<any[]> {
  constructor(schema: any[]) {
    super(schema, true, 'Schema parsed successfully');
  }
}
