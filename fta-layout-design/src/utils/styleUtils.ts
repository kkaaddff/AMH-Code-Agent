import { DSLStyles } from '../types/dsl';

/**
 * 解析 DSL 中的颜色标识，转换为实际颜色值。
 * @param color 颜色字段或 paint 标识
 * @param styles DSL 样式字典
 * @returns 可直接使用的颜色字符串
 */
export const parseColor = (color: string | undefined, styles: DSLStyles): string => {
  if (!color || !color.startsWith('paint_')) return color || 'rgba(0, 0, 0, 0)';

  const style = styles[color];
  
  // 检查样式是否存在且 value 是数组
  if (style && Array.isArray(style.value) && style.value.length > 0) {
    const firstValue = style.value[0];
    
    // 只有当 value[0] 是字符串时才作为颜色值返回
    if (typeof firstValue === 'string') {
      return firstValue;
    }
    
    // 如果是对象（比如图片），说明这不是颜色，返回默认透明色
    if (typeof firstValue === 'object' && firstValue !== null) {
      return 'rgba(0, 0, 0, 0)';
    }
  }
  
  // 如果样式不存在或格式不正确，返回原始颜色值
  return color;
};

/**
 * 将 DSL 布局描述转换为 React 可用的布局样式。
 * @param layoutStyle DSL 布局对象
 * @returns React 风格的样式对象
 */
export const parseLayoutStyle = (layoutStyle: any): React.CSSProperties => {
  if (!layoutStyle) return {};

  const style: React.CSSProperties = {};

  if (layoutStyle.width !== undefined) style.width = layoutStyle.width;
  if (layoutStyle.height !== undefined) style.height = layoutStyle.height;

  if (layoutStyle.relativeX !== undefined || layoutStyle.relativeY !== undefined) {
    style.position = 'absolute';
    if (layoutStyle.relativeX !== undefined) style.left = layoutStyle.relativeX;
    if (layoutStyle.relativeY !== undefined) style.top = layoutStyle.relativeY;
  }

  if (layoutStyle.rotate !== undefined) {
    style.transform = `rotate(${layoutStyle.rotate}deg)`;
  }

  return style;
};

/**
 * 解析 DSL 中的 flex 布局描述。
 * @param flexContainerInfo DSL flex 容器信息
 * @returns React 风格的 flex 样式对象
 */
export const parseFlexContainerStyle = (flexContainerInfo: any): React.CSSProperties => {
  if (!flexContainerInfo) return { display: 'flex' };

  const style: React.CSSProperties = { display: 'flex' };

  if (flexContainerInfo.flexDirection) style.flexDirection = flexContainerInfo.flexDirection;
  if (flexContainerInfo.alignItems) style.alignItems = flexContainerInfo.alignItems;
  if (flexContainerInfo.gap) style.gap = flexContainerInfo.gap;

  if (flexContainerInfo.padding) {
    const padding = flexContainerInfo.padding;
    if (typeof padding === 'string' && padding.includes(' ')) {
      const [top, right] = padding.split(' ');
      style.paddingTop = top.replace('px', '');
      style.paddingRight = right.replace('px', '');
      style.paddingBottom = top.replace('px', '');
      style.paddingLeft = right.replace('px', '');
    } else if (typeof padding === 'string') {
      style.padding = padding.replace('px', '');
    } else if (typeof padding === 'number') {
      style.padding = padding;
    }
  }

  return style;
};

/**
 * 解析边角圆角字符串，转换为 CSS 样式。
 * @param borderRadius DSL 中的圆角描述
 * @returns 包含圆角的样式对象
 */
export const parseBorderRadius = (borderRadius: string | undefined): React.CSSProperties => {
  if (!borderRadius) return {};
  return { borderRadius: `${borderRadius.replace('px', '')}px` };
};

/**
 * 根据字体标识解析文本样式。
 * @param fontId 字体样式标识
 * @param styles DSL 样式字典
 * @returns React 风格的文本样式对象
 */
export const parseTextStyle = (fontId: string, styles: DSLStyles): React.CSSProperties => {
  const fontInfo = styles[fontId]?.value || {};
  const textStyle: React.CSSProperties = {};

  if (fontInfo.family) textStyle.fontFamily = fontInfo.family;
  if (fontInfo.size) textStyle.fontSize = `${fontInfo.size}px`;
  if (fontInfo.lineHeight) textStyle.lineHeight = `${fontInfo.lineHeight}px`;
  if (fontInfo.letterSpacing && fontInfo.letterSpacing !== 'auto') {
    textStyle.letterSpacing = fontInfo.letterSpacing;
  }
  if (fontInfo.decoration) textStyle.textDecoration = fontInfo.decoration;

  if (fontInfo.style) {
    if (fontInfo.style.includes('黑') || fontInfo.style.includes('Bold')) {
      textStyle.fontWeight = 'bold';
    } else if (fontInfo.style.includes('中')) {
      textStyle.fontWeight = '500';
    }
  }

  return textStyle;
};
