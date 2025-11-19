# 弹出层 Layer

为了增加业务代码的灵活性，`@fta/components` 提供了以下方法动态调用弹窗：

-   `Modal.show`
-   `Modal.hide`
-   `ActionSheet.show`
-   `ActionSheet.hide`

但在 FTA Thresh 中，这些方法可能引发偶现 Bug，导致弹窗无法正常显示或关闭。

**原因**：  
如果调用弹窗时未传入对应的 `id`，默认会取包裹了 `withLayer` 或 `LayerProvider` 的栈顶页面上下文进行操作。若原生侧发生内存泄漏，或弹窗调用时机在页面创建/销毁前后，JS 侧的上下文可能无法与原生容器完全同步。

为解决此类问题，从 `1.9.0-rc.14+` 版本开始，在 FTA Thresh 中提供统一的接入方式。

## 示例

### 使用 withLayer 包裹页面（函数组件）

```tsx
import { ActionSheet, Gap, ListItem, Modal, scale, useLayer, withLayer } from '@fta/components';
import { Button, Layout, List } from '@fta/components/common/display';
import { useThreshContext } from '@fta/hooks';
import { View } from '@tarojs/components';
import React from 'react';

const Demo = () => {
  // 方法一：使用 useThreshContext（推荐用于类组件）
  const context = useThreshContext();
  // 方法二：使用 useLayer（推荐用于函数组件）
  const layer = useLayer();

  // 上下文参数不可省略
  const modalContext = {
    id: layer.id!, // 推荐函数组件使用
    key: 'modal-1' // 可选，建议唯一，否则关闭时会关闭最近的弹窗
  };

  const actionSheetContext = {
    id: layer.id!,
    key: 'action-sheet-1'
  };

  const hideModal = () => {
    Modal.hide(modalContext);
  };

  const showModal = () => {
    Modal.show({
      ...modalContext,
      title: '标题',
      content: '内容',
      confirmText: '确定',
      onConfirm: hideModal
    });

    setTimeout(() => {
      hideModal();
    }, 3000);
  };

  const hideActionSheet = () => {
    ActionSheet.hide(actionSheetContext);
  };

  const showActionSheet = () => {
    ActionSheet.show({
      ...actionSheetContext,
      clickOverlayOnClose: true,
      title: { icon: true, title: '标题', onCancel: hideActionSheet },
      children: <View style={{ height: scale(300) }}>Children</View>,
      onClose: hideActionSheet,
      onConfirm: hideActionSheet
    });
  };

  return (
    <Layout title='浮动面板'>
      <Gap height={24} />
      <List>
        <ListItem title='显示Modal (3s 自动关闭)' onClick={showModal} />
        <ListItem title='显示ActionSheet' onClick={showActionSheet} />
      </List>
    </Layout>
  );
};

/**
 * 使用函数组件作为页面组件时，使用 withLayer 包裹
 */
export default withLayer(Demo);
```

### 使用 withLayer 包裹页面（类组件）

```tsx
import { ActionSheet, Gap, ListItem, Modal, scale, withLayer } from '@fta/components';
import { Button, Layout, List } from '@fta/components/common/display';
import { View } from '@tarojs/components';
import { RouterContext } from '@thresh/thresh-lib';
import React from 'react';

class Demo extends React.Component {
  context = RouterContext;

  // 上下文参数不可省略
  public modalContext = {
    id: this.context.__contextId__, // 推荐类组件直接传入 context
    key: 'modal-1'
  };

  public actionSheetContext = {
    id: this.context.__contextId__,
    key: 'action-sheet-1'
  };

  public hideModal = () => {
    Modal.hide(this.modalContext);
  };

  public showModal = () => {
    Modal.show({
      ...this.modalContext,
      title: '标题',
      content: '内容',
      confirmText: '确定',
      onConfirm: this.hideModal
    });

    setTimeout(() => {
      this.hideModal();
    }, 3000);
  };

  hideActionSheet = () => {
    ActionSheet.hide(this.actionSheetContext);
  };

  showActionSheet = () => {
    ActionSheet.show({
      ...this.actionSheetContext,
      clickOverlayOnClose: true,
      title: { icon: true, title: '标题', onCancel: this.hideActionSheet },
      children: <View style={{ height: scale(300) }}>Children</View>,
      onClose: this.hideActionSheet,
      onConfirm: this.hideActionSheet
    });
  };

  public render() {
    return (
      <Layout title='浮动面板'>
        <Gap height={24} />
        <List>
          <ListItem title='显示Modal (3s 自动关闭)' onClick={this.showModal} />
          <ListItem title='显示ActionSheet' onClick={this.showActionSheet} />
        </List>
      </Layout>
    );
  }
}

/**
 * 使用类组件作为页面组件时，使用 withLayer 包裹，并传入 forwardRef: true
 * 以确保类组件生命周期钩子能够正常触发
 */
export default withLayer(Demo, {
  forwardRef: true
});
```

## 接入方式

### Bad Case

1. **显式指定 `withLayer` 的 `id`**  
   可能导致页面被内部路由打开两次时，前一个页面上下文丢失，弹窗无法操作。

   ```
   A -> B1 (上下文丢失) -> B2
   ```

   ```ts
   withLayer(B, { id: 'page-b' })
   ```

2. **调用 `show/hide` 时未传入上下文**  
   可能导致偶现 Bug。

   ```ts
   Modal.show({
     title: '',
     content: ''
   });

   Modal.hide({});
   ```

### Good Case

#### 1. 使用 `withLayer` 包裹页面组件

无需显式指定 `pageId`，由框架自动管理。

**类组件：**
```ts
class Page1 extends React.Component<Page1Props> {
  componentDidShow() {}
  render() {}
}

export default withLayer(Page1, {
  forwardRef: true // 传递 ref，确保生命周期钩子正常触发
});
```

**函数组件：**
```ts
function Page2(props: Page2Props) {}

export default withLayer(Page2);
```

#### 2. 调用时传入页面上下文

```ts
import { useLayer } from '@fta/components';

function FunctionChildren() {
  const context = useThreshContext(); // 方法一
  const layer = useLayer();           // 方法二

  const modalContext = {
    id: context,     // 推荐类组件使用
    // id: layer.id, // 推荐函数组件使用
    key: 'modal-1'   // 可选，建议唯一
  };

  const hideModal = () => {
    Modal.hide(modalContext);
  };

  const showModal = () => {
    Modal.show({
      ...modalContext,
      title: '标题',
      content: '内容',
      confirmText: '确定',
      onConfirm: hideModal
    });
  };
}
```

#### 使用 `LayerProvider`

适用于需要手动控制上下文的场景。

```tsx
class Page extends React.Component {
  static contextType = RouterContext;

  render() {
    return (
      <LayerProvider id={this.context.__contextId__}>
        {/* 业务代码 */}
      </LayerProvider>
    );
  }
}
```

## 注意事项

- `withLayer` 应仅包裹页面组件，**子组件不要重复包裹**。
- 使用 `LayerProvider` 时，若需在页面加载时显示弹窗，建议延迟约 **300ms**，等待其初始化完成。
- `withLayer` 包裹类组件时，必须设置 `forwardRef: true`，以确保生命周期钩子正常触发。

> 原因：FTA 内部通过 `ref` 调用业务组件的生命周期回调，必须透传 `ref` 才能正常触发。

```ts
export default withLayer(ClassComponent, {
  forwardRef: true
});
```