# Popover 气泡提示

气泡提示组件

## 引用
```javascript
import { Popover } from '@fta/components'
```

## 示例

### 基础演示

```jsx
import { Icon, Popover, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

export default Popover.with(() => {
  return (
    <Layout title='气泡提示' qrcode='components/tickling/popover/index'>
      <DemoBlock label='基础使用' justifyContent='space-between'>
        <Popover.View
          visible
          text='气泡'
          prefix={<Icon value='BellOutlined' size={32} color='#ffffff' />}
          arrowPlacement='bottom'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          text='气泡'
          arrowPlacement='left'
          prefix={<Icon value='BankcardFilled' size={32} color='#ffffff' />}
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          text='气泡'
          arrowPlacement='right'
          prefix={<Icon value='CalendarFilled' size={32} color='#ffffff' />}
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          text='气泡'
          arrowPlacement='top'
          prefix={<Icon value='ClassifyFilled' size={32} color='#ffffff' />}
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
      </DemoBlock>

      <DemoBlock label='缩放动画(1.9.1)' justifyContent='space-between'>
        <Popover.View
          visible
          animation={[0.5, 1]}
          text='气泡'
          prefix={<Icon value='BellOutlined' size={32} color='#ffffff' />}
          arrowPlacement='bottom'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          animation={[0, 0.5]}
          text='气泡'
          arrowPlacement='left'
          prefix={<Icon value='BankcardFilled' size={32} color='#ffffff' />}
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          animation={[1, 0.5]}
          text='气泡'
          arrowPlacement='right'
          prefix={<Icon value='CalendarFilled' size={32} color='#ffffff' />}
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          animation={[0.5, 0]}
          text='气泡'
          arrowPlacement='top'
          prefix={<Icon value='ClassifyFilled' size={32} color='#ffffff' />}
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
      </DemoBlock>

      <DemoBlock label='带关闭按钮' justifyContent='space-between'>
        <Popover.View
          visible
          closable
          text='气泡'
          arrowPlacement='bottom'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          closable
          text='气泡'
          arrowPlacement='left'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          closable
          text='气泡'
          arrowPlacement='right'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          closable
          text='气泡'
          arrowPlacement='top'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
      </DemoBlock>

      <DemoBlock label='多行' justifyContent='space-between'>
        <Popover.View
          visible
          closable
          style={{
            width: scale(210),
          }}
          text='气泡提示气泡提示'
          arrowPlacement='top'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          closable
          style={{
            width: scale(210),
          }}
          text='气泡提示气泡提示'
          arrowPlacement='bottom'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          closable
          style={{
            width: scale(210),
          }}
          text='气泡提示气泡提示'
          arrowPlacement='left'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
      </DemoBlock>
    </Layout>
  )
})
```

### 高级使用

```jsx
import { Button, Gap, Icon, Popover, px, scale, Text } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React, { useRef } from 'react'

export default Popover.with(() => {
  const ref = useRef<any>()
  const showPopover = () => {
    ref.current.show()
  }
  const hidePopover = () => {
    console.log('关闭Popover')
    ref.current.hide()
  }

  return (
    <Layout title='气泡提示' qrcode='components/tickling/popover/index'>
      <DemoBlock label='自定义颜色' justifyContent='space-between'>
        <Popover.View
          visible
          closable
          text='气泡'
          bgColor='#fd3333'
          arrowPlacement='bottom'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          closable
          text='气泡'
          bgColor='rgb(255, 112, 0, 0.1)'
          textColor='rgb(255, 112, 0)'
          closeColor='rgb(255, 112, 0)'
          arrowPlacement='left'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          closable
          text='气泡'
          arrowPlacement='right'
          bgColor='#fd3333'
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          prefix={<Icon value='BellOutlined' size={32} color='rgb(255, 112, 0)' />}
          visible
          text='气泡'
          bgColor='rgb(255, 112, 0, 0.1)'
          textColor='rgb(255, 112, 0)'
          arrowPlacement='top'
        />
      </DemoBlock>

      <DemoBlock label='自定义箭头位置' justifyContent='space-between'>
        <Popover.View
          visible
          closable
          style={{
            width: scale(240),
          }}
          text='气泡提示气泡提示'
          arrowPlacement='top'
          arrowStyle={{ left: scale(120) }}
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
        <Popover.View
          visible
          closable
          style={{
            width: scale(240),
          }}
          bgColor='#fd3333'
          text='气泡提示气泡提示'
          arrowPlacement='left'
          arrowStyle={{ top: scale(12) }}
          onClose={() => {
            console.log('trigger onClose')
          }}
        />
      </DemoBlock>

      <DemoBlock label='自定义箭头位置' justifyContent='space-between'>
        <Popover
          visible
          text='气泡提示'
          placement='top'
          style={{ width: scale(170) }}
          closable
          onClose={() => {
            console.log('绑定状态')
          }}
        >
          <Text level={5}>点我试试</Text>
        </Popover>
        <Popover
          visible
          text='气泡提示'
          placement='left'
          style={{ width: scale(170), top: scale(-8) }}
          closable
          onClose={() => {
            console.log('绑定状态')
          }}
        >
          <Text level={5}>点我试试</Text>
        </Popover>
      </DemoBlock>

      <DemoBlock label='自动定位'>
        <Popover.MeasureView
          ref={ref}
          render={(rect) => (
            <Popover.View
              style={{
                top: px(rect.top - 40),
                left: rect.left,
                position: 'absolute',
              }}
              visible
              arrowPlacement='bottom'
              text='请勾选协议'
              closable
              onClose={hidePopover}
            />
          )}
        >
          <View>
            <Button type='text' onClick={showPopover}>
              点击打开协议勾选提示
            </Button>
          </View>
        </Popover.MeasureView>
      </DemoBlock>

      <Gap height={500}></Gap>
    </Layout>
  )
})
```

## API

### Popover Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| placement | 气泡相对元素的位置 | `"left" \| "right" \| "top" \| "bottom"` | `--` | - |
| containerProps | 外层容器的属性 | `{}` | `--` | - |
| children | 气泡包裹的元素 | `ReactNode` | `(必选)` | - |

### Popover.View Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| visible | 是否展示弹出内容 | `boolean` | `true` | - |
| text | 气泡文本 | `ReactNode` | `--` | - |
| textColor | 文字颜色 | `string` | `--` | - |
| textStyle | 文字样式 | `{}` | `--` | - |
| textClassName | 文字样式类名 | `string` | `--` | - |
| bgColor | 背景色 | `string` | `"rgba(0,0,0,0.8)"` | - |
| closeColor | 关闭图标颜色 | `string` | `"'#ffffff'"` | - |
| prefix | 前缀节点 | `ReactNode` | `--` | - |
| arrowPlacement | 箭头位置 | `"left" \| "right" \| "top" \| "bottom"` | `--` | - |
| arrowStyle | 箭头样式 | `{}` | `--` | - |
| arrowClassName | 箭头样式类名 | `string` | `--` | - |
| closable | 是否显示关闭按钮 | `boolean` | `--` | - |
| renderClose | 自定义渲染关闭按钮 | `(color: string, action: () => void) => ReactNode` | `--` | - |
| animation | 缩放动画（以左上角为原点，指定缩放中心点） | `TransformOrigin \| false` | `--` | 1.9.1 |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onClose | 点击关闭按钮的回调 | `() => void` | `--` | - |

### Popover.MeasureView Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| children | 子元素（必须为 View 节点） | `ReactNode` | `(必选)` | - |
| render | 自定义渲染 tooltip | `ReactElement \| (rect: Rect) => ReactElement` | `--` | - |
| overlay | 是否显示背景蒙层 | `boolean` | `false` | - |
| useBottom | 是否使用 bottom 进行定位 | `boolean` | `false` | 1.0.15 |
| parentAsTarget | 是否相对于父元素定位（默认相对于屏幕） | `boolean` | `false` | 1.0.17 |
| overlayClassName | 蒙层样式类名 | `string` | `--` | - |
| overlayStyle | 蒙层样式 | `{}` | `--` | - |
| clickOverlayOnClose | 点击背景蒙层是否关闭 | `boolean` | `true` | - |
| ref | 引用对象 | `RefObject` | `--` | - |
| key | React key | `Key \| null` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onOverlayClick | 点击遮罩层的回调，返回 false 可阻断关闭 | `(e: any) => any` | `--` | 1.6.0 |