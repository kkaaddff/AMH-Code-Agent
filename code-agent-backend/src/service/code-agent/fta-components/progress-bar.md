# ProgressBar 进度条

简单的进度条组件。

## 引用
```javascript
import { ProgressBar } from '@fta/components'
```

## 示例

### 基础使用
```javascript
import { Button, ErrorTip, Flex, ProgressBar, scale, Text } from '@fta/components'
import { DemoBlock, Gap, Layout } from '@fta/components/common/display'
import React, { useState } from 'react'

export default () => {
  const [percent, setPercent] = useState(60)

  return (
    <Layout title="进度条" qrcode="components/display/progress-bar/index">
      <DemoBlock label="基础使用" alignItems="stretch" flexDirection="column">
        <Flex.Row>
          <Button type="secondary" size="medium" onClick={() => setPercent((v) => Math.max(0, v - 10))}>
            进度-10
          </Button>
          <Gap width={24} />
          <Button size="medium" type="default" onClick={() => setPercent(60)}>
            重置
          </Button>
          <Gap width={24} />
          <Button size="medium" onClick={() => setPercent((v) => Math.min(100, v + 10))}>
            进度+10
          </Button>
        </Flex.Row>
        <ProgressBar percent={percent} />
      </DemoBlock>

      <DemoBlock label="禁用" alignItems="stretch">
        <ProgressBar percent={60} disabled />
      </DemoBlock>

      <DemoBlock label="带错误提示" flexDirection="column" alignItems="stretch">
        <ProgressBar color="#ff3333" percent={60} />
        <ErrorTip text="错误提示文案" />
      </DemoBlock>

      <DemoBlock label="不显示百分比" alignItems="stretch">
        <ProgressBar percent={50} text={false} />
      </DemoBlock>

      <DemoBlock label="自定义样式" alignItems="stretch">
        <ProgressBar
          style={{
            height: scale(16),
          }}
          round={8}
          percent={percent}
          text={(percent) => (
            <Text type="warning" level={5}>
              {` 已完成${percent}% ${percent < 60 ? '(不及格)' : ''}`}
            </Text>
          )}
          color="#1fb080"
          bgColor="#cccccc"
        />
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性 | 描述 | 类型 | 默认值 | 版本 |
|------|------|------|--------|------|
| percent | 百分比 | `number` | `0` | - |
| round | 是否显示圆角，可设为数值控制圆角大小 | `boolean \| number` | `true` | - |
| text | 右侧文字区域，默认显示百分比，可设为 `false` 隐藏，或传入函数自定义内容 | `boolean \| ReactNode \| (percent: number) => ReactNode` | `--` | - |
| color | 进度条前景色 | `string` | `--` | - |
| bgColor | 进度条背景色 | `string` | `--` | - |
| disabled | 是否禁用 | `boolean` | `false` | - |
| disabledColor | 禁用状态下的前景色 | `string` | `--` | - |
| disabledBgColor | 禁用状态下的背景色 | `string` | `--` | - |