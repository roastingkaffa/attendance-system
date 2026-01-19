# 資料庫設計文件（Database Design Document）
# 宏全出勤管理系統 v2.0

**文件版本**: 1.0
**建立日期**: 2025-11-19
**資料庫**: MySQL 8.0

---

## 目錄
1. [ER 圖與資料模型](#1-er-圖與資料模型)
2. [資料表定義](#2-資料表定義)
3. [索引設計](#3-索引設計)
4. [資料庫遷移計畫](#4-資料庫遷移計畫)
5. [資料字典](#5-資料字典)

---

## 1. ER 圖與資料模型

### 1.1 核心實體關係

```
┌─────────────────┐
│    Employees    │ (繼承 Django AbstractUser)
│─────────────────│
│ PK employee_id  │
│    username     │
│    password     │
│    email        │
│    phone        │
│    address      │
│    role         │ ◄─── 新增：員工角色
│    department   │ ◄─── 新增：部門
│    is_active    │
└────────┬────────┘
         │ 1
         │
         │ N
┌────────▼────────────┐
│  EmpCompanyRel      │ (員工與公司關聯表)
│─────────────────────│
│ PK id               │
│ FK employee_id      │
│ FK company_id       │
│    employment_status│
│    hire_date        │
│    leave_date       │
└────┬────────────┬───┘
     │ 1          │ N
     │            │
     │ N          │ 1
     │            │
     │      ┌─────▼──────────┐
     │      │   Companies    │
     │      │────────────────│
     │      │ PK id          │
     │      │    name        │
     │      │    location    │
     │      │    latitude    │ ◄─── 改為 DECIMAL
     │      │    longitude   │ ◄─── 改為 DECIMAL
     │      │    radius      │
     │      │    is_active   │ ◄─── 新增
     │      │    qr_code     │ ◄─── 新增
     │      └────────────────┘
     │
     ├────────────────────────────────┐
     │ 1                              │ 1
     │ N                              │ N
┌────▼─────────────┐        ┌────────▼───────────┐
│ AttendanceRecords│        │   LeaveRecords     │
│──────────────────│        │────────────────────│
│ PK id            │        │ PK id              │
│ FK relation_id   │        │ FK relation_id     │
│    date          │        │    leave_type      │ ◄─── 新增
│    checkin_time  │        │    start_time      │
│    checkout_time │        │    end_time        │
│    checkin_location       │    leave_hours     │
│    checkout_location      │    leave_reason    │
│    work_hours    │        │    status          │ ◄─── 新增
│    overtime_hours│ ◄───新增│    substitute_emp │ ◄─── 新增
│    status        │ ◄───新增│    created_at      │
│    is_late       │ ◄───新增│    updated_at      │
│    is_early_leave│ ◄───新增└─────────┬──────────┘
│    created_at    │                  │ 1
│    updated_at    │                  │
└──────────────────┘                  │ N
                              ┌───────▼──────────┐
                              │ ApprovalRecords  │ ◄─── 新增
                              │──────────────────│
                              │ PK id            │
                              │ FK leave_id      │
                              │ FK approver_id   │
                              │    approval_level│
                              │    status        │
                              │    comment       │
                              │    approved_at   │
                              │    created_at    │
                              └──────────────────┘

┌────────────────────┐
│   Notifications    │ ◄─── 新增
│────────────────────│
│ PK id              │
│ FK recipient_id    │
│    notification_type
│    title           │
│    message         │
│    link            │
│    is_read         │
│    created_at      │
└────────────────────┘

┌────────────────────┐
│    AuditLogs       │ ◄─── 新增
│────────────────────│
│ PK id              │
│ FK user_id         │
│    action          │
│    resource_type   │
│    resource_id     │
│    ip_address      │
│    user_agent      │
│    request_data    │
│    result          │
│    created_at      │
└────────────────────┘

┌────────────────────┐
│  LeaveBalances     │ ◄─── 新增
│────────────────────│
│ PK id              │
│ FK employee_id     │
│    year            │
│    leave_type      │
│    total_hours     │
│    used_hours      │
│    remaining_hours │
│    updated_at      │
└────────────────────┘

┌────────────────────┐
│  SystemSettings    │ ◄─── 新增
│────────────────────│
│ PK key             │
│    value           │
│    description     │
│    updated_at      │
│    updated_by      │
└────────────────────┘

┌────────────────────┐
│  Departments       │ ◄─── 新增
│────────────────────│
│ PK id              │
│ FK company_id      │
│    name            │
│    manager_id      │
│    parent_dept_id  │
│    is_active       │
└────────────────────┘
```

---

## 2. 資料表定義

### 2.1 Employees (員工表)

**用途**: 儲存員工基本資料與認證資訊（繼承 Django AbstractUser）

| 欄位名稱 | 資料類型 | 長度 | NULL | 預設值 | 說明 | 索引 |
|---------|---------|------|------|-------|------|------|
| employee_id | VARCHAR | 20 | NO | - | 員工編號（主鍵） | PK |
| username | VARCHAR | 150 | NO | - | 使用者名稱（姓名） | - |
| password | VARCHAR | 128 | NO | - | 密碼雜湊（PBKDF2-SHA256） | - |
| email | VARCHAR | 254 | YES | NULL | 電子郵件 | INDEX |
| phone | VARCHAR | 20 | YES | NULL | 電話號碼 | - |
| address | TEXT | - | YES | NULL | 地址 | - |
| role | VARCHAR | 20 | NO | 'employee' | 角色（employee, manager, hr_admin, system_admin） | INDEX |
| department_id | INT | - | YES | NULL | 部門 ID（FK to Departments） | INDEX |
| national_id | VARCHAR | 20 | YES | NULL | 身分證字號（加密） | - |
| hire_date | DATE | - | YES | NULL | 入職日期 | - |
| is_active | BOOLEAN | - | NO | TRUE | 帳號狀態 | - |
| is_staff | BOOLEAN | - | NO | FALSE | Django Admin 權限 | - |
| is_superuser | BOOLEAN | - | NO | FALSE | 超級使用者 | - |
| date_joined | DATETIME | - | NO | NOW() | 建立時間 | - |
| last_login | DATETIME | - | YES | NULL | 最後登入時間 | - |

**主鍵**: `employee_id`

**外鍵**:
- `department_id` REFERENCES `Departments(id)` ON DELETE SET NULL

**唯一約束**:
- `employee_id` (PRIMARY KEY)
- `email` (如果不為 NULL)

**索引**:
```sql
CREATE INDEX idx_employees_email ON Employees(email);
CREATE INDEX idx_employees_role ON Employees(role);
CREATE INDEX idx_employees_department ON Employees(department_id);
CREATE INDEX idx_employees_is_active ON Employees(is_active);
```

**資料範例**:
```sql
INSERT INTO Employees (employee_id, username, password, email, phone, role, department_id, is_active)
VALUES
('EMP001', '張三', 'pbkdf2_sha256$...', 'zhang@company.com', '0912345678', 'employee', 1, TRUE),
('MGR001', '李四', 'pbkdf2_sha256$...', 'li@company.com', '0923456789', 'manager', 1, TRUE),
('HR001', '王五', 'pbkdf2_sha256$...', 'wang@company.com', '0934567890', 'hr_admin', 2, TRUE);
```

**業務規則**:
1. `employee_id` 格式：`EMP` + 3 位數字（員工）、`MGR` + 3 位數字（主管）、`HR` + 3 位數字（HR）
2. `role` 只能是：`employee`, `manager`, `hr_admin`, `system_admin`
3. 離職員工設定 `is_active = FALSE`，不刪除記錄
4. `password` 必須經過 Django 的 `make_password()` 加密

---

### 2.2 Companies (公司表)

**用途**: 儲存公司/辦公地點資訊

| 欄位名稱 | 資料類型 | 長度 | NULL | 預設值 | 說明 | 索引 |
|---------|---------|------|------|-------|------|------|
| id | INT | - | NO | AUTO | 公司 ID（主鍵） | PK |
| name | VARCHAR | 100 | NO | - | 公司名稱 | - |
| location | TEXT | - | NO | - | 公司地址 | - |
| latitude | DECIMAL | 10,7 | NO | - | 緯度（-90 ~ 90） | INDEX |
| longitude | DECIMAL | 10,7 | NO | - | 經度（-180 ~ 180） | INDEX |
| radius | DECIMAL | 7,2 | NO | 2000.00 | GPS 合法範圍半徑（公尺） | - |
| qr_code | VARCHAR | 500 | YES | NULL | QR Code 圖片路徑或資料 | - |
| is_active | BOOLEAN | - | NO | TRUE | 是否啟用 | - |
| created_at | DATETIME | - | NO | NOW() | 建立時間 | - |
| updated_at | DATETIME | - | NO | NOW() | 更新時間 | - |

**主鍵**: `id`

**索引**:
```sql
CREATE INDEX idx_companies_location ON Companies(latitude, longitude);
CREATE INDEX idx_companies_is_active ON Companies(is_active);
```

**CHECK 約束**:
```sql
ALTER TABLE Companies ADD CONSTRAINT chk_latitude CHECK (latitude >= -90 AND latitude <= 90);
ALTER TABLE Companies ADD CONSTRAINT chk_longitude CHECK (longitude >= -180 AND longitude <= 180);
ALTER TABLE Companies ADD CONSTRAINT chk_radius CHECK (radius > 0);
```

**資料範例**:
```sql
INSERT INTO Companies (name, location, latitude, longitude, radius, is_active)
VALUES
('台北總公司', '台北市信義區信義路五段7號', 25.0330000, 121.5654000, 2000.00, TRUE),
('新竹分公司', '新竹市東區光復路二段101號', 24.8138287, 120.9674798, 1500.00, TRUE);
```

**業務規則**:
1. `latitude` 精度：小數點後 7 位（約 1 公分精度）
2. `longitude` 精度：小數點後 7 位
3. `radius` 預設 2000 公尺，可由 HR 管理員調整
4. QR Code 內容格式：`{latitude}, {longitude}`（如：`25.0330000, 121.5654000`）

---

### 2.3 EmpCompanyRel (員工與公司關聯表)

**用途**: 儲存員工與公司的聘僱關係（支援一個員工在多個公司工作）

| 欄位名稱 | 資料類型 | 長度 | NULL | 預設值 | 說明 | 索引 |
|---------|---------|------|------|-------|------|------|
| id | INT | - | NO | AUTO | 關聯 ID（主鍵） | PK |
| employee_id | VARCHAR | 20 | NO | - | 員工編號（FK） | INDEX |
| company_id | INT | - | NO | - | 公司 ID（FK） | INDEX |
| employment_status | BOOLEAN | - | NO | TRUE | 在職狀態 | INDEX |
| hire_date | DATE | - | NO | - | 入職日期 | - |
| leave_date | DATE | - | YES | NULL | 離職日期 | - |
| created_at | DATETIME | - | NO | NOW() | 建立時間 | - |
| updated_at | DATETIME | - | NO | NOW() | 更新時間 | - |

**主鍵**: `id`

**外鍵**:
- `employee_id` REFERENCES `Employees(employee_id)` ON DELETE CASCADE
- `company_id` REFERENCES `Companies(id)` ON DELETE CASCADE

**唯一約束**:
- `(employee_id, company_id)` 同一員工不可在同一公司有多筆關聯

**索引**:
```sql
CREATE INDEX idx_empcompanyrel_employee ON EmpCompanyRel(employee_id);
CREATE INDEX idx_empcompanyrel_company ON EmpCompanyRel(company_id);
CREATE INDEX idx_empcompanyrel_status ON EmpCompanyRel(employment_status);
CREATE UNIQUE INDEX idx_empcompanyrel_unique ON EmpCompanyRel(employee_id, company_id);
```

**資料範例**:
```sql
INSERT INTO EmpCompanyRel (employee_id, company_id, employment_status, hire_date)
VALUES
('EMP001', 1, TRUE, '2024-01-01'),
('EMP001', 2, TRUE, '2024-06-01'),  -- 員工可在多個公司
('MGR001', 1, TRUE, '2023-03-15');
```

**業務規則**:
1. 離職時設定 `employment_status = FALSE` 和 `leave_date`
2. 不刪除歷史關聯記錄，以保留出勤歷史
3. 一個員工可以在多個公司工作（兼職、調動）

---

### 2.4 AttendanceRecords (出勤記錄表)

**用途**: 儲存員工的上下班打卡記錄

| 欄位名稱 | 資料類型 | 長度 | NULL | 預設值 | 說明 | 索引 |
|---------|---------|------|------|-------|------|------|
| id | INT | - | NO | AUTO | 記錄 ID（主鍵） | PK |
| relation_id | INT | - | NO | - | 關聯 ID（FK） | INDEX |
| date | DATE | - | NO | - | 考勤日期 | INDEX |
| checkin_time | DATETIME | - | NO | - | 上班打卡時間 | - |
| checkout_time | DATETIME | - | YES | NULL | 下班打卡時間 | - |
| checkin_location | VARCHAR | 100 | NO | - | 上班打卡位置（lat, lng） | - |
| checkout_location | VARCHAR | 100 | YES | NULL | 下班打卡位置（lat, lng） | - |
| work_hours | DECIMAL | 5,2 | NO | 0.00 | 上班總時數 | - |
| overtime_hours | DECIMAL | 5,2 | NO | 0.00 | 加班時數 | - |
| status | VARCHAR | 20 | NO | 'normal' | 狀態（normal, late, early_leave, absent, makeup） | INDEX |
| is_late | BOOLEAN | - | NO | FALSE | 是否遲到 | - |
| is_early_leave | BOOLEAN | - | NO | FALSE | 是否早退 | - |
| checkin_distance | DECIMAL | 7,2 | YES | NULL | 上班打卡距離（公尺） | - |
| checkout_distance | DECIMAL | 7,2 | YES | NULL | 下班打卡距離（公尺） | - |
| notes | TEXT | - | YES | NULL | 備註 | - |
| created_at | DATETIME | - | NO | NOW() | 建立時間 | - |
| updated_at | DATETIME | - | NO | NOW() | 更新時間 | - |

**主鍵**: `id`

**外鍵**:
- `relation_id` REFERENCES `EmpCompanyRel(id)` ON DELETE CASCADE

**唯一約束**:
- `(relation_id, date)` 一天只能有一筆打卡記錄

**索引**:
```sql
CREATE INDEX idx_attendance_relation ON AttendanceRecords(relation_id);
CREATE INDEX idx_attendance_date ON AttendanceRecords(date);
CREATE INDEX idx_attendance_relation_date ON AttendanceRecords(relation_id, date);
CREATE INDEX idx_attendance_status ON AttendanceRecords(status);
CREATE UNIQUE INDEX idx_attendance_unique ON AttendanceRecords(relation_id, date);
```

**資料範例**:
```sql
INSERT INTO AttendanceRecords
(relation_id, date, checkin_time, checkout_time, checkin_location, checkout_location, work_hours, overtime_hours, status, is_late)
VALUES
(1, '2025-11-19', '2025-11-19 08:25:30', '2025-11-19 17:05:15', '25.0335, 121.5660', '25.0332, 121.5658', 8.00, 0.00, 'normal', FALSE),
(1, '2025-11-18', '2025-11-18 08:45:00', '2025-11-18 18:30:20', '25.0338, 121.5662', '25.0330, 121.5655', 8.75, 0.75, 'late', TRUE);
```

**業務規則**:
1. **工時計算**:
   - `work_hours = (checkout_time - checkin_time) - 午休時間`
   - 午休時間：12:00-13:00（1 小時）
   - 若跨午休時段，自動扣除 1 小時
2. **遲到判定**:
   - `checkin_time > 08:30` → `is_late = TRUE`, `status = 'late'`
3. **早退判定**:
   - `checkout_time < 17:00` → `is_early_leave = TRUE`, `status = 'early_leave'`
4. **加班計算**:
   - 17:00-17:30：緩衝時間，不計加班
   - `checkout_time > 17:30` → `overtime_hours = (checkout_time - 17:30) / 60`
5. **缺勤判定**:
   - 當日無打卡記錄且無請假 → 系統自動產生 `status = 'absent'` 記錄
6. **補打卡**:
   - 補打卡記錄標記 `status = 'makeup'`

---

### 2.5 LeaveRecords (請假記錄表)

**用途**: 儲存員工的請假申請記錄

| 欄位名稱 | 資料類型 | 長度 | NULL | 預設值 | 說明 | 索引 |
|---------|---------|------|------|-------|------|------|
| id | INT | - | NO | AUTO | 記錄 ID（主鍵） | PK |
| relation_id | INT | - | NO | - | 關聯 ID（FK） | INDEX |
| leave_type | VARCHAR | 20 | NO | - | 假別（annual, sick, personal, marriage, bereavement, maternity） | INDEX |
| start_time | DATETIME | - | NO | - | 請假開始時間 | INDEX |
| end_time | DATETIME | - | NO | - | 請假結束時間 | - |
| leave_hours | DECIMAL | 5,2 | NO | - | 請假總時數 | - |
| leave_reason | TEXT | - | YES | NULL | 請假原因 | - |
| substitute_employee_id | VARCHAR | 20 | YES | NULL | 職務代理人（FK） | - |
| status | VARCHAR | 20 | NO | 'pending' | 狀態（pending, approved, rejected, cancelled） | INDEX |
| attachments | JSON | - | YES | NULL | 附件（醫生證明、證書等） | - |
| created_at | DATETIME | - | NO | NOW() | 建立時間 | - |
| updated_at | DATETIME | - | NO | NOW() | 更新時間 | - |

**主鍵**: `id`

**外鍵**:
- `relation_id` REFERENCES `EmpCompanyRel(id)` ON DELETE CASCADE
- `substitute_employee_id` REFERENCES `Employees(employee_id)` ON DELETE SET NULL

**索引**:
```sql
CREATE INDEX idx_leave_relation ON LeaveRecords(relation_id);
CREATE INDEX idx_leave_type ON LeaveRecords(leave_type);
CREATE INDEX idx_leave_status ON LeaveRecords(status);
CREATE INDEX idx_leave_start_time ON LeaveRecords(start_time);
CREATE INDEX idx_leave_relation_status ON LeaveRecords(relation_id, status);
```

**資料範例**:
```sql
INSERT INTO LeaveRecords
(relation_id, leave_type, start_time, end_time, leave_hours, leave_reason, status)
VALUES
(1, 'annual', '2025-11-20 08:30:00', '2025-11-20 17:30:00', 8.00, '家庭事務', 'pending'),
(1, 'sick', '2025-11-18 08:30:00', '2025-11-18 12:30:00', 4.00, '身體不適', 'approved'),
(2, 'marriage', '2025-12-01 08:30:00', '2025-12-08 17:30:00', 56.00, '結婚', 'pending');
```

**業務規則**:
1. **假別代碼**:
   - `annual`: 特休假
   - `sick`: 病假
   - `personal`: 事假
   - `marriage`: 婚假
   - `bereavement`: 喪假
   - `maternity`: 產假
   - `paternity`: 陪產假
   - `compensatory`: 補休
2. **請假時數計算**:
   - 整天：8 小時（扣除午休 1 小時）
   - 早上：4 小時（08:30-12:30）
   - 下午：4 小時（13:30-17:30）
   - 連續請假：跨多天計算
3. **審批流程**:
   - 1 天以內：主管審批
   - 2-3 天：主管 → HR
   - 4 天以上：主管 → HR → 總經理
4. **狀態轉換**:
   ```
   pending → approved (審批通過)
   pending → rejected (審批拒絕)
   pending → cancelled (員工撤銷)
   approved → cancelled (取消請假，需重新申請)
   ```

---

### 2.6 ApprovalRecords (審批記錄表)

**用途**: 儲存請假/補打卡的審批流程記錄

| 欄位名稱 | 資料類型 | 長度 | NULL | 預設值 | 說明 | 索引 |
|---------|---------|------|------|-------|------|------|
| id | INT | - | NO | AUTO | 記錄 ID（主鍵） | PK |
| leave_id | INT | - | YES | NULL | 請假 ID（FK） | INDEX |
| makeup_id | INT | - | YES | NULL | 補打卡 ID（FK，預留） | INDEX |
| approver_id | VARCHAR | 20 | NO | - | 審批人 ID（FK） | INDEX |
| approval_level | INT | - | NO | 1 | 審批層級（1=主管, 2=HR, 3=總經理） | - |
| status | VARCHAR | 20 | NO | 'pending' | 狀態（pending, approved, rejected） | INDEX |
| comment | TEXT | - | YES | NULL | 審批意見 | - |
| approved_at | DATETIME | - | YES | NULL | 審批時間 | - |
| created_at | DATETIME | - | NO | NOW() | 建立時間 | - |

**主鍵**: `id`

**外鍵**:
- `leave_id` REFERENCES `LeaveRecords(id)` ON DELETE CASCADE
- `approver_id` REFERENCES `Employees(employee_id)` ON DELETE CASCADE

**索引**:
```sql
CREATE INDEX idx_approval_leave ON ApprovalRecords(leave_id);
CREATE INDEX idx_approval_approver ON ApprovalRecords(approver_id);
CREATE INDEX idx_approval_status ON ApprovalRecords(status);
```

**資料範例**:
```sql
INSERT INTO ApprovalRecords
(leave_id, approver_id, approval_level, status, comment, approved_at)
VALUES
(1, 'MGR001', 1, 'pending', NULL, NULL),
(2, 'MGR001', 1, 'approved', '同意', '2025-11-18 10:30:00'),
(3, 'MGR001', 1, 'approved', '同意', '2025-11-15 14:20:00'),
(3, 'HR001', 2, 'pending', NULL, NULL);
```

**業務規則**:
1. **審批層級**:
   - Level 1: 部門主管
   - Level 2: HR 管理員
   - Level 3: 總經理（特殊情況）
2. **審批順序**:
   - 按 `approval_level` 由小到大依序審批
   - 前一級未通過，後續級別不觸發
3. **逾期提醒**:
   - 48 小時內未審批，系統發送提醒通知
   - 72 小時仍未審批，自動升級至上一層審批人

---

### 2.7 LeaveBalances (假別額度表)

**用途**: 儲存員工各類假別的額度與使用情況

| 欄位名稱 | 資料類型 | 長度 | NULL | 預設值 | 說明 | 索引 |
|---------|---------|------|------|-------|------|------|
| id | INT | - | NO | AUTO | 記錄 ID（主鍵） | PK |
| employee_id | VARCHAR | 20 | NO | - | 員工編號（FK） | INDEX |
| year | INT | - | NO | - | 年度 | INDEX |
| leave_type | VARCHAR | 20 | NO | - | 假別 | INDEX |
| total_hours | DECIMAL | 6,2 | NO | 0.00 | 總額度（小時） | - |
| used_hours | DECIMAL | 6,2 | NO | 0.00 | 已使用（小時） | - |
| remaining_hours | DECIMAL | 6,2 | NO | 0.00 | 剩餘（小時） | - |
| updated_at | DATETIME | - | NO | NOW() | 更新時間 | - |

**主鍵**: `id`

**外鍵**:
- `employee_id` REFERENCES `Employees(employee_id)` ON DELETE CASCADE

**唯一約束**:
- `(employee_id, year, leave_type)` 同一員工同一年度同一假別只有一筆記錄

**索引**:
```sql
CREATE INDEX idx_leavebalance_employee ON LeaveBalances(employee_id);
CREATE INDEX idx_leavebalance_year ON LeaveBalances(year);
CREATE UNIQUE INDEX idx_leavebalance_unique ON LeaveBalances(employee_id, year, leave_type);
```

**資料範例**:
```sql
INSERT INTO LeaveBalances
(employee_id, year, leave_type, total_hours, used_hours, remaining_hours)
VALUES
('EMP001', 2025, 'annual', 80.00, 24.00, 56.00),
('EMP001', 2025, 'sick', 240.00, 4.00, 236.00),
('EMP001', 2025, 'personal', 112.00, 0.00, 112.00);
```

**業務規則**:
1. **特休假額度**（依年資）:
   - < 1 年：0 小時
   - 1-2 年：56 小時（7 天 × 8 小時）
   - 3-5 年：80 小時（10 天 × 8 小時）
   - 5+ 年：120 小時（15 天 × 8 小時）
2. **病假額度**:
   - 240 小時/年（30 天 × 8 小時）
3. **事假額度**:
   - 112 小時/年（14 天 × 8 小時，無薪）
4. **額度計算**:
   - `remaining_hours = total_hours - used_hours`
   - 請假審批通過後自動扣除 `used_hours`
   - 年度結束時，未使用的特休可結轉（最多 2 年）

---

### 2.8 Notifications (通知表)

**用途**: 儲存系統通知

| 欄位名稱 | 資料類型 | 長度 | NULL | 預設值 | 說明 | 索引 |
|---------|---------|------|------|-------|------|------|
| id | INT | - | NO | AUTO | 通知 ID（主鍵） | PK |
| recipient_id | VARCHAR | 20 | NO | - | 接收人 ID（FK） | INDEX |
| notification_type | VARCHAR | 50 | NO | - | 通知類型 | INDEX |
| title | VARCHAR | 200 | NO | - | 通知標題 | - |
| message | TEXT | NO | - | 通知內容 | - |
| link | VARCHAR | 500 | YES | NULL | 相關連結 | - |
| is_read | BOOLEAN | - | NO | FALSE | 是否已讀 | INDEX |
| created_at | DATETIME | - | NO | NOW() | 建立時間 | INDEX |

**主鍵**: `id`

**外鍵**:
- `recipient_id` REFERENCES `Employees(employee_id)` ON DELETE CASCADE

**索引**:
```sql
CREATE INDEX idx_notification_recipient ON Notifications(recipient_id);
CREATE INDEX idx_notification_type ON Notifications(notification_type);
CREATE INDEX idx_notification_is_read ON Notifications(is_read);
CREATE INDEX idx_notification_created ON Notifications(created_at);
CREATE INDEX idx_notification_recipient_read ON Notifications(recipient_id, is_read);
```

**資料範例**:
```sql
INSERT INTO Notifications
(recipient_id, notification_type, title, message, link, is_read)
VALUES
('EMP001', 'leave_approved', '請假申請已批准', '您的特休假申請（2025-11-20）已批准', '/leave/123', FALSE),
('MGR001', 'leave_pending', '待審批請假申請', '員工 EMP001 提交了請假申請', '/approval/leave/123', FALSE);
```

**業務規則**:
1. **通知類型**:
   - `leave_approved`: 請假批准
   - `leave_rejected`: 請假拒絕
   - `leave_pending`: 待審批請假
   - `makeup_approved`: 補打卡批准
   - `attendance_anomaly`: 出勤異常提醒
   - `system_announcement`: 系統公告
2. **保留期限**: 30 天後自動刪除已讀通知
3. **發送方式**: 站內通知 + Email（可由使用者設定偏好）

---

### 2.9 AuditLogs (稽核日誌表)

**用途**: 記錄所有關鍵操作，用於安全審計

| 欄位名稱 | 資料類型 | 長度 | NULL | 預設值 | 說明 | 索引 |
|---------|---------|------|------|-------|------|------|
| id | BIGINT | - | NO | AUTO | 日誌 ID（主鍵） | PK |
| user_id | VARCHAR | 20 | YES | NULL | 操作人 ID（FK） | INDEX |
| action | VARCHAR | 50 | NO | - | 操作類型 | INDEX |
| resource_type | VARCHAR | 50 | YES | NULL | 資源類型 | - |
| resource_id | VARCHAR | 50 | YES | NULL | 資源 ID | - |
| ip_address | VARCHAR | 45 | YES | NULL | IP 位址（支援 IPv6） | INDEX |
| user_agent | TEXT | - | YES | NULL | User-Agent | - |
| request_data | JSON | - | YES | NULL | 請求資料 | - |
| result | VARCHAR | 20 | NO | - | 結果（success, failed） | INDEX |
| error_message | TEXT | - | YES | NULL | 錯誤訊息 | - |
| created_at | DATETIME | - | NO | NOW() | 建立時間 | INDEX |

**主鍵**: `id`

**外鍵**:
- `user_id` REFERENCES `Employees(employee_id)` ON DELETE SET NULL

**索引**:
```sql
CREATE INDEX idx_auditlog_user ON AuditLogs(user_id);
CREATE INDEX idx_auditlog_action ON AuditLogs(action);
CREATE INDEX idx_auditlog_ip ON AuditLogs(ip_address);
CREATE INDEX idx_auditlog_result ON AuditLogs(result);
CREATE INDEX idx_auditlog_created ON AuditLogs(created_at);
```

**資料範例**:
```sql
INSERT INTO AuditLogs
(user_id, action, resource_type, resource_id, ip_address, result)
VALUES
('EMP001', 'login', NULL, NULL, '192.168.1.100', 'success'),
('EMP001', 'clock_in', 'AttendanceRecord', '123', '192.168.1.100', 'success'),
('MGR001', 'approve_leave', 'LeaveRecord', '456', '192.168.1.105', 'success'),
(NULL, 'login', NULL, NULL, '192.168.1.200', 'failed');
```

**業務規則**:
1. **記錄的操作**:
   - 登入/登出（成功與失敗）
   - 打卡（上下班）
   - 請假申請/審批
   - 員工資料修改
   - 權限變更
   - 敏感資料存取
2. **資料保留**: 7 年（符合稅務法規）
3. **不可修改**: 日誌記錄不可被修改或刪除
4. **敏感資料脫敏**: `request_data` 中的密碼、個資需脫敏

---

### 2.10 SystemSettings (系統設定表)

**用途**: 儲存系統可調整的參數

| 欄位名稱 | 資料類型 | 長度 | NULL | 預設值 | 說明 | 索引 |
|---------|---------|------|------|-------|------|------|
| key | VARCHAR | 100 | NO | - | 設定鍵（主鍵） | PK |
| value | TEXT | - | NO | - | 設定值 | - |
| data_type | VARCHAR | 20 | NO | 'string' | 資料類型（string, int, float, boolean, json） | - |
| description | TEXT | - | YES | NULL | 說明 | - |
| updated_at | DATETIME | - | NO | NOW() | 更新時間 | - |
| updated_by | VARCHAR | 20 | YES | NULL | 更新人（FK） | - |

**主鍵**: `key`

**外鍵**:
- `updated_by` REFERENCES `Employees(employee_id)` ON DELETE SET NULL

**資料範例**:
```sql
INSERT INTO SystemSettings (key, value, data_type, description)
VALUES
('work_start_time', '08:30', 'string', '標準上班時間'),
('work_end_time', '17:30', 'string', '標準下班時間'),
('lunch_start_time', '12:00', 'string', '午休開始時間'),
('lunch_end_time', '13:00', 'string', '午休結束時間'),
('late_threshold_minutes', '5', 'int', '遲到容忍時間（分鐘）'),
('overtime_buffer_minutes', '30', 'int', '加班緩衝時間（分鐘）'),
('default_checkin_radius', '2000', 'float', '預設打卡範圍（公尺）'),
('session_timeout_hours', '8', 'int', 'Session 有效期限（小時）'),
('password_min_length', '8', 'int', '密碼最小長度'),
('login_max_attempts', '3', 'int', '登入最大嘗試次數'),
('account_lockout_minutes', '15', 'int', '帳號鎖定時間（分鐘）');
```

**業務規則**:
1. 僅系統管理員可修改
2. 修改後立即生效（部分需重啟）
3. 記錄所有變更稽核日誌

---

### 2.11 Departments (部門表)

**用途**: 儲存組織架構

| 欄位名稱 | 資料類型 | 長度 | NULL | 預設值 | 說明 | 索引 |
|---------|---------|------|------|-------|------|------|
| id | INT | - | NO | AUTO | 部門 ID（主鍵） | PK |
| company_id | INT | - | NO | - | 所屬公司（FK） | INDEX |
| name | VARCHAR | 100 | NO | - | 部門名稱 | - |
| manager_id | VARCHAR | 20 | YES | NULL | 部門主管（FK） | INDEX |
| parent_dept_id | INT | YES | NULL | 上層部門（FK） | INDEX |
| level | INT | - | NO | 1 | 部門層級 | - |
| is_active | BOOLEAN | - | NO | TRUE | 是否啟用 | - |
| created_at | DATETIME | - | NO | NOW() | 建立時間 | - |
| updated_at | DATETIME | - | NO | NOW() | 更新時間 | - |

**主鍵**: `id`

**外鍵**:
- `company_id` REFERENCES `Companies(id)` ON DELETE CASCADE
- `manager_id` REFERENCES `Employees(employee_id)` ON DELETE SET NULL
- `parent_dept_id` REFERENCES `Departments(id)` ON DELETE SET NULL

**索引**:
```sql
CREATE INDEX idx_department_company ON Departments(company_id);
CREATE INDEX idx_department_manager ON Departments(manager_id);
CREATE INDEX idx_department_parent ON Departments(parent_dept_id);
```

**資料範例**:
```sql
INSERT INTO Departments (company_id, name, manager_id, parent_dept_id, level, is_active)
VALUES
(1, '人力資源部', 'HR001', NULL, 1, TRUE),
(1, '研發部', 'MGR001', NULL, 1, TRUE),
(1, '前端組', 'MGR002', 2, 2, TRUE),
(1, '後端組', 'MGR003', 2, 2, TRUE);
```

**業務規則**:
1. 支援多層級組織架構
2. `level` 表示部門層級（1=一級部門, 2=二級部門）
3. 主管必須是該部門或上層部門的員工

---

## 3. 索引設計

### 3.1 複合索引策略

```sql
-- 常用查詢：查詢某員工某日期範圍的出勤記錄
CREATE INDEX idx_attendance_employee_date_range
ON AttendanceRecords(relation_id, date);

-- 常用查詢：查詢某員工某狀態的請假記錄
CREATE INDEX idx_leave_employee_status
ON LeaveRecords(relation_id, status);

-- 常用查詢：查詢某審批人待審批的記錄
CREATE INDEX idx_approval_approver_status
ON ApprovalRecords(approver_id, status, created_at);

-- 常用查詢：查詢某員工未讀通知
CREATE INDEX idx_notification_recipient_unread
ON Notifications(recipient_id, is_read, created_at);
```

### 3.2 索引效能分析

| 索引 | 預估改善 | 使用場景 |
|------|---------|---------|
| `idx_attendance_relation_date` | 90% | 查詢個人出勤記錄 |
| `idx_leave_employee_status` | 85% | 查詢待審批請假 |
| `idx_approval_approver_status` | 80% | 主管查看待辦事項 |
| `idx_notification_recipient_unread` | 75% | 查詢未讀通知 |

---

## 4. 資料庫遷移計畫

### 4.1 從舊版本遷移

**問題分析**:
1. `Companies.latitude` 和 `Companies.longitude` 為 `TEXT` 類型
2. 缺少必要欄位（`role`, `department_id`, `status`, `overtime_hours` 等）
3. 缺少新增表格（`ApprovalRecords`, `Notifications`, `AuditLogs` 等）

**遷移步驟**:

```sql
-- Step 1: 備份舊資料
CREATE TABLE Employees_backup AS SELECT * FROM Employees;
CREATE TABLE Companies_backup AS SELECT * FROM Companies;
CREATE TABLE AttendanceRecords_backup AS SELECT * FROM AttendanceRecords;
CREATE TABLE LeaveRecords_backup AS SELECT * FROM LeaveRecords;

-- Step 2: 修改 Companies 表
ALTER TABLE Companies
MODIFY COLUMN latitude DECIMAL(10,7) NOT NULL,
MODIFY COLUMN longitude DECIMAL(10,7) NOT NULL;

-- 驗證資料範圍
SELECT * FROM Companies
WHERE latitude < -90 OR latitude > 90
   OR longitude < -180 OR longitude > 180;

-- Step 3: 新增欄位至 Employees
ALTER TABLE Employees
ADD COLUMN role VARCHAR(20) NOT NULL DEFAULT 'employee' AFTER address,
ADD COLUMN department_id INT DEFAULT NULL AFTER role,
ADD INDEX idx_employees_role(role),
ADD INDEX idx_employees_department(department_id);

-- Step 4: 新增欄位至 AttendanceRecords
ALTER TABLE AttendanceRecords
ADD COLUMN overtime_hours DECIMAL(5,2) NOT NULL DEFAULT 0.00 AFTER work_hours,
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'normal' AFTER overtime_hours,
ADD COLUMN is_late BOOLEAN NOT NULL DEFAULT FALSE AFTER status,
ADD COLUMN is_early_leave BOOLEAN NOT NULL DEFAULT FALSE AFTER is_late,
ADD COLUMN checkin_distance DECIMAL(7,2) DEFAULT NULL AFTER is_early_leave,
ADD COLUMN checkout_distance DECIMAL(7,2) DEFAULT NULL AFTER checkin_distance,
ADD COLUMN notes TEXT DEFAULT NULL AFTER checkout_distance,
ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER notes,
ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
ADD INDEX idx_attendance_status(status);

-- Step 5: 新增欄位至 LeaveRecords
ALTER TABLE LeaveRecords
ADD COLUMN leave_type VARCHAR(20) NOT NULL DEFAULT 'annual' AFTER relation_id,
ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'pending' AFTER leave_reason,
ADD COLUMN substitute_employee_id VARCHAR(20) DEFAULT NULL AFTER status,
ADD COLUMN attachments JSON DEFAULT NULL AFTER substitute_employee_id,
ADD COLUMN created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER attachments,
ADD COLUMN updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at,
ADD INDEX idx_leave_type(leave_type),
ADD INDEX idx_leave_status(status);

-- Step 6: 建立新表格
CREATE TABLE ApprovalRecords (
    id INT AUTO_INCREMENT PRIMARY KEY,
    leave_id INT DEFAULT NULL,
    makeup_id INT DEFAULT NULL,
    approver_id VARCHAR(20) NOT NULL,
    approval_level INT NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    comment TEXT DEFAULT NULL,
    approved_at DATETIME DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (leave_id) REFERENCES LeaveRecords(id) ON DELETE CASCADE,
    FOREIGN KEY (approver_id) REFERENCES Employees(employee_id) ON DELETE CASCADE,
    INDEX idx_approval_leave(leave_id),
    INDEX idx_approval_approver(approver_id),
    INDEX idx_approval_status(status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE LeaveBalances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    employee_id VARCHAR(20) NOT NULL,
    year INT NOT NULL,
    leave_type VARCHAR(20) NOT NULL,
    total_hours DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    used_hours DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    remaining_hours DECIMAL(6,2) NOT NULL DEFAULT 0.00,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (employee_id) REFERENCES Employees(employee_id) ON DELETE CASCADE,
    UNIQUE KEY idx_leavebalance_unique(employee_id, year, leave_type),
    INDEX idx_leavebalance_employee(employee_id),
    INDEX idx_leavebalance_year(year)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Notifications (
    id INT AUTO_INCREMENT PRIMARY KEY,
    recipient_id VARCHAR(20) NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    link VARCHAR(500) DEFAULT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (recipient_id) REFERENCES Employees(employee_id) ON DELETE CASCADE,
    INDEX idx_notification_recipient(recipient_id),
    INDEX idx_notification_type(notification_type),
    INDEX idx_notification_is_read(is_read),
    INDEX idx_notification_created(created_at),
    INDEX idx_notification_recipient_read(recipient_id, is_read)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE AuditLogs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id VARCHAR(20) DEFAULT NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) DEFAULT NULL,
    resource_id VARCHAR(50) DEFAULT NULL,
    ip_address VARCHAR(45) DEFAULT NULL,
    user_agent TEXT DEFAULT NULL,
    request_data JSON DEFAULT NULL,
    result VARCHAR(20) NOT NULL,
    error_message TEXT DEFAULT NULL,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Employees(employee_id) ON DELETE SET NULL,
    INDEX idx_auditlog_user(user_id),
    INDEX idx_auditlog_action(action),
    INDEX idx_auditlog_ip(ip_address),
    INDEX idx_auditlog_result(result),
    INDEX idx_auditlog_created(created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE SystemSettings (
    `key` VARCHAR(100) PRIMARY KEY,
    value TEXT NOT NULL,
    data_type VARCHAR(20) NOT NULL DEFAULT 'string',
    description TEXT DEFAULT NULL,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by VARCHAR(20) DEFAULT NULL,
    FOREIGN KEY (updated_by) REFERENCES Employees(employee_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE Departments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    company_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    manager_id VARCHAR(20) DEFAULT NULL,
    parent_dept_id INT DEFAULT NULL,
    level INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES Companies(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES Employees(employee_id) ON DELETE SET NULL,
    FOREIGN KEY (parent_dept_id) REFERENCES Departments(id) ON DELETE SET NULL,
    INDEX idx_department_company(company_id),
    INDEX idx_department_manager(manager_id),
    INDEX idx_department_parent(parent_dept_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Step 7: 初始化系統設定
INSERT INTO SystemSettings (key, value, data_type, description) VALUES
('work_start_time', '08:30', 'string', '標準上班時間'),
('work_end_time', '17:30', 'string', '標準下班時間'),
('lunch_start_time', '12:00', 'string', '午休開始時間'),
('lunch_end_time', '13:00', 'string', '午休結束時間'),
('late_threshold_minutes', '5', 'int', '遲到容忍時間（分鐘）'),
('overtime_buffer_minutes', '30', 'int', '加班緩衝時間（分鐘）'),
('default_checkin_radius', '2000', 'float', '預設打卡範圍（公尺）'),
('session_timeout_hours', '8', 'int', 'Session 有效期限（小時）'),
('password_min_length', '8', 'int', '密碼最小長度'),
('login_max_attempts', '3', 'int', '登入最大嘗試次數'),
('account_lockout_minutes', '15', 'int', '帳號鎖定時間（分鐘）');

-- Step 8: 驗證遷移結果
SELECT COUNT(*) FROM Employees;
SELECT COUNT(*) FROM AttendanceRecords;
SELECT COUNT(*) FROM LeaveRecords;
```

### 4.2 Django Migrations

```python
# attendance/migrations/0002_add_new_fields.py
from django.db import migrations, models

class Migration(migrations.Migration):
    dependencies = [
        ('attendance', '0001_initial'),
    ]

    operations = [
        # 修改 Companies
        migrations.AlterField(
            model_name='companies',
            name='latitude',
            field=models.DecimalField(max_digits=10, decimal_places=7),
        ),
        migrations.AlterField(
            model_name='companies',
            name='longitude',
            field=models.DecimalField(max_digits=10, decimal_places=7),
        ),

        # 新增 Employees 欄位
        migrations.AddField(
            model_name='employees',
            name='role',
            field=models.CharField(max_length=20, default='employee'),
        ),

        # 新增 AttendanceRecords 欄位
        migrations.AddField(
            model_name='attendancerecords',
            name='overtime_hours',
            field=models.DecimalField(max_digits=5, decimal_places=2, default=0),
        ),
        migrations.AddField(
            model_name='attendancerecords',
            name='status',
            field=models.CharField(max_length=20, default='normal'),
        ),

        # 建立新表格
        migrations.CreateModel(
            name='ApprovalRecords',
            fields=[
                ('id', models.AutoField(primary_key=True)),
                ('leave_id', models.ForeignKey(to='attendance.LeaveRecords', on_delete=models.CASCADE)),
                ('approver_id', models.ForeignKey(to='attendance.Employees', on_delete=models.CASCADE)),
                ('status', models.CharField(max_length=20, default='pending')),
                # ... 其他欄位
            ],
        ),
        # ... 其他新表格
    ]
```

---

## 5. 資料字典

### 5.1 列舉值定義

#### 5.1.1 員工角色 (Employees.role)
```python
ROLE_CHOICES = [
    ('employee', '一般員工'),
    ('manager', '部門主管'),
    ('hr_admin', 'HR 管理員'),
    ('system_admin', '系統管理員'),
]
```

#### 5.1.2 出勤狀態 (AttendanceRecords.status)
```python
ATTENDANCE_STATUS_CHOICES = [
    ('normal', '正常'),
    ('late', '遲到'),
    ('early_leave', '早退'),
    ('absent', '缺勤'),
    ('makeup', '補打卡'),
]
```

#### 5.1.3 假別 (LeaveRecords.leave_type)
```python
LEAVE_TYPE_CHOICES = [
    ('annual', '特休假'),
    ('sick', '病假'),
    ('personal', '事假'),
    ('marriage', '婚假'),
    ('bereavement', '喪假'),
    ('maternity', '產假'),
    ('paternity', '陪產假'),
    ('compensatory', '補休'),
]
```

#### 5.1.4 審批狀態 (LeaveRecords.status, ApprovalRecords.status)
```python
APPROVAL_STATUS_CHOICES = [
    ('pending', '待審批'),
    ('approved', '已批准'),
    ('rejected', '已拒絕'),
    ('cancelled', '已撤銷'),
]
```

---

**文件變更歷史**

| 版本 | 日期 | 作者 | 變更內容 |
|------|------|------|---------|
| 1.0 | 2025-11-19 | 系統架構團隊 | 初版建立 |
