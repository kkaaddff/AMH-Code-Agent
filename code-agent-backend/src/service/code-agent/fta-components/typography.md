# Typography 排版

文本的基本格式，内置关怀模式的 `Text` 组件。

- 当需要展示标题、段落、列表内容时使用，如文章/博客/日志的文本样式。
- 当需要一列基于文本的基础操作时，如拷贝/省略/可编辑。

## 说明

### 平台差异说明

- 小程序平台 `Text` 组件嵌套时，部分机型上内部的 `Text` 点击事件可能存在失效情况。
- 如果有嵌套并携带点击事件的场景，外层的 `Text` 请换成 `View` 组件。

### 使用说明

此组件为 Taro [Text](https://taro-docs.jd.com/docs/components/base/text) 组件的加强版，集成了项目中常用的文本功能，几乎涵盖大部分文本使用场景，无需自行定义。

## 引用

```tsx
import { Text } from '@fta/components';
```

## 示例

### 基础演示

```tsx
import { Text } from '@fta/components';
import { DemoBlock, Layout } from '@fta/components/common/display';
import React from 'react';

const TypographyDemo = () => {
  return (
    <>
      <DemoBlock label="基础使用" justifyContent={'space-between'}>
        <Text underline>下划线</Text>
        <Text line>删除线</Text>
        <Text strong>加粗</Text>
        <Text italic>斜体</Text>
      </DemoBlock>

      <DemoBlock label="主题色" justifyContent={'space-between'}>
        <Text type="success">成功</Text>
        <Text type="error">失败</Text>
        <Text type="warning">警告</Text>
        <Text type="info">信息</Text>
      </DemoBlock>

      <DemoBlock label="溢出隐藏(v1.0.14)" justifyContent={'space-between'}>
        <Text type="warning" singleLine>
          这是一段很长的文本，溢出就会被隐藏，你看到效果了吗
        </Text>
      </DemoBlock>

      <DemoBlock label="大标题（设计稿720px）" flexDirection="column">
        <Text size={64} weight="bold">大标题 64px</Text>
      </DemoBlock>

      <DemoBlock label="大标题" flexDirection="column">
        <Text size={48} weight="bold">大标题 48px</Text>
      </DemoBlock>

      <DemoBlock label="一级文本（设计稿720px）" flexDirection="column">
        <Text size={40}>一级文本内容 40px</Text>
      </DemoBlock>

      <DemoBlock label="二级文本" flexDirection="column">
        <Text size={36}>二级文本内容 36px</Text>
      </DemoBlock>

      <DemoBlock label="三级文本" flexDirection="column">
        <Text size={32}>三级文本内容 32px</Text>
      </DemoBlock>

      <DemoBlock label="四级文本" flexDirection="column">
        <Text size={30}>四级文本内容 30px</Text>
      </DemoBlock>

      <DemoBlock label="五级文本" flexDirection="column">
        <Text size={28}>五级文本内容 28px</Text>
      </DemoBlock>

      <DemoBlock label="五级文本(辅助)" flexDirection="column">
        <Text size={26}>五级文本内容 26px</Text>
      </DemoBlock>

      <DemoBlock label="六级文本" flexDirection="column">
        <Text size={24}>六级文本内容 24px</Text>
      </DemoBlock>

      <DemoBlock label="说明文字" flexDirection="column">
        <Text size={22}>说明文字 22px</Text>
      </DemoBlock>

      <DemoBlock label="说明文字" flexDirection="column">
        <Text size={20}>说明文字 20px</Text>
      </DemoBlock>

      <DemoBlock label="说明文字" flexDirection="column">
        <Text size={18}>说明文字 18px</Text>
      </DemoBlock>

      <DemoBlock label="自定义属性" flexDirection="column">
        <Text size={32} color="#fd3333" weight={400}>
          自定义文本内容 32px
        </Text>
      </DemoBlock>
    </>
  );
};

export default () => (
  <Layout title="排版" qrcode="components/basic/typography/index">
    <TypographyDemo />
  </Layout>
);
```

## API

### Props

| 属性名           | 描述                                       | 类型                                      | 默认值   | 版本     |
|------------------|--------------------------------------------|-------------------------------------------|----------|----------|
| level            | 文字等级，默认 32px（设计稿 720px）         | `1 \| 2 \| 3 \| 4 \| 5 \| 6`               | `4`      | -        |
| size             | 字体大小（设计稿 750px），优先级高于 level | `number`                                  | `--`     | -        |
| scale            | 是否根据屏幕比例缩放，`false` 为绝对尺寸   | `boolean`                                 | `true`   | -        |
| color            | 字体颜色                                   | `string`                                  | `--`     | -        |
| weight           | 字体字重                                   | `bold \| normal \| 100 \| 200 \| ...`     | `--`     | -        |
| type             | 文本类型                                   | `"warning" \| "info" \| "success" \| "error"` | `--`     | 1.0.3    |
| underline        | 是否展示下划线                             | `boolean`                                 | `false`  | -        |
| line             | 是否展示删除线，优先级高于 underline       | `boolean`                                 | `false`  | -        |
| strong           | 是否加粗显示                               | `boolean`                                 | `false`  | -        |
| italic           | 是否斜体字                                 | `boolean`                                 | `false`  | -        |
| singleLine       | 是否单行文本，溢出显示省略号               | `boolean`                                 | `false`  | 1.0.14   |
| lineHeight       | 是否应用行高                               | `boolean`                                 | `--`     | 1.2.4    |
| enableCareMode   | 是否支持关怀模式                           | `boolean`                                 | `true`   | 1.2.4    |
| children         | 子元素                                     | `any`                                     | `--`     | -        |

### Events

| 属性名   | 描述       | 类型             | 默认值 | 版本  |
|----------|------------|------------------|--------|-------|
| onClick  | 点击回调   | `(e: any) => any` | `--`   | -     |