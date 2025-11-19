# FloatingPanel 浮动面板

浮动面板组件，常用于地图场景等。

## 说明

#### 注意
Thresh 环境 `adjustGestureBehavior` 中该属性只在特殊场景下（内部嵌套原生列表）时使用，主要用于解决手势冲突，非特定场景不能使用。

## 引用
```javascript
import { FloatingPanel } from '@fta/components'
```

## 示例

### 基础演示
```javascript
import { Flex, FloatingPanel, scale, Text } from '@fta/components'
import Map from '@fta/components-map'
import { Layout } from '@fta/components/common/display'
import React, { useEffect } from 'react'

export default () => {
  const panelRef = FloatingPanel.useRef()

  useEffect(() => {
    setTimeout(() => {
      panelRef.current!.scrollToAnchor(0.6)
    }, 2000)
  }, [])

  return (
    <Layout
      title='浮动面板'
      qrcode='components/tickling/floating-panel/index'
      useScrollView={false}
      scrollviewProps={{
        style: {
          backgroundColor: '#cccccc',
        },
      }}
    >
      <Map />
      <Text level={4} color='#666666'>
        底部视图
      </Text>
      <FloatingPanel
        ref={panelRef}
        // Thresh最多只支持三段式，其他端可以大于三段
        anchors={[0.4, 0.15, 0.8]}
        bgColor='rgba(255,255,255, 1)'
        borderRadius={{
          topLeft: scale(16),
          topRight: scale(16),
        }}
        header={
          <Flex.Center
            style={{ height: scale(100), backgroundColor: '#fd3333' }}
          >
            <Text color='white'>头部区域</Text>
          </Flex.Center>
        }
        footer={
          <Flex.Center
            style={{ height: scale(60), backgroundColor: '#eeeeee' }}
          >
            <Text>底部区域</Text>
          </Flex.Center>
        }
        onDragEnd={(e) => {
          console.log('handleDragEnd', e)
        }}
      >
        <Flex.Column
          justifyContent='space-between'
          style={{ height: scale(1500) }}
        >
          <Text>内容区域1</Text>
          <Text>内容区域2</Text>
          <Text>内容区域3</Text>
          <Text>内容区域4</Text>
        </Flex.Column>
      </FloatingPanel>
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| anchors | 可拖拽至哪些高度，默认为占容器高度的比值，第一项为显示的默认值。Note: Thresh里面最多传三项 | `number[]` | `(必选)` | - |
| useActualSize | 锚点是否使用真实的尺寸，单位为px/dp | `boolean` | `false` | - |
| bgColor | 背景色 | `string` | `--` | - |
| header | 顶部区域 | `ReactElement` | `--` | - |
| footer | 底部区域 [1.9.13] 传 render 方法可完全自定义渲染，支持 H5 | `ReactElement \| () => ReactElement` | `--` | 1.9.13 |
| borderRadius | 浮动面板的圆角 | `{ topLeft?: number \| string; topRight?: number \| string }` | `--` | - |
| windowHeight | 指定容器窗口最大高度，默认取容器高度 | `number` | `--` | - |
| scrollable | 判断内部 ScrollView 是否可以滚动。Note: 默认超过 0.5 的比例可以滚动，此时只能拖动 header 改变面板高度。Thresh 端不支持此属性 | `(data: { windowHeight: number; contentHeight: number }) => boolean` | `--` | - |
| disableDrag | [H5] 是否禁止拖动 | `boolean` | `--` | 1.9.18 |
| forceTriggerDragEnd | [H5] 结束拖动之后始终触发 onDragEnd 回调（即使锚点没有改变） | `boolean` | `false` | 1.11.2 |
| children | 子元素 | `any` | `--` | - |
| ref | 引用对象 | `any` | `--` | - |
| key | React key | `any` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onScroll | 内部 ScrollView 滚动时的回调 | `(event: any) => any` | `--` | - |
| onDrag | [H5] 位置拖动的回调 | `(data: { height: number; windowHeight: number }) => void` | `--` | 1.9.13 |
| onDragEnd | 位置改变时的回调 | `(anchorIndex: number, event: any) => void` | `--` | - |