```markdown
# SwipeAction 滑动单元格

## 引用
```tsx
import { SwipeAction } from '@fta/components'
```
> V1.1.0 新增 `SwipeAction.List` 组件。

## 示例

### 基础演示

```tsx
import {
  autoFix,
  Button,
  Flex,
  scale,
  SwipeAction,
  Text,
} from '@fta/components'
import {
  DemoArea,
  Layout,
  PropsArea,
  warn,
} from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React, { useState } from 'react'

function SwipeActionRowDemo() {
  const [options] = useState([
    {
      text: '取消',
      textStyle: {
        fontSize: 18,
      },
      containerStyle: {
        backgroundColor: '#6190E8',
      },
      onClick: () => {
        Taro.showToast({ title: '点击了取消' })
      },
    },
    {
      text: '确认',
      textStyle: {
        fontSize: 18,
      },
      containerStyle: {
        backgroundColor: '#FF4949',
      },
      onClick: () => Taro.showToast({ title: '点击了确认' }),
    },
    {
      text: '放弃',
      textStyle: {
        fontSize: 18,
      },
      containerStyle: {
        backgroundColor: '#409eff',
      },
      onClick: () => Taro.showToast({ title: '点击了放弃' }),
    },
  ])

  const [state, refreshState] = useState({
    show: false,
    follow: true,
    breakpoint: 0.3,
    disabled: false,
    left: false,
  })

  function setState(newState: Partial<typeof state>) {
    refreshState({ ...state, ...newState })
  }

  return (
    <>
      <DemoArea>
        <SwipeAction
          className='demo-swipe-action-item'
          follow={state.follow}
          show={state.show}
          breakpoint={state.breakpoint}
          disabled={state.disabled}
          left={state.left}
          options={options}
          swipeProps={{
            onClick() {
              warn('点击事件')
            },
          }}
        >
          <Flex.Center style={{ backgroundColor: '#eee', flex: 1, height: '100%' }}>
            <Text level={3}>向{state.left ? '右' : '左'}滑动试试</Text>
          </Flex.Center>
        </SwipeAction>
      </DemoArea>

      <PropsArea
        onChange={(prop, params) => {
          setState({ [prop]: params.value })
        }}
        options={[
          {
            label: 'show',
            remark: '是否打开',
            list: [false, true],
          },
          {
            label: 'follow',
            remark: '按钮组是否跟随移动',
            list: [true, false],
          },
          {
            label: 'breakpoint',
            remark: '滑动断点',
            list: [0.3, 0.4, 0.5],
          },
          {
            label: 'disabled',
            remark: '禁止滑动',
            list: [false, true],
          },
          {
            label: 'left',
            remark: '滑动方向',
            list: [
              { label: '左滑', value: false },
              { label: '右滑', value: true },
            ],
            reference: true,
          },
        ]}
      />
    </>
  )
}

export default () => (
  <Layout
    title='滑动单元格'
    useScrollView={true}
    className='demo-swipe-action'
  >
    <SwipeActionRowDemo />
  </Layout>
)
```

### SwipeAction.List

```tsx
import {
  autoFix,
  Button,
  Flex,
  scale,
  SwipeAction,
  Text,
} from '@fta/components'
import { Layout } from '@fta/components/common/display'
import React, { useRef, useState } from 'react'

const SwipeActionListDemo = () => {
  const listRef = useRef<any>()
  const [data] = useState([
    { left: true },
    { follow: true },
    { distance: autoFix(200), isVipClient: true },
    {},
  ])

  return (
    <>
      <SwipeAction.List
        closeOnRowPress
        ref={listRef}
        distance={autoFix(300)}
        data={data}
        onRowClick={({ item, index }) => {
          console.log('click row' + index, item)
        }}
        itemStyle={{
          height: scale(100),
          borderWidth: 0,
          borderStyle: 'solid',
          borderBottomWidth: scale(2),
          borderBottomColor: '#eeeeee',
        }}
        renderItem={({ item, index }) => (
          <Flex.Center style={{ backgroundColor: '#fafafa', flex: 1, height: '100%' }}>
            <Text level={3}>
              {index + 1}: 向{item.left ? '右👉' : '左👈'}滑动试试
            </Text>
          </Flex.Center>
        )}
        renderHiddenItem={({ item }) =>
          item.isVipClient ? (
            [
              {
                text: 'Vip福利',
                textStyle: { fontSize: 18 },
                containerStyle: { backgroundColor: '#6190E8' },
                onClick: () => {
                  console.log('vip客户')
                },
              },
            ]
          ) : (
            <Text>自定义渲染：{item.follow ? '跟随' : '静止'}</Text>
          )
        }
        keyExtractor={(_, index) => index}
      />

      <Button
        onClick={() => {
          listRef.current.closeAllOpenRows()
        }}
      >
        关闭所有行
      </Button>
    </>
  )
}

export default () => (
  <Layout
    title='滑动单元格'
    useScrollView={true}
    className='demo-swipe-action'
  >
    <SwipeActionListDemo />
  </Layout>
)
```

### 与下拉刷新结合使用

```tsx
import {
  Flex,
  Layout,
  PullToRefresh,
  scale,
  SwipeAction,
  Text,
} from '@fta/components'
import { ScrollView } from '@tarojs/components'
import React, { useState } from 'react'

export default function Demo() {
  const [dataList, setDataList] = useState(() =>
    new Array(20).fill(0).map((_, index) => {
      return { index }
    })
  )

  return (
    <Layout
      title={{ title: '下拉刷新 + 滑动列表' }}
      scrollable={false}
      wrapperStyle={{
        flex: 1,
        overflow: 'hidden',
      }}
    >
      <PullToRefresh
        contentStyle={{
          flex: 1,
          overflow: 'hidden',
        }}
      >
        <ScrollView scrollY style={{ height: '100%' }}>
          <SwipeAction.List
            data={dataList}
            keyExtractor={(item) => item.index}
            itemStyle={{
              backgroundColor: '#fff',
              borderBottomWidth: 1,
              borderBottomColor: '#efefef',
              borderBottomStyle: 'solid',
              flexShrink: 0,
            }}
            renderItem={({ item, index }) => (
              <Flex.Center
                style={{
                  backgroundColor: '#fafafa',
                  flexGrow: 1,
                  flexShrink: 0,
                  height: scale(100),
                }}
              >
                <Text level={3}>
                  {index + 1}: 向{item.left ? '右👉' : '左👈'}滑动试试
                </Text>
              </Flex.Center>
            )}
            renderHiddenItem={() => [
              { text: '确定' },
              { text: '取消' },
            ]}
          />
        </ScrollView>
      </PullToRefresh>
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| options | 按钮选项 | `SwipeActionOption[]` | `[]` | - |
| show | 控制打开或者关闭 | `boolean` | `false` | - |
| left | 按钮在左侧，右滑打开 | `boolean` | `false` | - |
| disabled | 是否禁用 | `boolean` | `false` | - |
| distance | 最远滑动距离，不指定则自动计算单元格宽度 | `number` | `null` | - |
| breakpoint | 滑动断点，滑动到一定距离后松手自动展开或收起 | `number` | `0.5` | - |
| render | 自定义渲染按钮区 | `ReactNode` | `--` | - |
| follow | 按钮区域是否跟随移动 | `boolean` | `false` | - |
| swipeClassName | 滑动层类名 | `string` | `--` | - |
| swipeStyle | 滑动层样式 | `{}` | `--` | - |
| children | 子元素 | `ReactNode` | `--` | - |
| swipeProps | 滑动层其他props | `unknown` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onToggle | 打开或者关闭时候的回调 | `(isOpened: boolean) => void` | `--` | - |
```