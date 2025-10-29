import React, { useRef, useState, useEffect } from 'react';
import { Drawer, Button, Space, App, Spin } from 'antd';
import { SaveOutlined, ThunderboltOutlined } from '@ant-design/icons';
import {
  MDXEditor,
  headingsPlugin,
  listsPlugin,
  quotePlugin,
  linkPlugin,
  codeBlockPlugin,
  markdownShortcutPlugin,
  toolbarPlugin,
  UndoRedo,
  BoldItalicUnderlineToggles,
  ListsToggle,
  BlockTypeSelect,
  MDXEditorMethods,
} from '@mdxeditor/editor';
import '@mdxeditor/editor/style.css';
import './RequirementDocDrawer.css';
import { executeCodeGeneration, saveRequirementDoc, loadRequirementDoc } from '../utils/requirementDoc';

interface RequirementDocDrawerProps {
  open: boolean;
  onClose: () => void;
  designId: string;
  initialContent: string;
}

const RequirementDocDrawer: React.FC<RequirementDocDrawerProps> = ({ open, onClose, designId, initialContent }) => {
  const { message } = App.useApp();
  const editorRef = useRef<MDXEditorMethods>(null);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState(initialContent);

  // 当打开 Drawer 时，尝试加载已保存的内容
  useEffect(() => {
    if (open) {
      const savedContent = loadRequirementDoc(designId);
      if (savedContent) {
        setContent(savedContent);
      } else {
        setContent(initialContent);
      }
    }
  }, [open, designId, initialContent]);

  const handleSave = () => {
    try {
      const currentContent = editorRef.current?.getMarkdown() || content;
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
      const currentContent = editorRef.current?.getMarkdown() || content;

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
          {content ? (
            <div className="editor-container">
              <MDXEditor
                key={`editor-${designId}-${content.length}`} // 使用 designId 和内容长度作为 key
                ref={editorRef}
                markdown={content}
                plugins={[
                  toolbarPlugin({
                    toolbarContents: () => (
                      <>
                        <UndoRedo />
                        <BoldItalicUnderlineToggles />
                        <BlockTypeSelect />
                        <ListsToggle />
                      </>
                    ),
                  }),
                  headingsPlugin(),
                  listsPlugin(),
                  quotePlugin(),
                  linkPlugin(),
                  codeBlockPlugin({ defaultCodeBlockLanguage: 'typescript' }),
                  markdownShortcutPlugin(),
                ]}
                className="mdx-editor-custom"
              />
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
