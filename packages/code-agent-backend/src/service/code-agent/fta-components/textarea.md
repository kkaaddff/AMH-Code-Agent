```markdown
# Textarea 多行输入框

## 引用
```tsx
import { Textarea } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import { Textarea } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React from 'react'

interface IndexState {
  [key: string]: string
}

class Index extends React.Component<object, IndexState> {
  public constructor(props: any) {
    super(props)
    this.state = {
      value1: '',
      value2: '',
    }
  }

  public config: Taro.PageConfig = {
    navigationBarTitleText: 'Taro UI',
  }

  private handleChange(stateName: string, value: string, event: any): void {
    console.log('onChange', stateName, value, event)
    this.setState({
      [stateName]: value,
    })
  }

  public render(): JSX.Element {
    return (
      <>
        <DemoBlock label='基础用法'>
          <Textarea
            value={this.state.value1}
            onChange={this.handleChange.bind(this, 'value1')}
            maxLength={20}
            nativeProps={{
              type: 'number',
            }}
            placeholder='你的问题是...'
          />
        </DemoBlock>
        <DemoBlock label='显示标题'>
          <Textarea
            required
            title='标题名称'
            value={this.state.value1}
            onChange={this.handleChange.bind(this, 'value1')}
            maxLength={200}
            placeholder='你的问题是...'
          />
        </DemoBlock>
        <DemoBlock label='不显示字数'>
          <Textarea
            count={false}
            value={this.state.value2}
            onChange={this.handleChange.bind(this, 'value2')}
            maxLength={200}
            placeholder='你的问题是...'
          />
        </DemoBlock>
      </>
    )
  }
}

export default function () {
  return (
    <Layout title='多行输入框' qrcode='components/form/textarea/index'>
      <Index />
    </Layout>
  )
}
```

### 高级使用
```tsx
import { Textarea } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React from 'react'

interface IndexState {
  [key: string]: string
}

class Index extends React.Component<object, IndexState> {
  public constructor(props: any) {
    super(props)
    this.state = {
      value3: '',
      value4: '',
    }
  }

  public config: Taro.PageConfig = {
    navigationBarTitleText: 'Taro UI',
  }

  private handleChange(stateName: string, value: string, event: any): void {
    console.log('onChange', stateName, value, event)
    this.setState({
      [stateName]: value,
    })
  }

  public render(): JSX.Element {
    return (
      <>
        <DemoBlock label='文字超出仍可输入'>
          <Textarea
            textOverflowForbidden={false}
            value={this.state.value3}
            onChange={this.handleChange.bind(this, 'value3')}
            maxLength={200}
            placeholder='你的问题是...'
          />
        </DemoBlock>
        <DemoBlock label='自定义高度'>
          <Textarea
            height={300}
            value={this.state.value4}
            onChange={this.handleChange.bind(this, 'value4')}
            maxLength={200}
            placeholder='你的问题是...'
          />
        </DemoBlock>
      </>
    )
  }
}

export default function () {
  return (
    <Layout title='多行输入框' qrcode='components/form/textarea/index'>
      <Index />
    </Layout>
  )
}
```

### 业务场景
```tsx
import { Textarea } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React from 'react'

interface IndexState {
  [key: string]: string
}

class Index extends React.Component<object, IndexState> {
  public constructor(props: any) {
    super(props)
    this.state = {
      value4: '',
    }
  }

  public config: Taro.PageConfig = {
    navigationBarTitleText: 'Taro UI',
  }

  private handleChange(stateName: string, value: string, event: any): void {
    console.log('onChange', stateName, value, event)
    this.setState({
      [stateName]: value,
    })
  }

  public render(): JSX.Element {
    return (
      <>
        <DemoBlock label='报错状态(V1.3.0)'>
          <Textarea
            error={true}
            errorTip='必填校验，错误提示文案'
            value={this.state.value4}
            onChange={this.handleChange.bind(this, 'value4')}
            maxLength={200}
            placeholder='你的问题是...'
          />
        </DemoBlock>
        <DemoBlock label='地址输入(V1.3.0)'>
          <Textarea
            showAddress
            value={this.state.value4}
            onChange={this.handleChange.bind(this, 'value4')}
            maxLength={200}
            count={false}
            placeholder='请输入或粘贴详细地址'
          />
        </DemoBlock>
      </>
    )
  }
}

export default function () {
  return (
    <Layout title='多行输入框' qrcode='components/form/textarea/index'>
      <Index />
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|-------|------|------|--------|------|
| value | 输入框当前值，用户需要通过 onChange 事件的 event.target.value 来更新 value 值，必填 | `string` | (必选) | - |
| title | 标题 | `ReactNode` | `--` | - |
| required | 标题显示\*号 | `boolean` | `--` | - |
| maxLength | 最大长度 | `string \| number` | `200` | - |
| placeholder | 占位符 | `string` | `--` | - |
| placeholderClass | 指定 placeholder 的样式类，只在小程序有效 | `string` | `--` | - |
| placeholderStyle | 指定 placeholder 的样式，只在小程序有效 | `string` | `--` | - |
| disabled | 是否禁用 | `boolean` | `false` | - |
| autoFocus | 是否自动聚焦 | `boolean` | `false` | - |
| focus | 获取焦点 | `boolean` | `false` | - |
| showConfirmBar | 是否显示键盘上方带有“完成”按钮那一栏 | `boolean` | `false` | - |
| selectionStart | 光标起始位置，自动聚集时有效，需与 selection-end 搭配使用 | `number` | `-1` | - |
| selectionEnd | 光标结束位置，自动聚集时有效，需与 selectionStart 搭配使用 | `number` | `-1` | - |
| count | 是否显示字数 | `boolean` | `true` | - |
| fixed | 如果 textarea 是在一个 position:fixed 的区域，需要显示指定属性 fixed 为 true | `boolean` | `false` | - |
| textOverflowForbidden | 文字超出最大长度时是否禁止输入，若否，则还可以在 maxLength 的基础上输入 500 字符，并右下角红字提示 | `boolean` | `true` | - |
| height | 输入框高度 | `string \| number` | `120` | - |
| cursorSpacing | 指定光标与键盘的距离，单位 px。只在小程序端有效 | `number` | `100` | - |
| numberOfLines | 文本的行数, Thresh端默认为3行 | `number` | `3` | 1.0.8 |
| textClassName | 文本框样式 | `string` | `--` | 1.2.3 |
| textStyle | 文本框样式 | `{}` | `--` | 1.2.3 |
| showAddress | 是否是地址模式 | `boolean` | `--` | 1.3.0 |
| renderAddressAction | 地址按钮区域前缀 | `(action: { clear: () => void; ...` | `--` | 1.3.0 |
| copyText | 复制文本 | `string` | `--` | 1.3.0 |
| clearText | 清除文本 | `string` | `--` | 1.3.0 |
| theme | 按钮主题色 | `string` | `--` | 1.3.0 |
| error | 校验报错的状态 | `boolean` | `--` | 1.3.0 |
| errorTip | 校验报错信息 | `string` | `--` | 1.3.0 |
| nativeProps | 直接透传到 textarea 组件的属性 | `{}` | `--` | 1.0.8 |
| renderer | 传入自定义 Input 组件 | `any` | `--` | 1.7.15 |
| renderCount | 自定义渲染右下角计数 | `(count: number, limit: number, ...)` | `--` | 1.2.3 |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onCopyAddress | 粘贴地址回调 | `(success: boolean) => any` | `--` | - |
| onClearAddress | 清除地址回调 | `(success: boolean) => any` | `--` | - |
| onChange | 输入框值改变时触发的事件，开发者需要通过 onChange 事件来更新 value 值变化，onChange 函数必填 | `(value: string, event: any) => void` | (必选) | - |
| onFocus | 输入框获得焦点时触发 | `(event: any) => void` | `--` | - |
| onBlur | 输入框失去焦点时触发 | `(event: any) => void` | `--` | - |
| onConfirm | 点击完成时，触发 confirm 事件 | `(event: any) => void` | `--` | - |
| onLinechange | 输入框行数变化时调用 | `(event: any) => void` | `--` | - |
| onCompleteTextChange | Thresh端专用回调 | `(event: any) => any` | `--` | 1.6.2 |
```