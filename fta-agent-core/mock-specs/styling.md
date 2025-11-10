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

## 设计令牌 (Design Tokens)

### 颜色系统

```scss
// tokens/colors.scss
:root {
  // 主色调
  --color-primary-50: #eff6ff;
  --color-primary-100: #dbeafe;
  --color-primary-200: #bfdbfe;
  --color-primary-300: #93c5fd;
  --color-primary-400: #60a5fa;
  --color-primary-500: #3b82f6;  // 主色
  --color-primary-600: #2563eb;
  --color-primary-700: #1d4ed8;
  --color-primary-800: #1e40af;
  --color-primary-900: #1e3a8a;

  // 辅助色
  --color-secondary-50: #f8fafc;
  --color-secondary-100: #f1f5f9;
  --color-secondary-200: #e2e8f0;
  --color-secondary-300: #cbd5e1;
  --color-secondary-400: #94a3b8;
  --color-secondary-500: #64748b;  // 辅助色
  --color-secondary-600: #475569;
  --color-secondary-700: #334155;
  --color-secondary-800: #1e293b;
  --color-secondary-900: #0f172a;

  // 功能色
  --color-success-500: #10b981;
  --color-warning-500: #f59e0b;
  --color-error-500: #ef4444;
  --color-info-500: #06b6d4;

  // 中性色
  --color-gray-50: #f9fafb;
  --color-gray-100: #f3f4f6;
  --color-gray-200: #e5e7eb;
  --color-gray-300: #d1d5db;
  --color-gray-400: #9ca3af;
  --color-gray-500: #6b7280;
  --color-gray-600: #4b5563;
  --color-gray-700: #374151;
  --color-gray-800: #1f2937;
  --color-gray-900: #111827;

  // 文本色
  --color-text-primary: var(--color-gray-900);
  --color-text-secondary: var(--color-gray-600);
  --color-text-disabled: var(--color-gray-400);
  --color-text-inverse: #ffffff;

  // 背景色
  --color-bg-primary: #ffffff;
  --color-bg-secondary: var(--color-gray-50);
  --color-bg-tertiary: var(--color-gray-100);
  --color-bg-disabled: var(--color-gray-100);

  // 边框色
  --color-border-primary: var(--color-gray-200);
  --color-border-secondary: var(--color-gray-300);
  --color-border-focus: var(--color-primary-500);
}
```

### 字体系统

```scss
// tokens/typography.scss
:root {
  // 字体族
  --font-family-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'JetBrains Mono', 'Fira Code', Consolas, monospace;

  // 字体大小
  --font-size-xs: 0.75rem;    // 12px
  --font-size-sm: 0.875rem;   // 14px
  --font-size-base: 1rem;     // 16px
  --font-size-lg: 1.125rem;   // 18px
  --font-size-xl: 1.25rem;    // 20px
  --font-size-2xl: 1.5rem;    // 24px
  --font-size-3xl: 1.875rem;  // 30px
  --font-size-4xl: 2.25rem;   // 36px
  --font-size-5xl: 3rem;      // 48px

  // 字重
  --font-weight-light: 300;
  --font-weight-normal: 400;
  --font-weight-medium: 500;
  --font-weight-semibold: 600;
  --font-weight-bold: 700;

  // 行高
  --line-height-tight: 1.25;
  --line-height-normal: 1.5;
  --line-height-relaxed: 1.75;

  // 字母间距
  --letter-spacing-tight: -0.025em;
  --letter-spacing-normal: 0;
  --letter-spacing-wide: 0.025em;
}

// Typography utilities
.text-xs { font-size: var(--font-size-xs); }
.text-sm { font-size: var(--font-size-sm); }
.text-base { font-size: var(--font-size-base); }
.text-lg { font-size: var(--font-size-lg); }
.text-xl { font-size: var(--font-size-xl); }
.text-2xl { font-size: var(--font-size-2xl); }
.text-3xl { font-size: var(--font-size-3xl); }
.text-4xl { font-size: var(--font-size-4xl); }
.text-5xl { font-size: var(--font-size-5xl); }

.font-light { font-weight: var(--font-weight-light); }
.font-normal { font-weight: var(--font-weight-normal); }
.font-medium { font-weight: var(--font-weight-medium); }
.font-semibold { font-weight: var(--font-weight-semibold); }
.font-bold { font-weight: var(--font-weight-bold); }
```

### 间距系统

```scss
// tokens/spacing.scss
:root {
  --spacing-0: 0;
  --spacing-1: 0.25rem;   // 4px
  --spacing-2: 0.5rem;    // 8px
  --spacing-3: 0.75rem;   // 12px
  --spacing-4: 1rem;      // 16px
  --spacing-5: 1.25rem;   // 20px
  --spacing-6: 1.5rem;    // 24px
  --spacing-8: 2rem;      // 32px
  --spacing-10: 2.5rem;   // 40px
  --spacing-12: 3rem;     // 48px
  --spacing-16: 4rem;     // 64px
  --spacing-20: 5rem;     // 80px
  --spacing-24: 6rem;     // 96px
  --spacing-32: 8rem;     // 128px
}

// Spacing utilities
.p-0 { padding: var(--spacing-0); }
.p-1 { padding: var(--spacing-1); }
.p-2 { padding: var(--spacing-2); }
.p-3 { padding: var(--spacing-3); }
.p-4 { padding: var(--spacing-4); }
.p-5 { padding: var(--spacing-5); }
.p-6 { padding: var(--spacing-6); }
.p-8 { padding: var(--spacing-8); }

.m-0 { margin: var(--spacing-0); }
.m-1 { margin: var(--spacing-1); }
.m-2 { margin: var(--spacing-2); }
.m-3 { margin: var(--spacing-3); }
.m-4 { margin: var(--spacing-4); }
.m-5 { margin: var(--spacing-5); }
.m-6 { margin: var(--spacing-6); }
.m-8 { margin: var(--spacing-8); }

// Directional spacing
.px-4 { padding-left: var(--spacing-4); padding-right: var(--spacing-4); }
.py-4 { padding-top: var(--spacing-4); padding-bottom: var(--spacing-4); }
.mx-auto { margin-left: auto; margin-right: auto; }
.my-4 { margin-top: var(--spacing-4); margin-bottom: var(--spacing-4); }
```

### 圆角和阴影

```scss
// tokens/effects.scss
:root {
  // 圆角
  --radius-none: 0;
  --radius-sm: 0.125rem;    // 2px
  --radius-base: 0.25rem;   // 4px
  --radius-md: 0.375rem;    // 6px
  --radius-lg: 0.5rem;      // 8px
  --radius-xl: 0.75rem;     // 12px
  --radius-2xl: 1rem;       // 16px
  --radius-full: 9999px;

  // 阴影
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  --shadow-2xl: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

// Border radius utilities
.rounded-none { border-radius: var(--radius-none); }
.rounded-sm { border-radius: var(--radius-sm); }
.rounded { border-radius: var(--radius-base); }
.rounded-md { border-radius: var(--radius-md); }
.rounded-lg { border-radius: var(--radius-lg); }
.rounded-xl { border-radius: var(--radius-xl); }
.rounded-2xl { border-radius: var(--radius-2xl); }
.rounded-full { border-radius: var(--radius-full); }

// Shadow utilities
.shadow-sm { box-shadow: var(--shadow-sm); }
.shadow { box-shadow: var(--shadow-base); }
.shadow-md { box-shadow: var(--shadow-md); }
.shadow-lg { box-shadow: var(--shadow-lg); }
.shadow-xl { box-shadow: var(--shadow-xl); }
.shadow-2xl { box-shadow: var(--shadow-2xl); }
```

## 基础组件样式

### Button 组件

```scss
// components/Button/Button.module.scss
.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-family-sans);
  font-weight: var(--font-weight-medium);
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px var(--color-border-focus);
  }
}

// 尺寸变体
.sizes {
  &.sm {
    height: 2rem;    // 32px
    padding: 0 var(--spacing-3);
    font-size: var(--font-size-sm);
  }

  &.md {
    height: 2.5rem;  // 40px
    padding: 0 var(--spacing-4);
    font-size: var(--font-size-base);
  }

  &.lg {
    height: 3rem;    // 48px
    padding: 0 var(--spacing-6);
    font-size: var(--font-size-lg);
  }
}

// 颜色变体
.variants {
  &.primary {
    background-color: var(--color-primary-500);
    color: var(--color-text-inverse);

    &:hover:not(:disabled) {
      background-color: var(--color-primary-600);
    }

    &:active:not(:disabled) {
      background-color: var(--color-primary-700);
    }
  }

  &.secondary {
    background-color: var(--color-secondary-100);
    color: var(--color-secondary-900);
    border: 1px solid var(--color-secondary-300);

    &:hover:not(:disabled) {
      background-color: var(--color-secondary-200);
    }

    &:active:not(:disabled) {
      background-color: var(--color-secondary-300);
    }
  }

  &.outline {
    background-color: transparent;
    color: var(--color-primary-500);
    border: 1px solid var(--color-primary-500);

    &:hover:not(:disabled) {
      background-color: var(--color-primary-50);
    }

    &:active:not(:disabled) {
      background-color: var(--color-primary-100);
    }
  }

  &.ghost {
    background-color: transparent;
    color: var(--color-primary-500);

    &:hover:not(:disabled) {
      background-color: var(--color-primary-50);
    }

    &:active:not(:disabled) {
      background-color: var(--color-primary-100);
    }
  }

  &.danger {
    background-color: var(--color-error-500);
    color: var(--color-text-inverse);

    &:hover:not(:disabled) {
      background-color: var(--color-error-600);
    }

    &:active:not(:disabled) {
      background-color: var(--color-error-700);
    }
  }
}

// 加载状态
.loading {
  pointer-events: none;

  .buttonContent {
    opacity: 0;
  }
}

.spinner {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 1rem;
  height: 1rem;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}

@keyframes spin {
  to { transform: translate(-50%, -50%) rotate(360deg); }
}
```

### Input 组件

```scss
// components/Input/Input.module.scss
.input {
  width: 100%;
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-md);
  background-color: var(--color-bg-primary);
  color: var(--color-text-primary);
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  transition: all 0.2s ease-in-out;

  &::placeholder {
    color: var(--color-text-disabled);
  }

  &:focus {
    outline: none;
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  &:disabled {
    background-color: var(--color-bg-disabled);
    color: var(--color-text-disabled);
    cursor: not-allowed;
  }

  &.error {
    border-color: var(--color-error-500);

    &:focus {
      border-color: var(--color-error-500);
      box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
    }
  }
}

// 尺寸变体
.sizes {
  &.sm {
    height: 2rem;    // 32px
    padding: 0 var(--spacing-2);
    font-size: var(--font-size-sm);
  }

  &.md {
    height: 2.5rem;  // 40px
    padding: 0 var(--spacing-3);
    font-size: var(--font-size-base);
  }

  &.lg {
    height: 3rem;    // 48px
    padding: 0 var(--spacing-4);
    font-size: var(--font-size-lg);
  }
}

// 输入组
.inputGroup {
  position: relative;
  display: flex;
  align-items: center;

  .input {
    flex: 1;

    &.withPrefix {
      padding-left: 2.5rem;
    }

    &.withSuffix {
      padding-right: 2.5rem;
    }
  }

  .prefix,
  .suffix {
    position: absolute;
    color: var(--color-text-secondary);
    pointer-events: none;
  }

  .prefix {
    left: var(--spacing-3);
  }

  .suffix {
    right: var(--spacing-3);
  }
}

// 错误信息
.error {
  color: var(--color-error-500);
  font-size: var(--font-size-sm);
  margin-top: var(--spacing-1);
}
```

### Card 组件

```scss
// components/Card/Card.module.scss
.card {
  background-color: var(--color-bg-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
  overflow: hidden;

  &.hoverable {
    transition: all 0.2s ease-in-out;

    &:hover {
      box-shadow: var(--shadow-md);
      transform: translateY(-1px);
    }
  }

  &.bordered {
    border-width: 2px;
  }

  &.shadow {
    box-shadow: var(--shadow-lg);
  }
}

.header {
  padding: var(--spacing-6);
  border-bottom: 1px solid var(--color-border-primary);
  background-color: var(--color-bg-secondary);

  h3,
  h4,
  h5,
  h6 {
    margin: 0;
    color: var(--color-text-primary);
  }

  p {
    margin: var(--spacing-1) 0 0 0;
    color: var(--color-text-secondary);
    font-size: var(--font-size-sm);
  }
}

.body {
  padding: var(--spacing-6);
}

.footer {
  padding: var(--spacing-4) var(--spacing-6);
  background-color: var(--color-bg-secondary);
  border-top: 1px solid var(--color-border-primary);

  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-3);
}
```

## 响应式设计

### 断点系统

```scss
// tokens/breakpoints.scss
:root {
  --breakpoint-sm: 640px;   // 小屏幕
  --breakpoint-md: 768px;   // 中等屏幕
  --breakpoint-lg: 1024px;  // 大屏幕
  --breakpoint-xl: 1280px;  // 超大屏幕
  --breakpoint-2xl: 1536px; // 超超大屏幕
}

// Media queries mixins
@mixin sm {
  @media (min-width: var(--breakpoint-sm)) {
    @content;
  }
}

@mixin md {
  @media (min-width: var(--breakpoint-md)) {
    @content;
  }
}

@mixin lg {
  @media (min-width: var(--breakpoint-lg)) {
    @content;
  }
}

@mixin xl {
  @media (min-width: var(--breakpoint-xl)) {
    @content;
  }
}

@mixin 2xl {
  @media (min-width: var(--breakpoint-2xl)) {
    @content;
  }
}

// 响应式工具类
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--spacing-4);

  @include sm {
    max-width: 640px;
  }

  @include md {
    max-width: 768px;
  }

  @include lg {
    max-width: 1024px;
  }

  @include xl {
    max-width: 1280px;
  }

  @include 2xl {
    max-width: 1536px;
  }
}

// Grid 系统
.grid {
  display: grid;
  gap: var(--spacing-4);

  &.cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
  &.cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  &.cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
  &.cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }

  @include sm {
    &.sm-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    &.sm-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    &.sm-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    &.sm-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }

  @include md {
    &.md-cols-1 { grid-template-columns: repeat(1, minmax(0, 1fr)); }
    &.md-cols-2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    &.md-cols-3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
    &.md-cols-4 { grid-template-columns: repeat(4, minmax(0, 1fr)); }
  }
}
```

### 响应式组件

```scss
// components/Layout/Layout.module.scss
.layout {
  min-height: 100vh;
  display: flex;
  flex-direction: column;

  .header {
    position: sticky;
    top: 0;
    z-index: 50;
    background-color: var(--color-bg-primary);
    border-bottom: 1px solid var(--color-border-primary);
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;

    @include md {
      flex-direction: row;
    }
  }

  .sidebar {
    width: 100%;
    background-color: var(--color-bg-secondary);
    border-right: 1px solid var(--color-border-primary);

    @include md {
      width: 256px;
      flex-shrink: 0;
    }
  }

  .content {
    flex: 1;
    padding: var(--spacing-6);
  }
}
```

## 主题系统

### 暗色主题

```scss
// themes/dark.scss
:root[data-theme="dark"] {
  // 重新定义颜色变量
  --color-text-primary: var(--color-gray-100);
  --color-text-secondary: var(--color-gray-300);
  --color-text-disabled: var(--color-gray-500);

  --color-bg-primary: var(--color-gray-900);
  --color-bg-secondary: var(--color-gray-800);
  --color-bg-tertiary: var(--color-gray-700);

  --color-border-primary: var(--color-gray-700);
  --color-border-secondary: var(--color-gray-600);

  // 组件特定颜色
  --color-surface: var(--color-gray-800);
  --color-surface-variant: var(--color-gray-700);
}

// 主题切换工具类
.theme-transition * {
  transition-property: background-color, border-color, color, fill, stroke;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
  transition-duration: 150ms;
}
```

### 主题提供者

```typescript
// contexts/ThemeContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('theme');
    return (saved as Theme) || 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      <div className={`theme-transition`}>
        {children}
      </div>
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

## 动画和过渡

### 过渡工具类

```scss
// utilities/transitions.scss
.transition {
  transition: all 0.2s ease-in-out;
}

.transition-colors {
  transition: background-color 0.2s ease-in-out,
              border-color 0.2s ease-in-out,
              color 0.2s ease-in-out;
}

.transition-opacity {
  transition: opacity 0.2s ease-in-out;
}

.transition-transform {
  transition: transform 0.2s ease-in-out;
}

// 动画工具类
.animate-fade-in {
  animation: fadeIn 0.3s ease-in-out;
}

.animate-slide-up {
  animation: slideUp 0.3s ease-out;
}

.animate-bounce {
  animation: bounce 1s infinite;
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

// 动画定义
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes bounce {
  0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
  50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## 可访问性样式

### 焦点管理

```scss
// utilities/accessibility.scss
// 焦点样式
.focus-ring {
  &:focus {
    outline: 2px solid var(--color-primary-500);
    outline-offset: 2px;
  }
}

// 高对比度模式支持
@media (prefers-contrast: high) {
  .focus-ring {
    &:focus {
      outline-width: 3px;
      outline-offset: 2px;
    }
  }
}

// 减少动画偏好支持
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// 屏幕阅读器专用
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.not-sr-only {
  position: static;
  width: auto;
  height: auto;
  padding: 0;
  margin: 0;
  overflow: visible;
  clip: auto;
  white-space: normal;
}
```

### 颜色对比度

```scss
// utilities/contrast.scss
// 确保文字在背景上有足够的对比度
.text-on-primary {
  color: var(--color-text-inverse);
}

.text-on-secondary {
  color: var(--color-gray-900);
}

.text-on-surface {
  color: var(--color-text-primary);
}

// 状态色彩
.text-success {
  color: var(--color-success-500);
}

.text-warning {
  color: var(--color-warning-500);
}

.text-error {
  color: var(--color-error-500);
}

.text-info {
  color: var(--color-info-500);
}
```

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

### 主样式文件

```scss
// styles/main.scss
// 导入字体
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

// 导入设计令牌
@import './tokens/colors';
@import './tokens/typography';
@import './tokens/spacing';
@import './tokens/effects';
@import './tokens/breakpoints';

// 导入工具类
@import './utilities/layout';
@import './utilities/spacing';
@import './utilities/typography';
@import './utilities/colors';
@import './utilities/transitions';
@import './utilities/accessibility';

// 导入主题
@import './themes/light';

// 全局基础样式
* {
  box-sizing: border-box;
}

html {
  font-size: 16px;
  line-height: 1.5;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  margin: 0;
  font-family: var(--font-family-sans);
  font-size: var(--font-size-base);
  color: var(--color-text-primary);
  background-color: var(--color-bg-primary);
  min-height: 100vh;
}

// 链接样式
a {
  color: var(--color-primary-500);
  text-decoration: none;

  &:hover {
    color: var(--color-primary-600);
    text-decoration: underline;
  }

  &:focus {
    @extend .focus-ring;
  }
}

// 表单元素基础样式
button,
input,
select,
textarea {
  font-family: inherit;
  font-size: inherit;
}

// 图片响应式
img {
  max-width: 100%;
  height: auto;
}
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

### 4. 测试和文档

```scss
// 为组件创建测试用例
.button-test {
  // 测试不同尺寸
  &.size-test {
    .sm { @extend .button-sm; }
    .md { @extend .button-md; }
    .lg { @extend .button-lg; }
  }

  // 测试不同变体
  &.variant-test {
    .primary { @extend .button-primary; }
    .secondary { @extend .button-secondary; }
    .outline { @extend .button-outline; }
  }

  // 测试不同状态
  &.state-test {
    .disabled { @extend .button[disabled]; }
    .loading { @extend .button-loading; }
  }
}
```

通过这套完整的样式规范，可以确保项目具有一致的视觉体验、良好的可维护性和优秀的性能表现。