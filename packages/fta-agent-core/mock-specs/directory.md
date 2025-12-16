# 前端项目目录结构规范

## 项目基础结构

```
src/
├── components/           # 通用组件
│   └── business/        # 业务组件
├── pages/               # 页面组件
│   ├── home-page/        # 首页
│   ├── dashboard-page/   # 仪表板
│   └── settings-page/    # 设置页
├── hooks/               # 自定义 Hooks
├── services/            # API 服务层
├── utils/               # 工具函数
├── types/               # TypeScript 类型定义
├── constants/           # 常量定义
├── contexts/            # React Context
├── stores/              # 状态管理
└── config/              # 配置文件
```

## 组件组织原则

1. **按功能模块分组**：相关的组件放在同一个目录下
2. **单一职责原则**：每个组件只负责一个功能
3. **可复用性**：业务组件放在 `components/`
4. **命名规范**：
   - 组件文件：kebab-case（如 `user-profile.tsx`）
   - 工具文件：kebab-case（如 `format-date.ts`）
   - 常量文件：kebab-case（如 `api-endpoints.ts`）

## 页面组件结构

每个页面组件目录应包含：

```
home-page/
├── index.tsx            # 主页面组件
├── components/          # 页面专用组件
├── hooks/              # 页面专用 hooks
├── styles/             # 页面样式
└── types.ts            # 页面类型定义
```

## 工具和服务组织

```
services/
├── api/                # API 接口定义
├── auth/               # 认证相关服务
└── storage/            # 本地存储服务

utils/
├── helpers/            # 辅助函数
├── validators/         # 验证函数
└── formatters/         # 格式化函数
```

## 文件导入导出规范

1. 使用绝对路径导入（通过路径别名）
2. 组件导出使用 `export default`
3. 工具函数和类型使用命名导出
4. 避免循环依赖

## 注意事项

- 保持目录结构扁平，避免过深的嵌套
- 使用 index.ts 文件简化导入路径
- 相关文件放在同一目录下
- 遵循约定优于配置的原则
