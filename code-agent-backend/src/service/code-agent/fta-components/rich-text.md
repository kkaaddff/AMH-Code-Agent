# RichText 富文本

## 介绍

富文本，常用于展示后端下发的 HTML 片段。

> **注意**：本组件只适用于展示简单的 HTML 片段，如果需要展示完整的 HTML 文档，请使用 WebView。

## 注意事项

配置富文本字符串时，应使用 `style` 而不使用 `attr`。

### 字体大小和颜色

**推荐写法：**
```html
<span>小明</span>
```

**不推荐写法：**
```html
<font size="5" color="#FA871E">小明</font>
```

### 图片宽高

**推荐写法：**
```html
<img src="https://imagecdn.ymm56.com/ymmfile/static/resource/ef125506-4a8d-4c36-a782-408b6f37ce75.png" />
```

**不推荐写法：**
```html
<img width="50px" height="20px" src="https://imagecdn.ymm56.com/ymmfile/static/resource/ef125506-4a8d-4c36-a782-408b6f37ce75.png" />
```

### 临时兼容办法

`FTA Mobile` 模板内提供了一个工具函数（`template/src/utils/rich-text.ts`），用于将富文本字符串中的 `font`、`img` 标签的 `attr` 属性转换为 `style` 形式，以兼容历史不标准配置。

## 示例

```jsx
import { DemoBlock, Layout } from '@fta/components/common/display'
import { RichText } from '@tarojs/components'
import React from 'react'

export default () => {
  return (
    <Layout title='RichText'>
      <DemoBlock label='使用节点列表' flexDirection='column' alignItems='stretch'>
        <RichText
          nodes={[
            {
              name: 'div',
              attrs: {
                class: 'div_class',
                style: 'line-height: 60px; color: red;',
              },
              children: [
                {
                  type: 'text',
                  text: 'Hello World!',
                },
              ],
            },
          ]}
        />
      </DemoBlock>

      <DemoBlock label='简单示例' flexDirection='column' alignItems='stretch'>
        <RichText nodes={`<span>Hello World!</span>`} />
      </DemoBlock>

      <DemoBlock label='设置样式' flexDirection='column' alignItems='stretch'>
        <RichText
          nodes={`<span>Hello <span>World!</span></span>`}
        />
      </DemoBlock>

      <DemoBlock label='单行溢出' flexDirection='column' alignItems='stretch'>
        <RichText
          nodes={`<span numberoflines="1">这是一段简单的文本，超出后会显示省略号 这是一段简单的文本，超出后会显示省略号 这是一段简单的文本，超出后会显示省略号</span>`}
        />
      </DemoBlock>

      <DemoBlock label='包含超链接' flexDirection='column' alignItems='stretch'>
        <RichText
          nodes={`<b>
            <font color=#FA871E>放空险连续购买服务</font>
            <font color=#666>是为司机用户推出的一款便捷且快速购买方式，司机用户在勾选同意<a>《连续购买服务协议》</a>后自动进行扣款且同时享受优惠价格</font>
          </b>`}
          onClick={(...args) => {
            console.log('onTap', args)
          }}
          onLinkClick={(attrs) => {
            console.log('onLinkClick', JSON.stringify(attrs, null, 2))
          }}
        />
      </DemoBlock>
    </Layout>
  )
}
```

## Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| nodes | 节点列表 / HTML 字符串 | `string \| Array` | `--` | - |
| space | 显示连续空格 | `"ensp" \| "emsp" \| "nbsp"` | `--` | - |
| baseStyle | 富文本的默认样式（优先级低于内联样式），仅 RN、Thresh 端支持 | `{}` | `--` | - |
| tagsStyles | 标签的默认样式（如 `{a: {color: 'blue'}}`），仅 RN、Thresh 端支持 | `{}` | `--` | - |
| renderersProps | 用于自定义渲染器（如 `{img: {onLayout}}`），仅 RN、Thresh 端支持 | `{}` | `--` | - |
| fontScale | 是否启用字体缩放，仅 Thresh 端支持 | `(value: number, prop: "fontSize") => number` | `--` | - |
| id | 组件的唯一标识，保持页面内唯一 | `string` | `--` | - |
| children | 子节点 | `ReactNode` | `--` | - |
| key | 列表中项目的唯一标识符 | `string \| number` | `--` | - |
| hidden | 组件是否显示 | `boolean` | `--` | - |
| animation | 动画属性 | `any` | `--` | - |
| ref | 引用 | `null \| string \| Function` | `--` | - |
| dangerouslySetInnerHTML | 渲染 HTML 内容 | `{ __html: string }` | `--` | - |

## Events

| 属性名 | 描述 | 类型 | 默认值 |
|--------|------|------|--------|
| onLinkClick | 点击超链接回调，仅 RN、Thresh 端支持 | `(attrs: Record<string, any>) => void` | `--` |
| onTouchStart | 手指触摸动作开始 | `(event: TouchEvent) => void` | `--` |
| onTouchMove | 手指触摸后移动 | `(event: TouchEvent) => void` | `--` |
| onTouchCancel | 手指触摸动作被打断（如来电提醒、弹窗） | `(event: TouchEvent) => void` | `--` |
| onTouchEnd | 手指触摸动作结束 | `(event: TouchEvent) => void` | `--` |
| onClick | 手指触摸后马上离开 | `(event: any) => void` | `--` |
| onLongPress | 手指触摸超过 350ms 再离开 | `(event: any) => void` | `--` |
| onLongClick | 手指长按（推荐使用 `onLongPress`） | `(event: any) => void` | `--` |
| onTransitionEnd | WXSS transition 或 Taro.createAnimation 动画结束时触发 | `(event: any) => void` | `--` |
| onAnimationStart | WXSS animation 动画开始时触发 | `(event: any) => void` | `--` |
| onAnimationIteration | WXSS animation 一次迭代结束时触发 | `(event: any) => void` | `--` |
| onAnimationEnd | WXSS animation 动画完成时触发 | `(event: any) => void` | `--` |
| onTouchForceChange | 在支持 3D Touch 的 iPhone 上重按时触发 | `(event: any) => void` | `--` |