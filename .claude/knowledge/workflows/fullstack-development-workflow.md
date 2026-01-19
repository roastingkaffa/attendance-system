# 全端功能開發流程

從需求分析到部署的完整開發工作流程。

## 目錄

- [開發流程總覽](#開發流程總覽)
- [階段一：需求分析](#階段一需求分析)
- [階段二：資料庫設計](#階段二資料庫設計)
- [階段三：後端開發](#階段三後端開發)
- [階段四：前端開發](#階段四前端開發)
- [階段五：測試與優化](#階段五測試與優化)
- [階段六：部署](#階段六部署)

---

## 開發流程總覽

```
需求分析 → 資料庫設計 → 後端 API → 前端介面 → 測試優化 → 部署
    ↓           ↓            ↓          ↓           ↓         ↓
  Story      Schema        API       UI/UX      測試       上線
  設計      Migration   Endpoints  Components  Debug     監控
```

---

## 階段一：需求分析

### 1.1 收集需求

**範例需求：「建立使用者評論功能」**

收集以下資訊：
- 誰可以發表評論？（所有登入使用者）
- 評論可以包含什麼？（文字、最多 500 字）
- 是否支援回覆？（暫不支援）
- 是否可以編輯/刪除？（作者和 admin 可以）
- 如何排序？（按時間倒序）
- 是否需要分頁？（是，每頁 20 筆）

### 1.2 拆解功能

```
功能：評論系統
├── 資料層
│   ├── comments 表格
│   └── 關聯到 users 和 posts
├── 後端
│   ├── POST /api/comments - 新增評論
│   ├── GET /api/comments?post_id=X - 取得評論
│   ├── PUT /api/comments/:id - 更新評論
│   └── DELETE /api/comments/:id - 刪除評論
└── 前端
    ├── CommentList - 評論列表
    ├── CommentForm - 新增表單
    └── CommentItem - 單一評論
```

### 1.3 定義驗收標準

- [ ] 登入使用者可以發表評論
- [ ] 評論顯示作者名稱和時間
- [ ] 作者可以編輯自己的評論（30 分鐘內）
- [ ] 作者和 admin 可以刪除評論
- [ ] 評論按時間倒序顯示
- [ ] 支援分頁（每頁 20 筆）
- [ ] 評論長度限制 500 字
- [ ] 提交後立即顯示

---

## 階段二：資料庫設計

### 2.1 設計 Schema

使用 `/db` agent：

```bash
/db 設計評論系統的資料庫 schema：
- comments 表格（id, user_id, post_id, content, created_at, updated_at, deleted_at）
- 外鍵關聯到 users 和 posts
- 索引策略：常用 post_id 查詢並按時間排序
- 支援 soft delete
```

**預期輸出：**

```sql
CREATE TABLE comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    post_id UUID NOT NULL,
    content TEXT NOT NULL CHECK (LENGTH(content) <= 500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
    deleted_at TIMESTAMP WITH TIME ZONE,

    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
);

CREATE INDEX idx_comments_post_id ON comments(post_id);
CREATE INDEX idx_comments_user_id ON comments(user_id);
CREATE INDEX idx_comments_post_created ON comments(post_id, created_at DESC)
    WHERE deleted_at IS NULL;
```

### 2.2 建立 Migration

```bash
# 1. 建立 migration 檔案
/db 為上述 schema 建立 Prisma migration

# 2. 執行 migration
npx prisma migrate dev --name create_comments_table

# 3. 驗證
npx prisma studio  # 開啟 GUI 檢查
```

### 2.3 Git Commit

```bash
git add prisma/schema.prisma prisma/migrations/
git commit -m "feat(db): add comments table with indexes"
```

---

## 階段三：後端開發

### 3.1 設計 API

使用 `/be` agent：

```bash
/be 為評論系統設計 RESTful API：
- POST /api/comments - 新增評論（需登入）
- GET /api/comments?post_id=X&page=1&pageSize=20 - 取得評論列表
- PUT /api/comments/:id - 更新評論（僅作者，且 30 分鐘內）
- DELETE /api/comments/:id - 刪除評論（作者或 admin）
- 使用 Zod 驗證輸入
- 加上適當的權限檢查
- 提供 API 文件
```

**預期輸出：**

1. **路由定義** (`routes/comments.ts`)
2. **Service 層** (`services/commentService.ts`)
3. **Validation Schema** (使用 Zod)
4. **API 文件** (Markdown 或 OpenAPI)

### 3.2 實作 API

```typescript
// routes/comments.ts
import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { requireOwnership } from '../middleware/permission';
import { validate } from '../middleware/validate';
import * as commentService from '../services/commentService';

const router = express.Router();

// GET /api/comments?post_id=X
router.get('/', validate(QuerySchema, 'query'), async (req, res, next) => {
    // ...
});

// POST /api/comments
router.post('/', authenticateToken, validate(CreateCommentSchema), async (req, res, next) => {
    // ...
});

// PUT /api/comments/:id
router.put('/:id', authenticateToken, requireOwnership('comment'), validate(UpdateCommentSchema), async (req, res, next) => {
    // ...
});

// DELETE /api/comments/:id
router.delete('/:id', authenticateToken, requireOwnership('comment'), async (req, res, next) => {
    // ...
});

export default router;
```

### 3.3 測試 API

```bash
# 使用 curl 或 Postman 測試

# 1. 取得評論列表
curl http://localhost:3000/api/comments?post_id=123

# 2. 新增評論（需要 token）
curl -X POST http://localhost:3000/api/comments \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"post_id": "123", "content": "Great post!"}'

# 3. 更新評論
curl -X PUT http://localhost:3000/api/comments/456 \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Updated comment"}'

# 4. 刪除評論
curl -X DELETE http://localhost:3000/api/comments/456 \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 3.4 整合測試

```typescript
// tests/comments.test.ts
describe('Comments API', () => {
    it('should create a comment', async () => {
        const response = await request(app)
            .post('/api/comments')
            .set('Authorization', `Bearer ${token}`)
            .send({
                post_id: testPost.id,
                content: 'Test comment'
            });

        expect(response.status).toBe(201);
        expect(response.body.success).toBe(true);
    });

    // ... 更多測試
});
```

### 3.5 Git Commit

```bash
git add .
git commit -m "feat(api): add comments CRUD endpoints with auth"
```

---

## 階段四：前端開發

### 4.1 建立 Components

使用 `/fe` agent：

```bash
/fe 建立評論系統的前端 components：
1. CommentList - 顯示評論列表（含分頁）
2. CommentForm - 新增/編輯評論表單
3. CommentItem - 單一評論項目（含編輯/刪除按鈕）

需求：
- 整合 /api/comments 端點
- 使用 TypeScript
- Tailwind 樣式
- 加上 loading 和 error 處理
- 樂觀更新（Optimistic UI）
```

**預期輸出：**

```
src/components/Comments/
├── CommentList.tsx
├── CommentForm.tsx
├── CommentItem.tsx
└── Comments.test.tsx
```

### 4.2 API 整合

```typescript
// src/api/comments.ts
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL;

export interface Comment {
    id: string;
    user_id: string;
    post_id: string;
    content: string;
    author: {
        name: string;
        avatar?: string;
    };
    created_at: string;
    updated_at?: string;
}

export async function getComments(postId: string, page = 1, pageSize = 20) {
    const response = await axios.get(`${API_URL}/comments`, {
        params: { post_id: postId, page, pageSize }
    });
    return response.data;
}

export async function createComment(data: { post_id: string; content: string }) {
    const response = await axios.post(`${API_URL}/comments`, data);
    return response.data;
}

export async function updateComment(id: string, content: string) {
    const response = await axios.put(`${API_URL}/comments/${id}`, { content });
    return response.data;
}

export async function deleteComment(id: string) {
    await axios.delete(`${API_URL}/comments/${id}`);
}
```

### 4.3 實作 Components

```typescript
// CommentList.tsx
export function CommentList({ postId }: { postId: string }) {
    const [page, setPage] = useState(1);
    const { data, loading, error, refetch } = useComments(postId, page);

    if (loading) return <LoadingSpinner />;
    if (error) return <ErrorMessage error={error} />;

    return (
        <div className="space-y-4">
            <CommentForm postId={postId} onSuccess={refetch} />

            {data.comments.map(comment => (
                <CommentItem
                    key={comment.id}
                    comment={comment}
                    onDelete={() => refetch()}
                    onUpdate={() => refetch()}
                />
            ))}

            <Pagination
                page={page}
                totalPages={data.meta.totalPages}
                onPageChange={setPage}
            />
        </div>
    );
}
```

### 4.4 測試 Components

```typescript
// Comments.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { CommentForm } from './CommentForm';

describe('CommentForm', () => {
    it('should submit comment', async () => {
        const onSuccess = vi.fn();
        render(<CommentForm postId="123" onSuccess={onSuccess} />);

        const textarea = screen.getByRole('textbox');
        await userEvent.type(textarea, 'Test comment');

        const button = screen.getByRole('button', { name: /submit/i });
        await userEvent.click(button);

        await waitFor(() => {
            expect(onSuccess).toHaveBeenCalled();
        });
    });
});
```

### 4.5 Git Commit

```bash
git add src/components/Comments/ src/api/comments.ts
git commit -m "feat(ui): add comment system components"
```

---

## 階段五：測試與優化

### 5.1 功能測試

手動測試所有功能：

- [ ] 新增評論成功
- [ ] 評論立即顯示
- [ ] 編輯評論成功（30 分鐘內）
- [ ] 刪除評論成功
- [ ] 分頁正常運作
- [ ] 權限檢查正確（非作者無法編輯）
- [ ] 錯誤訊息清楚

### 5.2 效能測試

```bash
# 使用 /db agent 檢查查詢效能
/db 分析 comments 的查詢效能，檢查是否需要額外索引

# 使用 EXPLAIN 分析
EXPLAIN ANALYZE
SELECT * FROM comments
WHERE post_id = '123' AND deleted_at IS NULL
ORDER BY created_at DESC
LIMIT 20;
```

### 5.3 程式碼審查

```bash
# 使用 /fe agent 審查前端
/fe 審查 CommentList component，檢查：
- 是否有效能問題（不必要的 re-render）
- 錯誤處理是否完善
- 型別定義是否正確

# 使用 /be agent 審查後端
/be 審查 comments API，檢查：
- 是否有 N+1 查詢問題
- 錯誤處理是否完善
- 是否有安全漏洞（SQL injection, XSS）
```

### 5.4 單元測試

```bash
# 執行測試
npm test

# 檢查覆蓋率
npm run test:coverage

# 目標：至少 80% 覆蓋率
```

### 5.5 Git Commit

```bash
git add .
git commit -m "test: add comments system tests and fix performance issues"
```

---

## 階段六：部署

### 6.1 部署前檢查

- [ ] 所有測試通過
- [ ] 程式碼已審查
- [ ] 環境變數已設定
- [ ] 資料庫 migration 已準備
- [ ] API 文件已更新

### 6.2 部署步驟

```bash
# 1. 建立部署分支
git checkout -b deploy/comments-feature

# 2. 確保在最新的 main 分支
git pull origin main

# 3. 執行 migration（先在 staging）
npm run migrate:staging

# 4. 部署後端（先部署 API）
npm run deploy:backend

# 5. 部署前端
npm run deploy:frontend

# 6. 驗證部署
curl https://api.example.com/health
curl https://example.com
```

### 6.3 監控

部署後監控：

```bash
# 檢查日誌
npm run logs:production

# 檢查錯誤率
# 使用監控工具（如 Sentry, DataDog）

# 檢查 API 回應時間
# 使用 APM 工具
```

### 6.4 建立 Pull Request

```bash
# 建立 PR
gh pr create --title "feat: add comment system" --body "$(cat <<'EOF'
## Summary
新增評論系統功能

## Changes
- 資料庫：新增 comments 表格與索引
- 後端：實作 CRUD API，含驗證與權限
- 前端：CommentList、CommentForm、CommentItem components
- 測試：單元測試與整合測試

## Test Plan
- [x] 功能測試完成
- [x] 單元測試覆蓋率 85%
- [x] 效能測試通過
- [x] 已在 staging 環境驗證

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

### 6.5 部署 Production

```bash
# PR 合併後
git checkout main
git pull

# 執行 production migration
npm run migrate:production

# 部署 production
npm run deploy:production

# 驗證
curl https://api.example.com/comments?post_id=123
```

---

## 開發流程檢查清單

### 每個階段的檢查點

#### 資料庫階段
- [ ] Schema 設計合理（正規化）
- [ ] 索引策略適當
- [ ] Migration 可回滾
- [ ] 外鍵約束正確

#### 後端階段
- [ ] API 設計符合 RESTful
- [ ] 輸入驗證完整
- [ ] 權限檢查正確
- [ ] 錯誤處理完善
- [ ] 有 API 文件

#### 前端階段
- [ ] UI/UX 符合設計
- [ ] 響應式設計
- [ ] Loading 和 Error 狀態
- [ ] TypeScript 型別完整
- [ ] 無障礙設計（a11y）

#### 測試階段
- [ ] 單元測試覆蓋率 > 80%
- [ ] 整合測試通過
- [ ] 手動測試完成
- [ ] 效能測試通過

#### 部署階段
- [ ] 環境變數設定
- [ ] Migration 執行成功
- [ ] 部署驗證通過
- [ ] 監控正常

---

## 實用技巧

### 1. 使用 Git 分支策略

```bash
# Feature 開發
git checkout -b feature/comments-system

# 定期同步 main
git pull origin main
git rebase main

# 完成後建立 PR
gh pr create
```

### 2. 增量開發

不要一次完成所有功能，而是：

1. **MVP（最小可行產品）** - 基本的 CRUD
2. **迭代 1** - 加上權限檢查
3. **迭代 2** - 優化 UI/UX
4. **迭代 3** - 效能優化

### 3. 使用 Agents 輔助

```bash
# 每個階段使用對應的 agent
/db 設計 schema          # 資料庫階段
/be 實作 API            # 後端階段
/fe 建立 components     # 前端階段

# 跨階段協作
/db 檢查索引效能
/be 優化查詢
/fe 加上 loading 狀態
```

### 4. 文件優先

先寫文件，再寫程式碼：

1. API 文件（OpenAPI）
2. Component Props 定義（TypeScript interface）
3. 測試案例（Test cases）
4. 實作程式碼

---

*最後更新：2025-11-19*
