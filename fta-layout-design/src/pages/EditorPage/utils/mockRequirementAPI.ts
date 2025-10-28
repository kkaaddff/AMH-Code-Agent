// Mock Requirement API for demonstration purposes
// TODO: 替换为真实的 API 服务调用
// 可使用: import { api } from 'utils/apiService';

const MOCK_SPEC_MD = `# 组件识别编辑器 - 图层树拖拽功能需求规格文档

## 1. 功能概述

为 \`EditorPageComponentDetectV2\` 的图层树面板（\`LayerTreePanel\`）添加节点拖拽功能，允许用户通过拖拽操作调整组件的层级结构和父子关系，实现组件树的可视化重组。

## 2. 目标用户场景

### 场景 1：将外部节点拖入容器

- 用户将 Search 组件拖入 Flex 容器
- 系统自动将 Search 添加为 Flex 的子节点
- Flex 容器自动调整边界以包含新加入的子节点

### 场景 2：将子节点拖出容器

- 用户将 Flex 内的子组件（如内部的 Flex 或 Text）拖出父容器
- 子节点脱离原父容器，提升为父容器的同级节点
- 原父容器边界相应调整

### 场景 3：防止破坏性拖拽

- 不允许跨越兄弟节点的拖拽（例如：不能直接将深层嵌套的节点跨过其他节点拖出）
- 确保树结构的一致性和完整性

## 3. 核心拖拽规则（通用规则）

### 3.1 拖入容器规则（场景 1）

**前置条件：**

- 源节点 S 和目标容器节点 T 满足以下条件：
  - T 必须是容器类型组件（\`isContainer === true\`）
  - S 不是 T 的祖先节点（防止循环引用）
  - S 不是页面根节点（\`isRoot === false\`）

**执行逻辑：**

1. **位置确定**：
   - 根据拖拽位置（dropPosition）确定插入顺序
   - 如果拖到容器节点上方/内部，插入为第一个子节点
   - 如果拖到容器节点下方，根据容器是否展开决定

2. **从原父节点移除 S**

3. **添加到目标容器 T**

4. **边界调整**：重新计算 T 的边界

5. **DSL 节点处理**：检查空间关系一致性

## 4. 实施计划

本文档描述了组件识别编辑器的拖拽功能实现需求。详细的技术实现将在后续迭代中完成。

## 5. 验收标准

1. ✅ 所有功能测试用例通过
2. ✅ 拖拽操作流畅，无明显卡顿
3. ✅ 错误提示清晰，用户友好
4. ✅ 代码通过 TypeScript 类型检查
`;

/**
 * Generate requirement document (Mock API)
 * @param designId - Design ID
 * @returns Promise<string> - Markdown content
 */
export async function generateRequirementDoc(designId: string): Promise<string> {
  // TODO: 替换为真实API调用
  // return api.requirement.generate({ projectId: designId, requirements: [] }).then(res => res.data);

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 300));

  console.log('[Mock API] Generating requirement doc for designId:', designId);

  return MOCK_SPEC_MD;
}

/**
 * Execute code generation (Mock API)
 * @param designId - Design ID
 * @param mdContent - Markdown content
 * @returns Promise<{ success: boolean; message: string }>
 */
export async function executeCodeGeneration(
  designId: string,
  mdContent: string
): Promise<{ success: boolean; message: string }> {
  // TODO: 替换为真实API调用
  // return api.requirement.save({ projectId: designId, document: { content: mdContent } }).then(res => ({
  //   success: res.success,
  //   message: res.message
  // }));

  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 500));

  console.log('[Mock API] Executing code generation for designId:', designId);
  console.log('[Mock API] MD content length:', mdContent.length);

  return {
    success: true,
    message: '代码生成任务已提交，预计 2 分钟完成',
  };
}

/**
 * Save requirement document to localStorage
 * @param designId - Design ID
 * @param content - Markdown content
 */
export function saveRequirementDoc(designId: string, content: string): void {
  const key = `fta-requirement-doc-${designId}`;
  const data = {
    content,
    savedAt: Date.now(),
  };
  localStorage.setItem(key, JSON.stringify(data));
}

/**
 * Load requirement document from localStorage
 * @param designId - Design ID
 * @returns string | null - Markdown content
 */
export function loadRequirementDoc(designId: string): string | null {
  const key = `fta-requirement-doc-${designId}`;
  const stored = localStorage.getItem(key);

  if (!stored) {
    return null;
  }

  try {
    const data = JSON.parse(stored);
    return data.content || null;
  } catch (error) {
    console.error('Failed to parse requirement doc:', error);
    return null;
  }
}

