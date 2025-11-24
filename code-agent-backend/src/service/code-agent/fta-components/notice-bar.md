# NoticeBar 通告栏

用于展示一行或多行通告文字。

## 引用
```tsx
import { NoticeBar } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import { NoticeBar } from '@fta/components'
import { DemoBlock, Gap as RawGap, Layout } from '@fta/components/common/display'
import React from 'react'
import './index.scss'

const Gap = () => <RawGap height={24} bgColor='#fff' />

export default class extends React.Component {
  render(): JSX.Element {
    return (
      <Layout title='通告栏' qrcode='components/tickling/notice-bar/index'>
        <DemoBlock
          label='状态类型'
          flexDirection='column'
          alignItems='stretch'
          pure
        >
          <NoticeBar
            showAtFirst
            marquee='fill'
            marqueeDelay={500}
          >
            重要状态/活动营销提示重要状态 重要状态/活动营销提示重要状态
            重要状态/活动营销提示重要状态
          </NoticeBar>
          <Gap />
          <NoticeBar marquee showAtFirst headToTail gapBetweenHeadAndTail={60}>
            重要状态/活动营销提示重要状态 重要状态/活动营销提示重要状态
            重要状态/活动营销提示重要状态
          </NoticeBar>
          <Gap />
          <NoticeBar
            icon
            close
            marquee
            vertical
            nativeProps={{
              version: 2,
            }}
            duration={3}
            text={['1111111', '2222222', '3333333']}
          />
          <Gap />
          <NoticeBar icon type='info'>
            重要状态/活动营销提示
          </NoticeBar>
          <Gap />
          <NoticeBar icon type='warning'>
            特殊状态提示
          </NoticeBar>
          <Gap />
          <NoticeBar icon type='error'>
            异常状态提示
          </NoticeBar>
          <Gap />
        </DemoBlock>
        <DemoBlock
          label='纯文本'
          flexDirection='column'
          alignItems='stretch'
          pure
        >
          <Gap />
          <NoticeBar single>
            内容提示文字内容提示文字内容提示文字内容提示文字内容提示文字
          </NoticeBar>
          <Gap />
        </DemoBlock>
        <DemoBlock
          label='可关闭'
          flexDirection='column'
          alignItems='stretch'
          pure
        >
          <Gap />
          <NoticeBar single close>
            内容提示文字内容提示文字内容提示文字内容提示文字内容提示文字
          </NoticeBar>
          <Gap />
        </DemoBlock>
      </Layout>
    )
  }
}
```

### 多行/图标
```tsx
import { Icon, NoticeBar, scale } from '@fta/components'
import { DemoBlock, Gap as RawGap, Layout } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React from 'react'
import './index.scss'

const Gap = () => <RawGap height={24} bgColor='#fff' />

export default class extends React.Component {
  render(): JSX.Element {
    return (
      <Layout title='通告栏' qrcode='components/tickling/notice-bar/index'>
        <DemoBlock
          label='多行展示'
          flexDirection='column'
          alignItems='stretch'
          pure
        >
          <Gap />
          <NoticeBar close>
            内容提示文字内容提示文字内容提示文字内容提示文字内容提示文字
          </NoticeBar>
          <Gap />
        </DemoBlock>
        <DemoBlock
          label='图标+查看'
          flexDirection='column'
          alignItems='stretch'
          pure
        >
          <Gap />
          <NoticeBar icon onClick={() => console.log('查看详情')}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: scale(28),
              }}
            >
              <View style={{ marginRight: scale(18), color: '#fd3333' }}>
                内容提示文字内容提示文字，查看详情
              </View>
              <Icon value='RightOutlined' size={32} color='#fd3333' />
            </View>
          </NoticeBar>
          <Gap />
          <NoticeBar icon onClick={() => console.log('查看详情')}>
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                fontSize: scale(28),
              }}
            >
              <View style={{ marginRight: scale(18), flex: 1, color: '#fd3333' }}>
                内容提示文字内容提示文字内容提示文字内容提示文字内容提示文字，查看详情
              </View>
              <Icon value='RightOutlined' size={32} color='#fd3333' />
            </View>
          </NoticeBar>
          <Gap />
          <NoticeBar
            icon
            align='center'
            onClick={() => console.log('查看详情')}
          >
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                fontSize: scale(28),
              }}
            >
              <View style={{ marginRight: scale(18), flex: 1, color: '#fd3333' }}>
                内容提示文字内容提示文字内容提示文字内容提示文字内容提示文字，查看详情
              </View>
              <Icon value='RightOutlined' size={32} color='#fd3333' />
            </View>
          </NoticeBar>
        </DemoBlock>
        <DemoBlock
          label='图标+查看+关闭操作'
          flexDirection='column'
          alignItems='stretch'
          pure
        >
          <Gap />
          <NoticeBar icon close onClick={() => console.log('查看详情')}>
            {'内容提示文字内容提示文字，查看详情>'}
          </NoticeBar>
          <Gap />
          <NoticeBar icon close onClick={() => console.log('查看详情')}>
            {'内容提示文字内容提示文字内容提示文字内容提示文字内容提示文字，查看详情>'}
          </NoticeBar>
          <Gap />
          <NoticeBar
            icon
            align='center'
            close
            onClick={() => console.log('查看详情')}
          >
            {'内容提示文字内容提示文字内容提示文字内容提示文字内容提示文字，查看详情>'}
          </NoticeBar>
        </DemoBlock>
      </Layout>
    )
  }
}
```

### 滚动/自定义图标
```tsx
import { Icon, NoticeBar, scale } from '@fta/components'
import { DemoBlock, Gap as RawGap, Layout } from '@fta/components/common/display'
import React from 'react'
import './index.scss'

const Gap = () => <RawGap height={24} bgColor='#fff' />

export default class extends React.Component {
  render(): JSX.Element {
    return (
      <Layout title='通告栏' qrcode='components/tickling/notice-bar/index'>
        <DemoBlock
          label='滚动播放'
          flexDirection='column'
          alignItems='stretch'
          pure
        >
          <Gap />
          <NoticeBar
            icon
            close
            marquee
            vertical
            duration={5}
            text={[
              Math.random() + '垂直滚动内容1垂直滚动内容1垂直滚动内容1垂直滚动内容1',
              Math.random() + '垂直滚动内容2垂直滚动内容2垂直滚动内容2垂直滚动内容2',
              Math.random() + '垂直滚动内容3垂直滚动内容3垂直滚动内容3垂直滚动内容3',
              Math.random() + '垂直滚动内容4垂直滚动内容4垂直滚动内容4垂直滚动内容4',
              Math.random() + '垂直滚动内容5垂直滚动内容5垂直滚动内容5垂直滚动内容5',
              Math.random() + '垂直滚动内容6垂直滚动内容6垂直滚动内容6垂直滚动内容6',
              Math.random() + '垂直滚动内容7垂直滚动内容7垂直滚动内容7垂直滚动内容7',
              Math.random() + '垂直滚动内容8',
            ]}
          />
          <Gap />
          <NoticeBar marquee close speed={100}>
            水平滚动文字，水平滚动文字，水平滚动文字
            水平滚动文字，水平滚动文字，水平滚动文字
          </NoticeBar>
          <Gap />
          <NoticeBar marquee close speed={100} headToTail>
            水平滚动文字跟随效果，V1.4.0开始支持H5～
          </NoticeBar>
        </DemoBlock>
        <DemoBlock
          label='自定义图标'
          flexDirection='column'
          alignItems='stretch'
          pure
        >
          <Gap />
          <NoticeBar icon={{ value: 'CalendarOutlined' }}>自定义图标</NoticeBar>
          <Gap />
          <NoticeBar
            icon={
              <Icon
                value='CalendarOutlined'
                size={40}
                color='#fd3333'
                style={{ marginRight: scale(16) }}
              />
            }
            suffix={<Icon value='RightOutlined' size={32} color='#fd3333' />}
          >
            自定义图标
          </NoticeBar>
          <Gap />
        </DemoBlock>
      </Layout>
    )
  }
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|-------|------|------|--------|------|
| close | 是否需要关闭按钮, 可传入自定义节点覆盖 | `boolean \| ReactNode` | `false` | - |
| single | 内容是否单行 | `boolean` | `false` | - |
| reverse | 左右图标位置是否对调 | `boolean` | `false` | - |
| marquee | 内容是否滚动（内容只能单行）<br>【H5】1.7.14 新增 `fill` 值，设置后只有内容超出才会横向滚动 | `boolean \| 'fill'` | `false` | - |
| marqueeDelay | 【H5/小程序】延迟滚动，单位 ms。滚动之前需要计算尺寸，计算尺寸需要等元素上屏 | `number` | `1000` | 1.7.14 |
| speed | 内容滚动速度（默认速度 100px/秒） | `number` | `100` | - |
| suffix | 自定义后缀 | `ReactNode` | `--` | - |
| icon | 内容前的 Icon 图标 | `ReactElement \| boolean \| unknown` | `--` | - |
| align | 图标对齐方式 | `"center" \| "flex-end" \| "flex-start"` | `--` | 1.2.2 |
| vertical | 是否纵向滚动，仅在 `marquee=true` 时生效 | `boolean` | `false` | 1.0.3-beta.4 |
| text | 纵向滚动时传入 text 数组 | `string \| ReactElement[]` | `--` | 1.0.3-beta.4 |
| duration | 垂直滚动时切换间隔，单位秒 | `number` | `3` | - |
| showAtFirst | 【`marquee` 为 true 时生效】是否一开始就显示 | `boolean` | `false` | 1.0.6 |
| type | 通知栏的类型 | `"warning" \| "info" \| "error"` | `"info"` | 1.0.8 |
| height | Thresh 垂直滚动专用 | `number` | `--` | - |
| startDelayTime | 【Thresh】动画开始的延迟时间，单位毫秒 | `number` | `true` | 1.4.0 |
| headToTail | 水平滚动是否是首尾相连的滚动方式 | `boolean` | `false` | 1.4.0 |
| gapBetweenHeadAndTail | 水平滚动首尾之间的间隔 | `number` | `44` | 1.4.0 |
| nativeProps | Thresh NoticeBar 原生属性 | `{}` | `--` | - |
| textStyle | 文本样式 | `{}` | `--` | - |
| children | 子元素 | `any` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 版本 |
|-------|------|------|------|
| onClose | 关闭时触发 | `(event: SyntheticEvent) => void` | - |
| onClick | 点击时回调 | `() => void` | 1.0.3-alpha.0 |

## SCSS 变量
```scss
$fta-noticebar-padding: 18px 28px;
$fta-noticebar-text-color: #ff5b00;
$fta-noticebar-bg-color: #fff3e8;
$fta-noticebar-font-size: $font-size-md;
$fta-noticebar-line-height: $line-height-md;
$fta-noticebar-icon-gap: 20px;
$fta-noticebar-btn-close-size: 32px;
$fta-noticebar-btn-close-margin-left: 55px;
$fta-noticebar-btn-close-color: #ff5b00;
```