# Slider 滑块

滑块组件

## 说明

### 使用说明
Thresh 端手势会比较卡顿，推荐直接接入 `SealComponent.Slider`。

## 引用
```javascript
import { Slider } from '@fta/components'
```

## 示例

### 基础演示
```javascript
import { Slider, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { Image } from '@tarojs/components'
import React, { useState } from 'react'

export default () => {
  const [scrollEnabled, setScrollEnabled] = useState(true)

  return (
    <Layout title='滑块' qrcode='components/form/slider/index' useScrollView={true}>
      <DemoBlock label='基础使用'>
        <Slider value={30}></Slider>
      </DemoBlock>

      <DemoBlock label='指定步距'>
        <Slider value={20} step={20}></Slider>
      </DemoBlock>

      <DemoBlock label='带刻度'>
        <Slider value={20} step={20} ticks />
      </DemoBlock>

      <DemoBlock label='带标记'>
        <Slider
          value={60}
          step={10}
          ticks
          marksStyle={{
            top: 10,
          }}
          marks={{
            0: 0,
            40: 40,
            80: 80,
            100: 100,
          }}
        />
      </DemoBlock>

      <DemoBlock label='禁用状态'>
        <Slider disabled value={30}></Slider>
      </DemoBlock>
    </Layout>
  )
}
```

### 区间滑动与高级功能
```javascript
import { Slider, scale } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { Image } from '@tarojs/components'
import React, { useState } from 'react'

export default () => {
  const [scrollEnabled, setScrollEnabled] = useState(true)

  return (
    <Layout title='滑块' qrcode='components/form/slider/index' useScrollView={true}>
      <DemoBlock label='区间滑动'>
        <Slider
          range
          ticks
          value={[10, 80]}
          step={10}
          onBeforeChange={(val) => {
            console.log('onBeforeChange: ' + val)
            setScrollEnabled(false)
          }}
          onChange={(val) => {
            console.log('onChange: ' + val)
          }}
          onAfterChange={(val) => {
            console.log('onAfterChange: ' + val)
            setScrollEnabled(true)
          }}
        />
      </DemoBlock>

      <DemoBlock label='带提示'>
        <Slider
          value={30}
          tooltip='提示内容文本'
          onBeforeChange={(val) => {
            console.log('onBeforeChange: ' + val)
            setScrollEnabled(false)
          }}
          onChange={(val) => {
            console.log('onChange: ' + val)
          }}
          onAfterChange={(val) => {
            console.log('onAfterChange: ' + val)
            setScrollEnabled(true)
          }}
        ></Slider>
      </DemoBlock>

      <DemoBlock label='自定义Thumb'>
        <Slider
          thumbStyle={{ borderWidth: 0 }}
          style={{ height: scale(20), borderRadius: scale(10), overflow: 'hidden' }}
          thumbSize={48}
          icon={
            <Image
              pointerEvents='none'
              style={{ width: '100%', height: '100%' }}
              src='https://imagecdn.ymm56.com/ymmfile/static/resource/a7b44a33-f098-4e10-b63c-de3a1020522b.png'
            />
          }
          value={30}
        ></Slider>
      </DemoBlock>

      <DemoBlock label='自定义样式'>
        <Slider color='red' activeColor='#00997B' thumbSize={48} value={30}></Slider>
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| value | 当前绑定的值 | `number \| SliderTupleValue` | `--` | |
| min | 最小值 | `number` | `0` | |
| max | 最大值 | `number` | `100` | |
| step | 步距，正整数且可被[max-min]整除 | `number` | `--` | |
| range | 是否为双滑块 | `boolean` | `false` | |
| ticks | 是否显示刻度 | `boolean` | `false` | |
| scale | 是否显示刻度，默认刻度为[0, 25, 50, 75, 100] | `boolean \| {}` | `false` | |
| thumbSize | thumb尺寸，设计稿720px | `number` | `32` | |
| thumbClassName | 滑块容器样式 | `string` | `--` | |
| thumbStyle | 滑块容器样式 | `{}` | `--` | |
| icon | 自定义滑块icon，可传入图片URL或自定义渲染 | `string \| ReactElement` | `--` | |
| disabled | 是否禁用 | `boolean` | `false` | |
| color | 未激活区域的背景颜色 | `string` | `--` | |
| activeColor | 激活区域的颜色 | `string` | `--` | |
| containerClassName | 容器样式 | `string` | `--` | |
| containerStyle | 容器样式 | `{}` | `--` | |
| suffix | 自定义滑槽子节点 | `ReactNode` | `--` | |
| tooltip | 文字提示 | `string \| ReactElement \| boolean` | `--` | |
| marksClassName | 刻度标记容器类名 | `string` | `--` | 1.2.3 |
| marksStyle | 刻度标记样式 | `{}` | `--` | 1.2.3 |
| triggerAfterChangeAnyway | [H5/小程序] 即使前后值相同，也触发onAfterChange回调 | `boolean` | `--` | 1.11.10 |
| renderThumb | 自定义渲染thumb | `(startpoint: boolean \| undefined) => ReactNode` | `--` | |
| marks | 刻度标记 | `{}` | `--` | |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onBeforeChange | 开始滑动时的回调 | `(value: number \| number[]) => void` | `--` | |
| onChange | 滑动时值变动的回调 | `(value: number \| number[]) => void` | `--` | |
| onAfterChange | 滑动结束后的回调（手指触摸结束） | `(value: number \| number[]) => void` | `--` | |