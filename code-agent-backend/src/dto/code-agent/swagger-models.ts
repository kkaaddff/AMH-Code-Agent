import { ApiProperty } from "@midwayjs/swagger";

// Swagger-specific models to avoid circular references in entities

export class DocumentReferenceSwagger {
  @ApiProperty({ description: "文档ID" })
  id: string;

  @ApiProperty({ description: "文档URL" })
  url: string;

  @ApiProperty({ description: "文档名称" })
  name: string;

  @ApiProperty({
    description: "同步状态",
    enum: ["pending", "syncing", "synced", "failed", "completed"],
  })
  status: string;

  @ApiProperty({ description: "同步进度" })
  progress: number;

  @ApiProperty({ description: "最后同步时间" })
  lastSyncAt?: string;

  @ApiProperty({ description: "创建时间" })
  createdAt: string;

  @ApiProperty({ description: "更新时间" })
  updatedAt: string;
}

// @ApiProperty()
export class PageSwagger {
  @ApiProperty({ description: "页面ID" })
  id: string;

  @ApiProperty({ description: "项目ID" })
  projectId: string;

  @ApiProperty({ description: "页面名称" })
  name: string;

  @ApiProperty({ description: "路由路径" })
  routePath: string;

  @ApiProperty({ description: "页面描述" })
  description: string;

  @ApiProperty({
    description: "设计文档",
    type: () => [DocumentReferenceSwagger],
  })
  designDocuments: DocumentReferenceSwagger[];

  @ApiProperty({
    description: "PRD文档",
    type: () => [DocumentReferenceSwagger],
  })
  prdDocuments: DocumentReferenceSwagger[];

  @ApiProperty({
    description: "OpenAPI文档",
    type: () => [DocumentReferenceSwagger],
  })
  openapiDocuments: DocumentReferenceSwagger[];

  @ApiProperty({ description: "设计规格", type: [String] })
  designSpecs: string[];

  @ApiProperty({ description: "PRD列表", type: [String] })
  prds: string[];

  @ApiProperty({ description: "组件列表", type: [String] })
  components: string[];

  @ApiProperty({ description: "创建时间" })
  createdAt: string;

  @ApiProperty({ description: "更新时间" })
  updatedAt: string;
}

// @ApiProperty()
export class ProjectSwagger {
  @ApiProperty({ description: "项目ID" })
  id: string;

  @ApiProperty({ description: "项目名称" })
  name: string;

  @ApiProperty({ description: "项目描述" })
  description: string;

  @ApiProperty({ description: "Git仓库地址" })
  gitRepository: string;

  @ApiProperty({ description: "项目经理" })
  manager: string;

  @ApiProperty({
    description: "项目状态",
    enum: ["active", "paused", "completed", "archived"],
  })
  status: string;

  @ApiProperty({ description: "项目进度" })
  progress: number;

  @ApiProperty({ description: "团队成员数量" })
  members: number;

  @ApiProperty({ description: "项目标签", type: [String] })
  tags: string[];

  @ApiProperty({ description: "项目头像" })
  avatar: string;

  @ApiProperty({ description: "页面列表", type: () => [PageSwagger] })
  pages: PageSwagger[];

  @ApiProperty({ description: "创建时间" })
  createdAt: string;

  @ApiProperty({ description: "更新时间" })
  updatedAt: string;
}
