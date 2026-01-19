# 後端開發最佳實務

本文件定義後端開發的 API 設計、安全性、錯誤處理等最佳實務。

## 目錄

- [API 設計原則](#api-設計原則)
- [請求驗證](#請求驗證)
- [錯誤處理](#錯誤處理)
- [認證與授權](#認證與授權)
- [日誌與監控](#日誌與監控)
- [效能優化](#效能優化)
- [安全性](#安全性)

---

## API 設計原則

### RESTful 設計

```typescript
// ✅ 好的 RESTful API 設計
GET    /api/users           // 取得使用者列表
GET    /api/users/:id       // 取得單一使用者
POST   /api/users           // 建立使用者
PUT    /api/users/:id       // 更新使用者（完整更新）
PATCH  /api/users/:id       // 更新使用者（部分更新）
DELETE /api/users/:id       // 刪除使用者

// ✅ 巢狀資源
GET    /api/users/:id/posts      // 取得某使用者的文章
POST   /api/users/:id/posts      // 為某使用者建立文章

// ❌ 不好的設計
GET    /api/getUsers          // 不要在 URL 中使用動詞
POST   /api/user/delete       // DELETE 操作應該用 DELETE method
GET    /api/user-list         // 使用複數形式和 camelCase
```

### Response 格式

```typescript
// ✅ 統一的成功回應格式
interface ApiResponse<T> {
    success: true;
    data: T;
    message?: string;
    meta?: {
        page: number;
        pageSize: number;
        total: number;
    };
}

// 範例
{
    "success": true,
    "data": {
        "id": "123",
        "name": "John Doe"
    },
    "message": "User created successfully"
}

// ✅ 統一的錯誤回應格式
interface ApiError {
    success: false;
    error: {
        code: string;
        message: string;
        details?: unknown;
    };
}

// 範例
{
    "success": false,
    "error": {
        "code": "VALIDATION_ERROR",
        "message": "Invalid input data",
        "details": {
            "email": "Invalid email format"
        }
    }
}
```

### 分頁

```typescript
// ✅ 使用 query parameters 進行分頁
GET /api/users?page=1&pageSize=20

// Response
{
    "success": true,
    "data": [...],
    "meta": {
        "page": 1,
        "pageSize": 20,
        "total": 100,
        "totalPages": 5
    }
}

// ✅ 或使用 cursor-based pagination（大數據集）
GET /api/users?cursor=abc123&limit=20

// Response
{
    "success": true,
    "data": [...],
    "meta": {
        "nextCursor": "def456",
        "hasMore": true
    }
}
```

### 過濾與排序

```typescript
// ✅ 使用 query parameters
GET /api/users?role=admin&status=active&sort=createdAt:desc

// ✅ 複雜查詢
GET /api/users?filter[role]=admin&filter[status]=active&sort=-createdAt

// 實作範例
app.get('/api/users', async (req, res) => {
    const { role, status, sort } = req.query;

    const query: any = {};
    if (role) query.role = role;
    if (status) query.status = status;

    const sortOptions: any = {};
    if (sort) {
        const [field, order] = sort.split(':');
        sortOptions[field] = order === 'desc' ? -1 : 1;
    }

    const users = await User.find(query).sort(sortOptions);
    res.json({ success: true, data: users });
});
```

---

## 請求驗證

### 使用 Zod 驗證

```typescript
import { z } from 'zod';

// ✅ 定義 schema
const CreateUserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    password: z.string().min(8).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
    role: z.enum(['admin', 'user']).optional().default('user'),
    age: z.number().int().min(18).max(120).optional()
});

type CreateUserInput = z.infer<typeof CreateUserSchema>;

// ✅ Middleware 進行驗證
function validate<T>(schema: z.ZodSchema<T>) {
    return (req: Request, res: Response, next: NextFunction) => {
        try {
            req.body = schema.parse(req.body);
            next();
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    error: {
                        code: 'VALIDATION_ERROR',
                        message: 'Invalid input data',
                        details: error.errors
                    }
                });
            }
            next(error);
        }
    };
}

// 使用
app.post('/api/users',
    validate(CreateUserSchema),
    async (req, res) => {
        const userData: CreateUserInput = req.body;
        // userData 已經過驗證且有型別
    }
);
```

### 驗證最佳實務

```typescript
// ✅ 驗證所有外部輸入
const UpdateUserSchema = z.object({
    name: z.string().min(2).optional(),
    email: z.string().email().optional(),
    age: z.number().int().min(18).optional()
}).refine(
    data => Object.keys(data).length > 0,
    { message: "At least one field must be provided" }
);

// ✅ 自訂驗證規則
const PasswordSchema = z.string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[a-z]/, "Password must contain lowercase letter")
    .regex(/[A-Z]/, "Password must contain uppercase letter")
    .regex(/\d/, "Password must contain number")
    .regex(/[@$!%*?&]/, "Password must contain special character");

// ✅ 驗證檔案上傳
const FileUploadSchema = z.object({
    filename: z.string(),
    mimetype: z.enum(['image/jpeg', 'image/png', 'image/gif']),
    size: z.number().max(5 * 1024 * 1024) // 5MB
});
```

---

## 錯誤處理

### 統一錯誤處理

```typescript
// ✅ 自訂錯誤類別
class AppError extends Error {
    constructor(
        public statusCode: number,
        public code: string,
        message: string,
        public details?: unknown
    ) {
        super(message);
        this.name = 'AppError';
    }
}

// 常見錯誤
class NotFoundError extends AppError {
    constructor(resource: string) {
        super(404, 'NOT_FOUND', `${resource} not found`);
    }
}

class ValidationError extends AppError {
    constructor(details: unknown) {
        super(400, 'VALIDATION_ERROR', 'Invalid input data', details);
    }
}

class UnauthorizedError extends AppError {
    constructor(message = 'Unauthorized') {
        super(401, 'UNAUTHORIZED', message);
    }
}

// ✅ 全域錯誤處理 middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error('Error:', err);

    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            success: false,
            error: {
                code: err.code,
                message: err.message,
                details: err.details
            }
        });
    }

    // 未預期的錯誤
    res.status(500).json({
        success: false,
        error: {
            code: 'INTERNAL_SERVER_ERROR',
            message: 'An unexpected error occurred'
        }
    });
});
```

### HTTP 狀態碼

```typescript
// ✅ 正確使用狀態碼
200 OK              // 成功（GET, PUT, PATCH）
201 Created         // 建立成功（POST）
204 No Content      // 刪除成功（DELETE）

400 Bad Request     // 請求格式錯誤、驗證失敗
401 Unauthorized    // 未認證
403 Forbidden       // 已認證但無權限
404 Not Found       // 資源不存在
409 Conflict        // 資源衝突（如重複的 email）
422 Unprocessable   // 語義錯誤
429 Too Many Requests // 超過速率限制

500 Internal Server Error // 伺服器錯誤
503 Service Unavailable   // 服務暫時無法使用
```

---

## 認證與授權

### JWT 認證

```typescript
import jwt from 'jsonwebtoken';

// ✅ 生成 JWT
function generateToken(userId: string, role: string): string {
    return jwt.sign(
        { userId, role },
        process.env.JWT_SECRET!,
        { expiresIn: '7d' }
    );
}

// ✅ 驗證 JWT middleware
function authenticateToken(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(' ')[1]; // "Bearer TOKEN"

    if (!token) {
        throw new UnauthorizedError('No token provided');
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET!);
        req.user = decoded;
        next();
    } catch (error) {
        throw new UnauthorizedError('Invalid token');
    }
}
```

### RBAC 授權

```typescript
// ✅ 角色定義
type Role = 'admin' | 'manager' | 'user';
type Permission = 'user:read' | 'user:write' | 'user:delete' |
                  'post:read' | 'post:write' | 'post:delete';

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

// ✅ 權限檢查 middleware
function requirePermission(...permissions: Permission[]) {
    return (req: Request, res: Response, next: NextFunction) => {
        const userRole = req.user?.role as Role;
        const userPermissions = ROLE_PERMISSIONS[userRole] || [];

        const hasPermission = permissions.every(p =>
            userPermissions.includes(p)
        );

        if (!hasPermission) {
            throw new AppError(403, 'FORBIDDEN', 'Insufficient permissions');
        }

        next();
    };
}

// 使用
app.delete('/api/users/:id',
    authenticateToken,
    requirePermission('user:delete'),
    async (req, res) => {
        // 只有有 user:delete 權限的使用者可以執行
    }
);

// ✅ 資源擁有者檢查
function requireOwnership(resourceType: 'post' | 'comment') {
    return async (req: Request, res: Response, next: NextFunction) => {
        const resourceId = req.params.id;
        const userId = req.user!.userId;
        const userRole = req.user!.role;

        // Admin 可以操作所有資源
        if (userRole === 'admin') {
            return next();
        }

        // 檢查是否為資源擁有者
        const resource = await getResource(resourceType, resourceId);
        if (resource.authorId !== userId) {
            throw new AppError(403, 'FORBIDDEN', 'Not resource owner');
        }

        next();
    };
}
```

---

## 日誌與監控

### 結構化日誌

```typescript
import winston from 'winston';

// ✅ 設定 logger
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

// ✅ 使用結構化日誌
logger.info('User created', {
    userId: user.id,
    email: user.email,
    timestamp: new Date().toISOString()
});

logger.error('Failed to create user', {
    error: error.message,
    stack: error.stack,
    input: userData
});
```

### 請求日誌

```typescript
// ✅ 記錄所有請求
app.use((req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        logger.info('HTTP Request', {
            method: req.method,
            url: req.url,
            status: res.statusCode,
            duration,
            userAgent: req.get('user-agent'),
            ip: req.ip
        });
    });

    next();
});
```

---

## 效能優化

### 快取策略

```typescript
import Redis from 'ioredis';

const redis = new Redis();

// ✅ Cache-aside pattern
async function getUser(userId: string): Promise<User> {
    // 1. 先查 cache
    const cached = await redis.get(`user:${userId}`);
    if (cached) {
        return JSON.parse(cached);
    }

    // 2. Cache miss，查資料庫
    const user = await db.users.findById(userId);

    // 3. 寫入 cache
    await redis.setex(
        `user:${userId}`,
        3600,  // TTL 1 小時
        JSON.stringify(user)
    );

    return user;
}

// ✅ Cache invalidation
async function updateUser(userId: string, data: Partial<User>) {
    const user = await db.users.update(userId, data);

    // 刪除舊的 cache
    await redis.del(`user:${userId}`);

    return user;
}
```

### 資料庫查詢優化

```typescript
// ✅ 只選取需要的欄位
const users = await db.users.find({}, {
    select: ['id', 'name', 'email']  // 不要 SELECT *
});

// ✅ 使用 index
await db.users.createIndex({ email: 1 });
await db.users.createIndex({ createdAt: -1 });

// ✅ 避免 N+1 查詢
// ❌ N+1 問題
for (const post of posts) {
    post.author = await db.users.findById(post.authorId);
}

// ✅ 使用 join 或批次查詢
const authorIds = posts.map(p => p.authorId);
const authors = await db.users.findMany({ id: { in: authorIds } });
const authorMap = new Map(authors.map(a => [a.id, a]));
posts.forEach(p => p.author = authorMap.get(p.authorId));
```

---

## 安全性

### 基本安全措施

```typescript
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

// ✅ 使用 Helmet
app.use(helmet());

// ✅ Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 分鐘
    max: 100  // 最多 100 次請求
});
app.use('/api/', limiter);

// ✅ 防止 NoSQL injection
app.use(mongoSanitize());

// ✅ CORS 設定
app.use(cors({
    origin: process.env.ALLOWED_ORIGINS?.split(','),
    credentials: true
}));
```

### 密碼處理

```typescript
import bcrypt from 'bcrypt';

// ✅ 密碼雜湊
async function hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return await bcrypt.hash(password, saltRounds);
}

// ✅ 密碼驗證
async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
}

// ❌ 絕對不要明文儲存密碼
// ❌ 不要在 log 中記錄密碼
logger.info('User login', { email, password });  // 不好！
logger.info('User login', { email });  // 好
```

---

*最後更新：2025-11-19*
