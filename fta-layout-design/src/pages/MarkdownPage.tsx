import { Streamdown } from 'streamdown';

export function MarkdownPage() {
  const markdown = `
# Welcome to Streaming Markdown

**Streamdown** brings your markdown to life, one block at a time!

---

## 🚀 Getting Started

Just write your markdown as usual:

\`\`\`markdown
# This is a heading
- List item 1
- List item 2
\`\`\`

---

## 🧑‍💻 Features

- **Live rendering**
- Support for code snippets
- Multiple sections and headings

### Example: Hello World in JavaScript

\`\`\`js
/**
 * 组件识别相关 API 服务
 * 处理组件检测、AI识别和组件管理
 */

import { api } from '@/utils/apiService';

/**
 * 组件服务
 */
export const componentService = {
  /**
   * 检测组件
   */
  async detectComponents(data: { dslData: any; options?: any }) {
    const response = await api.component.detect(data);
    return response.data;
  },

  /**
   * AI 识别组件
   */
  async recognizeComponents(data: { imageData: string; components: any[] }) {
    const response = await api.component.recognize(data);
    return response.data;
  },

  /**
   * 保存组件识别结果
   */
  async saveComponents(data: { projectId: string; components: any[] }) {
    const response = await api.component.save(data);
    return response.data;
  },

  /**
   * 获取组件列表
   */
  async getComponents(projectId: string) {
    const response = await api.component.list(projectId);
    return response.data;
  },
};
\`\`\`

---

## 📊 Rendering a Table

| Feature      | Status   |
| ------------ | -------- |
| Streaming    | ✅       |
| Highlighting | ✅       |
| Tables       | ✅       |

---

## 🎉 Conclusion

Start streaming your markdown today and see your ideas unfold live!
  `;
  return (
    <>
      <div></div>
      <h1 className='text-3xl text-red-500 font-bold underline'>Hello world!</h1>
      <Streamdown>{markdown}</Streamdown>
    </>
  );
}
