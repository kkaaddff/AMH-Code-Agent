import { ApiProperty } from '@midwayjs/swagger'
import { AsyncResponse, PageHelper } from '../../types'
import { DesignDocumentEntity } from '../../entity/design'

export class CreateDesignDocumentBody {
  @ApiProperty({ example: '用户登录页', description: '设计稿名称' })
  name: string

  @ApiProperty({ required: false, example: '登录流程设计稿', description: '描述信息' })
  description?: string

  @ApiProperty({ required: true, example: 'https://mastergo.com/goto/LhGgBAK', description: 'MasterGo 设计稿链接' })
  mastergoUrl: string

  @ApiProperty({ required: false, example: 'oss://bucket/designs/login.json', description: '设计稿文件 OSS Key' })
  ossObjectKey?: string

  @ApiProperty({ required: false, example: 1024, description: '文件大小（字节）' })
  fileSize?: number

  @ApiProperty({ required: false, example: 'application/json', description: '文件类型' })
  fileType?: string

  @ApiProperty({ required: false, example: ['登录', '业务'], description: '标签' })
  tags?: string[]

  @ApiProperty({ required: false, description: '额外元信息' })
  metadata?: Record<string, unknown>
}

export class UpdateDesignDocumentBody {
  @ApiProperty({ required: false, example: '用户登录页 v2', description: '设计稿名称' })
  name?: string

  @ApiProperty({ required: false, example: '更新描述', description: '描述信息' })
  description?: string

  @ApiProperty({ required: false, description: '设计稿 DSL 数据', type: 'object' })
  dslData?: Record<string, unknown>

  @ApiProperty({ required: false, example: 2, description: 'DSL 修订号' })
  dslRevision?: number

  @ApiProperty({ required: false, example: 'active', enum: ['active', 'archived', 'deleted'], description: '状态' })
  status?: string

  @ApiProperty({ required: false, example: ['登录', '业务'], description: '标签' })
  tags?: string[]

  @ApiProperty({ required: false, description: '额外元信息' })
  metadata?: Record<string, unknown>
}

export class DesignDocumentPaginationQuery extends PageHelper {
  @ApiProperty({ required: false, example: 'active', description: '状态过滤' })
  status?: string

  @ApiProperty({ required: false, example: 'Y0001234', description: '创建人过滤' })
  createdBy?: string

  @ApiProperty({ required: false, example: '登录', description: '关键字搜索（名称/描述）' })
  keyword?: string
}

export class DesignDocumentListResponse extends AsyncResponse {
  @ApiProperty({ type: [DesignDocumentEntity], description: '设计稿列表数据' })
  data: DesignDocumentEntity[]

  @ApiProperty({ example: 100, description: '记录总数' })
  total: number

  constructor(data: DesignDocumentEntity[], total: number) {
    super()
    this.data = data
    this.total = total
  }
}

export class DesignDocumentDetailResponse extends AsyncResponse {
  @ApiProperty({ type: DesignDocumentEntity, description: '设计稿详情' })
  data: DesignDocumentEntity

  constructor(data: DesignDocumentEntity) {
    super()
    this.data = data
  }
}

export class DesignDocumentDslResponse extends AsyncResponse {
  @ApiProperty({ description: '设计稿 DSL 数据', type: 'object', required: false })
  data: Record<string, unknown> | null

  @ApiProperty({ example: 1, description: 'DSL 版本号' })
  revision: number | null

  constructor(data: Record<string, unknown> | null, revision: number | null) {
    super()
    this.data = data
    this.revision = revision
  }
}
