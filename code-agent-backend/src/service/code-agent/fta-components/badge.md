# Badge 徽标

徽标，红点、数字或文字。用于告诉用户待处理的事物或更新数。

## 引用
```tsx
import { Badge } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import { Badge, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React from 'react'
import './index.scss'

const BadgeDemo = () => {
  return (
    <>
      <DemoBlock label="基础样式">
        <View className="demo-badge-view">
          <Badge absolute isDot offset={[scale(-12), scale(-12)]} bordered />
        </View>
        <View className="demo-badge-view">
          <Badge absolute value="2" type="error" offset={[scale(-16), scale(-16)]} />
        </View>
        <View className="demo-badge-view">
          <Badge bgColor="#FF3333" absolute shape="horn" value="New" offset={[scale(-16), scale(-16)]} />
        </View>
      </DemoBlock>

      <DemoBlock label="极限值样式">
        <View className="demo-badge-view">
          <Badge absolute bgColor="#FF3333" value={100} type="success" max={99} offset={[scale(-16), scale(-16)]} />
        </View>
      </DemoBlock>

      <DemoBlock label="带边框样式">
        <View className="demo-badge-view">
          <Badge absolute isDot offset={[scale(-12), scale(-12)]} bordered />
        </View>
        <View className="demo-badge-view">
          <Badge absolute value="24" type="error" offset={[scale(-16), scale(-16)]} bordered />
        </View>
        <View className="demo-badge-view">
          <Badge bgColor="#FF3333" absolute shape="horn" value="New" offset={[scale(-16), scale(-16)]} bordered />
        </View>
      </DemoBlock>

      <DemoBlock label="自定义角标">
        <View className="demo-badge-view">
          <Badge
            color="#1A1A1A"
            bgColor="#FFD338"
            absolute
            shape="horn"
            value="优选"
            offset={[scale(-16), scale(-16)]}
          />
        </View>
        <View className="demo-badge-view">
          <Badge bgColor="#0154FE" absolute shape="horn" value="10秒接单" offset={[scale(-16), scale(-75)]} bordered />
        </View>
      </DemoBlock>
    </>
  )
}

export default () => (
  <Layout qrcode="components/basic/badge/index" title="徽标" className="demo-badge">
    <BadgeDemo />
  </Layout>
)
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| isDot | 不展示数字，只有一个小点 | `boolean` | `false` | - |
| value | 展示的数字，大于 overflowCount 时显示为 `${overflowCount}+`，为0且show-zero为false时隐藏 | `string \| number` | `--` | - |
| show | 组件是否显示 | `boolean` | `true` | - |
| max | 最大值，超过最大值会显示 `{max}+` | `number` | `99` | - |
| type | 主题类型 | `"warning" \| "primary" \| "info" \| ...` | `"error"` | - |
| showZero | 当数值为 0 时，是否展示 Badge | `boolean` | `false` | - |
| color | 字体颜色 | `string` | `null` | - |
| bgColor | 背景颜色，优先级比 type 高，如设置，type 参数会失效 | `string` | `null` | - |
| numberType | 显示方式 | `"overflow" \| "ellipsis" \| "lim..."` | `--` | - |
| shape | 徽标形状，`circle`-四角均为圆角，`horn`-左下角为直角 | `"circle" \| "horn" \| "square" \| ...` | `"circle"` | - |
| offset | 设置 badge 的位置偏移，格式为 `[x, y]`，也即设置的为 top 和 right 的值，absolute 为 true 时有效 | `unknown[]` | `--` | - |
| absolute | 组件是否绝对定位，为 true 时，offset 参数才有效 | `boolean` | `false` | - |
| bordered | 是否显示边框 | `boolean` | `false` | - |
| textStyle | 文本样式 | `{}` | `--` | - |