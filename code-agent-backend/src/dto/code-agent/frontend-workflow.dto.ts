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

  @ApiProperty({
    required: false,
    example: 'claude-3-5-sonnet-20241022',
    description: '模型配置（可选，默认使用环境变量配置）',
  })
  @Rule(RuleType.string().optional())
  model?: string;

  @ApiProperty({
    required: false,
    example: 'claude-3-5-sonnet-20241022',
    description: '规划模型配置（可选）',
  })
  @Rule(RuleType.string().optional())
  planModel?: string;

  @ApiProperty({
    required: false,
    example: '/path/to/custom/rules.md',
    description: '自定义规则文件路径（可选）',
  })
  @Rule(RuleType.string().optional())
  rulesFilePath?: string;
}
