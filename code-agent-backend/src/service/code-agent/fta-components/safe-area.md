```markdown
# SafeArea 安全区

在全面屏下提供自适应的边距调整，当网页被全屏展示时，可借助安全区实现自动适配。  
SafeArea 组件的底层实现基于 `env(safe-area-inset-xxx)`。

## 说明

### 平台差异说明
- 在满帮 APP 环境下的 H5 页面若为沉浸式，需显式传入 `immersive={true}`。
- 该组件无法准确判断安卓端是否为沉浸式页面（因底部导航键可能导致逻辑判断错误）。

## 引用
```javascript
import { SafeArea, SafeAreaView } from '@fta/components'
```

## 示例

### 基础演示
```jsx
import { SafeArea, Text } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => (
  <Layout title='安全区' qrcode='components/layout/safe-area/index'>
    <DemoBlock label='顶部安全区' pure>
      <SafeArea
        immersive // H5 中必传
        top
        color='#ffffff'
      />
    </DemoBlock>

    <DemoBlock label='底部安全区' pure>
      <SafeArea
        immersive // H5 中必传
        bottom
        color='#fd3333'
        style={{ backgroundColor: 'red' }}
      />
    </DemoBlock>

    <DemoBlock label='内容在安全区内' pure>
      <SafeArea.View
        immersive // H5 中必传
        style={{ backgroundColor: 'red', textAlign: 'center' }}
      >
        <Text style={{ textAlign: 'center' }} color='white'>
          内容区域包裹在安全区内
        </Text>
      </SafeArea.View>
    </DemoBlock>
  </Layout>
)
```

## API

### Props

| 属性名       | 描述                         | 类型       | 默认值   | 版本   |
|--------------|------------------------------|------------|----------|--------|
| top          | 顶部安全区                   | `boolean`  | `false`  | -      |
| bottom       | 底部安全区                   | `boolean`  | `true`   | -      |
| children     | 子节点                       | `ReactNode`| `--`     | -      |
| disabled     | 是否禁用安全区               | `boolean`  | `false`  | -      |
| useMargin    | 使用 margin 适配安全区（默认使用 padding） | `boolean`  | `false`  | -      |
| immersive    | 当前是否为沉浸式屏幕         | `boolean`  | `--`     | -      |
| color        | 安全区背景色（默认透明）     | `string`   | `--`     | 1.6.0  |
```