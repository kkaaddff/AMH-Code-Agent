import { apiServices } from '@/services';
import type { AnnotationSnapshot, DocumentReference } from '@/types/project';
import { AnnotationNode } from '@fta/shared';

const ANNOTATION_VERSION = '1.0';

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

    const payload: Partial<DocumentReference> & { id: string } = {
      id: designId,
      annotationData: snapshot,
    };

    await apiServices.project.updateDocument(payload);
  } catch (error) {
    console.error('Failed to save annotation state:', error);
    throw error;
  }
}
