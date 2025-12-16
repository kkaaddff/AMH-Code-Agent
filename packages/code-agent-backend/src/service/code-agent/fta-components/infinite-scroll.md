# InfiniteScroll 无限滚动

滚动时动态加载数据，默认撑满父元素，请给父元素设置固定高度或 `flex: 1`。

## 说明

### 使用说明
- 小程序端支持 `pull-to-refresh` 下拉刷新，透传相关下拉刷新的 props 即可。
- 注意第一页的数据需要满一屏，否则用户无法触发滑动触底回调。

## 引用
```ts
import { InfiniteScroll } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import { InfiniteScroll, ListItem } from '@fta/components'
import { DemoBlock, Layout, warn } from '@fta/components/common/display'
import React, { useState } from 'react'

const generateList = (length = 6, count = 20) =>
  Array.from({ length: count }, () =>
    Math.random().toString(36).substr(2, length)
  )

const HeaderItem = () => <ListItem title='我是头部' />
const FooterItem = () => <ListItem title='我是尾部' />

let count = 1

export default () => {
  const [list, setList] = useState(generateList)
  const [hasMore, setMore] = useState(true)
  const ref = React.useRef<any>()

  const loadMore = () => {
    console.log('load more')
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        if (list.length > 99) {
          setMore(false)
        } else {
          setList([...list, ...generateList()])
        }
        resolve()
      }, 2000)
    })
  }

  return (
    <Layout
      title='无限滚动'
      useScrollView={false}
      qrcode='components/display/infinite-scroll/index'
    >
      <DemoBlock label='基础使用' pure style={{ overflow: 'hidden', flex: 1 }}>
        <InfiniteScroll
          ref={ref}
          style={{ backgroundColor: '#ffffff' }}
          useFlatList={true}
          ListHeaderComponent={<HeaderItem />}
          ListFooterComponent={<FooterItem />}
          hasMore={hasMore}
          loadMore={loadMore}
          data={list}
          keyExtractor={(word) => word}
          renderItem={({ item: word, index: i }) => (
            <ListItem
              hasBorder
              key={word}
              title={word}
              extraText={String(i)}
              onClick={() => {
                console.log(`click ${word}`)
                warn(word)
              }}
            />
          )}
        >
          {/* 如果不想使用renderItem的方式，直接传入children即可 */}
        </InfiniteScroll>
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| children | 子元素 | `any` | `--` | - |
| data | 列表数据 | `ItemT[]` | `--` | 1.1.0 |
| renderItem | 渲染列表项的函数 | `(item: { item: ItemT; index: number }) => ReactNode` | `--` | 1.1.0 |
| keyExtractor | 用于生成每项的 key | `(item: ItemT, index: number) => string` | `--` | 1.1.0 |
| ListHeaderComponent | 列表头部组件 | `unknown \| ReactElement \| null` | `--` | 1.1.0 |
| ListFooterComponent | 列表底部组件 | `unknown \| ReactElement \| null` | `--` | 1.1.0 |
| ListEmptyComponent | 列表为空时显示的组件 | `unknown \| ReactElement \| null` | `--` | 1.1.0 |
| hasMore | 是否还有更多内容 | `boolean` | `false` | - |
| loadMore | 加载更多的回调函数（异步） | `() => Promise<any>` | `--` | - |
| threshold | 触发加载事件的滚动触底距离阈值（像素） | `number` | `100` | - |
| loader | 加载中的提示内容 | `string \| ReactElement \| false` | `--` | - |
| loaded | 没有更多数据时的提示内容 | `string \| ReactElement \| false` | `--` | - |
| useFlatList | 滚动容器是否使用 FlatList（性能较低，谨慎使用） | `boolean` | `false` | 1.1.0 |
| refreshKey | 用于强制刷新列表（解决缓存问题） | `string \| number` | `--` | 1.1.1 |
| scrollViewRenderer | 自定义滚动容器渲染器 | `unknown` | `--` | - |