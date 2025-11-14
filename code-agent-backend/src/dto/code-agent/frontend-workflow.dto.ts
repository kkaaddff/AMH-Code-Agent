import { ApiProperty } from '@midwayjs/swagger';
import { Rule, RuleType } from '@midwayjs/validate';
import { UserContextDto } from '../common/user-context';

export class FrontendWorkflowRequestDTO extends UserContextDto {
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
}
