# InputNumber 数字输入框

带加减按钮的数字输入框，用户可以控制每次点击增加的数值，支持小数，同时支持自定义输入框宽度。

## 引用
```tsx
import { InputNumber } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { ErrorTip, Flex, InputNumber, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'
import './index.scss'

interface IndexState {
  [key: string]: number
}

class InputNumberDemo extends React.Component<object, IndexState> {
  public constructor(props: any) {
    super(props)
    this.state = {
      number0: 1,
      number2: 1,
      number3: 1,
      number4: 1,
      number5: 1,
      number6: 1,
    }
  }

  private handleNumberChange(stateName: string, value: number): void {
    console.log('number changed:', value, typeof value)
    this.setState({
      [stateName]: value,
    })
  }

  public render(): JSX.Element {
    return (
      <>
        <DemoBlock label='基础用法(min=1, max=10, step=1)'>
          <InputNumber
            enableDot
            filterSymbols
            min={0}
            max={20}
            step={0.5}
            value={this.state.number0}
            onChange={this.handleNumberChange.bind(this, 'number0')}
          />
        </DemoBlock>

        <DemoBlock label='小数(min=0, max=10, step=0.1)'>
          <InputNumber
            type='digit'
            min={0}
            max={10}
            step={0.1}
            value={this.state.number1}
            onChange={this.handleNumberChange.bind(this, 'number1')}
          />
        </DemoBlock>

        <DemoBlock label='禁用状态'>
          <InputNumber
            disabled
            min={0}
            max={10}
            step={1}
            value={this.state.number3}
            onChange={this.handleNumberChange.bind(this, 'number3')}
          />
        </DemoBlock>

        <DemoBlock label='禁用输入状态'>
          <InputNumber
            disabledInput
            min={0}
            max={10}
            step={1}
            value={this.state.number6}
            onChange={this.handleNumberChange.bind(this, 'number6')}
          />
        </DemoBlock>

        <DemoBlock label='带单位'>
          <InputNumber
            min={0}
            max={10}
            step={1}
            unit='辆'
            value={this.state.number6}
            onChange={this.handleNumberChange.bind(this, 'number6')}
          />
        </DemoBlock>

        <DemoBlock label='错误提示'>
          <Flex alignItems='flex-end'>
            <InputNumber
              disabledInput
              min={0}
              max={10}
              step={1}
              value={this.state.number6}
              onChange={this.handleNumberChange.bind(this, 'number6')}
            />
            <ErrorTip
              visible
              text='错误提示文案'
              style={{ marginTop: scale(8) }}
            />
          </Flex>
        </DemoBlock>

        <DemoBlock label='自定义宽度'>
          <InputNumber
            width={200}
            min={0}
            max={10}
            step={1}
            value={this.state.number4}
            onChange={this.handleNumberChange.bind(this, 'number4')}
          />
        </DemoBlock>

        <DemoBlock label='隐藏加减号图标'>
          <InputNumber
            enableDot
            showMinus={false}
            showPlus={false}
            min={0}
            max={10}
            step={0.1}
            value={this.state.number6}
            onChange={this.handleNumberChange.bind(this, 'number6')}
          />
        </DemoBlock>
      </>
    )
  }
}

export default function () {
  return (
    <Layout title='数字输入框' qrcode='components/form/input-number/index'>
      <InputNumberDemo />
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| type | 必填，type='digit' 时，h5 无法显示数字输入框，若需要数字输入框建议使用 number (v1.5.1 支持) | `'number' \| 'digit'` | `--` | - |
| value | 必填，输入框当前值，开发者需要通过 onChange 事件来更新 value 值 | `number \| string` | `(必选)` | - |
| min | 最小值 | `number` | `0` | - |
| max | 最大值 | `number` | `100` | - |
| step | 每次点击改变的间隔大小 | `number` | `1` | - |
| size | 组件的大小 | `"large" \| "normal"` | `"normal"` | - |
| width | 不包括两侧按钮，单位根据环境转为 rpx 或 rem | `number` | `120` | - |
| disabled | 是否禁止输入，禁止点击按钮 | `boolean` | `false` | - |
| disabledInput | 是否禁止输入，但不禁止点击按钮 | `boolean` | `false` | - |
| enableDot | 是否允许用户输入小数点不被格式化 | `boolean` | `false` | - |
| showMinus | 是否显示减号图标 | `boolean` | `true` | 1.0.8 |
| showPlus | 是否显示加号图标 | `boolean` | `true` | 1.0.8 |
| unit | 后缀单位，可自定义渲染 | `ReactNode` | `--` | 1.0.14 |
| inputClassName | 输入框样式 | `string` | `--` | - |
| inputStyle | 输入框样式 | `{}` | `--` | - |
| bgColor | 背景色 | `string` | `--` | 1.2.1 |
| filterSymbols | 过滤特殊符号 | `boolean` | `false` | 1.7.12 |
| clearable | 允许输入时清空 | `boolean` | `--` | 1.8.5 |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onChange | 开发者需要通过 onChange 事件来更新 value 值变化，onChange 函数必填 | `(value: string, e: Event) => void` | `(必选)` | - |
| onBlur | 输入框值失去焦点时触发的事件 | `(event: FocusEvent) => void` | `--` | - |
| onErrorInput | 输入框尝试输入错误数据时触发的事件 | `(errCb: Function) => void` | `--` | - |