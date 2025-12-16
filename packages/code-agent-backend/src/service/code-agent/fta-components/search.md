# Search 搜索

搜索框组件

## 说明

### 使用说明
Thresh 端如果要屏蔽 iOS 端输入拼音时候的事件回调，请传入 `onCompleteTextChange` 回调。

## 引用
```ts
import { Search } from '@fta/components'
```

## 示例

### 基础演示
```tsx
import {
  Flex,
  Gap,
  Icon,
  Line,
  scale,
  Search,
  Text,
} from '@fta/components'
import { DemoBlock, Layout, warn } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React, { useEffect, useRef, useState } from 'react'

export default () => {
  const [val1, setVal1] = useState('')
  const [val2, setVal2] = useState(
    '搜索内容输入完成后文本超出缩略展示超出缩略展示'
  )
  const inputRef = useRef<any>()

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 2000)
  }, [])

  return (
    <Layout title='搜索' qrcode='components/form/search/index'>
      <DemoBlock label='基础' pure>
        <Search
          clearable
          placeholder='搜索关键词'
          value={val1}
          onChange={setVal1}
          suffix={false}
          onClear={() => setVal1('')}
        />

        <Gap height={24} />

        <Search
          clearable
          placeholder='聚焦自定义样式 1.9.0'
          value={val1}
          onChange={setVal1}
          icon={(focused) => (
            <Icon
              value='SearchFilled'
              size={36}
              style={{ marginLeft: scale(24), marginRight: scale(12) }}
              color={focused ? '#333' : '#ccc'}
            />
          )}
          contentStyle={(focused) => ({
            borderRadius: scale(32),
            backgroundColor: focused ? '#fff' : '#f5f5f5',
            borderWidth: 1,
            borderStyle: 'solid',
            borderColor: focused ? '#333' : '#fff',
          })}
          onClear={() => setVal1('')}
          renderClear={({ focused, length, onClear }) => {
            if (focused && length) {
              return (
                <Text style={{ marginRight: scale(24) }} onClick={onClear}>
                  清除
                </Text>
              )
            }
            return null
          }}
          suffix={false}
        />

        <Gap height={24} />

        <Search
          clearable
          placeholder='搜索关键词'
          value={val2}
          onChange={setVal2}
          suffix={false}
          onClear={() => setVal2('')}
        />

        <Gap height={24} />

        <Search
          clearable
          placeholder='搜索关键词'
          value={val1}
          onChange={setVal1}
          suffix={false}
          onClear={() => setVal1('')}
          icon={
            <Flex.Center direction='row' onClick={() => warn('点击了南京市')}>
              <Gap width={24} />
              <Text level={5} color='#1f1f1f'>南京市</Text>
              <Gap width={8} />
              <Icon value='DownMiniOutlined' size={24} color='#1f1f1f' />
              <Gap width={16} />
              <Line col style={{ height: scale(36) }} color='#ccc' />
              <Gap width={16} />
            </Flex.Center>
          }
        />

        <Gap height={24} />

        <Search
          clearable
          placeholder='搜索关键词'
          contentStyle={{
            height: scale(106),
          }}
          value={val1}
          onChange={setVal1}
          suffix={false}
          onClear={() => setVal1('')}
          icon={
            <Flex.Center direction='row' onClick={() => warn('点击了南京市')}>
              <Gap width={24} />
              <Flex.Column>
                <Flex.Center direction='row'>
                  <Text level={5} color='#1f1f1f'>南京市</Text>
                  <Gap width={8} />
                  <Icon value='DownMiniOutlined' size={24} color='#1f1f1f' />
                </Flex.Center>
                <Flex.Center direction='row'>
                  <Text level={6} color='#999999'>雨花台区</Text>
                </Flex.Center>
              </Flex.Column>
              <Gap width={16} />
              <Line col style={{ height: scale(36) }} color='#ccc' />
              <Gap width={16} />
            </Flex.Center>
          }
        />

        <Gap height={24} />

        <Search
          clearable
          placeholder='搜索关键词'
          contentStyle={{
            height: scale(106),
          }}
          value={val1}
          onChange={setVal1}
          suffix={false}
          onClear={() => setVal1('')}
          icon={
            <Flex.Center direction='row' onClick={() => warn('点击了南京市')}>
              <Gap width={24} />
              <Flex.Row>
                <View
                  style={{
                    marginTop: scale(12),
                    width: scale(16),
                    height: scale(16),
                    borderRadius: scale(8),
                    backgroundColor: '#2698F7',
                  }}
                />
                <Gap width={16} />
                <Flex.Column>
                  <Flex.Center direction='row'>
                    <Text level={5} color='#1f1f1f'>南京市</Text>
                    <Gap width={8} />
                    <Icon value='DownMiniOutlined' size={24} color='#1f1f1f' />
                  </Flex.Center>
                  <Flex.Center direction='row'>
                    <Text level={6} color='#999999'>雨花台区</Text>
                  </Flex.Center>
                </Flex.Column>
              </Flex.Row>
              <Gap width={16} />
              <Line col style={{ height: scale(36) }} color='#ccc' />
              <Gap width={16} />
            </Flex.Center>
          }
        />
      </DemoBlock>
    </Layout>
  )
}
```

### 业务场景
```tsx
import {
  Flex,
  Gap,
  Icon,
  scale,
  Search,
  Text,
} from '@fta/components'
import { DemoBlock, Layout, warn } from '@fta/components/common/display'
import React, { useEffect, useRef, useState } from 'react'

export default () => {
  const [val3, setVal3] = useState('')
  const [val4, setVal4] = useState('')
  const [val5, setVal5] = useState('')
  const inputRef = useRef<any>()

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 2000)
  }, [])

  return (
    <Layout title='搜索' qrcode='components/form/search/index'>
      <DemoBlock label='带返回' pure>
        <Search
          clearable
          placeholder='搜索关键词'
          value={val3}
          onChange={setVal3}
          suffix={false}
          prefix={
            <Flex.Center
              style={{ paddingLeft: scale(24), paddingRight: scale(24) }}
              onClick={() => {
                warn('点击返回按钮')
              }}
            >
              <Icon color='#1a1a1a' size={48} value='LeftOutlined' />
            </Flex.Center>
          }
          onClear={() => setVal3('')}
        />
      </DemoBlock>

      <DemoBlock label='带搜索' pure>
        <Search
          clearable
          placeholder='搜索关键词'
          value={val4}
          onChange={setVal4}
          alwaysShowSuffix
          suffix='搜索'
          suffixStyle={{ color: '#fd3333' }}
          onClear={() => setVal4('')}
          onSuffixClick={() => {
            warn('点击搜索')
          }}
        />
      </DemoBlock>

      <DemoBlock label='全量属性' pure>
        <Search
          clearable
          placeholder='搜索关键词'
          value={val5}
          alwaysShowSuffix
          suffix='搜索'
          prefix={
            <Flex.Center
              style={{ paddingLeft: scale(24), paddingRight: scale(24) }}
              onClick={() => {
                warn('点击返回按钮')
              }}
            >
              <Icon color='#1a1a1a' size={48} value='LeftOutlined' />
            </Flex.Center>
          }
          suffixStyle={{ color: '#fd3333' }}
          onClear={() => setVal5('')}
          onChange={setVal5}
          onSuffixClick={() => {
            warn('点击搜索')
          }}
        />
      </DemoBlock>

      <DemoBlock label='导航搜索+操作' pure>
        <Search
          clearable
          placeholder='搜索关键词'
          value={val5}
          alwaysShowSuffix
          prefix={
            <Flex.Center
              style={{ paddingLeft: scale(24), paddingRight: scale(24) }}
              onClick={() => {
                warn('点击返回按钮')
              }}
            >
              <Icon color='#1a1a1a' size={48} value='LeftOutlined' />
            </Flex.Center>
          }
          suffix={
            <Flex.Row>
              <Text level={4} color='#1a1a1a'>操作</Text>
              <Gap width={24} />
              <Icon value='MoreOutlined' size={40}></Icon>
            </Flex.Row>
          }
          onClear={() => setVal5('')}
          onChange={setVal5}
          onSuffixClick={() => {
            warn('点击搜索')
          }}
        />
      </DemoBlock>
    </Layout>
  )
}
```

### 搜索结果
```tsx
import {
  Empty,
  Search,
} from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import React, { useEffect, useRef, useState } from 'react'

export default () => {
  const [val6, setVal6] = useState('运满满')
  const [val7, setVal7] = useState('南京')
  const [val8, setVal8] = useState('南京')
  const inputRef = useRef<any>()

  useEffect(() => {
    setTimeout(() => {
      inputRef.current?.focus()
    }, 2000)
  }, [])

  return (
    <Layout title='搜索' qrcode='components/form/search/index'>
      <DemoBlock label='搜索无结果' pure>
        <Search
          clearable
          placeholder='搜索无结果'
          value={val6}
          onChange={setVal6}
          suffix={false}
          result={val6.length ? [] : null}
          onClear={() => setVal6('')}
        />
      </DemoBlock>

      <DemoBlock label='搜索联想' pure>
        <Search
          clearable
          placeholder='请搜索货源列表'
          value={val7}
          onChange={setVal7}
          onSuffixClick={() => setVal7('')}
          onClear={() => setVal7('')}
          onItemClick={(label: string) =>
            Taro.showToast({
              title: label,
              duration: 1500,
            })
          }
          result={
            val7
              ? '南京'.includes(val7)
                ? [
                    { label: '南京市 雨花台区' },
                    { label: '南京市 玄武区' },
                    { label: '南京市 江宁区' },
                  ]
                : []
              : null
          }
        />
      </DemoBlock>

      <DemoBlock label='自定义' pure>
        <Search
          clearable
          placeholder='请搜索货源列表'
          value={val8}
          onChange={setVal8}
          onSuffixClick={() => setVal8('')}
          onClear={() => setVal8('')}
          onItemClick={(label: string) =>
            Taro.showToast({
              title: label,
              duration: 1500,
            })
          }
          component={ScrollView}
          renderEmpty={() => <Empty showBtn={false} />}
          result={
            val8
              ? '南京'.includes(val8)
                ? [
                    { label: '南京市 雨花台区' },
                    { label: '南京市 玄武区' },
                    { label: '南京市 江宁区' },
                  ]
                : []
              : null
          }
        />
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| icon | 左侧图标（1.9.0 开始支持根据聚焦状态渲染） | `ReactNode \| (focused: boolean) => ReactNode` | `--` | |
| placeholderTextColor | 占位文本颜色 | `string` | `--` | |
| hightlightColor | 搜索结果高亮色 | `string` | `--` | |
| result | 搜索结果，无结果请传入空数组 | `Array<SearchResult> \| null` | `--` | |
| children | 自定义渲染搜索结果 | `ReactNode` | `--` | |
| suffix | 右侧按钮文本 | `any` | `--` | 1.5.0 |
| suffixStyle | 右侧按钮文本样式 | `{}` | `--` | 1.5.0 |
| alwaysShowSuffix | 是否始终显示右侧文本 | `boolean` | `--` | 1.5.0 |
| cancelText | 右侧取消按钮文本 | `any` | `"取消"` | |
| cancelTextStyle | 文本样式 | `{}` | `--` | 1.2.2 |
| alwaysShowCancel | 是否始终显示取消按钮 | `boolean` | `false` | 1.1.0 |
| clearable | 是否显示清除按钮 | `boolean` | `true` | |
| renderClear | 自定义清除按钮 | `(data: { focused: boolean; length: number; onClear: () => void }) => ReactNode` | `--` | 1.9.0 |
| inputClassName | 输入框类名 | `string` | `--` | |
| inputStyle | 输入框内联样式 | `{}` | `--` | |
| contentClassName | 内容类名 | `string` | `--` | 1.3.0 |
| contentStyle | 内容样式（1.9.0 支持传入方法） | `CSSProperties \| (focused: boolean) => CSSProperties` | `--` | 1.3.0 |
| inputRef | Input 节点 Ref | `null \| RefObject \| bivarianceHack` | `--` | 1.1.0 |
| prefix | 前缀节点 | `ReactNode` | `--` | 1.2.0 |
| selectionColor | [Thresh] 光标颜色 | `string` | `--` | |
| renderer | 自定义输入框组件，替换 Taro Input | `unknown` | `--` | 1.8.5 |
| renderEmpty | 自定义渲染空结果页 | `() => ReactNode` | `--` | 1.2.2 |
| itemStyle | 每一行的样式 | `{}` | `--` | 1.9.0 |
| component | 自定义渲染结果根组件 | `unknown` | `--` | 1.2.2 |
| wrap | 搜索结果是否换行 | `boolean` | `false` | 1.7.8 |
| value | 输入框的初始内容 | `string` | `--` | |
| disabled | 是否禁用 | `boolean` | `--` | |
| maxlength | 最大输入长度，设置为 -1 时不限制 | `number` | `140` | |
| placeholder | 输入框为空时占位符 | `string` | `--` | |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onCancel | 点击取消时的回调 | `() => any` | `--` | |
| onSuffixClick | 点击右侧文本的回调 | `() => any` | `--` | 1.5.0 |
| onClear | 点击清除按钮的回调 | `() => any` | `--` | |
| onConfirm | 点击键盘确定按钮的回调 | `(e: any) => any` | `--` | |
| onChange | 输入值改变的回调 | `(value: string) => any` | `--` | |
| onCompleteTextChange | 屏蔽拼音输入的回调 | `(value: string) => any` | `--` | 1.1.1 |
| onItemClick | 点击搜索结果的回调 | `(value: any) => any` | `--` | |
| onTap | 元素点击回调 | `() => any` | `--` | 1.1.2 |
| onClick | 手指触摸后马上离开 | `(event: TouchEvent) => any` | `--` | |
| onFocus | 输入框聚焦时触发 | `(event: FocusEvent) => any` | `--` | |
| onBlur | 输入框失去焦点时触发 | `(event: BlurEvent) => any` | `--` | |