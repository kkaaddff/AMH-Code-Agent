# Steps 步骤条

步骤条组件，建议步骤在 2 ～ 4 之内。

## 引用
```tsx
import { Steps, StepsItem } from '@fta/components'
```

## 示例

### 基本演示

子项目可以使用 JSON 数组列表或 TSX 节点，两者有细微差别：前者的属性可以覆盖组件的内部属性（如 `active` 等）。

```tsx
import { Steps, StepsItem } from '@fta/components'
import { DemoBlock, Gap, Layout } from '@fta/components/common/display'
import { Text, View } from '@tarojs/components'
import React, { useState } from 'react'
import './index.scss'

const StepsExample = () => {
  const [current, setCurrent] = useState(0)

  return (
    <>
      <DemoBlock label='基础使用'>
        <Steps
          current={1}
          items={[
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
          ]}
        />
      </DemoBlock>

      <DemoBlock label='TSX写法'>
        <Steps current={0}>
          <StepsItem title='tsx标题1' desc='tsx正文1' />
          <StepsItem title='tsx标题2' desc='tsx正文2' />
          <StepsItem title='tsx标题3' desc='tsx正文3' />
        </Steps>
      </DemoBlock>

      <DemoBlock label='显示步骤' flexDirection='column'>
        <Steps
          current={1}
          type='ordered'
          items={[
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
          ]}
        />
        <Gap />
        <Steps
          current={-1}
          type='ordered'
          items={[
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
          ]}
        />
      </DemoBlock>

      <DemoBlock label='点击事件'>
        <Steps
          current={current}
          onChange={setCurrent}
          type='ordered'
          items={[
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
          ]}
        />
      </DemoBlock>
    </>
  )
}

export default () => (
  <Layout title='步骤条' qrcode='components/display/steps/index'>
    <StepsExample />
  </Layout>
)
```

### 自定义演示

子项目可以使用 JSON 数组列表或 TSX 节点，两者有细微差别：前者的属性可以覆盖组件的内部属性（如 `active` 等）。

```tsx
import { Steps, StepsItem } from '@fta/components'
import { DemoBlock, Gap, Layout } from '@fta/components/common/display'
import { Text, View } from '@tarojs/components'
import React, { useState } from 'react'
import './index.scss'

const StepsExample = () => {
  const [current, setCurrent] = useState(0)

  return (
    <>
      <DemoBlock label='自定义显示文字' flexDirection='column'>
        <Steps
          current={current}
          onChange={setCurrent}
          type='ordered'
          format={['F', 'T', 'A']}
          items={[
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
          ]}
        />
        <Gap />
        <Steps
          current={current}
          onChange={setCurrent}
          type='ordered'
          format={(i) => String.fromCharCode(i + 65)}
          items={[
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
          ]}
        />
        <Gap />
        <Steps
          current={current}
          onChange={setCurrent}
          type='ordered'
          items={[
            { title: '标题内容', desc: '正文正文正文', mark: '魑' },
            { title: '标题内容', desc: '正文正文正文', mark: '魅' },
            { title: '标题内容', desc: '正文正文正文', mark: '魍' },
            { title: '标题内容', desc: '正文正文正文', mark: '魉' },
          ]}
        />
      </DemoBlock>

      <DemoBlock label='自定义圆形图示'>
        <Steps
          current={current}
          onChange={setCurrent}
          type='custom'
          format={['F', 'T', 'A']}
          items={[
            {
              title: '标题内容',
              desc: '正文正文正文',
              render: (
                <View className='demo-steps-render'>
                  <Text className='demo-steps-render__text'>@@</Text>
                </View>
              ),
            },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
          ]}
        />
      </DemoBlock>

      <DemoBlock label='自定义连接线'>
        <Steps
          current={current}
          onChange={setCurrent}
          renderBond={(_left, _index, active) => (
            <View className={`demo-steps-bond ${active ? 'demo-steps-bond--active' : ''}`}></View>
          )}
          items={[
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
          ]}
        />
      </DemoBlock>

      <DemoBlock label='自定义主题色'>
        <Steps
          theme='rgb(1, 84, 254)'
          type='ordered'
          current={current}
          onChange={setCurrent}
          items={[
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
          ]}
        />
      </DemoBlock>

      <DemoBlock label='自定义渲染'>
        <Steps
          theme='rgb(1, 84, 254)'
          type='ordered'
          current={current}
          renderStep={(active, index) => (
            <Text style={{ color: active ? 'rgb(1, 84, 254)' : 'rgb(1, 84, 254, 0.5)' }}>{index + 1}</Text>
          )}
          onChange={setCurrent}
          items={[
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
          ]}
        />
      </DemoBlock>

      <DemoBlock label='自定义样式'>
        <Steps
          current={1}
          type='ordered'
          renderStyle={(active) => ({
            step: { backgroundColor: active ? 'green' : 'greenyellow' },
            title: { color: active ? 'green' : 'greenyellow' },
            desc: { color: active ? 'green' : 'greenyellow' },
          })}
          items={[
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
            { title: '标题内容', desc: '正文正文正文' },
          ]}
        />
      </DemoBlock>
    </>
  )
}

export default () => (
  <Layout title='步骤条' qrcode='components/display/steps/index'>
    <StepsExample />
  </Layout>
)
```

## API

### Props

| 属性名             | 描述                                                                 | 类型                                | 默认值 | 版本     |
|--------------------|----------------------------------------------------------------------|-------------------------------------|--------|----------|
| current            | 当前步骤索引值，受控组件                                             | `number`                            | `0`    | -        |
| items              | 选项数组                                                             | `StepsItemProps[]`                  | `--`   | -        |
| children           | 子节点                                                               | `ReactElement[]`                    | `--`   | -        |
| type               | 控件类型：小圆点、有序列表、自定义                                   | `"dot" \| "custom" \| "ordered"`    | `"dot"`| -        |
| containerClassName | 容器样式类名                                                         | `string`                            | `--`   | 1.10.16  |
| containerStyle     | 容器内联样式                                                         | `{}`                                | `--`   | 1.10.16  |
| format             | 格式化文本，默认为索引+1，在 `type` 不为 `dot` 时生效                | `Array \| (index: number) => string`| `{}`   | -        |
| renderBond         | 自定义渲染进度条连接处，默认为实线                                   | `(left: boolean, index: number, active: boolean) => ReactNode` | `--` | 1.0.8 |
| renderStep         | 自定义渲染进度展示节点                                               | `(active: boolean, index: number) => ReactNode` | `--` | 1.0.8 |
| renderStyle        | 自定义样式                                                           | `(active: boolean \| undefined, index: number) => object` | `--` | 1.0.8 |
| theme              | 主题色                                                               | `string \| unknown[]`               | `--`   | -        |

### Events

| 属性名    | 描述                     | 类型                     | 默认值 | 版本 |
|---------|--------------------------|--------------------------|--------|------|
| onChange | 点击项目列表时的回调     | `(index: number) => void` | `--`   | -    |