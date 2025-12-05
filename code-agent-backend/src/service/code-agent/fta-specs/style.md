# 样式规范

## 样式架构概述

### 设计原则

1. **一致性**：统一的视觉语言和交互模式
2. **可维护性**：模块化、可复用的样式系统
3. **可扩展性**：易于扩展和定制的设计令牌
4. **IMPORTANT! 克制**：使用的 FTA 组件已经携带了大量的企业预设样式，请不要多组件进行过多的定制！
5. **IMPORTANT! 强制**：
   - 当前布局系统只支持 `flex` 布局，且 **所有的** 布局信息 **必须强制使用** **flex** 显式设置
   - 与 `React Native` 一致 `flex-direction` 默认为 `column`
   - `View` 默认与 `div` 一致**不带有预设样式**，使用 `View` 进行布局时要设置合理的 `padding` 和 `margin` 来保持父子组件，兄弟组件的相对位置和间隙.
   - 样式必须放在 `tsx` 同名 `.module.scss` 文件中，**禁止**使用行内样式！
   - 所有的尺寸必须严格按照 `Design DSL` 和 `Page Annotation` 中的数据，使用 `px` 单位，**禁止**使用 `rem`，`vw`，`vh`和`百分比`等尺寸单位！

### 技术栈

- **CSS 预处理器**：Sass/SCSS

## 最佳实践

### 1. 命名规范

```scss
// 使用 BEM 命名规范
.card {
  // Block
  &__header {
    // Element
  }

  &__body {
    // Element
  }

  &__footer {
    // Element
  }

  &--bordered {
    // Modifier
  }

  &--hoverable {
    // Modifier
  }
}

// 或者使用模块化的命名方式
.container {
  .wrapper {
    .content {
      .title {
        // 嵌套结构
      }
    }
  }
}
```

通过这套完整的样式规范，可以确保项目具有一致的视觉体验、良好的可维护性和优秀的性能表现。
