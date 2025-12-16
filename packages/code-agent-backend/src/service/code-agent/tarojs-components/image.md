# Image 图片组件

## 介绍

Image 是 Taro 中的图片展示组件，相当于 React Native 中的`<Image>`和 Web 中的`<img>`。Image 组件支持多种图片格式，提供了丰富的图片加载和显示功能。

## 基础用法

```tsx
import { Image } from '@tarojs/components';
import React from 'react';

export default function ImageDemo() {
  return <Image src='/images/logo.png' style={{ width: 100, height: 100 }} />;
}
```

## 核心属性

### 图片源属性

| 属性     | 类型        | 默认值          | 说明                                 |
| -------- | ----------- | --------------- | ------------------------------------ |
| src      | `string`    | -               | 图片资源地址，支持网络图片和本地图片 |
| mode     | `ImageMode` | `'scaleToFill'` | 图片裁剪、缩放模式                   |
| lazyLoad | `boolean`   | `false`         | 是否懒加载图片                       |

### 尺寸和布局属性

| 属性      | 类型               | 默认值 | 说明            |
| --------- | ------------------ | ------ | --------------- |
| width     | `number \| string` | -      | 图片宽度        |
| height    | `number \| string` | -      | 图片高度        |
| style     | `CSSProperties`    | -      | 内联样式        |
| className | `string`           | -      | 自定义 CSS 类名 |
| id        | `string`           | -      | 组件唯一标识    |
| testID    | `string`           | -      | 测试 ID         |

### 图片模式（mode）

| 值             | 说明                                               |
| -------------- | -------------------------------------------------- |
| `scaleToFill`  | 不保持纵横比缩放图片，使图片完全填充容器           |
| `aspectFit`    | 保持纵横比缩放图片，使图片的长边能完全显示出来     |
| `aspectFill`   | 保持纵横比缩放图片，只保证图片的短边能完全显示出来 |
| `widthFix`     | 宽度不变，高度自动变化，保持原图宽高比不变         |
| `heightFix`    | 高度不变，宽度自动变化，保持原图宽高比不变         |
| `top`          | 不缩放图片，只显示图片的顶部区域                   |
| `bottom`       | 不缩放图片，只显示图片的底部区域                   |
| `center`       | 不缩放图片，只显示图片的中间区域                   |
| `left`         | 不缩放图片，只显示图片的左边区域                   |
| `right`        | 不缩放图片，只显示图片的右边区域                   |
| `top left`     | 不缩放图片，只显示图片的左上边区域                 |
| `top right`    | 不缩放图片，只显示图片的右上边区域                 |
| `bottom left`  | 不缩放图片，只显示图片的左下边区域                 |
| `bottom right` | 不缩放图片，只显示图片的右下边区域                 |

### 事件属性

| 属性         | 类型                                           | 默认值 | 说明               |
| ------------ | ---------------------------------------------- | ------ | ------------------ |
| onLoad       | `CommonEventFunction<ImageOnLoadEventDetail>`  | -      | 图片加载成功时触发 |
| onError      | `CommonEventFunction<ImageOnErrorEventDetail>` | -      | 图片加载失败时触发 |
| onClick      | `CommonEventFunction`                          | -      | 点击图片时触发     |
| onTouchStart | `CommonEventFunction`                          | -      | 触摸开始事件       |
| onTouchEnd   | `CommonEventFunction`                          | -      | 触摸结束事件       |

## Props 类型详细说明

### 图片源属性

| 属性名   | 类型      | 默认值  | 必填 | 说明                                 |
| -------- | --------- | ------- | ---- | ------------------------------------ |
| src      | `string`  | -       | 是   | 图片资源地址，支持网络图片和本地图片 |
| lazyLoad | `boolean` | `false` | 否   | 是否懒加载图片，适用于长列表优化     |

### 显示模式属性

| 属性名 | 类型        | 默认值          | 必填 | 说明               |
| ------ | ----------- | --------------- | ---- | ------------------ |
| mode   | `ImageMode` | `'scaleToFill'` | 否   | 图片裁剪、缩放模式 |

### ImageMode 枚举值

| 模式值         | 说明                               | 适用场景                     |
| -------------- | ---------------------------------- | ---------------------------- |
| `scaleToFill`  | 不保持纵横比缩放图片，完全填充容器 | 需要图片填满容器的场景       |
| `aspectFit`    | 保持纵横比缩放，长边完全显示       | 需要完整显示图片的场景       |
| `aspectFill`   | 保持纵横比缩放，短边完全显示       | 头像、背景图等需要填充的场景 |
| `widthFix`     | 宽度不变，高度自动变化             | 响应式宽度场景               |
| `heightFix`    | 高度不变，宽度自动变化             | 响应式高度场景               |
| `top`          | 不缩放，显示顶部区域               | 裁剪显示顶部场景             |
| `bottom`       | 不缩放，显示底部区域               | 裁剪显示底部场景             |
| `center`       | 不缩放，显示中间区域               | 裁剪显示中心场景             |
| `left`         | 不缩放，显示左边区域               | 裁剪显示左侧场景             |
| `right`        | 不缩放，显示右边区域               | 裁剪显示右侧场景             |
| `top left`     | 不缩放，显示左上角                 | 裁剪显示左上角场景           |
| `top right`    | 不缩放，显示右上角                 | 裁剪显示右上角场景           |
| `bottom left`  | 不缩放，显示左下角                 | 裁剪显示左下角场景           |
| `bottom right` | 不缩放，显示右下角                 | 裁剪显示右下角场景           |

### 尺寸和布局属性

| 属性名    | 类型               | 默认值 | 必填 | 说明                         |
| --------- | ------------------ | ------ | ---- | ---------------------------- |
| width     | `number \| string` | -      | 否   | 图片宽度，支持像素值或百分比 |
| height    | `number \| string` | -      | 否   | 图片高度，支持像素值或百分比 |
| className | `string`           | -      | 否   | 自定义 CSS 类名              |
| style     | `ImageStyle`       | -      | 否   | 内联样式对象                 |
| id        | `string`           | -      | 否   | 组件唯一标识符               |
| testID    | `string`           | -      | 否   | 测试用 ID                    |

### 图片加载事件

| 属性名  | 类型                               | 默认值 | 必填 | 说明               |
| ------- | ---------------------------------- | ------ | ---- | ------------------ |
| onLoad  | `(event: ImageLoadEvent) => void`  | -      | 否   | 图片加载成功时触发 |
| onError | `(event: ImageErrorEvent) => void` | -      | 否   | 图片加载失败时触发 |

### 交互事件

| 属性名        | 类型                           | 默认值 | 必填 | 说明           |
| ------------- | ------------------------------ | ------ | ---- | -------------- |
| onClick       | `(event: ITouchEvent) => void` | -      | 否   | 点击图片时触发 |
| onLongPress   | `(event: ITouchEvent) => void` | -      | 否   | 长按图片时触发 |
| onTouchStart  | `(event: ITouchEvent) => void` | -      | 否   | 触摸开始事件   |
| onTouchMove   | `(event: ITouchEvent) => void` | -      | 否   | 触摸移动事件   |
| onTouchEnd    | `(event: ITouchEvent) => void` | -      | 否   | 触摸结束事件   |
| onTouchCancel | `(event: ITouchEvent) => void` | -      | 否   | 触摸取消事件   |

### 悬停效果（小程序端）

| 属性名               | 类型            | 默认值   | 必填 | 说明                               |
| -------------------- | --------------- | -------- | ---- | ---------------------------------- |
| hoverClass           | `string`        | `'none'` | 否   | 指定按下去的样式类                 |
| hoverStyle           | `CSSProperties` | -        | 否   | 按下去的样式（RN 端特有）          |
| hoverStartTime       | `number`        | `50`     | 否   | 按住后多久出现点击态，单位毫秒     |
| hoverStayTime        | `number`        | `400`    | 否   | 手指松开后点击态保留时间，单位毫秒 |
| hoverStopPropagation | `boolean`       | `false`  | 否   | 是否阻止本节点的祖先节点出现点击态 |

### ImageStyle 详细属性

| 属性名                  | 类型                              | 默认值 | 说明             |
| ----------------------- | --------------------------------- | ------ | ---------------- |
| **尺寸控制**            |                                   |        |                  |
| width                   | `number \| string`                | -      | 宽度             |
| height                  | `number \| string`                | -      | 高度             |
| minWidth                | `number \| string`                | -      | 最小宽度         |
| minHeight               | `number \| string`                | -      | 最小高度         |
| maxWidth                | `number \| string`                | -      | 最大宽度         |
| maxHeight               | `number \| string`                | -      | 最大高度         |
| **布局**                |                                   |        |                  |
| display                 | `'flex' \| 'none'`                | -      | 显示类型         |
| position                | `string`                          | -      | 定位方式         |
| top                     | `number \| string`                | -      | 顶部距离         |
| right                   | `number \| string`                | -      | 右侧距离         |
| bottom                  | `number \| string`                | -      | 底部距离         |
| left                    | `number \| string`                | -      | 左侧距离         |
| zIndex                  | `number`                          | -      | 层级             |
| **边框和圆角**          |                                   |        |                  |
| borderWidth             | `number`                          | -      | 边框宽度         |
| borderColor             | `string`                          | -      | 边框颜色         |
| borderRadius            | `number`                          | -      | 圆角半径         |
| borderTopLeftRadius     | `number`                          | -      | 左上角圆角       |
| borderTopRightRadius    | `number`                          | -      | 右上角圆角       |
| borderBottomLeftRadius  | `number`                          | -      | 左下角圆角       |
| borderBottomRightRadius | `number`                          | -      | 右下角圆角       |
| **背景和效果**          |                                   |        |                  |
| backgroundColor         | `string`                          | -      | 背景颜色         |
| opacity                 | `number`                          | -      | 透明度，范围 0-1 |
| overflow                | `string`                          | -      | 溢出处理         |
| **阴影**                |                                   |        |                  |
| shadowColor             | `string`                          | -      | 阴影颜色         |
| shadowOffset            | `{width: number; height: number}` | -      | 阴影偏移         |
| shadowOpacity           | `number`                          | -      | 阴影透明度       |
| shadowRadius            | `number`                          | -      | 阴影半径         |

### 事件对象类型

```typescript
interface ImageLoadEvent {
  type: string;
  timeStamp: number;
  detail: {
    width: number; // 图片显示宽度
    height: number; // 图片显示高度
  };
}

interface ImageErrorEvent {
  type: string;
  timeStamp: number;
  detail: {
    errMsg: string; // 错误信息
    type?: 'error' | 'loading' | 'abort'; // 错误类型
  };
}

interface ITouchEvent {
  type: string;
  timeStamp: number;
  target: ITouchTarget;
  currentTarget: ITouchTarget;
  detail: ITouchDetail;
  touches?: ITouch[];
  changedTouches?: ITouch[];
}

interface ITouchTarget {
  id: string;
  dataset: Record<string, any>;
}

interface ITouchDetail {
  x: number;
  y: number;
}
```

## 高级用法

### 1. 不同图片模式示例

```tsx
export default function ImageModeDemo() {
  const imageUrl = 'https://picsum.photos/200/300';

  return (
    <View style={{ padding: 20 }}>
      <Text>scaleToFill（拉伸填充）</Text>
      <Image
        src={imageUrl}
        mode='scaleToFill'
        style={{ width: 150, height: 100, backgroundColor: '#f0f0f0', marginBottom: 10 }}
      />

      <Text>aspectFit（保持比例）</Text>
      <Image
        src={imageUrl}
        mode='aspectFit'
        style={{ width: 150, height: 100, backgroundColor: '#f0f0f0', marginBottom: 10 }}
      />

      <Text>center（居中显示）</Text>
      <Image src={imageUrl} mode='center' style={{ width: 150, height: 100, backgroundColor: '#f0f0f0' }} />
    </View>
  );
}
```

### 2. 图片加载状态处理

```tsx
import { useState } from 'react';

export default function ImageLoadingDemo() {
  const [imageStatus, setImageStatus] = useState('loading');
  const [error, setError] = useState('');

  return (
    <View style={{ padding: 20 }}>
      <Text>图片加载状态: {imageStatus}</Text>

      {imageStatus === 'loading' && <Text>正在加载...</Text>}

      {imageStatus === 'error' && <Text>加载失败: {error}</Text>}

      <Image
        src='https://example.com/image.jpg'
        style={{ width: 200, height: 200, backgroundColor: '#f0f0f0' }}
        onLoad={() => setImageStatus('loaded')}
        onError={(e) => {
          setImageStatus('error');
          setError(e.detail.errMsg || '未知错误');
        }}
      />
    </View>
  );
}
```

### 3. 懒加载优化

```tsx
export default function LazyLoadImage() {
  return (
    <View style={{ padding: 20 }}>
      <Text>懒加载图片（滚动查看更多）</Text>

      {[...Array(10)].map((_, index) => (
        <Image
          key={index}
          src={`https://picsum.photos/${300 + index * 50}/${400 + index * 50}`}
          mode='aspectFit'
          lazyLoad
          style={{
            width: 200,
            height: 150,
            backgroundColor: '#f0f0f0',
            marginBottom: 10,
          }}
        />
      ))}
    </View>
  );
}
```

### 4. 响应式图片

```tsx
export default function ResponsiveImage() {
  const windowWidth = Taro.getSystemInfoSync().windowWidth;
  const imageSize = Math.min(windowWidth - 40, 400);

  return (
    <View style={{ padding: 20 }}>
      <Image
        src='https://picsum.photos/800/600'
        style={{
          width: imageSize,
          height: imageSize * 0.75, // 4:3 比例
          backgroundColor: '#f0f0f0',
        }}
        mode='aspectFit'
      />
    </View>
  );
}
```

### 5. 图片裁剪工具

```tsx
import { useState } from 'react';

export default function ImageCropper() {
  const [mode, setMode] = useState('aspectFit');

  const modes = [
    { value: 'scaleToFill', label: '拉伸填充' },
    { value: 'aspectFit', label: '保持比例' },
    { value: 'aspectFill', label: '填充显示' },
    { value: 'center', label: '居中显示' },
  ];

  return (
    <View style={{ padding: 20 }}>
      <View style={{ marginBottom: 20 }}>
        <Text>选择图片模式:</Text>
        {modes.map((m) => (
          <Text
            key={m.value}
            style={{
              color: mode === m.value ? '#1890ff' : '#666',
              marginRight: 15,
              padding: '5 10',
              backgroundColor: mode === m.value ? '#e6f7ff' : '#f0f0f0',
              borderRadius: 4,
            }}
            onClick={() => setMode(m.value)}>
            {m.label}
          </Text>
        ))}
      </View>

      <Image
        src='https://picsum.photos/300/200'
        mode={mode}
        style={{
          width: 300,
          height: 200,
          backgroundColor: '#f0f0f0',
        }}
      />
    </View>
  );
}
```

### 6. 图片预览功能

```tsx
import { useState } from 'react';

export default function ImagePreview() {
  const [previewImage, setPreviewImage] = useState(false);
  const imageUrl = 'https://picsum.photos/400/300';

  return (
    <View style={{ padding: 20 }}>
      <Image
        src={imageUrl}
        style={{
          width: 200,
          height: 150,
          backgroundColor: '#f0f0f0',
        }}
        onClick={() => setPreviewImage(true)}
      />

      {previewImage && (
        <View
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={() => setPreviewImage(false)}>
          <Image
            src={imageUrl}
            mode='aspectFit'
            style={{
              width: '90%',
              height: '90%',
              backgroundColor: '#fff',
              borderRadius: 8,
            }}
          />
        </View>
      )}
    </View>
  );
}
```

## 本地图片处理

### 1. 导入本地图片

```tsx
// 方式1：直接导入
import logoImage from './images/logo.png';

export default function LocalImage() {
  return <Image src={logoImage} style={{ width: 100, height: 100 }} />;
}

// 方式2：使用require
export default function RequireImage() {
  return <Image src={require('./images/logo.png')} style={{ width: 100, height: 100 }} />;
}
```

### 2. 条件渲染图片

```tsx
export default function ConditionalImage({ isDark }) {
  return (
    <Image src={isDark ? '/images/dark-logo.png' : '/images/light-logo.png'} style={{ width: 100, height: 100 }} />
  );
}
```

## 性能优化

### 1. 图片懒加载

```tsx
export default function PerformanceImage() {
  return (
    <ScrollView scrollY style={{ height: 500 }}>
      {[...Array(100)].map((_, index) => (
        <View key={index} style={{ marginBottom: 20 }}>
          <Text>图片 {index + 1}</Text>
          <Image
            src={`https://picsum.photos/${200 + index * 10}/${300 + index * 10}`}
            mode='aspectFit'
            lazyLoad
            style={{
              width: 200,
              height: 150,
              backgroundColor: '#f0f0f0',
            }}
          />
        </View>
      ))}
    </ScrollView>
  );
}
```

### 2. 图片缓存策略

```tsx
export default function CachedImage({ src, ...props }) {
  const [cachedSrc, setCachedSrc] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  React.useEffect(() => {
    // 检查缓存
    const checkCache = async () => {
      try {
        const cached = await Taro.getStorageInfo({ key: `image_${src}` });
        if (cached.data) {
          setCachedSrc(cached.data);
          setIsLoading(false);
        } else {
          // 没有缓存，使用原图
          setCachedSrc(src);
          // 异步缓存图片
          setTimeout(() => {
            Taro.setStorage({
              key: `image_${src}`,
              data: src,
            });
          }, 1000);
        }
      } catch (error) {
        setCachedSrc(src);
      } finally {
        setIsLoading(false);
      }
    };

    if (src) {
      checkCache();
    }
  }, [src]);

  if (isLoading) {
    return (
      <View
        style={{
          width: props.style?.width || 100,
          height: props.style?.height || 100,
          backgroundColor: '#f0f0f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return <Image src={cachedSrc} {...props} />;
}
```

## 错误处理

### 1. 图片加载失败处理

```tsx
import { useState } from 'react';

export default function ErrorHandlingImage({ src, fallback, ...props }) {
  const [hasError, setHasError] = useState(false);

  return (
    <View>
      {!hasError ? (
        <Image src={src} onError={() => setHasError(true)} {...props} />
      ) : (
        fallback || (
          <View
            style={{
              width: props.style?.width || 100,
              height: props.style?.height || 100,
              backgroundColor: '#f0f0f0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: '1px dashed #ccc',
            }}
            {...props}>
            <Text>图片加载失败</Text>
          </View>
        )
      )}
    </View>
  );
}
```

### 2. 网络错误重试

```tsx
import { useState } from 'react';

export default function RetryImage({ src, maxRetries = 3, ...props }) {
  const [retryCount, setRetryCount] = useState(0);
  const [currentSrc, setCurrentSrc] = useState(src);

  const handleError = () => {
    if (retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        setCurrentSrc(`${src}?retry=${retryCount + 1}`);
      }, 1000 * (retryCount + 1));
    }
  };

  return <Image src={currentSrc} onError={handleError} {...props} />;
}
```

## 平台兼容性

### 1. 不同平台的支持

```tsx
export default function PlatformImage() {
  return (
    <View style={{ padding: 20 }}>
      <Text>平台兼容性示例:</Text>

      <Image
        // H5: 支持所有图片格式和URL
        // RN: 支持PNG、JPEG、GIF、WebP等
        // 小程序: 支持PNG、JPG、GIF
        src='https://picsum.photos/200/200'
        mode='aspectFit'
        style={{ width: 150, height: 150 }}
      />

      <Text>{`平台: ${process.env.TARO_ENV || 'unknown'}`}</Text>
    </View>
  );
}
```

### 2. 小程序图片限制

```tsx
export default function MiniProgramImage() {
  return (
    <View style={{ padding: 20 }}>
      <Text>小程序图片限制:</Text>

      {/* ✅ 小程序支持的用法 */}
      <Image src='https://example.com/image.png' mode='aspectFit' style={{ width: 150, height: 150 }} />

      {/* ⚠️ 小程序可能不支持的用法 */}
      <Image
        // 需要配置download域名白名单
        src='https://untrusted-domain.com/image.png'
        mode='aspectFit'
        style={{ width: 150, height: 150 }}
      />
    </View>
  );
}
```

## 最佳实践

### 1. 图片尺寸优化

```tsx
export default function OptimizedImage() {
  return (
    <View style={{ padding: 20 }}>
      <Text>优化后的图片:</Text>

      {/* ✅ 推荐使用合适的尺寸 */}
      <Image
        src='https://picsum.photos/150/150'
        mode='aspectFit'
        style={{
          width: 150,
          height: 150,
        }}
      />

      <Text>避免不必要的图片缩放</Text>
    </View>
  );
}
```

### 2. 图片压缩

```tsx
export default function CompressedImage() {
  return (
    <View style={{ padding: 20 }}>
      <Text>使用压缩后的图片:</Text>

      {/*
        开发环境使用高清图
        生产环境使用压缩图
      */}
      <Image
        src={
          process.env.NODE_ENV === 'development'
            ? 'https://example.com/image@2x.png'
            : 'https://example.com/image@1x.png'
        }
        mode='aspectFit'
        style={{ width: 100, height: 100 }}
      />
    </View>
  );
}
```

## 常见问题

### 1. 图片不显示

**可能原因**：

- 图片 URL 错误或网络不可达
- 图片格式不支持
- 跨域问题
- 小程序域名白名单限制

**解决方案**：

```tsx
<Image
  src='https://example.com/image.jpg' // 确保URL正确
  onError={(e) => console.log('图片加载失败:', e)}
/>
```

### 2. 图片变形

**原因**：图片模式和容器尺寸不匹配

**解决方案**：

```tsx
<Image
  src='https://picsum.photos/300/200'
  mode='aspectFit' // 保持原始比例
  style={{
    width: 300,
    height: 200,
    backgroundColor: '#f0f0f0',
  }}
/>
```

## 相关组件

- [`View`](./View.md) - 视图容器组件
- [`RichText`](./RichText.md) - 富文本组件
- [`ScrollView`](./ScrollView.md) - 滚动视图组件
- [Taro 图片处理](https://taro-docs.jd.com/docs/component/picture) - 图片处理 API

## 参考资料

- [Taro 官方文档](https://taro-docs.jd.com/)
- [React Native Image 文档](https://reactnative.dev/docs/image)
- [Web 图片优化指南](https://web.dev/image-optimization/)
