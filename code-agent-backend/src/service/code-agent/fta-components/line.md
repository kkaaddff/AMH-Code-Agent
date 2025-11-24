# Line 线条

此组件一般用于显示一根线条，用于分隔内容块，有横向和竖向两种模式，且能设置 1PX 绝对像素，使用也很简单。

## 引用
```javascript
import { Line } from '@fta/components'
```

## 示例

### 基础使用
```javascript
<Line />
```

### 虚线（推荐使用 DashedLine 组件）
```javascript
<DashedLine dashColor='red' dashThickness={1} />
```

### 自定义颜色
```javascript
<Line color='#fd3333' />
```

### 自定义方向
```javascript
<Line col />
```

### 自定义长度
```javascript
<Line length={px(100)} />
```

### 自定义间距
```javascript
<Line
  margin={{
    top: px(20),
    left: px(20),
  }}
/>
```

### 粗线条 [1.0.9 生效]
```javascript
<Line bold />
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| color | 线条颜色 | `string` | `"#f8f8f8"` | - |
| length | 长度 | `string \| number` | `"100%"` | - |
| col | 是否纵向显示 | `boolean` | `false` | - |
| hairline | 是否显示细边框，1.0.9 版本已废弃，默认为细线 | `boolean` | `false` | - |
| bold | 是否显示粗边框 1PX 绝对像素 | `boolean` | `false` | 1.0.9 |
| dashed | 是否虚线 | `boolean` | `false` | - |
| margin | 线条与上下左右元素的边距 | `string \| number \| { left?: string \| number, right?: string \| number, top?: string \| number, bottom?: string \| number }` | `--` | - |