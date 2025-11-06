import type { AnnotationNode } from '@/pages/EditorPage/types/componentDetection';

const delay = (ms = 200) => new Promise((resolve) => setTimeout(resolve, ms));

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

（以下内容省略，保持示例文档结构。）`;

interface GenerateRequirementParams {
  designId: string;
  templateKey?: string;
  rootAnnotation?: AnnotationNode | null;
  annotationVersion?: number;
  annotationSchemaVersion?: string;
}

export const requirementMockService = {
  async generateRequirement(params: GenerateRequirementParams) {
    await delay();
    const timestamp = new Date().toISOString();
    return {
      id: `mock-requirement-${params.designId}`,
      designId: params.designId,
      title: `${params.templateKey ? `[${params.templateKey}] ` : ''}需求规格文档`,
      content: MOCK_SPEC_MD,
      status: 'draft' as const,
      exportFormats: ['md'],
      createdAt: timestamp,
      updatedAt: timestamp,
      provider: {
        name: 'mock',
      },
    };
  },

  async saveRequirement(data: { docId: string; title?: string; content?: string; status?: string }) {
    await delay();
    return {
      ...data,
      updatedAt: new Date().toISOString(),
      success: true,
    };
  },

  async exportRequirement(params: { docId: string }) {
    await delay();
    return {
      downloadUrl: `https://mock-download/requirements/${params.docId}.md`,
    };
  },

  async getRequirementDetail(params: { docId: string }) {
    await delay();
    return {
      id: params.docId,
      title: '需求规格文档',
      content: MOCK_SPEC_MD,
      status: 'published' as const,
      exportFormats: ['md'],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  },

  async getRequirementList(params: { designId: string; page?: number; size?: number }) {
    await delay();
    const page = params.page || 1;
    const size = params.size || 10;

    return {
      list: [
        {
          id: `mock-req-${params.designId}-1`,
          designId: params.designId,
          title: '需求规格文档 v1.0',
          status: 'published' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: `mock-req-${params.designId}-2`,
          designId: params.designId,
          title: '需求规格文档 v2.0 (草稿)',
          status: 'draft' as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      total: 2,
      page,
      size,
    };
  },
};
