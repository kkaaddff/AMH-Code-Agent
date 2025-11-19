# Tabs 选项卡

选项卡组件，用于让用户在不同的视图中进行切换。

## 引用
```tsx
import { Tabs } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { scale, Tabs } from '@fta/components'
import { DemoBlock, Gap, Layout } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React, { useState } from 'react'
import './index.scss'

function TabsDemo() {
  const [activeIndex1, setActive1] = useState(0)
  const [activeIndex2, setActive2] = useState(0)
  const [activeIndex3, setActive3] = useState(0)
  const [activeIndex4, setActive4] = useState(0)

  return (
    <>
      <DemoBlock label='基础' pure>
        <Tabs align='center' activeIndex={activeIndex1} onChange={setActive1}>
          <Tabs.Tab>选项一</Tabs.Tab>
          <Tabs.Tab>选项二</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <DemoBlock label='基础-选项颜色' pure>
        <Tabs
          align='center'
          activeIndex={activeIndex1}
          activeTextStyle={{ color: '#fd3333' }}
          onChange={setActive1}
        >
          <Tabs.Tab>选项一</Tabs.Tab>
          <Tabs.Tab>选项二</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <DemoBlock label='基础-多选项卡' pure>
        <Tabs align='center' activeIndex={activeIndex4} onChange={setActive4}>
          <Tabs.Tab>选项一</Tabs.Tab>
          <Tabs.Tab>选项二</Tabs.Tab>
          <Tabs.Tab>选项三</Tabs.Tab>
          <Tabs.Tab>选项四</Tabs.Tab>
          <Tabs.Tab>选项五</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <DemoBlock label='基础-大字体' pure>
        <Tabs
          align='center'
          activeIndex={activeIndex2}
          onChange={setActive2}
          textStyle={{
            fontSize: scale(30),
          }}
          lineStyle={{
            backgroundColor: 'rgb(81, 140, 186)',
          }}
        >
          <Tabs.Tab>选项一</Tabs.Tab>
          <Tabs.Tab>选项二</Tabs.Tab>
          <Tabs.Tab>选项三</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <DemoBlock label='对齐方式-左对齐' pure>
        <Tabs activeIndex={activeIndex2} onChange={setActive2}>
          <Tabs.Tab>选项一</Tabs.Tab>
          <Tabs.Tab>选项二</Tabs.Tab>
          <Tabs.Tab>选项三</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <DemoBlock label='对齐方式-右对齐' pure>
        <Tabs align='right' activeIndex={activeIndex2} onChange={setActive2}>
          <Tabs.Tab>选项一</Tabs.Tab>
          <Tabs.Tab>选项二</Tabs.Tab>
          <Tabs.Tab>选项三</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <DemoBlock label='部分禁用' pure>
        <Tabs
          align='center'
          activeIndex={activeIndex1}
          onChange={setActive1}
          onTabClick={({ disabled }) => {
            console.log('是否禁用：' + disabled)
          }}
        >
          <Tabs.Tab>选项一</Tabs.Tab>
          <Tabs.Tab disabled>选项二</Tabs.Tab>
          <Tabs.Tab>选项三</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <DemoBlock label='完全禁用' pure>
        <Tabs
          align='center'
          disabled
          activeIndex={activeIndex1}
          onChange={setActive1}
        >
          <Tabs.Tab>选项一</Tabs.Tab>
          <Tabs.Tab>选项二</Tabs.Tab>
          <Tabs.Tab>选项三</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <DemoBlock label='超出滚动' pure>
        <Tabs
          activeIndex={activeIndex4}
          scrollable
          scrollIntoView
          onChange={setActive4}
        >
          <Tabs.Tab>选项一</Tabs.Tab>
          <Tabs.Tab>选项二</Tabs.Tab>
          <Tabs.Tab>选项三</Tabs.Tab>
          <Tabs.Tab>选项四</Tabs.Tab>
          <Tabs.Tab>选项超出当前页面</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <DemoBlock label='超出滚动-显示更多' pure>
        <Tabs
          activeIndex={activeIndex4}
          scrollable
          onChange={setActive4}
          more='更多'
          renderMore={() => (
            <View
              className='demo-tabs-render-more'
              style={{
                height: scale(300),
                position: 'absolute',
                top: scale(80),
                left: 0,
                right: 0,
                backgroundColor: '#ffffff',
              }}
            ></View>
          )}
        >
          <Tabs.Tab>选项一</Tabs.Tab>
          <Tabs.Tab>选项二</Tabs.Tab>
          <Tabs.Tab>选项三</Tabs.Tab>
          <Tabs.Tab>选项四</Tabs.Tab>
          <Tabs.Tab>选项超出当前页面</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <Gap height={400}></Gap>
    </>
  )
}

export default () => (
  <Layout title='选项卡' qrcode='components/nav/tabs/index'>
    <TabsDemo />
  </Layout>
)
```

### 高级用法

```tsx
import { Badge, rpx, Tabs } from '@fta/components'
import { DemoBlock, Gap, Layout } from '@fta/components/common/display'
import React, { useState } from 'react'
import './index.scss'

function TabsDemo() {
  const [activeIndex, setActive] = useState(0)
  const [activeIndex1, setActive1] = useState(0)

  return (
    <>
      <DemoBlock label='红点提示' pure>
        <Tabs align='center' activeIndex={activeIndex1} onChange={setActive1}>
          <Tabs.Tab dot>选项一</Tabs.Tab>
          <Tabs.Tab dot={<Badge absolute value={2} offset={[rpx(4), rpx(32)]} />}>选项二</Tabs.Tab>
          <Tabs.Tab dot={<Badge absolute value={100} offset={[rpx(4), rpx(12)]} />}>选项三</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <DemoBlock label='JSON格式' pure>
        <Tabs
          activeIndex={activeIndex}
          onChange={setActive}
          options={[
            { label: '选项1', value: 1 },
            { label: '选项2', value: 2 },
            { label: '选项3', value: 1 },
            { label: '选项4', value: 2, disabled: true },
          ]}
          onTabClick={({ disabled }) => {
            console.log('是否禁用：' + disabled)
          }}
        />
        <Gap />
        <Tabs activeIndex={activeIndex} onChange={setActive} options={['选项1', '选项2', '选项3', '选项4', '选项5']} />
      </DemoBlock>

      <DemoBlock label='非受控组件' pure>
        <Tabs activeIndex={1} controls={false}>
          <Tabs.Tab>选项1</Tabs.Tab>
          <Tabs.Tab>选项2</Tabs.Tab>
          <Tabs.Tab>选项3</Tabs.Tab>
          <Tabs.Tab>选项4</Tabs.Tab>
          <Tabs.Tab>选项5</Tabs.Tab>
        </Tabs>
      </DemoBlock>

      <DemoBlock label='垂直布局' pure>
        <Tabs vertical activeIndex={activeIndex} onChange={setActive}>
          <Tabs.Tab>选项1</Tabs.Tab>
          <Tabs.Tab>选项2</Tabs.Tab>
          <Tabs.Tab>选项3</Tabs.Tab>
          <Tabs.Tab>选项4</Tabs.Tab>
          <Tabs.Tab>选项5</Tabs.Tab>
        </Tabs>
      </DemoBlock>
    </>
  )
}

export default () => (
  <Layout title='选项卡' qrcode='components/nav/tabs/index'>
    <TabsDemo />
  </Layout>
)
```

### 分段器

```tsx
import { SegmentedControl } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React, { useState } from 'react'
import './index.scss'

const CustomSegmentedControl = ({
  dark,
  title,
}: {
  dark?: boolean
  title?: string[]
}) => {
  const [current, setCurrent] = useState(0)
  return (
    <SegmentedControl
      level={5}
      values={title || ['标题', '标题']}
      current={current}
      color={dark ? '#fd3333' : '#fff'}
      selectedColor={!dark ? '#fd3333' : '#fff'}
      size='small'
      onClick={setCurrent}
    />
  )
}

class SegmentedDemo extends React.Component {
  state = {
    current1: 0,
    current2: 0,
    current3: 0,
  }

  handleClick1 = (value: number) => {
    this.setState({ current1: value })
  }

  handleClick2 = (value: number) => {
    this.setState({ current2: value })
  }

  handleClick3 = (value: number) => {
    this.setState({ current3: value })
  }

  render() {
    const { current1, current2 } = this.state
    return (
      <>
        <DemoBlock label='基础用法'>
          <SegmentedControl
            values={['选项卡1', '选项卡2', '选项卡3']}
            onClick={this.handleClick1.bind(this)}
            current={current1}
          />
        </DemoBlock>

        <DemoBlock label='自定义颜色'>
          <SegmentedControl
            values={['选项卡1', '选项卡2', '选项卡3']}
            onClick={this.handleClick2.bind(this)}
            current={current2}
            color='#ffffff'
            selectedColor='#1fb080'
          />
        </DemoBlock>

        <DemoBlock label='禁用'>
          <SegmentedControl
            disabled
            values={['选项卡1', '选项卡2', '选项卡3']}
            onClick={this.handleClick2.bind(this)}
            current={current2}
          />
        </DemoBlock>

        <DemoBlock label='小尺寸' justifyContent='center'>
          <CustomSegmentedControl />
        </DemoBlock>
      </>
    )
  }
}

export default function () {
  return (
    <Layout title='分段器' qrcode='components/nav/segmented-control'>
      <SegmentedDemo />
    </Layout>
  )
}
```

## API

### Tabs Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| options | json形式的tab列表，优先级高于插槽子元素 | `string \| number \| TabOption \| ...` | `--` | - |
| controls | 是否是受控组件 | `boolean` | `true` | - |
| more | 右侧显示更多按钮，可传入节点自定义渲染 | `ReactNode` | `null` | 1.3.0 |
| moreIcon | 更多icon | `(visible: boolean) => null \| ReactNode` | `--` | 1.3.0 |
| renderMore | 渲染更多节点 | `() => ReactNode` | `--` | 1.3.0 |
| activeClassName | 激活时的样式 | `string` | `--` | - |
| activeStyle | 激活时的内联样式 | `{}` | `--` | - |
| activeTextClassName | 激活时的文字样式 | `string` | `--` | - |
| activeTextStyle | 激活时的文字内联样式 | `{}` | `--` | - |
| disabled | 是否全部禁用 | `boolean` | `false` | - |
| disabledClassName | 禁用时类名 | `string` | `--` | - |
| tabClassName | tab项的类名 | `string` | `--` | - |
| tabStyle | tab项内联样式 | `{}` | `--` | - |
| textClassName | 文字类名 | `string` | `--` | - |
| textStyle | 文字内联样式 | `{}` | `--` | - |
| activeIndex | 当前激活的索引 | `number` | `--` | - |
| scrollable | 是否可以滚动 | `boolean` | `false` | - |
| vertical | 水平排列还是垂直排列 | `boolean` | `false` | - |
| lineClassName | 激活时底部线条类名 | `string` | `--` | - |
| lineStyle | 激活时底部线条内联样式 | `{}` | `--` | - |
| dotClassName | 红点类名 | `string` | `--` | - |
| dotStyle | 红点内联样式 | `{}` | `--` | - |
| align | 对齐方式 | `"left" \| "center" \| "right"` | `--` | 1.0.13 |
| scrollIntoView | [h5]点击时滚动到中间位置，[scrollable=true]时生效 | `boolean` | `--` | - |

### Tabs Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onMoreClick | 点击更多按钮 | `() => void` | `--` | 1.3.0 |
| onChange | 切换tab时的回调 | `(active: number, value: any) => void` | `--` | - |
| onTabClick | 点击tab时的回调 | `(data: { index: any; active: any; disabled: boolean }) => void` | `--` | 1.0.8 |

### SegmentedControl Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| current | 当前选中的 tab 索引值，从 0 计数 | `number` | `(必选)` | - |
| color | 背景颜色与选中标签字体的颜色 | `string` | `"#fff"` | - |
| selectedColor | 选中的标签背景色与边框颜色 | `string` | `"#6190E8"` | - |
| fontSize | 字体大小，单位 h5 为 rem，小程序为 rem | `number` | `28` | - |
| disabled | 是否禁止点击 | `boolean` | `false` | - |
| level | 字体大小等级 | `1 \| 2 \| 5 \| 6 \| 4 \| 3` | `--` | 1.0.13 |
| size | 宽度尺寸 | `"small" \| "large"` | `"large"` | 1.0.13 |
| values | 选项数组，值是字符串，eg: `['选项卡1', '选项卡2']` | `string[]` | `(必选)` | - |
| itemClassName | 项的类名 | `string` | `--` | - |
| itemStyle | 项的内联样式 | `{}` | `--` | - |

### SegmentedControl Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onClick | 点击触发事件，开发者需要通过 onClick 事件来更新 current 值变化，onClick 函数必填 | `(index: number, event: any) => void` | `(必选)` | - |