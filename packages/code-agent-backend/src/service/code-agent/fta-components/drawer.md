```markdown
# Drawer 抽屉

抽屉组件，用于从屏幕一侧滑出的面板，常用于菜单、设置等场景。

## 引用
```tsx
import { Drawer } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { Drawer } from '@fta/components'
import {
  Button,
  DemoBlock,
  Layout,
  List,
  ListItem,
} from '@fta/components/common/display'
import React, { Component } from 'react'
import './index.scss'

const upperCase = (str: string) => str[0].toUpperCase() + str.slice(1)

interface DrawerPageState {
  showLeft: boolean
  showRight: boolean
  showNoMask: boolean
  showMenu: boolean
}

export default class AtCurtainPage extends Component<unknown, DrawerPageState> {
  public state: DrawerPageState = {
    showLeft: true,
    showRight: false,
    showNoMask: false,
    showMenu: false,
  }

  public toggleShow = (direction: unknown, visible = true) => {
    this.setState({
      [`show${upperCase(direction as 'left' | 'right')}`]: visible,
    } as unknown as DrawerPageState)
  }

  public onItemClick = (index: number) => {
    console.log('选择的菜单索引：' + index)
  }

  public render() {
    const { showLeft, showRight, showNoMask, showMenu } = this.state
    return (
      <>
        <Layout title='抽屉' qrcode='components/tickling/drawer/index'>
          <DemoBlock label='基础使用' pure>
            <List>
              <ListItem
                title='从左边划出'
                onClick={() => this.toggleShow('left')}
              />
              <ListItem
                title='从右边划出'
                onClick={() => this.toggleShow('right')}
              />
              <ListItem
                title='无背景蒙层'
                onClick={() => this.toggleShow('noMask')}
              />
              <ListItem
                title='内置菜单列表'
                onClick={() => this.toggleShow('menu')}
              />
            </List>
          </DemoBlock>
        </Layout>

        <Drawer
          keepAlive
          show={showLeft}
          onClose={() => this.toggleShow('left', false)}
        />

        <Drawer
          show={showRight}
          right
          onClose={() => this.toggleShow('right', false)}
        />

        <Drawer show={showNoMask} mask={false}>
          <Button onClick={() => this.toggleShow('noMask', false)}>
            关闭抽屉
          </Button>
        </Drawer>

        <Drawer
          show={showMenu}
          items={['菜单1', '菜单2']}
          onClose={() => this.toggleShow('menu', false)}
          onItemClick={this.onItemClick}
        />
      </>
    )
  }
}
```

## API

### Props

| 属性名         | 描述                     | 类型                        | 默认值     | 版本   |
|----------------|--------------------------|-----------------------------|------------|--------|
| show           | 展示或隐藏               | `boolean`                   | (必选)     | -      |
| mask           | 是否需要遮罩             | `boolean`                   | `true`     | -      |
| width          | 抽屉宽度                 | `string \| number`          | `"230px"`  | -      |
| right          | 是否从右侧滑出           | `boolean`                   | `false`    | -      |
| items          | 菜单列表                 | `string[]`                  | `--`       | -      |
| useNativeModal | RN端使用原生Modal组件    | `boolean`                   | `true`     | -      |
| modalProps     | 透传给原生Modal组件的属性 | `{}`                        | `--`       | 1.2.0  |
| safeArea       | 安全区props              | `{ className?: string; style?: ... }` | `--` | 1.2.1  |
| keepAlive      | [小程序/H5]是否缓存内部children | `boolean`              | `--`       | -      |

### Events

| 属性名       | 描述                             | 类型                   | 默认值 | 版本 |
|--------------|----------------------------------|------------------------|--------|------|
| onItemClick  | 点击菜单时触发                   | `(index: number) => void` | `--`  | -    |
| onClose      | 动画结束组件关闭的时候触发       | `() => void`           | `--`  | -    |
```