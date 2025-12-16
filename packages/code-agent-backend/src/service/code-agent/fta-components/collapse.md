# Collapse 折叠面板

可以自定义渲染的折叠面板组件。

## 引用
```typescript
import { Collapse } from '@fta/components'
```

## 示例

### 基础使用
```tsx
import {
  Collapse,
  Flex,
  Line,
  List,
  ListItem,
  scale,
  Text,
  useCollapseVisible,
  useCollapseDisabled,
} from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React from 'react'
import './index.scss'

const CustomCollapseContent = () => {
  return (
    <Flex.Column>
      <View className='fta-demo-collapse-content'>
        <Text color='#666666' level={5}>
          汤之问棘也是已：穷发之北，有冥海者，天池也。有鱼焉，其广数千里，未有知其修者，其名为鲲。有鸟焉，其名为鹏，背若泰山，翼若垂天之云，抟扶摇羊角而上者九万里，绝云气，负青天，然后图南，且适南冥也。
        </Text>
      </View>
      <Line
        style={{
          marginLeft: scale(24),
        }}
      ></Line>
    </Flex.Column>
  )
}

const CustomListItemRenderer = (trigger: () => void) => {
  const visible = useCollapseVisible()
  const disabled = useCollapseDisabled()
  return <ListItem hasBorder disabled={disabled} onClick={trigger} title='标题名称' arrow={visible ? 'up' : 'down'} />
}

export default () => (
  <Layout title='折叠面板' qrcode='components/display/collapse/index'>
    <DemoBlock label='基础使用' bgColor='transparent' flexDirection='column'>
      <List plain>
        <Collapse
          value={['collapse-1']}
          onChange={(expandValue) => {
            console.log('collapse change: ', expandValue)
          }}
        >
          <Collapse.Item value='collapse-1'>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
          <Collapse.Item value='collapse-2'>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
          <Collapse.Item value='collapse-3'>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
        </Collapse>
      </List>
    </DemoBlock>

    <DemoBlock label='手风琴模式' bgColor='transparent' flexDirection='column'>
      <List plain>
        <Collapse
          value='collapse-1'
          useAccordion
          onChange={(expandValue) => {
            console.log('collapse change: ', expandValue)
          }}
        >
          <Collapse.Item value='collapse-1'>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
          <Collapse.Item value='collapse-2'>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
          <Collapse.Item value='collapse-3'>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
        </Collapse>
      </List>
    </DemoBlock>
  </Layout>
)
```

### 高级用法
```tsx
const CustomListItemCollapselessRenderer = (trigger: () => void) => {
  const visible = useCollapseVisible()
  const disabled = useCollapseDisabled()
  return (
    <ListItem
      hasBorder
      hoverless={visible}
      disabled={disabled}
      onClick={trigger}
      title='标题名称'
      arrow={visible ? 'up' : 'down'}
    />
  )
}

export default () => (
  <Layout title='折叠面板' qrcode='components/display/collapse/index'>
    <DemoBlock label='禁用' bgColor='transparent' flexDirection='column'>
      <List plain>
        <Collapse disabled useAccordion>
          <Collapse.Item value='collapse-1'>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
          <Collapse.Item value='collapse-2' disabled={false}>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
          <Collapse.Item value='collapse-3'>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
        </Collapse>
      </List>
    </DemoBlock>

    <DemoBlock label='展开后不可收起' bgColor='transparent' flexDirection='column'>
      <List plain>
        <Collapse useAccordion collapsible={false}>
          <Collapse.Item value='collapse-1'>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemCollapselessRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
          <Collapse.Item value='collapse-2'>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemCollapselessRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
          <Collapse.Item value='collapse-3'>
            <Collapse.Header>
              <Collapse.Trigger>{CustomListItemCollapselessRenderer}</Collapse.Trigger>
            </Collapse.Header>
            <Collapse.Content>
              <CustomCollapseContent />
            </Collapse.Content>
          </Collapse.Item>
        </Collapse>
      </List>
    </DemoBlock>
  </Layout>
)
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| controls | 是否是受控组件 | `boolean` | `false` | - |
| useAccordion | 是否开启手风琴模式 | `boolean` | `false` | - |
| value | 展开的值集合，默认不展开；手风琴模式时传入字符串 | `string \| Array` | `--` | - |
| collapsible | 打开后是否允许关闭 | `boolean` | `true` | - |
| disabled | 是否禁用，禁用后仍可通过 ref 进行操作 | `boolean` | `false` | - |
| children | 子元素 | `any` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onChange | 状态改变时的回调 | `(value: string[]) => void` | `--` | - |