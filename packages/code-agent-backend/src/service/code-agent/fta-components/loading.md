# Loading 加载中

加载中图标

## 引用
```tsx
import { Loading } from '@fta/components'
```

## 示例

### 加载中

#### 基础演示

```tsx
import { Flex, Gap, Loading, Text } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { Assets } from '@fta/components/components/loading/assets'
import Taro from '@tarojs/taro'
import React from 'react'
import './index.scss'

interface LoadingPageState {
  isOpened: boolean
}

class LoadingDemo extends React.Component<object, LoadingPageState> {
  public config: Taro.PageConfig = {}

  public constructor(props: any) {
    super(props)
    this.state = {
      isOpened: true,
    }
  }

  public render(): JSX.Element {
    return (
      <>
        <DemoBlock label='不同尺寸' justifyContent='space-around'>
          <Loading size='small' />
          <Loading size='medium' />
          <Loading size='large' />
        </DemoBlock>

        <DemoBlock label='自定义颜色' justifyContent='space-around'>
          <Loading color='#13CE66' />
          <Loading color='#FF4949' />
          <Loading color='#C9C9C9' />
        </DemoBlock>

        <DemoBlock label='自定义缓动函数' justifyContent='space-around'>
          <Loading easing='ease' />
          <Loading easing='ease-out' />
          <Loading easing={[0.5, 0, 0, 1]} />
        </DemoBlock>

        <DemoBlock label='自定义缓动时长' justifyContent='space-around'>
          <Loading easing='ease' duration={2} />
          <Loading easing='ease-out' duration={3} />
          <Loading easing={[0.5, 0, 0, 1]} duration={4} />
        </DemoBlock>

        <DemoBlock
          label='自定义图片/运动曲线/样式/持续时间'
          justifyContent='space-around'
        >
          <Loading useImage />
          <Loading useImage src={Assets.dt} />
          <Loading useImage src={Assets.dt} duration={3} />
          <Loading useImage src={Assets.dt} />
          <Loading useImage easing='ease-in' />
          <Loading useImage circle />
        </DemoBlock>

        <DemoBlock label='带文字' justifyContent='space-around'>
          <Flex.Center direction='row'>
            <Loading
              useImage
              size='medium'
              src={Assets.orange}
              __thresh_enabled__
            />
            <Gap width={12}></Gap>
            <Text level={5} color='#999999'>
              加载中...
            </Text>
          </Flex.Center>
        </DemoBlock>
      </>
    )
  }
}

export default function () {
  return (
    <Layout title='加载中' qrcode='components/tickling/loading/index'>
      <LoadingDemo />
    </Layout>
  )
}
```

### 加载页

```tsx
import { Layout, Loading } from '@fta/components'
import React, { useEffect, useState } from 'react'

export default () => {
  const [vertical, setVertical] = useState(true)

  useEffect(() => {
    setTimeout(() => {
      setVertical(true)
    }, 10000)
  }, [])

  return (
    <Layout
      title={{ title: '点我切换加载页', handler: () => setVertical((v) => !v) }}
      scrollable={false}
      wrapperStyle={{ flex: 1 }}
    >
      <Loading.Page visible vertical={vertical} />
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| duration | 周期动画时间，单位秒 | `number` | `1` | - |
| circle | 圆形 | `boolean` | `false` | - |
| easing | 动画曲线 | `BaseEasing \| CubicEasing` | `"linear"` | - |
| useImage | 是否使用图片素材 | `boolean` | `false` | - |
| size | loading大小 | `number \| 'small' \| 'medium' \| 'large'` | `"medium"` | - |
| src | loading图片，在useImage为true时生效 | `string` | `--` | - |
| color | 颜色，当为图片类型时不可用 | `string` | `--` | - |
| tintColor | 在安卓系统中实现该loading组件，需传入当前loading所在的背景色 | `string` | `"#fff"` | - |
| stop | 是否静止状态 | `boolean` | `false` | - |