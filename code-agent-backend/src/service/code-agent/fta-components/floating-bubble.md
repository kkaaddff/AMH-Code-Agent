# FloatingBubble 悬浮窗

可以拖动的悬浮窗组件。

## 引用
```ts
import { FloatingBubble } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import { autoFix, FloatingBubble, scale, Text } from '@fta/components'
import { Layout, warn } from '@fta/components/common/display'
import React from 'react'

export default () => {
  return (
    <>
      <Layout title="悬浮窗" qrcode="components/tickling/floating-bubble"></Layout>
      <FloatingBubble
        axis="xy"
        defaultOffset={{ x: autoFix(200), y: autoFix(200) }}
        style={{
          height: scale(160),
          width: scale(160),
          borderRadius: scale(160),
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text level={4} color="#ffffff">
          随意拖动
        </Text>
      </FloatingBubble>
      <FloatingBubble
        axis="x"
        defaultOffset={{ x: autoFix(200), y: autoFix(400) }}
        style={{
          height: scale(160),
          width: scale(160),
          borderRadius: scale(160),
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text level={4} color="#ffffff">
          x轴拖动
        </Text>
      </FloatingBubble>
      <FloatingBubble
        axis="y"
        defaultOffset={{ x: autoFix(500), y: autoFix(600) }}
        style={{
          height: scale(160),
          width: scale(160),
          borderRadius: scale(160),
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text level={4} color="#ffffff">
          y轴拖动
        </Text>
      </FloatingBubble>
      <FloatingBubble
        axis="lock"
        defaultOffset={{ x: false, y: autoFix(800) }}
        style={{
          height: scale(160),
          width: scale(160),
          right: scale(40),
          borderRadius: scale(160),
          backgroundColor: 'rgba(0,0,0,0.6)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Text level={4} color="#ffffff">
          固定位置
        </Text>
      </FloatingBubble>
      <FloatingBubble
        onClick={() => warn('联系客服~~')}
        axis="y"
        style={{ right: 0 }}
        defaultOffset={{ x: false, y: autoFix(1000) }}
        imageUrl="https://imagecdn.ymm56.com/ymmfile/static/resource/e13df473-a7ae-443f-a236-6f9351eed570.png"
        title="联系客服"
      />
      <FloatingBubble
        onClick={() => warn('联系客服~~')}
        axis="y"
        style={{ right: 0 }}
        defaultOffset={{ x: false, y: autoFix(1100) }}
        imageUrl="https://imagecdn.ymm56.com/ymmfile/static/resource/e13df473-a7ae-443f-a236-6f9351eed570.png"
      />
    </>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| axis | 可以进行拖动的方向，'xy' 表示自由移动，'lock' 表示只允许在拖拽开始时的方向上移动 | `"x" \| "y" \| "xy" \| "lock"` | `"y"` | - |
| defaultOffset | 自动磁吸到边界；默认偏移位置 | `{ x: number \| false; y: number \| false }` | `{"x":0,"y":0}` | - |
| imageUrl | 图片 URL | `string` | `--` | - |
| title | 标题 | `string` | `--` | - |
| locate | 自定义气泡的拖动范围 | `(offset: { x: number; y: number }) => { minX: number; maxX: number; minY: number; maxY: number }` | `{}` | - |
| children | 子元素 | `any` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onClick | 点击回调 | `(e: any) => any` | `--` | - |
| onOffsetChange | 偏移位置变化时的回调函数 | `(offset: { x: number; y: number }) => void` | `--` | - |