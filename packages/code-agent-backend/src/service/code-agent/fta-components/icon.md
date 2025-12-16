```markdown
# Icon 图标

对需要使用图形来对基础操作功能进行隐喻呈现，给予用户正确、友好且清晰的操作指引。

## 引用
```tsx
import { Icon } from '@fta/components'
```

## 图标

### 线性风格
### 填充风格

#### 基础类
- LeftOutlined
- RightOutlined
- DownOutlined
- UpOutlined
- CheckOutlined
- CloseOutlined
- MoreOutlined
- CheckCircleOutlined
- CloseCircleOutlined
- MinusCircleOutlined
- MenuOutlined
- RollbackOutlined
- RedoOutlined
- ClockOutlined
- ExclamationOutlined
- PlusCircleOutlined
- LeftBorderOutlined
- RightBorderOutlined
- UpBorderOutlined
- DownBorderOutlined
- MoreBorderOutlined
- QuestionOutlined
- InfoOutlined
- TransformOutlined
- ArriveOutlined
- TopOutlined
- PlusOutlined
- MinusOutlined
- ReplaceBorderOutlined

#### 操作类
- LikeOutlined
- DislikeOutlined
- EditOutlined
- FormOutlined
- DeleteOutlined
- SettingOutlined
- SearchOutlined
- SendOutlined
- StarOutlined
- HeartOutlined
- ClassifyOutlined
- MessageOutlined
- EvaluateOutlined
- MailOutlined
- CalendarOutlined
- ProgressOutlined
- RuleOutlined
- StudyOutlined
- SealOutlined
- EyeOutlined
- ShareOutlined
- HistoryOutlined
- HomePageOutlined
- ServiceOutlined
- ScreeningOutlined

#### 音频图像
- BellOutlined
- HornOutlined
- CameraOutlined
- ImageOutlined
- PhoneOutlined
- CallrecordOutlined
- AudioOutlined
- CustomerServiceOutlined
- WechatOutlined

#### 运输类
- CarDeliverOutlined
- CarTransportOutlined
- CarTruckOutlined
- GoodsDistributeOutlined
- RouteNavigateOutlined
- RouteLocateOutlined

#### 交易类
- GiftOutlined
- CouponOutlined
- RedPacketOutlined
- GoldCoinOutlined
- WalletOutlined
- BankcardOutlined
- InsureOutlined

#### 系统设备
- VoiceOutlined
- KeyboardOutlined

#### 人群身份
- UserSingleOutlined

## Props

| 属性名       | 描述                         | 类型                                      | 默认值                          | 版本   |
|--------------|------------------------------|-------------------------------------------|----------------------------------|--------|
| value        | icon名称                     | `"LeftOutlined" \| "RightOutlined"...`    | (必选)                          |        |
| size         | 图标大小                     | `number \| small \| medium \| large`     | `'medium' 48px (720设计稿)`     |        |
| scale        | 是否根据屏幕宽度响应式缩放   | `boolean`                                 | `true`                          |        |
| color        | icon颜色                     | `string`                                  | `--`                            |        |
| prefixClass  | 自定义样式前缀               | `string`                                  | `"fta-icon"`                    |        |
| badge        | 徽标信息                     | `{ isDot?: boolean; value?: string }`     | `--`                            |        |
| fontFamily   | [Thresh] 后置字体图标必传    | `string`                                  | `--`                            | 1.9.12 |
| codePoint    | [Thresh] 图标code，自定义字体时必传 | `number`                             | `--`                            | 1.9.12 |

## Events

| 属性名   | 描述               | 类型                             | 默认值 |
|----------|--------------------|----------------------------------|--------|
| onClick  | 点击图标时的回调   | `(event: MouseEvent) => void`    | `--`   |

## What's new (2025/06/16)

从 `@fta/components@1.10.2` 开始，Thresh 端默认使用字体图标（之前是图片模拟）。

## 异步加载图标

为了方便业务使用自定义图标的能力，封装了 `fta-font-loader` 库来简化跨端调用。需保证 `@fta/components@^1.10.2` 版本。

### 安装使用
```bash
# 目前支持 Thresh / H5 / 微信和支付宝小程序
yarn add fta-font-loader
```

```tsx
// 跨端调用
import { createAsyncIconFont } from 'fta-font-loader'

const [MyIcon, { useAsyncIconFont: useMyIcon }] = createAsyncIconFont({
  // 自定义命令一个字体名
  fontFamily: 'my-font',
  // 字体CDN链接，推荐使用 .ttf, .woff 格式
  src: 'https://imagecdn.ymm56.com/ymmfile/static/resource/471803fc-eca6-41b2-bdf2-321d567f3532.ttf',
  // 语义化映射表，key可自定义，value是图标对应的unicode编码（16进制）
  mapping: {
    Clipped: 0xea01,
    Address: 0xea0c,
    // ...
  },
  // [不支持Thresh]是否预加载
  preload: false
})

export default () => {
  // 异步注册字体，Thresh端暂不支持preload，因此这一步不可省略
  useAsyncIconFont()
  return <MyIcon value='Address' size={24} color='red' />
}
```

### 小程序端限制

小程序不支持动态创建 CSS 文件，需自行编写 CSS 文件进行引入。例如：
```css
.fta-icon-my-font-Clipped::before {
  content: '\ea01';
}

.fta-icon-my-font-Address::before {
  content: '\ea0c';
}
```

### Thresh 简化调用

1. 在 `index.config.ts` 中配置字体：
```ts
// index.config.ts
export default {
  threshPageProps: {
    fonts: [
      {
        fontFamily: 'my-font',
        src: 'https://imagecdn.ymm56.com/ymmfile/static/resource/471803fc-eca6-41b2-bdf2-321d567f3532.ttf',
      },
    ],
  },
}
```

2. 语义化映射：
```ts
import { registerThreshAsyncIconFont } from 'fta-font-loader'

const MyIcon = registerThreshAsyncIconFont('my-font', {
  Clipped: 0xea01,
  Address: 0xea0c,
  // ...
})

export default () => <MyIcon value='Clipped' size={20} color='red' />
```

## 源文件

- fta-iconfont.ttf（字体文件）
```