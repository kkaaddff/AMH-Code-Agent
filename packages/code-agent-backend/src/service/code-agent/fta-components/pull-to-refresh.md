# PullToRefresh 下拉刷新

下拉刷新组件。

`onRefresh` 是一个异步函数，请做好容错（try-catch）处理，确保 Promise 能正常 resolve。

## 使用说明

- Thresh 端暂未实现通过 `ref API` 来控制下拉行为。
- Thresh 端组件库低于 1.3.2 的版本存在下拉刷新卡顿问题，新增了 `optimize` 属性。请将 `@thresh/thresh-lib` 升级到 6.13.2+，并在 20231026 及之后的宿主版本中使用。

## 引用

```ts
import { PullToRefresh } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import {
  InfiniteScroll,
  inNative,
  List,
  ListItem,
  PullToRefresh,
  rpx,
  SegmentedControl,
  usePullToRefreshRef,
} from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { ScrollView, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import React, { useEffect, useState } from 'react'

const generateRandomArray = (length = 6, count = 20) =>
  Array.from({ length: count }, () =>
    Math.random().toString(36).substr(2, length)
  )

const tabs = ['ScrollView', 'InfiniteScroll']

const Demo = () => {
  const [tab, setTab] = useState(1)
  const [hasMore, setMore] = useState(true)
  const [list, updateList] = useState(() => generateRandomArray(6, 30))
  const pullRef = usePullToRefreshRef()
  const [color, setColor] = useState('#efefef')

  useEffect(() => {
    setTimeout(() => {
      setColor('green')
    }, 3000)
  }, [])

  const onRefresh = () => {
    console.log('e.refreshState start onRefresh')
    return new Promise((resolve) => {
      setTimeout(() => resolve(updateList(generateRandomArray(6, 30))), 2000)
    })
  }

  const loadMore = () => {
    console.log('load more')
    Taro.showLoading()
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (list.length > 79) {
          setMore(false)
        } else {
          updateList((prevList) => prevList.concat(generateRandomArray()))
        }
        Taro.hideLoading()
        resolve()
      }, 2000)
    })
  }

  const renderList = () => (
    <List>
      {list.map((word, i) => (
        <ListItem
          key={word + '-' + i}
          title={word}
          extraText={String(i)}
          onClick={() => {
            console.log(`click ${word}`)
            Taro.showToast({ title: word, icon: 'none', duration: 30 })
          }}
        />
      ))}
    </List>
  )

  useEffect(() => {
    setTimeout(() => {
      pullRef.current?.start(onRefresh)
    }, 30)
  }, [])

  return (
    <Layout
      title='下拉刷新'
      useScrollView={false}
      qrcode='components/tickling/pull-to-refresh/index'
    >
      <DemoBlock
        label={`PullToRefresh + ${tabs[tab]}`}
        pure
        style={{ overflow: 'hidden', flex: 1 }}
      >
        <View
          style={{
            marginBottom: rpx(16),
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
          }}
        >
          <SegmentedControl
            style={{ width: rpx(500) }}
            current={tab}
            values={tabs}
            onClick={setTab}
          />
        </View>
        <PullToRefresh
          ref={pullRef}
          loadingProps={{ tintColor: '#fd3333' }}
          onRefresh={onRefresh}
          showAsBrand
          renderText={() => ({
            pulling: '再往下拉一点试试',
            ready: '可以放开你的小手了😊',
            refreshing: '正在刷新中，小手不要动...',
            done: '刷完了✅',
          })}
          contentStyle={{
            flex: 1,
            overflow: 'scroll',
            backgroundColor: '#fff',
          }}
        >
          {tab === 0 ? (
            <ScrollView
              scrollY
              style={
                inNative
                  ? { height: '100%' }
                  : { height: '100%', overflow: 'auto' }
              }
            >
              {renderList()}
            </ScrollView>
          ) : (
            <InfiniteScroll
              useFlatList
              hasMore={hasMore}
              loadMore={loadMore}
              data={list}
              keyExtractor={(word, i) => word + '-' + i}
              renderItem={({ item: word, index: i }) => (
                <ListItem
                  hasBorder
                  key={word}
                  title={word}
                  extraText={String(i)}
                  onClick={() => {
                    console.log(`click ${word}`)
                    Taro.showToast({ title: word, icon: 'none', duration: 30 })
                  }}
                />
              )}
            />
          )}
        </PullToRefresh>
      </DemoBlock>
    </Layout>
  )
}

export default Demo
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| delay | 完成时延迟消失的时间，单位为 ms | `number` | `500` | - |
| threshold | 触发刷新需要下拉的距离（px，基于 720px 设计稿缩放） | `number` | `136` | - |
| panResponder | 手势处理挂载在父容器还是子容器。支付宝小程序建议选择 `'children'` | `"children" \| "parent"` | `"parent"` | 1.0.13 |
| stay | [H5] 下拉加载更多时，位置是否停留在原地 | `boolean` | `--` | 1.2.4 |
| headerClassName | 顶部样式类名 | `string` | `--` | - |
| headerStyle | 顶部样式对象 | `{}` | `--` | - |
| contentClassName | 内容区域样式类名 | `string` | `--` | - |
| contentStyle | 内容区域样式对象 | `{}` | `--` | - |
| textClassName | 下拉刷新文本样式类名 | `string` | `--` | 1.1.0 |
| textStyle | 下拉刷新文本样式对象 | `{}` | `--` | 1.1.0 |
| tintColor | 简单下拉刷新颜色 | `string` | `--` | 1.1.0 |
| progressBackgroundColor | 简单下拉刷新背景色 | `string` | `--` | 1.1.0 |
| progressViewOffset | 简单下拉刷新偏移量 | `number` | `--` | 1.1.0 |
| headBackgroundColor | 下拉区域的背景色 | `string` | `--` | 1.1.0 |
| optimize | Thresh 环境中是否使用新的事件回调（性能更优） | `boolean` | `--` | 1.3.2 |
| refreshProps | [Thresh] RefreshControl 组件的属性 | `{}` | `--` | 1.4.1 |
| renderText | 自定义下拉刷新文案/内容展示，ratio 表示当前偏移值和 threshold 的比例 | `(ratio: number) => { pulling?: string; ready?: string; refreshing?: string; done?: string }` | `{"pulling":"下拉更新","ready":"松开更新","refreshing":"更新中...","done":"更新成功"}` | - |
| showPrefix | 渲染头部前缀，默认刷新完成状态下不展示 | `(status: string) => boolean` | `--` | - |
| renderPrefix | 自定义渲染头部前缀 | `(status: string) => ReactNode` | `--` | - |
| headBackgroundImage | [Thresh] 下拉刷新背景图 | `string` | `--` | 1.8.5 |
| headBackgroundImageResizeMode | [Thresh] 下拉刷新背景图拉伸方式 | `"stretch" \| "contain" \| "cover"` | `--` | 1.8.5 |
| loadingProps | 加载动画属性配置 | `{ duration?: number; circle?: boolean; ... }` | `--` | - |
| showAsBrand | 是否启用新的品牌动画（启用后 `renderText` 必须返回字符串） | `boolean` | `--` | 1.9.0 |
| refreshColor | 自定义刷新动画颜色配置 | `{ outerColor: string; centerColor: string }` | `--` | 1.9.0 |
| children | 子元素 | `any` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 版本 |
|--------|------|------|------|
| onRefresh | 触发刷新时的处理函数（异步） | `async () => any` | - |