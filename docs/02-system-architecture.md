# 系統架構設計書（System Architecture Document）
# 宏全出勤管理系統 v2.0

**文件版本**: 1.0
**建立日期**: 2025-11-19
**專案代號**: AMS-2.0

---

## 目錄
1. [整體架構](#1-整體架構)
2. [技術堆疊選擇](#2-技術堆疊選擇)
3. [安全架構](#3-安全架構)
4. [部署架構](#4-部署架構)
5. [資料流設計](#5-資料流設計)
6. [模組設計](#6-模組設計)

---

## 1. 整體架構

### 1.1 三層架構設計

```
┌─────────────────────────────────────────────────────────┐
│                      前端層 (Frontend)                    │
│  ┌─────────────────────────────────────────────────┐    │
│  │  React 19 + Vite + Tailwind CSS                 │    │
│  │  • 元件化 UI                                     │    │
│  │  • Context API 狀態管理                          │    │
│  │  • Axios HTTP Client                            │    │
│  │  • React Router v6                              │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │ HTTPS
                           │ JSON
                           ▼
┌─────────────────────────────────────────────────────────┐
│                   API 層 (Application)                   │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Django 5.1 + Django REST Framework             │    │
│  │  • RESTful API                                  │    │
│  │  • Session Authentication                       │    │
│  │  • Permission & Authorization                   │    │
│  │  • Business Logic                               │    │
│  │  • Celery (非同步任務，選配)                     │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
                           │
                           │ ORM
                           ▼
┌─────────────────────────────────────────────────────────┐
│                    資料層 (Database)                     │
│  ┌─────────────────────────────────────────────────┐    │
│  │  MySQL 8.0                                      │    │
│  │  • 關聯式資料庫                                  │    │
│  │  • 交易支援                                      │    │
│  │  • 備份與復原                                    │    │
│  └─────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

### 1.2 認證流程圖

```
使用者           前端            後端 API         資料庫
  │               │                │               │
  │  輸入帳密     │                │               │
  │──────────────>│                │               │
  │               │  POST /login   │               │
  │               │───────────────>│               │
  │               │                │  查詢使用者   │
  │               │                │──────────────>│
  │               │                │  回傳資料     │
  │               │                │<──────────────│
  │               │                │               │
  │               │                │  驗證密碼     │
  │               │                │  (PBKDF2)    │
  │               │                │               │
  │               │                │  建立 Session │
  │               │                │──────────────>│
  │               │   Session ID   │               │
  │               │   (Cookie)     │               │
  │               │<───────────────│               │
  │  登入成功     │                │               │
  │<──────────────│                │               │
  │               │                │               │
  │  後續請求     │                │               │
  │──────────────>│  帶 Session   │               │
  │               │───────────────>│               │
  │               │                │  驗證 Session │
  │               │                │──────────────>│
  │               │                │  檢查權限     │
  │               │                │               │
  │               │   回傳資料     │               │
  │               │<───────────────│               │
  │  顯示資料     │                │               │
  │<──────────────│                │               │
```

### 1.3 打卡驗證流程圖

```
使用者          前端           後端 API         資料庫
  │              │               │               │
  │ 掃描 QR Code│               │               │
  │─────────────>│               │               │
  │              │ 取得 GPS 位置 │               │
  │              │               │               │
  │              │ POST /clock-in│               │
  │              │ {qr_lat,      │               │
  │              │  qr_lng,      │               │
  │              │  user_lat,    │               │
  │              │  user_lng}    │               │
  │              │──────────────>│               │
  │              │               │ 1. 驗證參數   │
  │              │               │               │
  │              │               │ 2. 查詢公司表 │
  │              │               │ (驗證 QR 座標)│
  │              │               │──────────────>│
  │              │               │ 回傳公司資料  │
  │              │               │<──────────────│
  │              │               │               │
  │              │               │ 3. 計算距離   │
  │              │               │ (Haversine)   │
  │              │               │               │
  │              │               │ 4. 檢查範圍   │
  │              │               │ (dist<=radius)│
  │              │               │               │
  │              │               │ 5. 查詢今日   │
  │              │               │    打卡記錄   │
  │              │               │──────────────>│
  │              │               │ 回傳記錄      │
  │              │               │<──────────────│
  │              │               │               │
  │              │               │ 6. 產生時間戳 │
  │              │               │ (timezone.now)│
  │              │               │               │
  │              │               │ 7. 建立記錄   │
  │              │               │──────────────>│
  │              │               │ 成功          │
  │              │               │<──────────────│
  │              │ 200 OK        │               │
  │              │ {打卡資料}    │               │
  │              │<──────────────│               │
  │ 顯示成功動畫 │               │               │
  │<─────────────│               │               │
```

### 1.4 請假審批流程圖

```
員工           前端          後端 API       資料庫        主管         HR
 │              │              │              │             │            │
 │ 填寫請假申請│              │              │             │            │
 │─────────────>│              │              │             │            │
 │              │ POST /leave/ │              │             │            │
 │              │──────────────>│              │             │            │
 │              │              │ 1. 驗證參數  │             │            │
 │              │              │              │             │            │
 │              │              │ 2. 計算時數  │             │            │
 │              │              │              │             │            │
 │              │              │ 3. 檢查額度  │             │            │
 │              │              │─────────────>│             │            │
 │              │              │ 剩餘額度     │             │            │
 │              │              │<─────────────│             │            │
 │              │              │              │             │            │
 │              │              │ 4. 建立記錄  │             │            │
 │              │              │ (status=     │             │            │
 │              │              │  pending)    │             │            │
 │              │              │─────────────>│             │            │
 │              │              │              │             │            │
 │              │              │ 5. 發送通知  │             │            │
 │              │              │─────────────────────────> │            │
 │              │              │              │   Email    │            │
 │              │ 201 Created  │              │   通知     │            │
 │              │<──────────────│              │             │            │
 │ 申請成功     │              │              │             │            │
 │<─────────────│              │              │             │            │
 │              │              │              │             │            │
 │              │              │              │  查看待審   │            │
 │              │              │              │  請假列表   │            │
 │              │              │              │<────────────│            │
 │              │              │              │  顯示列表   │            │
 │              │              │              │─────────────>│            │
 │              │              │              │             │            │
 │              │              │              │  審批操作   │            │
 │              │              │<─────────────────────────  │            │
 │              │              │ POST /leave/ │             │            │
 │              │              │ {id}/approve/│             │            │
 │              │              │              │             │            │
 │              │              │ 1. 檢查權限  │             │            │
 │              │              │              │             │            │
 │              │              │ 2. 更新狀態  │             │            │
 │              │              │─────────────>│             │            │
 │              │              │ (status=     │             │            │
 │              │              │  approved)   │             │            │
 │              │              │              │             │            │
 │              │              │ 3. 判斷是否  │             │            │
 │              │              │    需 HR 覆核│             │            │
 │              │              │              │             │            │
 │              │              │ (若 >3 天)   │             │            │
 │              │              │──────────────────────────────────────> │
 │              │              │              │             │   Email    │
 │              │              │              │             │   通知 HR  │
 │              │              │              │             │            │
 │              │              │ 4. 通知員工  │             │            │
 │              │<──────────────────────────────────────────│            │
 │ 收到審批通知 │              │              │             │            │
 │<─────────────│              │              │             │            │
```

---

## 2. 技術堆疊選擇

### 2.1 後端技術選型

#### Django 5.1 + Django REST Framework

**選擇理由**：
1. **快速開發**：Django 提供 Admin、ORM、Authentication 等內建功能
2. **團隊熟悉度**：現有團隊已熟悉 Django 生態系
3. **安全性**：內建 CSRF、XSS、SQL Injection 防護
4. **生態系豐富**：大量第三方套件（DRF、Celery、Channels）
5. **文件完善**：官方文件詳盡，社群活躍

**替代方案比較**：

| 框架 | 優點 | 缺點 | 分數 |
|------|------|------|------|
| Django | 快速開發、功能完整、安全性高 | 效能稍弱於純 ASGI 框架 | 9/10 |
| FastAPI | 效能優異、自動產生 API 文件 | 生態系較新、缺乏內建功能 | 7/10 |
| Flask | 輕量彈性 | 需自行整合 ORM、Auth 等功能 | 6/10 |
| Express.js | 生態系豐富 | 需學習 Node.js、TypeScript | 5/10 |

**關鍵套件**：
```python
Django==5.1.3
djangorestframework==3.15.2
django-cors-headers==4.6.0
django-filter==24.3
drf-spectacular==0.27.2  # OpenAPI 文件自動產生
celery==5.4.0  # 非同步任務
redis==5.2.0  # Cache & Celery Broker
mysqlclient==2.2.6
python-dotenv==1.0.1
```

---

#### MySQL 8.0

**選擇理由**：
1. **公司標準**：現有系統皆使用 MySQL
2. **交易支援**：支援 ACID，確保資料一致性
3. **效能成熟**：經過多年優化，適合 OLTP 場景
4. **運維熟悉**：IT 團隊熟悉 MySQL 運維

**替代方案比較**：

| 資料庫 | 優點 | 缺點 | 分數 |
|--------|------|------|------|
| MySQL | 穩定可靠、公司標準、工具完善 | JSON 支援不如 PostgreSQL | 9/10 |
| PostgreSQL | 功能強大、JSON 支援優異 | 運維成本較高 | 8/10 |
| MongoDB | 彈性 Schema、水平擴展容易 | 不適合關聯式資料 | 4/10 |

**資料庫設定**：
```python
# settings.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.mysql',
        'NAME': os.getenv('DB_NAME', 'ams'),
        'USER': os.getenv('DB_USER', 'ams_user'),
        'PASSWORD': os.getenv('DB_PASSWORD'),
        'HOST': os.getenv('DB_HOST', '127.0.0.1'),
        'PORT': os.getenv('DB_PORT', '3306'),
        'OPTIONS': {
            'charset': 'utf8mb4',
            'init_command': "SET sql_mode='STRICT_TRANS_TABLES'",
        },
        'CONN_MAX_AGE': 600,  # 連線池
    }
}
```

---

### 2.2 前端技術選型

#### React 19 + Vite + Tailwind CSS

**選擇理由**：
1. **現有技術棧**：團隊已使用 React，學習成本低
2. **生態系成熟**：大量 UI 元件庫、工具鏈完善
3. **效能優異**：Virtual DOM、React Compiler 優化
4. **Vite 建置速度**：比 CRA 快 10-100 倍
5. **Tailwind 開發效率**：Utility-first CSS，快速原型開發

**替代方案比較**：

| 框架 | 優點 | 缺點 | 分數 |
|------|------|------|------|
| React 19 | 生態系最成熟、團隊熟悉 | Bundle Size 較大 | 9/10 |
| Vue 3 | 學習曲線平緩、效能優異 | 生態系較小 | 8/10 |
| Svelte | Bundle Size 最小、效能最佳 | 生態系最小、學習成本高 | 6/10 |

**關鍵套件**：
```json
{
  "dependencies": {
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "react-router-dom": "^6.28.0",
    "axios": "^1.7.9",
    "sonner": "^1.7.3",
    "html5-qrcode": "^2.3.8"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.4",
    "vite": "^6.0.3",
    "tailwindcss": "^3.4.16",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.49",
    "eslint": "^9.17.0"
  }
}
```

**目錄結構**：
```
my-project/
├── public/               # 靜態資源
│   └── favicon.ico
├── src/
│   ├── components/       # UI 元件
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx
│   │   │   ├── ForgotPassword.jsx
│   │   │   └── ChangePassword.jsx
│   │   ├── Attendance/
│   │   │   ├── ClockIn.jsx
│   │   │   ├── ClockOut.jsx
│   │   │   └── QRScanner.jsx
│   │   ├── Leave/
│   │   │   ├── LeaveForm.jsx
│   │   │   ├── LeaveList.jsx
│   │   │   └── LeaveApproval.jsx
│   │   ├── Reports/
│   │   │   ├── PersonalReport.jsx
│   │   │   └── DepartmentReport.jsx
│   │   └── Common/
│   │       ├── Button.jsx
│   │       ├── Modal.jsx
│   │       └── Toast.jsx
│   ├── contexts/         # Context API
│   │   ├── AuthContext.jsx
│   │   └── AppContext.jsx
│   ├── hooks/            # 自訂 Hooks
│   │   ├── useAuth.js
│   │   ├── useAttendance.js
│   │   └── useLeave.js
│   ├── services/         # API 服務
│   │   ├── api.js
│   │   ├── authService.js
│   │   ├── attendanceService.js
│   │   └── leaveService.js
│   ├── utils/            # 工具函式
│   │   ├── constants.js
│   │   ├── validators.js
│   │   └── formatters.js
│   ├── pages/            # 頁面元件
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── AttendancePage.jsx
│   │   └── ...
│   ├── App.jsx           # 主應用（精簡版）
│   ├── main.jsx          # 入口檔案
│   └── index.css         # 全域樣式
├── .env                  # 環境變數（不可提交）
├── .env.example          # 環境變數範本
├── vite.config.js        # Vite 設定
├── tailwind.config.js    # Tailwind 設定
└── package.json
```

---

### 2.3 認證機制選擇

#### Session-based Authentication

**選擇理由**：
1. **Django 原生支援**：無需額外套件
2. **安全性高**：Session ID 儲存於 Server，難以偽造
3. **自動過期管理**：Django 內建 Session 清理機制
4. **適合 Web 應用**：適合單一網域應用

**vs JWT 比較**：

| 項目 | Session | JWT | 勝出 |
|------|---------|-----|------|
| 安全性 | 高（Server 端控制） | 中（無法撤銷） | Session |
| 可擴展性 | 需 Sticky Session | 無狀態，易擴展 | JWT |
| 實作複雜度 | 簡單 | 中等 | Session |
| 適用場景 | 單體應用 | 微服務、跨域 | Session（本專案） |

**設定**：
```python
# settings.py
SESSION_ENGINE = 'django.contrib.sessions.backends.db'
SESSION_COOKIE_AGE = 28800  # 8 小時
SESSION_COOKIE_HTTPONLY = True  # 防 XSS
SESSION_COOKIE_SECURE = True  # HTTPS only (正式環境)
SESSION_COOKIE_SAMESITE = 'Lax'  # CSRF 防護
SESSION_SAVE_EVERY_REQUEST = False
```

---

## 3. 安全架構

### 3.1 認證與授權架構

#### 3.1.1 認證流程

```python
# views.py
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.contrib.auth import authenticate, login as django_login
from rest_framework.response import Response
from rest_framework import status

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    """
    登入端點

    安全措施：
    1. 密碼使用 PBKDF2-SHA256 加密比對
    2. 登入失敗不透露帳號是否存在
    3. 記錄登入日誌（IP、User-Agent、時間）
    4. 失敗 3 次後鎖定帳號 15 分鐘
    """
    employee_id = request.data.get('employee_id')
    password = request.data.get('password')

    # 檢查帳號鎖定狀態
    if is_account_locked(employee_id):
        return Response(
            {'error': '帳號已鎖定，請 15 分鐘後再試'},
            status=status.HTTP_429_TOO_MANY_REQUESTS
        )

    # 認證
    user = authenticate(request, username=employee_id, password=password)

    if user is not None:
        # 清除失敗計數
        clear_failed_attempts(employee_id)

        # 建立 Session
        django_login(request, user)

        # 記錄登入日誌
        AuditLog.objects.create(
            user=user,
            action='login',
            ip_address=get_client_ip(request),
            user_agent=request.META.get('HTTP_USER_AGENT'),
            result='success'
        )

        return Response({
            'success': True,
            'user': {
                'id': user.employee_id,
                'name': user.username,
                'role': user.role,
            }
        }, status=status.HTTP_200_OK)
    else:
        # 記錄失敗次數
        increment_failed_attempts(employee_id)

        # 記錄失敗日誌
        AuditLog.objects.create(
            action='login',
            ip_address=get_client_ip(request),
            result='failed',
            details={'employee_id': employee_id}
        )

        return Response(
            {'error': '帳號或密碼錯誤'},
            status=status.HTTP_401_UNAUTHORIZED
        )
```

#### 3.1.2 權限檢查

```python
# permissions.py
from rest_framework import permissions

class IsOwnerOrManager(permissions.BasePermission):
    """
    自訂權限：僅允許本人或主管查看
    """
    def has_object_permission(self, request, view, obj):
        # 超級管理員
        if request.user.role == 'admin':
            return True

        # 本人
        if obj.employee == request.user:
            return True

        # 主管（需檢查組織關係）
        if request.user.role == 'manager':
            return obj.employee in request.user.managed_employees.all()

        return False

# 使用範例
class AttendanceRecordViewSet(viewsets.ModelViewSet):
    permission_classes = [IsAuthenticated, IsOwnerOrManager]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return AttendanceRecord.objects.all()
        elif user.role == 'manager':
            return AttendanceRecord.objects.filter(
                employee__in=user.managed_employees.all()
            )
        else:
            return AttendanceRecord.objects.filter(employee=user)
```

### 3.2 資料加密

#### 3.2.1 傳輸層加密

**HTTPS/TLS 1.3 設定**：
```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name attendance.company.com;

    # TLS 設定
    ssl_certificate /etc/letsencrypt/live/attendance.company.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/attendance.company.com/privkey.pem;
    ssl_protocols TLSv1.3 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers on;

    # HSTS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CSP
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;

    # 其他安全標頭
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# HTTP 重導向至 HTTPS
server {
    listen 80;
    server_name attendance.company.com;
    return 301 https://$server_name$request_uri;
}
```

#### 3.2.2 資料儲存加密

**敏感欄位加密**：
```python
# models.py
from django.db import models
from django_cryptography.fields import encrypt

class Employee(AbstractUser):
    # 敏感資料加密儲存
    national_id = encrypt(models.CharField(max_length=20, blank=True))
    bank_account = encrypt(models.CharField(max_length=50, blank=True))

    # 一般資料
    employee_id = models.CharField(max_length=20, unique=True, primary_key=True)
    phone = models.CharField(max_length=20)
    email = models.EmailField()
```

**密碼加密**：
```python
# Django 預設使用 PBKDF2-SHA256
PASSWORD_HASHERS = [
    'django.contrib.auth.hashers.PBKDF2PasswordHasher',
    'django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher',
    'django.contrib.auth.hashers.Argon2PasswordHasher',
]

# 密碼強度驗證
AUTH_PASSWORD_VALIDATORS = [
    {
        'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator',
        'OPTIONS': {'min_length': 8}
    },
    {
        'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator',
    },
    {
        'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator',
    },
]
```

### 3.3 OWASP Top 10 防護實作

#### 3.3.1 SQL Injection 防護
```python
# ✅ 正確：使用 ORM 參數化查詢
AttendanceRecord.objects.filter(employee_id=employee_id)

# ❌ 錯誤：字串拼接（容易 SQL Injection）
# cursor.execute(f"SELECT * FROM attendance WHERE employee_id = '{employee_id}'")
```

#### 3.3.2 XSS 防護
```python
# settings.py
# Django 預設開啟 Template Auto-escaping

# 前端：Content Security Policy
MIDDLEWARE = [
    'csp.middleware.CSPMiddleware',
]

CSP_DEFAULT_SRC = ("'self'",)
CSP_SCRIPT_SRC = ("'self'",)
CSP_STYLE_SRC = ("'self'", "'unsafe-inline'")  # Tailwind 需要
```

#### 3.3.3 CSRF 防護
```python
# settings.py
MIDDLEWARE = [
    'django.middleware.csrf.CsrfViewMiddleware',
]

CSRF_COOKIE_HTTPONLY = False  # 前端需讀取
CSRF_COOKIE_SECURE = True  # HTTPS only
CSRF_TRUSTED_ORIGINS = [
    'https://attendance.company.com',
]

# 前端需在每個請求帶上 CSRF Token
// api.js
axios.defaults.headers.common['X-CSRFToken'] = getCookie('csrftoken');
```

#### 3.3.4 Rate Limiting
```python
# settings.py
REST_FRAMEWORK = {
    'DEFAULT_THROTTLE_CLASSES': [
        'rest_framework.throttling.AnonRateThrottle',
        'rest_framework.throttling.UserRateThrottle'
    ],
    'DEFAULT_THROTTLE_RATES': {
        'anon': '10/minute',
        'user': '60/minute',
        'login': '5/minute',
    }
}

# views.py
from rest_framework.throttling import UserRateThrottle

class LoginThrottle(UserRateThrottle):
    rate = '5/minute'

@api_view(['POST'])
@throttle_classes([LoginThrottle])
def login(request):
    # ...
```

---

## 4. 部署架構

### 4.1 開發環境

```
┌─────────────────────────────────────┐
│  開發者本機                          │
│  ┌───────────────────────────────┐  │
│  │  Frontend                     │  │
│  │  http://localhost:5173        │  │
│  │  Vite Dev Server              │  │
│  └───────────────────────────────┘  │
│                │                     │
│                │ HTTP                │
│                ▼                     │
│  ┌───────────────────────────────┐  │
│  │  Backend                      │  │
│  │  http://localhost:8000        │  │
│  │  Django Dev Server            │  │
│  └───────────────────────────────┘  │
│                │                     │
│                │ TCP                 │
│                ▼                     │
│  ┌───────────────────────────────┐  │
│  │  MySQL                        │  │
│  │  localhost:3306               │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**環境變數設定**：
```bash
# .env.development
DEBUG=True
SECRET_KEY=dev-secret-key-change-in-production
DATABASE_URL=mysql://root:password@localhost:3306/ams_dev
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### 4.2 測試環境

```
┌─────────────────────────────────────────┐
│  AWS EC2 (Test)                         │
│  ┌───────────────────────────────────┐  │
│  │  Nginx (Port 80/443)              │  │
│  │  - 反向代理                        │  │
│  │  - SSL 終止                        │  │
│  │  - 靜態檔案服務                    │  │
│  └───────────────────────────────────┘  │
│                │                         │
│                ▼                         │
│  ┌───────────────────────────────────┐  │
│  │  Gunicorn (Port 8000)             │  │
│  │  - WSGI Server                    │  │
│  │  - Workers: 4                     │  │
│  └───────────────────────────────────┘  │
│                │                         │
│                ▼                         │
│  ┌───────────────────────────────────┐  │
│  │  MySQL (Port 3306)                │  │
│  │  - 測試資料庫                      │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

**啟動腳本**：
```bash
# start.sh
#!/bin/bash
cd /var/www/attendance-system
source venv/bin/activate
gunicorn ams.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 4 \
    --timeout 120 \
    --access-logfile /var/log/gunicorn/access.log \
    --error-logfile /var/log/gunicorn/error.log \
    --daemon
```

### 4.3 正式環境

```
                  Internet
                     │
                     ▼
┌──────────────────────────────────────────┐
│  Cloudflare (選配)                       │
│  - DNS                                   │
│  - DDoS 防護                             │
│  - CDN                                   │
└──────────────────────────────────────────┘
                     │
                     ▼
┌──────────────────────────────────────────┐
│  AWS EC2 (Production)                    │
│  ┌────────────────────────────────────┐  │
│  │  Nginx (Port 80/443)               │  │
│  │  - HTTPS (Let's Encrypt)           │  │
│  │  - Load Balancer (選配)            │  │
│  │  - Rate Limiting                   │  │
│  │  - Gzip Compression                │  │
│  └────────────────────────────────────┘  │
│                │                          │
│                ▼                          │
│  ┌────────────────────────────────────┐  │
│  │  Gunicorn                          │  │
│  │  - Workers: CPU * 2 + 1            │  │
│  │  - Worker Class: sync              │  │
│  └────────────────────────────────────┘  │
│                │                          │
│                ▼                          │
│  ┌────────────────────────────────────┐  │
│  │  Django Application                │  │
│  └────────────────────────────────────┘  │
│                │                          │
│     ┌──────────┴──────────┐               │
│     ▼                     ▼               │
│  ┌──────────┐      ┌──────────┐          │
│  │  MySQL   │      │  Redis   │          │
│  │  Master  │      │  Cache   │          │
│  └──────────┘      └──────────┘          │
│       │                                   │
│       ▼                                   │
│  ┌──────────┐                            │
│  │  MySQL   │                            │
│  │  Slave   │                            │
│  │ (Read)   │                            │
│  └──────────┘                            │
└──────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  AWS S3                                  │
│  - 備份檔案                               │
│  - 靜態資源 (選配)                        │
└──────────────────────────────────────────┘
```

**系統需求**：
- CPU: 2 vCPU
- RAM: 4 GB
- Storage: 50 GB SSD
- OS: Ubuntu 22.04 LTS
- Python: 3.11+
- MySQL: 8.0+
- Nginx: 1.18+

### 4.4 CI/CD 流程

```
┌─────────────┐
│  Developer  │
│  git push   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  GitHub Actions                         │
│  ┌───────────────────────────────────┐  │
│  │  1. Checkout Code                 │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  2. Setup Environment             │  │
│  │     - Python 3.11                 │  │
│  │     - Node.js 20                  │  │
│  │     - MySQL 8.0                   │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  3. Install Dependencies          │  │
│  │     - pip install -r requirements │  │
│  │     - npm install                 │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  4. Run Tests                     │  │
│  │     - pytest (Backend)            │  │
│  │     - vitest (Frontend)           │  │
│  │     - coverage report             │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  5. Code Quality Check            │  │
│  │     - flake8, black               │  │
│  │     - eslint                      │  │
│  │     - safety check                │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  6. Build                         │  │
│  │     - vite build                  │  │
│  │     - collectstatic               │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  7. Deploy to Test                │  │
│  │     - SSH to EC2                  │  │
│  │     - Pull latest code            │  │
│  │     - Run migrations              │  │
│  │     - Restart services            │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  8. E2E Tests                     │  │
│  │     - Playwright                  │  │
│  └───────────────────────────────────┘  │
│  ┌───────────────────────────────────┐  │
│  │  9. Notify (Slack/Email)          │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
       │
       │ (Manual Approval)
       ▼
┌─────────────────────────────────────────┐
│  Deploy to Production                   │
└─────────────────────────────────────────┘
```

**.github/workflows/ci-cd.yml**：
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'

      - name: Install dependencies
        run: |
          pip install -r requirements.txt

      - name: Run tests
        run: |
          pytest --cov=./ --cov-report=xml

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  deploy-test:
    needs: test
    if: github.ref == 'refs/heads/develop'
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Test Server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.TEST_HOST }}
          username: ${{ secrets.TEST_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/attendance-system
            git pull origin develop
            source venv/bin/activate
            pip install -r requirements.txt
            python manage.py migrate
            sudo systemctl restart gunicorn
```

---

## 5. 資料流設計

### 5.1 打卡資料流

```
1. 前端掃描 QR Code 取得公司座標
   ↓
2. 前端取得使用者 GPS 座標
   ↓
3. 前端發送 POST /api/v1/attendance/clock-in/
   {
     qr_latitude: "25.0330",
     qr_longitude: "121.5654",
     user_latitude: "25.0335",
     user_longitude: "121.5660"
   }
   ↓
4. 後端接收並驗證
   - 驗證 Session (IsAuthenticated)
   - 驗證參數格式
   ↓
5. 後端查詢 Companies 表
   - 驗證 QR 座標是否為有效公司
   ↓
6. 後端計算距離
   - Haversine 公式
   - distance = calculate_distance(user_lat, user_lng, company_lat, company_lng)
   ↓
7. 後端檢查距離
   - if distance > company.radius: 拒絕打卡
   ↓
8. 後端查詢今日打卡記錄
   - AttendanceRecords.objects.filter(employee=user, date=today)
   ↓
9. 後端產生時間戳記
   - checkin_time = timezone.now()
   ↓
10. 後端建立記錄
    - AttendanceRecords.objects.create(...)
    ↓
11. 後端記錄稽核日誌
    - AuditLog.objects.create(action='clock_in', ...)
    ↓
12. 後端返回結果
    - Response(200, {打卡資料})
    ↓
13. 前端顯示成功動畫
```

### 5.2 請假審批資料流

```
員工申請請假
   ↓
POST /api/v1/leave/apply/
   ↓
後端建立 LeaveRecord (status='pending')
   ↓
後端建立 ApprovalRecord (approver=manager, status='pending')
   ↓
後端發送通知給主管
   - Notification.objects.create(user=manager, type='leave_approval', ...)
   - 發送 Email
   ↓
主管查看待審批列表
   ↓
GET /api/v1/leave/pending-approvals/
   ↓
主管審批
   ↓
POST /api/v1/leave/{id}/approve/ {action: 'approve'}
   ↓
後端更新 ApprovalRecord (status='approved')
   ↓
後端檢查是否需要下一級審批
   - if leave_days > 3: 建立 HR 審批記錄
   - else: 更新 LeaveRecord (status='approved')
   ↓
後端發送通知
   - 通知員工審批結果
   - (若需) 通知 HR 待審
   ↓
(若需 HR 審批) 重複審批流程
   ↓
最終 LeaveRecord.status = 'approved'
```

---

## 6. 模組設計

### 6.1 後端模組劃分

```
ams/
├── ams/                    # 專案設定
│   ├── settings/
│   │   ├── __init__.py
│   │   ├── base.py        # 基礎設定
│   │   ├── development.py # 開發環境
│   │   ├── production.py  # 正式環境
│   │   └── test.py        # 測試環境
│   ├── urls.py
│   └── wsgi.py
├── attendance/             # 核心應用
│   ├── models/
│   │   ├── employee.py    # 員工模型
│   │   ├── company.py     # 公司模型
│   │   ├── attendance.py  # 出勤模型
│   │   ├── leave.py       # 請假模型
│   │   └── approval.py    # 審批模型
│   ├── serializers/
│   │   ├── employee.py
│   │   ├── attendance.py
│   │   └── leave.py
│   ├── views/
│   │   ├── auth.py        # 認證端點
│   │   ├── attendance.py  # 打卡端點
│   │   ├── leave.py       # 請假端點
│   │   └── reports.py     # 報表端點
│   ├── permissions.py     # 自訂權限
│   ├── utils.py           # 工具函式
│   └── tests/
│       ├── test_models.py
│       ├── test_views.py
│       └── test_utils.py
├── notifications/          # 通知模組
│   ├── models.py
│   ├── services.py
│   └── tasks.py           # Celery 任務
├── audit/                  # 稽核日誌模組
│   ├── models.py
│   ├── middleware.py
│   └── views.py
└── manage.py
```

### 6.2 前端模組劃分

已在 2.2 節說明。

---

## 7. 效能優化策略

### 7.1 資料庫優化

```python
# models.py - 加上索引
class AttendanceRecord(models.Model):
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, db_index=True)
    date = models.DateField(db_index=True)
    checkin_time = models.DateTimeField()

    class Meta:
        indexes = [
            models.Index(fields=['employee', 'date']),  # 複合索引
            models.Index(fields=['-date']),  # 日期降序
        ]

# 使用 select_related 減少查詢
records = AttendanceRecord.objects.select_related('employee', 'company').all()

# 使用 prefetch_related 優化反向關聯
employees = Employee.objects.prefetch_related('attendance_records').all()
```

### 7.2 快取策略

```python
# settings.py
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.redis.RedisCache',
        'LOCATION': 'redis://127.0.0.1:6379/1',
        'OPTIONS': {
            'CLIENT_CLASS': 'django_redis.client.DefaultClient',
        },
        'KEY_PREFIX': 'ams',
        'TIMEOUT': 300,  # 5 分鐘
    }
}

# views.py - 使用快取
from django.core.cache import cache

def get_employee_statistics(employee_id):
    cache_key = f'employee_stats:{employee_id}'
    stats = cache.get(cache_key)

    if stats is None:
        # 計算統計資料（耗時操作）
        stats = calculate_statistics(employee_id)
        cache.set(cache_key, stats, timeout=3600)  # 快取 1 小時

    return stats
```

### 7.3 分頁

```python
# views.py
from rest_framework.pagination import PageNumberPagination

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

class AttendanceRecordViewSet(viewsets.ModelViewSet):
    pagination_class = StandardResultsSetPagination
```

---

**文件變更歷史**

| 版本 | 日期 | 作者 | 變更內容 |
|------|------|------|---------|
| 1.0 | 2025-11-19 | 系統架構團隊 | 初版建立 |
