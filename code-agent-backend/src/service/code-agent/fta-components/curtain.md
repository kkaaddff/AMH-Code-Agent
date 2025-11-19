# Curtain 幕帘

幕帘组件，可以用来放置广告提示内容。

## 引用
```tsx
import { Curtain } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { Curtain } from '@fta/components'
import { DemoBlock, Layout, List, ListItem } from '@fta/components/common/display'
import { Image } from '@tarojs/components'
import React, { Component } from 'react'
import './index.scss'

const curtainPic = 'https://image.ymm56.com/ymmfile/operation-biz/038fa645-6626-4716-a7ae-504ddc0e7087.png'

const upperCase = (str: string) => str[0].toUpperCase() + str.slice(1)
const hydrate = (str: string) => str.split('-').map(upperCase).join('')

interface CurtainPageState {
  visibleTopLeft: boolean
  visibleTopRight: boolean
  visibleTop: boolean
  visibleBottom: boolean
  visibleBottomLeft: boolean
  visibleBottomRight: boolean
}

export default class CurtainPage extends Component<unknown, CurtainPageState> {
  public state: CurtainPageState = {
    visibleTopLeft: true,
    visibleTopRight: false,
    visibleTop: false,
    visibleBottom: false,
    visibleBottomLeft: false,
    visibleBottomRight: false,
  }

  public onToggle = (key: keyof CurtainPageState, visible = true) => {
    console.log('toggle visible: ' + visible)
    this.setState({ [key]: visible } as unknown as CurtainPageState)
  }

  public renderCurtain(position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top' | 'bottom') {
    const visibleKey = `visible${hydrate(position)}` as keyof CurtainPageState
    return (
      <Curtain
        isOpened={this.state[visibleKey]}
        onClose={() => this.onToggle(visibleKey, false)}
        closeBtnPosition={position}
      >
        <Image className="demo-curtain-image" mode="aspectFit" src={curtainPic} />
      </Curtain>
    )
  }

  public render() {
    return (
      <>
        <Layout title="幕帘" qrcode="components/tickling/curtain/index">
          <>
            <DemoBlock label="基础使用" pure>
              <List>
                <ListItem title="左上关闭幕帘" onClick={() => this.onToggle('visibleTopLeft')} />
                <ListItem title="右上关闭幕帘" onClick={() => this.onToggle('visibleTopRight')} />
                <ListItem title="顶部关闭幕帘" onClick={() => this.onToggle('visibleTop')} />
                <ListItem title="底部关闭幕帘" onClick={() => this.onToggle('visibleBottom')} />
                <ListItem title="左下关闭幕帘" onClick={() => this.onToggle('visibleBottomLeft')} />
                <ListItem title="右下关闭幕帘" onClick={() => this.onToggle('visibleBottomRight')} />
              </List>
            </DemoBlock>
          </>
        </Layout>
        {this.renderCurtain('top-left')}
        {this.renderCurtain('top-right')}
        {this.renderCurtain('bottom-left')}
        {this.renderCurtain('bottom-right')}
        {this.renderCurtain('top')}
        {this.renderCurtain('bottom')}
      </>
    )
  }
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|-------|------|------|--------|------|
| isOpened | 是否开启 | `boolean` | `false` | - |
| closeBtnPosition | 关闭图标位置：'top', 'top-left', 'top-right', 'bottom', 'bottom-left', 'bottom-right' | `"top" \| "bottom" \| "top-left" \| "top-right" \| "bottom-left" \| "bottom-right"` | `"bottom"` | - |

### Events

| 事件名 | 描述 | 类型 | 必选 | 版本 |
|--------|------|------|------|------|
| onClose | 点击关闭按钮触发事件 | `(event: any) => void` | 是 | - |