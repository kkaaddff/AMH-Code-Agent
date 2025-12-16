```markdown
# Keyboard 键盘

通用键盘组件，包含数字键盘、身份证键盘等，可以传入正则或函数形式的 `validator` 自定义校验规则。

内置了以下三种键盘的校验逻辑：
- 数字键盘（合法数字）
- 小数键盘
- 身份证键盘

可以设置 `controlled` 属性来使输入过程受控。

## 引用
```tsx
import { Keyboard } from '@fta/components'
```

## 示例

### 基础使用
```tsx
import { Keyboard } from '@fta/components'
import {
  DemoBlock,
  Layout,
  List,
  ListItem,
} from '@fta/components/common/display'
import { Text, View } from '@tarojs/components'
import React, { useState } from 'react'
import './index.scss'

const Types = {
  number: '数字',
  decimal: '小数',
  id: '身份证',
  custom: '自定义',
}

const { Placeholder, DeleteButton, Button: KeyboardButton } = Keyboard
type Type = keyof typeof Types

const customButtons = '满帮大前端团队跨平台开发框架'.split('')

const KeyboardExample = () => {
  const [value, setValue] = useState('')
  const [visible, toggle] = useState(true)
  const [type, changeType] = useState<Type>('number')
  const [customVisible, toggleCustomVisbile] = useState(false)
  const [custom, toggleCustom] = useState(false)
  const [ordered, toggleOrder] = useState(true)

  const change = (type: Type, ordered = true, custom = false) => {
    toggleOrder(ordered)
    toggleCustom(custom)
    changeType(type)
    toggle(true)
  }

  return (
    <>
      <DemoBlock label='基础使用' pure>
        <List>
          <ListItem title='数字键盘' onClick={() => change('number')} />
          <ListItem
            title='数字键盘(带小数点)'
            onClick={() => change('decimal')}
          />
          <ListItem title='身份证键盘' onClick={() => change('id')} />
          <ListItem
            title='乱序键盘'
            onClick={() => change(type, false, custom)}
          />
          <ListItem
            title='自定义键盘'
            onClick={() => change('custom', ordered, true)}
          />
          <ListItem
            title='自定义键盘(受控)'
            onClick={() => toggleCustomVisbile(true)}
          />
        </List>
      </DemoBlock>

      <DemoBlock label='卡片形式(1.8.1)' pure>
        <Keyboard
          mode='view'
          value=''
          controlled
          onChange={(val) => {
            console.log('mode=view onChange', val)
          }}
          hideInputBox
        />
      </DemoBlock>

      <Keyboard
        onChange={(val) => console.log('value change', val)}
        customStyle={{ backgroundColor: 'transparent' }}
        title={null}
        disorder={!ordered}
        placeholder={
          '请输入' +
          (type !== 'custom' ? Types[type] : ` ${customButtons.join('')}`)
        }
        type={type}
        isOpened={visible}
        onClose={() => toggle(false)}
        customButtons={customButtons}
      />

      <Keyboard
        value={value}
        controlled
        title={{
          title: '客制化键盘',
          confirmText: '确定',
          cancelText: '取消',
          onCancel: () => toggleCustomVisbile(false),
          onConfirm: () => toggleCustomVisbile(false),
        }}
        placeholder={'马？梅'}
        type='custom'
        isOpened={customVisible}
        onClose={() => toggleCustomVisbile(false)}
      >
        <KeyboardButton onClick={() => setValue('马什么梅？')}>
          马?梅
        </KeyboardButton>
        <Placeholder />
        <Placeholder />
        <Placeholder />
        <KeyboardButton onClick={() => setValue('马东什么？')}>
          马东？
        </KeyboardButton>
        <Placeholder />
        <Placeholder />
        <Placeholder />
        <KeyboardButton onClick={() => setValue('什么冬梅？')}>
          ？冬梅
        </KeyboardButton>
        <KeyboardButton onClick={() => setValue('原来是马冬梅')}>
          揭晓答案
        </KeyboardButton>
        <Placeholder />
        <KeyboardButton onClick={() => setValue(value.slice(0, -1))}>
          <DeleteButton />
        </KeyboardButton>
        <View
          className='demo-keyboard-custom'
          onClick={() => setValue('')}
          style={{ opacity: value ? 1 : 0.4 }}
        >
          <Text className='demo-keyboard-custom__text'>重置</Text>
        </View>
      </Keyboard>
    </>
  )
}

export default () => (
  <Layout title='键盘' qrcode='components/form/keyboard/index'>
    <KeyboardExample />
  </Layout>
)
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| value | 默认值，组件接受后被转成字符串类型 | `string \| number` | `""` | - |
| controlled | 是否是受控组件，不执行校验 | `boolean` | `false` | - |
| type | 键盘类型 | `"number" \| "id" \| "decimal" \| ...` | `"number"` | - |
| placeholder | 提示文本 | `string` | `--` | - |
| maxlength | 可输入的最大长度 | `number` | `140` | - |
| hideInputBox | 是否显示 input 框展示输入结果 | `boolean` | `true` | - |
| validator | 校验规则正则或函数 | `unknown \| (result: string, type: string) => boolean` | `--` | - |
| disorder | 是否乱序排列 | `boolean` | `false` | - |
| customButtons | 自定义键盘列表，仅在 `type='custom'` 时生效 | `string \| number[]` | `--` | - |
| children | 自定义渲染区域，仅在 `type='custom'` 时生效 | `ReactNode` | `--` | - |
| prefix | 自定义头部内容 | `ReactNode` | `--` | 1.1.0 |
| suffix | 自定义底部内容 | `ReactNode` | `--` | 1.1.0 |
| mode | 展示方式，默认以 ActionSheet 方式 | `"sheet" \| "view"` | `"sheet"` | 1.8.1 |
| isOpened | 是否展示元素 | `boolean` | `(必选)` | - |
| title | 元素的标题 | `ReactNode \| unknown` | `--` | - |
| cancelText | 取消按钮的内容 | `string` | `--` | - |
| containerClassName | 容器样式 | `string` | `--` | - |
| containerStyle | 容器样式 | `{}` | `--` | - |
| contentClassName | 容器子节点样式 | `string` | `--` | - |
| contentStyle | 容器子节点样式 | `{}` | `--` | - |
| overlayClassName | 背景蒙层类名 | `string` | `--` | - |
| overlayStyle | 背景蒙层内联样式 | `{}` | `--` | - |
| useNativeModal | RN/Thresh 端是否使用原生 Modal 组件 | `boolean` | `true` | - |
| catchMove | 是否阻止内容滑动穿透 | `boolean` | `true` | - |
| clickOverlayOnClose | 点击背景蒙层关闭，记得绑定 onClose 回调关闭 | `boolean` | `true` | - |
| example | 示例区域（安卓示例区域不可点击） | `ReactNode` | `--` | - |
| animated | 是否显示从底部弹出的动画效果 | `boolean` | `true` | 1.0.6 |
| safeArea | 是否显示底部安全区 | `boolean \| Omit<SafeAreaProps>` | `true` | 1.0.9 |
| modalProps | 弹窗 props | `{ onShow?: () => void; transparent?: boolean; }` | `--` | 1.0.10 |
| theme | 确定按钮主题色 | `string` | `--` | 1.2.0 |
| sibling | Thresh 端 Modal 组件的前后缀节点 | `{ prev?: ReactNode; next?: ReactNode; }` | `--` | 1.6.2 |
| headerProps | 透传给头部节点的其他属性 | `{}` | `--` | 1.7.12 |
| portal | [H5] 是否挂载到根节点 | `boolean \| HTMLElement` | `false` | 1.7.14 |
| direction | 书写方向 | `"rtl" \| "ltr"` | `--` | 1.10.11 |
| handler | 响应事件的 gesture handler | `string` | `"onClick"` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onChange | 绑定值改变时 | `(newVal: string, oldVal: string) => void` | `--` | - |
| onConfirm | 点击确定按钮时的回调 | `(val: string, valid: boolean) => void` | `--` | - |
| onCancel | 点击底部取消/关闭时的回调 | `() => void` | `--` | - |
| onClose | 元素被关闭触发的事件（1.10.9 开始支持） | `(event: { source: "overlay" \| "cancel" \| "confirm" }) => void` | `--` | 1.10.9 |
| onShow | Modal 显示回调 | `() => any` | `--` | 1.2.0 |
| onHide | Modal 隐藏回调 | `() => any` | `--` | 1.2.0 |
```