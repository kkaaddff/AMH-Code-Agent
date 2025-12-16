# Swiper 滑动视图容器

滑块视图容器，常用于走马灯、轮播图。

## 引用

```ts
import { Swiper, SwiperItem } from '@fta/components'

// @fta/components 和 @tarojs/components 都可以导出，是同一个实现
import { Swiper, SwiperItem } from '@tarojs/components'
```

## 注意

在 FTA Thresh 中使用 Swiper 时，请增加 `useTransformPageView`，以获得更好的性能和体验：

```tsx
export default () => (
  <Swiper useTransformPageView={true}>
    <SwiperItem></SwiperItem>
  </Swiper>
)
```

## 示例

### 基本演示

```tsx
import { ListItem, scale, Toggle } from '@fta/components'
import { DemoBlock, Layout, List } from '@fta/components/common/display'
import { SwiperProps } from '@fta/components/types/swiper'
import { useMBBridge } from '@fta/uni-bridge'
import { Image, Swiper, SwiperItem, View } from '@tarojs/components'
import React from 'react'

const commonItemStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexDirection: 'column',
}

const SwiperExample = () => {
  const [current, setCurrent] = React.useState(0)
  const MBBridge = useMBBridge()
  const [config, setConfig] = React.useState<SwiperProps>({
    circular: true,
    autoplay: true,
    indicatorDots: true,
  })

  return (
    <>
      <DemoBlock label="基础使用">
        <View
          style={{
            width: '100%',
            height: 120,
            backgroundColor: 'red',
          }}
        >
          <Swiper
            style={{
              height: 120,
            }}
            useTransformPageView
            indicatorColor="rgba(253, 51, 51, 0.5)"
            indicatorActiveColor="rgb(253, 51, 51)"
            previousMargin="50px"
            nextMargin="50px"
            onAnimationFinish={(event) => {
              console.log('onAnimationFinish called', event)
            }}
            onChange={(e) => {
              setCurrent(e.detail.current)
              console.log('current: ' + e.detail.current)
            }}
            {...config}
          >
            <SwiperItem style={{ flex: 1 }}>
              <View
                onClick={() =>
                  MBBridge.base.openSchema({
                    url: 'ymm://view/web?url=https://www.baidu.com',
                  })
                }
                className="demo-text-1"
                style={{
                  ...commonItemStyle,
                  backgroundColor: 'red',
                  opacity: current === 0 ? 1 : 0.5,
                }}
              >
                <Image
                  src="https://imagecdn.ymm56.com/ymmfile/static/resource/d566f95c-24a3-4975-bf0a-22917f46df8d.png"
                  mode="aspectFill"
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            </SwiperItem>
            <SwiperItem>
              <View
                className="demo-text-2"
                style={{
                  ...commonItemStyle,
                  backgroundColor: 'green',
                  opacity: current === 1 ? 1 : 0.5,
                }}
              >
                <Image
                  src="https://imagecdn.ymm56.com/ymmfile/static/resource/dc1398b1-156c-481a-b1ae-c0c94f0cb530.png"
                  mode="aspectFill"
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            </SwiperItem>
            <SwiperItem>
              <View
                className="demo-text-3"
                onClick={() =>
                  MBBridge.base.openSchema({
                    url: 'ymm://view/web?url=https://www.baidu.com',
                  })
                }
                style={{
                  ...commonItemStyle,
                  backgroundColor: 'blue',
                  opacity: current === 2 ? 1 : 0.5,
                }}
              >
                <Image
                  src="https://imagecdn.ymm56.com/ymmfile/static/resource/b6623dec-559b-4c15-96f9-4346aeb9e213.png"
                  mode="aspectFill"
                  style={{ width: '100%', height: '100%' }}
                />
              </View>
            </SwiperItem>
          </Swiper>
        </View>
      </DemoBlock>

      <DemoBlock
        label="属性配置"
        flexDirection="column"
        alignItems="stretch"
        bgColor="transparent"
      >
        <List
          hoverless
          style={{ margin: 0 }}
          itemStyle={{ paddingTop: scale(21), paddingBottom: scale(21) }}
        >
          <ListItem
            title="自动播放"
            arrow={
              <Toggle
                active
                controls={false}
                onChange={(active) => {
                  setConfig((c) => ({ ...c, autoplay: active }))
                }}
              />
            }
          />
          <ListItem
            title="循环播放"
            arrow={
              <Toggle
                active
                controls={false}
                onChange={(active) => {
                  setConfig((c) => ({ ...c, circular: active }))
                }}
              />
            }
          />
          <ListItem
            title="指示器"
            arrow={
              <Toggle
                active
                controls={false}
                onChange={(active) => {
                  setConfig((c) => ({ ...c, indicatorDots: active }))
                }}
              />
            }
          />
        </List>
      </DemoBlock>
    </>
  )
}

export default () => (
  <Layout title="滑动视图容器" qrcode="components/display/swiper/index">
    <SwiperExample />
  </Layout>
)
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| indicatorDots | 是否显示面板指示点 | `boolean` | `false` | - |
| indicatorColor | 指示点颜色 | `string` | `"rgba(0, 0, 0, .3)"` | - |
| indicatorActiveColor | 当前选中的指示点颜色 | `string` | `"#000000"` | - |
| autoplay | 是否自动切换 | `boolean` | `false` | - |
| current | 当前所在滑块的 index | `number` | `0` | - |
| currentItemId | 当前所在滑块的 item-id，不能与 current 同时指定 | `string` | `""` | - |
| interval | 自动切换时间间隔 | `number` | `5000` | - |
| duration | 滑动动画时长 | `number` | `500` | - |
| circular | 是否采用衔接滑动 | `boolean` | `false` | - |
| vertical | 滑动方向是否为纵向 | `boolean` | `false` | - |
| previousMargin | 前边距，可用于露出前一项的一小部分，接受 px 和 rpx 值 | `string` | `"0px"` | - |
| nextMargin | 后边距，可用于露出后一项的一小部分，接受 px 和 rpx 值 | `string` | `"0px"` | - |
| snapToEdge | 当 swiper-item 个数 ≥ 2，关闭 circular 且开启 previous-margin 或 next-margin 时，是否将边距应用到首尾元素 | `boolean` | `false` | - |
| displayMultipleItems | 同时显示的滑块数量 | `number` | `1` | - |
| skipHiddenItemLayout | 是否跳过未显示的滑块布局，设为 true 可优化复杂情况下的滑动性能，但会丢失隐藏状态滑块的布局信息 | `boolean` | `false` | - |
| easingFunction | 指定 swiper 切换缓动动画类型 | `"default" \| "linear" \| "easeIn..."` | `"default"` | - |
| disableTouch | 是否禁止用户 touch 操作 | `boolean` | `false` | - |
| activeClass | swiper-item 可见时的 class | `string` | `--` | - |
| changingClass | acceleration 为 true 且滑动过程中，中间若干屏可见时的 class | `string` | `--` | - |
| acceleration | 开启时会根据滑动速度连续滑动多屏 | `string` | `false` | - |
| disableProgrammaticAnimation | 是否禁用代码变动触发 swiper 切换时的动画 | `string` | `false` | - |
| swipeRatio | 滑动距离阈值，超过阈值时切换 swiper-item | `string` | `--` | - |
| swipeSpeed | 滑动综合速度阈值，超过阈值时切换，数值越小越敏感 | `string` | `--` | - |
| touchAngle | 计算手势依赖的滑动角度，数值越小对方向准确度要求越高 | `string` | `--` | - |
| adjustHeight | 自动以指定滑块的高度为容器高度。当 vertical 为 true 时默认不调整。可选值：`"current" \| "none" \| "first" \| ...` | `string` | `--` | - |
| adjustVerticalHeight | vertical 为 true 时强制使 adjust-height 生效 | `string` | `--` | - |
| disableTouchmove | 是否停止响应用户 touchmove 操作 | `string` | `false` | - |
| id | 组件唯一标识，保持页面唯一 | `string` | `--` | - |
| children | 子节点 | `ReactNode` | `--` | - |
| key | 列表项唯一标识符 | `string \| number` | `--` | - |
| hidden | 组件是否显示 | `boolean` | `--` | - |
| animation | 动画属性 | `any` | `--` | - |
| ref | 引用 | `null \| string \| ...` | `--` | - |
| dangerouslySetInnerHTML | 渲染 HTML | `{ __html: string }` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onChange | current 改变时触发 | `(event: any) => void` | `--` | - |
| onTransition | swiper-item 位置改变时触发 | `(event: any) => void` | `--` | - |
| onAnimationFinish | 动画结束时触发 | `(event: any) => void` | `--` | - |
| onAnimationEnd | 动画结束时触发 | `(event: any) => void` | `--` | - |
| onTouchStart | 手指触摸动作开始 | `(event: TouchEvent) => void` | `--` | - |
| onTouchMove | 手指触摸后移动 | `(event: TouchEvent) => void` | `--` | - |
| onTouchCancel | 手指触摸动作被打断（如来电、弹窗） | `(event: TouchEvent) => void` | `--` | - |
| onTouchEnd | 手指触摸动作结束 | `(event: TouchEvent) => void` | `--` | - |
| onClick | 手指触摸后马上离开 | `(event: any) => void` | `--` | - |
| onLongPress | 手指触摸超过 350ms 后离开，会阻止 tap 事件 | `(event: any) => void` | `--` | - |
| onLongClick | 手指触摸超过 350ms 后离开（推荐使用 longpress） | `(event: any) => void` | `--` | - |
| onTransitionEnd | WXSS transition 或 Taro.createAnimation 动画结束后触发 | `(event: any) => void` | `--` | - |
| onAnimationStart | WXSS animation 开始时触发 | `(event: any) => void` | `--` | - |
| onAnimationIteration | WXSS animation 一次迭代结束时触发 | `(event: any) => void` | `--` | - |
| onTouchForceChange | 在支持 3D Touch 的设备上重按时触发 | `(event: any) => void` | `--` | - |