# 状态管理规范

## 状态管理架构

本项目采用 **Context + useReducer + Custom Hooks** 的状态管理模式，适用于中大型 React 应用。

### 核心原则

1. **分层管理**：全局状态、页面状态、组件状态分离
2. **单向数据流**：状态只能通过 actions 修改
3. **不可变性**：状态更新必须返回新的状态对象
4. **类型安全**：使用 TypeScript 确保状态类型安全

## 全局状态管理

### 状态结构

```typescript
interface GlobalState {
  user: UserState;
  app: AppState;
  auth: AuthState;
  theme: ThemeState;
}
```

### Context 设计

```typescript
// contexts/GlobalContext.tsx
interface GlobalContextType {
  state: GlobalState;
  dispatch: Dispatch<GlobalAction>;
  actions: {
    user: UserActions;
    app: AppActions;
    auth: AuthActions;
  };
}

export const GlobalContext = createContext<GlobalContextType | null>(null);
```

### Action 定义

```typescript
// types/actions.ts
export type GlobalAction =
  | UserAction
  | AppAction
  | AuthAction
  | ThemeAction;

// 用户相关 actions
export type UserAction =
  | { type: 'SET_USER'; payload: User }
  | { type: 'UPDATE_PROFILE'; payload: Partial<User> }
  | { type: 'CLEAR_USER' };

// 应用相关 actions
export type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_NOTIFICATION'; payload: Notification }
  | { type: 'CLEAR_NOTIFICATION' };
```

## Reducer 设计

### 主 Reducer

```typescript
// reducers/globalReducer.ts
export const globalReducer = (
  state: GlobalState,
  action: GlobalAction
): GlobalState => {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: { ...state.user, ...action.payload } };
    case 'SET_LOADING':
      return { ...state, app: { ...state.app, loading: action.payload } };
    default:
      return state;
  }
};
```

### 组合 Reducers

```typescript
// 使用 combineReducers 组合多个 reducer
import { combineReducers } from '@/utils/combineReducers';

export const rootReducer = combineReducers({
  user: userReducer,
  app: appReducer,
  auth: authReducer,
  theme: themeReducer,
});
```

## Custom Hooks

### 全局状态 Hook

```typescript
// hooks/useGlobalState.ts
export const useGlobalState = () => {
  const context = useContext(GlobalContext);
  if (!context) {
    throw new Error('useGlobalState must be used within GlobalProvider');
  }
  return context;
};
```

### 专用 Hooks

```typescript
// hooks/useAuth.ts
export const useAuth = () => {
  const { state, dispatch, actions } = useGlobalState();

  const login = useCallback(async (credentials: LoginCredentials) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const user = await authService.login(credentials);
      dispatch({ type: 'SET_USER', payload: user });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      dispatch({ type: 'SET_LOADING', payload: false });
      throw error;
    }
  }, [dispatch]);

  return {
    user: state.user,
    loading: state.app.loading,
    login,
    logout: () => dispatch({ type: 'CLEAR_USER' }),
  };
};
```

## 本地状态管理

### 页面级状态

```typescript
// 使用 useReducer 管理复杂页面状态
interface PageState {
  data: any[];
  loading: boolean;
  error: string | null;
  filters: FilterState;
}

const pageReducer = (state: PageState, action: PageAction): PageState => {
  // reducer logic
};

// 在组件中使用
const [state, dispatch] = useReducer(pageReducer, initialPageState);
```

### 组件级状态

```typescript
// 简单状态使用 useState
const [isOpen, setIsOpen] = useState(false);
const [selectedItem, setSelectedItem] = useState<string | null>(null);

// 复杂对象状态使用 useReducer
const [formState, formDispatch] = useReducer(formReducer, initialFormState);
```

## 状态持久化

### LocalStorage 集成

```typescript
// hooks/usePersistedState.ts
export const usePersistedState = <T>(
  key: string,
  initialValue: T
): [T, Dispatch<SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setPersistedState = (value: T) => {
    try {
      setState(value);
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [state, setPersistedState];
};
```

## 异步状态管理

### 数据获取 Hook

```typescript
// hooks/useAsyncData.ts
export const useAsyncData = <T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) => {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await fetcher();
        if (isMounted) setData(result);
      } catch (err) {
        if (isMounted) setError(err.message);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    return () => { isMounted = false; };
  }, dependencies);

  return { data, loading, error, refetch: () => fetchData() };
};
```

## 最佳实践

### 性能优化

1. **使用 useMemo 缓存计算结果**
2. **使用 useCallback 稳定函数引用**
3. **合理拆分 Context，避免不必要的重渲染**
4. **使用 React.memo 优化组件渲染**

### 错误处理

```typescript
// 统一错误处理
export const useErrorHandler = () => {
  const dispatch = useGlobalDispatch();

  return useCallback((error: Error) => {
    dispatch({
      type: 'SET_NOTIFICATION',
      payload: { type: 'error', message: error.message }
    });
  }, [dispatch]);
};
```

### 类型安全

```typescript
// 使用 TypeScript 工具类型确保类型安全
type StateShape = {
  [K in keyof GlobalState]: {
    current: GlobalState[K];
    previous?: GlobalState[K];
  }
};
```

## 状态管理工具

### 调试工具

```typescript
// 开发环境状态调试
if (process.env.NODE_ENV === 'development') {
  (window as any).__REDUX_DEVTOOLS_EXTENSION__?.connect();
}
```

### 状态选择器

```typescript
// utils/selectors.ts
export const selectUser = (state: GlobalState) => state.user;
export const selectAuthStatus = (state: GlobalState) => state.auth.isAuthenticated;
export const selectTheme = (state: GlobalState) => state.theme.mode;
```

## 注意事项

1. 避免在状态中存储计算结果，使用 Selector 代替
2. 保持状态结构扁平，避免深层嵌套
3. 使用 TypeScript 严格模式确保类型安全
4. 为复杂状态编写单元测试
5. 定期清理未使用的状态字段