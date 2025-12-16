# Timeline 时间轴

垂直展示的时间流信息。当有一系列信息需按时间排列时，可正序和倒序。需要有一条时间轴进行视觉上的串联时。

## 引用
```tsx
import { Timeline, TimelineItem } from '@fta/components'
```

## 示例

### 基本演示

```tsx
import { Flex, Gap, ListItem, scale, Text, Timeline, Toggle } from '@fta/components'
import { DemoBlock, Layout, List } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React, { useState } from 'react'
import './index.scss'

const Dot = ({ status }: { status: 'done' | 'progress' | 'todo' }) => {
  return (
    <Flex.Center className={`fta-demo-timeline-dot fta-demo-timeline-dot--${status}`}>
      <View className={`fta-demo-timeline-dot__inner fta-demo-timeline-dot__inner--${status}`} />
    </Flex.Center>
  )
}

const TimelineDemo = () => {
  const [reverse, setReverse] = useState(false)

  return (
    <>
      <DemoBlock label='基础用法' style={{ lineHeight: 0 }} flexDirection='column'>
        <List
          hoverless
          style={{ margin: 0, width: '100%' }}
          itemStyle={{ paddingTop: scale(21), paddingBottom: scale(21) }}
        >
          <ListItem
            title='节点排序(正序/逆序)'
            arrow={<Toggle activeText='逆' inactiveText='正' controls={false} onChange={(active) => { setReverse(active) }} />}
          />
        </List>

        <Gap height={24} />

        <Timeline reverse={reverse}>
          <Timeline.Item lineColor={reverse ? 'transparent' : ''} icon={<Dot status='todo' />}>
            <Text level={5} color='#666666' className='timeline-text'>
              已取件
            </Text>
            <Gap height={48} />
          </Timeline.Item>

          <Timeline.Item icon={<Dot status='todo' />}>
            <Text level={5} color='#666666' className='timeline-text'>
              待取件
            </Text>
            <Gap height={48} />
          </Timeline.Item>

          <Timeline.Item icon={<Dot status='progress' />}>
            <Text level={5} weight={500} color='#fd3333' className='timeline-text'>
              派送中
            </Text>
            <Gap height={48} />
          </Timeline.Item>

          <Timeline.Item icon={<Dot status='done' />} lineColor='#fd3333'>
            <Text level={5} weight={500} color='#1a1a1a' className='timeline-text'>
              运输中
            </Text>
            <Gap height={48} />
          </Timeline.Item>

          <Timeline.Item lineColor={reverse ? '#fd3333' : 'transparent'} icon={<Dot status='done' />}>
            <Text level={5} weight={500} color='#1a1a1a' className='timeline-text'>
              满运快递已揽收
            </Text>
            <View style={{ marginTop: scale(8) }}>
              <Text level={6} color='#666666' className='timeline-text'>
                满小宝将为您的包裹保驾护航
              </Text>
            </View>
          </Timeline.Item>
        </Timeline>
      </DemoBlock>
    </>
  )
}

export default () => (
  <Layout title='时间轴' qrcode='components/display/timeline/index'>
    <TimelineDemo />
  </Layout>
)
```

## API

### Timeline Props

| 属性名   | 描述       | 类型      | 默认值  | 版本 |
|----------|------------|-----------|---------|------|
| reverse  | 节点排序   | `boolean` | `false` | -    |

### TimelineItem Props

| 属性名      | 描述                   | 类型                     | 默认值         | 版本     |
|-------------|------------------------|--------------------------|----------------|----------|
| color       | 小圆点背景色           | `string`                 | -              | -        |
| hollow      | 小圆点是否空心         | `boolean`                | `false`        | -        |
| icon        | 自定义节点，默认为小圆点 | `ReactNode`              | -              | -        |
| lineColor   | 线条颜色               | `string`                 | `"#cccccc"`    | 1.0.14   |
| itemStyle   | 每个 item 容器的样式   | `{}`                     | -              | 1.10.11  |
| lineStyle   | 线条样式               | `"dashed" \| "dotted" \| "solid"` | -       | 1.10.11  |