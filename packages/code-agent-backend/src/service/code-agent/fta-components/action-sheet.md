# ActionSheet 动作面板

由用户操作触发，提供一组与操作相关的两个或多个选项，让用户在不离场的情况下完成操作。相比于对话框，动作面板的位置更适合于在大屏幕时代的单手操作。

## 引用
```tsx
import { ActionSheet, ActionSheetItem } from '@fta/components'
```

## 示例

### 基础用法
通过 `isOpened` 控制显示与隐藏，支持标题、取消按钮及操作项。

```tsx
<ActionSheet
  clickOverlayOnClose
  title="清除位置信息后，别人将不能查看你"
  cancelText="取消"
  isOpened={isOpened}
  onCancel={onClose}
  onClose={onClose}
  useNativeModal={true}
>
  <ActionSheetItem>操作1</ActionSheetItem>
  <ActionSheetItem>操作2</ActionSheetItem>
  <ActionSheetItem noBorder>操作3</ActionSheetItem>
</ActionSheet>
```

### 自定义标题
支持对象形式的 `title`，可配置确认按钮文本和回调。

```tsx
<ActionSheet
  title={{
    title: '请选择列表项',
    cancelText: '取消',
    confirmText: '确定',
    onConfirm: onClose,
    onCancel: onClose,
  }}
  isOpened={isOpened}
  onClose={onClose}
>
  <ActionSheetItem>操作1</ActionSheetItem>
  <ActionSheetItem>操作2</ActionSheetItem>
  <ActionSheetItem>操作3</ActionSheetItem>
</ActionSheet>
```

### 自定义内容区域
可通过 `children` 传入自定义内容。

```tsx
<ActionSheet
  isOpened={isOpened}
  onClose={onClose}
  className="demo-action-sheet"
  containerClassName="demo-action-sheet-container"
>
  <View className="demo-action-sheet-custom">
    <Text className="demo-action-sheet-custom__text">自定义区域</Text>
  </View>
</ActionSheet>
```

### 使用示例区域（example）
在 Android 上示例区域不可点击。

```tsx
<ActionSheet
  example={
    <View className="demo-action-sheet-example">
      <Text className="demo-action-sheet-example__text">示例</Text>
      <View className="demo-action-sheet-example__content">
        <Text className="demo-action-sheet-example__content__text">内容</Text>
        <Text className="demo-action-sheet-example__content__text">根据需求自定义设计</Text>
      </View>
    </View>
  }
  isOpened={isOpened}
  onClose={onClose}
>
  <ActionSheetItem>操作1</ActionSheetItem>
  <ActionSheetItem>操作2</ActionSheetItem>
  <ActionSheetItem>操作3</ActionSheetItem>
</ActionSheet>
```

### API 调用方式（v1.0.17+）
支持通过 `ActionSheet.show()` 方法调用。

```tsx
ActionSheet.show({
  key: 'sheet_1',
  id: 'sheet_page',
  useNativeModal: true,
  clickOverlayOnClose: true,
  onClose: () => ActionSheet.hide({ key: 'sheet_1', id: 'sheet_page' }),
  title: {
    title: '请查看无字天书',
    cancelText: '关闭',
    confirmText: '看不懂',
    onConfirm: () => {
      console.log('确认');
    },
    onCancel: () => {
      console.log('点击关闭');
    },
  },
  children: (
    <View className="demo-action-sheet-custom">
      <Text className="demo-action-sheet-custom__text">无字天书</Text>
    </View>
  ),
});
```

## API

### Props

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| isOpened | 是否展示元素 | `boolean` | 必选 | - |
| title | 元素的标题 | `ReactNode \| unknown` | `--` | - |
| cancelText | 取消按钮的内容 | `string` | `--` | - |
| containerClassName | 容器样式类名 | `string` | `--` | - |
| containerStyle | 容器内联样式 | `{}` | `--` | - |
| contentClassName | 容器子节点样式类名 | `string` | `--` | - |
| contentStyle | 容器子节点内联样式 | `{}` | `--` | - |
| overlayClassName | 背景蒙层类名 | `string` | `--` | - |
| overlayStyle | 背景蒙层内联样式 | `{}` | `--` | - |
| useNativeModal | RN/Thresh端是否使用原生Modal组件 | `boolean` | `true` | - |
| catchMove | 是否阻止内容滑动穿透 | `boolean` | `true` | - |
| clickOverlayOnClose | 点击背景蒙层是否关闭 | `boolean` | `false` | - |
| example | 示例区域（Android不可点击） | `ReactNode` | `--` | - |
| animated | 是否显示从底部弹出的动画效果 | `boolean` | `true` | 1.0.6 |
| safeArea | 是否显示底部安全区 | `boolean \| Omit_SafeAreaProps` | `true` | 1.0.9 |
| modalProps | 弹窗 props | `{ onShow?: () => void; transparent?: boolean; ... }` | `--` | 1.0.10 |
| prefix | 前缀节点 | `ReactNode` | `--` | 1.2.0 |
| suffix | 后缀节点 | `ReactNode` | `--` | 1.2.0 |
| theme | 确定按钮主题色 | `string` | `--` | 1.2.0 |
| sibling | Thresh端Modal组件的前后缀节点 | `{ prev?: ReactNode; next?: ReactNode }` | `--` | 1.6.2 |
| headerProps | 透传给头部节点的其他属性 | `{}` | `--` | 1.7.12 |
| children | 子元素 | `any` | `--` | - |

### Events

| 属性名 | 描述 | 类型 | 默认值 | 版本 |
|--------|------|------|--------|------|
| onConfirm | 已废弃 | `() => void` | `--` | - |
| onCancel | 点击底部取消/关闭时的回调 | `() => void` | `--` | - |
| onClose | 元素被关闭时触发 | `(event: any) => void` | `--` | - |
| onShow | Modal 显示回调 | `() => any` | `--` | 1.2.0 |
| onHide | Modal 隐藏回调 | `() => any` | `--` | 1.2.0 |