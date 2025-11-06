import { apiServices } from '@/services';
import type { AnnotationSnapshot, DocumentReference } from '@/types/project';
import { ComponentMapping, AnnotationNode } from '../types/componentDetection';

const STORAGE_KEY_PREFIX = 'fta-component-mappings';
const ANNOTATION_STORAGE_KEY_PREFIX = 'fta-annotations';

/**
 * Generate storage key for a project
 */
function getStorageKey(projectId: string = 'default'): string {
  return `${STORAGE_KEY_PREFIX}-${projectId}`;
}

/**
 * 将组件映射结果保存到 localStorage。
 * @param confirmedMappings 已确认的组件映射列表
 * @param unconfirmedMappings 待确认的组件映射列表
 * @param projectId 项目标识，默认使用 `default`
 * @param ignoredMappings 已忽略的组件映射列表
 */
export function saveComponentMappings(
  confirmedMappings: ComponentMapping[],
  unconfirmedMappings: ComponentMapping[],
  projectId: string = 'default',
  ignoredMappings: ComponentMapping[] = []
): void {
  try {
    const data = {
      confirmedMappings,
      unconfirmedMappings,
      ignoredMappings,
      savedAt: Date.now(),
      version: '1.1',
    };

    localStorage.setItem(getStorageKey(projectId), JSON.stringify(data));
  } catch (error) {
    console.error('Failed to save component mappings:', error);
  }
}

/**
 * 从 localStorage 读取组件映射结果。
 * @param projectId 项目标识，默认使用 `default`
 * @returns 组件映射数据对象，读取失败时返回 null
 */
export function loadComponentMappings(projectId: string = 'default'): {
  confirmedMappings: ComponentMapping[];
  unconfirmedMappings: ComponentMapping[];
  ignoredMappings: ComponentMapping[];
} | null {
  try {
    const stored = localStorage.getItem(getStorageKey(projectId));

    if (!stored) {
      return null;
    }

    const data = JSON.parse(stored);

    // Validate data structure
    if (!data.confirmedMappings || !data.unconfirmedMappings) {
      console.warn('Invalid stored data structure');
      return null;
    }

    return {
      confirmedMappings: data.confirmedMappings,
      unconfirmedMappings: data.unconfirmedMappings,
      ignoredMappings: data.ignoredMappings || [], // Default to empty array for backward compatibility
    };
  } catch (error) {
    console.error('Failed to load component mappings:', error);
    return null;
  }
}

/**
 * 清除指定项目在 localStorage 中的组件映射缓存。
 * @param projectId 项目标识，默认使用 `default`
 */
export function clearComponentMappings(projectId: string = 'default'): void {
  try {
    localStorage.removeItem(getStorageKey(projectId));
  } catch (error) {
    console.error('Failed to clear component mappings:', error);
  }
}

/**
 * 将组件映射结果导出为 JSON 文件。
 * @param confirmedMappings 已确认的组件映射列表
 * @param unconfirmedMappings 待确认的组件映射列表
 * @param filename 导出的文件名，默认 `component-mappings.json`
 * @param ignoredMappings 已忽略的组件映射列表
 */
export function exportMappingsToJSON(
  confirmedMappings: ComponentMapping[],
  unconfirmedMappings: ComponentMapping[],
  filename: string = 'component-mappings.json',
  ignoredMappings: ComponentMapping[] = []
): void {
  const data = {
    confirmedMappings,
    unconfirmedMappings,
    ignoredMappings,
    exportedAt: Date.now(),
    version: '1.1',
  };

  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 从 JSON 文件中导入组件映射结果。
 * @param file 用户选择的 JSON 文件
 * @returns 解析出的组件映射数据 Promise
 */
export function importMappingsFromJSON(file: File): Promise<{
  confirmedMappings: ComponentMapping[];
  unconfirmedMappings: ComponentMapping[];
  ignoredMappings: ComponentMapping[];
}> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);

        if (!data.confirmedMappings || !data.unconfirmedMappings) {
          reject(new Error('Invalid file format'));
          return;
        }

        resolve({
          confirmedMappings: data.confirmedMappings,
          unconfirmedMappings: data.unconfirmedMappings,
          ignoredMappings: data.ignoredMappings || [], // Default to empty array for backward compatibility
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}

/**
 * Generate storage key for annotation state
 */
function getAnnotationStorageKey(designId: string): string {
  return `${ANNOTATION_STORAGE_KEY_PREFIX}-${designId}`;
}

const ANNOTATION_VERSION = '1.0';

function readAnnotationCache(designId: string): AnnotationSnapshot | null {
  try {
    const stored = localStorage.getItem(getAnnotationStorageKey(designId));
    if (!stored) {
      return null;
    }
    const parsed = JSON.parse(stored) as AnnotationSnapshot;

    return parsed;
  } catch (error) {
    console.error('Failed to read cached annotation state:', error);
    return null;
  }
}

function normalizeSnapshot(raw: unknown): AnnotationSnapshot | null {
  if (!raw) {
    return null;
  }

  const snapshot = typeof raw === 'string' ? safelyParseJSON(raw) : raw;
  if (!snapshot || typeof snapshot !== 'object') {
    return null;
  }

  const candidate = snapshot as Partial<AnnotationSnapshot> & Record<string, any>;

  if (!('rootAnnotation' in candidate)) {
    return null;
  }

  return {
    rootAnnotation: (candidate.rootAnnotation as AnnotationNode | null) ?? null,
    savedAt: typeof candidate.savedAt === 'number' ? candidate.savedAt : Date.now(),
    version: typeof candidate.version === 'string' ? candidate.version : ANNOTATION_VERSION,
  };
}

function safelyParseJSON(content: string): unknown {
  try {
    return JSON.parse(content);
  } catch (error) {
    console.warn('Failed to parse annotation JSON content:', error);
    return null;
  }
}

/**
 * 将标注树状态保存到后端服务（本地缓存兜底）。
 * @param designId 设计稿标识
 * @param rootAnnotation 根标注节点
 */
export async function saveAnnotationState(designId: string, rootAnnotation: AnnotationNode | null): Promise<void> {
  try {
    const snapshot: AnnotationSnapshot = {
      rootAnnotation,
      savedAt: Date.now(),
      version: ANNOTATION_VERSION,
    };

    const payload: Partial<DocumentReference> = {
      id: designId,
      annotationData: snapshot,
    };

    await apiServices.project.updateDocument(payload);
  } catch (error) {
    console.error('Failed to save annotation state:', error);
    throw error;
  }
}

/**
 * 从后端加载标注树状态，如失败则回退到本地缓存。
 * @param designId 设计稿标识
 * @returns 包含根标注节点的对象
 */
export async function loadAnnotationState(designId: string): Promise<{ rootAnnotation: AnnotationNode | null }> {
  try {
    const documentContent = await apiServices.project.getDocumentContent({ documentId: designId });
    const snapshot = normalizeSnapshot(documentContent?.annotationData ?? documentContent);

    if (snapshot) {
      return {
        rootAnnotation: snapshot.rootAnnotation,
      };
    }
  } catch (error) {
    console.error('Failed to fetch annotation state from API:', error);
  }

  const cached = readAnnotationCache(designId);
  if (cached) {
    return {
      rootAnnotation: cached.rootAnnotation,
    };
  }

  return { rootAnnotation: null };
}

/**
 * 清除指定设计稿在 localStorage 中的标注缓存。
 * @param designId 设计稿标识
 */
export function clearAnnotationState(designId: string): void {
  try {
    localStorage.removeItem(getAnnotationStorageKey(designId));
  } catch (error) {
    console.error('Failed to clear annotation state:', error);
  }
}
