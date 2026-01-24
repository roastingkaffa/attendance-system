/**
 * App.jsx - 主應用程式元件（重構版）
 * Phase 3 增強：整合角色權限系統
 */
import React, { useState, useEffect } from 'react';
import { toast, Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContext';
import LoginForm from './components/auth/LoginForm';
import ChangePasswordForm from './components/auth/ChangePasswordForm';
import Button from './components/common/Button';
import Loading from './components/common/Loading';
import QRCamera from './QRCamera';
import attendanceService from './services/attendanceService';
import authService from './services/authService';
// Phase 2 Week 4: 請假與審批元件
import LeaveForm from './components/leave/LeaveForm';
import LeaveList from './components/leave/LeaveList';
import LeaveBalanceCard from './components/leave/LeaveBalanceCard';
import ApprovalList from './components/approval/ApprovalList';
import leaveService from './services/leaveService';
// Phase 1: 補打卡元件
import MakeupClockForm from './components/attendance/MakeupClockForm';
import MakeupClockList from './components/attendance/MakeupClockList';
import makeupClockService from './services/makeupClockService';
// Phase 2: 加班管理元件
import OvertimeForm from './components/overtime/OvertimeForm';
import OvertimeList from './components/overtime/OvertimeList';
import OvertimeApprovalList from './components/overtime/OvertimeApprovalList';
import overtimeService from './services/overtimeService';
// Phase 2: 報表元件
import AttendanceSummary from './components/reports/AttendanceSummary';
import AnomalyList from './components/reports/AnomalyList';
import AnnualLeaveCalculator from './components/leave/AnnualLeaveCalculator';
// Phase 2: 通知元件
import NotificationBell from './components/notifications/NotificationBell';
import NotificationDropdown from './components/notifications/NotificationDropdown';
// Phase 3: 主管與 HR 元件
import RoleGuard, { ManagerOnly, HROnly, CanExport } from './components/common/RoleGuard';
import ManagerDashboard from './components/manager/ManagerDashboard';
import BatchApproval from './components/manager/BatchApproval';
import DepartmentReport from './components/manager/DepartmentReport';
import EmployeeManagement from './components/hr/EmployeeManagement';
import ExportModal from './components/export/ExportModal';
import './App.css';

const App = () => {
  const {
    isAuthenticated,
    userId,
    relationId,
    logout,
    forgotPassword,
    // Phase 3 新增
    role,
    getRoleDisplay,
    isManager,
    isHR,
    userProfile,
  } = useAuth();

  // 頁面狀態
  const [page, setPage] = useState(isAuthenticated ? 'dashboard' : 'login');

  // GPS 狀態
  const [gps, setGps] = useState(null);

  // 打卡相關狀態
  const [scanning, setScanning] = useState(false);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [leaveRecords, setLeaveRecords] = useState([]);

  // Phase 2 Week 4: 請假管理狀態
  const [showLeaveForm, setShowLeaveForm] = useState(false);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTab, setReportTab] = useState('summary'); // summary, anomaly, annual

  // Phase 1: 補打卡狀態
  const [showMakeupForm, setShowMakeupForm] = useState(false);
  const [makeupQuota, setMakeupQuota] = useState(null);

  // Phase 2: 加班管理狀態
  const [showOvertimeForm, setShowOvertimeForm] = useState(false);
  const [overtimeRecords, setOvertimeRecords] = useState([]);

  // Phase 2: 通知狀態
  const [showNotifications, setShowNotifications] = useState(false);

  // Phase 3: 主管與 HR 功能狀態
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [managerTab, setManagerTab] = useState('dashboard'); // dashboard, batch, report
  const [showHRModal, setShowHRModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  // 忘記密碼表單
  const [email, setEmail] = useState('');

  // 初始化：取得 GPS 位置
  useEffect(() => {
    getLocation();
  }, []);

  // 登入成功後載入資料
  useEffect(() => {
    if (isAuthenticated && page === 'dashboard') {
      fetchAttendanceRecords();
      fetchLeaveRecords();
      fetchLeaveBalances();
      fetchMakeupQuota();
      fetchOvertimeRecords();
    }
  }, [isAuthenticated, page, userId]);

  /**
   * 檢查是否為安全連線 (HTTPS)
   */
  const isSecureContext = () => {
    return window.isSecureContext ||
           window.location.protocol === 'https:' ||
           window.location.hostname === 'localhost' ||
           window.location.hostname === '127.0.0.1';
  };

  /**
   * 偵測 iOS 裝置
   */
  const isIOS = () => {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
  };

  /**
   * 取得 GPS 位置
   */
  const getLocation = () => {
    // iOS 必須使用 HTTPS 才能存取 Geolocation API
    if (!isSecureContext()) {
      const message = isIOS()
        ? 'iOS 裝置需要 HTTPS 連線才能使用定位功能。請使用 https:// 網址存取此頁面。'
        : '需要安全連線 (HTTPS) 才能使用定位功能。';
      console.warn('GPS 錯誤:', message);
      toast.error(message, { duration: 5000 });
      return;
    }

    if (!navigator.geolocation) {
      toast.error('您的瀏覽器不支援定位功能');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGps({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        console.log('GPS 定位成功:', position.coords.latitude, position.coords.longitude);
      },
      (error) => {
        let message = '無法取得 GPS 位置';
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = isIOS()
              ? '定位權限被拒絕。請至「設定 > Safari > 位置」允許此網站使用定位服務。'
              : '定位權限被拒絕。請在瀏覽器設定中允許定位權限。';
            break;
          case error.POSITION_UNAVAILABLE:
            message = '無法取得位置資訊，請確認裝置定位服務已開啟。';
            break;
          case error.TIMEOUT:
            message = '取得位置逾時，請重試。';
            break;
        }
        console.error('GPS 錯誤:', error.code, error.message);
        toast.error(message, { duration: 5000 });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000
      }
    );
  };

  /**
   * 取得出勤記錄
   */
  const fetchAttendanceRecords = async () => {
    try {
      const response = await attendanceService.getRecords({
        employee_id: userId,
        days: 7,
      });
      console.log('📊 出勤記錄 API 回應:', response);
      // DRF ModelViewSet 直接返回陣列，不需要 .data
      setAttendanceRecords(Array.isArray(response) ? response : []);
    } catch (error) {
      console.error('取得出勤記錄失敗:', error);
    }
  };

  /**
   * 取得請假記錄
   */
  const fetchLeaveRecords = async () => {
    try {
      const response = await leaveService.getMyLeaveRecords({ days: 30 });
      console.log('📋 請假記錄 API 回應:', response);
      setLeaveRecords(response.data?.records || []);
    } catch (error) {
      console.error('取得請假記錄失敗:', error);
    }
  };

  /**
   * 取得假別額度
   */
  const fetchLeaveBalances = async () => {
    try {
      const response = await leaveService.getLeaveBalances();
      console.log('💰 假別額度 API 回應:', response);
      setLeaveBalances(response.data?.balances || []);
    } catch (error) {
      console.error('取得假別額度失敗:', error);
    }
  };

  /**
   * 取得補打卡額度
   */
  const fetchMakeupQuota = async () => {
    try {
      const response = await makeupClockService.getQuota();
      console.log('🔧 補打卡額度 API 回應:', response);
      setMakeupQuota(response.data);
    } catch (error) {
      console.error('取得補打卡額度失敗:', error);
    }
  };

  /**
   * 取得加班記錄
   */
  const fetchOvertimeRecords = async () => {
    try {
      const response = await overtimeService.getMyOvertimeRecords({ days: 30 });
      console.log('⏰ 加班記錄 API 回應:', response);
      setOvertimeRecords(response.data?.records || []);
    } catch (error) {
      console.error('取得加班記錄失敗:', error);
    }
  };

  /**
   * 處理請假申請成功
   */
  const handleLeaveSubmitSuccess = () => {
    setShowLeaveForm(false);
    fetchLeaveRecords();
    fetchLeaveBalances();
    toast.success('請假申請已送出');
  };

  /**
   * 處理補打卡申請成功
   */
  const handleMakeupSubmitSuccess = () => {
    setShowMakeupForm(false);
    fetchAttendanceRecords();
    fetchMakeupQuota();
    toast.success('補打卡申請已送出');
  };

  /**
   * 處理加班申請成功
   */
  const handleOvertimeSubmitSuccess = () => {
    setShowOvertimeForm(false);
    fetchOvertimeRecords();
    fetchLeaveBalances(); // 補休可能會增加
    toast.success('加班申請已送出');
  };

  /**
   * 處理登出
   */
  const handleLogout = async () => {
    await logout();
    setPage('login');
    setAttendanceRecords([]);
    setLeaveRecords([]);
  };

  /**
   * 處理忘記密碼
   */
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast.error('請輸入 Email');
      return;
    }
    await forgotPassword(email);
    setEmail('');
    setPage('login');
  };

  /**
   * 登入頁面
   */
  if (page === 'login') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <LoginForm
          onSuccess={() => setPage('dashboard')}
          onForgotPassword={() => setPage('forgot')}
        />
      </div>
    );
  }

  /**
   * 忘記密碼頁面
   */
  if (page === 'forgot') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">忘記密碼</h2>
          <form onSubmit={handleForgotPassword} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="請輸入註冊的 Email"
              />
            </div>
            <div className="flex gap-4">
              <Button type="submit" variant="primary" size="lg" className="flex-1">
                發送臨時密碼
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="lg"
                onClick={() => setPage('login')}
                className="flex-1"
              >
                返回登入
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  /**
   * 修改密碼頁面
   */
  if (page === 'changePassword') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
        <Toaster position="top-center" richColors />
        <ChangePasswordForm
          onSuccess={() => setPage('dashboard')}
          onCancel={() => setPage('dashboard')}
        />
      </div>
    );
  }

  /**
   * Dashboard 頁面
   * TODO: 拆分成獨立的 Dashboard 元件（Phase 2 後續任務）
   */
  return (
    <div className="min-h-screen bg-gray-100">
      <Toaster position="top-center" richColors />

      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">禾一系統出勤系統</h1>
          <div className="flex items-center gap-4">
            {/* Phase 3：主管功能按鈕 */}
            {isManager() && (
              <Button
                variant="outline"
                onClick={() => setShowManagerModal(true)}
              >
                主管功能
              </Button>
            )}
            {/* Phase 3：HR 功能按鈕 */}
            {isHR() && (
              <Button
                variant="outline"
                onClick={() => setShowHRModal(true)}
              >
                HR 管理
              </Button>
            )}
            {/* Phase 3：匯出按鈕 */}
            {isManager() && (
              <Button
                variant="outline"
                onClick={() => setShowExportModal(true)}
              >
                匯出
              </Button>
            )}
            {/* 通知鈴鐺 */}
            <div className="relative">
              <NotificationBell onClick={() => setShowNotifications(!showNotifications)} />
              <NotificationDropdown
                isOpen={showNotifications}
                onClose={() => setShowNotifications(false)}
              />
            </div>
            <Button variant="secondary" onClick={() => setPage('changePassword')}>
              修改密碼
            </Button>
            <Button variant="danger" onClick={handleLogout}>
              登出
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Info */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-2">
                歡迎，{userProfile?.username || userId}
              </h2>
              <div className="flex items-center gap-3">
                <span className={`px-2 py-1 text-xs rounded-full ${
                  role === 'employee' ? 'bg-gray-100 text-gray-700' :
                  role === 'manager' ? 'bg-blue-100 text-blue-700' :
                  role === 'hr_admin' ? 'bg-purple-100 text-purple-700' :
                  role === 'ceo' ? 'bg-red-100 text-red-700' :
                  'bg-yellow-100 text-yellow-700'
                }`}>
                  {getRoleDisplay()}
                </span>
                {userProfile?.department_name && (
                  <span className="text-sm text-gray-500">
                    {userProfile.department_name}
                  </span>
                )}
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">
                GPS 狀態: {gps ? `✅ (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})` : '❌ 未取得'}
              </p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setScanning(true);
            }}
            className="h-28"
          >
            📷 掃描打卡
          </Button>
          <Button
            variant="success"
            size="lg"
            className="h-28"
            onClick={() => setShowLeaveForm(true)}
          >
            📝 申請請假
          </Button>
          <Button
            variant="warning"
            size="lg"
            className="h-28"
            onClick={() => setShowOvertimeForm(true)}
          >
            ⏰ 申請加班
          </Button>
          <Button
            variant="secondary"
            size="lg"
            className="h-28"
            onClick={() => setShowMakeupForm(true)}
          >
            🔧 補打卡
            {makeupQuota && (
              <span className="block text-sm mt-1">
                剩餘 {makeupQuota.remaining_count} 次
              </span>
            )}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-28"
            onClick={() => setShowReportModal(true)}
          >
            📊 查看報表
          </Button>
        </div>

        {/* Leave Balances - Phase 2 Week 4 */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-4">假別額度</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {leaveBalances.length > 0 ? (
              leaveBalances.map((balance) => (
                <LeaveBalanceCard key={balance.id} balance={balance} />
              ))
            ) : (
              <div className="col-span-3 bg-white rounded-lg shadow p-6 text-center text-gray-500">
                無假別額度資料
              </div>
            )}
          </div>
        </div>

        {/* Leave Records - Phase 2 Week 4 */}
        <div className="mb-8">
          <LeaveList
            records={leaveRecords}
            onRefresh={fetchLeaveRecords}
          />
        </div>

        {/* Attendance Records */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold mb-4">最近打卡記錄</h3>
          {attendanceRecords.length > 0 ? (
            <div className="space-y-4">
              {attendanceRecords.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{record.date}</p>
                        {record.is_late && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded">
                            遲到 {record.late_minutes} 分鐘
                          </span>
                        )}
                        {record.is_early_leave && (
                          <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded">
                            早退 {record.early_leave_minutes} 分鐘
                          </span>
                        )}
                        {record.is_makeup && (
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs rounded">
                            補打卡
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        上班: {record.checkin_time ? new Date(record.checkin_time).toLocaleTimeString('zh-TW') : '-'} |
                        下班: {record.checkout_time ? new Date(record.checkout_time).toLocaleTimeString('zh-TW') : '-'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">工時</p>
                      <p className="font-medium">{record.work_hours || 0} 小時</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">無打卡記錄</p>
          )}
        </div>

        {/* Makeup Clock List - Phase 1 */}
        <div className="mt-8">
          <MakeupClockList onRefresh={fetchMakeupQuota} />
        </div>

        {/* Overtime List - Phase 2 */}
        <div className="mt-8">
          <OvertimeList onRefresh={fetchOvertimeRecords} />
        </div>
      </main>

      {/* QR Scanner Modal */}
      {scanning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">掃描 QR Code</h3>
              <button
                onClick={() => setScanning(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <QRCamera
              onScan={(result) => {
                // TODO: 處理掃描結果，呼叫 attendanceService.clockIn()
                console.log('QR Code:', result);
                setScanning(false);
              }}
              onError={(error) => {
                console.error('QR Scanner error:', error);
                toast.error('掃描失敗');
              }}
            />
          </div>
        </div>
      )}

      {/* Leave Form Modal - Phase 2 Week 4 */}
      {showLeaveForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">申請請假</h3>
              <button
                onClick={() => setShowLeaveForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <LeaveForm
              onSuccess={handleLeaveSubmitSuccess}
              onCancel={() => setShowLeaveForm(false)}
            />
          </div>
        </div>
      )}

      {/* Makeup Clock Form Modal - Phase 1 */}
      {showMakeupForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">補打卡申請</h3>
              <button
                onClick={() => setShowMakeupForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <MakeupClockForm
              onSuccess={handleMakeupSubmitSuccess}
              onCancel={() => setShowMakeupForm(false)}
              attendanceRecords={attendanceRecords}
            />
          </div>
        </div>
      )}

      {/* Overtime Form Modal - Phase 2 */}
      {showOvertimeForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">加班申請</h3>
              <button
                onClick={() => setShowOvertimeForm(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ×
              </button>
            </div>
            <OvertimeForm
              onSuccess={handleOvertimeSubmitSuccess}
              onCancel={() => setShowOvertimeForm(false)}
            />
          </div>
        </div>
      )}

      {/* Report Modal - Phase 2 Enhanced */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">報表中心</h3>
              <button
                onClick={() => setShowReportModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                onClick={() => setReportTab('summary')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  reportTab === 'summary'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                出勤摘要
              </button>
              <button
                onClick={() => setReportTab('anomaly')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  reportTab === 'anomaly'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                異常清單
              </button>
              <button
                onClick={() => setReportTab('annual')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  reportTab === 'annual'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                特休資格
              </button>
              <button
                onClick={() => setReportTab('balance')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  reportTab === 'balance'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                假別額度
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {reportTab === 'summary' && <AttendanceSummary />}
              {reportTab === 'anomaly' && <AnomalyList />}
              {reportTab === 'annual' && <AnnualLeaveCalculator />}
              {reportTab === 'balance' && (
                <div className="space-y-6">
                  {/* 統計卡片 */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <p className="text-sm text-blue-600 font-medium">本月出勤天數</p>
                      <p className="text-3xl font-bold text-blue-700 mt-2">
                        {attendanceRecords.length} 天
                      </p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                      <p className="text-sm text-green-600 font-medium">本月請假次數</p>
                      <p className="text-3xl font-bold text-green-700 mt-2">
                        {leaveRecords.length} 次
                      </p>
                    </div>
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <p className="text-sm text-purple-600 font-medium">剩餘假別時數</p>
                      <p className="text-3xl font-bold text-purple-700 mt-2">
                        {leaveBalances.reduce((sum, b) => sum + parseFloat(b.remaining_hours || 0), 0).toFixed(1)} 小時
                      </p>
                    </div>
                  </div>

                  {/* 假別額度詳細 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold mb-4">假別額度明細</h4>
                    <div className="space-y-3">
                      {leaveBalances.length > 0 ? (
                        leaveBalances.map((balance) => (
                          <div key={balance.id} className="flex justify-between items-center border-b border-gray-100 pb-3">
                            <div>
                              <p className="font-medium">{balance.leave_type_display}</p>
                              <p className="text-sm text-gray-500">
                                總額: {balance.total_hours}h | 已用: {balance.used_hours}h
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-blue-600">{balance.remaining_hours}h</p>
                              <p className="text-xs text-gray-500">剩餘</p>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-gray-500 text-center py-4">無假別額度資料</p>
                      )}
                    </div>
                  </div>

                  {/* 最近請假記錄 */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-lg font-semibold mb-4">最近請假記錄</h4>
                    {leaveRecords.length > 0 ? (
                      <div className="space-y-2">
                        {leaveRecords.slice(0, 5).map((record) => (
                          <div key={record.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                            <div>
                              <p className="font-medium">{record.leave_type_display}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(record.start_time).toLocaleDateString('zh-TW')} - {new Date(record.end_time).toLocaleDateString('zh-TW')}
                              </p>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 rounded text-xs font-medium ${
                                record.status === 'approved' ? 'bg-green-100 text-green-700' :
                                record.status === 'rejected' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {record.status_display}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">{record.leave_hours}h</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">無請假記錄</p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 3：主管功能 Modal */}
      {showManagerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">主管功能</h3>
              <button
                onClick={() => setShowManagerModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-200 px-6">
              <button
                onClick={() => setManagerTab('dashboard')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  managerTab === 'dashboard'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                出勤總覽
              </button>
              <button
                onClick={() => setManagerTab('batch')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  managerTab === 'batch'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                批次審批
              </button>
              <button
                onClick={() => setManagerTab('report')}
                className={`px-4 py-3 font-medium text-sm border-b-2 transition-colors ${
                  managerTab === 'report'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                部門報表
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
              {managerTab === 'dashboard' && <ManagerDashboard />}
              {managerTab === 'batch' && <BatchApproval onSuccess={fetchAttendanceRecords} />}
              {managerTab === 'report' && <DepartmentReport />}
            </div>
          </div>
        </div>
      )}

      {/* Phase 3：HR 管理 Modal */}
      {showHRModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-900">HR 管理</h3>
              <button
                onClick={() => setShowHRModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 100px)' }}>
              <EmployeeManagement />
            </div>
          </div>
        </div>
      )}

      {/* Phase 3：匯出 Modal */}
      {showExportModal && (
        <ExportModal onClose={() => setShowExportModal(false)} />
      )}
    </div>
  );
};

export default App;
