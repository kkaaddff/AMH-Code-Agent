# NavBar 导航栏

为页面提供全局性的导航功能，主要用于头部导航，需要隐藏各端内置的导航栏。

## 说明

### 适配问题

如果满帮 APP 环境下的 H5 页面是沉浸式的，需要显式传入 `immersive={true}`，该组件无法准确主动判断当前页面在安卓端是否是沉浸式页面（底部三大金刚键导致逻辑判断错误）。

## 引用

```tsx
import { NavBar, NavBarButton } from '@fta/components';
```

## 示例

### 基础演示

```tsx
import { Icon, NavBar, scale, SegmentedControl } from '@fta/components';
import { DemoBlock, Layout, warn } from '@fta/components/common/display';
import { Text, View } from '@tarojs/components';
import React, { useState } from 'react';

const CustomSegmentedControl = ({ dark, title }: { dark?: boolean; title?: string[] }) => {
  const [current, setCurrent] = useState(0);
  return (
    <SegmentedControl
      level={5}
      values={title || ['标题', '标题']}
      current={current}
      color={dark ? '#fd3333' : '#fff'}
      selectedColor={!dark ? '#fd3333' : '#fff'}
      size='small'
      onClick={setCurrent}
    />
  );
};

const NavBarDemo = () => {
  return (
    <React.Fragment>
      <DemoBlock label='基础导航' pure>
        <NavBar
          immersive
          safeAreaStyle={{
            backgroundColor: '#fff',
          }}
          title={{
            title: '标题',
            handler() {
              warn('点击了标题');
            },
          }}
        />
      </DemoBlock>

      <DemoBlock label='基础导航-左右操作' pure>
        <NavBar
          immersive
          title={{
            title: '标题',
            handler() {
              warn('点击了标题');
            },
          }}
          leftButton={{
            title: '操作',
            handler() {
              warn('点击左侧按钮');
            },
          }}
          rightButton={{
            title: '操作',
            handler() {
              warn('点击右侧按钮');
            },
          }}
        />
      </DemoBlock>

      <DemoBlock label='左侧标题' pure>
        <NavBar
          immersive
          back={{
            handler: () => warn('点击了返回按钮'),
            title: (
              <Text
                style={{
                  fontSize: scale(36),
                  fontWeight: 'bold',
                }}>
                标题
              </Text>
            ),
          }}
          rightButton={<Text style={{ marginRight: scale(32), fontSize: scale(28) }}>按钮</Text>}
        />
      </DemoBlock>

      <DemoBlock label='基础导航+选项操作（浅色底）' pure>
        <NavBar immersive title={{ title: <CustomSegmentedControl /> }} />
      </DemoBlock>

      <DemoBlock label='基础导航+选项操作（浅色底）' pure>
        <NavBar immersive tintColor='#fd3333' title={{ title: <CustomSegmentedControl dark /> }} />
      </DemoBlock>

      <DemoBlock label='导航深色底（单色/渐变/图片）' pure>
        <NavBar
          immersive
          tintColor='#fd3333'
          title={{ title: '标题', tintColor: 'white' }}
          back={{ color: '#ffffff', handler: () => warn('点击了返回按钮') }}
          rightButton={{
            title: '操作',
            tintColor: 'white',
            handler: () => warn('点击了操作'),
          }}
        />
      </DemoBlock>

      <DemoBlock label='导航浅色底（单色/渐变/图片）' pure>
        <NavBar
          immersive
          tintColor='#FFE2CC'
          title={{ title: '标题' }}
          back={{ handler: () => warn('点击了返回按钮') }}
          rightButton={{ title: '操作', handler: () => warn('点击了操作') }}
        />
      </DemoBlock>
    </React.Fragment>
  );
};

export default () => {
  return (
    <Layout title='导航栏' useScrollView={true} qrcode='components/nav/nav-bar'>
      <NavBarDemo />
    </Layout>
  );
};
```

### 返回/图标

```tsx
import { Icon, NavBar } from '@fta/components';
import { DemoBlock, Layout, warn } from '@fta/components/common/display';
import { Text, View } from '@tarojs/components';
import React from 'react';

const NavBarDemo = () => {
  return (
    <React.Fragment>
      <DemoBlock label='返回+文字操作' pure>
        <NavBar
          immersive
          title={{ title: '标题' }}
          back={{ handler: () => warn('点击了返回按钮') }}
          rightButton={{ title: '操作', handler: () => warn('点击了操作') }}
        />
      </DemoBlock>

      <DemoBlock label='返回+图标操作≤2' pure>
        <NavBar
          immersive
          title={{ title: '标题' }}
          back={{ handler: () => warn('点击了返回按钮') }}
          rightButton={
            <View style={{ display: 'flex', flexDirection: 'row' }}>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                onClick={() => warn('点击了福利')}>
                <Icon size={40} value='RedPacketOutlined' />
                <Text className='fta-custom-nav-bar-text'>福利</Text>
              </View>
              <View
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                }}
                className='fta-custom-nav-bar-gap--lg'
                onClick={() => warn('点击了客服')}>
                <Icon size={40} value='CustomerServiceOutlined' />
                <Text className='fta-custom-nav-bar-text'>客服</Text>
              </View>
            </View>
          }
        />
      </DemoBlock>

      <DemoBlock label='返回+图标操作（不带文字）' pure>
        <NavBar
          immersive
          title={{ title: '标题' }}
          back={{ handler: () => warn('点击了返回按钮') }}
          rightButton={
            <View
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              <Icon size={48} value='RedPacketOutlined' onClick={() => warn('点击了红包')} />
              <Icon
                className='fta-custom-nav-bar-gap--md'
                size={48}
                value='CustomerServiceOutlined'
                onClick={() => warn('点击了客服')}
              />
            </View>
          }
        />
      </DemoBlock>

      <DemoBlock label='关闭+图标操作' pure>
        <NavBar
          immersive
          title={{ title: '标题' }}
          back={{ handler: () => warn('点击了返回按钮') }}
          rightButton={
            <View className='fta-custom-nav-bar-icon-group'>
              <Icon size={36} value='CustomerServiceOutlined' />
              <View className='fta-custom-nav-bar-icon-divider' />
              <Icon size={36} value='CloseCircleOutlined' />
            </View>
          }
        />
      </DemoBlock>
    </React.Fragment>
  );
};

export default () => {
  return (
    <Layout title='导航栏' useScrollView={true} qrcode='components/nav/nav-bar'>
      <NavBarDemo />
    </Layout>
  );
};
```

### 透明导航栏

```tsx
import { NavBar } from '@fta/components';
import { warn } from '@fta/components/common/display';
import { Image, View } from '@tarojs/components';
import React from 'react';

const NavBarDemo = () => {
  return (
    <View style={{ height: 600, position: 'relative' }}>
      {/* 图片绝对定位 */}
      <Image
        src='https://imagecdn.ymm56.com/ymmfile/static/resource/653a30e4-e527-4b17-84da-5798c66a2ac7.png'
        mode='aspectFill'
        style={{
          width: '100%',
          height: 260,
          position: 'absolute',
          top: 0,
          left: 0,
        }}
      />
      <NavBar
        safeAreaStyle={{ backgroundColor: 'transparent' }}
        tintColor='transparent'
        immersive
        title={{ title: '标题' }}
        back={{ handler: () => warn('点击了返回按钮') }}
        rightButton={{ title: '操作', handler: () => warn('点击了操作') }}
      />
    </View>
  );
};

export default NavBarDemo;
```

## API

### Props

| 属性名             | 描述           | 类型                                   | 默认值 |
| ------------------ | -------------- | -------------------------------------- | ------ |
| containerClassName | 容器类名       | `string`                               | `--`   |
| containerStyle     | 容器内联样式   | `{}`                                   | `--`   |
| safeAreaClassName  | 安全区类名     | `string`                               | `--`   |
| safeAreaStyle      | 安全区内联样式 | `{}`                                   | `--`   |
| tintColor          | 背景颜色       | `string`                               | `--`   |
| title              | 标题信息       | `ReactElement \| TitleProps \| string` | `--`   |
| tabs               | 选项卡         | `{}`                                   | `--`   |
| leftButton         | 左侧按钮       | `ReactElement \| ButtonProps`          | `--`   |
| rightButton        | 右侧按钮       | `ReactElement \| ButtonProps`          | `--`   |
| statusBar          | 状态栏相关信息 | `unknown`                              | `--`   |
| immersive          | 是否沉浸式     | `boolean`                              | `--`   |
| back               | 返回按钮配置   | `BackButtonProps \| false`             | `--`   |
