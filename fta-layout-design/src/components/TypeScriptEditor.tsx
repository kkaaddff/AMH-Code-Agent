import Editor, { BeforeMount, Monaco, OnChange, OnMount, OnValidate } from '@monaco-editor/react';
import { Spin } from 'antd';
import type { editor } from 'monaco-editor';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef } from 'react';

export interface TypeScriptEditorProps {
  /** 编辑器内容 */
  value: string;
  /** 内容变更回调 */
  onChange?: (value: string) => void;
  /** 校验状态变更回调 */
  onValidate?: (hasErrors: boolean, markers: editor.IMarker[]) => void;
  /** 是否开启校验 */
  enableValidation?: boolean;
  /** 编辑器高度 */
  height?: string | number;
  /** 是否只读 */
  readOnly?: boolean;
  /** 占位符文本（当内容为空时显示） */
  placeholder?: string;
  /** 自定义类名 */
  className?: string;
  /** 忽略的 TypeScript 诊断代码列表 */
  ignoreDiagnosticCodes?: number[];
  /** 编辑语言：ts、json、jsonl、jsonc */
  language?: 'typescript' | 'json' | 'jsonl' | 'jsonc';
}

export interface TypeScriptEditorRef {
  /** 获取当前是否有错误 */
  hasErrors: () => boolean;
  /** 获取错误列表 */
  getErrors: () => editor.IMarker[];
}

/**
 * TypeScript 代码编辑器组件
 * 封装 Monaco Editor，提供 TypeScript 语法高亮和基础验证
 */
const TypeScriptEditor = forwardRef<TypeScriptEditorRef, TypeScriptEditorProps>(
  (
    {
      value,
      onChange,
      onValidate,
      enableValidation = true,
      height = 300,
      readOnly = false,
      placeholder,
      className,
      ignoreDiagnosticCodes = [2792],
      language = 'typescript',
    },
    ref
  ) => {
    const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
    const monacoRef = useRef<Monaco | null>(null);
    const markersRef = useRef<editor.IMarker[]>([]);
    // 统一管理语言映射，避免分散的三元判断
    const languageMeta = useMemo(() => {
      switch (language) {
        case 'json':
          return { modelExt: 'json', monacoLanguage: 'json', isTs: false };
        case 'jsonl':
          return { modelExt: 'jsonl', monacoLanguage: 'json', isTs: false };
        case 'jsonc':
          return { modelExt: 'jsonc', monacoLanguage: 'jsonc', isTs: false };
        case 'typescript':
        default:
          return { modelExt: 'ts', monacoLanguage: 'typescript', isTs: true };
      }
    }, [language]);

    // 使用稳定的路径确保模型正确注册到对应语言服务
    const modelPath = useMemo(
      () => `file:///typescript-editor-${Date.now()}.${languageMeta.modelExt}`,
      [languageMeta.modelExt]
    );

    // 编辑器挂载前配置 TypeScript
    const handleBeforeMount: BeforeMount = (monaco) => {
      // 保存 monaco 实例供后续使用
      monacoRef.current = monaco;

      // 配置 TypeScript 编译选项（使用枚举值而不是字符串）
      monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
        target: monaco.languages.typescript.ScriptTarget.ES2020,
        module: monaco.languages.typescript.ModuleKind.ESNext,
        moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeNext,
        strict: true,
        skipLibCheck: true,
        jsx: monaco.languages.typescript.JsxEmit.React,
      });

      if (languageMeta.isTs) {
        // 配置诊断选项（校验规则）
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
          diagnosticCodesToIgnore: ignoreDiagnosticCodes,
          noSemanticValidation: !enableValidation,
          noSyntaxValidation: !enableValidation,
        });
      } else {
        // JSON/JSONL/JSONC 校验配置
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: enableValidation,
          allowComments: true,
          comments: 'ignore',
          trailingCommas: 'ignore',
        });
      }
    };

    // 暴露给父组件的方法
    useImperativeHandle(ref, () => ({
      hasErrors: () => markersRef.current.some((m) => m.severity === 8), // 8 = Error
      getErrors: () => markersRef.current.filter((m) => m.severity === 8),
    }));

    const handleEditorMount: OnMount = useCallback((editor) => {
      editorRef.current = editor;
      // 设置编辑器选项
      editor.updateOptions({
        minimap: { enabled: false },
        fontSize: 13,
        lineNumbers: 'on',
        scrollBeyondLastLine: false,
        automaticLayout: true,
        tabSize: 2,
        wordWrap: 'on',
        folding: true,
        renderWhitespace: 'selection',
        contextmenu: true,
        dropIntoEditor: { enabled: true },
      });

      // 修复右键菜单粘贴功能：浏览器安全限制导致默认粘贴无法工作
      // 覆盖默认的 clipboardPasteAction，使用 Clipboard API 实现
      const monaco = monacoRef.current;
      editor.addAction({
        id: 'editor.action.clipboardPasteAction',
        label: '粘贴',
        // Cmd+V (Mac) / Ctrl+V (Windows/Linux)
        keybindings: monaco ? [monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyV] : [],
        contextMenuGroupId: '9_cutcopypaste',
        contextMenuOrder: 1,
        run: async (ed) => {
          try {
            const text = await navigator.clipboard.readText();
            if (text) {
              const selection = ed.getSelection();
              if (selection) {
                ed.executeEdits('clipboard-paste', [
                  {
                    range: selection,
                    text: text,
                    forceMoveMarkers: true,
                  },
                ]);
              }
            }
          } catch (err) {
            console.warn('无法访问剪贴板，请使用 Ctrl+V 粘贴', err);
          }
        },
      });
    }, []);

    const handleChange: OnChange = (newValue) => {
      onChange?.(newValue || '');
    };
    // 处理校验结果
    const handleValidate: OnValidate = (markers) => {
      if (!enableValidation) {
        markersRef.current = [];
        onValidate?.(false, []);
        return;
      }
      markersRef.current = markers;
      const hasErrors = markers.some((m) => m.severity === 8); // 8 = MarkerSeverity.Error
      onValidate?.(hasErrors, markers);
    };

    // 语言或校验配置变化时，更新对应诊断规则
    useEffect(() => {
      const monaco = monacoRef.current;
      if (!monaco) return;

      if (languageMeta.isTs) {
        monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
          diagnosticCodesToIgnore: ignoreDiagnosticCodes,
          noSemanticValidation: !enableValidation,
          noSyntaxValidation: !enableValidation,
        });
      } else {
        monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
          validate: enableValidation,
          allowComments: true,
          comments: 'ignore',
          trailingCommas: 'ignore',
        });
      }
    }, [enableValidation, languageMeta.isTs]);

    return (
      <div className={className} style={{ border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
        <Editor
          height={height}
          defaultLanguage={languageMeta.monacoLanguage}
          language={languageMeta.monacoLanguage}
          path={modelPath}
          value={value}
          onChange={handleChange}
          beforeMount={handleBeforeMount}
          onMount={handleEditorMount}
          onValidate={handleValidate}
          loading={<Spin size='small' tip='加载编辑器...' />}
          options={{
            readOnly,
            minimap: { enabled: false },
            fontSize: 13,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            folding: true,
            renderWhitespace: 'selection',
            placeholder: placeholder,
            padding: { top: 20 },
            contextmenu: true,
            dropIntoEditor: { enabled: true },
          }}
          theme='light'
        />
      </div>
    );
  }
);

TypeScriptEditor.displayName = 'TypeScriptEditor';

export default TypeScriptEditor;
