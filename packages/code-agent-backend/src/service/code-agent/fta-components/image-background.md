# ImageBackground 背景图容器

带背景图的容器组件，使用时请指定宽高。

## 引用
```javascript
import { ImageBackground } from '@fta/components'
```

## 示例

### 基础演示
```javascript
import { Flex, ImageBackground, Radio, scale, Text } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import { ImageResizeMode } from '@fta/components/types/image-background'
import React, { useState } from 'react'

export default () => {
  const modeList = [
    { label: 'center', value: 'center' },
    { label: 'repeat', value: 'repeat' },
    { label: 'stretch', value: 'stretch' },
    { label: 'contain', value: 'contain' },
    { label: 'cover', value: 'cover' }
  ]

  const [mode, setMode] = useState<ImageResizeMode>('contain')

  return (
    <Layout title='背景图容器' qrcode='components/display/image-background/index'>
      <DemoBlock label='基础使用'>
        <ImageBackground
          resizeMode={mode}
          source={{
            uri: 'https://images.unsplash.com/photo-1481595357459-84468f6eeaac?dpr=1&auto=format&fit=crop&w=376&h=251&q=60&cs=tinysrgb',
          }}
          style={{ width: '100%', height: scale(600), backgroundColor: 'red' }}
          imageStyle={{ backgroundColor: 'green' }}
        >
          <Flex.Center style={{ flex: 1 }}>
            <Text color='#ffffff' level={3}>
              ImageBackground
            </Text>
          </Flex.Center>
        </ImageBackground>
      </DemoBlock>

      <DemoBlock label='resizeMode 切换（h5和小程序不支持repeat）'>
        <Radio
          type='between'
          options={modeList}
          value={mode}
          onChange={(value) => setMode(value)}
        />
      </DemoBlock>
    </Layout>
  )
}
```

## API

### Props

| 属性名         | 描述                                   | 类型                      | 默认值   | 版本  |
|----------------|----------------------------------------|---------------------------|----------|-------|
| imageRef       | 图片 ref                               | `any`                     | `--`     |       |
| imageClassName | 图片样式类名                           | `string`                  | `--`     |       |
| imageStyle     | 图片样式                               | `any`                     | `--`     |       |
| resizeMode     | 图片缩放模式，h5 和小程序不支持 repeat | `"center" \| "repeat" \| "stretch" \| "contain" \| "cover"` | `--`     |       |
| children       | 子元素                                 | `any`                     | `--`     |       |
| source         | 图片资源地址                           | `{ uri: string }`         | `(必选)` |       |