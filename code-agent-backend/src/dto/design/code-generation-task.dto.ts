import { ApiProperty } from '@midwayjs/swagger'
import { AsyncResponse, PageHelper } from '../../types'
import { DesignCodeGenerationTaskEntity } from '../../entity/design'

export class CreateCodeGenerationTaskBody {
  @ApiProperty({ required: false, example: 'req-doc-001', description: '关联的需求文档 ID' })
  requirementDocId?: string

  @ApiProperty({ required: true, example: 'react', description: '任务类型/目标框架' })
  taskType: string

  @ApiProperty({
    required: false,
    description: '任务配置（框架、UI、语法糖等）',
    type: 'object',
    example: { framework: 'nextjs', uiLibrary: 'antd', typescript: true },
  })
  options?: Record<string, unknown>
}

export class CodeGenerationTaskPaginationQuery extends PageHelper {
  @ApiProperty({ required: false, example: 'processing', description: '任务状态过滤' })
  status?: string
}

export class CodeGenerationTaskListResponse extends AsyncResponse {
  @ApiProperty({ type: [DesignCodeGenerationTaskEntity], description: '任务列表' })
  data: DesignCodeGenerationTaskEntity[]

  @ApiProperty({ example: 30, description: '总条数' })
  total: number

  constructor(data: DesignCodeGenerationTaskEntity[], total: number) {
    super()
    this.data = data
    this.total = total
  }
}

export class CodeGenerationTaskDetailResponse extends AsyncResponse {
  @ApiProperty({ type: DesignCodeGenerationTaskEntity, description: '任务详情' })
  data: DesignCodeGenerationTaskEntity

  constructor(data: DesignCodeGenerationTaskEntity) {
    super()
    this.data = data
  }
}

export class CodeGenerationTaskProgressResponse extends AsyncResponse {
  @ApiProperty({ example: 80, description: '任务进度 0-100' })
  progress: number

  @ApiProperty({ example: 'processing', description: '任务状态' })
  status: string

  @ApiProperty({ description: '任务日志片段', type: [String] })
  logs: string[]

  constructor(progress: number, status: string, logs: string[]) {
    super()
    this.progress = progress
    this.status = status
    this.logs = logs
  }
}

export class CodeGenerationTaskDownloadResponse extends AsyncResponse {
  @ApiProperty({ example: 'https://oss/download/task-001.zip', description: '下载链接' })
  downloadUrl: string

  constructor(downloadUrl: string) {
    super()
    this.downloadUrl = downloadUrl
  }
}
