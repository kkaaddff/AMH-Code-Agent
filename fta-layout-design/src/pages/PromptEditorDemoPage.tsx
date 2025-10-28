import React, { useState } from "react";
import { Card, Space, Button, Input, Switch, Divider } from "antd";

// 简单的提示词编辑器组件
const SimplePromptEditor: React.FC<{
  value: string;
  placeholder?: string;
  onChange?: (value: string) => void;
}> = ({ value, placeholder, onChange }) => {
  return (
    <textarea
      value={value}
      placeholder={placeholder}
      onChange={(e) => onChange?.(e.target.value)}
      style={{
        width: "100%",
        height: "200px",
        border: "none",
        outline: "none",
        resize: "vertical",
        fontFamily: "monospace",
        fontSize: "14px",
        lineHeight: "1.5",
      }}
    />
  );
};

const PromptEditorDemoPage: React.FC = () => {
  const [value, setValue] = useState(
    "请输入您的提示词内容...\n\n您可以使用以下功能：\n- 输入 / 来插入特殊块\n- 输入 { 来插入变量\n- 支持多行编辑"
  );
  const [editable, setEditable] = useState(true);
  const [compact, setCompact] = useState(false);
  const [placeholder, setPlaceholder] = useState("请输入提示词...");

  const resetContent = () => {
    setValue("这是重置后的内容\n\n试试输入 / 或 { 来使用特殊功能");
  };

  
  const handleChangeValue = (val: string) => {
    setValue(val);
  };

  const clearContent = () => {
    setValue("");
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1>Prompt Editor Demo</h1>
      <p>这是一个功能完整的提示词编辑器演示页面，支持多种特殊块和变量插入功能。</p>

      <Space direction="vertical" size="large" style={{ width: "100%" }}>
        {/* 控制面板 */}
        <Card title="控制面板" size="small">
          <Space wrap>
            <div>
              <label>可编辑: </label>
              <Switch checked={editable} onChange={setEditable} />
            </div>
            <div>
              <label>紧凑模式: </label>
              <Switch checked={compact} onChange={setCompact} />
            </div>
            <div>
              <label>占位符: </label>
              <Input value={placeholder} onChange={(e) => setPlaceholder(e.target.value)} style={{ width: 200 }} />
            </div>
            <Button onClick={resetContent}>重置内容</Button>
            <Button onClick={clearContent}>清空内容</Button>
          </Space>
        </Card>

        {/* 编辑器 */}
        <Card title="Prompt Editor" size="small">
          <div style={{ border: "1px solid rgb(217, 217, 217)", borderRadius: "6px", padding: "12px", minHeight: "200px" }}>
            <SimplePromptEditor
              value={value}
              placeholder={placeholder}
              onChange={handleChangeValue}
            />
          </div>
        </Card>

        {/* 输出显示 */}
        <Card title="当前内容" size="small">
          <pre
            style={{
              background: "rgb(245, 245, 245)",
              padding: "12px",
              borderRadius: "4px",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {value || "(空内容)"}
          </pre>
        </Card>

        {/* 使用说明 */}
        <Card title="使用说明" size="small">
          <div>
            <h4>功能特性：</h4>
            <ul>
              <li>
                <strong>特殊块插入</strong>: 输入 <code>/</code> 可以插入各种特殊功能块
              </li>
              <li>
                <strong>变量插入</strong>: 输入 <code>{"{"}</code> 可以插入变量
              </li>
              <li>
                <strong>多行编辑</strong>: 支持多行文本编辑
              </li>
              <li>
                <strong>实时预览</strong>: 编辑内容会实时显示在下方
              </li>
              <li>
                <strong>可配置</strong>: 支持编辑模式、紧凑模式等配置
              </li>
            </ul>

            <Divider />

            <h4>支持的特殊块：</h4>
            <ul>
              <li>
                <strong>上下文块</strong>: <code>{"{{#context#}}"}</code> - 插入知识库上下文
              </li>
              <li>
                <strong>查询块</strong>: <code>{"{{#query#}}"}</code> - 插入用户查询
              </li>
              <li>
                <strong>历史块</strong>: <code>{"{{#histories#}}"}</code> - 插入对话历史
              </li>
              <li>
                <strong>当前块</strong>: <code>{"{{#current#}}"}</code> - 插入当前状态
              </li>
              <li>
                <strong>错误消息块</strong>: <code>{"{{#error_message#}}"}</code> - 插入错误信息
              </li>
              <li>
                <strong>最后运行块</strong>: <code>{"{{#last_run#}}"}</code> - 插入最后运行结果
              </li>
            </ul>
          </div>
        </Card>
      </Space>
    </div>
  );
};

export default PromptEditorDemoPage;
