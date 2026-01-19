# API Endpoint 模板

RESTful API 端點的標準模板與範例。

## 目錄

- [基本 CRUD API](#基本-crud-api)
- [帶驗證的 API](#帶驗證的-api)
- [帶權限的 API](#帶權限的-api)
- [檔案上傳 API](#檔案上傳-api)

---

## 基本 CRUD API

### Express + TypeScript

```typescript
// routes/users.ts
import express from 'express';
import { z } from 'zod';
import { validate } from '../middleware/validate';
import * as userService from '../services/userService';

const router = express.Router();

// Validation schemas
const CreateUserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8),
    role: z.enum(['user', 'admin']).default('user')
});

const UpdateUserSchema = z.object({
    name: z.string().min(2).max(100).optional(),
    email: z.string().email().optional(),
    role: z.enum(['user', 'admin']).optional()
}).refine(data => Object.keys(data).length > 0, {
    message: 'At least one field must be provided'
});

const QuerySchema = z.object({
    page: z.string().transform(Number).pipe(z.number().int().min(1)).default('1'),
    pageSize: z.string().transform(Number).pipe(z.number().int().min(1).max(100)).default('20'),
    role: z.enum(['user', 'admin']).optional(),
    search: z.string().optional()
});

// GET /api/users - 取得使用者列表
router.get('/', validate(QuerySchema, 'query'), async (req, res, next) => {
    try {
        const { page, pageSize, role, search } = req.query;

        const result = await userService.getUsers({
            page: page as number,
            pageSize: pageSize as number,
            role: role as string | undefined,
            search: search as string | undefined
        });

        res.json({
            success: true,
            data: result.users,
            meta: {
                page: result.page,
                pageSize: result.pageSize,
                total: result.total,
                totalPages: Math.ceil(result.total / result.pageSize)
            }
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/users/:id - 取得單一使用者
router.get('/:id', async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/users - 建立使用者
router.post('/', validate(CreateUserSchema), async (req, res, next) => {
    try {
        const user = await userService.createUser(req.body);

        res.status(201).json({
            success: true,
            data: user,
            message: 'User created successfully'
        });
    } catch (error) {
        next(error);
    }
});

// PUT /api/users/:id - 更新使用者
router.put('/:id', validate(UpdateUserSchema), async (req, res, next) => {
    try {
        const user = await userService.updateUser(req.params.id, req.body);

        if (!user) {
            return res.status(404).json({
                success: false,
                error: {
                    code: 'USER_NOT_FOUND',
                    message: 'User not found'
                }
            });
        }

        res.json({
            success: true,
            data: user,
            message: 'User updated successfully'
        });
    } catch (error) {
        next(error);
    }
});

// DELETE /api/users/:id - 刪除使用者
router.delete('/:id', async (req, res, next) => {
    try {
        await userService.deleteUser(req.params.id);

        res.status(204).send();
    } catch (error) {
        next(error);
    }
});

export default router;
```

### Service Layer

```typescript
// services/userService.ts
import { db } from '../db';
import { hashPassword } from '../utils/password';
import { AppError } from '../utils/errors';
import type { User, CreateUserInput, UpdateUserInput } from '../types';

export interface GetUsersOptions {
    page: number;
    pageSize: number;
    role?: string;
    search?: string;
}

export async function getUsers(options: GetUsersOptions) {
    const { page, pageSize, role, search } = options;
    const offset = (page - 1) * pageSize;

    const query: any = { deleted_at: null };

    if (role) {
        query.role = role;
    }

    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
        ];
    }

    const [users, total] = await Promise.all([
        db.users
            .find(query)
            .skip(offset)
            .limit(pageSize)
            .sort({ created_at: -1 })
            .select('-password')
            .exec(),
        db.users.countDocuments(query)
    ]);

    return { users, total, page, pageSize };
}

export async function getUserById(id: string): Promise<User | null> {
    const user = await db.users
        .findOne({ _id: id, deleted_at: null })
        .select('-password')
        .exec();

    return user;
}

export async function createUser(data: CreateUserInput): Promise<User> {
    // 檢查 email 是否已存在
    const existingUser = await db.users.findOne({ email: data.email });
    if (existingUser) {
        throw new AppError(409, 'EMAIL_EXISTS', 'Email already exists');
    }

    // 雜湊密碼
    const hashedPassword = await hashPassword(data.password);

    // 建立使用者
    const user = await db.users.create({
        ...data,
        password: hashedPassword,
        created_at: new Date()
    });

    // 移除密碼後回傳
    const { password, ...userWithoutPassword } = user.toObject();
    return userWithoutPassword as User;
}

export async function updateUser(
    id: string,
    data: UpdateUserInput
): Promise<User | null> {
    // 如果更新 email，檢查是否重複
    if (data.email) {
        const existingUser = await db.users.findOne({
            email: data.email,
            _id: { $ne: id }
        });

        if (existingUser) {
            throw new AppError(409, 'EMAIL_EXISTS', 'Email already exists');
        }
    }

    const user = await db.users
        .findByIdAndUpdate(
            id,
            { ...data, updated_at: new Date() },
            { new: true }
        )
        .select('-password')
        .exec();

    return user;
}

export async function deleteUser(id: string): Promise<void> {
    // Soft delete
    const user = await db.users.findByIdAndUpdate(id, {
        deleted_at: new Date()
    });

    if (!user) {
        throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
    }
}
```

---

## 帶驗證的 API

### 認證 Middleware

```typescript
// middleware/auth.ts
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export interface AuthRequest extends Request {
    user?: {
        userId: string;
        email: string;
        role: string;
    };
}

export function authenticateToken(
    req: AuthRequest,
    res: Response,
    next: NextFunction
) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        throw new AppError(401, 'UNAUTHORIZED', 'No token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
        req.user = {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role
        };
        next();
    } catch (error) {
        throw new AppError(401, 'UNAUTHORIZED', 'Invalid token');
    }
}
```

### 登入 API

```typescript
// routes/auth.ts
import express from 'express';
import { z } from 'zod';
import jwt from 'jsonwebtoken';
import { validate } from '../middleware/validate';
import { verifyPassword } from '../utils/password';
import { db } from '../db';
import { AppError } from '../utils/errors';

const router = express.Router();

const LoginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(1)
});

const RegisterSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(8)
});

// POST /api/auth/login - 登入
router.post('/login', validate(LoginSchema), async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // 查詢使用者
        const user = await db.users.findOne({ email, deleted_at: null });
        if (!user) {
            throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }

        // 驗證密碼
        const isValid = await verifyPassword(password, user.password);
        if (!isValid) {
            throw new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password');
        }

        // 生成 JWT
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            }
        });
    } catch (error) {
        next(error);
    }
});

// POST /api/auth/register - 註冊
router.post('/register', validate(RegisterSchema), async (req, res, next) => {
    try {
        const { name, email, password } = req.body;

        // 檢查 email 是否已存在
        const existingUser = await db.users.findOne({ email });
        if (existingUser) {
            throw new AppError(409, 'EMAIL_EXISTS', 'Email already exists');
        }

        // 建立使用者
        const hashedPassword = await hashPassword(password);
        const user = await db.users.create({
            name,
            email,
            password: hashedPassword,
            role: 'user',
            created_at: new Date()
        });

        // 生成 JWT
        const token = jwt.sign(
            {
                userId: user._id,
                email: user.email,
                role: user.role
            },
            process.env.JWT_SECRET!,
            { expiresIn: '7d' }
        );

        res.status(201).json({
            success: true,
            data: {
                token,
                user: {
                    id: user._id,
                    name: user.name,
                    email: user.email,
                    role: user.role
                }
            },
            message: 'User registered successfully'
        });
    } catch (error) {
        next(error);
    }
});

// GET /api/auth/me - 取得目前使用者
router.get('/me', authenticateToken, async (req: AuthRequest, res, next) => {
    try {
        const user = await db.users
            .findById(req.user!.userId)
            .select('-password')
            .exec();

        if (!user) {
            throw new AppError(404, 'USER_NOT_FOUND', 'User not found');
        }

        res.json({
            success: true,
            data: user
        });
    } catch (error) {
        next(error);
    }
});

export default router;
```

---

## 帶權限的 API

### 權限 Middleware

```typescript
// middleware/permission.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from '../utils/errors';

type Permission = 'user:read' | 'user:write' | 'user:delete' |
                  'post:read' | 'post:write' | 'post:delete';

type Role = 'admin' | 'manager' | 'user';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    admin: [
        'user:read', 'user:write', 'user:delete',
        'post:read', 'post:write', 'post:delete'
    ],
    manager: [
        'user:read',
        'post:read', 'post:write', 'post:delete'
    ],
    user: [
        'post:read', 'post:write'
    ]
};

export function requirePermission(...permissions: Permission[]) {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        const userRole = req.user?.role as Role;

        if (!userRole) {
            throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
        }

        const userPermissions = ROLE_PERMISSIONS[userRole] || [];
        const hasPermission = permissions.every(p => userPermissions.includes(p));

        if (!hasPermission) {
            throw new AppError(
                403,
                'FORBIDDEN',
                'Insufficient permissions'
            );
        }

        next();
    };
}

export function requireOwnership(resourceType: 'post' | 'comment') {
    return async (req: AuthRequest, res: Response, next: NextFunction) => {
        try {
            const resourceId = req.params.id;
            const userId = req.user!.userId;
            const userRole = req.user!.role;

            // Admin 可以操作所有資源
            if (userRole === 'admin') {
                return next();
            }

            // 檢查資源擁有者
            let resource: any;
            if (resourceType === 'post') {
                resource = await db.posts.findById(resourceId);
            } else {
                resource = await db.comments.findById(resourceId);
            }

            if (!resource) {
                throw new AppError(404, 'NOT_FOUND', `${resourceType} not found`);
            }

            if (resource.author_id.toString() !== userId) {
                throw new AppError(403, 'FORBIDDEN', 'Not resource owner');
            }

            next();
        } catch (error) {
            next(error);
        }
    };
}
```

### 使用權限的 API

```typescript
// routes/posts.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requirePermission, requireOwnership } from '../middleware/permission';

const router = express.Router();

// 所有人都可以讀取
router.get('/', async (req, res, next) => {
    // Public API
});

// 需要登入才能建立
router.post('/',
    authenticateToken,
    requirePermission('post:write'),
    async (req, res, next) => {
        // Create post
    }
);

// 只有作者或 admin 可以更新
router.put('/:id',
    authenticateToken,
    requirePermission('post:write'),
    requireOwnership('post'),
    async (req, res, next) => {
        // Update post
    }
);

// 只有 admin 或 manager 可以刪除
router.delete('/:id',
    authenticateToken,
    requirePermission('post:delete'),
    async (req, res, next) => {
        // Delete post
    }
);

export default router;
```

---

## 檔案上傳 API

```typescript
// routes/upload.ts
import express from 'express';
import multer from 'multer';
import { z } from 'zod';
import { authenticateToken } from '../middleware/auth';
import { AppError } from '../utils/errors';

const router = express.Router();

// 設定 Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB
    },
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];

        if (!allowedTypes.includes(file.mimetype)) {
            cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only images are allowed'));
            return;
        }

        cb(null, true);
    }
});

// POST /api/upload - 上傳檔案
router.post('/',
    authenticateToken,
    upload.single('file'),
    async (req, res, next) => {
        try {
            if (!req.file) {
                throw new AppError(400, 'NO_FILE', 'No file uploaded');
            }

            // 儲存檔案資訊到資料庫
            const file = await db.files.create({
                filename: req.file.filename,
                originalname: req.file.originalname,
                mimetype: req.file.mimetype,
                size: req.file.size,
                path: req.file.path,
                user_id: req.user!.userId,
                created_at: new Date()
            });

            res.status(201).json({
                success: true,
                data: {
                    id: file._id,
                    filename: file.filename,
                    url: `/uploads/${file.filename}`,
                    size: file.size
                },
                message: 'File uploaded successfully'
            });
        } catch (error) {
            next(error);
        }
    }
);

export default router;
```

---

*最後更新：2025-11-19*
