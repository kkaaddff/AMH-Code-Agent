# Gap 间隔槽

该组件一般用于内容块之间的用一个灰色块隔开的场景，方便用户风格统一，减少工作量。

## 引用
```javascript
import { Gap } from '@fta/components'
```

## 示例

### 基础演示
```javascript
import { Gap } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => (
  <Layout title='间隔槽' qrcode='components/layout/gap/index'>
    <>
      <DemoBlock label='基础用法' alignItems='stretch' flexDirection='column'>
        <Gap bgColor='#eee' />
      </DemoBlock>

      <DemoBlock label='自定义间隔' alignItems='stretch' flexDirection='column'>
        <Gap bgColor='#eee' top={10} bottom={20} />
        <Gap bgColor='#eee' left={10} right={20} />
      </DemoBlock>

      <DemoBlock label='自定义样式' alignItems='stretch' flexDirection='column'>
        <Gap bgColor='#eee' height={50} top={30} />
        <Gap bgColor='#fd3333' height={100} top={30} />
        <Gap bgColor='#fd3333' width={200} height={50} top={20} left={30} />
      </DemoBlock>
    </>
  </Layout>
)
```

## API

### Props

| 属性名   | 描述                         | 类型     | 默认值  | 版本 |
|----------|------------------------------|----------|---------|------|
| bgColor  | 背景颜色                     | `string` | `--`    | -    |
| height   | 间隔槽高度，单位px           | `number` | `--`    | -    |
| width    | 间隔槽宽度，单位px           | `number` | `--`    | -    |
| top      | 与前一个元素的距离，单位px   | `number` | `--`    | -    |
| bottom   | 与后一个元素的距离，单位px   | `number` | `--`    | -    |
| left     | 与左边元素的距离，单位px     | `number` | `--`    | -    |
| right    | 与右边元素的距离，单位px     | `number` | `--`    | -    |
| scale    | 尺寸是否响应式缩放           | `boolean`| `true`  | -    |