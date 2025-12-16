# Picker 选择器

选择器组件，包含单列、多列、时间和日期选择等。

## 引用
```typescript
import { Picker } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import { Picker } from '@fta/components'
import {
  DemoBlock,
  Layout,
  List,
  ListItem,
} from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React from 'react'

const rangeOfSelector = [
  '美国',
  '中国',
  '巴西',
  '日本',
  '印度尼西亚',
  '新加坡',
  '澳大利亚',
  '缅北',
  '老挝',
  '柬埔寨',
  '菲律宾',
  '希腊',
  '摩洛哥',
  '钓鱼岛',
  '朝鲜',
  '韩国',
]

const rangeOfMultiSelector = [
  ['前天', '昨天', '今天', '明天', '后天', '大后天'],
  ['看书', '背单词', '看电影', '打游戏', '睡懒觉', '做饭'],
  ['十分钟', '半小时', '一小时', '两小时', '三小时', '六小时', '一整天'],
]

class PickerDemo extends React.Component {
  state = {
    date: '2022-03-28',
    datetime: '2022-03-28 19:30',
    month: '2023-01',
    start: '2021-10-07',
    multiVal: [0, 0, 0],
  }

  ref1: any
  ref2: any
  ref3: any
  ref4: any
  ref5: any
  ref6: any
  ref7: any

  componentDidMount() {
    this.ref3?.show()
    setTimeout(() => {
      this.setState({
        start: '2012-10-7',
      })
    }, 2000)
  }

  onChange(newVal: any) {
    console.log('picker onChange', newVal)
  }

  onConfirm(newVal: any) {
    console.log('picker onConfirm', newVal)
  }

  public render(): JSX.Element {
    return (
      <>
        {/* 基础用法 */}
        <DemoBlock label='基础用法' pure>
          <List>
            <ListItem title='单列选择器' onClick={() => this.ref1.show()} />
            <ListItem
              title='多列选择器'
              onClick={() => {
                this.ref2.show()
                setTimeout(() => {
                  this.setState({ multiVal: [3, 3, 3] })
                }, 2000)
              }}
            />
            <ListItem
              title='日期选择器(年月日)'
              onClick={() => this.ref3.show()}
            />
            <ListItem
              title='日期选择器(年月)'
              onClick={() => this.ref4.show()}
            />
            <ListItem
              title='日期选择器(年月日时分)(V1.3.3)'
              onClick={() => this.ref7.show()}
            />
            <ListItem title='时间选择器' onClick={() => this.ref5.show()} />
            <ListItem
              title='地址选择器'
              onClick={() =>
                Taro.showModal({
                  title: '请移步@fta/components-address-picker',
                })
              }
            />
            <ListItem title='隐藏头部区域' onClick={() => this.ref6.show()} />
          </List>
        </DemoBlock>

        <Picker
          theme='#1fb080'
          clickToFocus
          title={'请选择国家/地区'}
          ref={(ref) => (this.ref1 = ref)}
          value={10}
          mode='selector'
          range={rangeOfSelector}
          onConfirm={this.onConfirm}
          onChange={this.onChange}
        />

        <Picker
          title='流水账'
          ref={(ref) => {
            this.ref2 = ref
          }}
          onClose={() => {
            console.log('背景蒙层关闭回调')
          }}
          value={this.state.multiVal}
          mode='multiSelector'
          range={rangeOfMultiSelector}
          onConfirm={this.onConfirm}
          onChange={this.onChange}
        />

        <Picker
          fields='day'
          theme='#1a6fff'
          start={this.state.start}
          end='2023-12-31'
          value={this.state.date}
          title='请选择日期'
          longterm
          ref={(ref) => {
            this.ref3 = ref
          }}
          mode='date'
          onConfirm={this.onConfirm}
          onChange={this.onChange}
        />

        <Picker
          start='2010-02'
          end='2030-11'
          value={this.state.month}
          title='请选择日期'
          fields='month'
          ref={(ref) => {
            this.ref4 = ref
          }}
          mode='date'
          onConfirm={this.onConfirm}
          onChange={this.onChange}
        />

        <Picker
          start='2022-10-24'
          end='2032-10-24'
          value={this.state.datetime}
          title='请选择日期'
          fields='min'
          ref={(ref) => {
            this.ref7 = ref
          }}
          mode='date'
          onConfirm={this.onConfirm}
          onChange={this.onChange}
        />

        <Picker
          start='02:30'
          end='13:51'
          ref={(ref) => {
            this.ref5 = ref
          }}
          mode='time'
          onConfirm={this.onConfirm}
          onChange={this.onChange}
        />

        <Picker
          title={false}
          start='02:30'
          end='13:51'
          ref={(ref) => {
            this.ref6 = ref
          }}
          mode='time'
          onConfirm={this.onConfirm}
          onChange={this.onChange}
        />
      </>
    )
  }
}

export default function () {
  return (
    <Layout title={'选择器'} qrcode='components/form/picker/index'>
      <PickerDemo />
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| confirmText | 确认文本 | `string` | `--` | - |
| cancelText | 取消文本 | `string` | `--` | - |
| title | 标题，设置为 `false` 则不显示头部区域 | `ReactNode` | `--` | - |
| prefix | 自定义渲染顶部区域 | `ReactNode` | `--` | - |
| suffix | 自定义渲染底部区域 | `ReactNode` | `--` | - |
| controls | 是否自行控制点击确定/取消按钮是否关闭 Picker | `boolean` | `false` | - |
| headerProps | 浮动面板头部其他配置 | `unknown` | `--` | - |
| itemHeight | [Thresh] 行高 | `number` | `--` | 1.7.11 |
| height | [Thresh] 滚动区域高度 | `number` | `--` | 1.4.0 |
| renderEmpty | 无数据时的 UI | `() => ReactNode` | `--` | 1.7.10 |
| children | 子元素 | `any` | `--` | - |
| containerClassName | 容器样式类名 | `string` | `--` | - |
| containerStyle | 容器样式对象 | `{}` | `--` | - |
| contentClassName | 容器子节点样式类名 | `string` | `--` | - |
| contentStyle | 容器子节点样式对象 | `{}` | `--` | - |
| overlayClassName | 背景蒙层类名 | `string` | `--` | - |
| overlayStyle | 背景蒙层内联样式 | `{}` | `--` | - |
| useNativeModal | RN/Thresh 端是否使用原生 Modal 组件 | `boolean` | `true` | - |
| catchMove | 是否阻止内容滑动穿透 | `boolean` | `true` | - |
| clickOverlayOnClose | 点击背景蒙层关闭（需绑定 onClose 回调） | `boolean` | `true` | - |
| example | 示例区域（安卓不可点击） | `ReactNode` | `--` | - |
| animated | 是否显示从底部弹出的动画效果 | `boolean` | `true` | 1.0.6 |
| safeArea | 是否显示底部安全区 | `boolean \| Omit_SafeAreaProps` | `true` | 1.0.9 |
| modalProps | 弹窗 props | `{ onShow?: () => void; transpa...` | `--` | 1.0.10 |
| theme | 确定按钮主题色 | `string` | `--` | 1.2.0 |
| sibling | Thresh 端 Modal 组件的前后缀节点 | `{ prev?: ReactNode; next?: Rea...` | `--` | 1.6.2 |
| portal | [H5] 是否挂载到根节点 | `boolean \| HTMLElement` | `false` | 1.7.14 |
| direction | 书写方向 | `"rtl" \| "ltr"` | `--` | 1.10.11 |
| ref | 引用对象 | `null \| bivarianceHack \| RefObj...` | `--` | - |
| delay | 每次滚动后自动修复位置偏移的延迟（ms） | `number` | `200` | - |
| disableParallelScroll | [Thresh] 是否禁止多列同时滚动 | `boolean` | `false` | 1.3.2 |
| triggerChangeOnScroll | [Thresh] 是否在滚动时实时触发回调 | `boolean` | `true` | 1.7.13 |

### Events

| 属性名 | 描述 | 类型 | 版本 |
|--------|------|------|------|
| onConfirm | 点击确定按钮的回调 | `(val: string \| import("/packag...` | - |
| onCancel | 点击取消按钮的回调 | `(val: string \| import("/packag...` | - |
| onClose | 元素被关闭时触发的事件（event 从 1.10.9 开始支持） | `(event: { source: "overlay" \| ...` | 1.10.9 |
| onShow | Modal 显示回调 | `() => any` | 1.2.0 |
| onHide | Modal 隐藏回调 | `() => any` | 1.2.0 |