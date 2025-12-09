import type { DSLStyles } from '../types/dsl';
import type React from 'react';
import { parseColor } from './styleUtils.js';

/**
 * 将 DSL 描述的边框属性转为 React 可用的 CSS 样式。
 * @param strokeColor 边框颜色标识
 * @param strokeType 边框样式类型
 * @param strokeAlign 边框对齐方式
 * @param strokeWidth 边框宽度描述
 * @param styles DSL 样式字典
 * @returns React 风格的边框样式对象
 */
export const parseBorderStyle = (
  strokeColor: string,
  strokeType: string,
  strokeAlign: string,
  strokeWidth: string,
  styles: DSLStyles
): React.CSSProperties => {
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
      const widthValues =
        strokeWidth
          .split(' ')
          .map((w) => w.replace('px', ''))
          .join('px ') + 'px';
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

/**
 * 解析 DSL 中的特效信息，按需返回对应的样式对象。
 * @param effectId 特效标识
 * @param styles DSL 样式字典
 * @returns React 可用的特效样式对象
 */
export const parseEffectStyle = (effectId: string, styles: DSLStyles): React.CSSProperties => {
  const effect = styles[effectId];
  if (!effect || !effect.value || effect.value.length === 0) return {};

  // effect.value 是一个字符串数组，每个字符串是一个 shadow 定义
  // 例如: ["0px 4px 20px 0px rgba(0, 0, 0, 0.06),"]
  // 我们需要去掉末尾可能的逗号，并用逗号连接它们
  const boxShadow = effect.value.map((shadow: string) => shadow.trim().replace(/,$/, '')).join(', ');

  return { boxShadow };
};
