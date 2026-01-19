# 前端開發最佳實務

本文件定義前端開發的編碼規範、設計原則與最佳實務。

## 目錄

- [編碼規範](#編碼規範)
- [React 最佳實務](#react-最佳實務)
- [TypeScript 規範](#typescript-規範)
- [樣式指南](#樣式指南)
- [效能優化](#效能優化)
- [測試策略](#測試策略)
- [無障礙設計](#無障礙設計)

---

## 編碼規範

### 基本格式

```typescript
// ✅ 使用 4-space indent
function MyComponent() {
    const [count, setCount] = useState(0);

    return (
        <div>
            <p>Count: {count}</p>
        </div>
    );
}

// ❌ 不要使用 2-space 或 tab
function BadComponent() {
  const [count, setCount] = useState(0);
  return <div>...</div>;
}
```

### 檔案命名

```
✅ 好的命名
components/UserCard.tsx          # Component 使用 PascalCase
utils/formatDate.ts              # 工具函式使用 camelCase
hooks/useAuth.ts                 # Hooks 使用 use 前綴
types/User.ts                    # 型別定義使用 PascalCase

❌ 不好的命名
components/user-card.tsx
utils/FormatDate.ts
hooks/auth.ts
```

### Import 順序

```typescript
// 1. React 相關
import React, { useState, useEffect } from 'react';

// 2. 第三方套件
import axios from 'axios';
import { format } from 'date-fns';

// 3. 內部 components
import { Button } from '@/components/Button';
import { Card } from '@/components/Card';

// 4. Hooks
import { useAuth } from '@/hooks/useAuth';

// 5. Utils
import { formatDate } from '@/utils/formatDate';

// 6. Types
import type { User } from '@/types/User';

// 7. Styles
import './UserCard.css';
```

---

## React 最佳實務

### Component 結構

```typescript
// ✅ 標準 Component 結構
interface UserCardProps {
    user: User;
    onEdit?: (user: User) => void;
    className?: string;
}

export function UserCard({ user, onEdit, className }: UserCardProps) {
    // 1. Hooks
    const [isEditing, setIsEditing] = useState(false);
    const { hasPermission } = useAuth();

    // 2. Derived state
    const canEdit = hasPermission('user:edit') && onEdit !== undefined;

    // 3. Event handlers
    const handleEdit = () => {
        setIsEditing(true);
    };

    const handleSave = (updatedUser: User) => {
        onEdit?.(updatedUser);
        setIsEditing(false);
    };

    // 4. Effects
    useEffect(() => {
        console.log('User changed:', user.name);
    }, [user]);

    // 5. Early returns
    if (!user) {
        return null;
    }

    // 6. Render
    return (
        <div className={className}>
            {/* ... */}
        </div>
    );
}
```

### Props 定義

```typescript
// ✅ 使用 interface（優先）
interface ButtonProps {
    children: React.ReactNode;
    onClick: () => void;
    variant?: 'primary' | 'secondary';
    disabled?: boolean;
}

// ✅ 選填 props 使用 ?
// ✅ 提供合理的預設值
export function Button({
    children,
    onClick,
    variant = 'primary',
    disabled = false
}: ButtonProps) {
    // ...
}

// ❌ 不要使用 any
interface BadProps {
    data: any;  // 不好！
}
```

### State 管理

```typescript
// ✅ 善用 useState
const [user, setUser] = useState<User | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

// ✅ 複雜 state 使用 useReducer
type State = {
    users: User[];
    loading: boolean;
    error: string | null;
};

type Action =
    | { type: 'FETCH_START' }
    | { type: 'FETCH_SUCCESS'; payload: User[] }
    | { type: 'FETCH_ERROR'; payload: string };

function reducer(state: State, action: Action): State {
    switch (action.type) {
        case 'FETCH_START':
            return { ...state, loading: true, error: null };
        case 'FETCH_SUCCESS':
            return { ...state, loading: false, users: action.payload };
        case 'FETCH_ERROR':
            return { ...state, loading: false, error: action.payload };
        default:
            return state;
    }
}

// ❌ 避免過多 useState
const [name, setName] = useState('');
const [email, setEmail] = useState('');
const [age, setAge] = useState(0);
// ... 10 個 useState
// 考慮使用 useReducer 或 表單庫
```

### Custom Hooks

```typescript
// ✅ 封裝可重用邏輯
export function useUser(userId: string) {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    useEffect(() => {
        let cancelled = false;

        async function fetchUser() {
            try {
                setLoading(true);
                const data = await api.getUser(userId);
                if (!cancelled) {
                    setUser(data);
                }
            } catch (err) {
                if (!cancelled) {
                    setError(err as Error);
                }
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        }

        fetchUser();

        return () => {
            cancelled = true;
        };
    }, [userId]);

    return { user, loading, error };
}

// 使用
function UserProfile({ userId }: { userId: string }) {
    const { user, loading, error } = useUser(userId);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} />;
    if (!user) return null;

    return <div>{user.name}</div>;
}
```

---

## TypeScript 規範

### 嚴格模式

```json
// tsconfig.json
{
    "compilerOptions": {
        "strict": true,
        "noImplicitAny": true,
        "strictNullChecks": true,
        "strictFunctionTypes": true,
        "noUnusedLocals": true,
        "noUnusedParameters": true
    }
}
```

### 型別定義

```typescript
// ✅ 明確定義型別
interface User {
    id: string;
    name: string;
    email: string;
    role: 'admin' | 'user';
    createdAt: Date;
}

// ✅ 使用 type 定義 union 或複雜型別
type Status = 'idle' | 'loading' | 'success' | 'error';
type Result<T> = { success: true; data: T } | { success: false; error: string };

// ✅ 為 API 回應定義型別
interface ApiResponse<T> {
    data: T;
    message: string;
    status: number;
}

// ❌ 避免使用 any
function processData(data: any) {  // 不好！
    return data.foo.bar;
}

// ✅ 使用 unknown 並進行型別檢查
function processData(data: unknown) {
    if (typeof data === 'object' && data !== null && 'foo' in data) {
        // 型別安全的處理
    }
}
```

### Const 正確性

```typescript
// ✅ 優先使用 const
const API_URL = 'https://api.example.com';
const MAX_RETRIES = 3;

// ✅ 需要重新賦值才用 let
let retryCount = 0;
retryCount++;

// ❌ 避免使用 var
var foo = 'bar';  // 不好！

// ✅ 物件和陣列也用 const（內容可變，但引用不變）
const user = { name: 'John' };
user.name = 'Jane';  // OK

const numbers = [1, 2, 3];
numbers.push(4);  // OK
```

---

## 樣式指南

### Tailwind CSS

```typescript
// ✅ 使用 Tailwind 工具類別
<button className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Click me
</button>

// ✅ 複雜樣式使用 cn() 合併
import { cn } from '@/utils/cn';

<button
    className={cn(
        "px-4 py-2 rounded",
        variant === 'primary' && "bg-blue-500 text-white",
        variant === 'secondary' && "bg-gray-200 text-gray-800",
        disabled && "opacity-50 cursor-not-allowed"
    )}
>
    {children}
</button>

// ✅ 抽取重複樣式為 component
export function Card({ children, className }: CardProps) {
    return (
        <div className={cn("rounded-lg border bg-white p-6 shadow-sm", className)}>
            {children}
        </div>
    );
}
```

### 響應式設計

```typescript
// ✅ Mobile-first approach
<div className="
    w-full           // 手機：全寬
    md:w-1/2         // 平板：半寬
    lg:w-1/3         // 桌面：三分之一

    p-4              // 手機：padding 4
    md:p-6           // 平板：padding 6
    lg:p-8           // 桌面：padding 8
">
    {/* ... */}
</div>

// ✅ 使用 Tailwind breakpoints
// sm: 640px
// md: 768px
// lg: 1024px
// xl: 1280px
// 2xl: 1536px
```

---

## 效能優化

### React.memo

```typescript
// ✅ 對昂貴的 component 使用 memo
export const UserCard = React.memo(function UserCard({ user }: UserCardProps) {
    // 昂貴的渲染邏輯
    return <div>...</div>;
});

// ✅ 自訂比較函式
export const UserList = React.memo(
    function UserList({ users }: UserListProps) {
        return <div>...</div>;
    },
    (prevProps, nextProps) => {
        // 只在 users 的 length 和 id 改變時重新渲染
        return prevProps.users.length === nextProps.users.length &&
               prevProps.users.every((user, i) => user.id === nextProps.users[i].id);
    }
);
```

### useMemo 和 useCallback

```typescript
// ✅ 昂貴計算使用 useMemo
function UserList({ users }: { users: User[] }) {
    const sortedUsers = useMemo(() => {
        return [...users].sort((a, b) => a.name.localeCompare(b.name));
    }, [users]);

    return <div>{/* ... */}</div>;
}

// ✅ 傳給子 component 的函式使用 useCallback
function ParentComponent() {
    const [count, setCount] = useState(0);

    const handleClick = useCallback(() => {
        setCount(c => c + 1);
    }, []);

    return <ChildComponent onClick={handleClick} />;
}
```

### Code Splitting

```typescript
// ✅ 使用 lazy loading
import { lazy, Suspense } from 'react';

const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
    return (
        <Suspense fallback={<LoadingSpinner />}>
            <HeavyComponent />
        </Suspense>
    );
}
```

---

## 測試策略

### 單元測試

```typescript
// UserCard.test.tsx
import { render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

describe('UserCard', () => {
    const mockUser = {
        id: '1',
        name: 'John Doe',
        email: 'john@example.com',
        role: 'user' as const,
        createdAt: new Date('2024-01-01')
    };

    it('should render user information', () => {
        render(<UserCard user={mockUser} />);

        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', () => {
        const onEdit = vi.fn();
        render(<UserCard user={mockUser} onEdit={onEdit} />);

        const editButton = screen.getByRole('button', { name: /edit/i });
        editButton.click();

        expect(onEdit).toHaveBeenCalledWith(mockUser);
    });
});
```

---

## 無障礙設計

### 語義化 HTML

```typescript
// ✅ 使用語義化標籤
<nav>
    <ul>
        <li><a href="/home">Home</a></li>
    </ul>
</nav>

<main>
    <article>
        <h1>Title</h1>
        <p>Content</p>
    </article>
</main>

// ❌ 避免過度使用 div
<div>
    <div>
        <div>Navigation</div>
    </div>
</div>
```

### ARIA 屬性

```typescript
// ✅ 提供 aria-label
<button aria-label="關閉對話框" onClick={onClose}>
    <XIcon />
</button>

// ✅ 使用 role 和 aria-* 屬性
<div role="alert" aria-live="polite">
    {errorMessage}
</div>
```

---

*最後更新：2025-11-19*
