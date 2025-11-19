# List 列表

提供常见的 List 组件，帮助使用者快速搭建列表。

## 引用
```tsx
import { List, ListItem } from '@fta/components'
```

## 示例

```tsx
import { ErrorTip, List, ListItem, scale, Text } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { Image } from '@tarojs/components'
import React from 'react'
import './index.scss'

export default function ListDemo() {
  return (
    <Layout title='列表' qrcode='components/display/list/index'>
      <DemoBlock label='基础类' pure>
        <List onItemClick={({ title }) => console.log('click item:' + title)}>
          <ListItem title='标题名称' extraText='请选择' arrow required />
          <ListItem
            title='标题名称'
            extraText={
              <Text size={28} color='#1a1a1a' style={{ marginRight: scale(8) }}>
                {'已选择'}
              </Text>
            }
            arrow
          />
          <ListItem title='标题名称' extraText='禁用状态' disabled arrow />
          <ListItem
            title='标题名称'
            extraText='请选择'
            arrow
            suffix={<ErrorTip text='错误提示文案' />}
          />
        </List>
      </DemoBlock>

      <DemoBlock label='功能类' pure>
        <List>
          <ListItem
            title='标题名称 + 提示信息 + 辅助文本'
            extraText='请选择'
            note='辅助文本'
            arrow
          />
          <ListItem
            arrow
            title='标题名称 + 提示信息 + 辅助文本'
            note='辅助文本'
            extraThumb='https://image.ymm56.com/ymmfile/operation-biz/9b57a951-7a48-42db-8181-029725d7f9fc.png'
          />
          <ListItem
            arrow
            extraText='请选择'
            title='标题名称 + 图片'
            note='辅助文本'
            thumb={
              <Image
                style={{
                  height: scale(72),
                  width: scale(72),
                  marginRight: scale(12),
                  borderRadius: scale(12),
                }}
                src='https://imagecdn.ymm56.com/ymmfile/static/resource/47cf25c4-24d7-40d8-a7d0-711fe480b800.jpg'
              />
            }
          />
          <ListItem
            arrow
            title='标题名称'
            extraText='请选择'
            iconInfo={{ value: 'EditOutlined' }}
          />
          <ListItem
            arrow
            title='标题名称 + 图标'
            note='辅助文本'
            extraText='请选择'
            iconInfo={{ value: 'EditOutlined' }}
            hasBorder={false}
          />
        </List>
      </DemoBlock>

      <DemoBlock label='扩展类' pure>
        <List>
          <ListItem
            required
            arrow
            title={
              <Text size={30} color='#1a1a1a' weight={500}>
                自定义标题
              </Text>
            }
            extraText={
              <Text size={30} color='#1a1a1a' weight={500}>
                自定义内容
              </Text>
            }
          />
        </List>
      </DemoBlock>
    </Layout>
  )
}
```

## API

### List Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| component | 渲染根节点 | `unknown` | `"View"` | 1.0.10 |
| plain | 对子节点不做处理（默认会对子节点做克隆处理） | `boolean` | `false` | 1.0.15 |
| itemClassName | item样式 | `string` | `--` | 1.0.10 |
| itemStyle | item样式 | `{}` | `--` | 1.0.10 |
| hasBorder | 是否有边框 | `boolean` | `true` | - |
| disabled | 是否禁用 | `boolean` | `false` | - |
| arrow | 箭头的方向，v1.0.14+ 可传入自定义节点 | `ListItemArrowValue \| ReactElement` | `--` | - |
| hoverless | 是否取消激活效果 | `boolean` | `false` | 1.0.14 |
| theme | 主题色 | `string` | `--` | 1.3.0 |
| titleClassName | 标题类名 | `string` | `--` | 1.2.2 |
| titleStyle | 标题样式 | `{}` | `--` | 1.2.2 |
| extraTextClassName | 额外文本类名 | `string` | `--` | 1.2.2 |
| extraTextStyle | 额外文本样式 | `{}` | `--` | 1.2.2 |
| noteClassName | 描述信息类名 | `string` | `--` | 1.2.2 |
| noteStyle | 描述信息样式 | `{}` | `--` | 1.2.2 |
| containerStyle | 容器样式 | `{}` | `--` | 1.9.0 |
| contentStyle | 内容样式 | `{}` | `--` | 1.9.0 |
| children | 子元素 | `any` | `--` | - |

### List Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onItemClick | 子项点击回调 | `(data: { title: any; value: any; ... }) => void` | `--` | - |

---

### ListItem Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| note | 元素的描述信息 | `string \| ReactElement` | `--` | - |
| title | 元素的标题 | `string \| ReactElement` | `--` | - |
| thumb | 元素的主要缩略图，可自定义节点 | `string \| ReactElement` | `--` | - |
| extraText | 额外信息的文本 | `string \| ReactElement` | `--` | - |
| extraThumb | 额外信息的缩略图 | `string` | `--` | - |
| iconInfo | icon 信息 | `IconWithValueProps \| IconWithInfoProps` | `--` | - |
| value | 当前项绑定的值 | `any` | `--` | 1.0.10 |
| required | 表单态是否必填项 | `boolean \| ReactElement` | `false` | 1.1.0 |
| children | 自定义渲染底部节点 | `ReactNode` | `--` | - |
| suffix | 自定义渲染底部内容 | `ReactNode` | `--` | 1.0.14 |
| titleClassName | 标题类名 | `string` | `--` | 1.2.2 |
| titleStyle | 标题样式 | `{}` | `--` | 1.2.2 |
| extraTextClassName | 额外文本类名 | `string` | `--` | 1.2.2 |
| extraTextStyle | 额外文本样式 | `{}` | `--` | 1.2.2 |
| noteClassName | 描述信息类名 | `string` | `--` | 1.2.2 |
| noteStyle | 描述信息样式 | `{}` | `--` | 1.2.2 |
| containerStyle | 容器样式 | `{}` | `--` | 1.9.0 |
| contentStyle | 内容样式 | `{}` | `--` | 1.9.0 |
| theme | 主题色 | `string` | `--` | 1.3.0 |
| disabled | 是否禁用 | `boolean` | `false` | - |
| arrow | 箭头的方向，v1.0.14+ 可传入自定义节点 | `ListItemArrowValue \| ReactElement` | `--` | - |
| hasBorder | 是否有边框 | `boolean` | `true` | - |
| hoverless | 是否取消激活效果 | `boolean` | `false` | 1.0.14 |

### ListItem Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onClick | 用户点击元素触发的事件 | `(event: MouseEvent \| TouchEvent) => void` | `--` | - |