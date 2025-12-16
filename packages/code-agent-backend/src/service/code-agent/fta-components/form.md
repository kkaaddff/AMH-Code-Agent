```markdown
# Form 表单

表单组件，表单状态当前需自行维护。

FormItem 组件默认以 Form.ItemView 组件作为表现层进行渲染。

## 引用
```tsx
import { Form, FormItem, FormItemBordered } from '@fta/components'
```

## 示例

### 基础演示

```tsx
import { Button, Flex, Form, FormItem, Picker, Text } from '@fta/components'
import { DemoBlock, Layout } from '@fta/components/common/display'
import React, { Fragment, useCallback, useRef, useState } from 'react'
import { pickerRange } from './helper'
import './index.scss'

function usePartialState<S>(initialState: S) {
  const [state, updateState] = useState(initialState)
  const setState = useCallback((newPartialState: Partial<S>) => {
    updateState((prevState) => ({ ...prevState, ...newPartialState }))
  }, [])
  return [state, setState] as const
}

const FormDemo = () => {
  const formRef = useRef<any>()
  const pickerRef = useRef<any>(null)
  const captchaRef = useRef<any>()
  const inputRef = useRef<any>()
  const [formStateBasic, setFormStateBasic] = usePartialState({
    email: '',
    val1: '',
    val2: '正在输入',
    val3: pickerRange[2],
    val4: '',
  })

  return (
    <Fragment>
      <DemoBlock label='基础表单' pure style={{ flex: 1, overflow: 'hidden' }}>
        <Form
          ref={formRef}
          align='between'
          highlight={true}
          onError={(ctx) => {
            console.log('报错信息', ctx)
          }}
        >
          <FormItem
            required
            _nativeRef={inputRef}
            label='邮箱'
            prop='email'
            placeholder='请输入邮箱'
            value={formStateBasic.email}
            onChange={(val) => setFormStateBasic({ email: val })}
            inputProps={{
              onFocus: () => {
                // inputRef.current.setCursor(formStateBasic.email.length, formStateBasic.email.length)
              },
            }}
            rules={[
              {
                validator: (rule, value, callback) => {
                  if (!value) {
                    callback('邮箱不能为空')
                  } else if (
                    /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value)
                  ) {
                    callback()
                  } else {
                    callback('请输入正确的邮箱格式')
                  }
                },
                trigger: 'blur',
              },
            ]}
          />
          <FormItem
            required
            label='标题名称'
            prop='val1'
            placeholder='请输入'
            value={formStateBasic.val1}
            onChange={(val) => setFormStateBasic({ val1: val })}
            rules={[
              {
                validator: (rule, value, callback) => {
                  if (value) {
                    callback()
                  } else {
                    callback('请补全内容信息')
                  }
                },
                trigger: ['blur', 'change'],
              },
            ]}
          />
          <FormItem
            label='标题名称'
            prop='val2'
            placeholder='请输入'
            value={formStateBasic.val2}
            onChange={(val) => setFormStateBasic({ val2: val })}
          />
          <FormItem
            label='标题名称'
            prop='val3'
            placeholder='请选择'
            value={formStateBasic.val3}
            onClick={() => {
              pickerRef.current.show()
            }}
            arrow={true}
            rules={[
              {
                validator: (rule, value: string, callback) => {
                  if (value.startsWith('货车帮')) {
                    callback()
                  } else {
                    callback('请选择货车帮相关平台')
                  }
                },
              },
            ]}
          />
          <Picker
            ref={pickerRef}
            mode='selector'
            title='请选择'
            value={2}
            onConfirm={(activeIndex: number) =>
              setFormStateBasic({ val3: pickerRange[activeIndex] })
            }
            range={pickerRange}
          />
          <FormItem
            label='标题名称'
            prop='val4'
            placeholder='请输入'
            arrow='arrow'
            value={formStateBasic.val4}
            onChange={(val) => setFormStateBasic({ val4: val })}
            rules={[
              {
                required: true,
                message: '内容不能为空！',
              },
            ]}
          />
          <FormItem
            label='标题名称'
            placeholder='带后缀节点'
            suffix={
              <Form.Captcha
                onClick={() => {
                  console.log('开始计时')
                }}
                onCount={(dura: number) => {
                  console.log('dura', dura)
                }}
                ref={captchaRef}
              />
            }
          />
          <FormItem label='标题名称' placeholder='右对齐' align='right' />
          <FormItem
            label='标题名称'
            placeholder='右对齐'
            align='right'
            arrow={true}
          />
          <FormItem
            label='标题名称'
            placeholder='右对齐'
            align='right'
            arrow={'arrow'}
          />
          <FormItem
            rules={[
              {
                validator: (rule, value, callback) =>
                  callback(
                    '这是多行报错信息这是多行报错信息这是多行报错信息'
                  ),
              },
            ]}
          >
            {(props) => {
              return (
                <Form.ItemView
                  {...props}
                  label='标题名称'
                  align='right'
                  arrow
                  placeholder='自定义渲染'
                />
              )
            }}
          </FormItem>
          <FormItem
            vertical
            required
            label='纵向排列'
            prop='email-1'
            placeholder='请输入邮箱'
            value={formStateBasic.email}
            onChange={(val) => setFormStateBasic({ email: val })}
            rules={[
              {
                validator: (rule, value, callback) => {
                  if (!value) {
                    callback('邮箱不能为空')
                  } else if (
                    /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value)
                  ) {
                    callback()
                  } else {
                    callback('请输入正确的邮箱格式')
                  }
                },
                trigger: 'blur',
              },
            ]}
          />
          <FormItem
            vertical
            required
            label='纵向排列'
            prop='email-2'
            placeholder='请输入邮箱'
            value={formStateBasic.email}
            onChange={(val) => setFormStateBasic({ email: val })}
            rules={[
              {
                validator: (rule, value, callback) => {
                  if (!value) {
                    callback('邮箱不能为空')
                  } else if (
                    /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value)
                  ) {
                    callback()
                  } else {
                    callback('请输入正确的邮箱格式')
                  }
                },
                trigger: 'blur',
              },
            ]}
          />
          <FormItem
            vertical
            required
            label={null}
            prop='email-3'
            placeholder='请输入邮箱（无标题）'
            value={formStateBasic.email}
            onChange={(val) => setFormStateBasic({ email: val })}
            rules={[
              {
                validator: (rule, value, callback) => {
                  if (!value) {
                    callback('邮箱不能为空')
                  } else if (
                    /^\w+([-+.]\w+)*@\w+([-.]\w+)*\.\w+([-.]\w+)*$/.test(value)
                  ) {
                    callback()
                  } else {
                    callback('请输入正确的邮箱格式')
                  }
                },
                trigger: 'blur',
              },
            ]}
          />
          <FormItem
            value={formStateBasic.val1}
            rules={[
              {
                validator: (rule, value, callback) => callback('始终报错'),
                trigger: 'change',
              },
            ]}
          >
            {(props) => {
              return (
                <Flex.Row justifyContent='space-around'>
                  <Text level={5}>标题名称</Text>
                  <Text level={4} color={props.error ? '#ff0000' : '#1a1a1a'}>
                    {props.error
                      ? '完全自定义渲染：' + props.errorTip
                      : '完全自定义渲染'}
                  </Text>
                </Flex.Row>
              )
            }}
          </FormItem>
          <Flex.Center direction='row'>
            <Button
              onClick={async () => {
                const res = await formRef.current.validate()
                console.log(res)
              }}
            >
              校验表单
            </Button>
            <Button
              type='secondary'
              onClick={() => {
                formRef.current.clearValidate()
              }}
            >
              清除校验
            </Button>
          </Flex.Center>
        </Form>
      </DemoBlock>
    </Fragment>
  )
}

export default () => (
  <Layout useScrollView={false} title='表单' qrcode='components/form/form/index'>
    <FormDemo />
  </Layout>
)
```

### 下边框线样式

```tsx
import {
  Button,
  Flex,
  Form,
  FormItem,
  FormItemBordered,
  Text,
} from '@fta/components'
import { DemoBlock, Layout, warn } from '@fta/components/common/display'
import { View } from '@tarojs/components'
import Taro from '@tarojs/taro'
import React, { Fragment, useRef, useState } from 'react'

export const FormItemBorderedDemo = () => {
  const [state, setState] = useState('123456789')
  const formRef = useRef<any>()

  return (
    <Fragment>
      <DemoBlock
        pure
        label='带下边框线'
        bgColor='white'
        flexDirection='row'
        style={{ flex: 1, overflow: 'hidden' }}
      >
        <Form
          ref={formRef}
          appearance={FormItemBordered}
          contentTextStyle={{
            fontWeight: 'bold',
          }}
        >
          <FormItem
            required
            prop='engine'
            onLabelClick={() => {
              warn('label click')
            }}
            tooltip='https://imagecdn.ymm56.com/ymmfile/static/image/userCenter/rectangle.png'
            borderHighlight={false}
            label='发动机'
            placeholder='请输入发动机号'
            clearable
            value={state}
            rules={[
              {
                validator(_rule, _value, callback) {
                  callback('发动机号输错了兄dei')
                },
              },
            ]}
            onChange={(v) => {
              console.log('值改变了', v)
              setState(v)
            }}
            onClick={() => {
              console.log('点击了内容区域')
              Taro.showToast({ title: '点击了内容区域' })
            }}
            onClear={(evt) => {
              evt.stopPropagation?.()
              setState('')
            }}
          />
          <FormItem
            label='车牌号'
            placeholder='请选择车牌号'
            value={'苏A·2B98G'}
            suffix={
              <View
                onClick={(evt) => {
                  evt.stopPropagation?.()
                  console.log('点击上传')
                }}
              >
                <Text>点击上传</Text>
              </View>
            }
            onClick={() => Taro.showToast({ title: '请选择车牌号' })}
          />
          <FormItem
            label='车架号'
            type='number'
            placeholder='请选择车架号'
            onChange={(val) => console.log('val', val)}
            inputProps={{ maxlength: 200 }}
            textarea
          />
          <FormItem
            label='带箭头输入'
            type='number'
            value='12345'
            placeholder='点我试试'
            arrow='arrow'
          />
          <FormItem
            border={false}
            arrow={true}
            label='带箭头文本'
            placeholder='点我试试'
            onClick={() => {
              warn('适用于Picker场景')
            }}
          />
          <FormItem
            label='模拟密码'
            type='number'
            inputProps={{
              password: true,
              pointerEvents: 'none',
            }}
            onClick={() => {
              warn('输入框不可聚焦')
            }}
            arrow='arrow'
            value='12345'
          />
          <Flex.Center direction='row'>
            <Button
              onClick={async () => {
                const res = await formRef.current.validate()
                console.log(res)
              }}
            >
              校验表单
            </Button>
            <Button
              type='secondary'
              onClick={() => {
                formRef.current.clearValidate()
              }}
            >
              清除校验
            </Button>
          </Flex.Center>
        </Form>
      </DemoBlock>
    </Fragment>
  )
}

export default () => {
  return (
    <Layout
      title='表单'
      qrcode='components/pro/form/index'
      useScrollView={false}
    >
      <FormItemBorderedDemo />
    </Layout>
  )
}
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| title | 表单标题 | `ReactNode` | `--` | - |
| titleAlign | 标题对齐方式 | `"left" \| "center" \| "right" \| ...` | `"left"` | - |
| model | 表单绑定的数据流 | `{}` | `--` | - |
| scrollIntoView | 校验出错时是否滚动到可视范围内 | `boolean` | `false` | - |
| readonly | 是否只读 | `boolean` | `false` | - |
| highlight | 是否显示错误信息 | `boolean` | `true` | 1.0.8 |
| align | 右侧内容区域对齐方式 | `"left" \| "center" \| "right" \| ...` | `true` | - |
| rules | 校验规则 | `{}` | `--` | - |
| labelClassName | 标签 className | `string` | `--` | - |
| labelStyle | 标签内联样式 | `{}` | `--` | - |
| labelTextClassName | 标签文本 className | `string` | `--` | - |
| labelTextStyle | 标签文本内联样式 | `{}` | `--` | - |
| contentClassName | 内容区 className | `string` | `--` | - |
| contentStyle | 内容区内联样式 | `{}` | `--` | - |
| contentTextClassName | [仅FormItemBordered支持] 内容文本 className | `string` | `--` | 1.2.2 |
| contentTextStyle | [仅FormItemBordered支持] 内容文本内联样式 | `{}` | `--` | 1.2.2 |
| containerProps | Form 根元素的属性，默认为 ScrollView | `{}` | `--` | 1.4.1 |
| suspendOnFirstError | 校验时遇到错误是否停止后续校验 | `boolean` | `false` | - |
| placeholderTextColor | 占位符文字颜色 | `string` | `"#cccccc"` | - |
| appearance | 默认的 FormItem UI 组件 | `ComponentClass<__type> \| Function` | `--` | 1.0.2-alpha.17 |
| useScrollView | 是否使用 ScrollView 包裹表单 | `boolean` | `true` | 1.0.8-beta.1 |
| useOnLayoutRoot | - | `boolean` | `--` | - |
| errorStyle | 错误样式 | `{}` | `--` | - |
| inputRenderer | 默认使用的 input 组件 | `{ input?: unknown; textarea?: ... }` | `--` | - |
| children | 子元素 | `any` | `--` | - |
| ref | - | `null \| RefObject` | `--` | - |
| key | - | `Key \| null` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 版本 |
|--------|------|------|------|
| onSubmit | 提交表单时的回调 | `(form: Record<string, any>) => void` | - |
| onMount | FormItem 挂载时回调 | `(ref: any) => void` | - |
| onDestroy | FormItem 卸载时回调 | `(ref: any) => void` | - |
| onError | 字段校验报错时的回调，常用于埋点 | `(ctx: { prop?: string, errorTip?: string }) => void` | 1.2.2 |
| onLabelClick | 标签点击事件 | `() => any` | 1.2.3 |
```