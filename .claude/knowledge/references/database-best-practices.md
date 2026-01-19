# 資料庫最佳實務

本文件定義資料庫設計、Migration、查詢優化等最佳實務。

## 目錄

- [Schema 設計原則](#schema-設計原則)
- [Migration 策略](#migration-策略)
- [索引設計](#索引設計)
- [查詢優化](#查詢優化)
- [資料完整性](#資料完整性)
- [效能監控](#效能監控)

---

## Schema 設計原則

### 命名規範

```sql
-- ✅ 好的命名
-- 表格：複數、snake_case
CREATE TABLE users (...);
CREATE TABLE blog_posts (...);

-- 欄位：單數、snake_case
id, user_id, created_at, is_active

-- 索引：有意義的名稱
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_posts_author_created ON blog_posts(author_id, created_at);

-- ❌ 不好的命名
CREATE TABLE User (...);          -- 應該用複數
CREATE TABLE BlogPost (...);      -- 應該用 snake_case
id, userId, CreatedAt             -- 不一致的命名
CREATE INDEX index1 ON users(...); -- 無意義的名稱
```

### 資料類型選擇

```sql
-- ✅ 正確的資料類型

-- ID：優先使用 UUID 或 BIGINT
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
id BIGSERIAL PRIMARY KEY,

-- 字串：依長度選擇
name VARCHAR(100),          -- 已知長度上限
email VARCHAR(255),         -- 標準長度
description TEXT,           -- 無長度限制

-- 數字
age INT,                    -- 整數
price DECIMAL(10, 2),       -- 金額（精確）
rating FLOAT,               -- 評分（可接受誤差）

-- 布林值
is_active BOOLEAN DEFAULT true,

-- 時間
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP WITH TIME ZONE,
deleted_at TIMESTAMP WITH TIME ZONE,  -- Soft delete

-- JSON
metadata JSONB,             -- 使用 JSONB（PostgreSQL）

-- ❌ 常見錯誤
age VARCHAR(10),            -- 應該用 INT
price FLOAT,                -- 金額應該用 DECIMAL
is_active VARCHAR(5),       -- 應該用 BOOLEAN
created_at VARCHAR(50),     -- 應該用 TIMESTAMP
```

### 關聯設計

```sql
-- ✅ 一對多關係
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE posts (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL,
    title VARCHAR(255) NOT NULL,
    content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_author_id ON posts(author_id);

-- ✅ 多對多關係（透過中間表）
CREATE TABLE students (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE courses (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

CREATE TABLE student_courses (
    student_id UUID NOT NULL,
    course_id UUID NOT NULL,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    grade INT,

    PRIMARY KEY (student_id, course_id),
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE INDEX idx_student_courses_student ON student_courses(student_id);
CREATE INDEX idx_student_courses_course ON student_courses(course_id);
```

### 正規化

```sql
-- ✅ 第三正規化（3NF）

-- ❌ 未正規化
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_name VARCHAR(100),
    customer_email VARCHAR(255),
    customer_phone VARCHAR(20),
    product_name VARCHAR(255),
    product_price DECIMAL(10, 2),
    quantity INT
);

-- ✅ 正規化後
CREATE TABLE customers (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20)
);

CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL
);

CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE order_items (
    id UUID PRIMARY KEY,
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    quantity INT NOT NULL,
    unit_price DECIMAL(10, 2) NOT NULL,

    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id)
);
```

---

## Migration 策略

### Migration 命名

```
✅ 好的命名
20250119120000_create_users_table.sql
20250119120100_add_email_to_users.sql
20250119120200_create_posts_table.sql
20250119120300_add_index_to_posts_author_id.sql

格式：{timestamp}_{description}.sql
```

### 零停機 Migration

```sql
-- ✅ 範例：新增 NOT NULL 欄位（零停機）

-- Phase 1: 新增欄位（nullable）
ALTER TABLE users ADD COLUMN status VARCHAR(20);

-- Phase 2: 填充預設值（分批執行）
UPDATE users SET status = 'active' WHERE status IS NULL;
-- 建議使用 LIMIT 分批更新：
-- UPDATE users SET status = 'active' WHERE status IS NULL LIMIT 1000;

-- Phase 3: 新增 NOT NULL 約束
ALTER TABLE users ALTER COLUMN status SET NOT NULL;

-- Phase 4: 新增預設值
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';
```

### 修改欄位類型

```sql
-- ✅ 安全的類型轉換

-- Phase 1: 新增新欄位
ALTER TABLE users ADD COLUMN birth_date_new DATE;

-- Phase 2: 資料轉換與驗證
UPDATE users
SET birth_date_new = TO_DATE(birth_date_old, 'YYYY-MM-DD')
WHERE birth_date_old IS NOT NULL
  AND birth_date_old ~ '^\d{4}-\d{2}-\d{2}$';

-- Phase 3: 驗證資料
SELECT COUNT(*) FROM users WHERE birth_date_old IS NOT NULL AND birth_date_new IS NULL;
-- 如果有資料轉換失敗，需要手動處理

-- Phase 4: 刪除舊欄位，重命名新欄位
ALTER TABLE users DROP COLUMN birth_date_old;
ALTER TABLE users RENAME COLUMN birth_date_new TO birth_date;
```

### Rollback Script

```sql
-- ✅ 每個 migration 都要有 rollback

-- Migration (up)
-- 20250119120000_add_status_to_users.up.sql
ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'active';
CREATE INDEX idx_users_status ON users(status);

-- Rollback (down)
-- 20250119120000_add_status_to_users.down.sql
DROP INDEX IF EXISTS idx_users_status;
ALTER TABLE users DROP COLUMN IF EXISTS status;
```

---

## 索引設計

### 何時建立索引

```sql
-- ✅ 需要索引的情況

-- 1. Primary Key（自動建立）
CREATE TABLE users (
    id UUID PRIMARY KEY  -- 自動建立索引
);

-- 2. Foreign Key
CREATE INDEX idx_posts_author_id ON posts(author_id);

-- 3. 頻繁查詢的欄位
CREATE INDEX idx_users_email ON users(email);

-- 4. WHERE 條件常用的欄位
-- SELECT * FROM posts WHERE status = 'published';
CREATE INDEX idx_posts_status ON posts(status);

-- 5. ORDER BY 常用的欄位
-- SELECT * FROM posts ORDER BY created_at DESC;
CREATE INDEX idx_posts_created_at ON posts(created_at DESC);

-- 6. 組合查詢
-- SELECT * FROM posts WHERE author_id = ? AND status = 'published' ORDER BY created_at DESC;
CREATE INDEX idx_posts_author_status_created ON posts(author_id, status, created_at DESC);
```

### 索引類型

```sql
-- ✅ B-tree 索引（預設，適合大多數情況）
CREATE INDEX idx_users_email ON users(email);

-- ✅ 部分索引（只索引部分資料）
CREATE INDEX idx_posts_published ON posts(created_at)
WHERE status = 'published';

-- ✅ 唯一索引
CREATE UNIQUE INDEX idx_users_email_unique ON users(email);

-- ✅ 表達式索引
CREATE INDEX idx_users_email_lower ON users(LOWER(email));

-- ✅ GIN 索引（用於 JSONB、全文搜尋）
CREATE INDEX idx_products_metadata ON products USING GIN (metadata);

-- ✅ 全文搜尋索引
CREATE INDEX idx_posts_content_fts ON posts USING GIN (to_tsvector('english', content));
```

### 複合索引順序

```sql
-- ✅ 正確的複合索引順序
-- 查詢：WHERE category = ? AND price > ? ORDER BY created_at DESC

-- 規則：等值條件 > 範圍條件 > 排序欄位
CREATE INDEX idx_products_category_price_created
ON products(category, price, created_at DESC);

-- ❌ 錯誤的順序
CREATE INDEX idx_products_wrong
ON products(created_at, price, category);  -- 效率較差
```

### 索引維護

```sql
-- ✅ 檢查未使用的索引
SELECT
    schemaname,
    tablename,
    indexname,
    idx_scan as index_scans
FROM pg_stat_user_indexes
WHERE idx_scan = 0
  AND indexname NOT LIKE 'pg_toast%'
ORDER BY pg_relation_size(indexrelid) DESC;

-- ✅ 檢查索引大小
SELECT
    tablename,
    indexname,
    pg_size_pretty(pg_relation_size(indexrelid)) as index_size
FROM pg_stat_user_indexes
ORDER BY pg_relation_size(indexrelid) DESC;

-- ✅ 重建索引（如有碎片化）
REINDEX INDEX idx_users_email;
REINDEX TABLE users;
```

---

## 查詢優化

### 使用 EXPLAIN

```sql
-- ✅ 分析查詢計畫
EXPLAIN ANALYZE
SELECT *
FROM posts
WHERE author_id = '123'
  AND status = 'published'
ORDER BY created_at DESC
LIMIT 10;

-- 關注以下指標：
-- - Seq Scan（全表掃描）→ 考慮加索引
-- - Index Scan（索引掃描）→ 好
-- - Execution Time（執行時間）
-- - Planning Time（規劃時間）
```

### N+1 查詢問題

```sql
-- ❌ N+1 問題（在應用層）
-- 1 次查詢 + N 次查詢
posts = SELECT * FROM posts LIMIT 10;
for each post:
    author = SELECT * FROM users WHERE id = post.author_id;

-- ✅ 使用 JOIN
SELECT
    posts.*,
    users.name as author_name,
    users.email as author_email
FROM posts
JOIN users ON posts.author_id = users.id
LIMIT 10;

-- ✅ 或使用 IN 查詢（兩次查詢）
posts = SELECT * FROM posts LIMIT 10;
author_ids = [post.author_id for post in posts];
authors = SELECT * FROM users WHERE id IN (author_ids);
```

### SELECT 優化

```sql
-- ❌ 不要 SELECT *
SELECT * FROM users WHERE id = '123';

-- ✅ 只選取需要的欄位
SELECT id, name, email FROM users WHERE id = '123';

-- ✅ 避免選取大型欄位（如 TEXT, JSONB）
-- 除非真的需要
SELECT id, name FROM posts;  -- 不包含 content
```

### 批次操作

```sql
-- ❌ 逐筆插入
INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
INSERT INTO users (name, email) VALUES ('Bob', 'bob@example.com');
-- ... 1000 次

-- ✅ 批次插入
INSERT INTO users (name, email) VALUES
    ('Alice', 'alice@example.com'),
    ('Bob', 'bob@example.com'),
    ('Charlie', 'charlie@example.com')
    -- ... 批次插入
ON CONFLICT (email) DO NOTHING;  -- 處理重複

-- ✅ 批次更新
UPDATE users
SET status = 'active'
WHERE id IN (
    '123', '456', '789'
    -- ... 批次更新
);
```

---

## 資料完整性

### 約束條件

```sql
-- ✅ 使用適當的約束

CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    age INT CHECK (age >= 18 AND age <= 120),
    status VARCHAR(20) NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'inactive', 'suspended')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ✅ 外鍵約束
CREATE TABLE posts (
    id UUID PRIMARY KEY,
    author_id UUID NOT NULL,

    FOREIGN KEY (author_id) REFERENCES users(id)
        ON DELETE CASCADE    -- 使用者刪除時，文章也刪除
        -- 或 ON DELETE SET NULL
        -- 或 ON DELETE RESTRICT（禁止刪除）
);
```

### Soft Delete

```sql
-- ✅ 實作 Soft Delete
CREATE TABLE users (
    id UUID PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 查詢未刪除的資料
SELECT * FROM users WHERE deleted_at IS NULL;

-- 刪除（標記為已刪除）
UPDATE users SET deleted_at = CURRENT_TIMESTAMP WHERE id = '123';

-- 真正刪除（定期清理）
DELETE FROM users WHERE deleted_at < NOW() - INTERVAL '30 days';
```

### 交易處理

```sql
-- ✅ 使用交易保證一致性
BEGIN;

-- 轉帳範例
UPDATE accounts SET balance = balance - 100 WHERE id = 'account_1';
UPDATE accounts SET balance = balance + 100 WHERE id = 'account_2';

-- 記錄交易
INSERT INTO transactions (from_account, to_account, amount)
VALUES ('account_1', 'account_2', 100);

COMMIT;
-- 如果任何一步失敗，使用 ROLLBACK 回滾

-- ✅ 鎖定策略
BEGIN;

-- 悲觀鎖（Pessimistic Lock）
SELECT * FROM accounts WHERE id = 'account_1' FOR UPDATE;

-- 或樂觀鎖（Optimistic Lock）使用 version 欄位
UPDATE accounts
SET balance = balance - 100, version = version + 1
WHERE id = 'account_1' AND version = 5;

COMMIT;
```

---

## 效能監控

### 慢查詢監控

```sql
-- ✅ 啟用慢查詢日誌（PostgreSQL）
-- postgresql.conf
log_min_duration_statement = 1000  -- 記錄執行超過 1 秒的查詢

-- ✅ 查詢最慢的查詢
SELECT
    query,
    calls,
    total_exec_time,
    mean_exec_time,
    max_exec_time
FROM pg_stat_statements
ORDER BY mean_exec_time DESC
LIMIT 10;
```

### 表格統計

```sql
-- ✅ 更新統計資訊
ANALYZE users;
ANALYZE;  -- 更新所有表格

-- ✅ 檢查表格大小
SELECT
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ✅ 檢查表格膨脹
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as total_size,
    n_dead_tup as dead_tuples
FROM pg_stat_user_tables
WHERE n_dead_tup > 1000
ORDER BY n_dead_tup DESC;

-- ✅ 執行 VACUUM
VACUUM ANALYZE users;
```

---

## Prisma ORM 最佳實務

### Schema 定義

```prisma
// ✅ 好的 Prisma schema

model User {
    id        String   @id @default(uuid())
    email     String   @unique
    name      String
    role      Role     @default(USER)
    posts     Post[]
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([email])
    @@map("users")
}

model Post {
    id        String   @id @default(uuid())
    title     String
    content   String   @db.Text
    published Boolean  @default(false)
    authorId  String
    author    User     @relation(fields: [authorId], references: [id], onDelete: Cascade)
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt

    @@index([authorId])
    @@index([published, createdAt])
    @@map("posts")
}

enum Role {
    USER
    ADMIN
}
```

### 查詢優化

```typescript
// ✅ 只選取需要的欄位
const users = await prisma.user.findMany({
    select: {
        id: true,
        name: true,
        email: true
    }
});

// ✅ 使用 include 載入關聯
const posts = await prisma.post.findMany({
    include: {
        author: {
            select: {
                id: true,
                name: true
            }
        }
    }
});

// ✅ 分頁
const posts = await prisma.post.findMany({
    skip: (page - 1) * pageSize,
    take: pageSize,
    orderBy: { createdAt: 'desc' }
});
```

---

*最後更新：2025-11-19*
