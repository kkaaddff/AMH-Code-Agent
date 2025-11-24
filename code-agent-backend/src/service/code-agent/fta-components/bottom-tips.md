# BottomTips 页底提示

显示在一级页面最底部，常用于品牌标识、口号展示。

## 引用
```tsx
import { BottomTips } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import { BottomTips, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { Text, View } from '@tarojs/components'
import React from 'react'

const demoStyle = { height: scale(192), backgroundColor: '#fff', borderRadius: scale(16) }

export default () => (
  <Layout title='页底提示' qrcode='components/tickling/bottom-tips/index'>
    <DemoBlock label='运满满'>
      <BottomTips app='YMM'>
        <View style={demoStyle}></View>
      </BottomTips>
    </DemoBlock>
    <DemoBlock label='货车帮'>
      <BottomTips app='HCB'>
        <View style={demoStyle}></View>
      </BottomTips>
    </DemoBlock>
  </Layout>
)
```

### 业务场景
```tsx
import { BottomTips, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { Text, View } from '@tarojs/components'
import React from 'react'

const demoStyle = { height: scale(192), backgroundColor: '#fff', borderRadius: scale(16) }

export default () => (
  <Layout title='页底提示' qrcode='components/tickling/bottom-tips/index'>
    <DemoBlock label='自定义slogan'>
      <BottomTips app='YMM' slogan='中国公路物流基础设施'>
        <View style={demoStyle}></View>
      </BottomTips>
    </DemoBlock>
    <DemoBlock label='通用'>
      <BottomTips
        customTip={
          <Text
            style={{
              color: '#999',
              fontSize: scale(24),
              lineHeight: scale(33),
            }}
          >
            让公路物流更美好
          </Text>
        }
      >
        <View style={demoStyle}></View>
      </BottomTips>
    </DemoBlock>
  </Layout>
)
```

## API

### Props

| 属性名     | 描述                                   | 类型        | 默认值     | 版本 |
|------------|----------------------------------------|-------------|------------|------|
| app        | 类型                                   | `"YMM" \| "HCB"` | `"YMM"`    | -    |
| customTip  | 自定义页底提示，传入时 logo、slogan 会失效 | `ReactNode` | `--`       | -    |
| children   | 页面主体内容                           | `ReactNode` | `--`       | -    |
| logo       | logo 图片的 URL                        | `string`    | `--`       | -    |
| slogan     | slogan 文案                            | `string`    | `--`       | -    |