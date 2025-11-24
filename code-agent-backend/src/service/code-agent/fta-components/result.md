```markdown
# Result 结果页

操作结果页

## 引用
```jsx
import { Result } from '@fta/components'
```

## 示例

### 基础演示
```jsx
import { Result } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => (
  <Layout title='结果页' qrcode='components/tickling/result/index'>
    <DemoBlock pure bgColor='#ffffff' label='成功页' justifyContent='center'>
      <Result
        type='success'
        title='操作成功'
        desc='描述文案建议控制在二行内，告知当前状态、信息和解决方法等内容'
      />
    </DemoBlock>

    <DemoBlock pure bgColor='#ffffff' label='失败页' justifyContent='center'>
      <Result
        type='error'
        title='操作失败'
        desc='描述文案建议控制在二行内，告知当前状态、信息和解决方法等内容'
      />
    </DemoBlock>

    <DemoBlock pure bgColor='#ffffff' label='等待页' justifyContent='center'>
      <Result
        type='waiting'
        title='审核中'
        desc='描述文案建议控制在二行内，告知当前状态、信息和解决方法等内容'
      />
    </DemoBlock>

    <DemoBlock pure bgColor='#ffffff' label='警告页' justifyContent='center'>
      <Result
        type='warning'
        title='温馨提示'
        desc='描述文案建议控制在二行内，告知当前状态、信息和解决方法等内容'
      />
    </DemoBlock>

    <DemoBlock pure bgColor='#ffffff' label='信息页' justifyContent='center'>
      <Result
        type='info'
        title='温馨提示'
        desc='描述文案建议控制在二行内，告知当前状态、信息和解决方法等内容'
      />
    </DemoBlock>

    <DemoBlock pure bgColor='#ffffff' label='自定义图标' justifyContent='center'>
      <Result
        icon={{ value: 'EvaluateFilled', color: '#1a1a1a' }}
        title='自定义图标'
        desc='描述文案建议控制在二行内，告知当前状态、信息和解决方法等内容'
      />
    </DemoBlock>
  </Layout>
```

## API

### Props

| 属性名     | 描述                                   | 类型                        | 默认值       | 版本 |
|------------|----------------------------------------|-----------------------------|--------------|------|
| type       | 结果类型                               | `"warning" \| "info" \| "success" \| ...` | `"success"`  | -    |
| title      | 结果标题名称（第一行）                 | `any`                       | `--`         | -    |
| desc       | 结果描述文字（第二行）                 | `any`                       | `--`         | -    |
| src        | 结果图URL                              | `string`                    | `--`         | -    |
| icon       | 顶部显示的icon，优先级比src要低        | `unknown \| ReactElement`   | `--`         | -    |
| btnText    | 按钮文字                               | `string`                    | `"返回"`     | -    |
| renderBtn  | 自定义按钮节点                         | `ReactElement \| null \| false` | `--`      | -    |

### Events

| 属性名   | 描述                   | 类型           | 默认值 | 版本 |
|----------|------------------------|----------------|--------|------|
| onClick  | 点击按钮时的回调       | `() => void`   | `--`   | -    |
```