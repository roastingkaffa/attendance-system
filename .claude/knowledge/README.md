# Claude Code 知識庫 (Knowledge Organization System)

這是 Attendance System 專案的 Claude Code 知識庫，整理了開發流程、最佳實務、程式碼模板等資源。

## 📚 知識庫結構

```
.claude/knowledge/
├── README.md           # 本檔案 - 知識庫總索引
├── guides/            # 使用指南
├── references/        # 參考文件與最佳實務
├── templates/         # 程式碼模板
└── workflows/         # 開發流程與工作流程
```

---

## 🎯 快速導航

### 指南 (Guides)
開發過程中的實用指南與教學

- [Fullstack Agents 使用指南](./guides/fullstack-agents-guide.md) - 如何使用 `/fe`、`/be`、`/db` 指令

### 參考文件 (References)
技術標準與最佳實務

- [前端開發最佳實務](./references/frontend-best-practices.md) - React、TypeScript、Tailwind 規範
- [後端開發最佳實務](./references/backend-best-practices.md) - API 設計、驗證、錯誤處理
- [資料庫最佳實務](./references/database-best-practices.md) - Schema 設計、Migration、效能優化

### 模板 (Templates)
可直接使用的程式碼模板

- [React Component 模板](./templates/component-template.md) - 標準 React component 結構
- [API Endpoint 模板](./templates/api-endpoint-template.md) - RESTful API 端點範例
- [Database Migration 模板](./templates/migration-template.md) - 資料庫遷移腳本範例

### 工作流程 (Workflows)
端到端的開發流程

- [全端功能開發流程](./workflows/fullstack-development-workflow.md) - 從需求到部署的完整流程

---

## 🚀 快速開始

### 1. 使用 Agents 開發

根據任務類型選擇適合的 agent：

```bash
# 前端開發
/fe 建立一個使用者資料卡片 component

# 後端開發
/be 設計 /api/users 的 CRUD API

# 資料庫開發
/db 為 users 表格新增 email 欄位
```

詳細說明請參考：[Fullstack Agents 使用指南](./guides/fullstack-agents-guide.md)

### 2. 查閱最佳實務

開發前先確認相關的最佳實務：

- **寫前端？** → 看 [前端最佳實務](./references/frontend-best-practices.md)
- **寫後端？** → 看 [後端最佳實務](./references/backend-best-practices.md)
- **改資料庫？** → 看 [資料庫最佳實務](./references/database-best-practices.md)

### 3. 使用模板加速開發

複製模板開始新功能：

- 新增 Component → 參考 [Component 模板](./templates/component-template.md)
- 新增 API → 參考 [API 模板](./templates/api-endpoint-template.md)
- 資料庫變更 → 參考 [Migration 模板](./templates/migration-template.md)

---

## 📖 使用方式

### 在對話中引用知識庫

當您需要 Claude 遵循特定標準時，可以直接引用知識庫：

```
請依照 .claude/knowledge/references/frontend-best-practices.md 的規範來重構這個 component
```

### 更新知識庫

知識庫是活的文件，隨時可以更新：

1. 發現新的最佳實務 → 更新 `references/`
2. 常用的程式碼模式 → 加到 `templates/`
3. 有效的開發流程 → 記錄到 `workflows/`

---

## 🏗️ 專案資訊

### 技術堆疊

**前端：**
- React
- TypeScript
- Tailwind CSS
- Axios

**後端：**
- Node.js / Express（或您使用的框架）
- TypeScript

**資料庫：**
- PostgreSQL / MySQL（依您的專案）

### 編碼規範

- **縮排：** 4 spaces
- **TypeScript：** 嚴格模式、完整型別定義
- **Const 正確性：** 嚴格遵守 const 正確性
- **命名：** camelCase (變數/函式)、PascalCase (Component/類別)

---

## 💡 貢獻與維護

### 新增文件

當您發現值得記錄的知識時：

```bash
# 新增指南
/fe 幫我在 .claude/knowledge/guides/ 建立一個新的指南

# 新增參考文件
/be 幫我在 .claude/knowledge/references/ 記錄這個最佳實務

# 新增模板
/db 幫我在 .claude/knowledge/templates/ 建立這個模板
```

### 文件分類原則

- **guides/** - 「如何做」的教學文件
- **references/** - 「應該這樣做」的標準規範
- **templates/** - 「可以直接用」的程式碼範例
- **workflows/** - 「完整流程」的端到端說明

---

## 📝 文件清單

### Guides（指南）
- ✅ Fullstack Agents 使用指南

### References（參考）
- ✅ 前端開發最佳實務
- ✅ 後端開發最佳實務
- ✅ 資料庫最佳實務

### Templates（模板）
- ✅ React Component 模板
- ✅ API Endpoint 模板
- ✅ Database Migration 模板

### Workflows（流程）
- ✅ 全端功能開發流程

---

## 🔗 相關資源

### 專案文件
- [Commands 說明](../commands/fullstack-agents.md) - Slash commands 參考

### 外部資源
- [Claude Code 官方文件](https://docs.claude.com/en/api/agent-sdk/overview)
- [Claude Agent SDK](https://github.com/anthropics/claude-agent-sdk-typescript)

---

*最後更新：2025-11-19*
*維護者：開發團隊*
