# OptionSelect 选择组

提供多个选项供用户选择，一般在筛选和表单中使用。

## 说明

### 使用说明
- 单选默认可以取消选中，禁用取消请传入 `cancellable={false}`。

## 引用
```ts
import { OptionSelect } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { OptionSelect } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React, { useState } from 'react'
import { options1, options2, options7 } from './options'

export default () => {
  const [value, setValue] = useState('1')
  const [opts, setOpts] = useState<any>(options7.slice(0, -1))

  return (
    <Layout title='选择组' qrcode='components/basic/option-select/index'>
      <DemoBlock label='单选'>
        <OptionSelect
          animated
          options={options1}
          onChange={(v) => console.log(v)}
          defaultValue='1'
        />
      </DemoBlock>
      <DemoBlock label='多选'>
        <OptionSelect
          options={options1}
          onChange={(v) => console.log(v)}
          multiple
          defaultValue={['1', '2']}
        />
      </DemoBlock>
      <DemoBlock label='禁用状态'>
        <OptionSelect
          options={options2}
          onChange={(v) => console.log(v)}
          defaultValue='1'
        />
      </DemoBlock>
      <DemoBlock label='可删除（V1.2.0）'>
        <OptionSelect
          closable
          options={opts}
          column={0}
          onChange={setOpts}
          defaultValue={1}
        />
      </DemoBlock>
      <DemoBlock label='受控组件'>
        <OptionSelect
          controls
          options={options1}
          onChange={setValue}
          value={value}
        />
      </DemoBlock>
    </Layout>
  )
}
```

### 布局演示

```tsx
import { OptionSelect } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'
import { options3, options4, options5, options6 } from './options'

export default () => {
  return (
    <Layout title='选择组' qrcode='components/basic/option-select/index'>
      <DemoBlock label='两列布局'>
        <OptionSelect
          options={options3}
          column={2}
          onChange={(v) => console.log(v)}
          defaultValue='1'
        />
      </DemoBlock>
      <DemoBlock label='三列布局'>
        <OptionSelect
          options={options4}
          column={3}
          onChange={(v) => console.log(v)}
          defaultValue='1'
        />
      </DemoBlock>
      <DemoBlock label='四列布局'>
        <OptionSelect
          options={options5}
          column={4}
          onChange={(v) => console.log(v)}
          defaultValue='1'
        />
      </DemoBlock>
      <DemoBlock label='双行（V1.2.0）'>
        <OptionSelect
          options={options6}
          column={4}
          onChange={(v) => console.log(v)}
          defaultValue={1}
        />
      </DemoBlock>
    </Layout>
  )
}
```

### 自定义演示

```tsx
import { OptionSelect, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { Image } from '@tarojs/components'
import React from 'react'
import { options1, options5, options7 } from './options'

export default () => {
  return (
    <Layout title='选择组' qrcode='components/basic/option-select/index'>
      <DemoBlock label='自定义主题色（V1.2.4）'>
        <OptionSelect
          options={options5}
          column={4}
          onChange={(v) => console.log(v)}
          defaultValue='1'
          theme='#00997B'
          bgColor='#e5f4f1'
        />
      </DemoBlock>
      <DemoBlock label='自适应宽度（V1.2.0）'>
        <OptionSelect
          options={options7}
          column={0}
          onChange={(v) => console.log(v)}
          defaultValue={1}
          ellipisis
        />
      </DemoBlock>
      <DemoBlock label='自定义徽标(V1.2.0)'>
        <OptionSelect
          options={options1}
          onChange={(v) => console.log(v)}
          defaultValue='1'
          renderBadge={({ active }) => (
            <Image
              style={{
                opacity: Number(active),
                position: 'absolute',
                right: 0,
                top: 0,
                width: scale(28),
                height: scale(24),
              }}
              src='https://imagecdn.ymm56.com/ymmfile/static/resource/b89803a0-c5f6-4071-bd14-c323f80cd551.png'
            />
          )}
        />
      </DemoBlock>
      <DemoBlock label='自定义样式(V1.2.0)'>
        <OptionSelect
          activeStyle={{ backgroundColor: '#fff0e6 ', borderColor: 'red' }}
          column={0}
          options={options1}
          onChange={(v) => console.log(v)}
          defaultValue='1'
        />
      </DemoBlock>
    </Layout>
  )
}
```

### 业务场景

```tsx
import { OptionSelect, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'
import { options8 } from './options'

export default () => {
  return (
    <Layout title='选择组' qrcode='components/basic/option-select/index'>
      <DemoBlock label='列表选项组(V1.2.1)'>
        <OptionSelect
          showAsList
          options={options8}
          onChange={(v) => console.log(v)}
          defaultValue={'1'}
        />
      </DemoBlock>
    </Layout>
  )
}
```

## API

### OptionSelect Common Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| options | 选项列表 | `Option[]` | `(必选)` | - |
| column | 选项列数，设置为0可自适应宽度 | `0 \| 2 \| 3 \| 4` | `--` | V1.2.0 |
| rootProps | 根节点 props | `{}` | `--` | V1.2.0 |
| renderBadge | 自定义渲染徽标类元素，需自行设置绝对定位 | `(data: { active: boolean; disabled: boolean; }) => ReactNode` | `--` | V1.2.0 |
| activeClassName | 激活选项样式类名 | `string` | `--` | V1.2.0 |
| activeStyle | 激活选项内联样式 | `{}` | `--` | V1.2.0 |

### OptionSelect Single Props (单选)

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| cancellable | 是否可以取消选中（仅单选生效） | `boolean` | `true` | V1.2.1 |
| defaultValue | 选项默认值 | `any` | `--` | - |
| value | 选中项的值，建议与 `controls` 联用 | `any` | `--` | - |
| multiple | 是否多选 | `false` | `--` | - |
| controls | 是否为受控组件（带删除时强制受控） | `boolean` | `false` | V1.1.2 |
| showAsList | 是否以列表形式展示 | `boolean` | `false` | V1.2.1 |
| theme | 主题色 | `string` | `--` | V1.2.4 |
| bgColor | 选中项背景色 | `string` | `--` | V1.2.4 |
| ellipisis | 单行文字超出是否显示省略号 | `boolean` | `false` | V1.6.7 |
| animated | 是否启用切换动画 | `boolean` | `false` | V1.9.1 |
| textStyle | 自定义文本样式 | `(active: boolean) => {}` | `--` | V1.5.0 |
| props | 透传给每个 Item 的属性 | `(data: { active: boolean; index: number; }) => {}` | `--` | V1.6.0 |

### OptionSelect Multiple Props (多选)

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| multiple | 是否多选 | `true` | `(必选)` | - |
| defaultValue | 选项默认值 | `any` | `--` | - |
| value | 选中项的值，建议与 `controls` 联用 | `any` | `--` | - |
| controls | 是否为受控组件（带删除时强制受控） | `boolean` | `false` | V1.1.2 |
| showAsList | 是否以列表形式展示 | `boolean` | `false` | V1.2.1 |
| theme | 主题色 | `string` | `--` | V1.2.4 |
| bgColor | 选中项背景色 | `string` | `--` | V1.2.4 |
| ellipisis | 单行文字超出是否显示省略号 | `boolean` | `false` | V1.6.7 |
| animated | 是否启用切换动画 | `boolean` | `false` | V1.9.1 |
| textStyle | 自定义文本样式 | `(active: boolean) => {}` | `--` | V1.5.0 |
| props | 透传给每个 Item 的属性 | `(data: { active: boolean; index: number; }) => {}` | `--` | V1.6.0 |

### 事件

| 属性名 | 描述 | 类型 | 版本 |
|--------|------|------|------|
| onChange | 选中项改变时触发 | `(value: any, selected: Option \| Option[]) => void` | - |
| onClick | 点击选项时的回调 | `(data: { option: Option; index: number; }) => void` | V1.5.0 |

### Option

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| value | 选项的值 | `string \| number` | `(必选)` | - |
| label | 选项文字 | `ReactNode` | `--` | - |
| desc | 第二行文字 | `ReactNode` | `--` | V1.2.0 |
| note | 标签文本（仅在 `showAsList` 时生效） | `ReactNode` | `--` | V1.2.1 |
| disabled | 是否禁用 | `boolean` | `false` | - |