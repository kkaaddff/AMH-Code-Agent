# 样式规范

## 样式架构概述

### 设计原则

1. **一致性**：统一的视觉语言和交互模式
2. **可维护性**：模块化、可复用的样式系统
3. **可扩展性**：易于扩展和定制的设计令牌
4. **IMPORTANT! 克制**：使用的 FTA 组件已经携带了大量的企业预设样式，请不要多组件进行过多的定制！

### 技术栈

- **CSS 预处理器**：Sass/SCSS

## 最佳实践

### 1. 性能优化

```scss
// 避免重复的属性声明
.button {
  // 好的做法：将通用属性放在一起
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  // 变体样式
  &.primary {
    color: white;
  }
}
```

### 2. 命名规范

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
