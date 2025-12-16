# CircularProgress 进度圈

## 引用
```typescript
import { CircularProgress } from '@fta/components'
```

## 示例

### 基础使用
```tsx
import { CircularProgress, px, scale } from '@fta/components'
import {
  DemoBlock,
  Layout,
  List,
  ListItem,
} from '@fta/components/common/display'
import { Text, View } from '@tarojs/components'
import React, { useEffect, useRef, useState } from 'react'

export default () => {
  const [num, setNum] = useState(0)
  const [progress, setProgress] = useState(30)
  const ref1 = useRef<any>()
  const ref2 = useRef<any>()
  const timerRef = useRef<any>()

  const playOnLoop = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current)
      timerRef.current = null
    } else {
      timerRef.current = setInterval(() => {
        setProgress((v) => (v === 100 ? 0 : v + 1))
      }, 30)
    }
  }

  useEffect(() => {
    return () => clearInterval(timerRef.current)
  }, [])

  useEffect(() => {
    ref2.current.play()
  }, [])

  return (
    <Layout title='进度圈' qrcode='components/display/circular-progress/index'>
      <DemoBlock label='基础使用' justifyContent={'space-around'}>
        <CircularProgress
          dot
          duration={5}
          onProgress={setNum}
          ref={ref1}
          dotStyle={{ backgroundColor: '#fd3333' }}
        >
          <View
            style={{
              width: '80%',
              height: '80%',
              position: 'relative',
              zIndex: 900,
              backgroundColor: '#eee',
              borderRadius: px(10000),
              textAlign: 'center',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
          >
            <Text style={{ color: '#fd3333' }}>{num}%</Text>
          </View>
        </CircularProgress>

        <CircularProgress
          duration={5}
          render={({ play, pending, percentage, toggle }) => (
            <View
              onClick={() => (percentage === 100 ? play(0) : toggle())}
              style={{
                width: '60%',
                height: '60%',
                position: 'relative',
                zIndex: 900,
                backgroundColor: '#fff',
                borderRadius: px(10000),
                textAlign: 'center',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              }}
            >
              <Text
                style={{
                  color: '#666',
                  fontSize: scale(32),
                  position: 'relative',
                  zIndex: 100,
                }}
              >
                {pending ? 'Pause' : percentage === 100 ? 'Replay' : 'Play'}
              </Text>
            </View>
          )}
        />

        <CircularProgress duration={5} ref={ref2} activeColor={'#1fb080'} />
      </DemoBlock>

      <DemoBlock label='' pure>
        <List>
          <ListItem title='播放' onClick={() => ref1.current.play(0, 3)} />
          <ListItem title='暂停' onClick={() => ref1.current.pause()} />
          <ListItem title='继续播放' onClick={() => ref1.current.play()} />
          <ListItem title='重置' onClick={() => ref1.current.reset()} />
          <ListItem title='定位到60%' onClick={() => ref1.current.set(60)} />
        </List>
      </DemoBlock>

      <DemoBlock label='受控组件' justifyContent={'center'}>
        <CircularProgress controls percentage={progress} />
      </DemoBlock>

      <DemoBlock label='' pure>
        <List>
          <ListItem title='循环播放' onClick={playOnLoop} />
        </List>
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| duration | [非受控] 从0到100动画持续时间，单位秒 | `number` | `5` | - |
| color | 进度条背景色 | `string` | `"#cccccc"` | - |
| percentage | 非受控组件时为默认值 | `number` | `--` | - |
| activeColor | 进度条前景色 | `string` | `"#ff7000"` | - |
| controls | 是否是受控组件，为true时动画效果用计时器自行模拟，且不可使用组件Ref上挂载的方法 | `boolean` | `false` | - |
| interval | [非受控] 动画执行的时间间隔等分，默认100等分，每一帧前进1% | `number` | `100` | - |
| dot | 是否显示小圆点（让边缘看起来没那么锋利） | `boolean` | `false` | - |
| dotSize | 小圆点的尺寸，720设计稿 | `number` | `20` | - |
| dotStyle | 小圆点样式（位置修复需要用到，或者设置颜色） | `{}` | `--` | - |
| render | 渲染函数，优先级比children高 | `(props: { percentage: number; ... }) => ReactNode` | `--` | - |
| children | 子元素 | `any` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onProgress | [非受控] 播报当前进度 | `(percentage: number) => void` | `--` | - |