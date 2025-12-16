# Grid 宫格

宫格可以在水平方向上把页面分隔成等宽度的区块，用于展示内容或进行页面导航。

## 引用
```tsx
import { Grid } from '@fta/components'
```

## 示例

### 基础使用
```tsx
import { Gap, Grid } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React from 'react'
import './index.scss'

const Span = ({ color }: { color: string }) => (
  <View className='demo-grid-span' style={{ backgroundColor: color }} />
)

export default () => (
  <Layout title='宫格' qrcode='components/layout/grid/index'>
    <DemoBlock label='基础使用'>
      <Grid>
        <Grid.Row columns={1}>
          <Grid.Item>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
        <Gap height={24} />
        <Grid.Row columns={2}>
          <Grid.Item>
            <Span color='#FFE2CC' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
        <Gap height={24} />
        <Grid.Row columns={3}>
          <Grid.Item>
            <Span color='#FFC699' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFE2CC' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
        <Gap height={24} />
        <Grid.Row columns={4}>
          <Grid.Item>
            <Span color='#FFA966' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFC699' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFE2CC' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
        <Gap height={24} />
        <Grid.Row columns={5}>
          <Grid.Item>
            <Span color='#FF8D33' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFA966' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFC699' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFE2CC' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
        <Gap height={24} />
        <Grid.Row columns={6}>
          <Grid.Item>
            <Span color='#fd3333' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FF8D33' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFA966' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFC699' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFE2CC' />
          </Grid.Item>
          <Grid.Item>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
      </Grid>
    </DemoBlock>

    <DemoBlock label='自定义栅格按钮'>
      <Grid>
        <Grid.Row columns={3}>
          <Grid.Item span={2}>
            <Span color='#FFE2CC' />
          </Grid.Item>
          <Grid.Item span={1}>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
        <Gap height={24} />
        <Grid.Row columns={3}>
          <Grid.Item span={1}>
            <Span color='#FFE2CC' />
          </Grid.Item>
          <Grid.Item span={2}>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
        <Gap height={24} />
        <Grid.Row columns={5}>
          <Grid.Item span={1}>
            <Span color='#FFC699' />
          </Grid.Item>
          <Grid.Item span={2}>
            <Span color='#FFE2CC' />
          </Grid.Item>
          <Grid.Item span={2}>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
      </Grid>
    </DemoBlock>

    <DemoBlock label='自定义栅格间隔'>
      <Grid gutter={24}>
        <Grid.Row columns={3}>
          <Grid.Item span={2}>
            <Span color='#FFE2CC' />
          </Grid.Item>
          <Grid.Item span={1}>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
        <Gap height={24} />
        <Grid.Row columns={3}>
          <Grid.Item span={1}>
            <Span color='#FFE2CC' />
          </Grid.Item>
          <Grid.Item span={2}>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
        <Gap height={24} />
        <Grid.Row columns={5}>
          <Grid.Item span={1}>
            <Span color='#FFC699' />
          </Grid.Item>
          <Grid.Item span={2}>
            <Span color='#FFE2CC' />
          </Grid.Item>
          <Grid.Item span={2}>
            <Span color='#FFF0E6' />
          </Grid.Item>
        </Grid.Row>
      </Grid>
    </DemoBlock>
  </Layout>
)
```

### 业务示例
```tsx
import { Flex, Gap, Grid, Icon, Text } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'
import './index.scss'

const Logo = ({ color }: { color: string }) => (
  <Flex.Center direction='column' style={{ width: '100%' }}>
    <Flex.Center className='demo-grid-logo' style={{ backgroundColor: color }}>
      <Icon color='#ffffff' value='CarTransportFilled' size={36} />
    </Flex.Center>
    <Gap height={12}></Gap>
    <Text level={6} color='#1a1a1a'>
      应用名称
    </Text>
  </Flex.Center>
)

export default () => (
  <Layout title='宫格' qrcode='components/layout/grid/index'>
    <DemoBlock label='业务示例'>
      <Grid>
        <Grid.Row columns={4}>
          <Grid.Item>
            <Logo color='#fd3333' />
          </Grid.Item>
          <Grid.Item>
            <Logo color='#1FB080' />
          </Grid.Item>
          <Grid.Item>
            <Logo color='#1A6FFF' />
          </Grid.Item>
          <Grid.Item>
            <Logo color='#FFB200' />
          </Grid.Item>
        </Grid.Row>
      </Grid>
    </DemoBlock>
  </Layout>
)
```

## API

### Grid Props

| 属性名   | 描述           | 类型     | 默认值 | 版本   |
|----------|----------------|----------|--------|--------|
| columns  | 列数           | `number` | `--`   |        |
| gutter   | 栅格横向间隔   | `number` | `--`   | 1.1.3  |
| children | 子元素         | `any`    | `--`   |        |

### Grid.Row Props

| 属性名   | 描述     | 类型     | 默认值 | 版本 |
|----------|----------|----------|--------|------|
| columns  | 列数     | `number` | `--`   |      |
| children | 子元素   | `any`    | `--`   |      |

### Grid.Item Props

| 属性名   | 描述     | 类型     | 默认值 | 版本 |
|----------|----------|----------|--------|------|
| span     | 占据列数 | `number` | `--`   |      |
| children | 子元素   | `any`    | `--`   |      |