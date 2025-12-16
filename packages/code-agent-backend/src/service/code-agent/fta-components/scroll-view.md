# ScrollView 滚动视图组件

## 介绍

ScrollView是Taro中的可滚动视图容器组件，相当于React Native中的`<ScrollView>`和Web中的带滚动条的容器。ScrollView组件支持横向和纵向滚动，提供了丰富的滚动控制和监听功能。

## 基础用法

```tsx
import { ScrollView, Text } from '@tarojs/components'
import React from 'react'

export default function ScrollViewDemo() {
  return (
    <ScrollView
      scrollY
      style={{ height: 200 }}
    >
      <Text>这是可滚动的内容</Text>
      <Text>滚动查看更多内容</Text>
      <Text>内容1</Text>
      <Text>内容2</Text>
      <Text>内容3</Text>
    </ScrollView>
  )
}
```

## 核心属性

### 滚动方向属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| scrollX | `boolean` | `false` | 允许横向滚动 |
| scrollY | `boolean` | `false` | 允许纵向滚动 |
| scrollWithAnimation | `boolean` | `false` | 滚动时使用动画过渡 |

### 滚动位置属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| scrollTop | `number` | - | 设置竖向滚动条位置 |
| scrollLeft | `number` | - | 设置横向滚动条位置 |
| scrollIntoView | `string` | - | 滚动到指定元素ID |
| scrollAnchoring | `boolean` | `false` | 启用滚动锚定 |

### 滚动条显示属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| showScrollbar | `boolean` | `true` | 是否显示滚动条 |
| enableFlex | `boolean` | `false` | 启用flexbox布局 |
| enhanced | `boolean` | `false` | 启用增强滚动体验 |

### 下拉刷新和上拉加载

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| refresherEnabled | `boolean` | `false` | 开启下拉刷新 |
| refresherThreshold | `number` | `45` | 触发下拉刷新的阈值 |
| refresherDefaultStyle | `RefresherDefaultStyle` | `'black'` | 下拉刷新默认样式 |
| refresherBackground | `string` | `'#FFF'` | 下拉刷新背景色 |
| refresherTriggered | `boolean` | `false` | 是否触发下拉刷新 |
| lowerThreshold | `number` | `50` | 距离底部多少像素触发上拉加载 |
| upperThreshold | `number` | `50` | 距离顶部多少像素触发滚动到顶部事件 |

### 事件属性

| 属性 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| onScroll | `CommonEventFunction<ScrollEventDetail>` | - | 滚动时触发 |
| onScrollToUpper | `CommonEventFunction` | - | 滚动到顶部时触发 |
| onScrollToLower | `CommonEventFunction` | - | 滚动到底部时触发 |
| onRefresherRefresh | `CommonEventFunction` | - | 下拉刷新时触发 |
| onRefresherRestore | `CommonEventFunction` | - | 下拉刷新重置时触发 |
| onRefresherPulling | `CommonEventFunction<RefresherPullingEventDetail>` | - | 下拉时触发 |

## Props 类型详细说明

### 滚动方向属性

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| scrollX | `boolean` | `false` | 否 | 允许横向滚动 |
| scrollY | `boolean` | `false` | 否 | 允许纵向滚动 |
| scrollWithAnimation | `boolean` | `false` | 否 | 滚动时使用动画过渡 |

### 滚动位置属性

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| scrollTop | `number` | - | 否 | 设置竖向滚动条位置（像素值） |
| scrollLeft | `number` | - | 否 | 设置横向滚动条位置（像素值） |
| scrollIntoView | `string` | - | 否 | 滚动到指定元素ID（需子元素设置对应ID） |
| scrollAnchoring | `boolean` | `false` | 否 | 启用滚动锚定功能 |

### 滚动条和布局属性

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| showScrollbar | `boolean` | `true` | 否 | 是否显示滚动条（H5端） |
| enableFlex | `boolean` | `false` | 否 | 启用Flexbox布局模式 |
| enhanced | `boolean` | `false` | 否 | 启用增强滚动体验（iOS） |

### 下拉刷新属性

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| refresherEnabled | `boolean` | `false` | 否 | 开启下拉刷新功能 |
| refresherThreshold | `number` | `45` | 否 | 触发下拉刷新的阈值（像素值） |
| refresherDefaultStyle | `RefresherDefaultStyle` | `'black'` | 否 | 下拉刷新默认样式 |
| refresherBackground | `string` | `'#FFF'` | 否 | 下拉刷新背景色 |
| refresherTriggered | `boolean` | `false` | 否 | 是否触发下拉刷新状态 |

### 加载阈值属性

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| lowerThreshold | `number` | `50` | 否 | 距离底部多少像素触发上拉加载 |
| upperThreshold | `number` | `50` | 否 | 距离顶部多少像素触发滚动到顶部事件 |

### 样式属性

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| className | `string` | - | 否 | 自定义CSS类名 |
| style | `ScrollViewStyle` | - | 否 | 内联样式对象 |
| id | `string` | - | 否 | 组件唯一标识符 |
| testID | `string` | - | 否 | 测试用ID |

### 滚动事件

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| onScroll | `(event: ScrollEvent) => void` | - | 否 | 滚动时触发（频繁触发，建议节流） |
| onScrollToUpper | `(event: BaseEvent) => void` | - | 否 | 滚动到顶部时触发 |
| onScrollToLower | `(event: BaseEvent) => void` | - | 否 | 滚动到底部时触发 |

### 下拉刷新事件

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| onRefresherRefresh | `(event: BaseEvent) => void` | - | 否 | 下拉刷新时触发 |
| onRefresherRestore | `(event: BaseEvent) => void` | - | 否 | 下拉刷新重置时触发 |
| onRefresherPulling | `(event: RefresherPullingEvent) => void` | - | 否 | 下拉时持续触发 |
| onRefresherAbort | `(event: BaseEvent) => void` | - | 否 | 下拉刷新被中断时触发 |

### 交互事件

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| onClick | `(event: ITouchEvent) => void` | - | 否 | 点击事件处理函数 |
| onLongPress | `(event: ITouchEvent) => void` | - | 否 | 长按事件处理函数 |
| onTouchStart | `(event: ITouchEvent) => void` | - | 否 | 触摸开始事件 |
| onTouchMove | `(event: ITouchEvent) => void` | - | 否 | 触摸移动事件 |
| onTouchEnd | `(event: ITouchEvent) => void` | - | 否 | 触摸结束事件 |
| onTouchCancel | `(event: ITouchEvent) => void` | - | 否 | 触摸取消事件 |

### 子元素

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
| --- | --- | --- | --- | --- |
| children | `React.ReactNode` | - | 是 | ScrollView的子元素内容 |

### RefresherDefaultStyle 枚举值

| 样式值 | 说明 |
| --- | --- |
| `'black'` | 黑色样式的下拉刷新指示器 |
| `'white'` | 白色样式的下拉刷新指示器 |
| `'none'` | 不显示默认样式，需要自定义 |

### ScrollViewStyle 详细属性

| 属性名 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| **布局属性** | | | |
| display | `'flex' \| 'none'` | - | 显示类型 |
| flexDirection | `string` | - | 主轴方向：'row', 'column'等 |
| justifyContent | `string` | - | 主轴对齐方式 |
| alignItems | `string` | - | 交叉轴对齐方式 |
| **尺寸属性** | | | |
| width | `number \| string` | - | 宽度 |
| height | `number \| string` | - | 高度（必须设置） |
| minWidth | `number \| string` | - | 最小宽度 |
| minHeight | `number \| string` | - | 最小高度 |
| **位置属性** | | | |
| position | `string` | - | 定位方式 |
| top | `number \| string` | - | 顶部距离 |
| left | `number \| string` | - | 左侧距离 |
| zIndex | `number` | - | 层级 |
| **背景和边框** | | | |
| backgroundColor | `string` | - | 背景颜色 |
| borderWidth | `number` | - | 边框宽度 |
| borderColor | `string` | - | 边框颜色 |
| borderRadius | `number` | - | 圆角半径 |
| **溢出控制** | | | |
| overflow | `string` | - | 溢出处理方式 |
| overflowX | `string` | - | 水平溢出处理 |
| overflowY | `string` | - | 垂直溢出处理 |

### 事件对象类型

```typescript
interface ScrollEvent {
  type: string
  timeStamp: number
  detail: {
    scrollLeft: number      // 横向滚动位置
    scrollTop: number       // 纵向滚动位置
    scrollHeight: number    // 滚动内容高度
    scrollWidth: number     // 滚动内容宽度
    deltaX: number          // 横向滚动距离变化
    deltaY: number          // 纵向滚动距离变化
  }
}

interface RefresherPullingEvent {
  type: string
  timeStamp: number
  detail: {
    deltaY: number          // 下拉距离
  }
}

interface BaseEvent {
  type: string
  timeStamp: number
  target: {
    id: string
    dataset: Record<string, any>
  }
  currentTarget: {
    id: string
    dataset: Record<string, any>
  }
}

interface ITouchEvent {
  type: string
  timeStamp: number
  target: ITouchTarget
  currentTarget: ITouchTarget
  detail: ITouchDetail
  touches?: ITouch[]
  changedTouches?: ITouch[]
}

interface ITouchTarget {
  id: string
  dataset: Record<string, any>
}

interface ITouchDetail {
  x: number
  y: number
}
```

## 高级用法

### 1. 横向滚动

```tsx
export default function HorizontalScrollView() {
  const items = ['项目1', '项目2', '项目3', '项目4', '项目5', '项目6']

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ marginBottom: 10 }}>横向滚动示例：</Text>
      <ScrollView
        scrollX
        style={{
          height: 100,
          backgroundColor: '#f5f5f5',
          whiteSpace: 'nowrap'
        }}
      >
        {items.map((item, index) => (
          <View
            key={index}
            style={{
              display: 'inline-block',
              width: 120,
              height: 80,
              backgroundColor: '#1890ff',
              margin: 10,
              borderRadius: 8,
              textAlign: 'center',
              lineHeight: '80px',
              color: '#fff'
            }}
          >
            <Text>{item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
```

### 2. 纵向滚动

```tsx
export default function VerticalScrollView() {
  const [scrollTop, setScrollTop] = useState(0)

  return (
    <View style={{ padding: 20 }}>
      <Text>当前滚动位置: {scrollTop}</Text>

      <ScrollView
        scrollY
        style={{ height: 300, backgroundColor: '#f0f0f0' }}
        scrollTop={scrollTop}
        onScroll={(e) => {
          setScrollTop(e.detail.scrollTop)
        }}
        onScrollToUpper={() => console.log('滚动到顶部')}
        onScrollToLower={() => console.log('滚动到底部')}
      >
        {[...Array(50)].map((_, index) => (
          <View
            key={index}
            style={{
              height: 60,
              backgroundColor: index % 2 === 0 ? '#e8e8e8' : '#d0d0d0',
              marginBottom: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text>列表项 {index + 1}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
```

### 3. 下拉刷新

```tsx
import { useState } from 'react'

export default function RefreshScrollView() {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [data, setData] = useState([1, 2, 3, 4, 5])

  const handleRefresh = () => {
    setIsRefreshing(true)

    // 模拟数据刷新
    setTimeout(() => {
      setData([6, 7, 8, 9, 10])
      setIsRefreshing(false)
    }, 2000)
  }

  return (
    <View style={{ padding: 20 }}>
      <ScrollView
        scrollY
        style={{ height: 400 }}
        refresherEnabled
        refresherTriggered={isRefreshing}
        refresherBackground="#f5f5f5"
        onRefresherRefresh={handleRefresh}
      >
        {data.map((item, index) => (
          <View
            key={index}
            style={{
              height: 80,
              backgroundColor: '#fff',
              marginBottom: 10,
              borderRadius: 8,
              padding: 20,
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            <Text>刷新后的数据项 {item}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
```

### 4. 双向滚动

```tsx
export default function BidirectionalScrollView() {
  return (
    <View style={{ padding: 20 }}>
      <Text>双向滚动示例（移动设备上滑动查看）</Text>

      <ScrollView
        scrollX
        scrollY
        style={{ height: 300, backgroundColor: '#f5f5f5' }}
      >
        <View style={{
          display: 'flex',
          flexDirection: 'column',
          minWidth: 600
        }}>
          {[...Array(20)].map((_, rowIndex) => (
            <View
              key={rowIndex}
              style={{
                display: 'flex',
                flexDirection: 'row',
                height: 60,
                borderBottom: '1px solid #ddd'
              }}
            >
              {[...Array(8)].map((_, colIndex) => (
                <View
                  key={colIndex}
                  style={{
                    width: 150,
                    borderRight: '1px solid #ddd',
                    padding: 10,
                    backgroundColor: (rowIndex + colIndex) % 2 === 0 ? '#fff' : '#f9f9f9'
                  }}
                >
                  <Text>单元格 {rowIndex}-{colIndex}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
```

### 5. 滚动到指定位置

```tsx
export default function ScrollToViewDemo() {
  const [activeSection, setActiveSection] = useState('')

  const scrollToSection = (sectionId) => {
    setActiveSection(sectionId)
  }

  return (
    <View style={{ padding: 20 }}>
      <View style={{
        position: 'sticky',
        top: 0,
        backgroundColor: '#fff',
        padding: 10,
        marginBottom: 10,
        display: 'flex',
        flexDirection: 'row',
        gap: 10,
        zIndex: 100
      }}>
        {['section1', 'section2', 'section3'].map((section) => (
          <Text
            key={section}
            style={{
              padding: '8px 16px',
              backgroundColor: activeSection === section ? '#1890ff' : '#f0f0f0',
              color: activeSection === section ? '#fff' : '#333',
              borderRadius: 4,
              cursor: 'pointer'
            }}
            onClick={() => scrollToSection(section)}
          >
            {section === 'section1' ? '第一部分' : section === 'section2' ? '第二部分' : '第三部分'}
          </Text>
        ))}
      </View>

      <ScrollView
        scrollY
        style={{ height: 400 }}
        scrollIntoView={activeSection}
        scrollWithAnimation
      >
        <View id="section1" style={{
          height: 300,
          backgroundColor: '#e6f7ff',
          padding: 20,
          marginBottom: 20,
          borderRadius: 8
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>第一部分</Text>
          <Text>这是第一部分的内容，可以滚动到这个位置。</Text>
        </View>

        <View id="section2" style={{
          height: 300,
          backgroundColor: '#f6ffed',
          padding: 20,
          marginBottom: 20,
          borderRadius: 8
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>第二部分</Text>
          <Text>这是第二部分的内容，可以滚动到这个位置。</Text>
        </View>

        <View id="section3" style={{
          height: 300,
          backgroundColor: '#fff2e8',
          padding: 20,
          marginBottom: 20,
          borderRadius: 8
        }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 10 }}>第三部分</Text>
          <Text>这是第三部分的内容，可以滚动到这个位置。</Text>
        </View>
      </ScrollView>
    </View>
  )
}
```

## 性能优化

### 1. 长列表优化

```tsx
export default function OptimizedLongList() {
  const [visibleData, setVisibleData] = useState([])
  const [startIndex, setStartIndex] = useState(0)
  const pageSize = 20
  const totalItems = 1000

  React.useEffect(() => {
    // 初始化第一页数据
    setVisibleData(Array.from({ length: Math.min(pageSize, totalItems) }, (_, i) => i))
  }, [])

  const handleScrollToLower = () => {
    const newStartIndex = startIndex + pageSize
    if (newStartIndex >= totalItems) return

    const endIndex = Math.min(newStartIndex + pageSize, totalItems)
    const newData = Array.from({ length: endIndex - newStartIndex }, (_, i) => newStartIndex + i)

    setVisibleData(prev => [...prev, ...newData])
    setStartIndex(newStartIndex)
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>优化的长列表（共{totalItems}项）</Text>
      <ScrollView
        scrollY
        style={{ height: 500 }}
        onScrollToLower={handleScrollToLower}
      >
        {visibleData.map((index) => (
          <View
            key={index}
            style={{
              height: 60,
              backgroundColor: '#fff',
              marginBottom: 2,
              padding: 15,
              border: '1px solid #f0f0f0',
              borderRadius: 4
            }}
          >
            <Text>列表项 {index + 1}</Text>
            <Text style={{ fontSize: 12, color: '#666' }}>
              这是第 {index + 1} 项，优化内存使用
            </Text>
          </View>
        ))}

        {startIndex + pageSize < totalItems && (
          <View style={{ textAlign: 'center', padding: 20 }}>
            <Text style={{ color: '#666' }}>加载中...</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}
```

### 2. 滚动节流

```tsx
export default function ThrottledScrollView() {
  const [scrollPosition, setScrollPosition] = useState(0)
  const lastScrollTime = React.useRef(0)

  const throttledScroll = (e) => {
    const now = Date.now()
    if (now - lastScrollTime.current > 100) { // 100ms节流
      setScrollPosition(e.detail.scrollTop)
      lastScrollTime.current = now
    }
  }

  return (
    <View style={{ padding: 20 }}>
      <Text>滚动位置（节流更新）: {Math.round(scrollPosition)}</Text>
      <ScrollView
        scrollY
        style={{ height: 300 }}
        onScroll={throttledScroll}
      >
        {[...Array(100)].map((_, index) => (
          <View
            key={index}
            style={{
              height: 60,
              backgroundColor: index % 2 === 0 ? '#f0f0f0' : '#e0e0e0',
              marginBottom: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Text>项 {index + 1}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
```

## 布局模式

### 1. Flexbox布局

```tsx
export default function FlexScrollView() {
  return (
    <ScrollView
      scrollY
      style={{ height: 400 }}
      enableFlex
    >
      <View style={{
        display: 'flex',
        flexDirection: 'column',
        flexGrow: 1
      }}>
        <View style={{
          flex: 1,
          backgroundColor: '#e6f7ff',
          padding: 20,
          minHeight: 150
        }}>
          <Text>弹性区域 1</Text>
        </View>

        <View style={{
          flex: 2,
          backgroundColor: '#f6ffed',
          padding: 20,
          minHeight: 300
        }}>
          <Text>弹性区域 2</Text>
        </View>

        <View style={{
          height: 100,
          backgroundColor: '#fff2e8',
          padding: 20
        }}>
          <Text>固定高度区域</Text>
        </View>
      </View>
    </ScrollView>
  )
}
```

### 2. 嵌套滚动容器

```tsx
export default function NestedScrollView() {
  return (
    <View style={{ padding: 20 }}>
      <Text>外层滚动容器</Text>

      <ScrollView
        scrollY
        style={{ height: 400, backgroundColor: '#f5f5f5' }}
      >
        <View style={{ padding: 20 }}>
          <Text style={{ marginBottom: 20 }}>固定内容区域</Text>

          <Text>内层横向滚动容器：</Text>
          <ScrollView
            scrollX
            style={{
              height: 100,
              backgroundColor: '#fff',
              marginBottom: 20,
              borderRadius: 8
            }}
          >
            {[...Array(10)].map((_, index) => (
              <View
                key={index}
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#1890ff',
                  marginRight: 10,
                  borderRadius: 8,
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Text style={{ color: '#fff' }}>{index + 1}</Text>
              </View>
            ))}
          </ScrollView>

          <Text>更多固定内容...</Text>
          {[...Array(20)].map((_, index) => (
            <View
              key={index}
              style={{
                height: 40,
                backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9',
                marginBottom: 2,
                padding: 10,
                borderRadius: 4
              }}
            >
              <Text>内容项 {index + 1}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
```

## 平台兼容性

### 1. 跨平台滚动行为

```tsx
export default function CrossPlatformScrollView() {
  const [platform, setPlatform] = useState('')

  React.useEffect(() => {
    setPlatform(process.env.TARO_ENV || 'h5')
  }, [])

  return (
    <View style={{ padding: 20 }}>
      <Text>当前平台: {platform}</Text>

      <ScrollView
        scrollY
        style={{ height: 300 }}
        scrollWithAnimation={platform !== 'rn'} // RN端动画可能有性能问题
        showScrollbar={platform === 'h5'} // 小程序端滚动条显示受限
      >
        <Text style={{ marginBottom: 10 }}>跨平台滚动特性：</Text>
        <Text>• H5: 完整CSS滚动支持，平滑滚动</Text>
        <Text>• RN: 原生滚动，性能优异</Text>
        <Text>• 小程序: 有限的滚动控制，依赖系统实现</Text>

        {[...Array(30)].map((_, index) => (
          <View
            key={index}
            style={{
              height: 50,
              backgroundColor: index % 2 === 0 ? '#e8e8e8' : '#f0f0f0',
              marginBottom: 2,
              padding: 15,
              borderRadius: 4
            }}
          >
            <Text>平台兼容项 {index + 1}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
```

## 错误处理

### 1. 滚动异常处理

```tsx
export default function SafeScrollView({ children, ...props }) {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState(null)

  const handleScrollError = (error) => {
    console.warn('ScrollView滚动异常:', error)
    setHasError(true)
    setError(error)
  }

  if (hasError) {
    return (
      <View style={{
        padding: 20,
        backgroundColor: '#fff2f0',
        border: '1px solid #ffccc7',
        borderRadius: 8,
        textAlign: 'center'
      }}>
        <Text style={{ color: '#ff4d4f', marginBottom: 10 }}>
          滚动容器加载失败
        </Text>
        <Text style={{ fontSize: 12, color: '#666' }}>
          {error?.message || '未知错误'}
        </Text>
      </View>
    )
  }

  return (
    <ScrollView
      {...props}
      onError={handleScrollError}
      style={[{ backgroundColor: '#f9f9f9' }, props.style]}
    >
      {children}
    </ScrollView>
  )
}
```

## 最佳实践

### 1. 性能优化建议

```tsx
export default function BestPracticeScrollView() {
  return (
    <View style={{ padding: 20 }}>
      {/* ✅ 推荐：设置固定高度 */}
      <ScrollView
        scrollY
        style={{ height: 400 }} // 必须设置固定或相对高度
        enableFlex // 启用Flexbox布局
      >
        {/* ✅ 推荐：避免过多的DOM节点 */}
        {[...Array(50)].map((_, index) => (
          <View key={index} style={{ height: 60 }}>
            <Text>优化的列表项 {index + 1}</Text>
          </View>
        ))}
      </ScrollView>

      {/* ❌ 避免：不设置高度 */}
      {/* <ScrollView scrollY>
        <Text>这样无法正常滚动</Text>
      </ScrollView> */}
    </View>
  )
}
```

### 2. 滚动性能监控

```tsx
export default function PerformanceMonitorScrollView() {
  const [scrollStats, setScrollStats] = useState({
    scrollCount: 0,
    lastScrollTime: 0,
    maxScrollDistance: 0
  })

  const handleScroll = (e) => {
    const now = Date.now()
    const scrollTop = e.detail.scrollTop

    setScrollStats(prev => ({
      scrollCount: prev.scrollCount + 1,
      lastScrollTime: now,
      maxScrollDistance: Math.max(prev.maxScrollDistance, scrollTop)
    }))
  }

  return (
    <View style={{ padding: 20 }}>
      <View style={{
        backgroundColor: '#f0f0f0',
        padding: 15,
        marginBottom: 20,
        borderRadius: 8
      }}>
        <Text>滚动统计:</Text>
        <Text>滚动次数: {scrollStats.scrollCount}</Text>
        <Text>最大滚动距离: {scrollStats.maxScrollDistance}</Text>
      </View>

      <ScrollView
        scrollY
        style={{ height: 300 }}
        onScroll={handleScroll}
      >
        {[...Array(100)].map((_, index) => (
          <View
            key={index}
            style={{
              height: 50,
              backgroundColor: index % 2 === 0 ? '#e8e8e8' : '#f0f0f0',
              marginBottom: 2,
              padding: 15
            }}
          >
            <Text>性能测试项 {index + 1}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  )
}
```

## 相关组件

- [`View`](./View.md) - 基础视图容器组件
- [`Text`](./Text.md) - 文本组件
- [`Image`](./Image.md) - 图片组件
- [`RichText`](./RichText.md) - 富文本组件
- [`Swiper`](https://taro-docs.jd.com/docs/component/swiper) - 轮播组件

## 参考资料

- [Taro官方文档](https://taro-docs.jd.com/)
- [React Native ScrollView文档](https://reactnative.dev/docs/scrollview)
- [Web滚动优化指南](https://web.dev/scrolling-performance/)