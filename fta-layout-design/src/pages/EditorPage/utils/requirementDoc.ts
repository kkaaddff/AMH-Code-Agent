import { apiServices } from '@/services';
import type { AnnotationNode } from '../types/componentDetectionV2';

/**
 * 生成需求规格文档
 */
export async function generateRequirementDoc(
  designId: string,
  rootAnnotation: AnnotationNode | null,
  options?: {
    templateKey?: string;
    annotationVersion?: number;
    annotationSchemaVersion?: string;
  }
): Promise<string> {
  if (!designId) {
    throw new Error('designId is required');
  }

  const document = await apiServices.requirement.generateRequirement({
    designId,
    rootAnnotation,
    templateKey: options?.templateKey,
    annotationVersion: options?.annotationVersion,
    annotationSchemaVersion: options?.annotationSchemaVersion,
  });

  const content = document?.content;
  if (!content) {
    throw new Error('生成的需求规格文档为空');
  }

  return content;
}

/**
 * TODO: 替换为真实的代码生成接口
 */
export async function executeCodeGeneration(
  designId: string,
  mdContent: string
): Promise<{ success: boolean; message: string }> {
  // 真实实现待接入后端任务调度服务
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
