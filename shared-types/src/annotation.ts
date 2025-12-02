export interface AnnotationNode {
  id: string;
  dslNodeId?: string;
  ftaComponent: string;
  isRoot: boolean;
  isMainPage: boolean;
  isContainer: boolean;
  name?: string;
  comment?: string;
  children: AnnotationNode[];
  absoluteX: number;
  absoluteY: number;
  width: number;
  height: number;
  props?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface AnnotationSnapshot {
  rootAnnotation: AnnotationNode | null;
  savedAt: number;
  version: string;
}
