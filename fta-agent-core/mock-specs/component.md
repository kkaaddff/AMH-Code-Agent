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

### 1. 基础 UI 组件 (Base Components)

`@fta/components`组件库提供最基础的 UI 元素。

```typescript
// Button
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'text';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  icon?: ReactNode;
  children: ReactNode;
  onClick?: () => void;
}
```

### 2. 业务组件 (Business Components)

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

### 3. 页面组件 (Page Components)

位于 `src/pages/`，代表应用中的完整页面。

## 组件接口设计

### Props 设计规范

```typescript
interface ComponentProps {
  // 必需属性
  requiredProp: string;

  // 可选属性提供默认值
  optionalProp?: number;

  // 枚举类型
  variant?: 'primary' | 'secondary';

  // 复杂对象类型
  config?: {
    theme: ThemeConfig;
    animations: AnimationConfig;
  };

  // 事件处理器
  onSubmit?: (data: FormData) => void;
  onChange?: (value: string) => void;

  // 渲染属性
  children?: ReactNode;
  renderHeader?: (data: HeaderData) => ReactNode;

  // HTML 属性透传
  [key: string]: any;
}
```

### 组件复合模式

```typescript
// Card.tsx - 支持复合模式
interface CardProps {
  children: ReactNode;
  className?: string;
  bordered?: boolean;
}

const Card: FC<CardProps> & {
  Header: typeof CardHeader;
  Body: typeof CardBody;
  Footer: typeof CardFooter;
} = ({ children, className, bordered = true }) => {
  return <View className={`card ${bordered ? 'card-bordered' : ''} ${className || ''}`}>{children}</View>;
};

// 子组件
const CardHeader: FC<{ children: ReactNode }> = ({ children }) => <View className='card-header'>{children}</View>;

// 使用方式
<Card>
  <Card.Header>标题</Card.Header>
  <Card.Body>内容</Card.Body>
  <Card.Footer>底部</Card.Footer>
</Card>;
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
// Button.module.css
.button {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.buttonPrimary {
  background-color: var(--primary-color);
  color: white;
}

.buttonSecondary {
  background-color: var(--secondary-color);
  color: var(--text-color);
}

// Button.tsx
import styles from './Button.module.css';

export const Button: FC<ButtonProps> = ({ variant = 'primary', className, ...props }) => (
  <button className={clsx(styles.button, styles[`button${capitalize(variant)}`], className)} {...props} />
);
```

### 2. Styled Components

```typescript
import styled from 'styled-components';

const StyledButton = styled.button<{ variant: 'primary' | 'secondary' }>`
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;

  background-color: ${(props) =>
    props.variant === 'primary' ? props.theme.colors.primary : props.theme.colors.secondary};

  &:hover {
    opacity: 0.8;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;
```

## 组件测试规范

### 1. 单元测试

```typescript
// Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies correct variant styles', () => {
    render(<Button variant='secondary'>Button</Button>);
    expect(screen.getByRole('button')).toHaveClass('buttonSecondary');
  });
});
```

### 2. 集成测试

```typescript
// UserProfileCard.test.tsx
import { render, screen } from '@testing-library/react';
import { UserProfileCard } from './UserProfileCard';

const mockUser = {
  id: '1',
  name: 'John Doe',
  email: 'john@example.com',
};

describe('UserProfileCard', () => {
  it('displays user information correctly', () => {
    render(<UserProfileCard user={mockUser} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('john@example.com')).toBeInTheDocument();
  });
});
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

### 2. Storybook 故事

```typescript
// Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
  },
};
```

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

## 可访问性 (A11y)

### 1. 语义化 HTML

```typescript
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export const Modal: FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef<HTMLViewElement>(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current?.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <View className='modal-overlay' onClick={onClose}>
      <View
        className='modal'
        ref={modalRef}
        role='dialog'
        aria-modal='true'
        aria-labelledby='modal-title'
        onClick={(e) => e.stopPropagation()}>
        <h2 id='modal-title'>{title}</h2>
        <button className='modal-close' onClick={onClose} aria-label='关闭'>
          ×
        </button>
        <View className='modal-content'>{children}</View>
      </View>
    </View>
  );
};
```

### 2. 键盘导航

```typescript
const useKeyboardNavigation = (items: string[], onSelect: (item: string) => void) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
          e.preventDefault();
          onSelect(items[selectedIndex]);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items, selectedIndex, onSelect]);

  return selectedIndex;
};
```

## 最佳实践总结

1. **保持组件小而专注**：单个组件最好不要超过 200 行
2. **使用 TypeScript 严格模式**：确保类型安全
3. **编写全面的测试**：包括单元测试和集成测试
4. **考虑性能和可访问性**：使用 React.memo、语义化 HTML 等
5. **提供清晰的文档**：包括 JSDoc 注释和 Storybook 故事
6. **遵循命名约定**：使用描述性的组件名和属性名
7. **合理使用 children**：提供灵活的组合方式
8. **处理边界情况**：加载状态、错误状态、空数据等
