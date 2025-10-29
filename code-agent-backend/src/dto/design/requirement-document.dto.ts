import { ApiProperty } from '@midwayjs/swagger'
import { AsyncResponse, PageHelper } from '../../types'
import { DesignRequirementDocumentEntity } from '../../entity/design'

export class GenerateRequirementDocumentBody {
  @ApiProperty({ required: false, example: '默认模板', description: '模板标识或版本号' })
  templateKey?: string

  @ApiProperty({ required: false, example: true, description: '是否强制从 DSL 解析最新数据' })
  forceRefresh?: boolean

  @ApiProperty({ required: false, description: '组件标注根节点数据', type: 'object' })
  rootAnnotation?: Record<string, any>

  @ApiProperty({ required: false, example: 3, description: '标注版本号，用于提示词上下文' })
  annotationVersion?: number

  @ApiProperty({ required: false, example: '1.0', description: '标注 schema 版本号' })
  annotationSchemaVersion?: string
}

export class UpdateRequirementDocumentBody {
  @ApiProperty({ required: false, example: '登录页需求规格 v2', description: '标题' })
  title?: string

  @ApiProperty({ required: false, description: 'Markdown 内容', type: 'string' })
  content?: string

  @ApiProperty({
    required: false,
    example: 'published',
    enum: ['draft', 'published', 'archived'],
    description: '状态流转',
  })
  status?: 'draft' | 'published' | 'archived'
}

export class RequirementDocumentPaginationQuery extends PageHelper {
  @ApiProperty({ required: false, example: 'draft', description: '状态过滤' })
  status?: string
}

export class RequirementDocumentListResponse extends AsyncResponse {
  @ApiProperty({ type: [DesignRequirementDocumentEntity], description: '需求文档列表' })
  data: DesignRequirementDocumentEntity[]

  @ApiProperty({ example: 20, description: '总条数' })
  total: number

  constructor(data: DesignRequirementDocumentEntity[], total: number) {
    super()
    this.data = data
    this.total = total
  }
}

export class RequirementDocumentDetailResponse extends AsyncResponse {
  @ApiProperty({ type: DesignRequirementDocumentEntity, description: '需求文档详情' })
  data: DesignRequirementDocumentEntity

  constructor(data: DesignRequirementDocumentEntity) {
    super()
    this.data = data
  }
}

export class RequirementDocumentExportResponse extends AsyncResponse {
  @ApiProperty({ example: 'https://oss/download/path', description: '导出文件下载地址' })
  downloadUrl: string

  constructor(downloadUrl: string) {
    super()
    this.downloadUrl = downloadUrl
  }
}
