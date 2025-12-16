# TabBar 标签栏

主要用于底部导航，方便用户在不同功能模块之间进行快速切换，建议标签数量控制在 2 ～ 5 个。

## 引用
```ts
import { TabBar } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import { Icon, scale, TabBar } from '@fta/components'
import { DemoBlock, Gap, Layout } from '@fta/components/common/display'
import React, { useState } from 'react'

const baseTab = {
  title: '标签',
  icon: <Icon size={48} value='WechatOutlined' color='#666666' />,
  activeIcon: <Icon size={48} value='WechatFilled' color='#fd3333' />,
}

const baseBadgeTab1 = {
  title: '标签',
  icon: (
    <Icon
      size={48}
      value='WechatOutlined'
      color='#666666'
      badge={{ isDot: true }}
    />
  ),
  activeIcon: (
    <Icon
      size={48}
      value='WechatFilled'
      color='#fd3333'
      badge={{ isDot: true }}
    />
  ),
}

const baseBadgeTab2 = {
  title: '标签',
  icon: (
    <Icon
      size={48}
      value='WechatOutlined'
      color='#666666'
      badge={{ value: 2, offset: [scale(-6), scale(0)] }}
    />
  ),
  activeIcon: (
    <Icon
      size={48}
      value='WechatFilled'
      color='#fd3333'
      badge={{ value: 2, offset: [scale(-6), scale(0)] }}
    />
  ),
}

const baseBadgeTab3 = {
  title: '标签',
  icon: (
    <Icon
      size={48}
      value='WechatOutlined'
      color='#666666'
      badge={{ value: 100, offset: [scale(-6), scale(0)] }}
    />
  ),
  activeIcon: (
    <Icon
      size={48}
      value='WechatFilled'
      color='#fd3333'
      badge={{ value: 100, offset: [scale(-6), scale(0)] }}
    />
  ),
}

const baseCustomTab = {
  title: '标签',
  icon: <Icon size={48} value='WechatOutlined' color='#1a1a1a' />,
  activeIcon: <Icon size={48} value='WechatFilled' color='#1fb080' />,
}

export default () => {
  const [active1, setActive1] = useState(0)
  const [active2, setActive2] = useState(0)
  const [active3, setActive3] = useState(0)
  const [active4, setActive4] = useState(0)
  const [active5, setActive5] = useState(0)
  const [active6, setActive6] = useState(0)

  return (
    <Layout title='标签栏' qrcode='components/nav/tab-bar/index'>
      <DemoBlock label='基础使用' pure>
        <TabBar
          tabs={[baseTab, baseTab]}
          activeIndex={active1}
          onChange={setActive1}
        />
        <Gap />
        <TabBar
          tabs={[baseTab, baseTab, baseTab]}
          activeIndex={active2}
          onChange={setActive2}
        />
        <Gap />
        <TabBar
          tabs={[baseTab, baseTab, baseTab, baseTab]}
          activeIndex={active3}
          onChange={setActive3}
        />
        <Gap />
        <TabBar
          tabs={[baseTab, baseTab, baseTab, baseTab, baseTab]}
          activeIndex={active4}
          onChange={setActive4}
        />
      </DemoBlock>

      <DemoBlock label='红点提示' pure>
        <TabBar
          tabs={[baseTab, baseBadgeTab1, baseBadgeTab2, baseBadgeTab3]}
          activeIndex={active5}
          onChange={setActive5}
        />
      </DemoBlock>

      <DemoBlock label='自定义颜色' pure>
        <TabBar
          tabs={[baseCustomTab, baseCustomTab, baseCustomTab]}
          color='#1a1a1a'
          activeColor='#1fb080'
          activeIndex={active6}
          onChange={setActive6}
        />
      </DemoBlock>

      <DemoBlock label='禁用' pure>
        <TabBar
          tabs={[
            baseCustomTab,
            baseCustomTab,
            { ...baseCustomTab, disabled: true },
          ]}
          color='#1a1a1a'
          activeColor='#1fb080'
          activeIndex={active6}
          onChange={setActive6}
        />
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性名         | 描述                         | 类型                  | 默认值         | 版本     |
|----------------|------------------------------|-----------------------|----------------|----------|
| activeIndex    | 当前激活的索引               | `number`             | `0`            | -        |
| color          | tab 上的文字/icon默认颜色    | `string`             | `"#666666"`    | -        |
| activeColor    | tab 上的文字/icon选中时的颜色| `string`             | `"#ff7000"`    | -        |
| bgColor        | tab 的背景色                 | `string`             | `--`           | -        |
| tabs           | tab列表，一般建议是2-5个     | `TabBarItemOption[]` | `(必选)`       | -        |
| tabClassName   | 自定义类名                   | `string`             | `--`           | -        |
| tabStyle       | 自定义样式                   | `{}`                 | `--`           | -        |
| safeArea       | 是否应用底部安全区           | `boolean \| SafeAreaProps` | `--`    | -        |
| activeTitleStyle | 选中时标题样式              | `{}`                 | `--`           | 1.11.7   |
| titleStyle     | 标题样式                     | `{}`                 | `--`           | 1.11.7   |

### Events

| 属性名    | 描述                   | 类型                     | 默认值 | 版本 |
|-----------|------------------------|--------------------------|--------|------|
| onChange  | 选项改变时的回调       | `(index: number) => any` | `--`   | -    |