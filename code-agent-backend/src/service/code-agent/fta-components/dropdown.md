# Dropdown 下拉菜单

当页面上的操作命令过多时，用此组件可以收纳操作元素。点击触点，会出现一个下拉菜单。可在列表中进行选择，并执行相应的命令。

## 引用
```ts
import { Dropdown, DropdownItem, withDropdown } from '@fta/components'
```

## 示例

### 基础使用
```tsx
import {
  Dropdown,
  DropdownItem,
  px,
  scale,
  useDropdownRef,
  withDropdown,
} from '@fta/components'
import { DemoBlock, Gap, Layout } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import { useEffect, useState } from 'react'

const commonOptions: any = [
  { label: '项目1', value: '项目1' },
  { label: '项目2', value: '项目2' },
]

export default withDropdown(() => {
  const dropdownRef = useDropdownRef()
  const [title, setTitle] = useState('选项一')

  useEffect(() => {
    setTimeout(() => {
      setTitle('选项一动态改变')
    }, 3000)
  }, [])

  const closeDropdown = () => {
    dropdownRef.current!.show(1)
  }

  return (
    <Layout title='下拉菜单' qrcode='components/nav/dropdown/index'>
      <DemoBlock label='基础使用' pure>
        <Dropdown
          useScrollView={false}
          overlay={false}
          clickActionBlocker={(isOpened) => {
            return new Promise<void>((resolve) => {
              setTimeout(resolve, isOpened ? 0 : 10)
            })
          }}
        >
          <DropdownItem
            textStyle={{
              fontSize: scale(24),
            }}
            width={'fit-content'}
            optionHighlightColor='#1a1a1a'
            title={title}
            options={commonOptions}
          />
          <DropdownItem
            width={'fit-content'}
            title='选项2'
            onClick={closeDropdown}
            preventDefault
          />
        </Dropdown>
        <Gap />
        <Dropdown overlay={false}>
          <DropdownItem title='选项1' options={commonOptions} />
          <DropdownItem title='选项2' options={commonOptions} />
          <DropdownItem title='选项3' options={commonOptions} />
        </Dropdown>
        <Gap />
        <Dropdown overlay={false}>
          <DropdownItem title='选项1' options={commonOptions} />
          <DropdownItem title='选项2' options={commonOptions} />
          <DropdownItem title='选项3' options={commonOptions} />
          <DropdownItem title='选项4' options={commonOptions} />
        </Dropdown>
        <Gap />
      </DemoBlock>

      <DemoBlock label='禁用' pure>
        <Dropdown overlay={false}>
          <DropdownItem title='选项一' disabled options={commonOptions} />
          <DropdownItem title='选项二' options={commonOptions} />
        </Dropdown>
        <Gap />
        <Dropdown disabled overlay={false}>
          <DropdownItem title='选项一' options={commonOptions} />
          <DropdownItem title='选项二' options={commonOptions} />
        </Dropdown>
        <Gap />
      </DemoBlock>

      <View style={{ height: px(500), flexShrink: 0, flexBasis: px(500) }}></View>
    </Layout>
  )
})
```

### 业务演示
```tsx
import {
  Dropdown,
  DropdownItem,
  Flex,
  px,
  Text,
  useDropdownRef,
  withDropdown,
} from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import React, { useEffect, useState } from 'react'

const commonOptions: any = [
  { label: '项目1', value: '项目1' },
  { label: '项目2', value: '项目2' },
]

const commonOptions2: any = [
  { label: '项目3', value: '项目3' },
  { label: '项目4', value: '项目4' },
]

export default withDropdown(() => {
  const dropdownRef = useDropdownRef()
  const [count, setCount] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setCount((v) => v + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <Layout title='下拉菜单' qrcode='components/nav/dropdown/index'>
      <DemoBlock label='下拉面板-选择组' pure>
        <Dropdown useScrollView={false}>
          <DropdownItem
            title='选项一'
            options={commonOptions.concat(commonOptions2).concat([
              {
                label: '禁用',
                value: '禁用',
                disabled: true,
              },
            ])}
            optionSelect={{
              column: 3,
              defaultValue: '项目2',
              onChange(value) {
                console.log('选项改变', value)
              },
            }}
          />
          <DropdownItem
            title='选项二'
            options={commonOptions}
            optionSelect={{
              column: 3,
            }}
          />
        </Dropdown>
      </DemoBlock>

      <DemoBlock label='自定义渲染(v1.0.15)' pure>
        <Dropdown reactive>
          <DropdownItem title='标题' full>
            <Flex.Center>
              <Text level={5}>我爱你，你爱我，蜜雪冰城甜蜜蜜{count}😊</Text>
            </Flex.Center>
          </DropdownItem>
          <DropdownItem title='标题'>
            <Flex.Center>
              <Text level={5}>我爱你，你爱我，蜜雪冰城甜蜜蜜🎉</Text>
            </Flex.Center>
          </DropdownItem>
          <DropdownItem title='标题'>
            <Flex.Center>
              <Text level={5}>我爱你，你爱我，蜜雪冰城甜蜜蜜🎁</Text>
            </Flex.Center>
          </DropdownItem>
        </Dropdown>
      </DemoBlock>

      <DemoBlock label='进阶使用' pure>
        <Dropdown ref={dropdownRef}>
          <DropdownItem
            onClick={() => {
              console.log('clicked first tab menu')
            }}
            title='上海'
            options={[
              { label: '上海', value: '上海' },
              { label: '北京', value: '北京' },
              { label: '重庆', value: '重庆' },
              { label: '苏州', value: '苏州' },
              { label: '无锡', value: '无锡' },
              { label: '常州', value: '常州' },
              { label: '镇江', value: '镇江' },
              { label: '昆山', value: '昆山' },
              { label: '丹阳', value: '丹阳' },
              { label: '盐城', value: '盐城' },
              { label: '上饶', value: '上饶' },
              { label: '成都', value: '成都' },
              { label: '贵阳', value: '贵阳' },
              { label: '六盘水', value: '六盘水' },
              { label: '攀枝花', value: '攀枝花' },
              { label: '毕节', value: '毕节' },
            ]}
          />
          <DropdownItem
            title='南京'
            options={[
              { label: '苏州', value: '苏州' },
              { label: '南京', value: '南京' },
              { label: '无锡', value: '无锡' },
            ]}
          />
          <DropdownItem
            title='排序'
            options={[
              { label: '顺序', value: '顺序' },
              { label: '倒序', value: '倒序' },
            ]}
          />
          <DropdownItem
            title='选择城市'
            maxDepth={3}
            options={(depth, option) => {
              switch (depth) {
                case 1:
                  return [
                    { label: '江苏', value: '江苏' },
                    { label: '安徽', value: '安徽' },
                  ]
                case 2:
                  return option.value === '江苏'
                    ? false
                    : [
                        { label: '安庆', value: '安庆' },
                        { label: '合肥', value: '合肥' },
                      ]
                default:
                  return [
                    { label: '无名区', value: '无名区' },
                  ]
              }
            }}
          />
        </Dropdown>
      </DemoBlock>

      <View style={{ height: px(500), flexShrink: 0, flexBasis: px(500) }}></View>
    </Layout>
  )
})
```

## API

### Dropdown Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| list | 下拉菜单列表 | `unknown[]` | `--` | |
| absolute | 是否对item列表绝对定位，不支持RN | `boolean` | `true` | |
| arrow | 自定义激活时的箭头图标 | `string` | `--` | |
| check | 自定义选中时的对号图标 | `string` | `--` | |
| delay | 级联选择的延迟效果，单位ms | `number` | `200` | 1.0.3-beta.5 |
| overlay | 是否显示下层背景蒙层 | `boolean` | `true` | |
| overlayClassName | 背景蒙层类名 | `string` | `--` | |
| overlayStyle | 背景蒙层内联样式 | `{}` | `--` | |
| safeArea | 底部安全区相关属性 | `SafeAreaProps \| false` | `--` | 1.0.3-beta.7 |
| disabled | 是否禁用 | `boolean` | `--` | 1.0.12 |
| useScrollView | 下拉菜单是否应用ScrollView | `boolean` | `false` | 1.0.17 |
| itemClassName | - | `string` | `--` | 1.0.17 |
| itemStyle | - | `CSSProperties \| (isOpened: boolean) => CSSProperties` | `--` | 1.0.17（1.11.4 开始支持方法返回） |
| textStyle | 标题字体 | `{}` | `--` | 1.7.11 |
| icon | 自定义渲染右侧图标 | `(isOpened: boolean, disabled: boolean) => ReactNode` | `--` | 1.0.17 |
| reactive | 下拉的内容是否动态更新 | `boolean` | `false` | 1.3.0 |
| align | 对齐方式，默认居中撑满 | `"left" \| "center"` | `--` | 1.7.11 |
| contentContainerStyle | - | `{}` | `--` | 1.9.0 |
| contentContainerClassName | - | `string` | `--` | 1.9.0 |
| theme | 主题色 | `string` | `--` | 1.11.4 |
| animated | [Thresh] 设置为false可以关闭 展开/收起动画 | `boolean` | `true` | 1.11.6 |
| clickActionBlocker | 点击item的时候可以阻塞延迟打开 | `async (isOpened: boolean) => any` | `--` | 1.0.15 |
| rectHandler | 非沉浸式下处理获取到的节点信息 | `(rect: T) => any` | `--` | 1.7.11 |

### Dropdown Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onChange | 选中值改变的回调 | `(prop: string, value: any, depth?: number) => void` | `--` | |
| onOverlayClick | 点击背景蒙层回调，返回false则不会自动关闭 | `() => any` | `--` | 1.0.12 |

### DropdownItem Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| prop | 当前item标识 | `string` | `--` | |
| title | 显示的标题（v1.0.17开始支持ReactElement） | `any` | `--` | |
| options | 列表 | `Array<Option> \| (depth: number, option: Option) => Array<Option> \| false` | `--` | |
| optionHighlightColor | 垂直选项聚焦时的颜色 | `string` | `--` | 1.7.11 |
| optionCheckColor | 垂直选项聚焦时勾选框的颜色 | `string` | `--` | 1.10.15 |
| optionSelect | 应用选择组列表 | `{ className?: string; style?: {}; column?: number; defaultValue?: any; onChange?: (value: any) => void }` | `--` | |
| maxDepth | 指定选择的最大深度，仅在options返回函数时生效 | `number` | `--` | |
| activeIndex | 默认激活的索引，设置为-1则默认不聚焦；级联选择请传入数组 | `number \| Array` | `--` | |
| preventDefault | 阻止默认展开事件 | `boolean` | `false` | 1.0.3-beta.5 |
| width | 显示宽度 | `number \| "fit-content"` | `--` | 1.0.12 |
| full | 打开的蒙层是否撑满屏幕剩余空间 | `boolean` | `false` | 1.1.0 |
| render | 自定义渲染 | `(isOpened: boolean, isDisabled: boolean) => ReactNode` | `--` | 1.1.0 |
| contentStyle | 内容区样式 | `{}` | `--` | 1.7.11 |
| icon | 自定义渲染右侧图标 | `(isOpened: boolean, disabled: boolean) => ReactNode` | `--` | 1.0.17 |
| disabled | 是否禁用 | `boolean` | `--` | 1.0.12 |
| textStyle | 标题字体 | `{}` | `--` | 1.7.11 |
| children | 子元素 | `any` | `--` | |

### DropdownItem Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onClick | menu 点击事件（1.4.0增加willOpen参数，标识当前操作是打开还是关闭） | `(willOpen: boolean) => void` | `--` | 1.0.3-beta.5 |