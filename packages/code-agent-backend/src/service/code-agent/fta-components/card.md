# Card 卡片

用于展示文字、列表、图片等信息，通用卡片容器。

## 引用
```tsx
import { Card } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { Card, Icon, Text } from '@fta/components'
import { DemoBlock, Layout, warn } from '@fta/components/common/display'
import React from 'react'
import './index.scss'

export default () => {
  const onHeaderClick = () => warn('点击了标题行')

  return (
    <Layout title="基础使用" qrcode="components/layout/card/index">
      <DemoBlock label="基础用法" bgColor="#f5f5f5">
        <Card title="卡片标题" titleBorder>
          卡片内容
        </Card>
      </DemoBlock>

      <DemoBlock label="右边区域" bgColor="#f5f5f5">
        <Card
          title="卡片标题"
          extra={<Text className="rightExtra">编辑</Text>}
        />
      </DemoBlock>

      <DemoBlock label="标题行可点击" bgColor="#f5f5f5">
        <Card
          title="卡片标题"
          onHeaderClick={onHeaderClick}
          extra={<Icon value="RightOutlined" color="#cccccc" size={28} />}
        />
      </DemoBlock>

      <DemoBlock label="自定义卡片样式" bgColor="#f5f5f5">
        <Card title="卡片标题" titleStyle={{ color: '#ff871e' }}></Card>
      </DemoBlock>
    </Layout>
  )
}
```

### 业务演示

```tsx
import {
  Button,
  Card,
  Flex,
  Gap,
  Icon,
  Line,
  List,
  ListItem,
  scale,
  Text,
} from '@fta/components'
import { DemoBlock, Layout, warn } from '@fta/components/common/display'
import { Image } from '@tarojs/components'
import React from 'react'
import './index.scss'

export default () => {
  const onHeaderClick = () => warn('点击了标题行')

  return (
    <Layout title='组合场景' qrcode='components/layout/card/index'>
      <DemoBlock label='基础卡片' bgColor='#f5f5f5'>
        <Card
          titleBorder
          title={
            <Flex.Center direction='row'>
              <Text level={4} color='#fd3333'>*</Text>
              <Text level={4} color='#1a1a1a' weight={500}>卡片标题</Text>
              <Gap width={8}></Gap>
              <Text level={6} color='#999999'>辅助信息文本</Text>
            </Flex.Center>
          }
          extra={
            <Button
              theme='#999999'
              textLevel={5}
              type='text'
              suffix={<Icon value='RightOutlined' color='#999999' size={28} />}
            >
              按钮
            </Button>
          }
        >
          <Gap height={136} />
          <Line color='#e8e8e8' />
          <Flex.Row
            alignItems='center'
            justifyContent='space-between'
            style={{ padding: scale(24) }}
          >
            <Text level={5} color='#666666'>更多</Text>
            <Flex.Row>
              <Button type='secondary' size='medium'>按钮</Button>
              <Gap width={12} />
              <Button type='secondary' size='medium'>按钮</Button>
              <Gap width={12} />
              <Button type='secondary' size='medium'>按钮</Button>
            </Flex.Row>
          </Flex.Row>
        </Card>
      </DemoBlock>

      <DemoBlock label='描述卡片' bgColor='#f5f5f5'>
        <Card
          titleBorder
          title={
            <Flex.Center direction='row'>
              <Text level={4} color='#fd3333'>*</Text>
              <Text level={4} color='#1a1a1a' weight={500}>卡片标题</Text>
              <Gap width={8}></Gap>
              <Text level={6} color='#999999'>辅助信息文本</Text>
            </Flex.Center>
          }
          extra={
            <Button
              theme='#999999'
              textLevel={5}
              type='text'
              suffix={<Icon value='RightOutlined' color='#999999' size={28} />}
            >
              按钮
            </Button>
          }
        >
          <Flex.Column justifyContent='center' style={{ padding: scale(24) }}>
            <Flex.Row justifyContent='space-between' style={{ width: '100%' }}>
              <Text color='#666666' level={5}>标题名称</Text>
              <Text color='#1a1a1a' level={5}>此处是描述文本</Text>
            </Flex.Row>
            <Flex.Row justifyContent='space-between' style={{ width: '100%' }}>
              <Text color='#666666' level={5}>标题名称</Text>
              <Text color='#1a1a1a' level={5}>此处是描述文本</Text>
            </Flex.Row>
          </Flex.Column>
          <Line color='#e8e8e8' />
          <Flex.Row
            alignItems='center'
            justifyContent='space-between'
            style={{ padding: scale(24) }}
          >
            <Text level={5} color='#666666'>更多</Text>
            <Flex.Row>
              <Button type='secondary' size='medium'>按钮</Button>
              <Gap width={12} />
              <Button type='secondary' size='medium'>按钮</Button>
              <Gap width={12} />
              <Button type='secondary' size='medium'>按钮</Button>
            </Flex.Row>
          </Flex.Row>
        </Card>
      </DemoBlock>

      <DemoBlock label='图标卡片' bgColor='#f5f5f5'>
        <List
          hasBorder={false}
          style={{ backgroundColor: '#f5f5f5' }}
          itemStyle={{ borderRadius: scale(16), backgroundColor: '#ffffff' }}
          plain
        >
          <ListItem
            title='标题名称'
            note='此处是描述文本此处是描述文本此处是描述文本此处是描述文本'
            arrow={<Button size='medium'>按钮</Button>}
          />
          <Gap height={24} bgColor='#f5f5f5' />
          <ListItem
            title='标题名称'
            note='此处是描述文本此处是描述文本此处是描述文本此处是描述文本'
          />
          <Gap height={24} bgColor='#f5f5f5' />
          <ListItem
            title={
              <Flex.Row alignItems='center'>
                <Icon value='ClassifyOutlined' size={32} color='#fd3333' />
                <Gap width={8} />
                <Text color='#1a1a1a' size={30}>标题名称</Text>
              </Flex.Row>
            }
            note='此处是描述文本此处是描述文本此处是描述文本此处是描述文本'
          />
        </List>
      </DemoBlock>

      <DemoBlock label='图片卡片' bgColor='#f5f5f5'>
        <List
          hasBorder={false}
          style={{ backgroundColor: '#f5f5f5', width: '100%' }}
          itemStyle={{ borderRadius: scale(16), backgroundColor: '#ffffff' }}
          plain
        >
          <ListItem
            thumb={
              <Image
                style={{
                  height: scale(72),
                  width: scale(72),
                  flexBasis: scale(72),
                  marginRight: scale(12),
                  borderRadius: scale(12),
                }}
                src='https://imagecdn.ymm56.com/ymmfile/static/resource/47cf25c4-24d7-40d8-a7d0-711fe480b800.jpg'
              />
            }
            title='标题名称'
            note='此处是描述文本'
            arrow={<Button size='medium'>按钮</Button>}
          />
          <Gap height={24} bgColor='#f5f5f5' />
          <ListItem
            thumb={
              <Image
                style={{
                  height: scale(72),
                  width: scale(72),
                  flexBasis: scale(72),
                  marginRight: scale(12),
                  borderRadius: scale(12),
                }}
                src='https://imagecdn.ymm56.com/ymmfile/static/resource/47cf25c4-24d7-40d8-a7d0-711fe480b800.jpg'
              />
            }
            title='标题名称'
            note='此处是描述文本'
          />
        </List>
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| title | 标题 | `ReactNode` | `--` | - |
| titleClassName | 标题样式类名 | `string` | `--` | - |
| titleStyle | 标题内联样式 | `{}` | `--` | - |
| extra | 右边区域内容 | `ReactNode` | `--` | - |
| titleBorder | 是否显示标题下方分割线 | `boolean` | `--` | - |
| children | 卡片内容 | `ReactNode` | `--` | - |
| footer | 自定义底部区域 | `ReactNode` | `--` | 1.2.1 |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onHeaderClick | 标题行点击事件 | `(event: any) => void` | `--` | - |