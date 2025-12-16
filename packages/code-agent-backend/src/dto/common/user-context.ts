import { ApiProperty } from '@midwayjs/swagger';

export class UserContextDto {
  @ApiProperty({ description: '用户 ID', example: 'user_123', required: true })
  userId: string;

  @ApiProperty({
    description: 'Git 仓库 ID',
    example: 'git_123',
    required: false,
    default: 'empty',
  })
  gitId?: string;
}

export const normalizeGitId = (gitId?: string): string => {
  if (gitId && gitId.trim()) {
    return gitId.trim();
  }
  return 'empty';
};
