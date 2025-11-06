const DOCUMENT_STATUS_TEXT_MAP = {
  pending: '待同步',
  syncing: '同步中',
  synced: '已同步',
  editing: '编辑中',
  completed: '已完成',
  failed: '同步失败',
} as const;

export type DocumentStatus = keyof typeof DOCUMENT_STATUS_TEXT_MAP;

/**
 * 根据状态标识返回对应的中文展示文案。
 * @param status 文档状态码
 * @returns 中文状态描述
 */
export const getDocumentStatusText = (status: string): string => {
  return DOCUMENT_STATUS_TEXT_MAP[status as DocumentStatus] ?? '未知';
};

/**
 * 根据状态标识返回标签颜色类型。
 * @param status 文档状态码
 * @returns 对应的颜色类型字符串
 */
export const getDocumentStatusColor = (status: string) => {
  switch (status) {
    case 'pending':
      return 'default';
    case 'syncing':
      return 'processing';
    case 'synced':
      return 'warning';
    case 'editing':
      return 'processing';
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'default';
  }
};

export interface DocumentActionConfig {
  buttonText: string;
  buttonType: 'primary' | 'default';
  buttonIcon?: string;
  action: 'sync' | 'edit';
}

/**
 * 基于状态返回按钮配置，用于控制操作文案与类型。
 * @param status 文档状态码
 * @returns 文档操作按钮配置，若无匹配则返回 null
 */
export const getDocumentActionConfig = (status: string): DocumentActionConfig | null => {
  const actionConfigs: Record<string, DocumentActionConfig> = {
    pending: {
      buttonText: '同步',
      buttonType: 'primary',
      buttonIcon: 'sync',
      action: 'sync',
    },
    synced: {
      buttonText: '开始编辑',
      buttonType: 'default',
      action: 'edit',
    },
    editing: {
      buttonText: '去编辑',
      buttonType: 'primary',
      buttonIcon: 'edit',
      action: 'edit',
    },
    failed: {
      buttonText: '重试',
      buttonType: 'primary',
      buttonIcon: 'sync',
      action: 'sync',
    },
  };

  return actionConfigs[status] || null;
};

export const DOCUMENT_STATUS_TEXT = DOCUMENT_STATUS_TEXT_MAP;
