import { ApiProperty } from '@midwayjs/swagger';
import { Rule, RuleType } from '@midwayjs/validate';

export class FrontendWorkflowRequestDTO {
  @ApiProperty({
    required: true,
    example: '507f1f77bcf86cd799439011',
    description: '设计文档 ID',
  })
  @Rule(RuleType.string().required())
  designDocId: string;

  @ApiProperty({
    required: false,
    example: 1,
    description: 'annotation 版本号（可选，默认取最新版本）',
  })
  @Rule(RuleType.number().optional())
  version?: number;

  @ApiProperty({
    required: false,
    example: 'FTA-Frontend',
    description: '产品名称',
  })
  @Rule(RuleType.string().optional())
  productName?: string;
}
