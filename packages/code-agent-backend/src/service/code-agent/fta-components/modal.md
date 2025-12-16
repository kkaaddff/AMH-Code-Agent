# Modal 弹窗

弹窗，支持函数式调用。

## 引用
```ts
import { Modal, useModal, withLayer } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import {
  Modal,
  withLayer,
} from '@fta/components'
import {
  DemoBlock,
  Layout,
  List,
  ListItem,
} from '@fta/components/common/display'
import Taro from '@tarojs/taro'
import React from 'react'
import './index.scss'

interface ModalPageState {
  [key: string]: boolean
}

class ModalPage extends React.Component<object, ModalPageState> {
  public constructor(props: any) {
    super(props)
    this.state = {
      isOpened1: true,
      isOpened2: false,
      isOpened3: false,
      isOpened4: false,
      isOpened5: false,
      isOpened13: false,
      isOpened14: false,
    }
  }

  private show = (type: string): void => {
    this.setState({
      [`isOpened${type}`]: true,
    })
  }

  private closeModal = (type: string, msg?: string): void => {
    this.setState({
      [`isOpened${type}`]: false,
    })
    if (msg) Taro.showToast({ icon: 'none', title: msg })
  }

  public render(): JSX.Element {
    const {
      isOpened1,
      isOpened2,
      isOpened3,
      isOpened4,
      isOpened5,
      isOpened13,
      isOpened14,
    } = this.state

    return (
      <>
        <DemoBlock label='基础类' pure>
          <List>
            <ListItem title='基础弹窗' onClick={() => this.show('1')} />
            <ListItem title='双按钮弹窗' onClick={() => this.show('2')} />
            <ListItem title='弹窗超长展示' onClick={() => this.show('3')} />
            <ListItem
              title='纵向使用 多按钮/文案过长'
              onClick={() => this.show('4')}
            />
            <ListItem title='状态反馈弹窗' onClick={() => this.show('5')} />
          </List>
        </DemoBlock>

        <Modal
          modalProps={{
            avoidKeyboard: true,
            adjustableViewport: true,
          }}
          isOpened={isOpened1}
          title='企业满运宝功能已停用'
          content='请先完成企业运费预存，才能发起企业满运宝功能'
          cancelText={false}
          confirmText='我知道了'
          onConfirm={() => this.closeModal('1')}
          onShow={() => {
            console.log('onShow')
          }}
          onHide={() => {
            console.log('onHide')
          }}
        />

        <Modal
          isOpened={isOpened2}
          useNativeModal
          title='对话框标题'
          contentAlign='justify'
          content='描述文案建议控制在三行内，告知当前状态、信息和解决方法等内容的封疆大吏飞机飞机上了粉色的雷锋精神分'
          cancelText='取消'
          cancelType='default'
          confirmText='按钮最多字数'
          onConfirm={() => this.closeModal('2')}
          onCancel={() => this.closeModal('2')}
        />

        <Modal
          light
          useScrollView
          isOpened={isOpened3}
          title='使用协议'
          contentAlign='left'
          content={`一、进行预约通行时，诮确保预约信息完整准确、真实有效。

二、为确保通行预约服务质量，请在驶入高速公路前2小时。
完成预约，平台支持预约2小时后至7天内行程。

三、为他人名下ETC车辆预约需获得相应车辆开户人手机验证码授权。

四、已提交的预约信点如需调整，可撤销后重新提交，避免影响下次行程。五、预约成功后，自预计驶入高速时间起 7个自然日内无查验结果的，系统将自动取消当次预约。

五、遵守中华人民共和国相关法律法规，包括但不限于 《中华人民共和国计算机信息系统安全保护条例》《最高人民法院关于审理涉及计算机网络著作权纠纷案
件适用法律若干问题的解释(法释(200411号)》
《全国人大常委会关于维护互联网安全的决定》
《互联网电子公告服务管理规定》
《互联网新间信息服务管理规定》
《互眹网著作权行政保护办法》和《信息网络传播权保护条例》 等有关计算
机互联风规定和知识产权的法律和法规、实施办法。`}
          cancelText='拒绝'
          confirmText='同意协议'
          onConfirm={() => this.closeModal('3')}
          onCancel={() => this.closeModal('3')}
        />

        <Modal
          vertical
          isOpened={isOpened4}
          title='对话框标题'
          content='描述文案建议控制在三行内，告知当前状态、信息和解决方法等内容'
          confirmText='按钮文案内容较长'
          actionText='操作按钮'
          cancelText='取消'
          onConfirm={() => this.closeModal('4')}
          onAction={() => this.closeModal('4')}
          onCancel={() => this.closeModal('4')}
        />

        <Modal
          isOpened={isOpened5}
          icon={{ value: 'CheckFilled', color: '#1FB080' }}
          title='成功'
          content='提供多种状态反馈样式，可在组件实际使用中进行调用获取'
          confirmText='操作按钮'
          cancelText={false}
          onConfirm={() => this.closeModal('5')}
        />

        <DemoBlock label='反馈弹窗' pure>
          <List>
            <ListItem title='成功状态' onClick={() => this.show('13')} />
            <ListItem title='自定义状态' onClick={() => this.show('14')} />
          </List>
        </DemoBlock>

        <Modal
          closable
          isOpened={isOpened13}
          icon={{ value: 'CheckFilled', color: '#1FB080' }}
          title='对话框标题'
          content='描述文案建议控制在三行内，告知当前状态、信息和解决方法等内容'
          confirmType='primary'
          cancelType='secondary'
          confirmText='按钮'
          cancelText='按钮'
          onClose={() => this.closeModal('13')}
          onCancel={() => this.closeModal('13')}
          onConfirm={() => this.closeModal('13')}
        />

        <Modal
          closable
          isOpened={isOpened14}
          icon={{ value: 'ExclamationFilled', color: '#fd3333' }}
          title='对话框标题'
          content='描述文案建议控制在三行内，告知当前状态、信息和解决方法等内容'
          confirmType='primary'
          cancelType='secondary'
          confirmText='按钮'
          cancelText='按钮'
          onClose={() => this.closeModal('14')}
          onCancel={() => this.closeModal('14')}
          onConfirm={() => this.closeModal('14')}
        />
      </>
    )
  }
}

export default withLayer(
  () => {
    return (
      <Layout title={'弹窗'} qrcode='components/tickling/modal/index'>
        <ModalPage />
      </Layout>
    )
  },
  {
    forwardRef: false,
  }
)
```

### 功能性展示

```tsx
import {
  createLayerAction,
  inNative,
  Modal,
  Overlay,
  Text,
  withLayer,
} from '@fta/components'
import {
  DemoBlock,
  Layout,
  List,
  ListItem,
} from '@fta/components/common/display'
import { Image, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import React, { Fragment } from 'react'
import './index.scss'

const { show, hide } = createLayerAction(Overlay, {
  actionKey: 'show',
  type: 'custom-overlay',
  overrideProps: {
    center: true,
    opacity: 0.3,
  },
  preset: true,
})

const CustomSuffix = ({ style }: { style?: React.CSSProperties }) => (
  <View
    className='demo-modal-suffix demo-modal-suffix--large'
    style={style}
    onClick={() => hide({})}
  >
    <Text level={4} className='demo-modal-suffix__text'>
      自定义区域
    </Text>
  </View>
)

interface ModalPageState {
  [key: string]: boolean
}

class ModalPage extends React.Component<object, ModalPageState> {
  public constructor(props: any) {
    super(props)
    this.state = {
      isOpened6: true,
      isOpened7: false,
      isOpened8: false,
      isOpened9: false,
      isOpened10: false,
      isOpened101: false,
      isOpened11: false,
    }
  }

  private show = (type: string): void => {
    this.setState({
      [`isOpened${type}`]: true,
    })
  }

  private closeModal = (type: string, msg?: string): void => {
    this.setState({
      [`isOpened${type}`]: false,
    })
    if (msg) Taro.showToast({ icon: 'none', title: msg })
  }

  public render(): JSX.Element {
    const {
      isOpened6,
      isOpened7,
      isOpened8,
      isOpened9,
      isOpened10,
      isOpened101,
      isOpened11,
    } = this.state

    return (
      <>
        <DemoBlock label='功能类' pure>
          <List>
            <ListItem title='段落式' onClick={() => this.show('6')} />
            <ListItem title='图片式' onClick={() => this.show('7')} />
            <ListItem title='录入式' onClick={() => this.show('8')} />
          </List>
        </DemoBlock>

        <Modal
          closable
          isOpened={isOpened6}
          title='对话框标题'
          content={
            <Fragment>
              <Text level={5} className='demo-modal-content6-title'>
                段落标题文案，支持换行
              </Text>
              <Text level={5} className='demo-modal-content6-text'>
                段落文案内容段落文案内容段落文案内容段落文案内容段落文案内容
              </Text>
              <Text level={5} className='demo-modal-content6-title title--gap'>
                段落标题文案，支持换行
              </Text>
              <Text level={5} className='demo-modal-content6-text'>
                段落文案内容段落文案内容段落文案内容段落文案内容段落文案内容
              </Text>
            </Fragment>
          }
          confirmText='操作按钮'
          cancelText={false}
          onClose={() => this.closeModal('6')}
          onConfirm={() => this.closeModal('6')}
        />

        <Modal
          closable
          isOpened={isOpened7}
          title='对话框标题'
          content='描述文案内容描述文案内容描述文案内容描述文案内容描述文案内容描述文案内容'
          confirmType='primary'
          cancelType='secondary'
          confirmText='按钮'
          cancelText='按钮'
          onConfirm={() => this.closeModal('7')}
          onCancel={() => this.closeModal('7')}
          onClose={() => this.closeModal('7')}
          prefix={
            <Image
              mode='widthFix'
              src='https://imagecdn.ymm56.com/ymmfile/static/resource/539a97e0-9f5f-4fc5-94c6-23dda7b720c2.png'
              style={{
                width: '100%',
                ...(inNative ? {} : { height: 'auto', display: 'block' }),
                position: 'relative',
                zIndex: -1,
              }}
            />
          }
        />

        <Modal
          closable
          isOpened={isOpened8}
          content='描述文案建议控制在三行内，告知当前状态、信息和解决方法等内容'
          suffix={
            <View className='demo-modal-suffix'>
              <Text level={4} className='demo-modal-suffix__text'>
                自定义录入区域
              </Text>
            </View>
          }
          confirmText='操作按钮'
          onClose={() => this.closeModal('8')}
          onCancel={() => this.closeModal('8')}
          onConfirm={() => this.closeModal('8')}
        />

        <DemoBlock label='延展类' pure>
          <List>
            <ListItem title='单操作按钮' onClick={() => this.show('9')} />
            <ListItem title='双操作按钮' onClick={() => this.show('10')} />
            <ListItem
              title='双操作按钮（纵向）(V1.6.15)'
              onClick={() => this.show('101')}
            />
            <ListItem title='纵向长文案按钮' onClick={() => this.show('11')} />
          </List>
        </DemoBlock>

        <Modal
          closable
          light
          isOpened={isOpened9}
          title='对话框标题'
          content={<CustomSuffix />}
          confirmType='primary'
          confirmText='强按钮'
          cancelText={false}
          onClose={() => this.closeModal('9')}
          onConfirm={() => this.closeModal('9')}
        />

        <Modal
          closable
          isOpened={isOpened10}
          title='对话框标题'
          content={<CustomSuffix />}
          confirmType='primary'
          cancelType='secondary'
          confirmText='强按钮'
          cancelText='弱按钮'
          onClose={() => this.closeModal('10')}
          onCancel={() => this.closeModal('10')}
          onConfirm={() => this.closeModal('10')}
        />

        <Modal
          closable
          vertical
          isOpened={isOpened101}
          title='对话框标题'
          content={<CustomSuffix />}
          confirmType='primary'
          cancelType='secondary'
          confirmText='强按钮'
          cancelText='弱按钮'
          onClose={() => this.closeModal('101')}
          onCancel={() => this.closeModal('101')}
          onConfirm={() => this.closeModal('101')}
        />

        <Modal
          closable
          vertical
          isOpened={isOpened11}
          title='对话框标题'
          content={<CustomSuffix />}
          confirmType='primary'
          cancelType='text'
          confirmText='强按钮'
          cancelText='取消'
          onClose={() => this.closeModal('11')}
          onCancel={() => this.closeModal('11')}
          onConfirm={() => this.closeModal('11')}
        />
      </>
    )
  }
}

export default withLayer(
  () => {
    return (
      <Layout title={'弹窗'} qrcode='components/tickling/modal/index'>
        <ModalPage />
      </Layout>
    )
  },
  {
    forwardRef: false,
  }
)
```

### 扩展演示

```tsx
import {
  ButtonGroup,
  createLayerAction,
  Flex,
  Gradient,
  Modal,
  Overlay,
  scale,
  Text,
  withLayer,
} from '@fta/components'
import {
  DemoBlock,
  Layout,
  List,
  ListItem,
} from '@fta/components/common/display'
import { Image, View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import React from 'react'
import './index.scss'

const { show, hide } = createLayerAction(Overlay, {
  actionKey: 'show',
  type: 'custom-overlay',
  overrideProps: {
    center: true,
    opacity: 0.3,
  },
  preset: true,
})

const CustomSuffix = ({ style }: { style?: React.CSSProperties }) => (
  <View
    className='demo-modal-suffix demo-modal-suffix--large'
    style={style}
    onClick={() => hide({})}
  >
    <Text level={4} className='demo-modal-suffix__text'>
      自定义区域
    </Text>
  </View>
)

interface ModalPageState {
  [key: string]: boolean
}

class ModalPage extends React.Component<object, ModalPageState> {
  public constructor(props: any) {
    super(props)
    this.state = {
      isOpened12: true,
      isOpened15: false,
      isOpened16: false,
      isOpened17: false,
    }
  }

  private show = (type: string): void => {
    this.setState({
      [`isOpened${type}`]: true,
    })
  }

  private closeModal = (type: string, msg?: string): void => {
    this.setState({
      [`isOpened${type}`]: false,
    })
    if (msg) Taro.showToast({ icon: 'none', title: msg })
  }

  public render(): JSX.Element {
    const {
      isOpened12,
      isOpened15,
      isOpened16,
      isOpened17,
    } = this.state

    return (
      <>
        <DemoBlock label='扩展类(V1.2.0)' pure>
          <List>
            <ListItem title='顶部内容溢出' onClick={() => this.show('12')} />
            <ListItem title='自定义顶部内容' onClick={() => this.show('17')} />
            <ListItem title='自定义底部按钮' onClick={() => this.show('15')} />
            <ListItem
              title='自定义底部垂直按钮'
              onClick={() => this.show('16')}
            />
          </List>
        </DemoBlock>

        <Modal
          overflow
          isOpened={isOpened15}
          title='对话框标题'
          content='描述文案内容描述文案内容描述文案内容描述文案内容描述文案内容描述文案内容'
          footer={
            <ButtonGroup
              style={{ backgroundColor: 'transparent' }}
              list={[
                {
                  text: '我再想想',
                  type: 'secondary',
                  width: scale(200),
                  onClick: () => this.closeModal('15'),
                },
                {
                  type: 'primary',
                  text: '确认发冷运优车',
                  flex: 1,
                  onClick: () => this.closeModal('15'),
                },
              ]}
            />
          }
          prefix={
            <Flex.Center className='demo-modal-custom-1'>
              <Image
                className='demo-modal-custom-1__image'
                src='https://imagecdn.ymm56.com/ymmfile/static/resource/d28004ec-a4b8-41d0-a861-e93a1003a2c0.png'
              ></Image>
            </Flex.Center>
          }
          background={
            <Gradient
              direction='toBottom'
              startColor='#FFF0E6ff'
              endColor='#FFF0E600'
              style={{
                borderTopLeftRadius: scale(16),
                borderTopRightRadius: scale(16),
                height: scale(100),
                width: '100%',
                top: 0,
                position: 'absolute',
                zIndex: -1,
              }}
            />
          }
        />

        <Modal
          overflow
          isOpened={isOpened17}
          title='对话框标题'
          content='描述文案内容描述文案内容描述文案内容描述文案内容描述文案内容描述文案内容'
          confirmType='primary'
          cancelType='secondary'
          confirmText='确定'
          cancelText='取消'
          onConfirm={() => this.closeModal('17')}
          onCancel={() => this.closeModal('17')}
          prefix={
            <Flex.Center style={{ paddingBottom: scale(16) }}>
              <Flex.Center style={{ position: 'relative' }}>
                <Image
                  style={{ width: scale(200), height: scale(60) }}
                  src='https://imagecdn.ymm56.com/ymmfile/static/resource/6c56cb2c-4e4d-4af5-94f2-a22fa303e972.png'
                />
                <Flex.Center
                  style={{ position: 'absolute', top: 0, height: '100%' }}
                >
                  <Text size={26} color='#fd3333'>
                    顶部标签
                  </Text>
                </Flex.Center>
              </Flex.Center>
            </Flex.Center>
          }
          background={
            <Gradient
              direction='toTop'
              startColor='#fff0e600'
              endColor='#FFF0E6ff'
              style={{
                borderTopLeftRadius: scale(16),
                borderTopRightRadius: scale(16),
                height: scale(160),
                width: '100%',
                top: 0,
                position: 'absolute',
                zIndex: -1,
              }}
            />
          }
        />

        <Modal
          overflow
          isOpened={isOpened16}
          title='对话框标题'
          content='描述文案内容描述文案内容描述文案内容描述文案内容描述文案内容描述文案内容'
          footer={
            <ButtonGroup
              vertical
              style={{ backgroundColor: 'transparent' }}
              list={[
                {
                  text: '我再想想',
                  desc: '客服小王正在为您调车中...',
                  onClick: () => this.closeModal('16'),
                },
                {
                  type: 'default',
                  text: '转电议',
                  desc: '自己和司机沟通',
                  onClick: () => this.closeModal('16'),
                },
                {
                  type: 'default',
                  text: '确认删除',
                  onClick: () => this.closeModal('16'),
                },
              ]}
            />
          }
          prefix={
            <Flex.Center className='demo-modal-custom-1'>
              <Image
                className='demo-modal-custom-1__image'
                src='https://imagecdn.ymm56.com/ymmfile/static/resource/d28004ec-a4b8-41d0-a861-e93a1003a2c0.png'
              ></Image>
            </Flex.Center>
          }
          background={
            <Gradient
              direction='toBottom'
              startColor='#FFF0E6ff'
              endColor='#FFF0E600'
              style={{
                borderTopLeftRadius: scale(16),
                borderTopRightRadius: scale(16),
                height: scale(100),
                width: '100%',
                top: 0,
                position: 'absolute',
                zIndex: -1,
              }}
            />
          }
        />

        <Modal
          overflow
          isOpened={isOpened12}
          title='对话框标题'
          content='描述文案内容描述文案内容描述文案内容描述文案内容描述文案内容描述文案内容'
          confirmType='primary'
          cancelType='secondary'
          confirmText='按钮'
          cancelText='按钮'
          onConfirm={() => this.closeModal('12')}
          onCancel={() => this.closeModal('12')}
          prefix={
            <Flex.Center className='demo-modal-custom-1'>
              <Image
                className='demo-modal-custom-1__image'
                src='https://imagecdn.ymm56.com/ymmfile/static/resource/d28004ec-a4b8-41d0-a861-e93a1003a2c0.png'
              ></Image>
            </Flex.Center>
          }
          background={
            <Gradient
              direction='toBottom'
              startColor='#FFF0E6ff'
              endColor='#FFF0E600'
              style={{
                borderTopLeftRadius: scale(16),
                borderTopRightRadius: scale(16),
                height: scale(100),
                width: '100%',
                top: 0,
                position: 'absolute',
                zIndex: -1,
              }}
            />
          }
        />

        <DemoBlock label='API调用(V1.0.17)' pure>
          <List>
            <ListItem
              title='基础弹窗'
              onClick={() => {
                const LayerContext = {
                  key: 'modal_1',
                  id: 'modal_page',
                }
                const hide = () => Modal.hide(LayerContext)
                Modal.show({
                  ...LayerContext,
                  closable: true,
                  useNativeModal: true,
                  closeOnClickOverlay: true,
                  vertical: true,
                  title: '这瓜保熟吗？',
                  confirmText: '保熟',
                  confirmType: 'primary',
                  cancelText: '是生瓜蛋子',
                  onCancel: () => {
                    Taro.showToast({
                      icon: 'none',
                      title: '你故意找茬是不是？',
                    })
                    hide()
                  },
                  onConfirm: () => {
                    Taro.showToast({
                      icon: 'none',
                      title: '我开水果店能卖你生瓜蛋子？',
                    })
                    hide()
                  },
                  onClose: hide,
                })
              }}
            />
            <ListItem
              title='自定义弹层调用'
              onClick={() => {
                const ctx = { id: 'modal_page', key: 'native_modal_1' }
                show({
                  ...ctx,
                  onClick: () => {
                    Taro.showToast({ title: '点击背景蒙层关闭', icon: 'none' })
                    hide(ctx)
                  },
                  children: (
                    <CustomSuffix
                      style={{ alignSelf: 'center', width: '80%' }}
                    />
                  ),
                })
              }}
            />
          </List>
        </DemoBlock>
      </>
    )
  }
}

export default withLayer(
  () => {
    return (
      <Layout title={'弹窗'} qrcode='components/tickling/modal/index'>
        <ModalPage />
      </Layout>
    )
  },
  {
    forwardRef: false,
  }
)
```

### 动态调用

```tsx
import {
  ActionSheet,
  Flex,
  Layout,
  ListItem,
  Modal,
  scale,
  useLayer,
  withLayer,
} from '@fta/components'
import { View } from '@tarojs/components'
import React from 'react'

function LayerActionDemo() {
  const layer = useLayer()
  const modalCtx = {
    id: layer.id!,
    key: 'modal-1',
  }
  const sheetCtx = {
    id: layer.id!,
    key: 'sheet-1',
  }

  const hideModal = () => Modal.hide(modalCtx)
  const showModal = () => {
    Modal.show({
      ...modalCtx,
      title: '标题',
      content: '内容',
      confirmText: '确定',
      onConfirm() {
        hideModal()
      },
    })
  }

  const hideActionSheet = () => {
    console.log('关闭')
    ActionSheet.hide(sheetCtx)
  }

  const showActionSheet = () => {
    ActionSheet.show({
      ...sheetCtx,
      clickOverlayOnClose: true,
      title: { icon: true, title: '标题', onCancel: hideActionSheet },
      children: <View style={{ height: scale(300) }} />,
      onClose() {
        hideActionSheet()
      },
      onConfirm() {
        hideActionSheet()
      },
    })
  }

  return (
    <Layout title={{ title: '动态调用' }}>
      <Flex style={{ width: '100%', alignItems: 'stretch' }}>
        <ListItem title='Modal.show' arrow onClick={showModal} />
        <ListItem title='ActionSheet.show' arrow onClick={showActionSheet} />
      </Flex>
    </Layout>
  )
}

export default withLayer(LayerActionDemo, {
  forwardRef: false,
})
```

## Hooks 调用

```tsx
import { useModal, withLayer } from '@fta/components'
import { Button } from '@tarojs/components'

export default withLayer(() => {
  const [show, hide] = useModal()

  const showConfirm = () =>
    show({
      title: '函数式调用',
    })

  return <Button onClick={showConfirm}>打开弹窗</Button>
})
```

## API 调用(V1.0.17+)

`Modal.show(option)` & `Modal.hide(option)` 参见“动态调用”示例。

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| title | 元素的标题 | `string \| ReactElement` | `--` | |
| isOpened | 是否显示弹窗 | `boolean` | `(必选)` | |
| closable | 是否显示关闭按钮，传入 string 替换图片 URL | `boolean \| string` | `--` | |
| content | 元素的内容 | `ReactNode` | `--` | |
| contentAlign | 内容对齐方式 | `"left" \| "center" \| "right" \| ...` | `"center"` | |
| contentClassName | 内容类名 | `string` | `--` | 1.0.3-alpha.13 |
| contentStyle | 内容样式 | `{}` | `--` | 1.0.3-alpha.13 |
| actionStyle | 底部操作按钮区域的样式 | `{}` | `--` | 1.6.0 |
| closeOnClickOverlay | 点击浮层时是否自动关闭 | `boolean` | `false` | |
| cancelText | 取消按钮的文本 | `string \| ReactElement \| false` | `--` | |
| confirmText | 确认按钮的文本 | `string \| ReactElement \| false` | `--` | |
| actionText | (vertical=true 时生效) 位于确定和取消按钮中间的按钮文本 | `string \| ReactElement \| false` | `--` | 1.0.10 |
| cancelType | 取消按钮类型 | `"primary" \| "secondary" \| "default" \| ...` | `"text"` | 1.0.8 |
| confirmType | 确认按钮类型 | `"primary" \| "secondary" \| "default" \| ...` | `"text"` | 1.0.8 |
| actionType | 中间态按钮类型 | `"primary" \| "secondary" \| "default" \| ...` | `"text"` | 1.0.10 |
| containerClassName | 弹窗类名 | `string` | `--` | |
| containerStyle | 弹窗内联样式 | `{}` | `--` | |
| overlayClassName | 蒙层类名 | `string` | `--` | |
| overlayStyle | 蒙层内联样式 | `{}` | `--` | |
| useNativeModal | 是否使用原生 Modal 组件 | `boolean` | `true` | |
| nativeModalProps | 透传原生 Modal 组件的 props | `{ onShow?: () => void; transparent?: boolean; ... }` | `--` | 1.0.8 |
| direction | 国际化适配 | `"rtl" \| "ltr"` | `--` | 1.10.10 |
| useScrollView | 内容区域是否使用 ScrollView 容器包裹 | `boolean` | `true` | 1.0.8 |
| vertical | 底部按钮是否纵向排列 | `boolean` | `--` | 1.0.10 |
| prefix | 自定义头部区域，在标题上方 | `ReactNode` | `--` | 1.0.10 |
| suffix | 自定义内容底部区域，在内容下方/按钮上方 | `ReactNode` | `--` | 1.0.10 |
| footer | 自定义按钮底部区域，在按钮下方 | `ReactNode` | `--` | 1.0.15 |
| contentProps | 内容区根节点（默认为 ScrollView）的 props | `{}` | `--` | |
| light | 内容文本是否浅色 | `boolean` | `false` | 1.0.17 |
| overflow | 是否支持溢出显示 | `boolean` | `false` | 1.2.0 |
| background | 背景节点 | `ReactNode` | `--` | 1.2.0 |
| preventMove | 是否禁止默认的滑动事件（小程序不生效） | `boolean` | `true` | 1.2.4 |
| catchMove | [小程序] 是否在 View 节点增加 catchMove 属性 | `boolean` | `--` | 1.11.3 |
| wrapper | 组件内部根元素 | `unknown` | `"React.Fragment"` | 1.2.4 |
| sibling | Thresh 端 Modal 组件的前后缀节点 | `{ prev?: ReactNode; next?: ReactNode }` | `--` | 1.6.2 |
| portal | [H5] 是否挂载到根节点 | `boolean \| HTMLElement` | `false` | 1.7.14 |
| theme | 主题色 | `string \| unknown[]` | `--` | |
| icon | 标题上方的 icon，默认不展示 | `false \| ReactElement \| unknown` | `--` | 1.0.10 |
| children | 子元素 | `any` | `--` | |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onClose | 触发关闭时的事件 | `(event: any) => void` | `--` | |
| onCancel | 点击取消按钮触发的事件 | `(event: any) => void` | `--` | |
| onConfirm | 点击确认按钮触发的事件 | `(event: any) => void` | `--` | |
| onAction | 点击中间按钮触发的事件 | `(event: any) => void` | `--` | 1.0.10 |
| onShow | Modal 显示回调 | `() => any` | `--` | 1.2.0 |
| onHide | Modal 隐藏回调 | `() => any` | `--` | 1.2.0 |

### SCSS

```scss
$fta-modal-width: 590px;

$fta-modal-header-top-padding: $spacing-v-max;
$fta-modal-header-horizon-padding: $spacing-h-max;
$fta-modal-content-horizon-padding: $spacing-h-max;
$fta-modal-content-top-padding: $spacing-v-lg;
$fta-modal-content-bottom-padding: $spacing-v-max;

$fta-modal-header-text-color: $color-text-base;
$fta-modal-content-text-color: $color-text-base;
$fta-modal-btn-default-color: $color-text-base;
$fta-modal-btn-confirm-color: $color-brand;
$fta-modal-bg-color: $color-white;
$fta-modal-line-color: #e8e8e8;
$fta-modal-footer-height: 100px;
```