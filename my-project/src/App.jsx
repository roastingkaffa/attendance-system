/**
 * App.jsx - 主應用程式元件（重構版）
 * 從 744 行重構至 < 200 行
 * 使用 Context API 和元件化設計
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
import './App.css';

const App = () => {
  const { isAuthenticated, userId, relationId, logout, forgotPassword } = useAuth();

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
    }
  }, [isAuthenticated, page, userId]);

  /**
   * 取得 GPS 位置
   */
  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGps({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        () => toast.error('無法取得 GPS 位置，請確認定位權限已開啟')
      );
    } else {
      toast.error('您的瀏覽器不支援定位功能');
    }
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
   * 處理請假申請成功
   */
  const handleLeaveSubmitSuccess = () => {
    setShowLeaveForm(false);
    fetchLeaveRecords();
    fetchLeaveBalances();
    toast.success('請假申請已送出');
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
          <div className="flex gap-4">
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
          <h2 className="text-xl font-semibold mb-4">歡迎，{userId}</h2>
          <p className="text-gray-600">
            GPS 狀態: {gps ? `✅ (${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)})` : '❌ 未取得'}
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Button
            variant="primary"
            size="lg"
            onClick={() => {
              setScanning(true);
              // TODO: 實作打卡功能（使用 QRCamera）
            }}
            className="h-32"
          >
            📷 掃描 QR Code 打卡
          </Button>
          <Button
            variant="success"
            size="lg"
            className="h-32"
            onClick={() => setShowLeaveForm(true)}
          >
            📝 申請請假
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="h-32"
            onClick={() => {
              console.log('🔍 點擊報表按鈕');
              console.log('📊 出勤記錄:', attendanceRecords);
              console.log('📋 請假記錄:', leaveRecords);
              console.log('💰 假別額度:', leaveBalances);
              setShowReportModal(true);
            }}
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
                      <p className="font-medium">{record.date}</p>
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

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6 border-b border-gray-200 pb-4">
              <h3 className="text-2xl font-bold text-gray-900">出勤與請假報表</h3>
              <button
                onClick={() => {
                  console.log('🚪 關閉報表視窗');
                  setShowReportModal(false);
                }}
                className="text-gray-500 hover:text-gray-700 text-3xl font-bold leading-none w-8 h-8 flex items-center justify-center"
              >
                ×
              </button>
            </div>

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

              {/* 最近出勤記錄 */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h4 className="text-lg font-semibold mb-4">最近出勤記錄</h4>
                {attendanceRecords.length > 0 ? (
                  <div className="space-y-2">
                    {attendanceRecords.slice(0, 5).map((record) => (
                      <div key={record.id} className="flex justify-between items-center text-sm border-b border-gray-100 pb-2">
                        <span className="font-medium">{record.date}</span>
                        <span className="text-gray-600">
                          {record.checkin_time ? new Date(record.checkin_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          {' ~ '}
                          {record.checkout_time ? new Date(record.checkout_time).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }) : '-'}
                        </span>
                        <span className="font-medium text-blue-600">{record.work_hours || 0}h</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">無出勤記錄</p>
                )}
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
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
