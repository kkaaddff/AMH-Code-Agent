import { SaveOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { App, Button, Drawer, Space, Spin } from 'antd';
import React, { useCallback, useMemo, useState } from 'react';
import { Streamdown } from 'streamdown';

import { useRequirementDoc } from '../contexts/RequirementDocContext';
import { executeCodeGeneration, saveRequirementDoc } from '../utils/requirementDoc';
import './RequirementDocDrawer.css';

interface RequirementDocDrawerProps {
  open: boolean;
  onClose: () => void;
  designId: string;
}

const RequirementDocDrawer: React.FC<RequirementDocDrawerProps> = ({ open, onClose, designId }) => {
  const { message } = App.useApp();
  const { docContent, setDocContent } = useRequirementDoc();
  const [loading, setLoading] = useState(false);

  const handleContentChange = useCallback(
    (event: React.ChangeEvent<HTMLTextAreaElement>) => {
      setDocContent(event.target.value);
    },
    [setDocContent]
  );

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
      title="需求规格文档"
      placement="right"
      width="80%"
      open={open}
      onClose={onClose}
      footer={
        <Space className="drawer-footer-actions">
          <Button size="small" icon={<SaveOutlined />} onClick={handleSave}>
            保存
          </Button>
          <Button
            type="primary"
            size="small"
            icon={<ThunderboltOutlined />}
            onClick={handleSaveAndExecute}
            loading={loading}
          >
            保存并执行
          </Button>
        </Space>
      }
    >
      <Spin spinning={loading} tip="正在提交代码生成任务...">
        <div className="editor-wrapper">
          {docContent ? (
            <div className="editor-container">
              {/* <div className="editor-pane">
                <div className="editor-pane-header">Markdown 编辑</div>
                <Input.TextArea
                  value={currentContent}
                  onChange={handleContentChange}
                  className="editor-textarea"
                  autoSize={false}
                  style={{ height: '100%' }}
                  placeholder="在此输入需求规格文档的 Markdown 内容..."
                />
              </div> */}
              <div className="editor-pane">
                <div className="editor-pane-header">实时预览</div>
                <div className="editor-preview">
                  {currentContent ? (
                    <Streamdown>{currentContent}</Streamdown>
                  ) : (
                    <div className="editor-preview-empty">暂无内容</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="loading-placeholder">正在加载文档内容...</div>
          )}
        </div>
      </Spin>
    </Drawer>
  );
};

export default RequirementDocDrawer;
