# Toast 轻提示

## 引用
```tsx
import { Toast } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { Icon, useToast, withLayer } from '@fta/components'
import { DemoBlock, Layout, List, ListItem } from '@fta/components/common/display'
import React from 'react'
import './index.scss'

export default withLayer(
  () => {
    const [toast1, toastInstance1] = useToast({
      title: '提示内容文字',
      duration: 0,
      clickMaskOnClose: true,
      mask: true,
    })

    const [toast2, toastInstance2] = useToast({
      title: '加载中...',
      clickMaskOnClose: true,
      loading: true,
      mask: true,
    })

    const [toast3, toastInstance3] = useToast({
      title: '正在处理中...',
      duration: 0,
      clickMaskOnClose: true,
      icon: <Icon value='ClockFilled' color='#fff' size={36} />,
      mask: false,
    })

    const [toast4, toastInstance4] = useToast({
      title: '这是个成功提示',
      clickMaskOnClose: true,
      icon: <Icon value='CheckFilled' color='#fff' size={36} />,
      mask: false,
    })

    const [toast5, toastInstance5] = useToast({
      title: '这是个警告提示',
      clickMaskOnClose: true,
      icon: <Icon value='ExclamationFilled' color='#fff' size={36} />,
      mask: false,
    })

    const [toast6, toastInstance6] = useToast({
      title: '这是个失败提示, 提示内容文字提示内容文字提示内容文字提示',
      duration: 0,
      clickMaskOnClose: true,
      icon: <Icon value='CloseFilled' color='#fff' size={36} />,
      mask: true,
    })

    const toastItems = [
      { label: '纯文本', toastTitle: '提示内容文字', toast: toast1 },
      { label: '加载', toast: toast2 },
      { label: '带图标', toast: toast3 },
      { label: '成功', toast: toast4 },
      { label: '警告', toast: toast5 },
      { label: '失败', toast: toast6 },
    ]

    const basicItems = toastItems.slice(0, 3)
    const styleItems = toastItems.slice(3, 6)

    return (
      <Layout title='轻提示' qrcode='components/tickling/toast/index'>
        {toastInstance1}
        {toastInstance2}
        {toastInstance3}
        {toastInstance4}
        {toastInstance5}
        {toastInstance6}

        <DemoBlock label='基础样式' pure>
          <List>
            {basicItems.map((item, index) => (
              <ListItem key={index} title={item.label} onClick={() => item.toast.current.show()} />
            ))}
          </List>
        </DemoBlock>

        <DemoBlock label='状态样式' pure>
          <List>
            {styleItems.map((item, index) => (
              <ListItem
                key={index}
                title={item.label}
                onClick={() =>
                  item.toast.current.show({
                    duration: 0,
                  })
                }
              />
            ))}
          </List>
        </DemoBlock>
      </Layout>
    )
  },
  {
    id: 'toast_page',
  },
)
```

### 自定义用法

```tsx
import { Icon, Toast, useToast, withLayer } from '@fta/components'
import { DemoBlock, Layout, List, ListItem } from '@fta/components/common/display'
import React from 'react'
import './index.scss'

export default withLayer(
  () => {
    const [toast7, toastInstance7] = useToast({
      title: '成功提示',
      duration: 0,
      clickMaskOnClose: true,
      mask: false,
      vertical: true,
      icon: <Icon value='CheckCircleOutlined' color='#fff' size={64} />,
    })

    const [toast8, toastInstance8] = useToast({
      title: '失败提示',
      clickMaskOnClose: true,
      mask: false,
      vertical: true,
      icon: <Icon value='CloseCircleOutlined' color='#fff' size={64} />,
    })

    const [toast9, toastInstance9] = useToast({
      title: '警告提示警告提示警告提示警告提示',
      duration: 0,
      clickMaskOnClose: true,
      mask: false,
      vertical: true,
      icon: <Icon value='InfoOutlined' color='#fff' size={64} />,
    })

    const [toast10, toastInstance10] = useToast({
      title: '加载中',
      clickMaskOnClose: true,
      mask: false,
      loading: true,
      vertical: true,
    })

    const toastItems = [
      { label: '竖向排列-成功', toast: toast7 },
      { label: '竖向排列-失败', toast: toast8 },
      { label: '竖向排列-警告', toast: toast9 },
      { label: '竖向排列-加载中', toast: toast10 },
    ]

    const customItems = toastItems.slice(0)

    return (
      <Layout title='轻提示' qrcode='components/tickling/toast/index'>
        {toastInstance7}
        {toastInstance8}
        {toastInstance9}
        {toastInstance10}

        <DemoBlock label='自定义' pure>
          <List>
            {customItems.map((item, index) => (
              <ListItem key={index} title={item.label} onClick={() => item.toast.current.show()} />
            ))}
          </List>
        </DemoBlock>

        <DemoBlock label='API调用(V1.0.17)' pure>
          <List>
            <ListItem
              title={'基础使用'}
              onClick={() => {
                Toast.show({
                  id: 'toast_page',
                  key: 'toast_1',
                  title: '我是一只小小小小鸟～',
                })
              }}
            />
          </List>
        </DemoBlock>
      </Layout>
    )
  },
  {
    id: 'toast_page',
  },
)
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| title | 提示文本 | `ReactNode` | `--` | - |
| duration | 提示持续时间，设置为0则默认不关闭 | `number` | `2` | - |
| mask | 是否需要蒙层，rn默认有蒙层，无法去除 | `boolean` | `true` | - |
| loading | 是否展示loading图标，可自定义 | `ReactNode` | `false` | - |
| icon | 文字前展示图标 | `ReactNode` | `--` | - |
| transparent | 背景蒙层是否透明 | `boolean` | `true` | - |
| position | 轻提示位置 | `"center" \| "top" \| "bottom"` | `"center"` | - |
| textLevel | 文本等级 1-6 | `number` | `4` | - |
| vertical | 图标是否垂直排列 | `boolean` | `--` | `1.2.3` |
| clickMaskOnClose | 点击蒙层时是否关闭 | `boolean` | `true` | - |
| containerClassName | 窗体类名 | `boolean` | `--` | - |
| customContainerStyle | 容器内联样式 | `{}` | `--` | - |
| useNative | 是否使用显示背景蒙层 | `boolean` | `true` | - |
| content | 自定义toast显示内容 | `ReactNode` | `--` | `1.0.8` |
| textStyle | 文本样式 | `{}` | `--` | - |
| ref | - | `null \| bivarianceHack \| RefObj...` | `--` | - |
| key | - | `Key \| null` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onMaskClick | 点击背景蒙层的回调 | `() => void` | `--` | - |