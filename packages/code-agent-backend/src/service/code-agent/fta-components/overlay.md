# Overlay 背景蒙层

创建一个背景蒙层，用于强调特定的页面元素，并阻止用户对遮罩下层的内容进行操作，一般用于弹窗场景。

## 引用
```tsx
import { Overlay } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { Overlay, scale } from '@fta/components'
import { DemoBlock, Layout, List, ListItem } from '@fta/components/common/display'
import { Text, View } from '@tarojs/components'
import React, { useState } from 'react'
import './index.scss'

const hintEl = (
  <View style={{ backgroundColor: '#ffffff', borderRadius: scale(8) }}>
    <Text className="demo-overlay__text">请点击透明处关闭背景蒙层</Text>
  </View>
)

export default () => {
  const [showBasic, toggleBasic] = useState(true)
  const [showMarketing, toggleMarketing] = useState(false)
  const [showCustom, toggleCustom] = useState(false)
  const [showCustomStatic, toggleCustomStatic] = useState(false)

  return (
    <Layout title="背景蒙层">
      <DemoBlock label="基础使用" pure>
        <List>
          <ListItem title="基础背景蒙层" onClick={() => toggleBasic(true)} />
          <ListItem title="营销背景蒙层/新手引导" onClick={() => toggleMarketing(true)} />
          <ListItem title="自定义背景蒙层" onClick={() => toggleCustom(true)} />
          <ListItem title="自定义背景蒙层(无动画)" onClick={() => toggleCustomStatic(true)} />
        </List>
      </DemoBlock>

      <Overlay
        center
        show={showBasic}
        onClick={() => toggleBasic(false)}
        onShow={() => {
          console.log('onShow')
        }}
        onHide={() => {
          console.log('onHide')
        }}
      >
        {hintEl}
      </Overlay>

      <Overlay opacity={0.8} center show={showMarketing} onClick={() => toggleMarketing(false)}>
        {hintEl}
      </Overlay>

      <Overlay opacity={0.3} center show={showCustom} onClick={() => toggleCustom(false)}>
        {hintEl}
      </Overlay>

      <Overlay animated={false} opacity={0.3} center show={showCustomStatic} onClick={() => toggleCustomStatic(false)}>
        {hintEl}
      </Overlay>
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|-------|------|------|--------|------|
| opacity | 透明度 | `number` | `--` | - |
| bgColor | 背景色（rgba等色彩也可以实现半透明效果） | `string` | `--` | - |
| zIndex | 组件层级 | `number` | `99` | - |
| center | 子节点是否居中显示 | `boolean` | `false` | - |
| animated | 应用过渡动画 | `boolean` | `true` | 1.0.10 |
| modalProps | 透传给原生Modal的属性 | `{}` | `--` | 1.1.3 |
| children | 子元素 | `any` | `--` | - |
| fixed | 是否使用固定定位，rn中使用Modal组件包裹 | `boolean` | `true` | - |
| show | 是否显示背景蒙层 | `boolean` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onShow | Modal显示回调 | `() => any` | `--` | 1.2.0 |
| onHide | Modal隐藏回调 | `() => any` | `--` | 1.2.0 |
| onClick | 点击背景蒙层时的回调 | `() => void` | `--` | - |