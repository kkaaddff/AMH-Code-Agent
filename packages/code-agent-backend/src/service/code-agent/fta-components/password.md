# Password 密码输入框

通用密码输入框

## 引用
```javascript
import { Password } from '@fta/components'
```

## 示例

### 基础使用
```javascript
import { Gap, Password } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => (
  <Layout title="密码输入框" qrcode="components/form/password/index">
    <DemoBlock label="基础使用" full>
      <Password
        autofocus
        useOpacity={false}
        onComplete={(value) => {
          console.log('密码输入完成：', value)
        }}
      />
    </DemoBlock>

    <DemoBlock label="明文模式(验证码)" full>
      <Password
        plain
        onComplete={(value) => {
          console.log('验证码输入完成：', value)
        }}
      />
    </DemoBlock>

    <DemoBlock label="指定位数" full flexDirection="column">
      <Password length={6} />
      <Gap height={24} />
      <Gap height={48} width={720} bgColor="#f5f5f5" />
      <Gap height={24} />
      <Password length={5} />
      <Gap height={24} />
      <Gap height={48} width={720} bgColor="#f5f5f5" />
      <Gap height={24} />
      <Password length={4} />
    </DemoBlock>
  </Layout>
)
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| plain | 是否明文模式，默认为密码输入 | `boolean` | `false` | - |
| value | 值是否受控；默认值 | `string` | `false` | - |
| type | 键盘类型 | `"number" \| "text" \| "idcard" \| ...` | `--` | - |
| length | 长度 | `number` | `6` | - |
| caretColor | 自定义插入光标颜色 | `string` | `--` | - |
| autofocus | 是否自动聚焦 | `boolean` | `false` | - |
| inputProps | input框的属性集 | `{}` | `--` | - |
| useOpacity | Input的透明度是否为0 | `boolean` | `true` | - |
| itemStyle | 单元格样式 | `{}` | `--` | 1.9.7 |
| renderItem | 自定义渲染 | `(status: { active: boolean; ... }) => ReactNode` | `--` | - |
| ref | - | `null \| RefObject` | `--` | - |
| key | - | `Key \| null` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onChange | 值变化的回调 | `(value: string) => void` | `--` | - |
| onComplete | 输入完成时的回调 | `(value: string) => void` | `--` | - |