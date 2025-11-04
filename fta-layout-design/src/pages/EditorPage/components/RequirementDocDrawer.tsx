import { SaveOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { App, Button, Drawer, Space } from 'antd';
import React, { useMemo, useState } from 'react';
import { Streamdown } from 'streamdown';

import { useSnapshot } from 'valtio/react';
import { createRequirementDocStore } from '../contexts/RequirementDocContext';
import { executeCodeGeneration, saveRequirementDoc } from '../utils/requirementDoc';
import './RequirementDocDrawer.css';

interface RequirementDocDrawerProps {
  open: boolean;
  onClose: () => void;
  designId: string;
  isGenerating?: boolean;
}

const RequirementDocDrawer: React.FC<RequirementDocDrawerProps> = ({ open, onClose, designId, isGenerating }) => {
  const { message } = App.useApp();
  const { docContent } = useSnapshot(createRequirementDocStore());
  const [loading, setLoading] = useState(false);

  // 编辑面板暂时只保留预览，如需开启编辑请恢复对应代码并绑定 onChange 更新 setDocContent

  const currentContent = useMemo(() => docContent ?? '', [docContent]);

  const handleSave = () => {
    try {
      saveRequirementDoc(designId, currentContent);
      message.success('需求规格文档已保存');
    } catch (error) {
      message.error('保存失败');
      console.error('Save error:', error);
    }
  };

  const handleSaveAndExecute = async () => {
    try {
      setLoading(true);
      // 先保存
      saveRequirementDoc(designId, currentContent);

      // 再执行代码生成
      const result = await executeCodeGeneration(designId, currentContent);

      if (result.success) {
        message.success(result.message);
        onClose();
      } else {
        message.error('代码生成失败');
      }
    } catch (error) {
      message.error('执行失败');
      console.error('Execute error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title='需求规格文档'
      placement='right'
      width='80%'
      open={open}
      onClose={onClose}
      footer={
        <Space className='drawer-footer-actions'>
          <Button size='small' icon={<SaveOutlined />} onClick={handleSave}>
            保存
          </Button>
          <Button
            type='primary'
            size='small'
            icon={<ThunderboltOutlined />}
            onClick={handleSaveAndExecute}
            loading={loading}>
            保存并执行
          </Button>
        </Space>
      }>
      <div className='editor-wrapper'>
        {docContent ? (
          <div className='editor-container'>
            <div className='editor-pane'>
              <div className='editor-pane-header'>实时预览</div>
              <div className='editor-preview'>
                {currentContent ? (
                  <Streamdown isAnimating={isGenerating}>{currentContent}</Streamdown>
                ) : (
                  <div className='editor-preview-empty'>暂无内容</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className='loading-placeholder'>正在加载文档内容...</div>
        )}
      </div>
    </Drawer>
  );
};

export default RequirementDocDrawer;
