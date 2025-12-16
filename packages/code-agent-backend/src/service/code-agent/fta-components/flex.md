```markdown
# Flex 弹性布局

弹性布局 flexbox，默认盒模型为 `border-box`。

## 引用
```tsx
import { Flex } from '@fta/components' // Flex, Flex.Row, Flex.Column, Flex.Center
```

## 示例

### 基础演示

```tsx
import { Flex } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React, { useEffect, useRef } from 'react'
import './index.scss'

const Box = ({ color }: { color: string }) => (
  <View className='demo-flex-box' style={{ backgroundColor: color }} />
)

enum Colors {
  warning = '#fd3333',
  error = '#ff3333',
  success = '#1fb080',
}

export default () => {
  const ref = useRef<any>()

  useEffect(() => {
    setTimeout(() => {
      console.log(typeof ref.current === 'object')
    }, 100)
  }, [])

  return (
    <Layout title='弹性布局' qrcode='components/layout/flex/index'>
      <DemoBlock label='基础使用' pure>
        <Flex
          ref={ref}
          direction='row'
          justifyContent='flex-start'
          alignItems='flex-start'
        >
          <Box color={Colors.warning} />
          <Box color={Colors.success} />
          <Box color={Colors.error} />
        </Flex>
      </DemoBlock>

      <DemoBlock label='横向排列' pure>
        <Flex.Row>
          <Box color={Colors.warning} />
          <Box color={Colors.success} />
          <Box color={Colors.error} />
        </Flex.Row>
      </DemoBlock>

      <DemoBlock label='水平居中排列' pure>
        <Flex.Center direction='row'>
          <Box color={Colors.warning} />
          <Box color={Colors.success} />
          <Box color={Colors.error} />
        </Flex.Center>
      </DemoBlock>

      <DemoBlock label='横向分散排列' pure>
        <Flex.Row justifyContent='space-between'>
          <Box color={Colors.warning} />
          <Box color={Colors.success} />
          <Box color={Colors.error} />
        </Flex.Row>
      </DemoBlock>

      <DemoBlock label='纵向排列' pure>
        <Flex.Column>
          <Box color={Colors.warning} />
          <Box color={Colors.success} />
          <Box color={Colors.error} />
        </Flex.Column>
      </DemoBlock>

      <DemoBlock label='纵向居中排列' pure>
        <Flex.Center direction='column'>
          <Box color={Colors.warning} />
          <Box color={Colors.success} />
          <Box color={Colors.error} />
        </Flex.Center>
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| component | 实际渲染的节点，默认使用 `View` from '@tarojs/components' | `unknown` | `"View"` | - |
| flex | 定义元素可伸缩值，`flex={1}` 可以撑满父元素 | `string \| number` | `--` | 1.1.1 |
| direction | 排列方向 | `"-moz-initial" \| "inherit" \| ...` | `"column"` | - |
| alignItems | 交叉轴对齐方式 | `string \| -moz-initial \| inherit \| ...` | `"flex-start"` | - |
| justifyContent | 主轴对齐方式 | `string \| -moz-initial \| inherit \| ...` | `--` | - |
| children | 子元素 | `any` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onClick | 手指触摸后马上离开 | `(event: import("/node_modules/...` | `--` | - |
```