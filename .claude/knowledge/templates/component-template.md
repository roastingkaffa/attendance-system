# React Component 模板

可重用的 React Component 模板與範例。

## 目錄

- [基本 Component](#基本-component)
- [表單 Component](#表單-component)
- [列表 Component](#列表-component)
- [Modal Component](#modal-component)
- [Custom Hook](#custom-hook)

---

## 基本 Component

### 簡單的 UI Component

```typescript
// components/Button/Button.tsx
import React from 'react';
import { cn } from '@/utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
    size?: 'sm' | 'md' | 'lg';
    loading?: boolean;
    children: React.ReactNode;
}

export function Button({
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    ...props
}: ButtonProps) {
    const baseStyles = 'inline-flex items-center justify-center rounded font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

    const variantStyles = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
        secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
        outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-500',
        ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-500'
    };

    const sizeStyles = {
        sm: 'px-3 py-1.5 text-sm',
        md: 'px-4 py-2 text-base',
        lg: 'px-6 py-3 text-lg'
    };

    return (
        <button
            className={cn(
                baseStyles,
                variantStyles[variant],
                sizeStyles[size],
                className
            )}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <svg
                    className="mr-2 h-4 w-4 animate-spin"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                >
                    <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                    />
                    <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                </svg>
            )}
            {children}
        </button>
    );
}
```

### 使用範例

```typescript
// pages/Example.tsx
import { Button } from '@/components/Button/Button';

export function ExamplePage() {
    const handleClick = () => {
        console.log('Button clicked');
    };

    return (
        <div className="space-y-4">
            <Button onClick={handleClick}>
                Primary Button
            </Button>

            <Button variant="secondary" size="lg">
                Secondary Large
            </Button>

            <Button variant="outline" loading>
                Loading...
            </Button>

            <Button variant="ghost" disabled>
                Disabled
            </Button>
        </div>
    );
}
```

### 單元測試

```typescript
// components/Button/Button.test.tsx
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { Button } from './Button';

describe('Button', () => {
    it('renders children correctly', () => {
        render(<Button>Click me</Button>);
        expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('calls onClick when clicked', async () => {
        const onClick = vi.fn();
        render(<Button onClick={onClick}>Click me</Button>);

        await userEvent.click(screen.getByText('Click me'));
        expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('disables button when loading', () => {
        render(<Button loading>Click me</Button>);
        expect(screen.getByRole('button')).toBeDisabled();
    });

    it('applies correct variant styles', () => {
        const { rerender } = render(<Button variant="primary">Button</Button>);
        let button = screen.getByRole('button');
        expect(button).toHaveClass('bg-blue-600');

        rerender(<Button variant="secondary">Button</Button>);
        button = screen.getByRole('button');
        expect(button).toHaveClass('bg-gray-600');
    });
});
```

---

## 表單 Component

### 使用 React Hook Form

```typescript
// components/UserForm/UserForm.tsx
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/Button/Button';

const UserFormSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    age: z.number().int().min(18, 'Must be at least 18').max(120),
    role: z.enum(['user', 'admin']).default('user')
});

type UserFormData = z.infer<typeof UserFormSchema>;

export interface UserFormProps {
    initialData?: Partial<UserFormData>;
    onSubmit: (data: UserFormData) => Promise<void>;
    loading?: boolean;
}

export function UserForm({ initialData, onSubmit, loading = false }: UserFormProps) {
    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting }
    } = useForm<UserFormData>({
        resolver: zodResolver(UserFormSchema),
        defaultValues: initialData
    });

    const isLoading = loading || isSubmitting;

    return (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Name
                </label>
                <input
                    {...register('name')}
                    type="text"
                    id="name"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                </label>
                <input
                    {...register('email')}
                    type="email"
                    id="email"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="age" className="block text-sm font-medium text-gray-700">
                    Age
                </label>
                <input
                    {...register('age', { valueAsNumber: true })}
                    type="number"
                    id="age"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {errors.age && (
                    <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
                )}
            </div>

            <div>
                <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                    Role
                </label>
                <select
                    {...register('role')}
                    id="role"
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                </select>
                {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                )}
            </div>

            <Button type="submit" loading={isLoading} className="w-full">
                {initialData ? 'Update User' : 'Create User'}
            </Button>
        </form>
    );
}
```

---

## 列表 Component

### 帶分頁的列表

```typescript
// components/UserList/UserList.tsx
import React, { useState } from 'react';
import { Button } from '@/components/Button/Button';

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'user' | 'admin';
}

export interface UserListProps {
    users: User[];
    loading?: boolean;
    error?: Error | null;
    page: number;
    pageSize: number;
    total: number;
    onPageChange: (page: number) => void;
    onEdit?: (user: User) => void;
    onDelete?: (userId: string) => void;
}

export function UserList({
    users,
    loading = false,
    error = null,
    page,
    pageSize,
    total,
    onPageChange,
    onEdit,
    onDelete
}: UserListProps) {
    const totalPages = Math.ceil(total / pageSize);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="rounded-md bg-red-50 p-4">
                <p className="text-sm text-red-800">
                    Error: {error.message}
                </p>
            </div>
        );
    }

    if (users.length === 0) {
        return (
            <div className="rounded-md bg-gray-50 p-8 text-center">
                <p className="text-gray-600">No users found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Table */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Name
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                Role
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                        {users.map((user) => (
                            <tr key={user.id} className="hover:bg-gray-50">
                                <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                    {user.name}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    {user.email}
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                    <span
                                        className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                                            user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-800'
                                                : 'bg-green-100 text-green-800'
                                        }`}
                                    >
                                        {user.role}
                                    </span>
                                </td>
                                <td className="whitespace-nowrap px-6 py-4 text-right text-sm font-medium">
                                    <div className="flex justify-end space-x-2">
                                        {onEdit && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onEdit(user)}
                                            >
                                                Edit
                                            </Button>
                                        )}
                                        {onDelete && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => onDelete(user.id)}
                                            >
                                                Delete
                                            </Button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{(page - 1) * pageSize + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(page * pageSize, total)}</span> of{' '}
                    <span className="font-medium">{total}</span> results
                </p>

                <div className="flex space-x-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page - 1)}
                        disabled={page === 1}
                    >
                        Previous
                    </Button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                        <Button
                            key={pageNum}
                            variant={pageNum === page ? 'primary' : 'outline'}
                            size="sm"
                            onClick={() => onPageChange(pageNum)}
                        >
                            {pageNum}
                        </Button>
                    ))}

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page + 1)}
                        disabled={page === totalPages}
                    >
                        Next
                    </Button>
                </div>
            </div>
        </div>
    );
}
```

---

## Modal Component

```typescript
// components/Modal/Modal.tsx
import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';

export interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    size?: 'sm' | 'md' | 'lg' | 'xl';
}

export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const sizeStyles = {
        sm: 'max-w-md',
        md: 'max-w-lg',
        lg: 'max-w-2xl',
        xl: 'max-w-4xl'
    };

    return createPortal(
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={(e) => {
                if (e.target === e.currentTarget) {
                    onClose();
                }
            }}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black bg-opacity-50" />

            {/* Modal */}
            <div
                ref={modalRef}
                className={cn(
                    'relative w-full rounded-lg bg-white shadow-xl',
                    sizeStyles[size],
                    'mx-4'
                )}
            >
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between border-b px-6 py-4">
                        <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                        <button
                            onClick={onClose}
                            className="rounded-md p-1 hover:bg-gray-100"
                            aria-label="Close"
                        >
                            <svg
                                className="h-6 w-6 text-gray-600"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            </svg>
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className="px-6 py-4">{children}</div>
            </div>
        </div>,
        document.body
    );
}
```

---

## Custom Hook

```typescript
// hooks/useApi.ts
import { useState, useEffect, useCallback } from 'react';

export interface UseApiOptions<T> {
    onSuccess?: (data: T) => void;
    onError?: (error: Error) => void;
    immediate?: boolean;
}

export function useApi<T>(
    apiFunction: () => Promise<T>,
    options: UseApiOptions<T> = {}
) {
    const { onSuccess, onError, immediate = true } = options;

    const [data, setData] = useState<T | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const execute = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const result = await apiFunction();
            setData(result);
            onSuccess?.(result);

            return result;
        } catch (err) {
            const error = err as Error;
            setError(error);
            onError?.(error);
            throw error;
        } finally {
            setLoading(false);
        }
    }, [apiFunction, onSuccess, onError]);

    useEffect(() => {
        if (immediate) {
            execute();
        }
    }, [immediate, execute]);

    return { data, loading, error, execute };
}

// 使用範例
function UserProfile({ userId }: { userId: string }) {
    const { data: user, loading, error, execute: refetch } = useApi(
        () => api.getUser(userId),
        {
            onSuccess: (user) => {
                console.log('User loaded:', user.name);
            },
            onError: (error) => {
                console.error('Failed to load user:', error);
            }
        }
    );

    if (loading) return <div>Loading...</div>;
    if (error) return <div>Error: {error.message}</div>;
    if (!user) return null;

    return (
        <div>
            <h1>{user.name}</h1>
            <Button onClick={refetch}>Refresh</Button>
        </div>
    );
}
```

---

*最後更新：2025-11-19*
