# Button 按钮

标记了一个（或封装一组）操作命令，响应用户点击行为，触发相应的业务逻辑。

## 说明

### 使用说明

- 此组件为 Taro [Button](https://taro-docs.jd.com/docs/components/forms/button) 组件加强版，在继承了原有功能外进行二次封装，扩充了满帮主题样式属性。
- 若按钮自定义样式程度高推荐基于 View 自定义会更方便。

## 引用

```ts
import { Button } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { Button, Icon } from '@fta/components'
import {
  DemoBlock,
  Gap as RawGap,
  Layout,
  Row,
} from '@fta/components/common/display'
import React, { ComponentProps } from 'react'
import './index.scss'

const Gap = (props: ComponentProps<typeof RawGap>) => (
  <RawGap height={12} {...props} />
)

function ButtonDemo(): JSX.Element {
  return (
    <>
      <DemoBlock
        label='按钮类型'
        full
        flexDirection='column'
        alignItems='stretch'
      >
        <Button
          type='primary'
          onClick={() => {
            console.log('onclick')
          }}
        >
          强按钮
        </Button>
        <Gap />
        <Button type='secondary'>弱按钮</Button>
        <Gap />
        <Button type='default'>次按钮</Button>
        <Gap />
        <Button type='text'>文本按钮</Button>
      </DemoBlock>

      <DemoBlock
        label='带图标的按钮'
        full
        flexDirection='column'
        alignItems='stretch'
      >
        <Button
          prefix={
            <Icon value='RouteNavigateFilled' size={36} color='#ffffff' />
          }
        >
          带图标
        </Button>
      </DemoBlock>

      <DemoBlock
        label='加载中'
        full
        flexDirection='column'
        alignItems='stretch'
      >
        <Button
          loading
          disabledWhenLoading
        >
          加载中
        </Button>
      </DemoBlock>

      <DemoBlock
        label='禁用'
        full
        flexDirection='column'
        alignItems='stretch'
      >
        <Button type='default' disabled>
          禁用按钮
        </Button>
      </DemoBlock>

      <DemoBlock
        label='按钮尺寸'
        full
        flexDirection='column'
        alignItems='stretch'
      >
        <Button type='primary' size='large'>
          按钮(large)
        </Button>
        <Gap height={16} />
        <Row style={{ alignContent: 'flex-end', alignItems: 'flex-end' }}>
          <Gap left={24} />
          <Button type='primary' size='medium'>
            按钮(medium)
          </Button>
          <Gap left={24} />
          <Button type='primary' size='small'>
            按钮(small)
          </Button>
        </Row>
      </DemoBlock>

      <DemoBlock
        label='带辅助文本(V1.3.0)'
        flexDirection='column'
        alignItems='stretch'
      >
        <Button desc='辅助文本'>主按钮</Button>
      </DemoBlock>
    </>
  )
}

export default function () {
  return (
    <Layout title={'按钮'} qrcode='components/basic/button/index'>
      <ButtonDemo />
    </Layout>
  )
}
```

### 业务场景

```tsx
import { ButtonGroup, Flex, Icon, Protocol, Radio, scale, Text } from '@fta/components'
import { DemoBlock, Layout, Gap as RawGap } from '@fta/components/common/display'
import React, { ComponentProps } from 'react'
import './index.scss'

const Gap = (props: ComponentProps<typeof RawGap>) => <RawGap height={12} {...props} />

const ServiceIcon = () => (
  <Flex.Center>
    <Icon value={'CustomerServiceOutlined'} size={48} color="#1a1a1a"></Icon>
    <Text level={6} color="#1a1a1a">按钮</Text>
  </Flex.Center>
)

function ButtonDemo(): JSX.Element {
  return (
    <>
      <DemoBlock label="按钮" full flexDirection="column" alignItems="stretch" pure>
        <ButtonGroup
          list={[
            {
              text: '按钮',
              onClick: () => {
                console.log('点击')
              },
            },
          ]}
        />
        <Gap height={24} />
        <ButtonGroup
          list={[
            {
              text: '按钮',
              type: 'secondary',
              width: scale(240),
            },
            {
              text: '按钮',
            },
          ]}
        />
        <Gap height={24} />
        <ButtonGroup
          list={[
            {
              text: '按钮',
              type: 'secondary',
            },
            {
              text: '按钮',
              type: 'secondary',
            },
            {
              text: '按钮',
            },
          ]}
        />
        <Gap height={24} />
        <ButtonGroup
          list={[
            {
              width: scale(88),
              text: <Icon value="MoreOutlined" size={36} color="#1a1a1a" />,
              type: 'default',
            },
            {
              text: '按钮',
              type: 'secondary',
            },
            {
              text: '按钮',
              type: 'default',
            },
            {
              text: '按钮',
            },
          ]}
        />
      </DemoBlock>

      <DemoBlock label="图标组合" full flexDirection="column" alignItems="stretch" pure>
        <ButtonGroup
          prefix={
            <React.Fragment>
              <ServiceIcon />
              <Gap width={28} />
            </React.Fragment>
          }
          list={[
            {
              text: '按钮',
              onClick: () => {
                console.log('点击')
              },
            },
          ]}
        />
        <Gap height={24} />
        <ButtonGroup
          prefix={
            <React.Fragment>
              <ServiceIcon />
              <Gap width={28} />
              <ServiceIcon />
              <Gap width={28} />
            </React.Fragment>
          }
          list={[
            {
              text: '按钮',
            },
          ]}
        />
        <Gap height={24} />
        <ButtonGroup
          prefix={
            <React.Fragment>
              <ServiceIcon />
              <Gap width={28} />
            </React.Fragment>
          }
          list={[
            {
              text: '按钮',
              type: 'secondary',
            },
            {
              text: '按钮',
            },
          ]}
        />
        <Gap height={24} />
        <ButtonGroup
          prefix={
            <React.Fragment>
              <ServiceIcon />
              <Gap width={28} />
              <ServiceIcon />
              <Gap width={28} />
            </React.Fragment>
          }
          list={[
            {
              text: '按钮',
              type: 'secondary',
            },
            {
              text: '按钮',
            },
          ]}
        />
      </DemoBlock>

      <DemoBlock label="勾选组合" full flexDirection="column" alignItems="stretch" pure>
        <ButtonGroup
          prefix={
            <Flex.Row flex={1} alignItems="center" style={{ height: '100%' }}>
              <Radio.Simple style={{ alignSelf: 'center' }} />
              <Text level={5} weight={500} color="#1a1a1a" style={{ marginLeft: scale(12) }}>
                全选
              </Text>
              <Gap width={16} />
            </Flex.Row>
          }
          list={[
            {
              width: scale(160),
              text: '按钮',
              type: 'secondary',
            },
            {
              width: scale(160),
              text: '按钮',
            },
          ]}
        />
        <Gap height={24} />
        <ButtonGroup
          header={
            <React.Fragment>
              <Protocol
                checked
                controls
                plain
                prefix="我已阅读并同意"
                list={[
                  {
                    title: '《协议XXXX内容》',
                    link: 'ymm://view/web?url=https://www.baidu.com',
                  },
                ]}
              />
              <Gap height={24} />
            </React.Fragment>
          }
          list={[
            {
              text: '按钮',
              onClick: () => {
                console.log('点击')
              },
            },
          ]}
        />
      </DemoBlock>

      <DemoBlock label="垂直排列(V1.3.0)" full flexDirection="column" alignItems="stretch" pure>
        <ButtonGroup
          vertical
          list={[
            {
              text: '按钮',
              type: 'secondary',
            },
            {
              text: '按钮',
              type: 'secondary',
            },
            {
              text: '按钮',
            },
          ]}
        />
      </DemoBlock>
    </>
  )
}

export default function () {
  return (
    <Layout title={'按钮'} qrcode="components/basic/button/index">
      <ButtonDemo />
    </Layout>
  )
}
```

### 自定义颜色

```tsx
import { Button } from '@fta/components'
import { DemoBlock, Layout, Gap as RawGap } from '@fta/components/common/display'
import React, { ComponentProps } from 'react'
import './index.scss'

const Gap = (props: ComponentProps<typeof RawGap>) => <RawGap height={12} {...props} />

function ButtonDemo(): JSX.Element {
  return (
    <>
      <DemoBlock label="自定义颜色" full flexDirection="column" alignItems="stretch">
        <Button size="large" type="primary" theme="#0154fe">
          强按钮
        </Button>
        <Gap />
        <Button size="large" type="default" theme="#0154fe">
          弱按钮
        </Button>
        <Gap height={24} />
        <Button size="large" type="primary" theme="#353535" textColor="#F7D69E">
          强按钮
        </Button>
        <Gap />
        <Button size="large" type="default" theme="#B36C16">
          弱按钮
        </Button>
      </DemoBlock>
    </>
  )
}

export default function () {
  return (
    <Layout title={'按钮'} qrcode="components/basic/button/index">
      <ButtonDemo />
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| size | 按钮的大小 | `"small" \| "medium" \| "large"` | `"large"` | - |
| type | 按钮的类型 | `"primary" \| "secondary" \| "default" \| "text"` | `--` | - |
| circle | 设置按钮圆角 | `boolean` | `false` | - |
| full | 是否通栏样式（即按钮宽度为屏幕宽度时的样式） | `boolean` | `false` | - |
| prefix | 按钮文字前缀icon，优先级比loading低 | `ReactNode` | `--` | - |
| suffix | 按钮文字后缀icon | `ReactNode` | `--` | - |
| loading | 设置按钮的载入状态 | `boolean \| Element` | `false` | - |
| disabled | 设置按钮为禁用态（不可点击） | `boolean` | `false` | - |
| disabledWhenLoading | 加载中设置按钮为禁用态（不可点击） | `boolean` | `false` | 1.9.1 |
| hoverClassName | 按钮激活时的类名，兼容h5和小程序 | `string` | `--` | - |
| textLevel | 按钮文字大小，对应Text组件的level | `1 \| 2 \| 5 \| 6 \| 4 \| 3` | `--` | 1.0.10 |
| plain | 大按钮消除margin | `boolean` | `false` | 1.2.0 |
| textProps | 文本属性配置 | `{ style?: object; level?: 1 \| ... }` | `--` | 1.2.4 |
| desc | 第二行文本 | `ReactNode` | `--` | 1.3.0 |
| textColor | 文字颜色 | `string` | `--` | 1.3.0 |
| bgColor | 背景色 | `string` | `--` | 1.3.0 |
| enableAbsolute | 保持原有的行为 | `boolean` | `false` | 1.8.5 |
| textStyle | 文本样式 | `{}` | `--` | - |
| theme | 主题色 | `string \| unknown[]` | `--` | - |
| token | design token | `{}` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onClick | 点击按钮时触发 | `(event: any) => void` | `--` | - |
| onClickWhenDisabled | [H5/小程序]禁用时点击的回调（Thresh端暂不支持） | `() => void` | `--` | 1.11.5 |
| onPressIn | 手指按下回调（仅支持Thresh，其他端请使用onTouchStart代替） | `(event: any) => void` | `--` | - |
| onPressOut | 手指抬起回调（仅支持Thresh，其他端请使用onTouchEnd代替） | `(event: any) => void` | `--` | - |