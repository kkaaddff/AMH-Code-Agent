# Rate 评分

一般用于满意度调查

## 引用
```javascript
import { Rate } from '@fta/components'
```

## 示例

### 基础演示
```javascript
import { Rate, useEnhancedState } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => {
  const [state, setState] = useEnhancedState({
    val1: 4,
    val2: 3.5,
    val3: 3,
    val4: 3,
    val5: 0,
    val6: 1,
    val7: 0,
    val8: 0,
  })

  return (
    <Layout title='评分' qrcode='components/form/rate/index'>
      <DemoBlock label='基础使用'>
        <Rate value={state.val1} onChange={(val) => setState('val1', val)} />
      </DemoBlock>

      <DemoBlock label='允许半星'>
        <Rate half value={state.val2} onChange={(val) => setState('val2', val)} />
      </DemoBlock>

      <DemoBlock label='禁用状态（不可编辑 & 置灰）'>
        <Rate disabled value={state.val3} onChange={(val) => setState('val3', val)} />
      </DemoBlock>

      <DemoBlock label='只读状态（不可编辑）'>
        <Rate readonly value={state.val4} onChange={(val) => setState('val4', val)} />
      </DemoBlock>

      <DemoBlock label='限制最少选中'>
        <Rate min={3} value={state.val5} onChange={(val) => setState('val5', val)} />
      </DemoBlock>
    </Layout>
  )
}
```

### 业务场景
```javascript
import { Rate, useEnhancedState } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React from 'react'

export default () => {
  const [state, setState] = useEnhancedState({
    val1: 4,
    val2: 3.5,
    val3: 3,
    val4: 3,
    val5: 0,
    val6: 1,
    val7: 0,
    val8: 0,
  })

  return (
    <Layout title='评分' qrcode='components/form/rate/index'>
      <DemoBlock label='图片表情-5档(V1.2.2)' flexDirection='column'>
        <Rate useEmoji value={state.val7} onChange={(val) => setState('val7', val)} />
      </DemoBlock>

      <DemoBlock label='图片表情-3档(V1.2.2)' flexDirection='column'>
        <Rate useEmoji={3} style={{ width: '50%' }} value={state.val8} onChange={(val) => setState('val8', val)} />
      </DemoBlock>

      <DemoBlock label='自定义星图(V1.1.0)'>
        <Rate
          value={state.val1}
          onChange={(val) => setState('val1', val)}
          useCustom={{
            active: 'https://imagecdn.ymm56.com/ymmfile/static/resource/8b3fe8fe-0d47-4d98-a145-562e3c321fb4.png',
            inactive: 'https://imagecdn.ymm56.com/ymmfile/static/resource/14ad0e3f-6e98-4ae1-a277-b7d84570ac71.png',
          }}
        />
      </DemoBlock>

      <DemoBlock label='自定义大小&间距&数量'>
        <Rate size={60} gutter={36} count={7} value={state.val6} onChange={(val) => setState('val6', val)} />
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性名      | 描述                     | 类型                          | 默认值  | 版本   |
|-----------|------------------------|-----------------------------|-------|------|
| value     | 选择星星的数量              | `number`                    | `1`   |      |
| count     | 星星总数量                 | `number`                    | `5`   |      |
| readonly  | 是否只读                  | `boolean`                   | `false` |      |
| disabled  | 是否禁用                  | `boolean`                   | `--`  |      |
| size      | 星星尺寸，默认 28px（设计稿720px） | `number`                    | `36`  |      |
| gutter    | 星星之间的距离               | `number`                    | `16`  |      |
| min       | 最少选中星星的个数            | `number`                    | `1`   |      |
| half      | 是否允许半星选择              | `boolean`                   | `false` |      |
| useCustom | 使用自定义图片               | `{ active?: string; inactive?: ... }` | `--`  | 1.1.0 |
| useEmoji  | 是否使用图片表情，默认五档        | `boolean \| 3 \| 5 \| {}`     | `--`  | 1.2.2 |
| textColor | 文字颜色                   | `(isActive: boolean) => string` | `--`  | 1.2.2 |

### Events

| 属性名      | 描述               | 类型                     | 默认值  | 版本   |
|-----------|------------------|------------------------|-------|------|
| onChange  | 选中的值变化的回调       | `(count: number) => any` | `--`  |      |