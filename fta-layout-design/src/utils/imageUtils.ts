import { DSLStyles } from '../types/dsl';

// 解析图像 URL
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