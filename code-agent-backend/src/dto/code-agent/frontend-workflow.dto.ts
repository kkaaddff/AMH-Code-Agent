import { ApiProperty } from '@midwayjs/swagger';
import { Rule, RuleType } from '@midwayjs/validate';

export interface TreeNode {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: TreeNode[];
}

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
    example: 'FTA-Frontend',
    description: '产品名称',
  })
  @Rule(RuleType.string().optional())
  productName?: string;

  @ApiProperty({
    required: false,
    example: undefined,
    description: 'src 目录树结构',
  })
  @Rule(RuleType.object().optional())
  srcTree?: TreeNode;

  @ApiProperty({
    required: false,
    example: 'sk-xxx',
    description: 'API Key（可选，优先使用）',
  })
  @Rule(RuleType.string().optional())
  apiKey?: string;

  @ApiProperty({
    required: false,
    example: 'https://api.openai.com/v1',
    description: 'Base URL（可选，优先使用）',
  })
  @Rule(RuleType.string().optional())
  baseURL?: string;
}
