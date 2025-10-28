# FTA DSL 布局设计器

这是一个基于 React + Vite 的项目，用于渲染 FTA 设计工具导出的 DSL (Domain Specific Language) 数据。

## 技术栈

- React 18
- Vite 5
- TypeScript
- Ant Design
- SVG 渲染

## 项目结构

```
src/
├── components/        # React 组件
├── hooks/            # 自定义 React Hooks
├── types/            # TypeScript 类型定义
├── utils/            # 工具函数
├── App.tsx          # 主应用组件
└── main.tsx         # 应用入口
```

## 功能特性

1. DSL 数据解析和渲染
2. 支持文本、图像、路径等元素渲染
3. Flexbox 布局支持
4. 样式解析（颜色、字体、边框等）
5. SVG 路径渲染
6. 响应式设计
7. Ant Design 组件集成

## 开发指南

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

## DSL 数据结构

DSL 数据包含两个主要部分：

1. `styles`: 样式定义，包括颜色、字体、图像等
2. `nodes`: 节点树，描述页面结构

支持的节点类型：
- `FRAME`: 容器元素
- `INSTANCE`: 实例元素
- `TEXT`: 文本元素
- `LAYER`: 图层元素
- `PATH`: SVG 路径元素
- `GROUP`: 分组元素

## 自定义渲染

可以通过修改 `src/components/DSLElement.tsx` 文件来自定义不同节点类型的渲染方式。

## 扩展功能

1. 添加更多 Ant Design 组件支持
2. 实现更复杂的交互功能
3. 支持动画效果
4. 添加数据绑定功能
5. 实现设计稿与代码的实时同步

## 注意事项

1. 图像资源需要可访问的 URL
2. 字体渲染依赖系统字体支持
3. 复杂的 SVG 路径可能需要优化渲染性能