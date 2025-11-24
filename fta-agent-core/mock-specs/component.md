# 组件设计规范

## 组件设计原则

### 1. 单一职责原则 (SRP)

每个组件只负责一个明确的功能，保持组件的专注和可维护性。

### 2. 开放封闭原则 (OCP)

组件对扩展开放，对修改封闭。通过 props 和 children 实现功能扩展。

### 3. 依赖倒置原则 (DIP)

高层组件不依赖低层组件，都依赖于抽象（接口）。

### 4. 组合优于继承

使用组件组合而不是继承来复用代码。

## 组件分类

### 1. 业务组件 (Business Components)

位于 `src/components/`，包含特定业务逻辑的复合组件。

```typescript
// UserProfileCard.tsx
interface UserProfileCardProps {
  user: User;
  onEdit?: (user: User) => void;
  showActions?: boolean;
}

export const UserProfileCard: FC<UserProfileCardProps> = ({ user, onEdit, showActions = true }) => {
  // 业务逻辑实现
};
```

### 2. 页面组件 (Page Components)

位于 `src/pages/`，代表应用中的完整页面。

## 组件接口设计

### Props 设计规范

```typescript
interface ComponentProps {
  requiredProp: string;
  optionalProp?: number;
  variant?: 'primary' | 'secondary';
  config?: {
    theme: ThemeConfig;
    animations: AnimationConfig;
  };
  onSubmit?: (data: FormData) => void;
  onChange?: (value: string) => void;
  children?: ReactNode;
  renderHeader?: (data: HeaderData) => ReactNode;
  [key: string]: unkown;
}
```

## 组件实现模式

### 1. 函数式组件 + Hooks

```typescript
interface DataTableProps {
  data: Record<string, any>[];
  columns: ColumnDef[];
  loading?: boolean;
  onRowClick?: (row: Record<string, any>) => void;
}

export const DataTable: FC<DataTableProps> = ({ data, columns, loading, onRowClick }) => {
  // 状态管理
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [filters, setFilters] = useState<FilterState>({});

  // 计算属性
  const sortedData = useMemo(() => {
    // 排序逻辑
    return sortedArray;
  }, [data, sortConfig]);

  const filteredData = useMemo(() => {
    // 过滤逻辑
    return filteredArray;
  }, [sortedData, filters]);

  // 事件处理
  const handleSort = useCallback((key: string) => {
    setSortConfig((prev) => ({
      key,
      direction: prev?.key === key && prev.direction === 'asc' ? 'desc' : 'asc',
    }));
  }, []);

  // 渲染
  if (loading) return <Spinner />;

  return <View className='data-table'>{/* 表格实现 */}</View>;
};
```

### 2. 受控组件模式

```typescript
interface InputFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  label?: string;
  placeholder?: string;
}

export const InputField: FC<InputFieldProps> = ({ value, onChange, error, label, placeholder }) => {
  const handleChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onChange(e.target.value);
    },
    [onChange]
  );

  return (
    <View className='input-field'>
      {label && <label>{label}</label>}
      <input value={value} onChange={handleChange} placeholder={placeholder} className={error ? 'error' : ''} />
      {error && <Text className='error-message'>{error}</Text>}
    </View>
  );
};
```

### 3. 组件状态提升

```typescript
// 父组件
const ParentComponent: FC = () => {
  const [activeTab, setActiveTab] = useState('home');

  return (
    <View>
      <Tabs activeTab={activeTab} onTabChange={setActiveTab}>
        <Tab id='home' label='首页'>
          <HomeContent />
        </Tab>
        <Tab id='profile' label='个人资料'>
          <ProfileContent />
        </Tab>
      </Tabs>
    </View>
  );
};

// 子组件
interface TabsProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
  children: ReactNode;
}

const Tabs: FC<TabsProps> = ({ activeTab, onTabChange, children }) => {
  // 子组件只负责渲染，状态由父组件管理
};
```

## 组件样式规范

### 1. CSS Modules

```typescript
// Car.module.scss
.CarButton {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.CarButtonPrimary {
  color: white;
}

// Car.tsx
import styles from './Button.module.css';

export const Car: FC<ButtonProps> = ({ variant = 'primary', className, ...props }) => (
  <View className='CarButton' {...props} />
);
```

## 组件文档规范

### 1. JSDoc 注释

````typescript
/**
 * 用户资料卡片组件
 *
 * @example
 * ```tsx
 * <UserProfileCard
 *   user={user}
 *   onEdit={handleEdit}
 *   showActions={true}
 * />
 * ```
 */
interface UserProfileCardProps {
  /** 用户信息对象 */
  user: User;
  /** 编辑回调函数 */
  onEdit?: (user: User) => void;
  /** 是否显示操作按钮 */
  showActions?: boolean;
}
````

## 性能优化

### 1. React.memo 优化

```typescript
export const ExpensiveComponent = React.memo<Props>(
  ({ data, onUpdate }) => {
    return <View>{/* 复杂渲染逻辑 */}</View>;
  },
  (prevProps, nextProps) => {
    // 自定义比较函数
    return prevProps.data.id === nextProps.data.id;
  }
);
```

### 2. useMemo 和 useCallback

```typescript
const Component: FC<Props> = ({ items, onSelect }) => {
  const expensiveValue = useMemo(() => {
    return items.reduce((sum, item) => sum + item.value, 0);
  }, [items]);

  const handleClick = useCallback(
    (id: string) => {
      onSelect(id);
    },
    [onSelect]
  );

  return <View>{/* 组件内容 */}</View>;
};
```

## 最佳实践总结

1. **保持组件小而专注**：单个组件最好不要超过 200 行
2. **使用 TypeScript 严格模式**：确保类型安全
3. **考虑性能**：使用 React.memo 等
4. **提供必要的文档**：包括 JSDoc 注释
5. **遵循命名约定**：使用描述性的组件名和属性名
6. **合理使用 children**：提供灵活的组合方式
7. **处理边界情况**：加载状态、错误状态、空数据等
