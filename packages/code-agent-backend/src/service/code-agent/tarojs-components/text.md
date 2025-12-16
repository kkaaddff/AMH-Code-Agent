# Text 文本组件

## 介绍

Text 是 Taro 中的文本显示组件，相当于 React Native 中的`<Text>`和 Web 中的`<span>`。Text 组件支持嵌套使用，是展示文本内容的核心组件。

## 基础用法

```tsx
import { Text } from '@tarojs/components';
import React from 'react';

export default function TextDemo() {
  return <Text>Hello Taro!</Text>;
}
```

## 核心属性

### 文本内容属性

| 属性          | 类型                                     | 默认值   | 说明                                     |
| ------------- | ---------------------------------------- | -------- | ---------------------------------------- |
| children      | `ReactNode`                              | -        | 文本内容                                 |
| selectable    | `boolean`                                | `false`  | 文本是否可选择                           |
| space         | `string`                                 | -        | 文本空格处理方式：'nbsp', 'ensp', 'emsp' |
| decode        | `boolean`                                | `false`  | 是否解码 HTML 实体                       |
| numberOfLines | `number`                                 | -        | 显示的最大行数（超出显示省略号）         |
| ellipsizeMode | `'head' \| 'middle' \| 'tail' \| 'clip'` | `'tail'` | 省略号位置                               |

### 样式属性

| 属性      | 类型            | 默认值 | 说明            |
| --------- | --------------- | ------ | --------------- |
| className | `string`        | -      | 自定义 CSS 类名 |
| style     | `CSSProperties` | -      | 内联样式        |
| id        | `string`        | -      | 组件唯一标识    |
| testID    | `string`        | -      | 测试 ID         |

### 点击和触摸属性

| 属性         | 类型                  | 默认值 | 说明         |
| ------------ | --------------------- | ------ | ------------ |
| onClick      | `CommonEventFunction` | -      | 点击事件     |
| onLongPress  | `CommonEventFunction` | -      | 长按事件     |
| onTouchStart | `CommonEventFunction` | -      | 触摸开始事件 |
| onTouchMove  | `CommonEventFunction` | -      | 触摸移动事件 |
| onTouchEnd   | `CommonEventFunction` | -      | 触摸结束事件 |

## Props 类型详细说明

### 文本内容属性

| 属性名        | 类型                                     | 默认值   | 必填 | 说明                           |
| ------------- | ---------------------------------------- | -------- | ---- | ------------------------------ |
| children      | `React.ReactNode`                        | -        | 否   | 文本内容，支持嵌套             |
| selectable    | `boolean`                                | `false`  | 否   | 文本是否可选择，长按可选择文本 |
| space         | `'nbsp' \| 'ensp' \| 'emsp'`             | -        | 否   | 文本空格处理方式               |
| decode        | `boolean`                                | `false`  | 否   | 是否解码 HTML 实体字符         |
| numberOfLines | `number`                                 | -        | 否   | 显示的最大行数，超出显示省略号 |
| ellipsizeMode | `'head' \| 'middle' \| 'tail' \| 'clip'` | `'tail'` | 否   | 省略号位置                     |

### 样式属性

| 属性名    | 类型        | 默认值 | 必填 | 说明            |
| --------- | ----------- | ------ | ---- | --------------- |
| className | `string`    | -      | 否   | 自定义 CSS 类名 |
| style     | `TextStyle` | -      | 否   | 内联样式对象    |
| id        | `string`    | -      | 否   | 组件唯一标识符  |
| testID    | `string`    | -      | 否   | 测试用 ID       |

### 点击和触摸事件

| 属性名        | 类型                           | 默认值 | 必填 | 说明             |
| ------------- | ------------------------------ | ------ | ---- | ---------------- |
| onClick       | `(event: ITouchEvent) => void` | -      | 否   | 点击事件处理函数 |
| onLongPress   | `(event: ITouchEvent) => void` | -      | 否   | 长按事件处理函数 |
| onTouchStart  | `(event: ITouchEvent) => void` | -      | 否   | 触摸开始事件     |
| onTouchMove   | `(event: ITouchEvent) => void` | -      | 否   | 触摸移动事件     |
| onTouchEnd    | `(event: ITouchEvent) => void` | -      | 否   | 触摸结束事件     |
| onTouchCancel | `(event: ITouchEvent) => void` | -      | 否   | 触摸取消事件     |

### 悬停效果（小程序端）

| 属性名               | 类型            | 默认值   | 必填 | 说明                               |
| -------------------- | --------------- | -------- | ---- | ---------------------------------- |
| hoverClass           | `string`        | `'none'` | 否   | 指定按下去的样式类                 |
| hoverStyle           | `CSSProperties` | -        | 否   | 按下去的样式（RN 端特有）          |
| hoverStartTime       | `number`        | `50`     | 否   | 按住后多久出现点击态，单位毫秒     |
| hoverStayTime        | `number`        | `400`    | 否   | 手指松开后点击态保留时间，单位毫秒 |
| hoverStopPropagation | `boolean`       | `false`  | 否   | 是否阻止本节点的祖先节点出现点击态 |

### TextStyle 详细属性

| 属性名              | 类型                                                        | 默认值 | 说明                           |
| ------------------- | ----------------------------------------------------------- | ------ | ------------------------------ |
| **字体属性**        |                                                             |        |                                |
| fontFamily          | `string`                                                    | -      | 字体族，如 `'PingFang SC'`     |
| fontSize            | `number \| string`                                          | -      | 字体大小，如 `16` 或 `'16px'`  |
| fontStyle           | `'normal' \| 'italic' \| 'oblique'`                         | -      | 字体样式                       |
| fontWeight          | `string \| number`                                          | -      | 字体粗细，如 `'bold'` 或 `700` |
| lineHeight          | `number \| string`                                          | -      | 行高，如 `1.5` 或 `'24px'`     |
| **文本布局**        |                                                             |        |                                |
| textAlign           | `'auto' \| 'left' \| 'right' \| 'center' \| 'justify'`      | -      | 文本对齐方式                   |
| verticalAlign       | `'auto' \| 'top' \| 'bottom' \| 'middle'`                   | -      | 垂直对齐方式                   |
| **文本装饰**        |                                                             |        |                                |
| textDecoration      | `'none' \| 'underline' \| 'line-through'`                   | -      | 文本装饰                       |
| textDecorationColor | `string`                                                    | -      | 文本装饰颜色                   |
| textDecorationStyle | `'solid' \| 'double' \| 'dotted' \| 'dashed' \| 'wavy'`     | -      | 文本装饰样式                   |
| **文本变换**        |                                                             |        |                                |
| textTransform       | `'none' \| 'capitalize' \| 'uppercase' \| 'lowercase'`      | -      | 文本大小写转换                 |
| **颜色和阴影**      |                                                             |        |                                |
| color               | `string`                                                    | -      | 文本颜色                       |
| textShadowColor     | `string`                                                    | -      | 文本阴影颜色                   |
| textShadowOffset    | `{width: number; height: number}`                           | -      | 文本阴影偏移                   |
| textShadowRadius    | `number`                                                    | -      | 文本阴影半径                   |
| **间距**            |                                                             |        |                                |
| letterSpacing       | `number \| string`                                          | -      | 字母间距                       |
| wordSpacing         | `number \| string`                                          | -      | 单词间距                       |
| **空白处理**        |                                                             |        |                                |
| whiteSpace          | `'normal' \| 'nowrap' \| 'pre' \| 'pre-line' \| 'pre-wrap'` | -      | 空白字符处理方式               |

### 事件对象类型

```typescript
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

interface ITouch {
  identifier: number;
  pageX: number;
  pageY: number;
  clientX: number;
  clientY: number;
}
```

## 高级用法

### 1. 文本样式控制

```tsx
export default function StyledText() {
  return (
    <View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: 'bold',
          color: '#333',
          lineHeight: 1.5,
        }}>
        粗体文本
      </Text>

      <Text
        style={{
          fontSize: 14,
          color: '#666',
          fontStyle: 'italic',
        }}>
        斜体文本
      </Text>

      <Text
        style={{
          fontSize: 20,
          color: '#1890ff',
          textDecoration: 'underline',
        }}>
        带下划线的文本
      </Text>
    </View>
  );
}
```

### 2. 文本嵌套

```tsx
export default function NestedText() {
  return (
    <Text>
      这是一个<Text style={{ color: '#ff4d4f' }}>红色</Text>的<Text style={{ fontWeight: 'bold' }}>粗体</Text>文本。
    </Text>
  );
}
```

### 3. 条件文本显示

```tsx
export default function ConditionalText({ isVisible, text }) {
  return <View>{isVisible && <Text style={{ color: '#52c41a' }}>{text}</Text>}</View>;
}
```

### 4. 多行文本

```tsx
export default function MultiLineText() {
  const longText = `这是一段很长的文本内容，
  需要在多个行中显示。Taro的Text组件
  会自动处理换行显示。`;

  return (
    <View style={{ maxWidth: 300, padding: 16 }}>
      <Text numberOfLines={3} ellipsizeMode='tail'>
        {longText}
      </Text>
    </View>
  );
}
```

### 5. 动态文本

```tsx
import { useState } from 'react';

export default function DynamicText() {
  const [text, setText] = useState('初始文本');

  return (
    <View style={{ padding: 16 }}>
      <Text style={{ marginBottom: 16 }}>{text}</Text>
      <Text style={{ color: '#1890ff', fontSize: 14 }} onClick={() => setText('文本已更新！')}>
        点击更新文本
      </Text>
    </View>
  );
}
```

## 文本格式化

### 1. 数字和单位

```tsx
export default function NumberText() {
  return (
    <View>
      <Text>价格：¥99.99</Text>
      <Text>折扣：30%</Text>
      <Text>尺寸：100px</Text>
      <Text>重量：2.5kg</Text>
    </View>
  );
}
```

### 2. 国际化文本

```tsx
export default function I18nText() {
  const messages = {
    zh: '你好，世界！',
    en: 'Hello, World!',
    jp: 'こんにちは、世界！',
  };

  return (
    <View>
      {Object.entries(messages).map(([lang, text]) => (
        <Text key={lang} style={{ display: 'block', marginBottom: 8 }}>
          {lang}: {text}
        </Text>
      ))}
    </View>
  );
}
```

### 3. 富文本样式

```tsx
export default function RichText() {
  return (
    <View>
      <Text>
        这是一个<Text style={{ color: '#ff4d4f' }}>红色</Text>、<Text style={{ color: '#1890ff' }}>蓝色</Text>、
        <Text style={{ color: '#52c41a' }}>绿色</Text>的文本。
      </Text>
    </View>
  );
}
```

## 常见问题

### 1. 小程序平台 Text 组件嵌套问题

**问题**：小程序平台 Text 组件嵌套时，部分机型上内部 Text 的点击事件会失效。

**解决方案**：

```tsx
// ❌ 错误做法 - 嵌套过深
<Text onClick={handleClick}>
  <Text>外层</Text>
  <Text onClick={innerClick}>内层</Text> {/* 点击可能失效 */}
</Text>

// ✅ 正确做法 - 使用View代替外层Text
<View onClick={handleClick}>
  <Text>外层</Text>
  <Text onClick={innerClick}>内层</Text>
</View>
```

### 2. 文本选择和复制

```tsx
export default function SelectableText() {
  return (
    <View>
      <Text selectable>这段文本可以选择和复制，支持长按选择和双击全选。</Text>
    </View>
  );
}
```

### 3. 文本换行处理

```tsx
export default function LineBreakText() {
  return (
    <View>
      <Text>第一行文本</Text>
      <Text>第二行文本</Text>
      <Text>第三行文本</Text>

      {/* 在同一个Text中使用换行符 */}
      <Text>
        {`第一行
        第二行
        第三行`}
      </Text>
    </View>
  );
}
```

## 样式最佳实践

### 1. 统一的文本样式

```scss
// text-styles.scss
.text {
  &--primary {
    font-size: 16px;
    color: #333;
    line-height: 1.5;
  }

  &--secondary {
    font-size: 14px;
    color: #666;
    line-height: 1.4;
  }

  &--caption {
    font-size: 12px;
    color: #999;
    line-height: 1.3;
  }

  &--title {
    font-size: 20px;
    font-weight: bold;
    color: #000;
    line-height: 1.4;
  }
}
```

### 2. 响应式文本

```tsx
export default function ResponsiveText() {
  return (
    <View>
      <Text
        style={{
          fontSize: 16,
          // 在不同屏幕尺寸下调整字体大小
          fontSize: Taro.pxTransform(16), // 自动转换为rpx
        }}>
        响应式文本大小
      </Text>
    </View>
  );
}
```

## 性能优化

### 1. 避免频繁重渲染

```tsx
import React, { memo } from 'react';

const OptimizedText = memo(({ children, style }) => {
  return <Text style={style}>{children}</Text>;
});

export default function TextPerformanceDemo() {
  const [count, setCount] = useState(0);

  return (
    <View>
      <Text>计数: {count}</Text>
      <OptimizedText style={{ color: '#666' }}>这个组件不会因为父组件重渲染而重新渲染</OptimizedText>
    </View>
  );
}
```

### 2. 长文本优化

```tsx
export default function LongTextOptimization() {
  const longText = '这是一段很长的文本...'.repeat(100);

  return (
    <View>
      <Text numberOfLines={3} ellipsizeMode='tail'>
        {longText}
      </Text>
    </View>
  );
}
```

## 平台兼容性注意事项

### 1. 字体支持

```tsx
export default function FontCompatibility() {
  return (
    <View>
      <Text style={{ fontFamily: 'Arial, sans-serif' }}>系统字体</Text>

      <Text style={{ fontFamily: 'PingFang SC, sans-serif' }}>苹果系统字体</Text>

      <Text style={{ fontFamily: 'Microsoft YaHei, sans-serif' }}>Windows系统字体</Text>
    </View>
  );
}
```

### 2. 颜色值兼容

```tsx
export default function ColorCompatibility() {
  return (
    <View>
      {/* ✅ 推荐使用十六进制颜色 */}
      <Text style={{ color: '#1890ff' }}>蓝色文本</Text>

      {/* ✅ 支持RGB颜色 */}
      <Text style={{ color: 'rgb(24, 144, 255)' }}>RGB文本</Text>

      {/* ✅ 支持RGBA颜色 */}
      <Text style={{ color: 'rgba(24, 144, 255, 0.5)' }}>半透明文本</Text>

      {/* ⚠️ 小程序端可能不支持颜色名称 */}
      <Text style={{ color: 'blue' }}>可能不生效</Text>
    </View>
  );
}
```

## 相关组件

- [`View`](./View.md) - 视图容器组件
- [`Button`](https://taro-docs.jd.com/docs/components/button) - 按钮组件
- [`Input`](https://taro-docs.jd.com/docs/components/input) - 输入框组件
- [`Label`](https://taro-docs.jd.com/docs/components/label) - 标签组件

## 参考资料

- [Taro 官方文档](https://taro-docs.jd.com/)
- [React Native Text 文档](https://reactnative.dev/docs/text)
- [CSS 字体属性](https://developer.mozilla.org/zh-CN/docs/Web/CSS/font-family)
