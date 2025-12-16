# Coupon 优惠券

## 引用
```javascript
import { Coupon } from '@fta/components'
```

## 示例

### 基础演示1
```javascript
import { Coupon } from '@fta/components'
import { DemoBlock, Gap, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => (
  <Layout title="优惠券" qrcode="components/display/coupon/index">
    <DemoBlock label="" pure alignItems="center" flexDirection="column">
      <Coupon
        type="rich"
        title="搬家无忧券"
        remark="平台券"
        period="2020.05.01-2020.06.01可用"
        desc="使用说明：文本文本文本文本文本文本文本"
      />
      <Gap />
      <Coupon
        type="rich"
        title="搬家无忧券"
        remark="短途券"
        period="2020.05.01-2020.06.01可用"
        remarkBgColor="#E6F2FF"
        remarkColor="#1E83FA"
        desc="使用说明：文本文本文本文本文本文本文本"
      />
      <Gap />
      <Coupon
        type="rich"
        status="used"
        title="搬家无忧券"
        remark="短途券"
        period="2020.05.01-2020.06.01可用"
        remarkBgColor="#E6F2FF"
        remarkColor="#1E83FA"
        desc="使用说明：文本文本文本文本文本文本文本"
      />
      <Gap />
      <Coupon
        type="rich"
        status="expired"
        title="搬家无忧券"
        remark="短途券"
        period="2020.05.01-2020.06.01可用"
        remarkBgColor="#E6F2FF"
        remarkColor="#1E83FA"
        desc="使用说明：文本文本文本文本文本文本文本"
      />
    </DemoBlock>
  </Layout>
)
```

### 基础演示2
```javascript
import { Coupon } from '@fta/components'
import { DemoBlock, Gap, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => (
  <Layout title="优惠券" qrcode="components/display/coupon/index">
    <DemoBlock label="" pure alignItems="center">
      <Coupon title="搬家无忧券" remark="平台券" period="2020.05.01-2020.06.01可用" />
      <Gap />
      <Coupon
        type="simple"
        title="搬家无忧券"
        remark="短途券"
        period="2020.05.01-2020.06.01可用"
        remarkBgColor="#E6F2FF"
        remarkColor="#1E83FA"
      />
      <Gap />
      <Coupon
        status="disabled"
        type="simple"
        title="搬家无忧券"
        remark="仅即时单可用"
        period="2020.05.01-2020.06.01可用"
        remarkBgColor="#E6F2FF"
        remarkColor="#1E83FA"
      />
      <Gap />
      <Coupon
        status="used"
        type="simple"
        title="搬家无忧券"
        remark="仅即时单可用"
        period="2020.05.01-2020.06.01可用"
        remarkBgColor="#E6F2FF"
        remarkColor="#1E83FA"
      />
      <Gap />
      <Coupon
        status="expired"
        type="simple"
        title="搬家无忧券"
        remark="仅即时单可用"
        period="2020.05.01-2020.06.01可用"
        remarkBgColor="#E6F2FF"
        remarkColor="#1E83FA"
      />
      <Gap />
    </DemoBlock>
  </Layout>
)
```

## API

### Props

| 属性名         | 描述                         | 类型                          | 默认值       | 版本 |
|----------------|------------------------------|-------------------------------|--------------|------|
| type           | 样式类型                     | `"simple" \| "rich"`          | `--`         |      |
| price          | 优惠券金额                   | `number`                      | `50`         |      |
| meet           | 使用条件，满xx元可用，支持自定义字符串 | `number \| string`            | `150`        |      |
| title          | 优惠券名称                   | `string`                      | `--`         |      |
| remark         | 优惠券类型                   | `string`                      | `"通用券"`   |      |
| remarkColor    | 类型文字颜色                 | `string`                      | `--`         |      |
| remarkBgColor  | 类型背景颜色                 | `string`                      | `--`         |      |
| period         | 有效期                       | `string`                      | `--`         |      |
| status         | 优惠券状态                   | `"disabled" \| "unused" \| "used" \| "expired"` | `--` |      |
| desc           | 使用说明                     | `string`                      | `--`         |      |
| src            | 背景图片                     | `string`                      | `--`         |      |
| btnText        | 按钮文本（仅 `type='rich'` 且 `status='unused'` 时生效） | `string` | `"去使用"` |      |
| showExpand     | 是否展示展开图标             | `boolean`                     | `true`       |      |

### Events

| 属性名       | 描述                             | 类型           | 默认值 | 版本 |
|--------------|----------------------------------|----------------|--------|------|
| onClick      | 点击优惠券的回调                 | `() => any`    | `--`   |      |
| onBtnClick   | 按钮或单选框点击回调（仅 `status='unused'` 时生效） | `() => any` | `--` |      |
| onExpand     | 点击展开图标（下箭头）的回调     | `() => any`    | `--`   |      |