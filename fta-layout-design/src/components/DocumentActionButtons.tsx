import React from 'react';
import { Button } from 'antd';
import { SyncOutlined, EditOutlined } from '@ant-design/icons';
import { getDocumentActionConfig } from '@/utils/documentStatus';

interface DocumentActionButtonsProps {
  status: string;
  onSync: () => void;
  onStartEditing: () => void;
}

export const DocumentActionButtons: React.FC<DocumentActionButtonsProps> = ({
  status,
  onSync,
  onStartEditing,
}) => {
  const config = getDocumentActionConfig(status);

  if (!config) {
    return null;
  }

  const getIcon = () => {
    switch (config.buttonIcon) {
      case 'sync':
        return <SyncOutlined />;
      case 'edit':
        return <EditOutlined />;
      default:
        return undefined;
    }
  };

  const handleClick = () => {
    if (config.action === 'sync') {
      onSync();
    } else {
      onStartEditing();
    }
  };

  return (
    <Button type={config.buttonType} size="small" icon={getIcon()} onClick={handleClick}>
      {config.buttonText}
    </Button>
  );
};

