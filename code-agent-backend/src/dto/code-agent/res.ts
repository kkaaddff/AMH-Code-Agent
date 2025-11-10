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
  createdAt: string;
  updatedAt: string;
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
