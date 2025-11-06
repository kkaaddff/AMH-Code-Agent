import { DSLStyles } from '../types/dsl';

/**
 * 根据样式表解析图片资源的真实 URL。
 * @param imageId 样式表中的图片标识
 * @param styles DSL 样式字典
 * @returns 图片地址，未找到时返回空字符串
 */
export const parseImageUrl = (imageId: string, styles: DSLStyles): string => {
  const style = styles[imageId];
  if (style && Array.isArray(style.value) && style.value.length > 0) {
    const imageInfo = style.value[0];
    // 检查是否是对象且不是 null，且包含 url 属性
    if (typeof imageInfo === 'object' && imageInfo !== null && 'url' in imageInfo) {
      return imageInfo.url;
    }
  }
  return '';
};
