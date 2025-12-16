# Radio 单选框

单选框组件

## 引用
```ts
import { Radio } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { Radio, scale, Text } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { Image, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import React from 'react'
import './index.scss'

const StyledDemoBlock = (props: any) => (
  <DemoBlock
    {...props}
    flexDirection='column'
    alignItems='stretch'
    style={{ backgroundColor: '#F5F5F5', paddingTop: 0, paddingBottom: 0 }}
  />
)

class Index extends React.Component<any, any> {
  public config: Taro.PageConfig = {
    navigationBarTitleText: 'Taro UI',
  }

  public constructor(props: any) {
    super(props)
    this.state = {
      demoChecked: false,
      radioValue1: 'option1',
      radioValue2: 'option1',
      radioValue3: 'option1',
      radioValue4: 'option1',
      radioOptions1: [
        { label: '已选项', value: 'option1' },
        { label: '未选项', value: 'option2' },
        {
          label: '已选项禁用',
          value: 'option1',
          disabled: true,
        },
        {
          label: '未选项禁用',
          value: 'option4',
          disabled: true,
        },
      ],
      radioOptions2: [
        { label: '已选项', value: 'option1', desc: '辅助说明文字' },
        { label: '未选项', value: 'option2', desc: '辅助说明文字' },
        {
          label: '已选项禁用',
          value: 'option1',
          desc: '辅助说明文字',
          disabled: true,
        },
        {
          label: '未选项禁用',
          value: 'option4',
          desc: '辅助说明文字',
          disabled: true,
        },
      ],
      radioOptions3: [
        { label: '已选项', value: 'option1' },
        { label: '未选项', value: 'option2' },
      ],
      radioOptions4: [
        { label: '已选项禁用', value: 'option1', disabled: true },
        { label: '未选项禁用', value: 'option2', disabled: true },
      ],
    }
  }

  private handleRadioChange(value: string): void {
    this.setState({
      radioValue1: value,
    })
  }

  private handleRadioChangeScnd(value: string): void {
    this.setState({
      radioValue2: value,
    })
  }

  private handleRadioChangeThd(value: string): void {
    this.setState({
      radioValue3: value,
    })
  }

  public render(): JSX.Element {
    return (
      <>
        <StyledDemoBlock label='基础'>
          <Radio
            type='inline'
            options={this.state.radioOptions3}
            value={this.state.radioValue3}
            onChange={this.handleRadioChangeThd.bind(this)}
          />
        </StyledDemoBlock>

        <StyledDemoBlock label='禁用'>
          <Radio
            type='inline'
            options={this.state.radioOptions4}
            value={this.state.radioValue4}
            onChange={() => {}}
          />
        </StyledDemoBlock>

        <StyledDemoBlock label='左勾选'>
          <Radio
            type='left'
            options={this.state.radioOptions1}
            value={this.state.radioValue1}
            onChange={this.handleRadioChange.bind(this)}
          />
        </StyledDemoBlock>

        <StyledDemoBlock label='左勾选（辅助文本）'>
          <Radio
            type='left'
            options={this.state.radioOptions2}
            value={this.state.radioValue2}
            onChange={this.handleRadioChangeScnd.bind(this)}
          />
        </StyledDemoBlock>

        <StyledDemoBlock label='右勾选'>
          <Radio
            type='between'
            options={this.state.radioOptions1}
            value={this.state.radioValue1}
            onChange={this.handleRadioChange.bind(this)}
          />
        </StyledDemoBlock>

        <StyledDemoBlock label='右勾选（辅助文本）'>
          <Radio
            type='between'
            options={this.state.radioOptions2}
            value={this.state.radioValue2}
            onChange={this.handleRadioChangeScnd.bind(this)}
          />
        </StyledDemoBlock>
      </>
    )
  }
}

export default function () {
  return (
    <Layout title='单选框' qrcode='components/form/radio/index'>
      <Index />
    </Layout>
  )
}
```

### 独立使用

```tsx
import { Radio, scale, Text } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { Image, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import React from 'react'
import './index.scss'

const StyledDemoBlock = (props: any) => (
  <DemoBlock
    {...props}
    flexDirection='column'
    alignItems='stretch'
    style={{ backgroundColor: '#F5F5F5', paddingTop: 0, paddingBottom: 0 }}
  />
)

class Index extends React.Component<any, any> {
  public config: Taro.PageConfig = {
    navigationBarTitleText: 'Taro UI',
  }

  public constructor(props: any) {
    super(props)
    this.state = {
      demoChecked: false,
      radioValue2: 'option1',
      radioOptions2: [
        { label: '已选项', value: 'option1', desc: '辅助说明文字' },
        { label: '未选项', value: 'option2', desc: '辅助说明文字' },
        {
          label: '已选项禁用',
          value: 'option1',
          desc: '辅助说明文字',
          disabled: true,
        },
        {
          label: '未选项禁用',
          value: 'option4',
          desc: '辅助说明文字',
          disabled: true,
        },
      ],
    }
  }

  private handleRadioChangeScnd(value: string): void {
    this.setState({
      radioValue2: value,
    })
  }

  private handleDemoCheckedChange(value: boolean): void {
    this.setState({
      demoChecked: value,
    })
  }

  public render(): JSX.Element {
    return (
      <>
        <StyledDemoBlock label='自定义勾选样式(V1.2.2)'>
          <Radio
            type='between'
            selectedIcon={
              <Image
                style={{ width: scale(28), height: scale(28) }}
                src='https://imagecdn.ymm56.com/ymmfile/static/resource/89d225df-2a0a-462f-baf1-2416b73e1cf2.png'
              />
            }
            icon={
              <Image
                style={{
                  width: scale(28),
                  height: scale(28),
                  visibility: 'hidden',
                }}
                src='https://imagecdn.ymm56.com/ymmfile/static/resource/89d225df-2a0a-462f-baf1-2416b73e1cf2.png'
              />
            }
            selectedDidsabledIcon={<View />}
            disabledIcon={<View />}
            options={this.state.radioOptions2}
            value={this.state.radioValue2}
            onChange={this.handleRadioChangeScnd.bind(this)}
          />
        </StyledDemoBlock>

        <DemoBlock label='独立使用'>
          <Radio.Simple
            controlled={false}
            active
            style={{ marginRight: scale(24) }}
          />
          <Radio.Simple controlled={false} style={{ marginRight: scale(24) }} />
          <Radio.Simple
            controlled={false}
            active
            disabled
            style={{ marginRight: scale(24) }}
          />
          <Radio.Simple
            controlled={false}
            disabled
            style={{ marginRight: scale(24) }}
          />
          <Radio.Simple
            controlled={false}
            active
            size={48}
            style={{ marginRight: scale(24) }}
          />
          <Radio.Simple controlled={false} active size={48} color='#1fb080' />
        </DemoBlock>

        <DemoBlock label='独立使用-扩大点击区域'>
          <Radio.Simple
            zoom
            controlled
            active={this.state.demoChecked}
            style={{
              height: scale(60),
              width: scale(100),
              backgroundColor: '#efefef',
            }}
            onChange={this.handleDemoCheckedChange.bind(this)}
          />
        </DemoBlock>

        <DemoBlock label='独立使用-带文字'>
          <Radio.Simple
            zoom
            controlled
            active={this.state.demoChecked}
            onChange={this.handleDemoCheckedChange.bind(this)}
          >
            <Text style={{ marginLeft: scale(12) }} level={5} color='#666666'>
              同意用户隐私协议
            </Text>
          </Radio.Simple>
        </DemoBlock>

        <DemoBlock label='延展类'>
          <View
            className={
              this.state.demoChecked
                ? 'radio-demo radio-demo-highlight'
                : 'radio-demo'
            }
          >
            <Radio.Simple
              active={this.state.demoChecked}
              style={{ marginLeft: scale(24) }}
              onChange={this.handleDemoCheckedChange.bind(this)}
            />
          </View>
        </DemoBlock>
      </>
    )
  }
}

export default function () {
  return (
    <Layout title='单选框' qrcode='components/form/radio/index'>
      <Index />
    </Layout>
  )
}
```

## API

### Radio Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| value | 输入框当前值，用户需要通过 onChange 事件来更新 value 值，必填 | `any` | `(必选)` | |
| options | 选项列表 | `RadioOption<T>[]` | `(必选)` | |
| type | 展现类型 | `"left" \| "inline" \| "between"` | `"left"` | |
| titleClassName | 标题样式 | `string` | `--` | 1.2.2 |
| titleStyle | 标题样式 | `{}` | `--` | 1.2.2 |
| theme | 单选按钮主题色 | `string` | `--` | 1.6.13 |
| itemClassName | 每一项的样式 | `string` | `--` | 1.9.1 |
| itemStyle | 每一项的样式 | `{}` | `--` | 1.9.1 |
| borderless | 是否隐藏下边框线 | `boolean` | `false` | 1.9.1 |
| selectedIcon | 自定义选中 icon | `ReactNode` | `--` | |
| icon | 自定义未选中 icon | `ReactNode` | `--` | |
| disabledIcon | 自定义禁用 icon | `ReactNode` | `--` | |
| selectedDidsabledIcon | 自定义禁用且选中 icon | `ReactNode` | `--` | |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onChange | 点击选项触发事件，开发者需要通过此事件来更新 value | `(value: T) => void` | `(必选)` | 1.2.2 |

> **注意**：`onClick` 已废弃，请使用 `onChange`。

---

### Radio.Simple Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| controlled | 是否是受控组件 | `boolean` | `(必选)` | |
| active | 当前是否激活 | `boolean` | `false` | |
| disabled | 是否禁止点击 | `boolean` | `false` | |
| color | 选中时的颜色 | `string` | `--` | |
| size | 单选框大小 | `number` | `--` | 1.2.2 |
| zoom | 是否扩大点击区域，扩大后需要传入样式 | `boolean` | `false` | 1.1.0 |
| align | 扩大区域后 radio 主体的对齐方式 | `"center" \| "flex-end" \| "flex-start"` | `"center"` | 1.2.2 |
| stopPropagation | 是否阻止事件冒泡 | `boolean` | `--` | 1.2.2 |
| selectedIcon | 自定义选中 icon | `ReactNode` | `--` | |
| icon | 自定义未选中 icon | `ReactNode` | `--` | |
| disabledIcon | 自定义禁用 icon | `ReactNode` | `--` | |
| selectedDidsabledIcon | 自定义禁用且选中 icon | `ReactNode` | `--` | |
| children | 子元素 | `any` | `--` | |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onChange | 点击单选框的回调 | `(active: boolean) => void` | `--` | |