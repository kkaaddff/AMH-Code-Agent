```markdown
# Tag 标签

用于展示 1 个或多个文字标签。

## 引用
```tsx
import { Tag } from '@fta/components'
```

## 示例

### 基本演示
```tsx
import { Icon, scale, Tag } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { Image, Text } from '@tarojs/components'
import React from 'react'
import './index.scss'

function TagDemo() {
  return (
    <>
      <DemoBlock label='基础标签'>
        <Tag
          color='#fff'
          bgColor='#fd3333'
          style={{
            marginRight: scale(24),
          }}
        >
          标签
        </Tag>
        <Tag
          color='#fd3333'
          bgColor='#FFF0E6'
          borderColor='#FFF0E6'
          style={{
            marginRight: scale(24),
          }}
        >
          标签
        </Tag>
        <Tag
          color='#fd3333'
          bgColor='#fff'
          style={{
            marginRight: scale(24),
          }}
        >
          标签
        </Tag>
        <Tag
          color='#999'
          style={{
            marginRight: scale(24),
            backgroundColor: 'rgba(153,153,153,0.1)',
            borderColor: 'rgba(153,153,153,0.1)',
          }}
        >
          标签
        </Tag>
        <Tag color='#999' bgColor='#fff' borderColor='#999'>
          标签
        </Tag>
      </DemoBlock>

      <DemoBlock label='标签尺寸'>
        <Tag
          size='small'
          color='#fff'
          bgColor='#fd3333'
          style={{
            marginRight: scale(24),
            alignSelf: 'flex-end',
          }}
        >
          小号标签
        </Tag>
        <Tag
          color='#fff'
          bgColor='#fd3333'
          style={{
            marginRight: scale(24),
            alignSelf: 'flex-end',
          }}
        >
          默认标签
        </Tag>
        <Tag
          size='large'
          color='#fff'
          bgColor='#fd3333'
          style={{
            marginRight: scale(24),
          }}
        >
          大号标签
        </Tag>
      </DemoBlock>

      <DemoBlock label='自定义节点'>
        <Tag
          color='#fd3333'
          bgColor='#fff'
          style={{
            marginRight: scale(24),
          }}
        >
          <Icon value='SendOutlined' color='#fd3333' />
          <Text style={{ color: '#fd3333', fontSize: scale(24) }}>标签</Text>
        </Tag>
        <Tag
          color='#fd3333'
          bgColor='#FFF0E6'
          borderColor='#FFF0E6'
          style={{
            marginRight: scale(24),
          }}
        >
          <Icon value='StarFilled' color='#fd3333' />
          <Text style={{ color: '#fd3333', fontSize: scale(24) }}>标签</Text>
        </Tag>
        <Tag
          color='#fff'
          bgColor='#fd3333'
          style={{
            marginRight: scale(24),
          }}
        >
          <Icon value='HeartFilled' color='#fff' />
          <Text style={{ color: '#fff', fontSize: scale(24) }}>标签</Text>
        </Tag>
      </DemoBlock>

      <DemoBlock label='自定义图标'>
        <Tag
          color='#fd3333'
          bgColor='#fff'
          style={{
            marginRight: scale(24),
          }}
          prefix={<Icon value='SendOutlined' color='#fd3333' />}
        >
          标签
        </Tag>
        <Tag
          color='#fd3333'
          bgColor='#fff'
          style={{
            marginRight: scale(24),
          }}
          suffix={<Icon value='SendOutlined' color='#fd3333' />}
        >
          标签
        </Tag>
      </DemoBlock>

      <DemoBlock label='自定义标签'>
        <Tag
          color='#1A6FFF'
          bgColor='#fff'
          borderColor='#1A6FFF'
          style={{
            marginRight: scale(24),
            borderRadius: scale(16),
          }}
        >
          标签
        </Tag>
        <Tag
          color='#FF3333'
          bgColor='#FFEBEB'
          borderColor='#FFEBEB'
          style={{
            marginRight: scale(24),
            borderTopLeftRadius: scale(16),
            borderBottomLeftRadius: scale(16),
            borderTopRightRadius: 0,
            borderBottomRightRadius: 0,
          }}
        >
          标签
        </Tag>
        <Tag
          color='#fff'
          bgColor='#1FB080'
          borderColor='#1FB080'
          style={{
            marginRight: scale(24),
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: scale(12),
            borderTopRightRadius: scale(12),
            borderBottomRightRadius: 0,
          }}
        >
          标签
        </Tag>
        <Image
          src='https://imagecdn.ymm56.com/ymmfile/static/resource/646c7b8c-e04b-4db8-81db-3154fa7b34bc.png'
          style={{ width: scale(107), height: scale(32) }}
        />
      </DemoBlock>
    </>
  )
}

export default () => (
  <Layout title='标签' qrcode='components/tickling/tag/index'>
    <TagDemo />
  </Layout>
)
```

## API

### Props

| 属性名     | 描述         | 类型                          | 默认值     | 版本   |
|------------|--------------|-------------------------------|------------|--------|
| type       | 标签类型     | `"warning" \| "primary" \| "info"` | `--`       |        |
| color      | 文字颜色     | `string`                      | `--`       |        |
| bgColor    | 背景色       | `string`                      | `--`       |        |
| borderColor| 边框色       | `string`                      | `--`       |        |
| border     | 是否显示边框 | `boolean`                     | `true`     |        |
| size       | 标签大小     | `"small" \| "large" \| "middle"` | `"middle"` | 1.0.8  |
| prefix     | 前缀节点     | `any`                         | `--`       | 1.2.4  |
| suffix     | 后缀节点     | `any`                         | `--`       | 1.2.4  |
| textStyle  | 文本样式     | `{}`                          | `--`       |        |
| children   | 子元素       | `any`                         | `--`       |        |

### Events

| 属性名  | 描述               | 类型   | 默认值 | 版本 |
|---------|--------------------|--------|--------|------|
| onClick | 手指触摸后马上离开 | `(event: ...)` | `--`   |      |
```