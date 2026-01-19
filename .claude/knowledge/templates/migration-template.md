# Database Migration 模板

資料庫 Migration 的標準模板與範例。

## 目錄

- [建立表格](#建立表格)
- [修改表格](#修改表格)
- [建立索引](#建立索引)
- [資料遷移](#資料遷移)
- [Prisma Migration](#prisma-migration)

---

## 建立表格

### PostgreSQL

```sql
-- migrations/20250119120000_create_users_table.up.sql

-- 建立 users 表格
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin', 'manager')),
    avatar_url VARCHAR(500),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE
);

-- 建立索引
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);
CREATE INDEX idx_users_deleted_at ON users(deleted_at) WHERE deleted_at IS NULL;

-- 註解
COMMENT ON TABLE users IS '使用者表格';
COMMENT ON COLUMN users.id IS '使用者 ID (UUID)';
COMMENT ON COLUMN users.email IS '使用者 Email（唯一）';
COMMENT ON COLUMN users.role IS '使用者角色：user, admin, manager';
COMMENT ON COLUMN users.deleted_at IS 'Soft delete 時間戳記';
```

```sql
-- migrations/20250119120000_create_users_table.down.sql

-- Rollback: 刪除表格
DROP TABLE IF EXISTS users;
```

### 關聯表格

```sql
-- migrations/20250119120100_create_posts_table.up.sql

CREATE TABLE posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
    author_id UUID NOT NULL,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,

    -- 外鍵約束
    CONSTRAINT fk_posts_author
        FOREIGN KEY (author_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_posts_author_id ON posts(author_id);
CREATE INDEX idx_posts_status ON posts(status);
CREATE INDEX idx_posts_slug ON posts(slug);
CREATE INDEX idx_posts_published_at ON posts(published_at DESC) WHERE status = 'published';
CREATE INDEX idx_posts_author_status_created ON posts(author_id, status, created_at DESC);

-- 註解
COMMENT ON TABLE posts IS '文章表格';
COMMENT ON COLUMN posts.slug IS 'URL slug（唯一）';
COMMENT ON COLUMN posts.status IS '文章狀態：draft, published, archived';
```

```sql
-- migrations/20250119120100_create_posts_table.down.sql

DROP TABLE IF EXISTS posts;
```

### 多對多關聯

```sql
-- migrations/20250119120200_create_tags_and_post_tags.up.sql

-- 標籤表格
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    slug VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 文章標籤關聯表格
CREATE TABLE post_tags (
    post_id UUID NOT NULL,
    tag_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (post_id, tag_id),

    CONSTRAINT fk_post_tags_post
        FOREIGN KEY (post_id)
        REFERENCES posts(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_post_tags_tag
        FOREIGN KEY (tag_id)
        REFERENCES tags(id)
        ON DELETE CASCADE
);

-- 索引
CREATE INDEX idx_tags_slug ON tags(slug);
CREATE INDEX idx_post_tags_post_id ON post_tags(post_id);
CREATE INDEX idx_post_tags_tag_id ON post_tags(tag_id);
```

```sql
-- migrations/20250119120200_create_tags_and_post_tags.down.sql

DROP TABLE IF EXISTS post_tags;
DROP TABLE IF EXISTS tags;
```

---

## 修改表格

### 新增欄位（零停機）

```sql
-- migrations/20250119120300_add_bio_to_users.up.sql

-- Phase 1: 新增欄位（nullable）
ALTER TABLE users ADD COLUMN bio TEXT;

-- Phase 2: 可選：填充預設值（如果需要）
-- UPDATE users SET bio = '' WHERE bio IS NULL;

-- Phase 3: 可選：如果需要 NOT NULL，先填充資料後再加約束
-- ALTER TABLE users ALTER COLUMN bio SET NOT NULL;

-- 註解
COMMENT ON COLUMN users.bio IS '使用者自我介紹';
```

```sql
-- migrations/20250119120300_add_bio_to_users.down.sql

ALTER TABLE users DROP COLUMN IF EXISTS bio;
```

### 新增 NOT NULL 欄位（多階段）

```sql
-- migrations/20250119120400_add_status_to_users_phase1.up.sql

-- Phase 1: 新增欄位（nullable）
ALTER TABLE users ADD COLUMN status VARCHAR(20);

-- Phase 2: 填充預設值（分批執行，避免鎖表）
UPDATE users
SET status = 'active'
WHERE status IS NULL
  AND id IN (
      SELECT id
      FROM users
      WHERE status IS NULL
      LIMIT 1000  -- 分批處理
  );

-- 註解
COMMENT ON COLUMN users.status IS '使用者狀態：active, inactive, suspended';
```

```sql
-- migrations/20250119120400_add_status_to_users_phase2.up.sql

-- Phase 3: 等所有資料都填充後，加上 NOT NULL 約束
ALTER TABLE users ALTER COLUMN status SET NOT NULL;

-- Phase 4: 加上預設值
ALTER TABLE users ALTER COLUMN status SET DEFAULT 'active';

-- Phase 5: 加上 CHECK 約束
ALTER TABLE users ADD CONSTRAINT check_users_status
    CHECK (status IN ('active', 'inactive', 'suspended'));
```

### 修改欄位類型

```sql
-- migrations/20250119120500_change_age_type.up.sql

-- Phase 1: 新增新欄位
ALTER TABLE users ADD COLUMN age_new INT;

-- Phase 2: 資料轉換
UPDATE users
SET age_new = CAST(age_old AS INT)
WHERE age_old IS NOT NULL
  AND age_old ~ '^\d+$';  -- 只轉換有效的數字字串

-- Phase 3: 驗證資料
-- 檢查有多少資料轉換失敗
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM users
        WHERE age_old IS NOT NULL AND age_new IS NULL
    ) THEN
        RAISE EXCEPTION 'Some age values failed to convert';
    END IF;
END $$;

-- Phase 4: 刪除舊欄位，重命名新欄位
ALTER TABLE users DROP COLUMN age_old;
ALTER TABLE users RENAME COLUMN age_new TO age;

-- Phase 5: 加上約束
ALTER TABLE users ADD CONSTRAINT check_users_age
    CHECK (age >= 18 AND age <= 120);
```

```sql
-- migrations/20250119120500_change_age_type.down.sql

-- Rollback
ALTER TABLE users ADD COLUMN age_old VARCHAR(10);
UPDATE users SET age_old = CAST(age AS VARCHAR);
ALTER TABLE users DROP COLUMN age;
ALTER TABLE users RENAME COLUMN age_old TO age;
```

### 刪除欄位

```sql
-- migrations/20250119120600_remove_phone_from_users.up.sql

-- ⚠️ 破壞性操作！確認備份後執行

-- 先刪除相關的索引
DROP INDEX IF EXISTS idx_users_phone;

-- 刪除欄位
ALTER TABLE users DROP COLUMN IF EXISTS phone;
```

```sql
-- migrations/20250119120600_remove_phone_from_users.down.sql

-- Rollback: 重新加上欄位（但資料已遺失）
ALTER TABLE users ADD COLUMN phone VARCHAR(20);
CREATE INDEX idx_users_phone ON users(phone) WHERE phone IS NOT NULL;
```

---

## 建立索引

### 單欄索引

```sql
-- migrations/20250119120700_add_email_index.up.sql

-- 建立索引（CONCURRENTLY 避免鎖表）
CREATE INDEX CONCURRENTLY idx_users_email_lower ON users(LOWER(email));

-- 檢查索引是否建立成功
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes
        WHERE indexname = 'idx_users_email_lower'
    ) THEN
        RAISE EXCEPTION 'Index creation failed';
    END IF;
END $$;
```

```sql
-- migrations/20250119120700_add_email_index.down.sql

DROP INDEX CONCURRENTLY IF EXISTS idx_users_email_lower;
```

### 複合索引

```sql
-- migrations/20250119120800_add_composite_index.up.sql

-- 複合索引：常用查詢 WHERE status = ? ORDER BY created_at DESC
CREATE INDEX CONCURRENTLY idx_posts_status_created
ON posts(status, created_at DESC)
WHERE deleted_at IS NULL;

-- 註解
COMMENT ON INDEX idx_posts_status_created IS '用於查詢特定狀態的文章並按時間排序';
```

### 部分索引

```sql
-- migrations/20250119120900_add_partial_index.up.sql

-- 部分索引：只索引已發布的文章
CREATE INDEX CONCURRENTLY idx_posts_published
ON posts(published_at DESC)
WHERE status = 'published' AND deleted_at IS NULL;
```

### JSONB 索引

```sql
-- migrations/20250119121000_add_jsonb_index.up.sql

-- GIN 索引用於 JSONB 查詢
CREATE INDEX CONCURRENTLY idx_users_metadata_gin
ON users USING GIN (metadata jsonb_path_ops);

-- 用途：可以查詢 JSON 內部的值
-- SELECT * FROM users WHERE metadata @> '{"premium": true}';
```

---

## 資料遷移

### 批次更新資料

```sql
-- migrations/20250119121100_migrate_user_roles.up.sql

-- 將舊的 role 轉換成新的 role
-- 分批處理，避免長時間鎖表

DO $$
DECLARE
    batch_size INT := 1000;
    updated INT;
BEGIN
    LOOP
        -- 批次更新
        UPDATE users
        SET role = CASE
            WHEN role = 'superadmin' THEN 'admin'
            WHEN role = 'moderator' THEN 'manager'
            ELSE 'user'
        END
        WHERE id IN (
            SELECT id
            FROM users
            WHERE role IN ('superadmin', 'moderator')
            LIMIT batch_size
        );

        GET DIAGNOSTICS updated = ROW_COUNT;

        -- 沒有更多資料要更新
        EXIT WHEN updated = 0;

        -- 提交並等待一下，避免過度佔用資源
        COMMIT;
        PERFORM pg_sleep(0.1);
    END LOOP;
END $$;
```

### 資料清理

```sql
-- migrations/20250119121200_cleanup_old_data.up.sql

-- 刪除超過 1 年的 soft deleted 資料
DELETE FROM users
WHERE deleted_at < NOW() - INTERVAL '1 year';

DELETE FROM posts
WHERE deleted_at < NOW() - INTERVAL '1 year';

-- 清理孤立的資料（沒有對應 user 的 posts）
DELETE FROM posts
WHERE author_id NOT IN (SELECT id FROM users);
```

---

## Prisma Migration

### Schema 定義

```prisma
// prisma/schema.prisma

generator client {
    provider = "prisma-client-js"
}

datasource db {
    provider = "postgresql"
    url      = env("DATABASE_URL")
}

model User {
    id        String   @id @default(uuid())
    name      String   @db.VarChar(100)
    email     String   @unique @db.VarChar(255)
    password  String   @db.VarChar(255)
    role      Role     @default(USER)
    bio       String?  @db.Text
    isActive  Boolean  @default(true) @map("is_active")
    createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
    updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz
    deletedAt DateTime? @map("deleted_at") @db.Timestamptz

    // 關聯
    posts     Post[]

    @@index([email])
    @@index([role])
    @@index([createdAt(sort: Desc)])
    @@map("users")
}

model Post {
    id          String    @id @default(uuid())
    title       String    @db.VarChar(255)
    content     String    @db.Text
    slug        String    @unique @db.VarChar(255)
    status      PostStatus @default(DRAFT)
    authorId    String    @map("author_id")
    publishedAt DateTime? @map("published_at") @db.Timestamptz
    createdAt   DateTime  @default(now()) @map("created_at") @db.Timestamptz
    updatedAt   DateTime  @updatedAt @map("updated_at") @db.Timestamptz

    // 關聯
    author      User      @relation(fields: [authorId], references: [id], onDelete: Cascade)
    tags        PostTag[]

    @@index([authorId])
    @@index([status])
    @@index([slug])
    @@index([authorId, status, createdAt(sort: Desc)])
    @@map("posts")
}

model Tag {
    id        String   @id @default(uuid())
    name      String   @unique @db.VarChar(50)
    slug      String   @unique @db.VarChar(50)
    createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

    // 關聯
    posts     PostTag[]

    @@map("tags")
}

model PostTag {
    postId    String   @map("post_id")
    tagId     String   @map("tag_id")
    createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz

    // 關聯
    post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)
    tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

    @@id([postId, tagId])
    @@index([postId])
    @@index([tagId])
    @@map("post_tags")
}

enum Role {
    USER
    ADMIN
    MANAGER
}

enum PostStatus {
    DRAFT
    PUBLISHED
    ARCHIVED
}
```

### 建立 Migration

```bash
# 1. 建立 migration
npx prisma migrate dev --name create_users_table

# 2. 生成 Prisma Client
npx prisma generate

# 3. 執行 migration
npx prisma migrate deploy

# 4. 查看 migration 狀態
npx prisma migrate status

# 5. Rollback（回到特定 migration）
# 注意：Prisma 不支援自動 rollback，需要手動處理
```

### 自訂 Migration SQL

```sql
-- prisma/migrations/20250119120000_custom_migration/migration.sql

-- Prisma 生成的 SQL 可以手動編輯

-- 例如：新增自訂函式
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 為所有表格建立 trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON posts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
```

### Seed 資料

```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    // 建立測試使用者
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await prisma.user.upsert({
        where: { email: 'admin@example.com' },
        update: {},
        create: {
            name: 'Admin User',
            email: 'admin@example.com',
            password: adminPassword,
            role: 'ADMIN'
        }
    });

    console.log({ admin });

    // 建立測試文章
    const post = await prisma.post.create({
        data: {
            title: 'First Post',
            content: 'This is the first post',
            slug: 'first-post',
            status: 'PUBLISHED',
            authorId: admin.id,
            publishedAt: new Date()
        }
    });

    console.log({ post });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
```

```bash
# 執行 seed
npx prisma db seed
```

---

## 最佳實務

### Migration 檢查清單

- [ ] Migration 命名清楚（包含時間戳記和描述）
- [ ] 提供 up 和 down migration
- [ ] 大型資料變更分批處理
- [ ] 破壞性操作前先備份
- [ ] 使用 `CREATE INDEX CONCURRENTLY`（PostgreSQL）
- [ ] 加上適當的註解說明
- [ ] 測試 rollback 是否正常
- [ ] 檢查 migration 對效能的影響

### 零停機部署

1. **新增欄位**：先加 nullable，再填充資料，最後加約束
2. **修改欄位**：新增新欄位，遷移資料，刪除舊欄位
3. **建立索引**：使用 `CONCURRENTLY`
4. **資料遷移**：分批處理，避免長時間鎖表

---

*最後更新：2025-11-19*
