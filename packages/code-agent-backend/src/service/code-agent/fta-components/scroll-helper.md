# ScrollHelper 滚动至可视区

将元素滚动到可视区域内，`ScrollHelper` 需要配合 `ScrollHelper.ScrollView` 搭配使用。

## 引用
```javascript
import { ScrollHelper } from '@fta/components'
```

## 示例
```javascript
import { Button, Flex, Gap, ListItem, ScrollHelper } from '@fta/components'
import { Layout } from '@fta/components/common/display'
import React from 'react'

export default () => {
  const scrollViewRef = ScrollHelper.ScrollView.useRef()
  const firstHelperRef = ScrollHelper.useRef()

  return (
    <Layout title="滚动至可视区域" useScrollView={false} qrcode="components/tickling/scroll-helper/index">
      <ScrollHelper.ScrollView ref={scrollViewRef}>
        {new Array(30).fill(0).map((v, i) => (
          <ScrollHelper
            key={i}
            scrollIntoViewKey={`scroll-${i}`}
            animated={false}
            immediate={i === 15}
            align="top"
            ref={i === 0 ? firstHelperRef : undefined}
          >
            <ListItem style={{ backgroundColor: '#ffffff' }} title="标题" extraText={String(i)} />
          </ScrollHelper>
        ))}
      </ScrollHelper.ScrollView>
      <Gap height={16} />
      <Flex.Center direction="row">
        <Button
          style={{ flexShrink: 0 }}
          onClick={() =>
            scrollViewRef.current!.scrollIntoView(`scroll-20`, {
              animated: true,
              align: 'center',
            })
          }
        >
          scroll index to 20
        </Button>
        <Button
          type="default"
          style={{ flexShrink: 0 }}
          onClick={() =>
            firstHelperRef.current!.scrollIntoView({
              animated: false,
              align: 'top',
            })
          }
        >
          scroll index to 0
        </Button>
      </Flex.Center>
      <Gap height={16} />
    </Layout>
  )
}
```

## API

### ScrollHelper Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| immediate | 是否渲染后立即滚动当前 item 到可视区域 | `boolean` | `false` | - |
| scrollIntoViewKey | 指定唯一的 key | `string` | `--` | - |
| animated | 滚动是否带动画 | `boolean` | `true` | - |
| align | 滚动到视口的位置 | `"center" \| "top" \| "bottom"` | `"center"` | - |
| children | 子元素 | `any` | `--` | - |