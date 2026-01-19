# API 規格文件（API Specification）
# 宏全出勤管理系統 v2.0

**文件版本**: 1.0
**建立日期**: 2025-11-19
**Base URL**: `https://attendance.company.com/api/v1`

---

## 目錄
1. [API 設計原則](#1-api-設計原則)
2. [認證與授權 API](#2-認證與授權-api)
3. [打卡功能 API](#3-打卡功能-api)
4. [請假管理 API](#4-請假管理-api)
5. [審批流程 API](#5-審批流程-api)
6. [報表統計 API](#6-報表統計-api)
7. [系統管理 API](#7-系統管理-api)
8. [通知系統 API](#8-通知系統-api)
9. [錯誤碼定義](#9-錯誤碼定義)

---

## 1. API 設計原則

### 1.1 RESTful 設計規範

#### URL 命名規則
- 使用名詞複數：`/api/v1/employees/` (✓) vs `/api/v1/employee/` (✗)
- 使用小寫與連字號：`/api/v1/leave-records/` (✓) vs `/api/v1/LeaveRecords/` (✗)
- 資源層級不超過 3 層：`/api/v1/employees/{id}/attendance/` (✓)

#### HTTP 方法語意
| 方法 | 用途 | 冪等性 | 安全性 |
|------|------|--------|--------|
| GET | 查詢資源 | ✓ | ✓ |
| POST | 建立資源 | ✗ | ✗ |
| PUT | 完整更新資源 | ✓ | ✗ |
| PATCH | 部分更新資源 | ✗ | ✗ |
| DELETE | 刪除資源 | ✓ | ✗ |

#### HTTP 狀態碼
| 狀態碼 | 說明 | 使用場景 |
|--------|------|---------|
| 200 OK | 成功 | GET, PATCH, DELETE 成功 |
| 201 Created | 已建立 | POST 成功建立資源 |
| 204 No Content | 無內容 | DELETE 成功但無返回內容 |
| 400 Bad Request | 錯誤請求 | 參數驗證失敗 |
| 401 Unauthorized | 未認證 | 未登入或 Session 過期 |
| 403 Forbidden | 禁止存取 | 無權限存取資源 |
| 404 Not Found | 未找到 | 資源不存在 |
| 409 Conflict | 衝突 | 資源衝突（如重複打卡） |
| 429 Too Many Requests | 請求過多 | 超過速率限制 |
| 500 Internal Server Error | 伺服器錯誤 | 伺服器內部錯誤 |

### 1.2 統一回應格式

#### 成功回應
```json
{
  "success": true,
  "message": "操作成功",
  "data": {
    // 實際資料
  },
  "meta": {
    // 元資料（分頁資訊等）
    "page": 1,
    "page_size": 20,
    "total": 100
  },
  "timestamp": "2025-11-19T10:30:00Z"
}
```

#### 錯誤回應
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "使用者友善的錯誤訊息",
    "details": {
      // 詳細錯誤資訊（開發模式）
      "field": "email",
      "reason": "Invalid email format"
    }
  },
  "timestamp": "2025-11-19T10:30:00Z"
}
```

### 1.3 分頁規範
```
GET /api/v1/attendance/?page=2&page_size=20

Response:
{
  "success": true,
  "data": [...],
  "meta": {
    "page": 2,
    "page_size": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_previous": true,
    "next": "/api/v1/attendance/?page=3&page_size=20",
    "previous": "/api/v1/attendance/?page=1&page_size=20"
  }
}
```

### 1.4 篩選與排序
```
# 篩選
GET /api/v1/attendance/?status=late&date_from=2025-11-01&date_to=2025-11-30

# 排序
GET /api/v1/attendance/?ordering=-date  # 降序
GET /api/v1/attendance/?ordering=date   # 升序

# 搜尋
GET /api/v1/employees/?search=張三

# 欄位選擇（減少回應大小）
GET /api/v1/employees/?fields=employee_id,username,email
```

### 1.5 速率限制
```
# Response Headers
X-RateLimit-Limit: 60        # 每分鐘限制
X-RateLimit-Remaining: 55    # 剩餘次數
X-RateLimit-Reset: 1700390400  # 重設時間（Unix timestamp）
```

---

## 2. 認證與授權 API

### 2.1 登入

```
POST /api/v1/auth/login/
```

**權限**: AllowAny

**請求參數**:
```json
{
  "employee_id": "EMP001",
  "password": "SecurePassword123"
}
```

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| employee_id | string | ✓ | 員工編號 |
| password | string | ✓ | 密碼 |

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "message": "登入成功",
  "data": {
    "user": {
      "employee_id": "EMP001",
      "username": "張三",
      "email": "zhang@company.com",
      "role": "employee",
      "department": {
        "id": 1,
        "name": "研發部"
      }
    },
    "session_expires_at": "2025-11-19T18:30:00Z"
  },
  "timestamp": "2025-11-19T10:30:00Z"
}
```

**錯誤回應**:

| 狀態碼 | 錯誤碼 | 說明 |
|--------|--------|------|
| 401 | INVALID_CREDENTIALS | 帳號或密碼錯誤 |
| 429 | ACCOUNT_LOCKED | 帳號已鎖定（登入失敗 3 次） |
| 429 | TOO_MANY_REQUESTS | 超過登入速率限制 |

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "帳號或密碼錯誤",
    "details": {
      "attempts_remaining": 2
    }
  }
}
```

**速率限制**: 5 次/分鐘

**業務邏輯**:
1. 驗證 employee_id 和 password
2. 檢查帳號鎖定狀態
3. 登入失敗累計次數（3 次鎖定 15 分鐘）
4. 建立 Session（有效期 8 小時）
5. 記錄登入日誌（IP、User-Agent、時間）

---

### 2.2 登出

```
POST /api/v1/auth/logout/
```

**權限**: IsAuthenticated

**請求參數**: 無

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "message": "登出成功",
  "timestamp": "2025-11-19T10:35:00Z"
}
```

**業務邏輯**:
1. 清除伺服器端 Session
2. 記錄登出日誌

---

### 2.3 修改密碼

```
POST /api/v1/auth/change-password/
```

**權限**: IsAuthenticated

**請求參數**:
```json
{
  "old_password": "OldPassword123",
  "new_password": "NewPassword456"
}
```

| 參數 | 類型 | 必填 | 說明 | 驗證規則 |
|------|------|------|------|---------|
| old_password | string | ✓ | 舊密碼 | - |
| new_password | string | ✓ | 新密碼 | 最少 8 字元、包含大小寫字母與數字 |

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "message": "密碼已更新，請重新登入",
  "timestamp": "2025-11-19T10:40:00Z"
}
```

**錯誤回應**:
```json
{
  "success": false,
  "error": {
    "code": "INCORRECT_OLD_PASSWORD",
    "message": "舊密碼不正確"
  }
}

{
  "success": false,
  "error": {
    "code": "WEAK_PASSWORD",
    "message": "密碼強度不足",
    "details": {
      "requirements": [
        "最少 8 字元",
        "包含大寫字母",
        "包含小寫字母",
        "包含數字"
      ]
    }
  }
}
```

**業務邏輯**:
1. 驗證舊密碼
2. 驗證新密碼強度
3. 更新密碼（PBKDF2-SHA256 加密）
4. 發送 Email 通知
5. 強制重新登入（清除現有 Session）

---

### 2.4 忘記密碼

```
POST /api/v1/auth/forgot-password/
```

**權限**: AllowAny

**請求參數**:
```json
{
  "email": "zhang@company.com"
}
```

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "message": "重設連結已寄送至您的 Email",
  "timestamp": "2025-11-19T10:45:00Z"
}
```

**注意**: 無論 Email 是否存在，皆返回成功（防止枚舉攻擊）

**速率限制**: 3 次/小時

**業務邏輯**:
1. 查詢 Email 對應的使用者
2. 產生重設 Token（有效期 1 小時，僅能使用一次）
3. 發送 Email（包含重設連結）
4. 記錄操作日誌

---

### 2.5 重設密碼

```
POST /api/v1/auth/reset-password/
```

**權限**: AllowAny

**請求參數**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "new_password": "NewPassword789"
}
```

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "message": "密碼已重設，請使用新密碼登入",
  "timestamp": "2025-11-19T11:00:00Z"
}
```

**錯誤回應**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_TOKEN",
    "message": "重設連結無效或已過期"
  }
}
```

---

### 2.6 取得當前使用者資訊

```
GET /api/v1/auth/me/
```

**權限**: IsAuthenticated

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "employee_id": "EMP001",
    "username": "張三",
    "email": "zhang@company.com",
    "phone": "0912345678",
    "role": "employee",
    "department": {
      "id": 1,
      "name": "研發部",
      "manager": {
        "employee_id": "MGR001",
        "username": "李四"
      }
    },
    "hire_date": "2024-01-01",
    "is_active": true
  }
}
```

---

## 3. 打卡功能 API

### 3.1 上班打卡

```
POST /api/v1/attendance/clock-in/
```

**權限**: IsAuthenticated

**請求參數**:
```json
{
  "qr_latitude": "25.0330000",
  "qr_longitude": "121.5654000",
  "user_latitude": "25.0335000",
  "user_longitude": "121.5660000"
}
```

| 參數 | 類型 | 必填 | 說明 | 驗證規則 |
|------|------|------|------|---------|
| qr_latitude | string | ✓ | QR Code 緯度 | -90 ~ 90 |
| qr_longitude | string | ✓ | QR Code 經度 | -180 ~ 180 |
| user_latitude | string | ✓ | 使用者緯度 | -90 ~ 90 |
| user_longitude | string | ✓ | 使用者經度 | -180 ~ 180 |

**成功回應 (201 Created)**:
```json
{
  "success": true,
  "message": "打卡成功",
  "data": {
    "id": 123,
    "date": "2025-11-19",
    "checkin_time": "2025-11-19T08:30:15Z",
    "checkin_location": "25.0335, 121.5660",
    "distance": 65.5,
    "company": {
      "id": 1,
      "name": "台北總公司"
    },
    "status": "normal",
    "is_late": false
  },
  "timestamp": "2025-11-19T08:30:15Z"
}
```

**錯誤回應**:

| 狀態碼 | 錯誤碼 | 說明 |
|--------|--------|------|
| 400 | LOCATION_OUT_OF_RANGE | 打卡位置超出範圍 |
| 400 | INVALID_QR_CODE | QR Code 座標無效 |
| 409 | ALREADY_CLOCKED_IN | 今天已打卡 |

```json
{
  "success": false,
  "error": {
    "code": "LOCATION_OUT_OF_RANGE",
    "message": "打卡位置超出範圍",
    "details": {
      "distance": 2500.0,
      "max_distance": 2000.0,
      "company_name": "台北總公司"
    }
  }
}

{
  "success": false,
  "error": {
    "code": "ALREADY_CLOCKED_IN",
    "message": "今天已打卡",
    "details": {
      "existing_record": {
        "id": 122,
        "checkin_time": "2025-11-19T08:25:00Z"
      }
    }
  }
}
```

**速率限制**: 5 次/分鐘

**業務邏輯**:
1. **驗證參數**: 檢查座標格式與範圍
2. **驗證 QR Code**: 查詢 Companies 表，確認 QR 座標為有效公司
3. **計算距離**: 使用 Haversine 公式計算使用者與公司的距離
   ```python
   def calculate_distance(lat1, lng1, lat2, lng2):
       R = 6371000  # 地球半徑（公尺）
       phi1 = math.radians(lat1)
       phi2 = math.radians(lat2)
       delta_phi = math.radians(lat2 - lat1)
       delta_lambda = math.radians(lng2 - lng1)

       a = math.sin(delta_phi/2)**2 + \
           math.cos(phi1) * math.cos(phi2) * \
           math.sin(delta_lambda/2)**2
       c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))

       return R * c
   ```
4. **檢查範圍**: `distance <= company.radius`
5. **檢查重複**: 查詢今天是否已有打卡記錄
6. **產生時間**: `checkin_time = timezone.now()`（後端產生）
7. **判斷遲到**: 若 `checkin_time > 08:30` → `is_late = True`, `status = 'late'`
8. **建立記錄**: 寫入 AttendanceRecords 表
9. **記錄日誌**: 寫入 AuditLogs

---

### 3.2 下班打卡

```
POST /api/v1/attendance/clock-out/
```

**權限**: IsAuthenticated

**請求參數**: 同上班打卡

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "message": "下班打卡成功",
  "data": {
    "id": 123,
    "date": "2025-11-19",
    "checkin_time": "2025-11-19T08:30:15Z",
    "checkout_time": "2025-11-19T18:00:30Z",
    "checkin_location": "25.0335, 121.5660",
    "checkout_location": "25.0332, 121.5658",
    "work_hours": 8.5,
    "overtime_hours": 0.5,
    "status": "normal",
    "is_late": false,
    "is_early_leave": false
  },
  "timestamp": "2025-11-19T18:00:30Z"
}
```

**錯誤回應**:
```json
{
  "success": false,
  "error": {
    "code": "NO_CHECKIN_RECORD",
    "message": "今天尚未上班打卡"
  }
}
```

**業務邏輯**:
1. 驗證位置（同上班打卡）
2. 查詢今天的上班打卡記錄
3. 產生 `checkout_time = timezone.now()`
4. **計算工時**:
   ```python
   def calculate_work_hours(checkin_time, checkout_time):
       total_seconds = (checkout_time - checkin_time).total_seconds()
       total_hours = total_seconds / 3600

       # 扣除午休時間（12:00-13:00）
       if checkin_time.time() < time(13, 0) and checkout_time.time() > time(12, 0):
           total_hours -= 1  # 扣除 1 小時午休

       return round(total_hours, 2)
   ```
5. **計算加班**:
   ```python
   def calculate_overtime(checkout_time):
       overtime_start = checkout_time.replace(hour=17, minute=30, second=0)
       if checkout_time > overtime_start:
           overtime_seconds = (checkout_time - overtime_start).total_seconds()
           return round(overtime_seconds / 3600, 2)
       return 0
   ```
6. **判斷早退**: 若 `checkout_time < 17:00` → `is_early_leave = True`
7. 更新記錄（PATCH）

---

### 3.3 查詢出勤記錄

```
GET /api/v1/attendance/records/
```

**權限**: IsAuthenticated

**查詢參數**:
```
?employee_id=EMP001&date_from=2025-11-01&date_to=2025-11-30&status=late&page=1&page_size=20
```

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| employee_id | string | - | 員工編號（主管可查詢下屬） |
| date_from | date | - | 開始日期（YYYY-MM-DD） |
| date_to | date | - | 結束日期（YYYY-MM-DD） |
| status | string | - | 狀態篩選（normal, late, early_leave, absent） |
| page | int | - | 頁碼（預設 1） |
| page_size | int | - | 每頁筆數（預設 20，最大 100） |

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 123,
      "employee": {
        "employee_id": "EMP001",
        "username": "張三"
      },
      "date": "2025-11-19",
      "checkin_time": "2025-11-19T08:30:15Z",
      "checkout_time": "2025-11-19T18:00:30Z",
      "checkin_location": "25.0335, 121.5660",
      "checkout_location": "25.0332, 121.5658",
      "work_hours": 8.5,
      "overtime_hours": 0.5,
      "status": "normal",
      "is_late": false,
      "is_early_leave": false
    },
    // ...
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

**權限規則**:
- 一般員工：僅能查詢自己的記錄
- 主管：可查詢直屬下屬的記錄
- HR 管理員：可查詢所有員工記錄

---

### 3.4 補打卡申請

```
POST /api/v1/attendance/makeup-request/
```

**權限**: IsAuthenticated

**請求參數**:
```json
{
  "date": "2025-11-18",
  "clock_type": "checkin",
  "time": "2025-11-18T08:30:00Z",
  "reason": "忘記打卡",
  "attachments": [
    "https://s3.amazonaws.com/proof1.jpg"
  ]
}
```

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| date | date | ✓ | 補打卡日期 |
| clock_type | string | ✓ | 類型（checkin / checkout） |
| time | datetime | ✓ | 補打卡時間 |
| reason | string | ✓ | 補打卡原因 |
| attachments | array | - | 證明文件（URL） |

**成功回應 (201 Created)**:
```json
{
  "success": true,
  "message": "補打卡申請已送出，等待主管審批",
  "data": {
    "id": 456,
    "status": "pending",
    "approver": {
      "employee_id": "MGR001",
      "username": "李四"
    }
  }
}
```

**錯誤回應**:
```json
{
  "success": false,
  "error": {
    "code": "MAKEUP_EXPIRED",
    "message": "補打卡僅限 3 天內申請",
    "details": {
      "request_date": "2025-11-18",
      "current_date": "2025-11-22",
      "max_days": 3
    }
  }
}
```

---

## 4. 請假管理 API

### 4.1 申請請假

```
POST /api/v1/leave/apply/
```

**權限**: IsAuthenticated

**請求參數**:
```json
{
  "leave_type": "annual",
  "start_date": "2025-11-20",
  "end_date": "2025-11-22",
  "duration": "full_day",
  "reason": "家庭事務",
  "substitute_employee_id": "EMP002",
  "attachments": []
}
```

| 參數 | 類型 | 必填 | 說明 | 可選值 |
|------|------|------|------|--------|
| leave_type | string | ✓ | 假別 | annual, sick, personal, marriage, bereavement |
| start_date | date | ✓ | 開始日期 | YYYY-MM-DD |
| end_date | date | ✓ | 結束日期 | YYYY-MM-DD |
| duration | string | ✓ | 時段 | full_day, morning, afternoon |
| reason | string | ✓ | 請假原因 | - |
| substitute_employee_id | string | - | 職務代理人 | - |
| attachments | array | - | 附件（醫生證明等） | - |

**成功回應 (201 Created)**:
```json
{
  "success": true,
  "message": "請假申請已送出",
  "data": {
    "id": 789,
    "leave_type": "annual",
    "start_time": "2025-11-20T08:30:00Z",
    "end_time": "2025-11-22T17:30:00Z",
    "leave_hours": 24.0,
    "status": "pending",
    "approval_workflow": [
      {
        "level": 1,
        "approver": {
          "employee_id": "MGR001",
          "username": "李四（部門主管）"
        },
        "status": "pending"
      },
      {
        "level": 2,
        "approver": {
          "employee_id": "HR001",
          "username": "王五（HR）"
        },
        "status": "pending"
      }
    ],
    "leave_balance": {
      "total_hours": 80.0,
      "used_hours": 24.0,
      "remaining_hours": 56.0
    }
  }
}
```

**錯誤回應**:
```json
{
  "success": false,
  "error": {
    "code": "INSUFFICIENT_LEAVE_BALANCE",
    "message": "特休額度不足",
    "details": {
      "requested_hours": 24.0,
      "available_hours": 16.0
    }
  }
}

{
  "success": false,
  "error": {
    "code": "LEAVE_DATE_CONFLICT",
    "message": "請假日期與現有記錄衝突",
    "details": {
      "conflicting_leave": {
        "id": 788,
        "start_date": "2025-11-21",
        "end_date": "2025-11-21"
      }
    }
  }
}
```

**業務邏輯**:
1. **驗證參數**: 日期格式、日期邏輯（end_date >= start_date）
2. **計算請假時數**:
   ```python
   def calculate_leave_hours(start_date, end_date, duration):
       if start_date == end_date:
           # 同一天
           if duration == 'full_day':
               return 8.0
           elif duration in ['morning', 'afternoon']:
               return 4.0
       else:
           # 跨多天
           total_days = (end_date - start_date).days + 1
           return total_days * 8.0  # 假設每天 8 小時（扣除午休）
   ```
3. **檢查額度**: 查詢 LeaveBalances 表，確認剩餘額度足夠
4. **檢查衝突**: 查詢是否有重疊的請假或出勤記錄
5. **建立記錄**: 寫入 LeaveRecords（status = 'pending'）
6. **建立審批流程**:
   - 1 天以內：主管審批
   - 2-3 天：主管 → HR
   - 4 天以上：主管 → HR → 總經理
   ```python
   def create_approval_workflow(leave_days):
       approvals = []
       approvals.append({'level': 1, 'approver_id': get_manager_id()})
       if leave_days >= 2:
           approvals.append({'level': 2, 'approver_id': get_hr_id()})
       if leave_days >= 4:
           approvals.append({'level': 3, 'approver_id': get_ceo_id()})
       return approvals
   ```
7. **發送通知**: Email + 站內通知給第一層審批人

---

### 4.2 查詢請假記錄

```
GET /api/v1/leave/records/
```

**權限**: IsAuthenticated

**查詢參數**:
```
?status=pending&leave_type=annual&date_from=2025-11-01&date_to=2025-11-30
```

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| status | string | - | 狀態篩選（pending, approved, rejected, cancelled） |
| leave_type | string | - | 假別篩選 |
| date_from | date | - | 開始日期 |
| date_to | date | - | 結束日期 |

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 789,
      "leave_type": "annual",
      "leave_type_display": "特休假",
      "start_time": "2025-11-20T08:30:00Z",
      "end_time": "2025-11-22T17:30:00Z",
      "leave_hours": 24.0,
      "reason": "家庭事務",
      "status": "pending",
      "status_display": "待審批",
      "substitute_employee": {
        "employee_id": "EMP002",
        "username": "趙六"
      },
      "approval_progress": {
        "current_level": 1,
        "total_levels": 2,
        "current_approver": {
          "employee_id": "MGR001",
          "username": "李四"
        }
      },
      "created_at": "2025-11-19T10:00:00Z"
    }
  ]
}
```

---

### 4.3 撤銷請假申請

```
POST /api/v1/leave/{id}/cancel/
```

**權限**: IsAuthenticated, IsOwner

**請求參數**:
```json
{
  "cancel_reason": "計畫變更"
}
```

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "message": "請假申請已撤銷"
}
```

**錯誤回應**:
```json
{
  "success": false,
  "error": {
    "code": "CANNOT_CANCEL_APPROVED_LEAVE",
    "message": "已批准的請假無法撤銷，請重新申請取消"
  }
}
```

**業務規則**:
- 僅能撤銷 `status = 'pending'` 的申請
- 已批准的請假需重新申請取消

---

### 4.4 查詢假別額度

```
GET /api/v1/leave/balance/
```

**權限**: IsAuthenticated

**查詢參數**:
```
?year=2025
```

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "employee_id": "EMP001",
    "year": 2025,
    "balances": [
      {
        "leave_type": "annual",
        "leave_type_display": "特休假",
        "total_hours": 80.0,
        "used_hours": 24.0,
        "remaining_hours": 56.0,
        "total_days": 10.0,
        "used_days": 3.0,
        "remaining_days": 7.0
      },
      {
        "leave_type": "sick",
        "leave_type_display": "病假",
        "total_hours": 240.0,
        "used_hours": 0.0,
        "remaining_hours": 240.0,
        "total_days": 30.0,
        "used_days": 0.0,
        "remaining_days": 30.0
      },
      {
        "leave_type": "personal",
        "leave_type_display": "事假",
        "total_hours": 112.0,
        "used_hours": 0.0,
        "remaining_hours": 112.0,
        "total_days": 14.0,
        "used_days": 0.0,
        "remaining_days": 14.0
      }
    ]
  }
}
```

---

## 5. 審批流程 API

### 5.1 查詢待審批列表

```
GET /api/v1/approvals/pending/
```

**權限**: IsAuthenticated, IsManagerOrHR

**查詢參數**:
```
?type=leave&page=1&page_size=20
```

| 參數 | 類型 | 必填 | 說明 |
|------|------|------|------|
| type | string | - | 類型（leave, makeup） |

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 101,
      "type": "leave",
      "leave": {
        "id": 789,
        "employee": {
          "employee_id": "EMP001",
          "username": "張三",
          "department": "研發部"
        },
        "leave_type": "annual",
        "leave_type_display": "特休假",
        "start_time": "2025-11-20T08:30:00Z",
        "end_time": "2025-11-22T17:30:00Z",
        "leave_hours": 24.0,
        "reason": "家庭事務"
      },
      "approval_level": 1,
      "created_at": "2025-11-19T10:00:00Z",
      "urgency": "normal",
      "employee_attendance_summary": {
        "total_leaves_this_year": 3,
        "total_late_this_month": 0,
        "total_absence_this_year": 0
      }
    }
  ],
  "meta": {
    "page": 1,
    "page_size": 20,
    "total": 5
  }
}
```

---

### 5.2 審批操作

```
POST /api/v1/approvals/{id}/approve/
```

**權限**: IsAuthenticated, IsApprover

**請求參數**:
```json
{
  "action": "approve",
  "comment": "同意，請注意職務交接",
  "conditions": []
}
```

| 參數 | 類型 | 必填 | 說明 | 可選值 |
|------|------|------|------|--------|
| action | string | ✓ | 審批動作 | approve, reject |
| comment | string | - | 審批意見 | - |
| conditions | array | - | 附加條件 | - |

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "message": "審批成功",
  "data": {
    "approval_id": 101,
    "status": "approved",
    "leave": {
      "id": 789,
      "status": "pending",
      "next_approver": {
        "employee_id": "HR001",
        "username": "王五（HR）"
      }
    },
    "notification_sent": true
  }
}
```

**業務邏輯**:
1. **驗證權限**: 確認當前使用者為該審批記錄的審批人
2. **更新審批記錄**: `ApprovalRecords.status = 'approved'` 或 `'rejected'`
3. **檢查下一層級**:
   - 若有下一層級 → 建立下一層審批記錄，通知下一層審批人
   - 若無下一層級 → 更新 LeaveRecords.status = 'approved'
4. **拒絕處理**:
   - 若 action = 'reject' → 直接更新 LeaveRecords.status = 'rejected'
   - 不觸發後續審批
5. **發送通知**: 通知申請人審批結果

---

## 6. 報表統計 API

### 6.1 個人月報表

```
GET /api/v1/reports/personal/monthly/
```

**權限**: IsAuthenticated

**查詢參數**:
```
?year=2025&month=11
```

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "employee_id": "EMP001",
    "employee_name": "張三",
    "year": 2025,
    "month": 11,
    "statistics": {
      "work_days": 20,
      "total_work_hours": 160.0,
      "total_overtime_hours": 10.0,
      "late_count": 2,
      "early_leave_count": 0,
      "absence_count": 0,
      "leave_breakdown": {
        "annual": {
          "days": 1.0,
          "hours": 8.0
        },
        "sick": {
          "days": 0.5,
          "hours": 4.0
        }
      }
    },
    "daily_records": [
      {
        "date": "2025-11-01",
        "type": "attendance",
        "checkin_time": "2025-11-01T08:30:00Z",
        "checkout_time": "2025-11-01T17:30:00Z",
        "work_hours": 8.0,
        "status": "normal"
      },
      {
        "date": "2025-11-02",
        "type": "leave",
        "leave_type": "annual",
        "leave_hours": 8.0
      }
    ]
  }
}
```

---

### 6.2 部門月報表

```
GET /api/v1/reports/department/{dept_id}/monthly/
```

**權限**: IsAuthenticated, IsManagerOrHR

**查詢參數**:
```
?year=2025&month=11
```

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "data": {
    "department_id": 1,
    "department_name": "研發部",
    "year": 2025,
    "month": 11,
    "summary": {
      "total_employees": 20,
      "total_work_hours": 3200.0,
      "total_overtime_hours": 150.0,
      "average_work_hours": 160.0,
      "attendance_rate": 98.5,
      "late_rate": 5.0,
      "absence_count": 2
    },
    "employees": [
      {
        "employee_id": "EMP001",
        "employee_name": "張三",
        "work_days": 20,
        "total_work_hours": 160.0,
        "late_count": 2,
        "leave_days": 1.5
      }
    ]
  }
}
```

---

### 6.3 匯出報表

```
POST /api/v1/reports/export/
```

**權限**: IsAuthenticated, IsHRAdmin

**請求參數**:
```json
{
  "report_type": "attendance",
  "scope": "company",
  "date_from": "2025-11-01",
  "date_to": "2025-11-30",
  "format": "xlsx",
  "filters": {
    "department_id": [1, 2],
    "status": ["late", "absent"]
  },
  "columns": [
    "employee_id",
    "employee_name",
    "department",
    "date",
    "checkin_time",
    "checkout_time",
    "work_hours",
    "status"
  ]
}
```

**成功回應 (202 Accepted)**:
```json
{
  "success": true,
  "message": "報表產生中，完成後將寄送至您的 Email",
  "data": {
    "task_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "estimated_time": 60
  }
}
```

**業務邏輯**:
1. 建立非同步任務（Celery）
2. 產生報表檔案
3. 上傳至 S3
4. 發送 Email 通知（包含下載連結）

---

## 7. 系統管理 API

### 7.1 員工管理

```
GET    /api/v1/admin/employees/          # 查詢員工列表
GET    /api/v1/admin/employees/{id}/     # 查詢單一員工
POST   /api/v1/admin/employees/          # 新增員工
PATCH  /api/v1/admin/employees/{id}/     # 更新員工
DELETE /api/v1/admin/employees/{id}/     # 刪除員工（軟刪除）
```

**權限**: IsAuthenticated, IsHRAdmin

#### 新增員工

```
POST /api/v1/admin/employees/
```

**請求參數**:
```json
{
  "employee_id": "EMP010",
  "username": "新員工",
  "password": "TempPassword123",
  "email": "new@company.com",
  "phone": "0912345678",
  "department_id": 1,
  "role": "employee",
  "hire_date": "2025-12-01"
}
```

**成功回應 (201 Created)**:
```json
{
  "success": true,
  "message": "員工新增成功，臨時密碼已寄送至 Email",
  "data": {
    "employee_id": "EMP010",
    "username": "新員工",
    "email": "new@company.com"
  }
}
```

---

### 7.2 公司地點管理

```
GET    /api/v1/admin/companies/          # 查詢公司列表
POST   /api/v1/admin/companies/          # 新增公司
PATCH  /api/v1/admin/companies/{id}/     # 更新公司
DELETE /api/v1/admin/companies/{id}/     # 停用公司
```

#### 新增公司

```
POST /api/v1/admin/companies/
```

**請求參數**:
```json
{
  "name": "新竹分公司",
  "location": "新竹市東區光復路二段101號",
  "latitude": "24.8138287",
  "longitude": "120.9674798",
  "radius": 1500.0,
  "is_active": true
}
```

**成功回應 (201 Created)**:
```json
{
  "success": true,
  "message": "公司新增成功",
  "data": {
    "id": 3,
    "name": "新竹分公司",
    "qr_code_url": "https://api.qrserver.com/v1/create-qr-code/?data=24.8138287,120.9674798",
    "qr_code_data": "24.8138287, 120.9674798"
  }
}
```

---

### 7.3 系統設定

```
GET   /api/v1/admin/settings/           # 查詢所有設定
GET   /api/v1/admin/settings/{key}/     # 查詢單一設定
PATCH /api/v1/admin/settings/{key}/     # 更新設定
```

**權限**: IsAuthenticated, IsSystemAdmin

#### 更新設定

```
PATCH /api/v1/admin/settings/work_start_time/
```

**請求參數**:
```json
{
  "value": "09:00"
}
```

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "message": "設定已更新",
  "data": {
    "key": "work_start_time",
    "value": "09:00",
    "old_value": "08:30",
    "updated_at": "2025-11-19T15:00:00Z",
    "updated_by": "ADMIN001"
  }
}
```

---

### 7.4 稽核日誌查詢

```
GET /api/v1/admin/audit-logs/
```

**權限**: IsAuthenticated, IsSystemAdmin

**查詢參數**:
```
?action=login&user_id=EMP001&date_from=2025-11-01&result=failed
```

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 12345,
      "user": {
        "employee_id": "EMP001",
        "username": "張三"
      },
      "action": "login",
      "resource_type": null,
      "resource_id": null,
      "ip_address": "192.168.1.100",
      "user_agent": "Mozilla/5.0...",
      "result": "success",
      "created_at": "2025-11-19T08:30:00Z"
    }
  ]
}
```

---

## 8. 通知系統 API

### 8.1 查詢通知列表

```
GET /api/v1/notifications/
```

**權限**: IsAuthenticated

**查詢參數**:
```
?is_read=false&notification_type=leave_approved
```

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": 501,
      "notification_type": "leave_approved",
      "title": "請假申請已批准",
      "message": "您的特休假申請（2025-11-20 ~ 2025-11-22）已批准",
      "link": "/leave/789",
      "is_read": false,
      "created_at": "2025-11-19T14:00:00Z"
    }
  ],
  "meta": {
    "unread_count": 3
  }
}
```

---

### 8.2 標記已讀

```
POST /api/v1/notifications/{id}/mark-as-read/
```

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "message": "已標記為已讀"
}
```

---

### 8.3 標記全部已讀

```
POST /api/v1/notifications/mark-all-as-read/
```

**成功回應 (200 OK)**:
```json
{
  "success": true,
  "message": "已標記全部為已讀",
  "data": {
    "marked_count": 5
  }
}
```

---

## 9. 錯誤碼定義

### 9.1 認證相關錯誤

| 錯誤碼 | HTTP 狀態 | 說明 |
|--------|----------|------|
| INVALID_CREDENTIALS | 401 | 帳號或密碼錯誤 |
| ACCOUNT_LOCKED | 429 | 帳號已鎖定 |
| SESSION_EXPIRED | 401 | Session 已過期 |
| INCORRECT_OLD_PASSWORD | 400 | 舊密碼不正確 |
| WEAK_PASSWORD | 400 | 密碼強度不足 |
| INVALID_TOKEN | 400 | Token 無效或已過期 |

### 9.2 打卡相關錯誤

| 錯誤碼 | HTTP 狀態 | 說明 |
|--------|----------|------|
| LOCATION_OUT_OF_RANGE | 400 | 打卡位置超出範圍 |
| INVALID_QR_CODE | 400 | QR Code 座標無效 |
| ALREADY_CLOCKED_IN | 409 | 今天已打卡 |
| NO_CHECKIN_RECORD | 400 | 今天尚未上班打卡 |
| MAKEUP_EXPIRED | 400 | 補打卡僅限 3 天內申請 |

### 9.3 請假相關錯誤

| 錯誤碼 | HTTP 狀態 | 說明 |
|--------|----------|------|
| INSUFFICIENT_LEAVE_BALANCE | 400 | 假別額度不足 |
| LEAVE_DATE_CONFLICT | 409 | 請假日期衝突 |
| CANNOT_CANCEL_APPROVED_LEAVE | 400 | 已批准的請假無法撤銷 |
| INVALID_DATE_RANGE | 400 | 日期範圍無效 |

### 9.4 審批相關錯誤

| 錯誤碼 | HTTP 狀態 | 說明 |
|--------|----------|------|
| NOT_AUTHORIZED_APPROVER | 403 | 無審批權限 |
| ALREADY_APPROVED | 409 | 已審批過 |
| APPROVAL_EXPIRED | 400 | 審批已過期 |

### 9.5 系統相關錯誤

| 錯誤碼 | HTTP 狀態 | 說明 |
|--------|----------|------|
| PERMISSION_DENIED | 403 | 無權限存取 |
| RESOURCE_NOT_FOUND | 404 | 資源不存在 |
| DUPLICATE_ENTRY | 409 | 資料重複 |
| VALIDATION_ERROR | 400 | 參數驗證失敗 |
| INTERNAL_SERVER_ERROR | 500 | 伺服器內部錯誤 |
| TOO_MANY_REQUESTS | 429 | 超過速率限制 |

---

## 附錄 A: OpenAPI/Swagger 規格

系統將使用 `drf-spectacular` 自動產生 OpenAPI 3.0 規格：

```bash
# 產生 OpenAPI schema
python manage.py spectacular --file schema.yml

# 啟動 Swagger UI
# 訪問 https://attendance.company.com/api/docs/
```

---

## 附錄 B: Postman Collection

提供完整的 Postman Collection，包含：
- 環境變數設定（Dev, Test, Prod）
- 所有 API 端點範例
- 自動化測試腳本

下載: `/docs/postman/AMS_API_Collection.json`

---

**文件變更歷史**

| 版本 | 日期 | 作者 | 變更內容 |
|------|------|------|---------|
| 1.0 | 2025-11-19 | 系統架構團隊 | 初版建立 |
