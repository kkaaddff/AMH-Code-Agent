# Toggle 开关

全新开关组件，支持更多属性配置，默认为受控组件。

> **注意**：1.9.1-rc.9 以上版本，Thresh 端已适配切换时的过渡动画效果。

## 引用

```ts
import { Toggle } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { Toggle } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React, { useState } from 'react'

export default () => {
  const [active, setActive] = useState(true)

  return (
    <Layout title='开关' qrcode='components/form/toggle/index'>
      <DemoBlock label='基础使用' justifyContent='space-around'>
        <Toggle active controls={false} />
        <Toggle active controls={false} activeText='开' inactiveText='关' />
        <Toggle controls={false} />
        <Toggle controls={false} activeText='开' inactiveText='关' />
      </DemoBlock>
      <DemoBlock label='禁用' justifyContent='space-around'>
        <Toggle disabled active controls={false} />
        <Toggle
          disabled
          active
          controls={false}
          activeText='开'
          inactiveText='关'
        />
        <Toggle disabled controls={false} />
        <Toggle disabled controls={false} activeText='开' inactiveText='关' />
      </DemoBlock>
      <DemoBlock label='受控组件' justifyContent='space-around'>
        <Toggle active={active} onChange={setActive} />
        <Toggle
          active={active}
          onChange={setActive}
          activeText='开'
          inactiveText='关'
        />
        <Toggle active={!active} onChange={() => setActive(!active)} />
        <Toggle
          active={!active}
          onChange={() => setActive(!active)}
          activeText='开'
          inactiveText='关'
        />
      </DemoBlock>
    </Layout>
  )
}
```

### 自定义

```tsx
import { Icon, Text, Toggle } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => {
  return (
    <Layout title='开关' qrcode='components/form/toggle/index'>
      <DemoBlock label='自定义颜色' justifyContent='space-around'>
        <Toggle
          active
          controls={false}
          bgColorActive='#1fb080'
          bgColorInactive='#a2c4b8'
        />
        <Toggle
          active
          controls={false}
          bgColorActive='#1fb080'
          bgColorInactive='#a2c4b8'
          activeText='开'
          inactiveText='关'
        />
        <Toggle
          controls={false}
          bgColorActive='#1fb080'
          bgColorInactive='#a2c4b8'
        />
        <Toggle
          controls={false}
          bgColorActive='#1fb080'
          bgColorInactive='#a2c4b8'
          activeText='开'
          inactiveText='关'
        />
      </DemoBlock>
      <DemoBlock
        label='自定义尺寸'
        justifyContent='space-around'
        alignItems='center'
        bgColor='transparent'
      >
        <Toggle
          active
          controls={false}
          width={80}
          height={48}
          circleSize={42}
          padding={4}
        />
        <Toggle
          active
          controls={false}
          width={80}
          height={48}
          circleSize={36}
          padding={8}
        />
        <Toggle controls={false} width={144} />
        <Toggle controls={false} width={144} height={80} circleSize={72} />
      </DemoBlock>
      <DemoBlock label='自定义渲染' justifyContent='space-around'>
        <Toggle
          active
          controls={false}
          fontSize={32}
          activeText={<Icon size={32} color='#ffffff' value='CheckOutlined' />}
          inactiveText={
            <Icon size={32} color='#ffffff' value='CloseOutlined' />
          }
        />
        <Toggle
          active
          controls={false}
          renderCircleChild={({ active }) => (
            <Text level={5} color={active ? '#fd3333' : '#999999'}>
              {active ? '是' : '否'}
            </Text>
          )}
        />
        <Toggle
          controls={false}
          fontSize={32}
          activeText={<Icon size={32} color='#ffffff' value='CheckOutlined' />}
          inactiveText={
            <Icon size={32} color='#ffffff' value='CloseOutlined' />
          }
        />
        <Toggle
          controls={false}
          renderCircleChild={({ active }) => (
            <Text level={5} color={active ? '#fd3333' : '#999999'}>
              {active ? '是' : '否'}
            </Text>
          )}
        />
      </DemoBlock>
    </Layout>
  )
}
```

### 业务场景

```tsx
import { List, ListItem, scale, Toggle } from '@fta/components'
import { DemoBlock, Gap, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => {
  return (
    <Layout title='开关' qrcode='components/form/toggle/index'>
      <DemoBlock
        label='常规开关'
        flexDirection='column'
        alignItems='stretch'
        bgColor='transparent'
      >
        <List
          hoverless
          itemStyle={{ paddingTop: scale(21), paddingBottom: scale(21) }}
        >
          <ListItem
            title='开启状态'
            arrow={<Toggle active controls={false} />}
          />
          <ListItem
            title='关闭状态'
            arrow={<Toggle active={false} controls={false} />}
          />
        </List>
      </DemoBlock>
      <DemoBlock
        label='文字开关'
        flexDirection='column'
        alignItems='stretch'
        bgColor='transparent'
      >
        <List
          hoverless
          itemStyle={{ paddingTop: scale(21), paddingBottom: scale(21) }}
        >
          <ListItem
            title='开启状态'
            arrow={
              <Toggle
                active
                controls={false}
                activeText='开'
                inactiveText='关'
              />
            }
          />
          <ListItem
            title='关闭状态'
            arrow={
              <Toggle
                active={false}
                controls={false}
                activeText='开'
                inactiveText='关'
              />
            }
          />
        </List>
      </DemoBlock>
      <DemoBlock
        label='常规开关（含辅助文本）'
        flexDirection='column'
        alignItems='stretch'
        bgColor='transparent'
      >
        <List hoverless>
          <ListItem
            title='开启状态'
            note='辅助文本'
            arrow={<Toggle active controls={false} />}
          />
          <ListItem
            title='关闭状态'
            note='辅助文本'
            arrow={<Toggle active={false} controls={false} />}
          />
        </List>
      </DemoBlock>
      <DemoBlock
        label='文字开关（含辅助文本）'
        flexDirection='column'
        alignItems='stretch'
        bgColor='transparent'
      >
        <List hoverless>
          <ListItem
            title='开启状态'
            note='辅助文本'
            arrow={
              <Toggle
                active
                controls={false}
                activeText='开'
                inactiveText='关'
              />
            }
          />
          <ListItem
            title='关闭状态'
            note='辅助文本'
            arrow={
              <Toggle
                active={false}
                controls={false}
                activeText='开'
                inactiveText='关'
              />
            }
          />
        </List>
      </DemoBlock>
      <DemoBlock label='通栏' pure>
        <List
          style={{ borderRadius: 0 }}
          hoverless
          itemStyle={{ paddingTop: scale(21), paddingBottom: scale(21) }}
        >
          <ListItem
            title='关闭状态'
            arrow={<Toggle active={false} controls={false} />}
          />
          <ListItem
            title='关闭状态'
            arrow={<Toggle active={false} controls={false} />}
          />
          <ListItem
            title='关闭状态'
            arrow={<Toggle active={false} controls={false} />}
          />
        </List>
        <Gap />
      </DemoBlock>
    </Layout>
  )
}
```

## Props

| 属性名                     | 描述                         | 类型                                | 默认值         | 版本 |
|--------------------------|----------------------------|-----------------------------------|-------------|----|
| width                    | 容器宽度                     | `number`                          | `102`       |    |
| height                   | 容器高度                     | `number`                          | `62`        |    |
| active                   | 是否选中                     | `boolean`                         | `false`     |    |
| activeText               | 选中时的文本                  | `false \| string \| ReactElement` | `--`        |    |
| inactiveText             | 未选中时的文本                | `false \| string \| ReactElement` | `--`        |    |
| disabled                 | 是否禁用                     | `boolean`                         | `false`     |    |
| controls                 | 是否是受控组件                | `boolean`                         | `true`      |    |
| circleSize               | 内部圆形尺寸                  | `number`                          | `54`        |    |
| radiusSize               | 圆角尺寸                     | `number`                          | `51`        |    |
| fontSize                 | 文本区域大小                  | `number`                          | `28`        |    |
| bgColorActive            | 选中时的背景色                | `string`                          | `"#ff7000"` |    |
| bgColorInactive          | 未选中时的背景色              | `string`                          | `"#cccccc"` |    |
| circleColorActive        | 选中时圆形的背景色            | `string`                          | `"#ffffff"` |    |
| circleColorInactive      | 未选中时圆形的背景色          | `string`                          | `"#ffffff"` |    |
| bgColorActiveDisabled    | 禁用并选中时的背景色          | `string`                          | `"#ffc699"` |    |
| bgColorInactiveDisabled  | 禁用并未选中时的背景色        | `string`                          | `"#e8e8e8"` |    |
| circleColorActiveDisabled| 禁用并选中时圆形的背景色        | `string`                          | `"#ffffff"` |    |
| circleColorInactiveDisabled| 禁用并未选中时圆形的背景色    | `string`                          | `"#ffffff"` |    |
| circleStyle              | 内部圆形样式                  | `{}`                              | `--`        |    |
| padding                  | 内边距                      | `number`                          | `4`         |    |
| renderText               | 自定义渲染文本节点，需要自行添加定位 | `(status: { active: boolean; disabled: boolean }) => ReactNode` | `--` |    |
| renderCircleChild        | 自定义渲染圆形内部元素，默认水平垂直居中 | `(status: { active: boolean; disabled: boolean }) => ReactNode` | `--` |    |

## Events

| 属性名      | 描述                   | 类型                       | 默认值 | 版本 |
|-----------|----------------------|--------------------------|------|----|
| onChange  | 点击切换时的回调         | `(active: boolean) => void` | `--` |    |