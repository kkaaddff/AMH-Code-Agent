import type { DSLNode } from './dsl';

export interface LayoutProperties {
  width?: number;
  height?: number;
  position?: string;
  flexDirection?: string;
  alignItems?: string;
  justifyContent?: string;
  flex?: number;
  gap?: number;
  padding?: string;
  margin?: string;
  backgroundColor?: string;
  borderRadius?: string;
}

export interface AnnotationNode {
  id: string;
  dslNodeId: string;
  dslNode: DSLNode | null;
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
  layout?: LayoutProperties;
  props?: Record<string, any>;
  createdAt: number;
  updatedAt: number;
}

export interface AnnotationSnapshot {
  rootAnnotation: AnnotationNode | null;
  savedAt: number;
  version: string;
}
