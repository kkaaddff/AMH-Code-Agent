# Calendar 日历

日历组件，支持范围选择。

如果需要显示农历日期，请参考 `lunar.js` 等开源库。

## 引用
```tsx
import { Calendar } from '@fta/components'
```

## 示例

### 日历视图 - 范围选择
```tsx
import { Calendar } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { CalendarDayExpose } from '@fta/components/types/calendar'
import React, { useCallback } from 'react'
import './index.scss'
import { isLastSaturdayOfMonth } from './utils'

const startpoint = new Date(2023, 12 - 1, 9).getTime()
const endpoint = new Date(2024, 6 - 1, 30).getTime()

export default function () {
  const viewRef = Calendar.View.useRef()

  const viewFormatter = useCallback((day: CalendarDayExpose) => {
    const timestamp = day.date.getTime()
    if (timestamp < startpoint) {
      if (day.dayOfWeek === 0 || day.dayOfWeek === 6) {
        day.disabled = true
        day.bottomText = '休'
      }
      return day
    }

    if (timestamp > endpoint) {
      return day
    }

    if (day.dayOfWeek === 0) {
      day.disabled = true
      day.bottomText = '休'
    } else if (day.dayOfWeek === 6) {
      const isLastSaturday = isLastSaturdayOfMonth(day.date)
      day.bottomText = isLastSaturday ? '休' : '班'
      day.disabled = isLastSaturday
    }

    return day
  }, [])

  return (
    <Layout title={'日历视图'} qrcode='components/form/calendar/index'>
      <DemoBlock label='范围选择' pure style={{ backgroundColor: '#fff' }}>
        <Calendar.View
          ref={viewRef}
          type='range'
          firstDayOfWeek={1}
          defaultValue={[new Date(2023, 12 - 1, 9), new Date()]}
          start={{
            year: 2023,
            month: 6,
          }}
          end={{
            year: 2024,
            month: 12,
          }}
          formatter={viewFormatter}
        />
      </DemoBlock>
    </Layout>
  )
}
```

### 日历视图 - 单点选择
```tsx
import { Calendar } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'
import './index.scss'

export default function () {
  return (
    <Layout title={'日历视图'} qrcode='components/form/calendar/index'>
      <DemoBlock label='单点选择' pure style={{ backgroundColor: '#fff' }}>
        <Calendar.View
          type='point'
          rowHeight={88}
          theme='#1fb080'
          scrollIntoViewImmediately={false}
          defaultValue={new Date(2021, 6 - 1, 1)}
          start={{
            year: 2021,
            month: 6,
          }}
          end={{
            year: 2022,
            month: 6,
          }}
        />
      </DemoBlock>
    </Layout>
  )
}
```

### 日历视图 - 多点选择
```tsx
import { Calendar } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'
import './index.scss'

export default function () {
  return (
    <Layout title={'日历视图'} qrcode='components/form/calendar/index'>
      <DemoBlock label='多点选择' pure style={{ backgroundColor: '#fff' }}>
        <Calendar.View
          type='multiple'
          scrollIntoViewImmediately={false}
          defaultValue={[new Date(2021, 6 - 1, 1), new Date(2021, 6 - 1, 30)]}
          start={{
            year: 2021,
            month: 6,
          }}
          end={{
            year: 2022,
            month: 6,
          }}
        />
      </DemoBlock>
    </Layout>
  )
}
```

### 日历选择器
```tsx
import { Calendar } from '@fta/components'
import { DemoBlock, Layout, List, ListItem } from '@fta/components/common/display'
import { CalendarDayExpose } from '@fta/components/types/calendar'
import Taro from '@tarojs/taro'
import React, { useCallback, useEffect } from 'react'
import './index.scss'

export default function () {
  const calendarRef = Calendar.useRef()

  useEffect(() => {
    setTimeout(() => {
      calendarRef.current!.show()
    }, 3000)
  }, [])

  const calendarFormatter = useCallback((day: CalendarDayExpose) => {
    if (day.status === 'start') {
      day.bottomText = '开始'
    } else if (day.status === 'end') {
      day.bottomText = '结束'
    } else if (day.status !== 'middle') {
      day.topText = '文本'
      day.bottomText = '文本'
    }
    return day
  }, [])

  return (
    <Layout title={'日历选择器'} qrcode="components/form/calendar/index">
      <DemoBlock label="基础使用" pure>
        <List>
          <ListItem
            title="打开日历选择弹窗"
            onClick={() => {
              calendarRef.current!.show()
            }}
          />
        </List>
      </DemoBlock>
      <Calendar
        ref={calendarRef}
        formatter={calendarFormatter}
        type="range"
        start={Calendar.getYearAndMonthOffset(-6)}
        end={Calendar.getYearAndMonthOffset(12)}
        shouldDisableConfirmButton={(selected) => !selected || (selected as Date[]).length < 2}
        interceptor={(willSelected) => {
          const value = willSelected as Date[]
          if (value?.length === 2) {
            const stampdiff = value[1].getTime() - value[0].getTime()
            if (stampdiff < 3 * 24 * 60 * 60 * 1000) {
              Taro.showToast({
                icon: 'none',
                title: '间隔需要大于两天',
              })
              return false
            }
          }
        }}
        onConfirm={(selected) => {
          console.log('onConfirm: 选中日期', selected)
        }}
        onChange={(selected) => {
          console.log('onChange: 选中日期改变', selected)
        }}
      />
    </Layout>
  )
}
```

## API

### Calendar Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| title | 标题 | `string` | `--` | - |
| viewRef | 视图引用 | `{ current: T \| null }` | `--` | - |
| confirmText | 底部确定按钮文本 | `false \| string` | `--` | - |
| clickOverlayOnClose | 点击遮罩层是否关闭弹窗 | `boolean` | `true` | - |
| shouldDisableConfirmButton | 是否禁用确定按钮 | `(selected: ...)` | `--` | - |
| scrollIntoViewImmediately | 初始渲染时是否滚动到选中的月份 | `boolean` | `true` | - |
| headerRenderer | 自定义渲染头部组件 | `unknown` | `--` | - |
| interceptor | 选择拦截器，返回 false 可阻止默认选中 | `(willSelected: ...)` | `--` | - |
| type | 选择类型 | `"range" \| "multiple" \| "point"` | `--` | - |
| enableSelectSameDate | `type='range'` 时生效，是否允许选择同一天 | `boolean` | `--` | 1.11.10 |
| defaultValue | 默认选中 | `unknown` | `--` | - |
| formatter | 格式化每一天的数据 | `(day: ...)` | `--` | - |
| isDisabled | 是否禁用 | `(day: ...)` | `--` | - |
| firstDayOfWeek | 指定星期的第一天，默认周日 | `0 \| 1 \| 2 \| 3 \| 4 \| 5 \| 6` | `0` | - |
| weekdays | 自定义头部展示 | `string[]` | `["日","一","二","三","四","五","六"]` | 1.9.1 |
| start | 起始年月 | `{ year: number; month: number }` | `--` | - |
| end | 结束年月 | `{ year: number; month: number }` | `--` | - |
| theme | 主题色 | `string` | `--` | - |
| bgTheme | 选中中间日期的背景色 | `string` | `--` | - |
| rowHeight | 每一行的高度，根据 720px 缩放 | `number` | `112` | - |
| delay | 第一次滚动聚焦的延时效果 | `number` | `--` | - |
| rowStyle | 每一周的行样式 | `unknown` | `--` | - |
| renderMonthTitle | 自定义渲染月份标题 | `(record: ...)` | `--` | - |
| ref | 引用 | `null \| RefObject<...>` | `--` | - |
| key | 键值 | `Key \| null` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onConfirm | 点击确定按钮的回调，返回 false 可阻断关闭 | `(selected: ...)` | `--` | - |
| onCancel | 点击右上角关闭按钮的回调，返回 false 可阻断关闭 | `() => void \| boolean` | `--` | - |
| onClose | 点击遮罩层关闭的回调，返回 false 可阻断关闭 | `() => void \| boolean` | `--` | - |
| onChange | 选中日期改变的回调 | `(selected: ...)` | `--` | - |
| onDayClick | 点击 Cell 的回调 | `(day: ...)` | `--` | - |

### Calendar.View Props

（文档中未提供具体属性，仅列出标题）