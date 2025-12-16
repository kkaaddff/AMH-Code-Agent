import { API_ENDPOINTS, buildApiUrl } from '@/config/api';
import { apiServices, shouldUseMock } from '@/services';
import type { AnnotationNode } from '../types/componentDetection';

interface RequirementDocGenerationOptions {
  templateKey?: string;
  annotationVersion?: number;
  annotationSchemaVersion?: string;
  onChunk?: (chunk: string) => void;
  signal?: AbortSignal;
}

async function streamRequirementDoc(
  payload: {
    designId: string;
    rootAnnotation: AnnotationNode | null;
    templateKey?: string;
    annotationVersion?: number;
    annotationSchemaVersion?: string;
  },
  options?: RequirementDocGenerationOptions
): Promise<string> {
  const response = await fetch(buildApiUrl(API_ENDPOINTS.requirement.generate), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify({
      designId: payload.designId,
      rootAnnotation: payload.rootAnnotation,
      templateKey: payload.templateKey,
      annotationVersion: payload.annotationVersion,
      annotationSchemaVersion: payload.annotationSchemaVersion,
    }),
    signal: options?.signal,
  });

  if (!response.ok) {
    throw new Error(`生成需求规格文档失败：${response.status} ${response.statusText}`);
  }

  const contentType = response.headers.get('Content-Type') || '';

  if (!contentType.includes('text/event-stream')) {
    const result = await response.json();
    const data = typeof result === 'string' ? result : result?.data;
    if (typeof data === 'string') {
      options?.onChunk?.(data);
      return data;
    }
    throw new Error('生成需求规格文档失败：未返回有效内容');
  }

  if (!response.body) {
    throw new Error('当前环境不支持流式读取响应');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');

  let accumulator = '';
  let buffer = '';
  let completed = false;

  while (!completed) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    const events = buffer.split('\n\n');
    buffer = events.pop() ?? '';

    for (const rawEvent of events) {
      const lines = rawEvent.split('\n');

      for (const rawLine of lines) {
        const line = rawLine.trim();
        if (!line || line.startsWith(':') || !line.startsWith('data:')) {
          continue;
        }

        const dataStr = line.slice(5).trim();
        if (!dataStr) {
          continue;
        }

        if (dataStr === '[DONE]') {
          completed = true;
          buffer = '';
          break;
        }

        let parsed: any;
        try {
          parsed = JSON.parse(dataStr);
        } catch (error) {
          accumulator += dataStr;
          options?.onChunk?.(dataStr);
          continue;
        }

        const eventType = parsed.event ?? 'chunk';
        if (eventType === 'error') {
          throw new Error(parsed.message || '生成需求规格文档失败');
        }
        if (eventType === 'done') {
          completed = true;
          buffer = '';
          break;
        }
        if (eventType === 'chunk') {
          const chunk = typeof parsed.content === 'string' ? parsed.content : '';
          if (chunk) {
            accumulator += chunk;
            options?.onChunk?.(chunk);
          }
        }
      }

      if (completed) {
        break;
      }
    }

    if (done) {
      if (!completed && buffer.trim()) {
        const fallback = buffer.trim();
        accumulator += fallback;
        options?.onChunk?.(fallback);
      }
      break;
    }
  }

  return accumulator;
}

/**
 * 请求生成需求规格文档，可选择使用流式回调收集内容。
 * @param designId 设计稿标识
 * @param rootAnnotation 根标注节点数据
 * @param options 生成配置（模板、版本、流式回调等）
 * @returns 完整的需求规格文档字符串
 */
export async function generateRequirementDoc(
  designId: string,
  rootAnnotation: AnnotationNode | null,
  options?: RequirementDocGenerationOptions
): Promise<string> {
  if (!designId) {
    throw new Error('designId is required');
  }

  const payload = {
    designId,
    rootAnnotation,
    templateKey: options?.templateKey,
    annotationVersion: options?.annotationVersion,
    annotationSchemaVersion: options?.annotationSchemaVersion,
  };

  if (shouldUseMock()) {
    const document: string = await apiServices.requirement.generateRequirement(payload);
    if (!document) {
      throw new Error('生成的需求规格文档为空');
    }
    options?.onChunk?.(document);
    return document;
  }

  const content = await streamRequirementDoc(payload, options);

  if (!content) {
    throw new Error('生成的需求规格文档为空');
  }

  return content;
}

/**
 * （占位实现）触发代码生成任务。
 * @param designId 设计稿标识
 * @param mdContent 需求文档内容
 * @returns 任务提交结果
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
 * 将需求文档内容保存到 localStorage。
 * @param designId 设计稿标识
 * @param content 需求文档内容
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
 * 从 localStorage 读取需求文档内容。
 * @param designId 设计稿标识
 * @returns 需求文档内容，未命中时返回 null
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
