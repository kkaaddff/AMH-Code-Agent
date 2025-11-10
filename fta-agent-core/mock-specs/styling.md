# 样式规范

## 样式架构概述

### 设计原则

1. **一致性**：统一的视觉语言和交互模式
2. **可维护性**：模块化、可复用的样式系统
3. **可扩展性**：易于扩展和定制的设计令牌
4. **性能优先**：高效的 CSS 和优化策略
5. **可访问性**：符合 WCAG 2.1 AA 标准

### 技术栈

- **CSS 预处理器**：Sass/SCSS
- **CSS-in-JS**：Styled Components（用于组件样式）
- **CSS Modules**：用于页面级样式
- **设计系统**：基于 Design Tokens 的原子设计
- **响应式设计**：Mobile-first 策略

## 样式组织结构

### 文件组织

```
src/styles/
├── tokens/              # 设计令牌
│   ├── colors.scss
│   ├── typography.scss
│   ├── spacing.scss
│   ├── effects.scss
│   └── breakpoints.scss
├── utilities/           # 工具类
│   ├── layout.scss
│   ├── spacing.scss
│   ├── typography.scss
│   ├── colors.scss
│   ├── transitions.scss
│   └── accessibility.scss
├── themes/              # 主题
│   ├── light.scss
│   └── dark.scss
├── components/          # 组件样式
│   ├── Button/
│   ├── Input/
│   ├── Card/
│   └── Modal/
├── layouts/             # 布局样式
│   ├── AppLayout/
│   ├── PageLayout/
│   └── AuthLayout/
├── pages/               # 页面样式
├── main.scss            # 主样式文件
└── index.scss           # 入口文件
```

## 最佳实践

### 1. 性能优化

```scss
// 避免重复的属性声明
.button {
  // 好的做法：将通用属性放在一起
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-3) var(--spacing-4);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease-in-out;

  // 变体样式
  &.primary {
    background-color: var(--color-primary-500);
    color: white;
  }
}

// 使用 CSS 自定义属性提高性能
.card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}
```

### 2. 可维护性

```scss
// 使用混合器减少重复
@mixin button-base {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
  cursor: pointer;
  transition: all 0.2s ease-in-out;
}

@mixin button-variant($bg-color, $text-color) {
  background-color: $bg-color;
  color: $text-color;

  &:hover:not(:disabled) {
    filter: brightness(0.9);
  }

  &:active:not(:disabled) {
    filter: brightness(0.8);
  }
}

.button {
  @include button-base;
  @include button-variant(var(--color-primary-500), white);
}

.button-secondary {
  @include button-base;
  @include button-variant(var(--color-secondary-100), var(--color-secondary-900));
}
```

### 3. 命名规范

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
