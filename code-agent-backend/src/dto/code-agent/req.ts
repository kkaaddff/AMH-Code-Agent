import { ApiProperty } from '@midwayjs/swagger'

// Project Request DTOs
export class ProjectListRequest {
  @ApiProperty({ description: '页码', example: 1, default: 1 })
  page?: number

  @ApiProperty({ description: '每页数量', example: 10, default: 10 })
  size?: number
}

export class CreateProjectRequest {
  @ApiProperty({ description: '项目名称', example: '新项目', required: true })
  name: string

  @ApiProperty({ description: '项目描述', example: '这是一个示例项目' })
  description?: string

  @ApiProperty({ description: 'Git仓库地址', example: 'https://github.com/example/project' })
  gitRepository?: string

  @ApiProperty({ description: '项目经理', example: '张三', required: true })
  manager: string

  @ApiProperty({ description: '项目状态', example: 'active', enum: ['active', 'paused', 'completed', 'archived'] })
  status?: string

  @ApiProperty({ description: '项目进度', example: 0, minimum: 0, maximum: 100 })
  progress?: number

  @ApiProperty({ description: '团队成员数量', example: 1, minimum: 1 })
  members?: number

  @ApiProperty({ description: '项目标签', example: ['React', 'TypeScript'], type: [String] })
  tags?: string[]

  @ApiProperty({ description: '项目头像', example: '📁' })
  avatar?: string
}

export class UpdateProjectRequest {
  @ApiProperty({ description: '项目名称', example: '更新的项目名' })
  name?: string

  @ApiProperty({ description: '项目描述', example: '更新的项目描述' })
  description?: string

  @ApiProperty({ description: 'Git仓库地址', example: 'https://github.com/example/project' })
  gitRepository?: string

  @ApiProperty({ description: '项目经理', example: '张三' })
  manager?: string

  @ApiProperty({ description: '项目状态', example: 'active', enum: ['active', 'paused', 'completed', 'archived'] })
  status?: string

  @ApiProperty({ description: '项目进度', example: 50, minimum: 0, maximum: 100 })
  progress?: number

  @ApiProperty({ description: '团队成员数量', example: 5, minimum: 1 })
  members?: number

  @ApiProperty({ description: '项目标签', example: ['React', 'TypeScript'], type: [String] })
  tags?: string[]

  @ApiProperty({ description: '项目头像', example: '🚀' })
  avatar?: string
}

export class GetProjectDetailRequest {
  @ApiProperty({ description: '项目ID', example: 'project_123', required: true })
  id: string
}

export class DeleteProjectRequest {
  @ApiProperty({ description: '项目ID', example: 'project_123', required: true })
  id: string
}

// Page Request DTOs
export class CreatePageRequest {
  @ApiProperty({ description: '项目ID', example: 'project_123', required: true })
  projectId: string

  @ApiProperty({ description: '页面名称', example: '登录页', required: true })
  name: string

  @ApiProperty({ description: '路由路径', example: '/login', required: true })
  routePath: string

  @ApiProperty({ description: '页面描述', example: '用户登录页面' })
  description?: string

  @ApiProperty({ description: '设计文档URLs', example: ['https://figma.com/login'], type: [String] })
  designUrls?: string[]

  @ApiProperty({ description: 'PRD文档URLs', example: ['https://docs.company.com/prd/login'], type: [String] })
  prdUrls?: string[]

  @ApiProperty({
    description: 'OpenAPI文档URLs',
    example: ['https://api.company.com/openapi/login.json'],
    type: [String],
  })
  openapiUrls?: string[]
}

export class UpdatePageRequest {
  @ApiProperty({ description: '项目ID', example: 'project_123', required: true })
  projectId: string

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string

  @ApiProperty({ description: '页面名称', example: '更新的登录页' })
  name?: string

  @ApiProperty({ description: '路由路径', example: '/signin' })
  routePath?: string

  @ApiProperty({ description: '页面描述', example: '更新的登录页面描述' })
  description?: string

  @ApiProperty({ description: '设计文档URLs', example: ['https://figma.com/login'], type: [String] })
  designUrls?: string[]

  @ApiProperty({ description: 'PRD文档URLs', example: ['https://docs.company.com/prd/login'], type: [String] })
  prdUrls?: string[]

  @ApiProperty({
    description: 'OpenAPI文档URLs',
    example: ['https://api.company.com/openapi/login.json'],
    type: [String],
  })
  openapiUrls?: string[]
}

export class DeletePageRequest {
  @ApiProperty({ description: '项目ID', example: 'project_123', required: true })
  projectId: string

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string
}

// Document Request DTOs
export class UpdateDocumentStatusRequest {
  @ApiProperty({ description: '项目ID', example: 'project_123', required: true })
  projectId: string

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string

  @ApiProperty({ description: '文档类型', example: 'design', enum: ['design', 'prd', 'openapi'], required: true })
  type: 'design' | 'prd' | 'openapi'

  @ApiProperty({ description: '文档ID', example: 'doc_123', required: true })
  documentId: string

  @ApiProperty({
    description: '文档状态',
    example: 'synced',
    enum: ['pending', 'syncing', 'synced', 'failed', 'completed'],
    required: true,
  })
  status: string
}

export class SyncDocumentRequest {
  @ApiProperty({ description: '项目ID', example: 'project_123', required: true })
  projectId: string

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string

  @ApiProperty({ description: '文档类型', example: 'design', enum: ['design', 'prd', 'openapi'], required: true })
  type: 'design' | 'prd' | 'openapi'

  @ApiProperty({ description: '文档ID', example: 'doc_123', required: true })
  documentId: string
}

export class GetDocumentContentRequest {
  @ApiProperty({ description: '项目ID', example: 'project_123', required: true })
  projectId: string

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string

  @ApiProperty({ description: '文档类型', example: 'design', enum: ['design', 'prd', 'openapi'], required: true })
  type: 'design' | 'prd' | 'openapi'

  @ApiProperty({ description: '文档ID', example: 'doc_123', required: true })
  documentId: string
}

export class UpdateDocumentRequest {
  @ApiProperty({ description: '项目ID', example: 'project_123', required: true })
  projectId: string

  @ApiProperty({ description: '页面ID', example: 'page_123', required: true })
  pageId: string

  @ApiProperty({ description: '文档类型', example: 'design', enum: ['design', 'prd', 'openapi'], required: true })
  type: 'design' | 'prd' | 'openapi'

  @ApiProperty({ description: '文档ID', example: 'doc_123', required: true })
  documentId: string

  @ApiProperty({ description: '文档内容', required: true })
  content: any

  @ApiProperty({ description: '文档名称', example: '更新的文档名' })
  name?: string

  @ApiProperty({ description: '文档URL', example: 'https://example.com/updated-doc' })
  url?: string
}
