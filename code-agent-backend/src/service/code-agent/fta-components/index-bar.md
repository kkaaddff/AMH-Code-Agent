# IndexBar 索引列表

用于列表的索引分类显示和快速定位。

## 引用
```ts
import { IndexBar } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import { IndexBar, List, ListItem } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

const getRandomList = (min: number, max: number): string[] => {
  return new Array(Math.floor(Math.random() * (max - min) + min)).fill('')
}

const charCodeOfA = 'A'.charCodeAt(0)

const groups = Array(26)
  .fill('')
  .map((_, i) => ({
    title: String.fromCharCode(charCodeOfA + i),
    items: getRandomList(3, 10).map(() => Math.random().toString(36).substring(2, 8)),
  }))

export default () => (
  <Layout title="索引列表" qrcode="components/nav/index-bar/index" useScrollView={false}>
    <DemoBlock label="基础使用" style={{ flex: 1, overflow: 'scroll', minHeight: 0 }} pure>
      <IndexBar style={{ backgroundColor: '#fafafa' }} onChange={(index) => console.log('index:', index)}>
        {groups.map((group) => {
          const { title, items } = group
          return (
            <IndexBar.Anchor index={title} title={`标题${title}`} key={title}>
              <List>
                {items.map((item, index) => (
                  <ListItem key={index} title={item}></ListItem>
                ))}
              </List>
            </IndexBar.Anchor>
          )
        })}
      </IndexBar>
    </DemoBlock>
  </Layout>
)
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| showTooltip | 滑动/选中时是否在左侧显示提示 | `boolean` | `true` | - |
| barClassName | 右侧列表栏样式类名 | `string` | - | - |
| barStyle | 右侧列表栏内联样式 | `{}` | - | - |
| scrollWithAnimation | 切换时是否应用动画效果 | `boolean` | `true` | - |
| scrollViewProps | 透传给 ScrollView 的属性 | `{}` | - | - |
| renderBar | 自定义渲染索引条（1.9.1 增加 activeIndex 参数） | `(index: string, activeIndex: string) => ReactNode` | - | 1.9.1 |
| children | 子元素 | `any` | - | - |
| sticky | 是否开启锚点自动吸顶 | `boolean` | - | - |
| renderTitle | 自定义渲染标题 | `(title: string, index: string) => ReactNode` | - | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onChange | 锚点变化时的回调 | `(index: string) => any` | - | - |