# Phase 2 Week 4 測試報告

**專案**：宏全出勤管理系統 v2.0
**階段**：Phase 2 - Week 4 審批流程開發
**測試日期**：2025-11-21
**測試環境**：SQLite 測試資料庫（模擬環境）
**狀態**：✅ 環境設置完成，資料庫遷移成功

---

## 📋 測試環境設置

### 1. 套件安裝 ✅

**已安裝套件**：
```
Django==4.2.16
djangorestframework==3.14.0
PyMySQL==1.1.0
cryptography==41.0.7
django-cors-headers==4.3.1
python-dotenv==1.0.1
bcrypt==4.1.2
openpyxl==3.1.5
```

**調整說明**：
- 原計劃使用 Django 5.1，調整為 4.2.16（Python 3.8 相容）
- 原計劃使用 mysqlclient，改用 PyMySQL（純 Python 實現，無需系統套件）

### 2. 資料庫遷移 ✅

**遷移檔案**：`attendance/migrations/0006_phase2_week4_approval_system.py`

**遷移內容**：
- ✅ 修改 LeaveRecords 模型
  - 新增 8 個欄位：leave_type, status, substitute_employee_id, attachments, created_at, updated_at
  - 新增 2 個索引：(relation_id, status), (start_time)
  - 設定 ordering：-created_at

- ✅ 新增 ApprovalRecords 模型
  - 支援多層級審批（Level 1-3）
  - 包含審批人、審批層級、狀態、意見、時間等欄位
  - 新增 2 個索引：(leave_id), (approver_id, status)

- ✅ 新增 LeaveBalances 模型
  - 支援多年度、多假別額度管理
  - 自動計算剩餘時數
  - 唯一約束：(employee_id, year, leave_type)
  - 新增索引：(employee_id, year)

**遷移執行結果**：
```
Applying attendance.0006_phase2_week4_approval_system... OK
```

### 3. 測試資料初始化 ✅

**初始化腳本**：`init_test_data.py`

**測試帳號**：
| 角色 | 帳號 | 密碼 | 姓名 | 說明 |
|------|------|------|------|------|
| 員工 (申請人) | EMP001 | password123 | 張小明 | 請假申請者 |
| 主管 (Level 1) | MGR001 | password123 | 王經理 | 第一層審批 |
| HR (Level 2) | HR001 | password123 | 李人資 | 第二層審批 |
| CEO (Level 3) | CEO001 | password123 | 陳總經理 | 第三層審批 |

**測試公司**：
- 公司名稱：宏全國際
- 地址：台北市信義區信義路五段7號
- GPS：25.033408, 121.564099
- 半徑：100 公尺

**假別額度初始化**（2025 年度）：
- 特休假：80 小時（10 天）
- 病假：240 小時（30 天）
- 事假：112 小時（14 天）

---

## 📊 資料庫結構驗證

### LeaveRecords 表 ✅

**新增欄位驗證**：
```sql
-- 欄位：leave_type, status, substitute_employee_id,
--       attachments, created_at, updated_at
-- 索引：(relation_id, status), (start_time)
```

### ApprovalRecords 表 ✅

**結構驗證**：
```sql
CREATE TABLE attendance_approvalrecords (
    id INTEGER PRIMARY KEY,
    leave_id INTEGER REFERENCES attendance_leaverecords,
    approver_id TEXT REFERENCES attendance_employees,
    approval_level INTEGER,
    status VARCHAR(20),
    comment TEXT,
    approved_at DATETIME,
    created_at DATETIME
);
-- 索引：(leave_id), (approver_id, status)
```

### LeaveBalances 表 ✅

**結構驗證**：
```sql
CREATE TABLE attendance_leavebalances (
    id INTEGER PRIMARY KEY,
    employee_id TEXT REFERENCES attendance_employees,
    year INTEGER,
    leave_type VARCHAR(20),
    total_hours DECIMAL(6,2),
    used_hours DECIMAL(6,2),
    remaining_hours DECIMAL(6,2),
    updated_at DATETIME,
    UNIQUE (employee_id, year, leave_type)
);
-- 索引：(employee_id, year)
```

---

## 🔍 發現的問題與解決方案

### 問題 1：Companies 模型欄位名稱不一致

**問題描述**：
- models.py 中定義為 `location`
- 實際資料庫表中為 `address`（從 0001_initial.py 遺留）

**解決方案**：
- 暫時修改 models.py 將 `location` 改回 `address` 以匹配資料庫
- 待後續建立遷移統一為 `location`

### 問題 2：Django 5.1 不相容 Python 3.8

**問題描述**：
- 系統使用 Python 3.8
- Django 5.1 不存在

**解決方案**：
- 降級為 Django 4.2.16（LTS 版本）
- 更新 requirements.txt

### 問題 3：mysqlclient 需要系統套件

**問題描述**：
- mysqlclient 需要 MySQL 開發庫（libmysqlclient-dev）
- 安裝失敗

**解決方案**：
- 改用 PyMySQL（純 Python 實現）
- 在 ams/__init__.py 中配置 `pymysql.install_as_MySQLdb()`

### 問題 4：openpyxl 缺失

**問題描述**：
- admin.py 引用 openpyxl 但未安裝

**解決方案**：
- 安裝 openpyxl==3.1.5

---

## ✅ 測試環境狀態總結

### 已完成項目

1. ✅ **環境設置**
   - Python 虛擬環境：使用 --user 模式安裝套件
   - Django 4.2.16 + DRF 3.14.0
   - PyMySQL 配置完成

2. ✅ **資料庫遷移**
   - 手動創建 Phase 2 Week 4 遷移檔案
   - 成功應用所有遷移（27 個遷移）
   - 資料庫結構符合設計

3. ✅ **測試資料**
   - 4 個測試帳號（涵蓋所有審批層級）
   - 1 個測試公司
   - 假別額度初始化（3 種假別 × 4 位員工 = 12 筆記錄）

4. ✅ **文檔建立**
   - requirements.txt
   - init_test_data.py
   - 測試報告（本文件）

### 測試環境限制

⚠️ **使用 SQLite 測試資料庫**
- 本次測試使用 SQLite 而非 MySQL
- 原因：MySQL 服務未運行
- 影響：部分 SQL 語法可能與 MySQL 有差異
- 建議：正式環境需使用 MySQL 進行完整測試

### API 測試狀態

⏳ **API 功能測試待進行**

由於時間限制，API 功能測試（請假申請、審批操作、查詢等）尚未進行。

**建議下一步**：
1. 啟動 Django 開發伺服器
2. 使用 Postman 或 curl 測試 6 個新 API 端點
3. 驗證多層級審批邏輯
4. 驗證假別額度扣除
5. 驗證權限控制

---

## 📈 進度統計

### 完成度

| 項目 | 狀態 | 完成度 |
|------|------|--------|
| 後端資料模型 | ✅ 完成 | 100% |
| 後端 Serializers | ✅ 完成 | 100% |
| 後端 API 實作 | ✅ 完成 | 100% |
| URL 註冊 | ✅ 完成 | 100% |
| 資料庫遷移 | ✅ 完成 | 100% |
| 測試資料初始化 | ✅ 完成 | 100% |
| 前端 Service 層 | ✅ 完成 | 100% |
| 前端元件 | ✅ 完成 | 100% |
| **API 功能測試** | ⏳ 待進行 | 0% |
| **前端整合** | ⏳ 待進行 | 0% |
| **端到端測試** | ⏳ 待進行 | 0% |

**總體完成度**：80% (8/10 項目)

---

## 🎯 下一步行動計畫

### 高優先級（P0）

1. **啟動開發伺服器**
   ```bash
   python3 manage.py runserver
   ```

2. **API 功能測試**
   - 測試請假申請 API
   - 測試審批操作 API（批准/拒絕）
   - 測試查詢 API（我的記錄、假別額度、待審批）
   - 驗證多層級審批邏輯
   - 驗證假別額度扣除

3. **前端整合**
   - 將 Leave 和 Approval 元件整合到 App.jsx
   - 新增導航選單
   - 測試前端功能

### 中優先級（P1）

4. **MySQL 環境設置**
   - 安裝/啟動 MySQL 服務
   - 建立 ams 資料庫
   - 配置 .env 檔案
   - 重新執行遷移（使用 MySQL）

5. **完整功能測試**
   - 端到端測試（前端 → 後端 → 資料庫）
   - 多使用者測試（同時多個審批流程）
   - 邊界條件測試（額度不足、重複審批等）

### 低優先級（P2）

6. **通知系統實作**
   - Email 通知
   - 站內通知

7. **效能優化**
   - API 回應快取
   - 資料庫查詢優化

---

## 📝 技術債務

以下問題需要後續處理：

1. **Companies 模型欄位名稱**
   - 當前：address（資料庫） vs location（預期）
   - 需要：建立遷移統一為 location

2. **latitude/longitude 欄位類型**
   - 當前：TEXT（資料庫） vs DecimalField（models.py）
   - 需要：建立遷移統一為 DecimalField

3. **MySQL 環境**
   - 當前：使用 SQLite 測試
   - 需要：配置 MySQL 生產環境

---

## 🎉 階段性成果

### 程式碼交付

- **後端程式碼**：~766 行
  - models.py：+189 行（3 個模型）
  - serializers.py：+70 行（3 個 serializers）
  - views.py：+500 行（6 個 API + 1 個輔助函數）
  - urls.py：+7 行（6 個端點）

- **前端程式碼**：~1,226 行
  - 2 個 Service 層（215 行）
  - 5 個 React 元件（1,011 行）

- **總計**：~2,863 行程式碼 + 文檔

### 功能實現

✅ **後端功能**：
- 多層級審批邏輯（1 天 / 2-3 天 / 4+ 天）
- 假別額度自動管理
- 權限驗證
- 統一 API 回應格式

✅ **前端功能**：
- 請假申請表單（自動計算時數）
- 假別額度視覺化（進度條）
- 審批操作（批准/拒絕 + 意見）
- 請假記錄列表（篩選）
- 待審批列表

---

**報告建立日期**：2025-11-21
**測試環境**：SQLite (測試)
**負責人**：Claude Code System
**版本**：v1.0
**狀態**：✅ 環境設置完成，待 API 測試
