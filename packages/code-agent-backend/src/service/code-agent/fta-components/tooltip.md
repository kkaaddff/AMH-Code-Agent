# Tooltip 文字提示

常用于悬浮展示提示信息。

## 使用说明

- `TooltipView` 需要和 `withTooltip` 搭配使用，`withTooltip` 需要包裹页面组件。
- `withTooltip(Page, { forwardRef: true })` 可以透传 ref 至 Page 节点。

## 引用

```ts
import { TooltipView, withTooltip } from '@fta/components'
```

## 示例

```tsx
/* eslint-disable @typescript-eslint/no-use-before-define */

/**
 * componentName: 'Tooltip'
 * title: '基础演示'
 * previewUrl: 'components/tickling/tooltip'
 * materialType: 'component'
 * package: '@fta/components'
 */

import { inNative, NoticeBar, px, scale, Text, TooltipView, withLayer, withTooltip } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { ScrollView, View } from '@tarojs/components'
import React, { useRef } from 'react'
import './index.scss'

export default withLayer(
  withTooltip(() => {
    const ref = useRef<any>()
    const showTooltip = () => {
      ref.current.show()
    }
    const hideTooltip = () => {
      console.log('关闭tooltip')
      ref.current.hide()
    }

    return (
      <Layout title="文字提示" qrcode="components/display/tickling/index" useScrollView={false}>
        <DemoBlock label="自动定位">
          <TooltipView
            useBottom
            overlay
            overlayStyle={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
            ref={ref}
            render={
              <View
                onClick={hideTooltip}
                style={{
                  backgroundColor: '#000',
                  borderRadius: px(10),
                  position: 'relative',
                  padding: px(10),
                }}
              >
                <Text
                  // @ts-ignore
                  pointerEvents="none"
                  level={5}
                  color="#ffffff"
                >
                  请勾选协议（点击关闭）
                </Text>
              </View>
            }
          >
            {/* TooltipView的直接子元素需要是View节点！！！ */}
            <View>
              <Text level={5} onClick={showTooltip}>
                点击打开协议勾选提示{' '}
              </Text>
            </View>
          </TooltipView>
        </DemoBlock>

        <DemoBlock label="相对父元素定位(V1.0.17)">
          <NoticeBar>暂不支持小程序</NoticeBar>
        </DemoBlock>

        <View style={{ flex: 1, backgroundColor: '#cccccc', overflow: inNative ? undefined : 'auto' }}>
          <ScrollView
            scrollY
            style={
              inNative
                ? undefined
                : {
                    height: scale(2000),
                    position: 'relative',
                  }
            }
          >
            <ParentAsTargetDemo />
          </ScrollView>
        </View>
      </Layout>
    )
  }),
)

/** 需要把TooltipView作为ScrollView的直接子元素，并且使用withTooltip包裹 */
function _ParentAsTargetDemo() {
  const ref = useRef<any>()
  const showTooltip = () => {
    ref.current.show()
  }
  const hideTooltip = () => {
    console.log('关闭tooltip')
    ref.current.hide()
  }

  const coreEl = (
    <TooltipView
      parentAsTarget // 相对于父元素进行定位
      useBottom
      overlayStyle={{ backgroundColor: 'rgba(0,0,0,0.1)' }}
      ref={ref}
      render={
        <View
          onClick={hideTooltip}
          style={{
            backgroundColor: '#000',
            borderRadius: px(10),
            position: 'relative',
            padding: px(10),
          }}
        >
          <Text
            // @ts-ignore
            pointerEvents="none"
            level={5}
            color="#ffffff"
          >
            滚动试试？点击关闭
          </Text>
        </View>
      }
    >
      <View className="parent-demo-target" onClick={showTooltip}>
        <Text>点我试试</Text>
      </View>
    </TooltipView>
  )

  return inNative ? <View className="parent-demo">{coreEl}</View> : coreEl
}

/** 记得包裹 */
const ParentAsTargetDemo = withTooltip(
  _ParentAsTargetDemo,
  // 默认不透传ref
  { forwardRef: false },
)
```

## API

### TooltipView Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| content | 显示的内容，可传入自定义节点 | `string \| ReactElement` | `--` | - |
| textClassName | 文本类名 | `string` | `--` | - |
| textStyle | 文本样式 | `{}` | `--` | - |
| contentClassName | 内容区域类名 | `string` | `--` | - |
| contentStyle | 内容区域样式 | `{}` | `--` | - |
| isOpened | 是否显示 | `boolean` | `true` | - |
| icon | 自定义三角形图标 | `string` | `--` | - |
| iconClassName | 图标类名 | `string` | `--` | - |
| iconStyle | 图标样式 | `{}` | `--` | - |
| popoverClassName | 气泡容器类名 | `string` | `--` | - |
| popoverStyle | 气泡容器样式 | `{}` | `--` | - |
| children | 子元素 | `any` | `--` | - |
| parentAsTarget | 是否相对于父元素定位 | `boolean` | `false` | 1.0.17 |
| useBottom | 是否从底部弹出 | `boolean` | `false` | - |
| overlay | 是否显示遮罩层 | `boolean` | `false` | - |
| overlayStyle | 遮罩层样式 | `{}` | `{}` | - |
| render | 自定义渲染内容 | `ReactNode` | `--` | - |