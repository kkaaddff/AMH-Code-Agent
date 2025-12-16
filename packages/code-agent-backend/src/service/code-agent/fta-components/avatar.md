```markdown
# Avatar 头像

需要更加直观的展现人物或事物特征。

## 引用
```jsx
import { Avatar } from '@fta/components'
```

## 示例

### 基础演示

```jsx
import { Avatar } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React from 'react'

const rectAvatar = 'https://imagecdn.ymm56.com/ymmfile/static/resource/eec68ce4-d43e-416d-b04c-9a0f11b3fa7b.png'
const circleAvatar = 'https://imagecdn.ymm56.com/ymmfile/static/resource/54ea09af-d6c2-4d3b-b309-d7b6a1893384.png'

function AvatarDemo(): JSX.Element {
  return (
    <>
      <DemoBlock label='圆形头像' alignItems='center' justifyContent='space-around'>
        <Avatar size='mini' src={circleAvatar} circle onClick={() =>
          Taro.previewImage({
            urls: [circleAvatar, circleAvatar, circleAvatar],
          })
        } />
        <Avatar size='small' src={circleAvatar} circle />
        <Avatar size='medium' src={circleAvatar} circle />
        <Avatar size='large' src={circleAvatar} circle />
      </DemoBlock>

      <DemoBlock label='圆角矩形头像' alignItems='center' justifyContent='space-around'>
        <Avatar size='mini' src={rectAvatar} />
        <Avatar size='small' src={rectAvatar} />
        <Avatar size='medium' src={rectAvatar} />
        <Avatar size='large' src={rectAvatar} />
      </DemoBlock>

      <DemoBlock label='圆形头像（支持文本）' alignItems='center' justifyContent='space-around'>
        <Avatar size='mini' text='好' circle />
        <Avatar size='small' text='运' circle />
        <Avatar size='medium' text='满' circle />
        <Avatar size='large' text='满' circle />
      </DemoBlock>

      <DemoBlock label='圆角矩形头像（支持文本）' alignItems='center' justifyContent='space-around'>
        <Avatar size='mini' text='好' />
        <Avatar size='small' text='运' />
        <Avatar size='medium' text='满' />
        <Avatar size='large' text='满' />
      </DemoBlock>

      <DemoBlock label='头像组(V1.3.0)' alignItems='center' justifyContent='space-around'>
        <Avatar.Group
          size={48}
          offset={12}
          list={[
            { src: 'https://imagecdn.ymm56.com/ymmfile/static/resource/d649429f-cda1-406e-9eb4-24905ccfdc04.png' },
            { src: 'https://imagecdn.ymm56.com/ymmfile/static/resource/d649429f-cda1-406e-9eb4-24905ccfdc04.png' },
            { src: 'https://imagecdn.ymm56.com/ymmfile/static/resource/d649429f-cda1-406e-9eb4-24905ccfdc04.png' },
          ]}
        />
        <Avatar.Group
          size={64}
          offset={16}
          list={[
            { src: 'https://imagecdn.ymm56.com/ymmfile/static/resource/d649429f-cda1-406e-9eb4-24905ccfdc04.png' },
            { src: 'https://imagecdn.ymm56.com/ymmfile/static/resource/d649429f-cda1-406e-9eb4-24905ccfdc04.png' },
            { src: 'https://imagecdn.ymm56.com/ymmfile/static/resource/d649429f-cda1-406e-9eb4-24905ccfdc04.png' },
          ]}
        />
      </DemoBlock>
    </>
  )
}

export default () => (
  <Layout title='头像' qrcode='components/basic/avatar/index'>
    <AvatarDemo />
  </Layout>
)
```

## API

### AvatarProps

| 属性名        | 描述                                       | 类型                          | 默认值       | 版本 |
|---------------|--------------------------------------------|-------------------------------|--------------|------|
| size          | 头像尺寸：mini - 48px, small - 56px, medium - 72px, large - 96px | `"mini" \| "small" \| "medium" \| "large"` | `"medium"` |      |
| circle        | 头像是否为圆形                             | `boolean`                     | `false`      |      |
| text          | 以文字形式展示头像                         | `string`                      | `--`         |      |
| textClassName | 文本类名                                   | `string`                      | `--`         |      |
| textStyle     | 文本内联样式                               | `{}`                          | `--`         |      |
| src           | 头像图片地址                               | `string`                      | `--`         |      |
| openData      | 参考微信开放数据，仅支持 `type: userAvatarUrl` | `{ type: 'userAvatarUrl' }`   | `--`         |      |
| bgColor       | 背景颜色                                   | `string`                      | `"#f3f4f6"`  |      |
| shape         | 图片形状：`circle`-圆形，`square`-方形     | `"circle" \| "square"`        | `"square"`   |      |
| errorIcon     | 加载失败时显示的图片                       | `ReactNode`                   | `--`         |      |
| showError     | 是否显示加载错误的图片                     | `boolean`                     | `true`       |      |
| loadingIcon   | 加载中的图片                               | `ReactNode`                   | `--`         |      |
| showLoading   | 是否显示加载中的图片                       | `boolean`                     | `true`       |      |
| asyncIcon     | 异步加载占位节点（设为 `false` 可禁用）    | `ReactElement \| false`       | `--`         |      |
| mode          | 图片缩放模式，不支持 `widthFix` 和 `heightFix` | `string \| number \| unknown` | `--`         |      |

### Events

| 属性名   | 描述               | 类型     | 默认值 |
|----------|--------------------|----------|--------|
| onClick  | 手指触摸后马上离开 | `function` | `--`   |

### AvatarGroupProps

| 属性名    | 描述                   | 类型             | 默认值    | 版本 |
|-----------|------------------------|------------------|-----------|------|
| list      | 图片列表（AvatarProps数组） | `AvatarProps[]` | `(必选)`  |      |
| showMore  | 是否显示更多图标       | `boolean`        | `--`      |      |
| size      | 图片大小               | `number`         | `48`      |      |
| offset    | 偏移量                 | `number`         | `--`      |      |
```