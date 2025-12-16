export interface MergedLayout {
  width: number;
  height: number;
  absoluteX: number;
  absoluteY: number;
  padding?: string;
  margin?: string;
  gap?: number;
  flexDirection?: 'row' | 'column';
  justifyContent?: string;
  alignItems?: string;
}

export interface MergedStyles {
  backgroundColor?: string;
  backgroundImage?: string;
  border?: string;
  borderRadius?: string | number;
  boxShadow?: string;
  opacity?: number;
  color?: string;
}

export interface MergedTypography {
  fontSize: number;
  fontWeight?: string | number;
  lineHeight: number;
  textAlign?: 'left' | 'center' | 'right';
  content: string;
  decoration?: string;
}

export interface MergedExtraVisual {
  id: string;
  type: 'Rect' | 'Text' | 'Vector' | 'Image';
  layout: {
    width: number;
    height: number;
    absoluteX: number;
    absoluteY: number;
  };
  styles: Record<string, unknown>;
  content?: string;
  roleHint?: string;
}

export interface MergedPageNode {
  nodeId: string;
  type: string;
  componentName?: string;
  dataType?: string;
  comment?: string;
  layout: MergedLayout;
  styles: MergedStyles;
  typography?: MergedTypography;
  extraVisuals: MergedExtraVisual[];
  children: MergedPageNode[];
}
