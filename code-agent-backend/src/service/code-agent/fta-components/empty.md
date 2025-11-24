# Empty 空状态

该组件用于需要加载内容，但是加载的数据为空，提示一个“没有内容”或“访问出错”的场景。

## 引用
```tsx
import { Empty } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import { Empty } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React from 'react'
import './index.scss'

export default () => {
  return (
    <Layout title='空状态' qrcode='components/tickling/empty/index' className='demo-empty'>
      <DemoBlock label='全局空状态-100%' justifyContent='center' bgColor='transparent'>
        <Empty onClick={() => Taro.showToast({ title: '刷新空页面', icon: 'loading' })} />
      </DemoBlock>
      <DemoBlock label='局部空状态-80%' justifyContent='center'>
        <Empty size='medium' showBtn={false} onClick={() => Taro.showToast({ title: '刷新空页面', icon: 'loading' })} />
      </DemoBlock>
      <DemoBlock label='局部空状态-60%' justifyContent='center'>
        <Empty size='small' showBtn={false} />
      </DemoBlock>
    </Layout>
  )
}
```

### 业务场景
```tsx
import { Empty } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React from 'react'
import './index.scss'

export default () => {
  return (
    <Layout title='空状态' qrcode='components/tickling/empty/index' className='demo-empty'>
      <DemoBlock label='异常状态' justifyContent='center'>
        <Empty type='error' onClick={() => Taro.showToast({ title: '刷新出错页面', icon: 'loading' })} />
      </DemoBlock>
      <DemoBlock label='自定义标题/描述' justifyContent='center'>
        <Empty title='什么鬼，怎么出错了' desc='别慌，这是个恶作剧' />
      </DemoBlock>
    </Layout>
  )
}
```

### 显隐控制
```tsx
import { Empty } from '@fta/components'
import { DemoBlock, Layout, List, ListItem } from '@fta/components/common/display'
import React, { useState } from 'react'
import './index.scss'

export default () => {
  const [show, toggleShow] = useState(true)

  return (
    <Layout title='空状态' qrcode='components/tickling/empty/index' className='demo-empty'>
      <DemoBlock label='隐藏按钮' justifyContent='center'>
        <Empty type='error' showBtn={false} />
      </DemoBlock>
      <DemoBlock label='显示/隐藏组件' pure>
        <List>
          <ListItem hasBorder={false} onClick={() => toggleShow(!show)} title={`点击${show ? '隐藏' : '显示'}`} />
        </List>
      </DemoBlock>
      <DemoBlock label='' justifyContent='center' flexDirection='column' alignItems='center'>
        <Empty show={show} />
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性名   | 描述                         | 类型                     | 默认值       | 版本     |
|----------|------------------------------|--------------------------|--------------|----------|
| type     | 空状态或者是错误页面         | `"error" \| "empty"`     | `"empty"`    | -        |
| src      | 展示的图片URL                | `string`                 | `--`         | -        |
| title    | 提示标题（V1.3.2 可自定义渲染） | `ReactNode`              | `--`         | V1.3.2   |
| desc     | 提示内容（V1.3.2 可自定义渲染） | `ReactNode`              | `--`         | V1.3.2   |
| show     | 是否展示                     | `boolean`                | `true`       | -        |
| showBtn  | 是否展示按钮                 | `boolean`                | `true`       | -        |
| btnText  | 按钮文本                     | `string`                 | `"刷新试试"` | -        |
| size     | 图片尺寸                     | `"small" \| "medium" \| "large"` | `"large"` | -        |

### Events

| 属性名   | 描述           | 类型         | 默认值 |
|----------|----------------|--------------|--------|
| onClick  | 按钮点击事件   | `() => void` | `--`   |