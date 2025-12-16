```markdown
# Gradient 渐变色

线性渐变色组件，请传入 Hex 格式的 color 以兼容 Thresh 平台。

## 引用
```tsx
import { Gradient } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import { Gradient } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React from 'react'
import './index.scss'

const GradientDemo = () => {
  const box = <View className='fta-demo-gradient' />
  const sbox = <View className='fta-demo-gradient fta-demo-gradient--small' />

  return (
    <Layout title='渐变色'>
      <DemoBlock label='渐变色-深(#fd3333-#f5f5f5)' pure>
        <Gradient direction='toBottom' startColor='#fd3333' endColor='#f5f5f5'>
          {box}
        </Gradient>
      </DemoBlock>

      <DemoBlock label='渐变色-浅(#FFF0E6-#f5f5f5)' pure>
        <Gradient direction='toBottom' startColor='#FFF0E6' endColor='#F5f5f5'>
          {box}
        </Gradient>
      </DemoBlock>

      <DemoBlock label='开始颜色从上向下' pure>
        <Gradient startColor='#fd3333' endColor='#f5f5f5' direction='toBottom'>
          {sbox}
        </Gradient>
      </DemoBlock>

      <DemoBlock label='开始颜色从下向上' pure>
        <Gradient startColor='#fd3333' endColor='#f5f5f5' direction='toTop'>
          {sbox}
        </Gradient>
      </DemoBlock>

      <DemoBlock label='开始颜色从左向右' pure>
        <Gradient startColor='#fd3333' endColor='#f5f5f5' direction='toRight'>
          {sbox}
        </Gradient>
      </DemoBlock>

      <DemoBlock label='开始颜色从右向左' pure>
        <Gradient startColor='#fd3333' endColor='#f5f5f5' direction='toLeft'>
          {sbox}
        </Gradient>
      </DemoBlock>
    </Layout>
  )
}

export default GradientDemo
```

## API

### Props

| 属性名      | 描述           | 类型                          | 默认值  | 版本  |
|-------------|----------------|-------------------------------|---------|-------|
| direction   | 渐变方向       | `"toLeft" \| "toRight" \| "toTop" \| "toBottom"` | `--`    | -     |
| startColor  | 渐变开始颜色   | `string`                      | `--`    | -     |
| endColor    | 渐变结束颜色   | `string`                      | `--`    | -     |
| children    | 子元素         | `ReactNode`                   | `--`    | -     |
| custom      | 自定义属性     | `boolean`                     | `false` | -     |
```