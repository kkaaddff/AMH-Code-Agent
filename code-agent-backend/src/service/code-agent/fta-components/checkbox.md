```markdown
# CheckBox 多选框

多选框组件

## 引用
```tsx
import { Checkbox } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { Checkbox, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { CheckboxOption } from '@fta/components/types/checkbox'
import Taro from '@tarojs/taro'
import React from 'react'
import './index.scss'

interface IndexState {
  checkedList1: string[]
  checkedList2: string[]
  checkboxOption1: CheckboxOption<string>[]
  checkboxOption2: CheckboxOption<string>[]
  [key: string]: any
}

class CheckboxExample extends React.Component<object, IndexState> {
  public config: Taro.PageConfig = {
    navigationBarTitleText: 'Taro UI',
  }

  public constructor(props: any) {
    super(props)
    this.state = {
      checkedList1: ['list1'],
      checkedList2: ['list1'],
      checkboxOption1: [
        { value: 'list1', label: 'iPhone X' },
        { value: 'list2', label: 'HUAWEI P20' },
        { value: 'list3', label: 'OPPO Find X' },
      ],
      checkboxOption2: [
        {
          value: 'list1',
          label: 'iPhone X',
          desc: '部分地区提供电子普通发票，用户可自行打印，效力等同纸质普通发票，具体以实际出具的发票类型为准。',
        },
        {
          value: 'list2',
          label: 'HUAWEI P20',
          desc: '部分地区提供电子普通发票，用户可自行打印，效力等同纸质普通发票，具体以实际出具的发票类型为准。',
        },
        {
          value: 'list3',
          label: 'OPPO Find X',
          desc: '部分地区提供电子普通发票，用户可自行打印，效力等同纸质普通发票，具体以实际出具的发票类型为准。',
        },
      ],
    }
  }

  private handleChange(value: string[]): void {
    this.setState({
      checkedList1: value,
    })
  }

  private handleChangeSnd(value: string[]): void {
    this.setState({
      checkedList2: value,
    })
  }

  public render(): JSX.Element {
    return (
      <>
        <DemoBlock label='基础用法' pure>
          <Checkbox
            options={this.state.checkboxOption1}
            value={this.state.checkedList1}
            onChange={this.handleChange.bind(this)}
          />
        </DemoBlock>
        <DemoBlock label='含描述信息' pure>
          <Checkbox
            options={this.state.checkboxOption2}
            value={this.state.checkedList2}
            onChange={this.handleChangeSnd.bind(this)}
          />
        </DemoBlock>
        <DemoBlock label='基础用法-大字体(V1.2.2)' pure>
          <Checkbox
            titleStyle={{ fontSize: scale(30) }}
            options={this.state.checkboxOption2}
            value={this.state.checkedList2}
            onChange={this.handleChangeSnd.bind(this)}
          />
        </DemoBlock>
      </>
    )
  }
}

export default function () {
  return (
    <Layout title='复选框' qrcode='components/form/checkbox/index'>
      <CheckboxExample />
    </Layout>
  )
}
```

### 禁用/强调/行内排列

```tsx
import { Checkbox, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { CheckboxOption } from '@fta/components/types/checkbox'
import Taro from '@tarojs/taro'
import React from 'react'
import './index.scss'

interface IndexState {
  checkedList3: string[]
  checkboxOption3: CheckboxOption<string>[]
  [key: string]: any
}

class CheckboxExample extends React.Component<object, IndexState> {
  public config: Taro.PageConfig = {
    navigationBarTitleText: 'Taro UI',
  }

  public constructor(props: any) {
    super(props)
    this.state = {
      checkedList3: ['list1', 'list4'],
      checkedList4: ['list1'],
      checkboxOption3: [
        {
          value: 'list1',
          label: 'iPhone X',
          desc: '部分地区提供电子普通发票，用户可自行打印，效力等同纸质普通发票，具体以实际出具的发票类型为准。',
        },
        { value: 'list2', label: 'HUAWEI P20' },
        {
          value: 'list3',
          label: 'OPPO Find X',
          desc: '部分地区提供电子普通发票，用户可自行打印，效力等同纸质普通发票，具体以实际出具的发票类型为准。',
          disabled: true,
        },
        {
          value: 'list4',
          label: 'vivo NEX',
          desc: '部分地区提供电子普通发票，用户可自行打印，效力等同纸质普通发票，具体以实际出具的发票类型为准。',
          disabled: true,
        },
      ],
      checkboxOption4: [
        { value: 'list1', label: 'iPhone X' },
        { value: 'list2', label: 'HUAWEI P20' },
        { value: 'list3', label: 'OPPO Find X' },
      ],
      checkboxOption5: [
        { value: 'list1', label: '已选项' },
        { value: 'list2', label: '未选项' },
        { value: 'list3', label: '未选项' },
      ],
    }
  }

  private handleChangeThd(value: string[]): void {
    this.setState({
      checkedList3: value,
    })
  }

  private handleChangeUhd(value: string[]): void {
    this.setState({
      checkedList4: value,
    })
  }

  public render(): JSX.Element {
    return (
      <>
        <DemoBlock label='选项禁用' pure>
          <Checkbox
            options={this.state.checkboxOption3}
            value={this.state.checkedList3}
            onChange={this.handleChangeThd.bind(this)}
          />
        </DemoBlock>
        <DemoBlock label='强调操作' pure>
          <Checkbox
            type='between'
            options={this.state.checkboxOption4}
            value={this.state.checkedList4}
            onChange={this.handleChangeUhd.bind(this)}
          />
        </DemoBlock>
        <DemoBlock label='行内排列' pure>
          <Checkbox
            type='inline'
            options={this.state.checkboxOption5}
            value={this.state.checkedList4}
            onChange={this.handleChangeUhd.bind(this)}
          />
        </DemoBlock>
      </>
    )
  }
}

export default function () {
  return (
    <Layout title='复选框' qrcode='components/form/checkbox/index'>
      <CheckboxExample />
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| options | 选项列表 | `CheckboxOption<T>[]` | (必选) | |
| value | 选中项数组 | `T[]` | (必选) | 1.2.2 |
| icon | 自定义未选中 icon | `ReactNode` | -- | |
| theme | 单选/多选按钮主题色 | `string` | -- | 1.6.13 |
| type | 展现类型 | `"left" \| "inline" \| "between"` | `"left"` | |
| itemStyle | 每一项的样式 | `{}` | -- | 1.9.1 |
| itemClassName | 每一项的样式类名 | `string` | -- | 1.9.1 |
| titleClassName | 标题样式类名 | `string` | -- | 1.2.2 |
| titleStyle | 标题样式 | `{}` | -- | 1.2.2 |
| borderless | 是否隐藏下边框线 | `boolean` | `false` | 1.9.1 |
| selectedIcon | 自定义选中 icon | `ReactNode` | -- | |
| disabledIcon | 自定义禁用 icon | `ReactNode` | -- | |
| selectedDidsabledIcon | 自定义禁用且选中 icon | `ReactNode` | -- | |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onChange | 值变化时的回调 | `(value: T[]) => void` | (必选) | |
```