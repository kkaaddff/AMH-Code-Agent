# Skeleton 骨架屏

在需要等待加载内容的位置提供一个占位图形组合。

## 引用
```javascript
import { Skeleton } from '@fta/components'
```

## 示例

### 基础演示
```javascript
import { Button, Flex, Gap, scale, Skeleton, Text } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React, { useState } from 'react'

export default () => {
  const [active, setActive] = useState(true)
  const [animated, setAnimated] = useState(true)

  return (
    <Layout title='骨架屏' qrcode='components/tickling/skeleton/index'>
      <DemoBlock
        label='基础使用'
        flexDirection='column'
        alignItems='stretch'
        style={{
          backgroundColor: '#F5F5F5',
        }}
      >
        <Flex.Column
          style={{
            backgroundColor: '#FFFFFF',
            paddingTop: scale(24),
            paddingRight: scale(24),
            paddingBottom: scale(24),
            paddingLeft: scale(24),
            borderRadius: scale(16),
          }}
        >
          <Flex.Row
            alignItems='center'
            style={{
              width: '100%',
            }}
          >
            <Skeleton.Circle width={80} height={80} />
            <Gap width={16} />
            <Flex.Column flex={1} justifyContent='space-between'>
              <Skeleton.Text width={208} height={32} />
              <Gap height={12} />
              <Skeleton.Text width={'100%'} height={32} />
            </Flex.Column>
          </Flex.Row>
        </Flex.Column>
      </DemoBlock>

      <DemoBlock
        label='进阶使用'
        flexDirection='column'
        alignItems='stretch'
        style={{
          backgroundColor: '#F5F5F5',
        }}
      >
        <Skeleton.Provider
          animated={animated}
          active={active}
          style={{
            animationDuration: 3000,
          }}
          render={
            <Flex.Center style={{ height: scale(100) }}>
              <Text level={5} color='#666666'>
                加载完成
              </Text>
            </Flex.Center>
          }
        >
          <Flex.Column
            style={{
              backgroundColor: '#FFFFFF',
              paddingTop: scale(24),
              paddingRight: scale(24),
              paddingBottom: scale(24),
              paddingLeft: scale(24),
              borderRadius: scale(16),
            }}
          >
            <Flex.Row
              alignItems='center'
              style={{
                width: '100%',
              }}
            >
              <Skeleton.Circle width={80} height={80} />
              <Gap width={16} />
              <Flex.Column flex={1} justifyContent='space-between'>
                <Skeleton.Text width={208} height={32} />
                <Gap height={12} />
                <Skeleton.Text width={'100%'} height={32} />
              </Flex.Column>
            </Flex.Row>
          </Flex.Column>
        </Skeleton.Provider>

        <Gap height={24} />
        <Flex.Row alignItems='center'>
          <Button
            type='secondary'
            style={{ marginLeft: 0, marginRight: 0, flex: 1 }}
            onClick={() => setAnimated((prev) => !prev)}
          >
            {animated ? '禁用动画' : '应用动画'}
          </Button>
          <Gap width={16} />
          <Button
            style={{ marginLeft: 0, marginRight: 0, flex: 1 }}
            onClick={() => setActive((prev) => !prev)}
          >
            {active ? '切换加载完成' : '切换加载中'}
          </Button>
        </Flex.Row>
      </DemoBlock>

      <DemoBlock
        label='底部按钮'
        flexDirection='column'
        alignItems='stretch'
        style={{
          padding: 0,
          backgroundColor: '#F5F5F5',
        }}
      >
        <Skeleton.BottomButton />
      </DemoBlock>

      <DemoBlock
        label='底部双按钮'
        flexDirection='column'
        alignItems='stretch'
        style={{
          padding: 0,
          backgroundColor: '#F5F5F5',
        }}
      >
        <Skeleton.BottomTwoButton />
      </DemoBlock>
    </Layout>
  )
}
```

### 列表骨架屏
```javascript
import { Skeleton } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => {
  return (
    <Layout title='骨架屏' qrcode='components/tickling/skeleton/index'>
      <DemoBlock
        label='文本列表'
        flexDirection='column'
        alignItems='stretch'
        style={{
          backgroundColor: '#F5F5F5',
        }}
      >
        <Skeleton.TextList />
      </DemoBlock>

      <DemoBlock
        label='按钮列表'
        flexDirection='column'
        alignItems='stretch'
        style={{
          backgroundColor: '#F5F5F5',
        }}
      >
        <Skeleton.ButtonList />
      </DemoBlock>

      <DemoBlock
        label='图片列表'
        flexDirection='column'
        alignItems='stretch'
        style={{
          backgroundColor: '#F5F5F5',
        }}
      >
        <Skeleton.ImageList />
      </DemoBlock>
    </Layout>
  )
}
```

### 卡片骨架屏
```javascript
import { Skeleton } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => {
  return (
    <Layout title='骨架屏' qrcode='components/tickling/skeleton/index'>
      <DemoBlock
        label='通用卡片'
        flexDirection='column'
        alignItems='stretch'
        style={{
          backgroundColor: '#F5F5F5',
        }}
      >
        <Skeleton.GeneralCard />
      </DemoBlock>

      <DemoBlock
        label='宫格卡片'
        flexDirection='column'
        alignItems='stretch'
        style={{
          backgroundColor: '#F5F5F5',
        }}
      >
        <Skeleton.GridCard />
      </DemoBlock>

      <DemoBlock
        label='装卸货地址卡片'
        flexDirection='column'
        alignItems='stretch'
        style={{
          backgroundColor: '#F5F5F5',
        }}
      >
        <Skeleton.HandleAddressCard />
      </DemoBlock>

      <DemoBlock
        label='文章评论卡片'
        flexDirection='column'
        alignItems='stretch'
        style={{
          backgroundColor: '#F5F5F5',
        }}
      >
        <Skeleton.ArticleCommmentCard />
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Skeleton 组件

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| 未找到 Skeleton 组件的属性定义 | | | | |