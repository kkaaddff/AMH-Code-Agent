import { DSLStyles } from '../types/dsl';
import { parseColor } from './styleUtils';

export const parseBorderStyle = (strokeColor: string, strokeType: string, strokeAlign: string, strokeWidth: string, styles: DSLStyles): React.CSSProperties => {
  const borderStyle: React.CSSProperties = {};

  // 确保 strokeColor 是字符串类型
  if (strokeColor && typeof strokeColor === 'string') {
    borderStyle.borderColor = parseColor(strokeColor, styles);
  }
  
  if (strokeType) {
    borderStyle.borderStyle = strokeType as any;
  }
  
  if (strokeWidth) {
    // 处理多值边框宽度，如 "0px 0px 1px"
    if (strokeWidth.includes(' ')) {
      // 移除所有 px 后缀，然后重新添加
      const widthValues = strokeWidth.split(' ').map(w => w.replace('px', '')).join('px ') + 'px';
      borderStyle.borderWidth = widthValues;
    } else {
      borderStyle.borderWidth = `${strokeWidth.replace('px', '')}px`;
    }
  }
  
  if (strokeAlign === 'outside') {
    borderStyle.boxSizing = 'content-box';
  }

  return borderStyle;
};

export const parseEffectStyle = (effectId: string, styles: DSLStyles): React.CSSProperties => {
  const effect = styles[effectId];
  return (effect?.value) ? {} : {};
};