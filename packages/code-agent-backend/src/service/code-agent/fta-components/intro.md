# Intro 功能引导

功能引导组件，引导用户操作。

## 引用
```javascript
import { Intro } from '@fta/components'
```

## 示例

### 基础演示
```javascript
import { Button as Touchable, Intro, px, useIntroContext, withIntro, Gap, Flex, scale, Text } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React, { useEffect } from 'react'

export default withIntro(() => {
  const ctx = useIntroContext()

  useEffect(() => {
    ctx.show()
  }, [])

  return (
    <Layout title='功能引导' qrcode='components/tickling/intro/index'>
      <DemoBlock label='基础使用' pure>
        <Flex style={{ backgroundColor: 'white', padding: scale(24), borderRadius: scale(16) }}>
          <Flex style={{ width: '100%' }}>
            <Flex.Row style={{ alignItems: 'center', marginBottom: scale(24) }}>
              <View style={{ height: scale(16), width: scale(16), borderRadius: scale(4), backgroundColor: '#2698F7', marginRight: scale(8) }}></View>
              <Text style={{ fontSize: scale(28), fontWeight: 500, color: '#333', lineHeight: scale(28) }}>装货地</Text>
            </Flex.Row>
            <Intro
              title='点击这里，填写装货地'
              text='下一步'
              prop='load_cargo'
              onClick={() => {
                console.log('onClick')
                ctx.show('unload_cargo')
              }}
              isolate
              placement='bottom'
              delay={300}
              tooltipStyle={{ left: px(10) }}
            >
              {/* Intro如果包裹的是组件节点，需要透传组件根view的ref属性 */}
              <View onClick={() => ctx.show('load_cargo')} style={{ borderRadius: scale(16), backgroundColor: '#F6F7F8', padding: scale(24), fontSize: scale(32), width: '100%' }}>
                点击填入装货地
              </View>
            </Intro>
          </Flex>

          <Gap height={24} />

          <Flex style={{ width: '100%' }}>
            <Flex.Row style={{ alignItems: 'center', marginBottom: scale(24) }}>
              <View style={{ height: scale(16), width: scale(16), borderRadius: scale(4), backgroundColor: '#FD4444', marginRight: scale(8) }}></View>
              <Text style={{ fontSize: scale(28), fontWeight: 500, color: '#333', lineHeight: scale(28) }}>卸货地</Text>
            </Flex.Row>
            <Intro
              title='点击这里，填写卸货地'
              text='下一步'
              prop='unload_cargo'
              onClick={() => {
                console.log('onClick')
                ctx.hide()
              }}
              isolate
              placement='bottom'
              tooltipStyle={{ left: px(10) }}
              readonly
            >
              {/* Intro如果包裹的是组件节点，需要透传组件根view的ref属性 */}
              <View onClick={() => ctx.show('load_cargo')} style={{ borderRadius: scale(16), backgroundColor: '#F6F7F8', padding: scale(24), fontSize: scale(32), width: '100%' }}>
                点击填入卸货地
              </View>
            </Intro>
          </Flex>
        </Flex>
      </DemoBlock>

      <DemoBlock label='简单提示'>
        <Intro
          title='提示词'
          prop='tip'
          overrideProps={{
            style: { width: '100%', opacity: 0.5 },
          }}
          placement='bottom'
          tooltipStyle={{ left: px(10) }}
        >
          <View style={{ width: '100%' }}>
            <Touchable
              onClick={() => {
                console.log('打开引导功能')
                ctx.show('tip')
              }}
            >
              点我试试
            </Touchable>
          </View>
        </Intro>
      </DemoBlock>
    </Layout>
  )
})
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| children | 需要引导的节点组件 | `ReactNode` | 必选 | - |
| priority | 优先级 | `number` | `--` | 1.2.1 |
| reactive | 展示的组件响应式变化 | `boolean` | `false` | 1.9.0 |
| overrideProps | Demo展示里需要覆盖的props | `object` | `{}` | 1.2.1 |
| renderTooltip | 自定义渲染Tooltip | `(rect: Rect) => ReactNode` | `--` | 1.2.1 |
| isolate | 功能引导弹窗是否独立，默认点击会弹出下一个 | `boolean` | `false` | 1.2.2 |
| renderEl | 自定义渲染展示元素 | `(rect: Rect) => ReactNode` | `--` | 1.2.2 |
| delay | 收集定位的延迟，单位毫秒 | `number` | `0` | - |
| readonly | 元素是否不可点击 | `boolean` | `true` | - |
| tooltipClassName | 类名 | `string` | `--` | - |
| tooltipStyle | 样式 | `object` | `{}` | - |
| title | 提示标题 | `string` | `--` | - |
| desc | 提示内容，不传则不展示 | `string` | `--` | - |
| text | 提示按钮文本，不传则不展示 | `string` | `--` | - |
| placement | 提示文字/按钮框放置的位置 | `"top" \| "bottom"` | `"bottom"` | - |
| offset | icon三角形偏移百分比 | `string` | `"30%"` | - |
| prop | 唯一标识（ID） | `string` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 版本 |
|--------|------|------|------|
| onOverlayClick | 点击背景蒙层的回调，返回 `false` 可阻止关闭 | `() => void \| boolean` | 1.2.3 |
| onClick | 点击按钮的回调，默认跳到下一步 | `() => void` | - |