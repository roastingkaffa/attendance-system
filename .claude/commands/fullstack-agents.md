# Fullstack Agents Commands

這份文件說明如何使用三個專業 subagent 來加速全端開發工作流程。

## 指令列表

| 指令 | Subagent | 用途 |
|------|----------|------|
| `/fe` | frontend-engineer | 處理前端開發、UI/UX、React/Next.js、Tailwind |
| `/be` | backend-architect | 處理後端 API、架構設計、權限、文件 |
| `/db` | db-migrator | 處理資料庫 schema、migration、查詢優化 |

---

## 1. `/fe` - 前端 Subagent（Frontend Engineer）

### 對應 Subagent
`frontend-engineer`

### 用途
處理所有「前端相關」工作，包含但不限於：
- React / Next.js / SPA 頁面開發與重構
- TailwindCSS 樣式調整、RWD（響應式設計）
- 與後端 API 的串接與型別定義
- 前端單元測試（如 Vitest / Jest / Testing Library）
- Component 設計與架構優化
- 狀態管理（Redux / Zustand / Context API）

### 行為規則

1. **專案分析**
   - 先閱讀目前專案結構（使用 Read / Glob / Grep 等工具）
   - 確認技術堆疊（React 版本、框架、樣式方案等）

2. **任務規劃**
   - 將使用者問題轉換成「明確任務 + 變更計畫」
   - 列出需要修改或新增的檔案清單

3. **輸出格式**
   - 先給出簡短的「變更概要」（2-3 句話）
   - 提供實際程式碼 diff 或完整檔案內容
   - 若建立新 component，附上：
     - 簡短使用範例
     - Props 型別定義
     - 基本單元測試框架

4. **溝通原則**
   - 若需求模糊，先用 2～3 句話詢問關鍵問題：
     - 設計風格偏好？
     - 狀態來源（local / global / server）？
     - API 回傳格式？
     - 是否需要 loading / error 處理？

### 參數說明

當執行 `/fe` 時，可以：
- 直接提供需求描述
- 選取特定程式碼區塊進行重構
- 指定特定檔案路徑

### 實際使用範例

**範例 1：重構登入頁面**
```
/fe 幫我重構目前的登入頁，改成使用 React Hook Form，並加上基本錯誤訊息顯示。
```

**範例 2：TypeScript 強化**
```
/fe 使用選取的程式碼，改成 TypeScript + stricter props typing，並補一個基本單元測試。
```

**範例 3：建立新 Component**
```
/fe 建立一個可重用的 DateRangePicker component，需要支援 Tailwind、受控模式、可客製化日期範圍限制。
```

**範例 4：API 整合**
```
/fe 幫我整合 /api/users 端點到 UserList component，加上 loading state、錯誤處理、以及 TypeScript 型別。
```

**範例 5：RWD 調整**
```
/fe 將選取的這段 Dashboard layout 改成響應式設計，在手機上要改成單欄顯示。
```

---

## 2. `/be` - 後端 Subagent（Backend Architect）

### 對應 Subagent
`backend-architect`

### 用途
處理後端 API 與架構相關工作，包含：
- REST / GraphQL API 設計與實作
- 驗證 / 權限（Authentication / Authorization / RBAC）
- API 文件（OpenAPI / Swagger）
- Logging / Metrics / Tracing 的基本設計
- 中介層（Middleware）設計
- 錯誤處理與驗證邏輯
- 效能優化與快取策略

### 行為規則

1. **框架偵測**
   - 自動偵測後端框架（NestJS / Express / FastAPI / Django / Go 等）
   - 遵循該框架的最佳實務與慣例

2. **需求分析**
   - 整理成「端點清單」與「資料流說明」
   - 設計 request/response schema（JSON）與驗證規則
   - 考慮錯誤情境與邊界條件

3. **變更計畫**
   - 明確列出要修改的檔案
   - 說明需要新增的路由、中介層、服務層
   - 提供對應的測試建議

4. **文件產出**
   - 提供 API 文件（簡版 OpenAPI 或 Markdown）
   - 包含 request/response 範例
   - 列出可能的錯誤碼與訊息

5. **權限控制**
   - 若涉及權限，主動提出「角色與權限矩陣」建議
   - 說明各角色可執行的操作

### 參數說明

執行 `/be` 時可以：
- 描述 API 需求（端點、功能、權限）
- 選取現有程式碼進行重構或增強
- 指定特定的架構問題（logging、錯誤處理等）

### 實際使用範例

**範例 1：設計 CRUD API**
```
/be 幫我設計 /api/orders 相關的 CRUD API，包含 RBAC（admin/user）與基本驗證。
```

**範例 2：加強錯誤處理**
```
/be 針對目前選取的後端程式碼，幫我加上結構化 log 與錯誤處理的最佳實務。
```

**範例 3：權限系統設計**
```
/be 設計一個 RBAC 系統，需要支援角色（admin/manager/user）與資源級別的權限控制（read/write/delete）。
```

**範例 4：API 文件生成**
```
/be 為目前的 /api/products 端點群組生成 OpenAPI 3.0 規格文件。
```

**範例 5：中介層設計**
```
/be 建立一個 rate limiting middleware，每個 IP 每分鐘最多 60 次請求，超過時回傳 429 錯誤。
```

**範例 6：驗證邏輯**
```
/be 為 /api/auth/register 端點加上完整的輸入驗證（email 格式、密碼強度、必填欄位），並提供清楚的錯誤訊息。
```

---

## 3. `/db` - 資料庫 Subagent（Database Migrator）

### 對應 Subagent
`db-migrator`

### 用途
處理資料庫 schema、migration、查詢優化，包含：
- PostgreSQL / MySQL / SQLite schema 設計與調整
- ORM（Prisma / TypeORM / Sequelize / Drizzle）migration 生成
- 索引設計與查詢效能分析
- 零停機 migration 策略（Zero-downtime deployment）
- 資料遷移與轉換腳本
- 資料庫關聯（Relationships）設計

### 行為規則

1. **變更評估流程**
   - 對於資料變更，輸出四個部分：
     1. **評估**：影響範圍、風險分析
     2. **計畫**：步驟說明、執行順序
     3. **Migration Script**：實際的 SQL 或 ORM 指令
     4. **Rollback Script**：回滾方案

2. **破壞性操作警告**
   - 涉及 `DROP` / `DELETE` / `ALTER` 刪除欄位等操作時：
   - 一律先以「plan 模式」描述步驟
   - **不要直接給最終的 destructive SQL**
   - 要求使用者明確確認後，再給實際 SQL

3. **ORM 支援**
   - 若偵測到 ORM（例如 `schema.prisma`）：
   - 同時產出「SQL 版本」與「ORM migration 寫法」
   - 說明如何執行 migration（如 `prisma migrate dev`）

4. **效能優化**
   - 查詢優化時，先顯示：
     - 推測的資料量與使用情境
     - 目前的查詢計畫（EXPLAIN）
     - 建議的索引策略
     - 重寫後的查詢

### 參數說明

執行 `/db` 時可以：
- 描述 schema 變更需求
- 提供現有的 SQL 查詢需要優化
- 指定資料庫類型（PostgreSQL / MySQL 等）
- 說明是否需要零停機部署

### 實際使用範例

**範例 1：新增欄位（零停機）**
```
/db 幫我把 orders table 加上一個 status 欄位（enum: pending/processing/completed/cancelled），設計零停機 migration（PostgreSQL + Prisma）。
```

**範例 2：查詢效能優化**
```
/db 對目前這個 SELECT 查詢做效能分析，幫我想一個適合的索引與重寫方式。
```

**範例 3：建立關聯**
```
/db 建立 users 和 posts 的一對多關係，users 可以有多個 posts，需要適當的外鍵約束和索引。
```

**範例 4：資料遷移**
```
/db 我要把 user_profile 的 birth_date 從 VARCHAR 改成 DATE 類型，幫我寫一個安全的 migration（包含資料轉換與驗證）。
```

**範例 5：索引設計**
```
/db 分析 products table 的查詢模式，我們常用 category + price 做篩選，也會用 name 做模糊搜尋，幫我設計適合的索引策略。
```

**範例 6：Schema 設計**
```
/db 設計一個電商訂單系統的資料庫 schema，需要支援：多商品訂單、訂單狀態追蹤、付款記錄、配送地址。
```

---

## 快速使用說明

### 什麼時候用哪個指令？

```
💡 遇到 UI / React / Tailwind 問題         → 用 /fe
💡 遇到 API / 後端架構 / 權限               → 用 /be
💡 遇到資料庫 / schema / migration / SQL   → 用 /db
```

### 使用流程建議

1. **明確任務邊界**
   - 前端問題用 `/fe`（即使涉及 API 呼叫，但重點在前端實作）
   - 後端問題用 `/be`（API 設計、商業邏輯、權限）
   - 資料層問題用 `/db`（schema、查詢、索引）

2. **組合使用**
   - 全端功能開發時，可依序使用：
     1. `/db` - 設計資料表結構
     2. `/be` - 實作 API 端點
     3. `/fe` - 建立前端介面

3. **程式碼選取**
   - 選取特定程式碼區塊後執行指令，agent 會聚焦在該區塊
   - 未選取時，agent 會自行探索專案結構

4. **迭代優化**
   - 每個 agent 的回應都可以繼續追問
   - 例如：「請加上單元測試」、「這個效能可以更好嗎？」

### 注意事項

- ⚠️ `/db` 執行破壞性操作前，一定會先要求確認
- 💾 建議在 git 有 commit 的情況下執行大型重構
- 📝 Agents 會主動詢問不明確的需求，不要害怕溝通
- 🧪 重要功能建議要求 agents 提供測試程式碼

---

## 技術支援

如果 agents 行為不如預期：
1. 提供更具體的需求描述
2. 選取相關的程式碼區塊
3. 說明目前的技術堆疊（框架、版本）
4. 描述預期的輸出格式

---

*最後更新：2025-11-19*
