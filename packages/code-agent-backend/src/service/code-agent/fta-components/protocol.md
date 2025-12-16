```markdown
# Protocol 协议

协议组件用于展示用户需阅读并同意的服务协议、隐私政策等内容，支持自定义前缀、后缀、协议列表、富文本协议等。

## 引用

```jsx
import { Protocol } from '@fta/components'
```

## 示例

### 基础使用

```jsx
import { Protocol } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React, { useState } from 'react'

export default () => {
  const [checked, toggle] = useState(false)

  const onLinkClick = (detail: { title: string; link: string }, i: number) =>
    Taro.showModal({
      title: `点击了第${i ? '?' : i + 1}个${detail.title || '富文本链接'}，链接${detail.link}`,
    })

  return (
    <Layout title="协议" qrcode="components/form/protocol/index">
      <DemoBlock label="基础使用">
        <Protocol
          controls
          checked={checked}
          onChange={toggle}
          prefix="本人已经阅读并同意"
          list={[
            {
              title: '用户隐私安全协议',
              link: 'https://www.ymm56.com?mock=safety',
            },
          ]}
          suffix="的相关内容"
          onLinkClick={onLinkClick}
        />
      </DemoBlock>

      <DemoBlock label="小圆点">
        <Protocol
          dot
          prefix="请您仔细阅读并同意"
          list={[
            {
              title: '用户隐私安全协议',
              link: 'https://www.ymm56.com?mock=safety',
            },
            {
              title: '运满满运输协议',
              link: 'https://www.ymm56.com?mock=transport',
            },
          ]}
          onPrefixClick={() => console.log('click prefix')}
          onLinkClick={onLinkClick}
        />
      </DemoBlock>

      <DemoBlock label="自定义颜色">
        <Protocol
          controls
          checked={checked}
          onChange={toggle}
          radioColor="#00997B"
          textColor="#00997B"
          linkColor="#0666F6"
          prefixStyle={{ color: '#1a1a1a' }}
          list={[
            {
              title: '用户隐私安全协议',
              link: 'https://www.ymm56.com?mock=safety',
            },
            {
              title: '运满满运输协议',
              link: 'https://www.ymm56.com?mock=transport',
            },
          ]}
          onLinkClick={onLinkClick}
        />
      </DemoBlock>

      <DemoBlock label="省略书名号">
        <Protocol
          checked={checked}
          controls
          plain
          list={[
            {
              title: '用户隐私安全协议',
              link: 'https://www.ymm56.com?mock=safety',
            },
          ]}
          onLinkClick={onLinkClick}
        />
      </DemoBlock>

      <DemoBlock label="富文本协议(V1.1.3)">
        <Protocol
          controls
          useRichText
          richText='点击领取并发货即视为您已阅读并同意<a href="https://static.ymm56.com/online-pay/index.html?jsb_version=2#/agreement/agreementContent?id=3910">《满帮平台优车计划服务说明》</a>'
          checked={checked}
          onChange={toggle}
          onLinkClick={onLinkClick}
        />
      </DemoBlock>

      <DemoBlock label="非受控组件">
        <Protocol
          controls
          checked
          list={[
            {
              title: '用户隐私安全协议',
              link: 'https://www.ymm56.com?mock=safety',
            },
            {
              title: '运满满运输协议',
              link: 'https://www.ymm56.com?mock=transport',
            },
          ]}
          onLinkClick={onLinkClick}
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
| checked | 是否同意协议 | `boolean` | `--` | |
| dot | 是否显示小圆点 | `boolean \| ReactElement` | `--` | |
| controls | 是否为受控组件 | `boolean` | `--` | |
| list | 协议列表 | `ProtocolDetail[]` | `--` | |
| prefix | 协议前缀 | `ReactNode` | `"我已阅读并同意"` | |
| suffix | 协议后缀，默认样式和前缀样式相同 | `ReactNode` | `null` | |
| plain | 不显示书名号《》 | `boolean` | `false` | |
| textColor | 文字颜色 | `string` | `--` | |
| linkColor | 链接颜色 | `string` | `--` | |
| radioColor | 单选按钮背景色 | `string` | `--` | |
| prefixClassName | 自定义prefix样式 | `string` | `--` | |
| prefixStyle | 自定义prefix样式 | `{}` | `--` | |
| textClassName | 自定义文字样式 | `string` | `--` | |
| textStyle | 自定义文字样式 | `{}` | `--` | |
| linkClassName | 自定义协议样式 | `string` | `--` | |
| linkStyle | 自定义协议样式 | `{}` | `--` | |
| actionClassName | 左侧小圆点或单选框容器样式 | `string` | `--` | |
| actionStyle | 左侧小圆点或单选框的容器样式 | `{}` | `--` | |
| useRichText | 是否使用富文本协议 | `boolean` | `false` | 1.1.3 |
| richText | 富文本协议内容 | `string` | `--` | 1.1.3 |
| richTextProps | 富文本组件props | `any` | `--` | |
| radioProps | 单选框属性配置 | `{ controlled: boolean; active?...` | `--` | 1.2.2 |
| children | 子元素 | `any` | `--` | |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onPrefixClick | 点击前缀 | `() => any` | `--` | |
| onSuffixClick | 点击后缀 | `() => any` | `--` | |
| onLinkClick | 点击协议 | `(detail: { title: string; link: string }) => any` | `--` | |
| onChange | 勾选/取消勾选协议的回调 | `(checked: boolean) => any` | `--` | |
```