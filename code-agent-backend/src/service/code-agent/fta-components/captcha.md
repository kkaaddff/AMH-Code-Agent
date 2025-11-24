```markdown
# Captcha 验证码

验证码组件

## 引用
```tsx
import { Captcha } from '@fta/components'
```

## 示例

### 基础使用
```tsx
import { Captcha } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React from 'react'
import './index.scss'

export default function () {
  return (
    <Layout title={'验证码'} qrcode="components/form/captcha/index">
      <DemoBlock label="基础使用" pure style={{ backgroundColor: '#fff' }}>
        <Captcha
          length={4}
          autoSubmit
          blurOnSubmit
          duration={3}
          title="请输入验证码"
          desc="验证码发至188****8888，请在下方输入框输入4位数字验证码"
          onSubmit={() => Taro.showToast({ title: '验证码已提交' })}
          onMessage={() =>
            new Promise((resolve) => {
              Taro.showLoading({ title: '发送中...' })
              setTimeout(() => {
                resolve(null)
                Taro.hideLoading()
              }, 1200)
            })
          }
        />
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| value | 非受控组件时为默认值 | `string` | `""` | - |
| length | 验证码长度 | `number` | `6` | - |
| controls | 是否受控组件 | `boolean` | `false` | - |
| title | 标题 | `ReactNode` | `"输入验证码"` | - |
| desc | 描述，默认不展示 | `ReactNode` | `--` | - |
| autoFocus | 键盘是否自动弹起 | `boolean` | `true` | - |
| autoSubmit | 输入4位后是否自动提交 | `boolean` | `false` | - |
| autoCountdown | 自动触发倒计时 | `boolean` | `true` | - |
| caret | 是否显示插入光标，可自定义 | `boolean \| ReactElement` | `true` | - |
| caretColor | 自定义插入光标颜色 | `string` | `--` | - |
| duration | 倒计时时间，单位秒 | `number` | `60` | - |
| blurOnSubmit | 提交的时候收起键盘 | `boolean` | `false` | 1.0.10 |
| renderSuffix | 自定义渲染底部区域 | `(countdown: number, pending: boolean) => ReactNode` | `--` | - |
| inputProps | input的其他属性 | `{ children?: ReactNode; onConfirm?: () => void; ... }` | `--` | - |
| inputClassName | 真实输入框的类名 | `string` | `--` | - |
| inputStyle | 真实输入框的内联样式 | `{}` | `{}` | - |
| containerClassName | 容器类名 | `string` | `--` | 1.9.0 |
| containerStyle | 容器内联样式 | `{}` | `{}` | 1.9.0 |
| children | 子元素 | `any` | `--` | - |
| ref | 引用对象 | `null \| RefObject<CaptchaRef>` | `--` | - |
| key | React key | `Key \| null` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 |
|--------|------|------|--------|
| onChange | 验证码值改变时的回调 | `(value: string) => any` | `--` |
| onSubmit | 提交验证码的回调 | `(value: string) => any` | `--` |
| onMessage | 点击发送验证码的回调 | `async () => any` | `--` |

### Methods

- 无具体方法列出（文档中未提供有效方法定义）
```