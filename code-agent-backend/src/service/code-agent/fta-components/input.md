# Input 输入框

输入框组件用于用户输入文本内容，支持多种类型和状态，适用于各类表单场景。

## 引用

```ts
import { Input } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { Input, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { BaseEventOrig } from '@tarojs/components/types/common'
import { InputProps } from '@tarojs/components/types/Input'
import Taro from '@tarojs/taro'
import React from 'react'
import './index.scss'

class Index extends React.Component<object, Record<string, any>> {
  public constructor(props: any) {
    super(props)
    this.state = {
      value1: '',
      value2: '',
      value3: '',
      value4: '',
      value5: '',
      value6: '',
      value7: '',
      value8: '',
      value9: '',
      value10: '',
      value11: '',
      value13: '',
      value14: '',
      value15: '',
      value16: '',
      value17: '',
      disabled: false,
      second: 60,
    } as Record<string, any>
  }

  public config: Taro.PageConfig = {
    navigationBarTitleText: 'Taro UI',
  }

  private showTipText(): string {
    return this.state.disabled ? `${this.state.second}s后重试` : '发送验证码'
  }

  private sendCode(): void {
    if (this.state.disabled) return
    this.setState({
      disabled: true,
    })
    const timer = setInterval(() => {
      if (this.state.second > 0) {
        this.setState({
          second: this.state.second - 1,
        })
      } else {
        this.setState({
          second: 60,
          disabled: false,
        })
        clearInterval(timer)
      }
    }, 1000)
  }

  private handleInput(stateName: string, value: string): void {
    this.setState({
      [stateName]: value,
    })
  }

  private onClickErrorIcon(): void {
    Taro.showToast({
      title: '请输入数字',
      icon: 'success',
      duration: 2000,
    })
  }

  private handleKeyboardHeightChange(event: BaseEventOrig<InputProps.onKeyboardHeightChangeEventDetail>): void {
    Taro.showToast({
      title: `高度 ${event.detail.height}`,
      icon: 'success',
      duration: 2000,
    })
  }

  public render(): JSX.Element {
    return (
      <>
        <DemoBlock label="基础用法" pure>
          <Input
            bold
            name="value1"
            title="标准五个字"
            type="text"
            clear
            placeholder="标准五个字"
            value={this.state.value1}
            onChange={this.handleInput.bind(this, 'value1')}
          />
          <Input
            bold
            name="big"
            title="大字体"
            type="text"
            textStyle={{
              fontSize: scale(30),
            }}
            clear
            placeholder="标准五个字"
            value={this.state.value1}
            onChange={this.handleInput.bind(this, 'value1')}
          />
          <Input
            name="value2"
            title="标题实在特别长就换行"
            placeholder="其他列保持正常间距"
            value={this.state.value2}
            onChange={this.handleInput.bind(this, 'value2')}
          />
          <Input
            name="value3"
            border={false}
            placeholder="无标题"
            value={this.state.value3}
            onChange={this.handleInput.bind(this, 'value3')}
          />
        </DemoBlock>

        <DemoBlock label="输入类型" pure>
          <Input
            name="value4"
            title="文本"
            type="text"
            placeholder="单行文本"
            value={this.state.value4}
            onChange={this.handleInput.bind(this, 'value4')}
          />
          <Input
            border={false}
            name="value5"
            title="数字"
            type="number"
            placeholder="请输入数字"
            value={this.state.value5}
            onChange={this.handleInput.bind(this, 'value5')}
          />
          <Input
            name="value6"
            title="密码"
            type="number"
            password
            placeholder="密码不能少于10位数"
            value={this.state.value6}
            onChange={this.handleInput.bind(this, 'value6')}
          />
          <Input
            name="value7"
            title="身份证"
            type="idcard"
            placeholder="身份证号码"
            value={this.state.value7}
            onChange={this.handleInput.bind(this, 'value7')}
          />
          <Input
            name="value8"
            title="小数"
            type="digit"
            placeholder="请输入小数"
            value={this.state.value8}
            onChange={this.handleInput.bind(this, 'value8')}
          />
          <Input
            name="value9"
            border={false}
            title="手机号码"
            type="phone"
            placeholder="手机号码"
            value={this.state.value9}
            onChange={this.handleInput.bind(this, 'value9')}
          />
        </DemoBlock>

        <DemoBlock label="输入状态" pure>
          <Input
            name="value10"
            disabled
            title="禁用"
            type="text"
            placeholder="禁止输入"
            value={this.state.value10}
            onChange={this.handleInput.bind(this, 'value10')}
          />
          <Input
            name="value12"
            editable={false}
            title="不可编辑"
            type="text"
            placeholder="不可编辑"
            value="不可编辑的内容"
          />
          <Input
            name="value13"
            border={false}
            light
            clear
            title="清除按钮"
            type="text"
            placeholder="点击清除按钮清空内容"
            value={this.state.value13}
            onChange={this.handleInput.bind(this, 'value13')}
          />
          <Input
            name="value16"
            border={false}
            required
            title="必填项"
            type="text"
            placeholder="必填项"
            value={this.state.value16}
            onChange={this.handleInput.bind(this, 'value16')}
          />
          <Input
            name="value17"
            border={false}
            title="监听事件"
            type="text"
            placeholder="监听键盘高度事件"
            value={this.state.value17}
            onChange={this.handleInput.bind(this, 'value17')}
            onKeyboardHeightChange={this.handleKeyboardHeightChange.bind(this)}
          />
        </DemoBlock>
      </>
    )
  }
}

export default function () {
  return (
    <Layout title={'输入框'} qrcode="components/form/input/index">
      <Index />
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| name | 输入框的唯一标识，有传入点击 title 会聚焦输入框 | `string` | `--` | |
| title | 输入框左侧标题，若传入为空，则不显示标题 | `ReactNode` | `--` | 1.0.16 支持自定义节点 |
| light | 标题是否浅色 | `boolean` | `false` | 1.0.16 |
| type | 输入框类型，Thresh支持 digitpad \| numberpad | `"number" \| "phone" \| "text" \| ...` | `"text"` | |
| error | 是否出现错误 | `boolean` | `false` | |
| clear | 是否显示清除按钮，需要传入 onChange 事件来改变 value | `boolean` | `false` | |
| border | 是否显示下划线边框 | `boolean` | `true` | |
| disabled | 是否禁止输入，禁止点击按钮 | `boolean` | `false` | |
| placeholder | 占位符 | `string` | `--` | |
| placeholderStyle | 指定 placeholder 的样式，只在小程序有效 | `string` | `--` | |
| placeholderClass | 指定 placeholder 的样式类，只在小程序有效 | `string` | `--` | |
| autoFocus | 是否自动聚焦 | `boolean` | `false` | |
| focus | 是否聚焦 | `boolean` | `false` | |
| required | 是否必填 | `boolean` | `false` | |
| placeholderTextColor | 占位符颜色 | `string` | `--` | |
| labelClassName | 标题样式类 | `string` | `--` | 1.0.17 |
| labelStyle | 标题样式 | `any` | `--` | 1.0.17 |
| bold | 标题是否加粗 | `boolean` | `false` | 1.0.17 |
| textStyle | 文本样式 | `any` | `--` | 1.2.4 |
| textClassName | 文本样式类 | `string` | `--` | 1.2.4 |
| blurNotTriggerChange | 失去焦点时不触发 onChange 事件 | `boolean` | `false` | |
| renderer | 传入自定义 Input 组件 | `unknown` | `--` | 1.7.15 |
| maxlength | 最大输入长度，设置为 -1 的时候不限制最大长度 | `number` | `140` | |
| confirmType | 设置键盘右下角按钮的文字 | `"search" \| "done" \| "send" \| ...` | `"done"` | |

### Events

| 属性名 | 描述 | 类型 | 版本 |
|--------|------|------|------|
| onBlur | 输入框失去焦点时触发的事件，v2.0.3 版本可以获取 event 参数 | `(value: T, event: ...)` | |
| onFocus | 输入框被选中时触发的事件，v2.0.3 版本可以获取 event 参数 | `(value: T, event: ...)` | |
| onChange | 输入框值改变时触发的事件，开发者需要通过 onChange 事件来更新 value 值变化，onChange 函数必填。小程序中，如果想改变 value 的值，需要 return value 从而改变输入框的当前值，v2.0.3 版本可以获取 event 参数 | `InputFunction<InputEventDetail...>` | |
| onClick | 点击回调 | `(event: ...)` | |