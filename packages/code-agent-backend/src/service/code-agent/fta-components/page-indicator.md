# PageIndicator 分页符

遵循满帮设计规范，指示当前显示的是多页面视图/轮播图的哪一页。

## 引用
```javascript
import { PageIndicator } from '@fta/components'
```

## 示例

### 基础用法
```javascript
<PageIndicator size="small" current={0} total={4} />
```

### 自定义颜色
```javascript
<PageIndicator theme="#1fb080" color="#999" size="small" current={0} total={4} />
```

### 垂直方向
```javascript
<PageIndicator direction="vertical" current={0} total={4} />
```

### 中尺寸
```javascript
<PageIndicator size="medium" current={0} total={4} />
```

### 圆点样式
```javascript
<PageIndicator size="medium" current={0} total={4} dot />
```

### 自定义样式
```javascript
<PageIndicator
  size="medium"
  current={0}
  total={4}
  itemStyle={({ active, index }) => ({
    width: active ? scale(48) : scale(24),
    height: scale(16),
    marginLeft: index ? scale(16) : 0,
  })}
/>
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| current | 当前页索引 | `number` | `0` | - |
| size | 尺寸 | `"small" \| "medium"` | `--` | - |
| direction | 排列方向 | `"vertical" \| "horizontal"` | `"horizontal"` | - |
| total | 总数 | `number` | `--` | - |
| color | 非聚焦情况下的背景色 | `string` | `--` | - |
| dot | 是否应用全圆点样式 | `boolean` | `false` | - |
| itemStyle | 指定页符的样式 | `(data: { index: number; active: boolean }) => object` | `--` | - |
| theme | 主题色 | `string \| unknown[]` | `--` | - |