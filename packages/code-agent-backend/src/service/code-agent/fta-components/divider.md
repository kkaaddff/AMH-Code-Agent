# Divider 分割线

区隔内容的分割线。

- 对不同章节的文本段落进行分割。
- 对行内文字/链接进行分割，例如表格的操作列。

## 引用
```javascript
import { Divider } from '@fta/components'
```

## 示例

### 基础演示
```javascript
import { Divider } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => (
  <Layout title="分割线" qrcode="components/layout/divider/index">
    <DemoBlock label="直线拉通" full alignItems="stretch" flexDirection="column">
      <Divider padding={0} />
    </DemoBlock>

    <DemoBlock label="左右边距" full alignItems="stretch" flexDirection="column">
      <Divider padding={24} />
    </DemoBlock>

    <DemoBlock label="虚线拉通" full alignItems="stretch" flexDirection="column">
      <Divider dashed padding={0} />
    </DemoBlock>

    <DemoBlock label="文字+虚线" full alignItems="stretch" flexDirection="column">
      <Divider dashed text="文字信息" />
    </DemoBlock>

    <DemoBlock label="文字+直线" full alignItems="stretch" flexDirection="column">
      <Divider text="文字信息" />
    </DemoBlock>

    <DemoBlock label="纯文字" full alignItems="stretch" flexDirection="column">
      <Divider text="没有更多了~" />
    </DemoBlock>

    <DemoBlock label="垂直分割" alignItems="stretch" flexDirection="column">
      <Divider text={['文字信息', '文字信息', '文字信息']} />
    </DemoBlock>
  </Layout>
)
```

## API

### Props

| 属性名       | 描述                                       | 类型                          | 默认值     | 版本 |
|--------------|--------------------------------------------|-------------------------------|------------|------|
| dashed       | 是否虚线，rn端支持不太理想，尤其是iOS      | `boolean`                     | `false`    |      |
| hairline     | 是否细线                                   | `boolean`                     | `true`     |      |
| dot          | 是否以点替代文字，优先于text字段起作用     | `boolean`                     | `false`    |      |
| padding      | 左右边距（设计稿为720）                    | `number`                      | `--`       |      |
| text         | 文本内容，如果为数组则为垂直分割           | `string \| number \| ReactElement...` | `--`       |      |
| pure         | 是否是纯文字                               | `boolean`                     | `false`    |      |
| textStyle    | 文本样式                                   | `{}`                          | `--`       |      |
| textClassName| 文本类名                                   | `string`                      | `--`       |      |
| textPosition | 内容文本的位置                             | `"left" \| "center" \| "right"` | `"center"` |      |
| lineColor    | 线条颜色                                   | `string`                      | `"#dcdfe6"`|      |