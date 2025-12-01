import { SchemaFieldType } from '@fta/shared-types';
import { ApiProperty } from '@midwayjs/swagger';

// Project Request DTOs
export class ProjectListRequest {
  @ApiProperty({ description: '页码', example: 1, default: 1 })
  page?: number;

  @ApiProperty({ description: '每页数量', example: 10, default: 10 })
  size?: number;
}

export class CreateProjectRequest {
  @ApiProperty({ description: '项目名称', example: '新项目', required: true })
  name: string;

  @ApiProperty({ description: '项目描述', example: '这是一个示例项目' })
  description?: string;

  @ApiProperty({
    description: 'Git仓库地址',
    example: 'https://github.com/example/project',
  })
  gitRepository?: string;

  @ApiProperty({ description: '项目经理', example: '张三', required: true })
  manager: string;

  @ApiProperty({
    description: '项目状态',
    example: 'active',
    enum: ['active', 'paused', 'completed', 'archived'],
  })
  status?: string;

  @ApiProperty({
    description: '项目进度',
    example: 0,
    minimum: 0,
    maximum: 100,
  })
  progress?: number;

  @ApiProperty({ description: '团队成员数量', example: 1, minimum: 1 })
  members?: number;

  @ApiProperty({
    description: '项目标签',
    example: ['React', 'TypeScript'],
    type: [String],
  })
  tags?: string[];

  @ApiProperty({ description: '项目头像', example: '📁' })
  avatar?: string;

  @ApiProperty({
    description: '工作目录映射',
    example: ['/Users/foo/bar'],
    type: [String],
    required: false,
  })
  workdirs?: string[];
}

export class UpdateProjectRequest {
  @ApiProperty({ description: '项目名称', example: '更新的项目名' })
  name?: string;

  @ApiProperty({ description: '项目描述', example: '更新的项目描述' })
  description?: string;

  @ApiProperty({
    description: 'Git仓库地址',
    example: 'https://github.com/example/project',
  })
  gitRepository?: string;

  @ApiProperty({ description: '项目经理', example: '张三' })
  manager?: string;

  @ApiProperty({
    description: '项目状态',
    example: 'active',
    enum: ['active', 'paused', 'completed', 'archived'],
  })
  status?: string;

  @ApiProperty({
    description: '项目进度',
    example: 50,
    minimum: 0,
    maximum: 100,
  })
  progress?: number;

  @ApiProperty({ description: '团队成员数量', example: 5, minimum: 1 })
  members?: number;

  @ApiProperty({
    description: '项目标签',
    example: ['React', 'TypeScript'],
    type: [String],
  })
  tags?: string[];

  @ApiProperty({ description: '项目头像', example: '🚀' })
  avatar?: string;

  @ApiProperty({
    description: '工作目录映射',
    example: ['/Users/foo/bar'],
    type: [String],
    required: false,
  })
  workdirs?: string[];
}

export class GetProjectDetailRequest {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
    required: true,
  })
  id: string;
}

export class DeleteProjectRequest {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
    required: true,
  })
  id: string;
}

// Page Request DTOs
export class CreatePageRequest {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
    required: true,
  })
  projectId: string;

  @ApiProperty({ description: '页面名称', example: '登录页', required: true })
  name: string;

  @ApiProperty({ description: '路由路径', example: '/login', required: true })
  routePath: string;

  @ApiProperty({ description: '页面描述', example: '用户登录页面' })
  description?: string;

  @ApiProperty({
    description: '设计文档URLs',
    example: ['https://MasterGo.com/login'],
    type: [String],
  })
  designUrls?: string[];

  @ApiProperty({
    description: 'PRD文档URLs',
    example: ['https://docs.company.com/prd/login'],
    type: [String],
  })
  prdUrls?: string[];

  @ApiProperty({
    description: 'OpenAPI文档URLs',
    example: ['https://api.company.com/openapi/login.json'],
    type: [String],
  })
  openapiUrls?: string[];
}

export class UpdatePageRequest {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
    required: true,
  })
  projectId: string;

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string;

  @ApiProperty({ description: '页面名称', example: '更新的登录页' })
  name?: string;

  @ApiProperty({ description: '路由路径', example: '/signin' })
  routePath?: string;

  @ApiProperty({ description: '页面描述', example: '更新的登录页面描述' })
  description?: string;

  @ApiProperty({
    description: '设计文档URLs',
    example: ['https://MasterGo.com/login'],
    type: [String],
  })
  designUrls?: string[];

  @ApiProperty({
    description: 'PRD文档URLs',
    example: ['https://docs.company.com/prd/login'],
    type: [String],
  })
  prdUrls?: string[];

  @ApiProperty({
    description: 'OpenAPI文档URLs',
    example: ['https://api.company.com/openapi/login.json'],
    type: [String],
  })
  openapiUrls?: string[];
}

export class DeletePageRequest {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
    required: false,
  })
  projectId?: string;

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string;
}

export class GetPageDetailRequest {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
    required: false,
  })
  projectId?: string;

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string;
}

// Document Request DTOs
export class UpdateDocumentStatusRequest {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
    required: true,
  })
  projectId: string;

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string;

  @ApiProperty({
    description: '文档类型',
    example: 'design',
    enum: ['design', 'prd', 'openapi'],
    required: true,
  })
  type: 'design' | 'prd' | 'openapi';

  @ApiProperty({ description: '文档ID', example: 'doc_123', required: true })
  documentId: string;

  @ApiProperty({
    description: '文档状态',
    example: 'synced',
    enum: ['pending', 'syncing', 'synced', 'failed', 'completed'],
    required: true,
  })
  status: string;
}

export class SyncDocumentRequest {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
    required: true,
  })
  projectId: string;

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string;

  @ApiProperty({
    description: '文档类型',
    example: 'design',
    enum: ['design', 'prd', 'openapi'],
    required: true,
  })
  type: 'design' | 'prd' | 'openapi';

  @ApiProperty({ description: '文档ID', example: 'doc_123', required: true })
  documentId: string;
}

export class GetDocumentContentRequest {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
  })
  projectId?: string;

  @ApiProperty({ description: '页面ID', example: 'page_123' })
  pageId?: string;

  @ApiProperty({
    description: '文档类型',
    example: 'design',
    enum: ['design', 'prd', 'openapi'],
  })
  type?: 'design' | 'prd' | 'openapi';

  @ApiProperty({ description: '文档ID', example: 'doc_123', required: true })
  documentId: string;
}

export class UpdateDocumentRequest {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
    required: true,
  })
  projectId: string;

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string;

  @ApiProperty({
    description: '文档类型',
    example: 'design',
    enum: ['design', 'prd', 'openapi'],
    required: true,
  })
  type: 'design' | 'prd' | 'openapi';

  @ApiProperty({ description: '文档ID', example: 'doc_123', required: true })
  documentId: string;

  @ApiProperty({ description: '文档内容', required: true })
  content: any;

  @ApiProperty({ description: '文档名称', example: '更新的文档名' })
  name?: string;

  @ApiProperty({
    description: '文档URL',
    example: 'https://example.com/updated-doc',
  })
  url?: string;
}

export class ResolveProjectContextRequest {
  @ApiProperty({
    description: 'Git 仓库 URL',
    example: 'https://code.amh-group.com/foo/bar',
    required: false,
  })
  gitUrl?: string;

  @ApiProperty({
    description: '工作目录',
    example: '/Users/foo/bar',
    required: false,
  })
  workdir?: string;
}

export class BindProjectContextRequest {
  @ApiProperty({
    description: '项目ID',
    example: 'project_123',
    required: true,
  })
  projectId: string;

  @ApiProperty({
    description: 'Git 仓库 URL',
    example: 'https://code.amh-group.com/foo/bar',
    required: false,
  })
  gitUrl?: string;

  @ApiProperty({
    description: '工作目录',
    example: '/Users/foo/bar',
    required: false,
  })
  workdir?: string;
}

// GitLab Request DTOs
export class GetGitlabProjectIdRequest {
  @ApiProperty({
    description: 'GitLab 仓库 URL',
    example: 'https://gitlab.com/foo/bar',
    required: true,
  })
  gitUrl: string;
}

// Interface Data Model Request DTOs
export class SchemaFieldDto {
  @ApiProperty({ description: '字段名', example: 'username', required: true })
  name: string;

  @ApiProperty({
    description: '字段类型',
    example: 'string',
    enum: ['string', 'number', 'boolean', 'object', 'array'],
    required: true,
  })
  type: SchemaFieldType;

  @ApiProperty({ description: '字段描述', example: '用户名' })
  description?: string;

  @ApiProperty({ description: '是否必填', example: true })
  required?: boolean;

  @ApiProperty({ description: '示例值', example: 'zhangsan' })
  example?: any;

  @ApiProperty({ description: '枚举值', example: ['admin', 'user'], type: [String] })
  enum?: string[];

  @ApiProperty({ description: '子字段（object 类型时）', type: [SchemaFieldDto] })
  properties?: SchemaFieldDto[];

  @ApiProperty({ description: '数组元素类型（array 类型时）' })
  items?: SchemaFieldDto;
}

export class CreateDataModelRequest {
  @ApiProperty({ description: '页面 ID', example: 'page_123', required: true })
  pageId: string;

  @ApiProperty({ description: '数据模型名称', example: '用户信息', required: true })
  name: string;

  @ApiProperty({ description: '数据模型描述', example: '用户相关的数据结构' })
  description?: string;

  @ApiProperty({ description: 'API 地址（可选）', example: '/api/v1/users' })
  url?: string;

  @ApiProperty({
    description: 'HTTP 方法',
    example: 'GET',
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  })
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

  @ApiProperty({ description: '请求参数 Schema', type: [SchemaFieldDto] })
  requestSchema?: SchemaFieldDto[];

  @ApiProperty({ description: '响应参数 Schema', type: [SchemaFieldDto] })
  responseSchema?: SchemaFieldDto[];
}

export class UpdateDataModelRequest {
  @ApiProperty({ description: '数据模型名称', example: '用户信息' })
  name?: string;

  @ApiProperty({ description: '数据模型描述', example: '用户相关的数据结构' })
  description?: string;

  @ApiProperty({ description: 'API 地址（可选）', example: '/api/v1/users' })
  url?: string;

  @ApiProperty({
    description: 'HTTP 方法',
    example: 'GET',
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  })
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

  @ApiProperty({ description: '请求参数 Schema', type: [SchemaFieldDto] })
  requestSchema?: SchemaFieldDto[];

  @ApiProperty({ description: '响应参数 Schema', type: [SchemaFieldDto] })
  responseSchema?: SchemaFieldDto[];
}

export class GetDataModelsRequest {
  @ApiProperty({ description: '页面 ID', example: 'page_123', required: true })
  pageId: string;
}

export class GetDataModelByIdRequest {
  @ApiProperty({ description: '数据模型 ID', example: 'dm_123', required: true })
  id: string;
}

export class DeleteDataModelRequest {
  @ApiProperty({ description: '数据模型 ID', example: 'dm_123', required: true })
  id: string;
}

// ============ 新数据模型相关 DTO ============

// DataModelGroup Request DTOs
export class CreateDataModelGroupRequest {
  @ApiProperty({ description: '项目 ID', example: 'project_123', required: true })
  projectId: string;

  @ApiProperty({ description: '分组名称', example: '用户相关', required: true })
  name: string;

  @ApiProperty({ description: '分组描述', example: '用户相关的数据模型' })
  description?: string;
}

export class UpdateDataModelGroupRequest {
  @ApiProperty({ description: '分组名称', example: '用户相关' })
  name?: string;

  @ApiProperty({ description: '分组描述', example: '用户相关的数据模型' })
  description?: string;
}

// New DataModel Request DTOs (项目级别)
export class CreateNewDataModelRequest {
  @ApiProperty({ description: '项目 ID', example: 'project_123', required: true })
  projectId: string;

  @ApiProperty({ description: '分组 ID（可选）', example: 'dmg_123' })
  groupId?: string;

  @ApiProperty({ description: '数据模型名称', example: '用户信息', required: true })
  name: string;

  @ApiProperty({ description: '数据模型描述', example: '用户相关的数据结构' })
  description?: string;

  @ApiProperty({ description: '数据结构 Schema', type: [SchemaFieldDto] })
  schema?: SchemaFieldDto[];
}

export class UpdateNewDataModelRequest {
  @ApiProperty({ description: '分组 ID（设为 null 可移出分组）', example: 'dmg_123' })
  groupId?: string | null;

  @ApiProperty({ description: '数据模型名称', example: '用户信息' })
  name?: string;

  @ApiProperty({ description: '数据模型描述', example: '用户相关的数据结构' })
  description?: string;

  @ApiProperty({ description: '数据结构 Schema', type: [SchemaFieldDto] })
  schema?: SchemaFieldDto[];
}

// RestApiGroup Request DTOs
export class CreateRestApiGroupRequest {
  @ApiProperty({ description: '项目 ID', example: 'project_123', required: true })
  projectId: string;

  @ApiProperty({ description: '组名称', example: '用户模块接口', required: true })
  name: string;

  @ApiProperty({ description: '组描述', example: '用户相关的所有接口' })
  description?: string;

  @ApiProperty({ description: '远程同步 URL（OpenAPI/Swagger 文档地址）', example: 'https://api.example.com/swagger.json' })
  syncUrl?: string;
}

export class UpdateRestApiGroupRequest {
  @ApiProperty({ description: '组名称', example: '用户模块接口' })
  name?: string;

  @ApiProperty({ description: '组描述', example: '用户相关的所有接口' })
  description?: string;

  @ApiProperty({ description: '远程同步 URL（OpenAPI/Swagger 文档地址）', example: 'https://api.example.com/swagger.json' })
  syncUrl?: string;
}

export class SyncRestApiGroupRequest {
  @ApiProperty({ description: '同步 URL（可选，不传则使用组已配置的 URL）', example: 'https://api.example.com/swagger.json' })
  syncUrl?: string;
}

// RestApi Request DTOs
export class CreateRestApiRequest {
  @ApiProperty({ description: '项目 ID', example: 'project_123', required: true })
  projectId: string;

  @ApiProperty({ description: '接口组 ID', example: 'rag_123' })
  groupId?: string;

  @ApiProperty({ description: '接口名称', example: '获取用户信息', required: true })
  name: string;

  @ApiProperty({ description: '接口描述', example: '获取当前登录用户的详细信息' })
  description?: string;

  @ApiProperty({ description: 'API 地址', example: '/api/v1/users/me' })
  url?: string;

  @ApiProperty({
    description: 'HTTP 方法',
    example: 'GET',
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  })
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

  @ApiProperty({ description: '请求参数关联的数据模型 ID 列表', type: [String] })
  requestModelIds?: string[];

  @ApiProperty({ description: '响应数据关联的数据模型 ID 列表', type: [String] })
  responseModelIds?: string[];
}

export class UpdateRestApiRequest {
  @ApiProperty({ description: '接口组 ID', example: 'rag_123' })
  groupId?: string;

  @ApiProperty({ description: '接口名称', example: '获取用户信息' })
  name?: string;

  @ApiProperty({ description: '接口描述', example: '获取当前登录用户的详细信息' })
  description?: string;

  @ApiProperty({ description: 'API 地址', example: '/api/v1/users/me' })
  url?: string;

  @ApiProperty({
    description: 'HTTP 方法',
    example: 'GET',
    enum: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'],
  })
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

  @ApiProperty({ description: '请求参数关联的数据模型 ID 列表', type: [String] })
  requestModelIds?: string[];

  @ApiProperty({ description: '响应数据关联的数据模型 ID 列表', type: [String] })
  responseModelIds?: string[];
}

