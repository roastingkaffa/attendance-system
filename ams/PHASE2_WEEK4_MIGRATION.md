# Phase 2 Week 4 資料庫遷移說明

**日期**：2025-11-20
**階段**：Phase 2 - Week 4 審批流程開發
**狀態**：⚠️ 待執行

---

## 📊 資料模型變更總覽

### 修改的模型

**1. LeaveRecords（請假記錄表）**

新增欄位：
- `leave_type` (VARCHAR 20) - 假別（annual, sick, personal, etc.）
- `status` (VARCHAR 20) - 審批狀態（pending, approved, rejected, cancelled）
- `substitute_employee_id` (FK) - 職務代理人
- `attachments` (JSON) - 附件列表
- `created_at` (DATETIME) - 建立時間
- `updated_at` (DATETIME) - 更新時間

修改欄位：
- `start_time` - 從 NULL 改為 NOT NULL
- `end_time` - 從 NULL 改為 NOT NULL
- `leave_hours` - 從 NULL 改為 NOT NULL

### 新增的模型

**2. ApprovalRecords（審批記錄表）**

所有欄位：
- `id` (INT, PK, AUTO)
- `leave_id` (FK) - 請假 ID
- `approver_id` (FK) - 審批人 ID
- `approval_level` (INT) - 審批層級（1=主管, 2=HR, 3=總經理）
- `status` (VARCHAR 20) - 審批狀態（pending, approved, rejected）
- `comment` (TEXT) - 審批意見
- `approved_at` (DATETIME) - 審批時間
- `created_at` (DATETIME) - 建立時間

**3. LeaveBalances（假別額度表）**

所有欄位：
- `id` (INT, PK, AUTO)
- `employee_id` (FK) - 員工編號
- `year` (INT) - 年度
- `leave_type` (VARCHAR 20) - 假別
- `total_hours` (DECIMAL 6,2) - 總額度
- `used_hours` (DECIMAL 6,2) - 已使用
- `remaining_hours` (DECIMAL 6,2) - 剩餘
- `updated_at` (DATETIME) - 更新時間

唯一約束：`(employee_id, year, leave_type)`

---

## 🚀 執行遷移步驟

### 1. 產生遷移檔案

```bash
cd /home/roc/workspace/Human-Resources/attendance-system/ams
python manage.py makemigrations
```

預期輸出：
```
Migrations for 'attendance':
  attendance/migrations/0002_approvalrecords_leavebalances_and_more.py
    - Create model ApprovalRecords
    - Create model LeaveBalances
    - Add field leave_type to leaverecords
    - Add field status to leaverecords
    - Add field substitute_employee_id to leaverecords
    - Add field attachments to leaverecords
    - Add field created_at to leaverecords
    - Add field updated_at to leaverecords
    - Alter field start_time on leaverecords
    - Alter field end_time on leaverecords
    - Alter field leave_hours on leaverecords
```

### 2. 備份現有資料庫（重要！）

```bash
mysqldump -u root -p ams > ams_backup_phase2_week4_$(date +%Y%m%d).sql
```

### 3. 查看遷移 SQL

```bash
python manage.py sqlmigrate attendance 0002
```

### 4. 執行遷移

```bash
python manage.py migrate
```

預期輸出：
```
Operations to perform:
  Apply all migrations: admin, attendance, auth, contenttypes, sessions
Running migrations:
  Applying attendance.0002_approvalrecords_leavebalances_and_more... OK
```

### 5. 驗證遷移結果

```bash
python manage.py dbshell
```

在 MySQL shell 中執行：

```sql
-- 檢查 LeaveRecords 欄位
DESCRIBE attendance_leaverecords;

-- 檢查 ApprovalRecords 表
DESCRIBE attendance_approvalrecords;

-- 檢查 LeaveBalances 表
DESCRIBE attendance_leavebalances;

-- 檢查索引
SHOW INDEX FROM attendance_leaverecords;
SHOW INDEX FROM attendance_approvalrecords;
SHOW INDEX FROM attendance_leavebalances;
```

---

## ⚠️ 注意事項

### 資料相容性

**現有 LeaveRecords 資料處理**：

如果資料庫中已有 LeaveRecords 資料，需要手動處理：

1. 新增欄位的預設值：
   - `leave_type`：預設為 'annual'
   - `status`：預設為 'pending'
   - `substitute_employee_id`：預設為 NULL
   - `attachments`：預設為 NULL

2. NULL 欄位轉換：
   - `start_time`, `end_time`, `leave_hours` 從可 NULL 改為 NOT NULL
   - **遷移前必須確保所有記錄都有這些欄位的值**

如果有 NULL 值，執行以下 SQL：

```sql
-- 檢查是否有 NULL 值
SELECT COUNT(*) FROM attendance_leaverecords
WHERE start_time IS NULL OR end_time IS NULL OR leave_hours IS NULL;

-- 如果有 NULL，需要先處理（範例：設定預設值）
UPDATE attendance_leaverecords
SET
    start_time = '2025-01-01 00:00:00',
    end_time = '2025-01-01 23:59:59',
    leave_hours = 8.00
WHERE start_time IS NULL OR end_time IS NULL OR leave_hours IS NULL;
```

### 初始化假別額度

遷移完成後，需要為現有員工初始化假別額度：

```python
# 在 Django shell 中執行
python manage.py shell

from attendance.models import Employees, LeaveBalances
from datetime import datetime

# 為所有員工建立 2025 年度的假別額度
year = datetime.now().year
employees = Employees.objects.filter(is_active=True)

for employee in employees:
    # 特休假（80 小時 = 10 天）
    LeaveBalances.objects.get_or_create(
        employee_id=employee,
        year=year,
        leave_type='annual',
        defaults={
            'total_hours': 80.00,
            'used_hours': 0.00,
            'remaining_hours': 80.00
        }
    )

    # 病假（240 小時 = 30 天）
    LeaveBalances.objects.get_or_create(
        employee_id=employee,
        year=year,
        leave_type='sick',
        defaults={
            'total_hours': 240.00,
            'used_hours': 0.00,
            'remaining_hours': 240.00
        }
    )

    # 事假（112 小時 = 14 天）
    LeaveBalances.objects.get_or_create(
        employee_id=employee,
        year=year,
        leave_type='personal',
        defaults={
            'total_hours': 112.00,
            'used_hours': 0.00,
            'remaining_hours': 112.00
        }
    )

print(f"已為 {employees.count()} 位員工初始化假別額度")
```

---

## 🧪 測試遷移

### 測試 1: 建立請假記錄

```python
from attendance.models import LeaveRecords, EmpCompanyRel
from datetime import datetime

relation = EmpCompanyRel.objects.first()

leave = LeaveRecords.objects.create(
    relation_id=relation,
    leave_type='annual',
    start_time=datetime(2025, 11, 25, 8, 30),
    end_time=datetime(2025, 11, 25, 17, 30),
    leave_hours=8.00,
    leave_reason='家庭事務',
    status='pending'
)

print(f"建立請假記錄: {leave}")
```

### 測試 2: 建立審批記錄

```python
from attendance.models import ApprovalRecords, Employees

approver = Employees.objects.filter(employee_id__startswith='MGR').first()

approval = ApprovalRecords.objects.create(
    leave_id=leave,
    approver_id=approver,
    approval_level=1,
    status='pending'
)

print(f"建立審批記錄: {approval}")
```

### 測試 3: 查詢假別額度

```python
from attendance.models import LeaveBalances

employee = Employees.objects.first()
balances = LeaveBalances.objects.filter(
    employee_id=employee,
    year=2025
)

for balance in balances:
    print(f"{balance.get_leave_type_display()}: {balance.remaining_hours} / {balance.total_hours} 小時")
```

---

## 📝 回滾方案

如果遷移後發現問題，可以回滾：

### 1. 回滾遷移

```bash
python manage.py migrate attendance 0001
```

### 2. 還原資料庫備份

```bash
mysql -u root -p ams < ams_backup_phase2_week4_YYYYMMDD.sql
```

---

## ✅ 完成檢查清單

遷移前：
- [ ] 已備份資料庫
- [ ] 已檢查現有 LeaveRecords 資料
- [ ] 已處理 NULL 值問題
- [ ] 已在測試環境執行測試

遷移後：
- [ ] 已執行 `python manage.py migrate`
- [ ] 已驗證表格結構
- [ ] 已初始化假別額度
- [ ] 已執行測試腳本
- [ ] 已驗證 API 功能

---

**文件建立日期**：2025-11-20
**負責人**：Claude Code System
**版本**：v1.0
