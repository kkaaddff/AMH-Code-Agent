```markdown
# Selector 级联选择器

通用级联选择器

## 引用
```tsx
import { SelectorCore } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { inRN, inThresh, SelectorCore } from '@fta/components'
import { Button, DemoBlock, Layout } from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React, { useEffect, useRef, useState } from 'react'
import { resolveRegion } from './region'

const LABEL = inRN && !inThresh ? 'name' : 'shortName'
const VALUE = inRN && !inThresh ? 'code' : 'id'

export default () => {
  const [options, setOptions] = useState<any>([])
  const ref = useRef<any>()

  useEffect(() => {
    resolveRegion().then((opts) => {
      setOptions(opts)
    })
  }, [])

  return (
    <Layout title='级联选择器' qrcode='components/form/selector/index'>
      <DemoBlock label='基础使用' pure alignItems={'stretch'}>
        <SelectorCore
          ref={ref}
          rootOption={{ [LABEL]: '全国', [VALUE]: 0 }}
          depth={2}
          limit={3}
          enableCheckAll={[false, false]}
          multiple
          autoHeight
          showCount
          showResult
          showSearch
          showCheck
          topOption={{
            [LABEL]: '常用',
            [VALUE]: -1,
            multiple: true,
            chain: true,
            children: [
              { [LABEL]: '上海-上海-上海', [VALUE]: 310100 },
              { [LABEL]: '河北-河北-河北', [VALUE]: 130000 },
              { [LABEL]: '江苏-南京-玄武', [VALUE]: 662 },
              { [LABEL]: '安徽-安庆-宜秀', [VALUE]: 663 },
              { [LABEL]: '山西-大同-阳高', [VALUE]: 140221 },
            ],
          }}
          placeholder='支持按城市、区县名称搜索'
          defaultValue={[inRN ? 642001 : 140221]}
          options={options}
          fieldNames={{
            label: LABEL,
            value: VALUE,
            children: 'children',
          }}
          isDisabled={(label) => label === '台湾'}
          onExceed={() => {
            Taro.showToast({
              title: '多选溢出',
              icon: 'none',
            })
          }}
          onSelectDisabled={() => {
            Taro.showToast({ title: '该地区暂未开通服务喔' })
          }}
          onChange={(selectedOptions: any, lastSelectedOptions: any) => {
            console.log('selected options tree array:', selectedOptions, '\n')
            console.log('selected options reversed linked list:', lastSelectedOptions)
            if (!lastSelectedOptions.length) {
              ref.current.checkRoot()
            }
          }}
        />
      </DemoBlock>
      <DemoBlock label='选择根节点' pure>
        <Button onClick={() => ref.current.checkRoot()}>选择全国</Button>
      </DemoBlock>
    </Layout>
  )
}
```

### 单选

```tsx
import { inRN, inThresh, SelectorCore } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React, { useEffect, useState } from 'react'
import { resolveRegion } from './region'

const LABEL = inRN && !inThresh ? 'name' : 'shortName'
const VALUE = inRN && !inThresh ? 'code' : 'id'

export default () => {
  const [options, setOptions] = useState<any>([])
  useEffect(() => {
    resolveRegion().then((opts) => {
      setOptions(opts)
    })
  }, [])

  return (
    <Layout title='级联选择器' qrcode='components/form/selector/index'>
      <DemoBlock label='单选' pure alignItems={'stretch'}>
        <SelectorCore
          scrollIntoView
          topOption={{
            [LABEL]: '常用',
            [VALUE]: -1,
            multiple: false,
            children: [
              { [LABEL]: '北京-北京-北京', [VALUE]: 666 },
              { [LABEL]: '江苏-南京-玄武', [VALUE]: 666 },
              { [LABEL]: '安徽-安庆-宜秀', [VALUE]: 666 },
            ],
          }}
          repeatable
          depth={3}
          autoHeight
          showCount
          showResult
          defaultValue={[inRN ? 642001 : 630123]}
          options={options}
          fieldNames={{
            label: LABEL,
            value: VALUE,
            children: 'children',
          }}
          onExceed={() => {
            Taro.showToast({
              title: '多选溢出',
              icon: 'none',
            })
          }}
          onChange={(selectedOptions: any, lastSelectedOptions: any) => {
            console.log('selected options tree array:', selectedOptions, '\n')
            console.log('selected options reversed linked list:', lastSelectedOptions)
          }}
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
| options | 选项列表 | `Option[]` | `(必选)` | - |
| topOption | 额外的置于顶层的选项列表，会和 options 做一次 concat；root 为 true 时和其他选项排斥；chain 为 true 时可与 options 中的数据进行联动（多选时生效），multiple 为 false 时各选项互斥 | `unknown` | `--` | - |
| defaultValue | 默认选中项，多选传数组，单选传基础类型 | `Array \| string \| number` | `--` | - |
| depth | 选择器深度 | `number` | `3` | - |
| reactive | defaultValue 是否响应式 | `boolean` | `false` | 1.1.2 |
| shortcut | 是否开启快捷选择模式 | `boolean` | `false` | - |
| showSearch | 是否显示搜索框 | `boolean` | `false` | - |
| showSearchAsList | 是否以列表形式展示搜索结果 | `boolean` | `false` | 1.2.0 |
| strictSearch | 是否严格匹配搜索字符串，传入回调可自定义搜索命中 | `boolean \| HitFn` | `false` | - |
| showResult | 是否显示选择结果 | `boolean` | `false` | - |
| placeholder | 输入框文本 | `string` | `"支持按城市、区县名称搜索"` | - |
| emptyHint | 搜索无结果的文本 | `string` | `"暂无搜索结果"` | - |
| limitHint | 最多可选择几项的提示（1.6.2 支持传入节点） | `string \| ReactElement \| null` | `--` | - |
| changeOnSelect | 当此项为 true 时，点选倒数第二级菜单选项值都会发生变化 | `boolean` | `false` | - |
| rootOption | 是否增加全选选项，如全国 | `{ label?: string; value?: string }` | `false` | - |
| enableCheckAll | 是否允许全选，数组长度是深度 - 1 | `boolean[]` | `--` | - |
| containerClassName | 滚动容器类名 | `string` | `--` | - |
| containerStyle | 滚动容器内联样式 | `{}` | `--` | - |
| tagColor | 标签颜色 | `string` | `--` | - |
| tagBgColor | 标签背景颜色 | `string` | `--` | - |
| autofocus | 是否默认聚焦最后一列 | `boolean \| 'lazy'` | `true` | 1.2.2 |
| useCompleteTextChange | Thresh 中 Input 是否应用 onCompleteTextChange 回调 | `boolean` | `false` | - |
| inputRenderer | 自定义输入框 | `unknown` | `--` | 1.9.0 |
| customSearchListRenderer | 自定义搜索结果列表组件 | `unknown` | `--` | 1.3.3 |
| escapeKeyword | 自定义搜索规则时，正则匹配可能需要先过滤一下特殊字符 | `(keyword: string) => string` | `--` | 1.3.3 |
| renderEmpty | 自定义渲染搜索空白页 | `() => ReactNode` | `--` | 1.3.3 |
| columnClassName | 滚动列类名 | `(depth: number) => string` | `--` | - |
| columnStyle | 滚动列内联样式 | `(depth: number) => {}` | `--` | - |
| ready | 是否可以渲染 | `boolean` | `true` | 2.0.5 |
| closeOnClickTag | 点击 Tag 时是否删除 | `boolean` | `--` | 1.7.13 |
| disableChangeOnSearch | [单选] 搜索时是否屏蔽 onChange 事件（副作用：点击已选中选项会再次触发 onChange） | `boolean` | `--` | 1.7.13 |
| searchItemStyle | 搜索列表 item 样式 | `{}` | `--` | 1.9.0 |
| searchItemTextStyle | 搜索列表文字样式 | `{}` | `--` | 1.9.0 |
| shouldSelectAllByDefault | [单选] 切换选项时，子项是否默认全选。传入 'loose' 时，不对父节点和第一个子节点进行校验 | `boolean \| 'loose'` | `false` | 1.9.1 |
| shouldSearchParent | 默认只会搜索最后一级的数据，设置 true 可根据 enableCheckAll 进行父级搜索 | `boolean` | `false` | 1.10.2 |
| shouldSearchChildren | 默认搜索数据源会带上子节点数据 | `boolean` | `true` | 1.10.8 |
| searchCntStyle | 搜索框所在容器样式 | `{}` | `--` | 1.11.10 |
| remoteSearch | 远程搜索接入 | `async (data: { keyword: string, ... }) => Option[]` | `--` | 1.7.5 |
| renderInputAction | 渲染右侧清除按钮 | `(data: { value: string; length: number }) => ReactNode` | `--` | 1.9.0 |
| renderSearch | 渲染搜索输入框 | `(props: { ref: React.Ref<any>; ... }) => ReactNode` | `--` | 1.9.0 |
| filterDuplicated | 重复搜索项目过滤（如“北京-北京”），仅在 `shouldSearchParent=true` 时生效 | `(option: Option) => boolean` | `--` | 1.10.2 |
| limit | （多选时生效）多选上限 | `number` | `3` | - |
| theme | 主题色，默认为满帮橙 | `string` | `"#FA871E"` | - |
| itemHeight | 每个 item 的绝对高度 | `number` | `46` | - |
| itemStyle | item 样式 | `CSSProperties \| (data: { depth: number }) => CSSProperties` | `--` | - |
| renderItem | 自定义渲染 item | `(data: { element: () => ReactNode; ... }) => ReactNode` | `--` | 1.3.3 |
| fieldNames | 自定义 options 中的 label、value、children 字段 | `{ label: string; value: string; children: string }` | `"{label: 'label', value: 'value', children: 'children'}"` | - |
| multiple | 是否支持多选 | `boolean` | `false` | - |
| suffixIcon | 自定义选择的后缀图标，传入字符串默认为图片 URL | `string \| false` | `--` | - |
| activeSuffixIcon | 自定义选中的后缀图标，传入字符串默认为图片 URL | `string \| false` | `--` | - |
| activeItemClassName | 选中项类名 | `string` | `--` | - |
| itemClassName | item 类名 | `string` | `--` | - |
| activeItemTextClassName | 选中项文字类名 | `string` | `--` | 1.9.0 |
| activeItemTextStyle | 选中项文字样式 | `{}` | `--` | 1.9.0 |
| activeItemStyle | 选中项样式 | `{}` | `--` | 1.9.0 |
| showCount | （多选时生效）是否显示子级已选择数量 | `boolean` | `true` | - |
| showDot | （多选时生效）子级选中是否在左侧显示小圆点，优先级比 showCount 高 | `boolean` | `--` | 1.0.4-rc.1 |
| autoHeight | 是否自适应 item 高度，设置后没有自动对齐效果 | `boolean` | `--` | - |
| showCheck | 是否显示勾选图标 | `boolean` | `true` | - |
| repeatable | 点击已经聚焦的选项是否触发 onChange 事件 | `boolean` | `false` | - |
| isDisabled | 是否禁用 | `(label: string \| number, value: string \| number) => boolean` | `--` | - |
| labelFormatter | 格式化 item 显示 | `(label: string \| number, option: Option) => string` | `--` | - |
| scrollViewProps | 传递给各列 ScrollView 组件的 props | `unknown` | `--` | 1.4.1 |
| renderColumnPrefix | 自定义渲染每一列头部 | `(data: { depth: number; isLast: boolean }) => ReactNode` | `--` | 1.9.0 |
| renderColumnContent | 自定义渲染每一列内容 | `(source: { parent: Option }) => ReactNode` | `{}` | 1.11.0 |
| renderColumnSuffix | 自定义渲染每一列底部 | `(data: { depth: number; isLast: boolean }) => ReactNode` | `--` | 1.9.1 |
| scrollViewRenderer | 自定义 ScrollView 节点 | `unknown` | `--` | 1.9.0 |
| scrollIntoView | （单选时生效）搜索结果是否滚动到视图中 | `boolean \| { padding?: number }` | `false` | 1.0.11 |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onChange | 选择改变后的回调 | `(selectedOptions: Option[], lastSelectedOptions: Option[]) => void` | `--` | - |
| onColumnChange | 当前列索引改变的回调（仅限手动点击） | `(ctx: { cursor: number; index: number }) => void` | `--` | 1.2.3 |
| onSearchResultSelect | 点击搜索列表的回调（1.6.7 增加参数） | `(data: { option: Option; keyword: string }) => void` | `--` | 1.3.3 |
| onExceed | （多选生效）选择项溢出时的回调 | `() => void` | `--` | - |
| onSearch | 搜索的回调 | `(data: { keyword: string; result: Option[] }) => void` | `--` | 1.6.2 |
| onInput | 输入框回调 | `(keyword: string) => void` | `--` | 1.9.0 |
| onFocus | 输入框聚焦回调 | `(event: any) => void` | `--` | - |
| onBlur | 输入框失焦回调 | `(event: any) => void` | `--` | - |
| onSelectDisabled | 点击禁用选项时的回调 | `(option: Record<string, any>) => void` | `--` | - |
```