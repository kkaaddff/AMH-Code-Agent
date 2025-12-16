````markdown
# LoadingImage 图片

可预览的图片组件，用于展示图片，支持加载中和加载失败的容错处理。

## 说明

### 使用说明

此组件为 Taro [Image](https://taro-docs.jd.com/docs/components/media/image) 组件的加强版，继承原有功能并进行二次封装。在需要兜底图或容错处理的场景中更推荐使用此组件。

## 引用

```tsx
import { Image } from '@fta/components';
```
````

## 示例

### 基础演示

```tsx
import { Assets, Icon, Image, Loading, Text } from '@fta/components';
import { DemoBlock, Layout } from '@fta/components/common/display';
import React, { useEffect, useState } from 'react';
import './index.scss';

const avatar = 'https://imagecdn.ymm56.com/ymmfile/static/resource/eec68ce4-d43e-416d-b04c-9a0f11b3fa7b.png';
const logo = 'https://imagecdn.ymm56.com/ymmfile/static/resource/ee818cc7-2d53-4681-b81c-bd03759ad7a8.png';

export default () => {
  const [src, setSrc] = useState('');
  useEffect(() => {
    setTimeout(() => {
      setSrc(avatar);
    }, 3000);
  });

  return (
    <Layout title='图片' qrcode='components/basic/image/index' className='demo-image'>
      <DemoBlock label='基础用法' justifyContent='space-around'>
        <Image
          bgColor='#efefef'
          src={src}
          errorIcon={logo}
          showError
          showLoading={false}
          onError={() => {
            console.log('image errored');
          }}
        />
        <Image src={avatar} shape='circle' />
      </DemoBlock>

      <DemoBlock label='监听加载完成/失败事件' justifyContent='space-around'>
        <Image src='https://www.baidu.com' onError={() => console.log('加载失败')} />
        <Image shape='circle' src={logo} onLoad={() => console.log('加载完成')} />
      </DemoBlock>

      <DemoBlock label='裁剪/缩放' justifyContent='space-around'>
        <Image src={logo} mode='aspectFill' bgColor='#aaa' />
        <Image src={logo} mode='aspectFit' bgColor='#ccc' />
        <Image src={logo} mode='scaleToFill' bgColor='#eee' />
      </DemoBlock>
    </Layout>
  );
};
```

### 自定义

```tsx
import { Assets, Icon, Image, Loading, Text } from '@fta/components';
import { DemoBlock, Layout } from '@fta/components/common/display';
import React, { useEffect, useState } from 'react';
import './index.scss';

const avatar = 'https://imagecdn.ymm56.com/ymmfile/static/resource/eec68ce4-d43e-416d-b04c-9a0f11b3fa7b.png';
const logo = 'https://imagecdn.ymm56.com/ymmfile/static/resource/ee818cc7-2d53-4681-b81c-bd03759ad7a8.png';

export default () => {
  const [src, setSrc] = useState('');
  useEffect(() => {
    setTimeout(() => {
      setSrc(avatar);
    }, 3000);
  });

  return (
    <Layout title='图片' qrcode='components/basic/image/index' className='demo-image'>
      <DemoBlock label='自定义加载中/加载失败' justifyContent='space-around'>
        <Image
          src='https://www.baidu.com'
          loadingIcon={<Loading useImage size={96} src={Assets.loading.orange} />}
          errorIcon={<Icon value='CloseOutlined' size={96} color='#999999' />}
        />
        <Image
          shape='circle'
          src='https://www.baidu.com'
          errorIcon={
            <Text level={5} color='#666666'>
              Failed to load
            </Text>
          }
          loadingIcon={
            <Text level={5} color='#666666'>
              Loading...
            </Text>
          }
        />
      </DemoBlock>

      <DemoBlock label='自定义背景色' justifyContent='space-around'>
        <Image
          src='https://www.baidu.com'
          errorIcon={
            <Text level={5} color='#ffffff'>
              Failed to load
            </Text>
          }
          loadingIcon={
            <Text level={5} color='#ffffff'>
              Loading
            </Text>
          }
          bgColor='#fd3333'
        />
        <Image
          shape='circle'
          mode='aspectFill'
          src={logo}
          errorIcon={
            <Text level={5} color='#666666'>
              Failed to load
            </Text>
          }
          loadingIcon={
            <Text level={5} color='#666666'>
              Loading
            </Text>
          }
          bgColor='#aaa'
        />
      </DemoBlock>
    </Layout>
  );
};
```

## API

### Props

| 属性名      | 描述                                                                  | 类型                          | 默认值      | 版本 |
| ----------- | --------------------------------------------------------------------- | ----------------------------- | ----------- | ---- |
| shape       | 图片形状，`circle`-圆形，`square`-方形                                | `"circle" \| "square"`        | `"square"`  |      |
| errorIcon   | 加载失败时显示的内容                                                  | `ReactNode`                   | `--`        |      |
| showError   | 是否显示加载错误的占位图                                              | `boolean`                     | `true`      |      |
| loadingIcon | 加载中显示的内容                                                      | `ReactNode`                   | `--`        |      |
| showLoading | 是否显示加载中的占位图                                                | `boolean`                     | `true`      |      |
| bgColor     | 背景颜色                                                              | `string`                      | `"#f3f4f6"` |      |
| asyncIcon   | 异步加载图片时的占位节点（初始 src 为 falsy 时），设为 `false` 可禁用 | `ReactElement \| false`       | `--`        |      |
| mode        | 图片缩放模式，不支持 `widthFix` 和 `heightFix`                        | `string \| number \| unknown` | `--`        |      |
| src         | 图片资源地址                                                          | `string`                      | **(必选)**  |      |

### Events

| 属性名  | 描述                   | 类型           | 默认值 |
| ------- | ---------------------- | -------------- | ------ |
| onClick | 手指触摸后马上离开触发 | `(event: ...)` | `--`   |

```

```
