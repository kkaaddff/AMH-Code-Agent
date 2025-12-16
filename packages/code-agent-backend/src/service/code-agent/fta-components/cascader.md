```markdown
# Cascader 级联选择

基于选择器封装的级联选择组件。

## 引用
```tsx
import { Cascader, TabCascader } from '@tarojs/components'
```

## 示例

### 基础演示

```tsx
import { Cascader, Flex, Text } from '@fta/components'
import {
  DemoBlock,
  Layout,
  List,
  ListItem,
} from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React, { useEffect, useRef, useState } from 'react'
import { cascaderOptions } from './data'
import './index.scss'

const CascaderDemo = () => {
  const ref1 = useRef<any>()
  const ref2 = useRef<any>()
  const ref3 = useRef<any>()
  const [value, setValue] = useState(['Huadong', 'Anhui', 'Hefei'])

  useEffect(() => {
    ref1.current.show()
  }, [])

  return (
    <>
      <DemoBlock label='基础使用' pure>
        <List>
          <ListItem
            title='基础级联选择器'
            onClick={() => ref1.current.show()}
          />
          <ListItem
            title='自定义顶部&底部区域'
            onClick={() => ref2.current.show()}
          />
          <ListItem title='隐藏标题' onClick={() => ref3.current.show()} />
        </List>
      </DemoBlock>

      <Cascader
        ref={ref1}
        value={value}
        headerProps={{ border: false }}
        title='级联选择器(非受控)'
        formats={[(v, opt) => v + opt.value]}
        options={cascaderOptions}
        onChange={(value: string[], index) => {
          setValue(value)
          console.log('onChange', value, index)
        }}
        onConfirm={(value, index) => {
          console.log('onConfirm', value, index)
          ref1.current.hide()
        }}
        onCancel={() => ref1.current.hide()}
      />

      <Cascader
        ref={ref2}
        value={value}
        clickToFocus
        controls
        headerProps={{ border: false }}
        title='级联选择器(受控)'
        formats={[(v, opt) => v + opt.value]}
        options={cascaderOptions}
        prefix={
          <View
            className='demo-cascader-custom'
            onClick={() => setValue(['Dongbei', 'Heilongjiang', 'Mudanjiang'])}
          >
            <Text color='#666'>自定义顶部区域</Text>
          </View>
        }
        suffix={
          <View className='demo-cascader-custom'>
            <Text color='#666'>自定义底部区域</Text>
          </View>
        }
        onChange={(value: string[], index) => {
          setValue(value)
          console.log('onChange', value, index)
        }}
        onConfirm={(value, index) => {
          console.log('onConfirm', value, index)
          ref2.current.hide()
        }}
        onCancel={() => ref2.current.hide()}
      />

      <Cascader
        title={false}
        prefix={
          <Flex.Center>
            <Text>隐藏标题&自定义头部</Text>
          </Flex.Center>
        }
        ref={ref3}
        value={value}
        formats={[(v, opt) => v + opt.value]}
        options={cascaderOptions}
        onChange={(value: string[], index) => {
          setValue(value)
          console.log('onChange', value, index)
        }}
        onConfirm={(value, index) => {
          console.log('onConfirm', value, index)
          ref1.current.hide()
        }}
        onCancel={() => ref1.current.hide()}
      />
    </>
  )
}

export default () => (
  <Layout title='级联选择' qrcode='components/form/cascader/index'>
    <CascaderDemo />
  </Layout>
)
```

### 标签级联选择

```tsx
import { TabCascader } from '@fta/components'
import { DemoBlock, Layout, List, ListItem } from '@fta/components/common/display'
import React from 'react'
import regionTreee from '../../pro/place-picker/regionTree'

export default function TabCascaderDemo() {
  const ref = TabCascader.useRef()

  return (
    <Layout title="标签级联选择" qrcode="components/form/tab-cascader/index">
      <DemoBlock label="基础使用" pure>
        <List>
          <ListItem title="打开标签级联选择器" onClick={() => ref.current!.show()} />
        </List>
      </DemoBlock>

      <DemoBlock label="标签级联选择视图" pure>
        <TabCascader.View
          value={340811}
          depth={3}
          options={regionTreee}
          fieldNames={{
            label: 'shortName',
            value: 'id',
            children: 'children',
          }}
          isDisabled={({ label }) => {
            return label === '北京' || label === '天津'
          }}
          onChange={(data) => {
            console.log('onChange', data)
          }}
          onItemClick={(data) => {
            console.log(data.disabled ? '该选项已禁用，无法选择' : '正常选中', data)
          }}
        />
      </DemoBlock>

      <TabCascader
        value={340811}
        ref={ref}
        options={regionTreee}
        depth={3}
        fieldNames={{
          label: 'shortName',
          value: 'id',
          children: 'children',
        }}
        onConfirm={(data) => {
          if (!data.done) {
            console.log('当前未完成选择，阻断弹窗关闭')
            return false
          } else {
            console.log('onConfirm', data)
          }
        }}
      />
    </Layout>
  )
}
```

## API

### Cascader Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| children | 子元素 | `any` | `--` | - |
| value | 默认选中的值 | `any` | `--` | - |
| title | 标题，设置为 `false` 则不显示头部区域 | `ReactNode` | `--` | - |
| cancelText | 取消文本 | `string` | `--` | - |
| containerClassName | 容器样式 | `string` | `--` | - |
| containerStyle | 容器样式 | `{}` | `--` | - |
| contentClassName | 容器子节点样式 | `string` | `--` | - |
| contentStyle | 容器子节点样式 | `{}` | `--` | - |
| overlayClassName | 背景蒙层类名 | `string` | `--` | - |
| overlayStyle | 背景蒙层内联样式 | `{}` | `--` | - |
| useNativeModal | RN/Thresh端是否使用原生Modal组件 | `boolean` | `true` | - |
| catchMove | 是否阻止内容滑动穿透 | `boolean` | `true` | - |
| clickOverlayOnClose | 点击背景蒙层关闭 | `boolean` | `true` | - |
| example | 示例区域（安卓不可点击） | `ReactNode` | `--` | - |
| animated | 是否显示从底部弹出的动画效果 | `boolean` | `true` | 1.0.6 |
| safeArea | 是否显示底部安全区 | `boolean \| Omit_SafeAreaProps` | `true` | 1.0.9 |
| modalProps | 弹窗props | `{ onShow?: () => void; ... }` | `--` | 1.0.10 |
| prefix | 自定义渲染顶部区域 | `ReactNode` | `--` | - |
| suffix | 自定义渲染底部区域 | `ReactNode` | `--` | - |
| theme | 确定按钮主题色 | `string` | `--` | 1.2.0 |
| sibling | Thresh端Modal组件的前后缀节点 | `{ prev?: ReactNode; next?: ReactNode }` | `--` | 1.6.2 |
| headerProps | 浮动面板头部其他配置 | `{ icon?: boolean \| ReactElement; ... }` | `--` | - |
| portal | [H5]是否挂载到根节点 | `boolean \| HTMLElement` | `false` | 1.7.14 |
| direction | 书写方向 | `"rtl" \| "ltr"` | `--` | 1.10.11 |
| controls | 是否自行控制点击确定/取消按钮是否关闭picker | `boolean` | `false` | - |
| delay | - | `number` | `--` | - |
| triggerChangeOnScroll | [Thresh]滚动结束触发回调 | `boolean` | `true` | 1.7.13 |
| options | 级联选项列表 | `Option[]` | `(必选)` | - |
| depth | 指定级联选择的深度 | `number` | `--` | - |
| formats | 格式化方法集合 | `(value: any, option: Option) => any` | `--` | - |
| memo | 选项切换时保持之前选中状态对齐 | `boolean` | `false` | 1.7.11 |
| confirmText | 确认文本 | `string` | `--` | - |
| itemHeight | [Thresh]行高 | `number` | `--` | 1.7.11 |
| height | [Thresh]滚动区域高度 | `number` | `--` | 1.4.0 |
| renderEmpty | 无数据时的UI | `() => ReactNode` | `--` | 1.7.10 |
| clickToFocus | 是否支持点击聚焦 | `boolean` | `--` | 1.9.8 |
| ref | - | `null \| RefObject` | `--` | - |
| key | - | `Key \| null` | `--` | - |

### Cascader Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onConfirm | 点击确定按钮后的回调 | `(newVal: T, newIndex: number[]) => void` | `--` | - |
| onCancel | 点击取消按钮的回调 | `(val: string \| Option) => void` | `--` | - |
| onClose | 元素被关闭时触发 | `(event: { source: "overlay" \| "cancel" }) => void` | `--` | 1.10.9 |
| onShow | Modal显示回调 | `() => any` | `--` | 1.2.0 |
| onHide | Modal隐藏回调 | `() => any` | `--` | 1.2.0 |
| onChange | 选中的值变化后的回调 | `(newVal: T, newIndex: number[]) => void` | `--` | - |

### TabCascader Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| defaultVisible | 是否默认打开 | `boolean` | `false` | - |
| actionSheetProps | 动作面板的属性 | `unknown` | `--` | - |
| title | 标题栏属性 | `string \| unknown` | `--` | - |
| value | 当前选中的值 | `any` | `--` | - |
| options | 选项列表 | `TabCascaderOption<T>[]` | `(必选)` | - |
| depth | 选择的深度 | `number` | `(必选)` | - |
| theme | 主题色 | `string` | `--` | - |
| fieldNames | 自定义options结构中的字段 | `{ label: string; value: string; children: string }` | `--` | - |
| placeholder | 标签选择提示文本 | `string` | `"请选择"` | - |
| delay | 延迟切换tab | `number` | `--` | - |
| scrollStyle | 滚动区域样式 | `{}` | `--` | - |
| scrollClassName | 滚动区域样式 | `string` | `--` | - |
| itemStyle | item样式 | `(data: { active: boolean; disabled: boolean }) => object` | `--` | - |
| renderItem | 自定义渲染item | `(data: { active: boolean; disabled: boolean; label: string }) => ReactNode` | `--` | - |
| isDisabled | 当前选项是否禁用 | `(data: { label: string; value: any }) => boolean` | `--` | - |

### TabCascader Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onConfirm | 点击确定按钮回调，返回 `false` 可阻止关闭 | `(data: { done: boolean; label: string; value: any }) => void` | `--` | - |
| onCancel | 点击取消按钮回调，返回 `false` 可阻止关闭 | `() => void \| Promise \| boolean` | `--` | - |
| onIndexChange | 选中索引改变的回调 | `(index: number[]) => any` | `--` | - |
| onItemClick | 点击item的回调 | `(data: { active: boolean; disabled: boolean; label: string; value: any }) => void` | `--` | - |
| onChange | 选择的回调 | `(data: { label: string; value: any }) => void` | `--` | - |
| onImmediateChange | 赋初始value值时的回调 | `(data: { label: string; value: any }) => void` | `--` | - |
```