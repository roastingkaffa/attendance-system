# 前端架構設計文件（Frontend Architecture Document）
# 宏全出勤管理系統 v2.0

**文件版本**: 1.0
**建立日期**: 2025-11-19
**技術棧**: React 19 + Vite + Tailwind CSS

---

## 目錄
1. [架構概覽](#1-架構概覽)
2. [目錄結構](#2-目錄結構)
3. [元件設計](#3-元件設計)
4. [狀態管理](#4-狀態管理)
5. [路由設計](#5-路由設計)
6. [API 整合](#6-api-整合)
7. [樣式規範](#7-樣式規範)
8. [效能優化](#8-效能優化)

---

## 1. 架構概覽

### 1.1 分層架構

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │ (頁面層)
│  ┌──────────┬──────────┬──────────┐     │
│  │ Login    │Dashboard │ Reports  │     │
│  │ Page     │ Page     │ Page     │     │
│  └──────────┴──────────┴──────────┘     │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│           Component Layer               │ (元件層)
│  ┌──────────┬──────────┬──────────┐     │
│  │ Auth     │Attendance│  Leave   │     │
│  │Components│Components│Components│     │
│  └──────────┴──────────┴──────────┘     │
│  ┌──────────────────────────────┐       │
│  │   Common Components          │       │
│  │ (Button, Modal, Toast, etc.) │       │
│  └──────────────────────────────┘       │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          State Management               │ (狀態層)
│  ┌──────────────────────────────┐       │
│  │   Context API                │       │
│  │ • AuthContext                │       │
│  │ • AppContext                 │       │
│  └──────────────────────────────┘       │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          Service Layer                  │ (服務層)
│  ┌──────────────────────────────┐       │
│  │   API Services               │       │
│  │ • authService.js             │       │
│  │ • attendanceService.js       │       │
│  │ • leaveService.js            │       │
│  └──────────────────────────────┘       │
└─────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────┐
│          Utility Layer                  │ (工具層)
│  ┌──────────────────────────────┐       │
│  │   Utilities                  │       │
│  │ • validators.js              │       │
│  │ • formatters.js              │       │
│  │ • constants.js               │       │
│  └──────────────────────────────┘       │
└─────────────────────────────────────────┘
```

### 1.2 資料流

```
User Action (點擊按鈕)
    ↓
Event Handler (onClick)
    ↓
Service Function (API 呼叫)
    ↓
Backend API
    ↓
Response Data
    ↓
Update State (Context)
    ↓
Re-render Component
    ↓
User sees updated UI
```

---

## 2. 目錄結構

```
my-project/
├── public/                    # 靜態資源
│   ├── favicon.ico
│   └── robots.txt
│
├── src/
│   ├── assets/               # 圖片、字型等資源
│   │   ├── images/
│   │   │   ├── logo.png
│   │   │   └── default-avatar.png
│   │   └── fonts/
│   │
│   ├── components/           # UI 元件
│   │   ├── Auth/             # 認證相關元件
│   │   │   ├── LoginForm.jsx
│   │   │   ├── ChangePasswordForm.jsx
│   │   │   └── ForgotPasswordForm.jsx
│   │   │
│   │   ├── Attendance/       # 打卡相關元件
│   │   │   ├── ClockInButton.jsx
│   │   │   ├── ClockOutButton.jsx
│   │   │   ├── QRScanner.jsx
│   │   │   ├── AttendanceCard.jsx
│   │   │   └── AttendanceList.jsx
│   │   │
│   │   ├── Leave/            # 請假相關元件
│   │   │   ├── LeaveForm.jsx
│   │   │   ├── LeaveCard.jsx
│   │   │   ├── LeaveList.jsx
│   │   │   ├── LeaveApproval.jsx
│   │   │   └── LeaveBalanceCard.jsx
│   │   │
│   │   ├── Reports/          # 報表相關元件
│   │   │   ├── PersonalReport.jsx
│   │   │   ├── DepartmentReport.jsx
│   │   │   ├── StatisticsCard.jsx
│   │   │   └── Chart.jsx
│   │   │
│   │   ├── Admin/            # 管理相關元件
│   │   │   ├── EmployeeManager.jsx
│   │   │   ├── CompanyManager.jsx
│   │   │   └── SystemSettings.jsx
│   │   │
│   │   └── Common/           # 共用元件
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       ├── Loading.jsx
│   │       ├── ErrorBoundary.jsx
│   │       ├── Pagination.jsx
│   │       ├── DatePicker.jsx
│   │       └── Layout/
│   │           ├── Header.jsx
│   │           ├── Footer.jsx
│   │           ├── Sidebar.jsx
│   │           └── MainLayout.jsx
│   │
│   ├── contexts/             # Context API
│   │   ├── AuthContext.jsx   # 認證狀態
│   │   ├── AppContext.jsx    # 全域狀態
│   │   └── NotificationContext.jsx  # 通知狀態
│   │
│   ├── hooks/                # 自訂 Hooks
│   │   ├── useAuth.js        # 認證 Hook
│   │   ├── useAttendance.js  # 打卡 Hook
│   │   ├── useLeave.js       # 請假 Hook
│   │   ├── useNotification.js  # 通知 Hook
│   │   ├── useGeolocation.js # GPS Hook
│   │   ├── usePagination.js  # 分頁 Hook
│   │   └── useDebounce.js    # 防抖 Hook
│   │
│   ├── services/             # API 服務
│   │   ├── api.js            # Axios 基礎配置
│   │   ├── authService.js    # 認證 API
│   │   ├── attendanceService.js  # 打卡 API
│   │   ├── leaveService.js   # 請假 API
│   │   ├── approvalService.js  # 審批 API
│   │   ├── reportService.js  # 報表 API
│   │   └── adminService.js   # 管理 API
│   │
│   ├── utils/                # 工具函式
│   │   ├── constants.js      # 常數定義
│   │   ├── validators.js     # 驗證函式
│   │   ├── formatters.js     # 格式化函式
│   │   ├── dateUtils.js      # 日期工具
│   │   ├── gpsUtils.js       # GPS 工具
│   │   └── storage.js        # LocalStorage/SessionStorage 工具
│   │
│   ├── pages/                # 頁面元件
│   │   ├── LoginPage.jsx
│   │   ├── DashboardPage.jsx
│   │   ├── AttendancePage.jsx
│   │   ├── ClockInPage.jsx
│   │   ├── ClockOutPage.jsx
│   │   ├── LeaveApplicationPage.jsx
│   │   ├── LeaveRecordsPage.jsx
│   │   ├── LeaveApprovalPage.jsx
│   │   ├── PersonalReportPage.jsx
│   │   ├── DepartmentReportPage.jsx
│   │   ├── AdminEmployeePage.jsx
│   │   ├── AdminCompanyPage.jsx
│   │   ├── SettingsPage.jsx
│   │   └── NotFoundPage.jsx
│   │
│   ├── styles/               # 全域樣式
│   │   ├── index.css         # Tailwind 基礎樣式
│   │   └── custom.css        # 自訂樣式
│   │
│   ├── App.jsx               # 主應用（精簡版）
│   ├── main.jsx              # 入口檔案
│   └── router.jsx            # 路由配置
│
├── .env.development          # 開發環境變數
├── .env.production           # 正式環境變數
├── .env.example              # 環境變數範本
├── .eslintrc.cjs             # ESLint 配置
├── .prettierrc               # Prettier 配置
├── vite.config.js            # Vite 配置
├── tailwind.config.js        # Tailwind 配置
├── postcss.config.js         # PostCSS 配置
├── package.json
└── README.md
```

---

## 3. 元件設計

### 3.1 元件設計原則

#### 單一職責原則
每個元件只負責一個功能，保持簡單且可測試。

```jsx
// ✅ 好的設計：職責單一
const ClockInButton = ({ onClockIn, isLoading }) => {
  return (
    <button
      onClick={onClockIn}
      disabled={isLoading}
      className="btn-primary"
    >
      {isLoading ? '打卡中...' : '上班打卡'}
    </button>
  );
};

// ❌ 壞的設計：職責過多
const AttendanceComponent = () => {
  // 包含打卡、請假、記錄查詢等多個功能
  // ... 數百行程式碼
};
```

#### 容器與展示元件分離

```jsx
// Container Component (智慧元件)
const AttendanceListContainer = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendanceRecords().then(data => {
      setRecords(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Loading />;

  return <AttendanceList records={records} />;
};

// Presentation Component (展示元件)
const AttendanceList = ({ records }) => {
  return (
    <div className="space-y-4">
      {records.map(record => (
        <AttendanceCard key={record.id} record={record} />
      ))}
    </div>
  );
};
```

### 3.2 核心元件範例

#### 3.2.1 Button 元件

```jsx
// src/components/Common/Button.jsx
import React from 'react';
import PropTypes from 'prop-types';

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  className = '',
  ...props
}) => {
  const baseClasses = 'rounded font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    success: 'bg-green-600 text-white hover:bg-green-700',
  };

  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center justify-center">
          <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          處理中...
        </span>
      ) : (
        children
      )}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['primary', 'secondary', 'danger', 'success']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  onClick: PropTypes.func,
  disabled: PropTypes.bool,
  loading: PropTypes.bool,
  className: PropTypes.string,
};

export default Button;
```

#### 3.2.2 QRScanner 元件

```jsx
// src/components/Attendance/QRScanner.jsx
import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import PropTypes from 'prop-types';

const QRScanner = ({ onScan, onError }) => {
  const scannerRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    };

    html5QrCodeRef.current = new Html5Qrcode('qr-reader');

    html5QrCodeRef.current
      .start(
        { facingMode: 'environment' }, // 使用後置鏡頭
        config,
        (decodedText) => {
          // 掃描成功
          onScan(decodedText);
          html5QrCodeRef.current.stop();
        },
        (errorMessage) => {
          // 掃描失敗（持續掃描，不需處理）
        }
      )
      .catch((err) => {
        onError('無法啟動相機，請檢查權限設定');
        console.error('QR Scanner Error:', err);
      });

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error(err));
      }
    };
  }, [onScan, onError]);

  return (
    <div className="flex flex-col items-center">
      <div id="qr-reader" className="w-full max-w-sm" />
      <p className="mt-4 text-gray-600 text-sm text-center">
        請將 QR Code 對準畫面中央
      </p>
    </div>
  );
};

QRScanner.propTypes = {
  onScan: PropTypes.func.isRequired,
  onError: PropTypes.func.isRequired,
};

export default QRScanner;
```

#### 3.2.3 LeaveForm 元件

```jsx
// src/components/Leave/LeaveForm.jsx
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import Button from '../Common/Button';
import DatePicker from '../Common/DatePicker';
import { LEAVE_TYPES } from '../../utils/constants';
import { validateLeaveForm } from '../../utils/validators';

const LeaveForm = ({ onSubmit, isLoading }) => {
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    end_date: '',
    duration: 'full_day',
    reason: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // 清除該欄位的錯誤
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 驗證表單
    const validationErrors = validateLeaveForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 假別選擇 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          假別
        </label>
        <select
          name="leave_type"
          value={formData.leave_type}
          onChange={handleChange}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {LEAVE_TYPES.map(type => (
            <option key={type.value} value={type.value}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {/* 開始日期 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          開始日期
        </label>
        <DatePicker
          value={formData.start_date}
          onChange={(date) => handleChange({ target: { name: 'start_date', value: date } })}
          minDate={new Date()}
        />
        {errors.start_date && (
          <p className="mt-1 text-sm text-red-600">{errors.start_date}</p>
        )}
      </div>

      {/* 結束日期 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          結束日期
        </label>
        <DatePicker
          value={formData.end_date}
          onChange={(date) => handleChange({ target: { name: 'end_date', value: date } })}
          minDate={formData.start_date || new Date()}
        />
        {errors.end_date && (
          <p className="mt-1 text-sm text-red-600">{errors.end_date}</p>
        )}
      </div>

      {/* 時段選擇 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          請假時段
        </label>
        <div className="flex space-x-4">
          {['full_day', 'morning', 'afternoon'].map(duration => (
            <label key={duration} className="flex items-center">
              <input
                type="radio"
                name="duration"
                value={duration}
                checked={formData.duration === duration}
                onChange={handleChange}
                className="mr-2"
              />
              {duration === 'full_day' ? '整天' : duration === 'morning' ? '早上' : '下午'}
            </label>
          ))}
        </div>
      </div>

      {/* 請假原因 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          請假原因
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows={4}
          className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="請輸入請假原因"
        />
        {errors.reason && (
          <p className="mt-1 text-sm text-red-600">{errors.reason}</p>
        )}
      </div>

      {/* 送出按鈕 */}
      <Button type="submit" variant="primary" loading={isLoading} className="w-full">
        送出申請
      </Button>
    </form>
  );
};

LeaveForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool,
};

export default LeaveForm;
```

---

## 4. 狀態管理

### 4.1 AuthContext

```jsx
// src/contexts/AuthContext.jsx
import React, { createContext, useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { authService } from '../services/authService';
import { storage } from '../utils/storage';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  // 初始化：檢查是否有已登入的 Session
  useEffect(() => {
    const initAuth = async () => {
      const userId = storage.get('userId');
      if (userId) {
        try {
          // 呼叫 GET /api/v1/auth/me/ 取得使用者資訊
          const userData = await authService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Session 已過期
          storage.remove('userId');
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials) => {
    try {
      const data = await authService.login(credentials);
      setUser(data.user);
      setIsAuthenticated(true);
      storage.set('userId', data.user.employee_id);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      storage.remove('userId');
    }
  }, []);

  const updateUser = useCallback((userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  }, []);

  const value = {
    user,
    isAuthenticated,
    loading,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
```

### 4.2 使用 useAuth Hook

```jsx
// src/hooks/useAuth.js
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// 使用範例
const LoginPage = () => {
  const { login, isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({ employee_id: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(formData);
    if (result.success) {
      navigate('/dashboard');
    } else {
      toast.error(result.error);
    }
  };

  if (isAuthenticated) {
    return <Navigate to="/dashboard" />;
  }

  return <LoginForm onSubmit={handleSubmit} />;
};
```

---

## 5. 路由設計

### 5.1 路由配置

```jsx
// src/router.jsx
import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/Common/ProtectedRoute';
import MainLayout from './components/Common/Layout/MainLayout';

// Pages
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import ClockInPage from './pages/ClockInPage';
import ClockOutPage from './pages/ClockOutPage';
import LeaveApplicationPage from './pages/LeaveApplicationPage';
import LeaveRecordsPage from './pages/LeaveRecordsPage';
import LeaveApprovalPage from './pages/LeaveApprovalPage';
import PersonalReportPage from './pages/PersonalReportPage';
import DepartmentReportPage from './pages/DepartmentReportPage';
import AdminEmployeePage from './pages/AdminEmployeePage';
import SettingsPage from './pages/SettingsPage';
import NotFoundPage from './pages/NotFoundPage';

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <MainLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: 'dashboard',
        element: <DashboardPage />,
      },
      {
        path: 'clock-in',
        element: <ClockInPage />,
      },
      {
        path: 'clock-out',
        element: <ClockOutPage />,
      },
      {
        path: 'leave',
        children: [
          {
            path: 'apply',
            element: <LeaveApplicationPage />,
          },
          {
            path: 'records',
            element: <LeaveRecordsPage />,
          },
          {
            path: 'approval',
            element: (
              <ProtectedRoute requiredRole={['manager', 'hr_admin']}>
                <LeaveApprovalPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'reports',
        children: [
          {
            path: 'personal',
            element: <PersonalReportPage />,
          },
          {
            path: 'department',
            element: (
              <ProtectedRoute requiredRole={['manager', 'hr_admin']}>
                <DepartmentReportPage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'admin',
        children: [
          {
            path: 'employees',
            element: (
              <ProtectedRoute requiredRole={['hr_admin', 'system_admin']}>
                <AdminEmployeePage />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'settings',
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export default router;
```

### 5.2 ProtectedRoute 元件

```jsx
// src/components/Common/ProtectedRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useAuth } from '../../hooks/useAuth';
import Loading from './Loading';

const ProtectedRoute = ({ children, requiredRole = [] }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRole.length > 0 && !requiredRole.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
  requiredRole: PropTypes.arrayOf(PropTypes.string),
};

export default ProtectedRoute;
```

---

## 6. API 整合

### 6.1 Axios 基礎配置

```javascript
// src/services/api.js
import axios from 'axios';
import { toast } from 'sonner';
import { storage } from '../utils/storage';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

// 建立 Axios 實例
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  withCredentials: true, // 自動帶上 Cookies（Session）
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor
api.interceptors.request.use(
  (config) => {
    // 從 Cookie 取得 CSRF Token
    const csrftoken = getCookie('csrftoken');
    if (csrftoken) {
      config.headers['X-CSRFToken'] = csrftoken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor
api.interceptors.response.use(
  (response) => {
    // 成功回應，直接返回 data
    return response.data;
  },
  (error) => {
    // 錯誤處理
    if (error.response) {
      const { status, data } = error.response;

      // 401 Unauthorized - Session 過期
      if (status === 401) {
        storage.remove('userId');
        window.location.href = '/login';
        toast.error('登入已過期，請重新登入');
      }

      // 403 Forbidden - 無權限
      else if (status === 403) {
        toast.error('無權限執行此操作');
      }

      // 429 Too Many Requests - 超過速率限制
      else if (status === 429) {
        toast.error('操作過於頻繁，請稍後再試');
      }

      // 500 Internal Server Error
      else if (status === 500) {
        toast.error('伺服器錯誤，請稍後再試');
      }

      // 其他錯誤
      else {
        const errorMessage = data?.error?.message || '操作失敗';
        toast.error(errorMessage);
      }

      return Promise.reject(data?.error || error);
    }

    // 網路錯誤
    toast.error('網路連線異常，請檢查您的網路連線');
    return Promise.reject(error);
  }
);

// 取得 Cookie
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

export default api;
```

### 6.2 Service 範例

```javascript
// src/services/attendanceService.js
import api from './api';

export const attendanceService = {
  // 上班打卡
  clockIn: async (data) => {
    try {
      const response = await api.post('/attendance/clock-in/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 下班打卡
  clockOut: async (data) => {
    try {
      const response = await api.post('/attendance/clock-out/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 查詢出勤記錄
  getRecords: async (params) => {
    try {
      const response = await api.get('/attendance/records/', { params });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // 補打卡申請
  requestMakeup: async (data) => {
    try {
      const response = await api.post('/attendance/makeup-request/', data);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
```

---

## 7. 樣式規範

### 7.1 Tailwind CSS 配置

```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',  // 主色
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans TC', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
```

### 7.2 樣式命名規範

```jsx
// 使用 Tailwind 的 Utility Classes
<div className="bg-white rounded-lg shadow-md p-6 mb-4">
  <h2 className="text-xl font-bold text-gray-800 mb-2">標題</h2>
  <p className="text-gray-600">內容</p>
</div>

// 複雜樣式可抽取為 Component
const Card = ({ children }) => (
  <div className="bg-white rounded-lg shadow-md p-6 mb-4">
    {children}
  </div>
);
```

---

## 8. 效能優化

### 8.1 程式碼分割（Code Splitting）

```jsx
// 使用 React.lazy 延遲載入
import React, { lazy, Suspense } from 'react';
import Loading from './components/Common/Loading';

const AdminPage = lazy(() => import('./pages/AdminPage'));

const App = () => (
  <Suspense fallback={<Loading />}>
    <AdminPage />
  </Suspense>
);
```

### 8.2 Memo化

```jsx
import React, { memo } from 'react';

// 避免不必要的重新渲染
const AttendanceCard = memo(({ record }) => {
  return (
    <div className="card">
      {/* ... */}
    </div>
  );
});

// 使用 useMemo 快取計算結果
import { useMemo } from 'react';

const MonthlyReport = ({ records }) => {
  const statistics = useMemo(() => {
    return calculateStatistics(records);
  }, [records]);

  return <div>{/* ... */}</div>;
};
```

### 8.3 防抖與節流

```javascript
// src/hooks/useDebounce.js
import { useState, useEffect } from 'react';

export const useDebounce = (value, delay = 500) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// 使用範例
const SearchInput = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    if (debouncedSearchTerm) {
      // 執行搜尋 API
      searchEmployees(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  return (
    <input
      type="text"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  );
};
```

---

**文件變更歷史**

| 版本 | 日期 | 作者 | 變更內容 |
|------|------|------|---------|
| 1.0 | 2025-11-19 | 系統架構團隊 | 初版建立 |
