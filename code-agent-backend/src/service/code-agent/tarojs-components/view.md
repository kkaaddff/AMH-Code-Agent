# View 视图容器

## 介绍

View 是 Taro 中最基础的 UI 组件，相当于 React Native 中的`<View>`和 Web 中的`<div>`。View 组件可以嵌套使用，是所有布局和 UI 的基础构建块。

## 基础用法

```tsx
import { View, Text } from '@tarojs/components';
import React from 'react';

export default function ViewDemo() {
  return (
    <View className='container'>
      <View className='header'>
        <Text>Hello Taro</Text>
      </View>
      <View className='content'>
        <Text>这是内容区域</Text>
      </View>
    </View>
  );
}
```

## 核心属性

### 基础属性

| 属性      | 类型            | 默认值 | 说明            |
| --------- | --------------- | ------ | --------------- |
| className | `string`        | -      | 自定义 CSS 类名 |
| style     | `CSSProperties` | -      | 内联样式        |
| id        | `string`        | -      | 组件唯一标识    |
| testID    | `string`        | -      | 测试 ID         |

## Props 类型详细说明

### 基础属性

| 属性名    | 类型            | 默认值 | 必填 | 说明                      |
| --------- | --------------- | ------ | ---- | ------------------------- |
| className | `string`        | -      | 否   | 自定义 CSS 类名           |
| style     | `CSSProperties` | -      | 否   | 内联样式对象              |
| id        | `string`        | -      | 否   | 组件唯一标识符            |
| testID    | `string`        | -      | 否   | 测试用 ID，用于自动化测试 |

### 点击和触摸事件

| 属性名        | 类型                           | 默认值 | 必填 | 说明             |
| ------------- | ------------------------------ | ------ | ---- | ---------------- |
| onClick       | `(event: ITouchEvent) => void` | -      | 否   | 点击事件处理函数 |
| onTouchStart  | `(event: ITouchEvent) => void` | -      | 否   | 触摸开始事件     |
| onTouchMove   | `(event: ITouchEvent) => void` | -      | 否   | 触摸移动事件     |
| onTouchEnd    | `(event: ITouchEvent) => void` | -      | 否   | 触摸结束事件     |
| onTouchCancel | `(event: ITouchEvent) => void` | -      | 否   | 触摸取消事件     |
| onLongPress   | `(event: ITouchEvent) => void` | -      | 否   | 长按事件处理函数 |

### 悬停效果（小程序端）

| 属性名               | 类型            | 默认值   | 必填 | 说明                               |
| -------------------- | --------------- | -------- | ---- | ---------------------------------- |
| hoverClass           | `string`        | `'none'` | 否   | 指定按下去的样式类                 |
| hoverStyle           | `CSSProperties` | -        | 否   | 按下去的样式（RN 端特有）          |
| hoverStartTime       | `number`        | `50`     | 否   | 按住后多久出现点击态，单位毫秒     |
| hoverStayTime        | `number`        | `400`    | 否   | 手指松开后点击态保留时间，单位毫秒 |
| hoverStopPropagation | `boolean`       | `false`  | 否   | 是否阻止本节点的祖先节点出现点击态 |

### 滚动控制

| 属性名        | 类型      | 默认值  | 必填 | 说明                                   |
| ------------- | --------- | ------- | ---- | -------------------------------------- |
| catchMove     | `boolean` | `false` | 否   | 是否以 catch 的形式绑定 touchmove 事件 |
| disableScroll | `boolean` | `false` | 否   | 禁止滚动穿透                           |

### 子元素

| 属性名   | 类型              | 默认值 | 必填 | 说明       |
| -------- | ----------------- | ------ | ---- | ---------- |
| children | `React.ReactNode` | -      | 否   | 子元素内容 |

### 事件对象类型

| 属性名         | 类型           | 说明                       |
| -------------- | -------------- | -------------------------- |
| type           | `string`       | 事件类型                   |
| timeStamp      | `number`       | 事件发生时间戳             |
| target         | `ITouchTarget` | 触发事件的源组件           |
| currentTarget  | `ITouchTarget` | 绑定事件的当前组件         |
| detail         | `ITouchDetail` | 事件的详细信息             |
| touches        | `ITouch[]`     | 当前屏幕上所有触摸点的列表 |
| changedTouches | `ITouch[]`     | 触发此次事件的触摸点列表   |

```typescript
interface ITouchTarget {
  id: string; // 组件ID
  dataset: Record<string, any>; // 组件data-*属性集合
}

interface ITouchDetail {
  x: number; // 距离页面左上角的X坐标
  y: number; // 距离页面左上角的Y坐标
}

interface ITouch {
  identifier: number; // 触摸点ID
  pageX: number; // 距离页面左上角的X坐标
  pageY: number; // 距离页面左上角的Y坐标
  clientX: number; // 距离视口左上角的X坐标
  clientY: number; // 距离视口左上角的Y坐标
}
```

### 点击和触摸属性

| 属性          | 类型                  | 默认值 | 说明         |
| ------------- | --------------------- | ------ | ------------ |
| onClick       | `CommonEventFunction` | -      | 点击事件     |
| onTouchStart  | `CommonEventFunction` | -      | 触摸开始事件 |
| onTouchMove   | `CommonEventFunction` | -      | 触摸移动事件 |
| onTouchEnd    | `CommonEventFunction` | -      | 触摸结束事件 |
| onTouchCancel | `CommonEventFunction` | -      | 触摸取消事件 |

### 悬停效果属性

| 属性                 | 类型            | 默认值  | 说明                               |
| -------------------- | --------------- | ------- | ---------------------------------- |
| hoverClass           | `string`        | `none`  | 指定按下去的样式类                 |
| hoverStyle           | `CSSProperties` | -       | 按下去的样式（RN 端特有）          |
| hoverStartTime       | `number`        | `50`    | 按住后多久出现点击态，单位毫秒     |
| hoverStayTime        | `number`        | `400`   | 手指松开后点击态保留时间，单位毫秒 |
| hoverStopPropagation | `boolean`       | `false` | 是否阻止本节点的祖先节点出现点击态 |

### 滚动相关属性

| 属性          | 类型      | 默认值  | 说明                                   |
| ------------- | --------- | ------- | -------------------------------------- |
| catchMove     | `boolean` | `false` | 是否以 catch 的形式绑定 touchmove 事件 |
| disableScroll | `boolean` | `false` | 禁止滚动穿透                           |

## 高级用法

### 1. 响应式布局

```tsx
export default function ResponsiveLayout() {
  return (
    <View
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'wrap',
      }}>
      <View style={{ flex: 1, minWidth: 200, backgroundColor: '#f0f0f0', margin: 5 }}>
        <Text>左侧区域</Text>
      </View>
      <View style={{ flex: 2, minWidth: 300, backgroundColor: '#e0e0e0', margin: 5 }}>
        <Text>右侧区域</Text>
      </View>
    </View>
  );
}
```

### 2. 条件渲染

```tsx
export default function ConditionalView({ isVisible, children }) {
  return <View style={{ display: isVisible ? 'flex' : 'none' }}>{children}</View>;
}
```

### 3. 卡片布局

```tsx
export default function CardComponent() {
  return (
    <View className='card'>
      <View className='card-header'>
        <Text>标题</Text>
      </View>
      <View className='card-body'>
        <Text>卡片内容</Text>
      </View>
      <View className='card-footer'>
        <Text>底部操作</Text>
      </View>
    </View>
  );
}
```

### 4. 网格布局

```tsx
export default function GridLayout() {
  return (
    <View style={{ display: 'flex', flexWrap: 'wrap' }}>
      {[...Array(12)].map((_, index) => (
        <View
          key={index}
          style={{
            width: '33.33%',
            height: 100,
            backgroundColor: index % 2 === 0 ? '#f5f5f5' : '#e8e8e8',
            borderWidth: 1,
            borderColor: '#ddd',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <Text>项目 {index + 1}</Text>
        </View>
      ))}
    </View>
  );
}
```

## 最佳实践

### 1. 性能优化

```tsx
// ✅ 好的做法 - 使用key
{
  items.map((item) => (
    <View key={item.id}>
      <Text>{item.name}</Text>
    </View>
  ));
}

// ❌ 避免的做法 - 深度嵌套过多层级
<View>
  <View>
    <View>
      <View>
        <Text>避免过深嵌套</Text>
      </View>
    </View>
  </View>
</View>;
```

### 2. 平台兼容性

```tsx
export default function PlatformView() {
  return (
    <View
      // H5和RN通用样式
      style={{
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 8,
        // 使用Taro提供的样式前缀
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}>
      <Text>跨平台组件</Text>
    </View>
  );
}
```

### 3. 样式管理

```scss
// 推荐：使用SCSS
.container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;

  &__header {
    padding: 20px;
    background-color: #f8f9fa;

    &--title {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }
  }
}
```

## 注意事项

### 1. 平台差异

- **H5 端**: 支持完整的 CSS 属性
- **RN 端**: 只支持 Flexbox 布局，不支持传统的 CSS 属性
- **小程序端**: 样式有限制，推荐使用 Flexbox

### 2. 事件处理

```tsx
// H5端支持的事件
onMouseEnter={() => console.log('鼠标进入')}
onMouseLeave={() => console.log('鼠标离开')}

// 所有平台通用的事件
onTouchStart={() => console.log('触摸开始')}
onTouchEnd={() => console.log('触摸结束')}
onTouchMove={() => console.log('触摸移动')}
```

### 3. 样式兼容

```tsx
// 使用Taro的样式API
<View
  style={{
    // ✅ 所有平台支持
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',

    // ❌ 仅H5支持，RN端不生效
    width: '100px',
    height: '100px',
    backgroundColor: 'red',

    // ✅ 使用样式字符串兼容
  }}>
  <Text>兼容性示例</Text>
</View>
```

## 相关组件

- [`Text`](./Text.md) - 文本组件
- [`Image`](./Image.md) - 图片组件
- [`ScrollView`](./ScrollView.md) - 滚动视图组件
- [`Button`](https://taro-docs.jd.com/docs/components/button) - 按钮组件

## 参考资料

- [Taro 官方文档](https://taro-docs.jd.com/)
- [React Native 文档](https://reactnative.dev/)
- [Flexbox 布局指南](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)
