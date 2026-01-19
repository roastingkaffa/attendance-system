/**
 * LeaveForm 元件
 * 請假申請表單
 * Phase 2 Week 4
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import leaveService from '../../services/leaveService';
import Button from '../common/Button';

const LeaveForm = ({ onSuccess, onCancel }) => {
  const { relationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 表單資料
  const [formData, setFormData] = useState({
    leave_type: 'annual',
    start_date: '',
    start_time: '08:30',
    end_date: '',
    end_time: '17:30',
    leave_reason: '',
    substitute_employee_id: '',
  });

  // 請假時數（自動計算）
  const [leaveHours, setLeaveHours] = useState(0);

  // 假別選項
  const leaveTypes = [
    { value: 'annual', label: '特休假' },
    { value: 'sick', label: '病假' },
    { value: 'personal', label: '事假' },
    { value: 'marriage', label: '婚假' },
    { value: 'bereavement', label: '喪假' },
    { value: 'maternity', label: '產假' },
    { value: 'paternity', label: '陪產假' },
    { value: 'compensatory', label: '補休' },
  ];

  // 計算請假時數
  useEffect(() => {
    if (formData.start_date && formData.end_date && formData.start_time && formData.end_time) {
      const start = new Date(`${formData.start_date}T${formData.start_time}`);
      const end = new Date(`${formData.end_date}T${formData.end_time}`);

      if (end > start) {
        const diffMs = end - start;
        const diffHours = diffMs / (1000 * 60 * 60);

        // 扣除午休時間（每天 1 小時）
        const days = Math.floor(diffHours / 24);
        const remainingHours = diffHours % 24;
        const lunchBreaks = days + (remainingHours > 4 ? 1 : 0);

        const totalHours = Math.max(diffHours - lunchBreaks, 0);
        setLeaveHours(Number(totalHours.toFixed(2)));
      } else {
        setLeaveHours(0);
      }
    } else {
      setLeaveHours(0);
    }
  }, [formData.start_date, formData.start_time, formData.end_date, formData.end_time]);

  // 處理輸入變更
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // ✅ 驗證 relationId
    if (!relationId) {
      setError('員工資料未載入，請重新登入');
      console.error('❌ relationId 為空:', relationId);
      return;
    }

    // 驗證
    if (!formData.start_date || !formData.end_date) {
      setError('請選擇請假日期');
      return;
    }

    if (leaveHours <= 0) {
      setError('請假時數必須大於 0');
      return;
    }

    if (!formData.leave_reason.trim()) {
      setError('請輸入請假原因');
      return;
    }

    try {
      setLoading(true);

      // 組合 ISO 8601 格式的日期時間
      const start_time = `${formData.start_date}T${formData.start_time}:00`;
      const end_time = `${formData.end_date}T${formData.end_time}:00`;

      const requestData = {
        relation_id: parseInt(relationId, 10), // ✅ 確保為數字
        leave_type: formData.leave_type,
        start_time,
        end_time,
        leave_hours: leaveHours,
        leave_reason: formData.leave_reason,
      };

      // 職務代理人（選填）
      if (formData.substitute_employee_id) {
        requestData.substitute_employee_id = formData.substitute_employee_id;
      }

      // 🐛 Debug: 顯示請求資料
      console.log('📤 提交請假申請:', requestData);

      const response = await leaveService.applyLeave(requestData);

      if (response.success) {
        alert('請假申請已送出，等待主管審批');
        // 重置表單
        setFormData({
          leave_type: 'annual',
          start_date: '',
          start_time: '08:30',
          end_date: '',
          end_time: '17:30',
          leave_reason: '',
          substitute_employee_id: '',
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(response.message || '申請失敗');
      }
    } catch (err) {
      console.error('❌ 請假申請錯誤:', err);

      // 更詳細的錯誤訊息
      let errorMessage = '申請時發生錯誤';

      if (err.code === 'MISSING_PARAMETERS') {
        errorMessage = '資料不完整，請檢查所有必填欄位';
      } else if (err.code === 'INSUFFICIENT_BALANCE') {
        errorMessage = err.message;
        if (err.details) {
          errorMessage += `（剩餘 ${err.details.remaining_hours} 小時）`;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">請假申請</h2>
        <p className="text-sm text-gray-600 mt-1">填寫請假資訊並送出申請</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 錯誤訊息 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 假別選擇 */}
        <div>
          <label htmlFor="leave_type" className="block text-sm font-medium text-gray-700 mb-2">
            假別
          </label>
          <select
            id="leave_type"
            name="leave_type"
            value={formData.leave_type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={loading}
          >
            {leaveTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* 請假時間 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 開始日期時間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">開始時間</label>
            <div className="flex gap-2">
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={loading}
              />
              <input
                type="time"
                name="start_time"
                value={formData.start_time}
                onChange={handleChange}
                required
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={loading}
              />
            </div>
          </div>

          {/* 結束日期時間 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">結束時間</label>
            <div className="flex gap-2">
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={loading}
              />
              <input
                type="time"
                name="end_time"
                value={formData.end_time}
                onChange={handleChange}
                required
                className="w-32 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* 請假時數（自動計算） */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">請假時數</span>
            <span className="text-2xl font-bold text-blue-600">{leaveHours} 小時</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">已扣除午休時間</p>
        </div>

        {/* 請假原因 */}
        <div>
          <label htmlFor="leave_reason" className="block text-sm font-medium text-gray-700 mb-2">
            請假原因
          </label>
          <textarea
            id="leave_reason"
            name="leave_reason"
            value={formData.leave_reason}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder="請輸入請假原因"
            disabled={loading}
          />
        </div>

        {/* 職務代理人（選填） */}
        <div>
          <label htmlFor="substitute_employee_id" className="block text-sm font-medium text-gray-700 mb-2">
            職務代理人（選填）
          </label>
          <input
            type="text"
            id="substitute_employee_id"
            name="substitute_employee_id"
            value={formData.substitute_employee_id}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            placeholder="請輸入代理人員工編號"
            disabled={loading}
          />
        </div>

        {/* 按鈕 */}
        <div className="flex gap-4">
          <Button type="submit" variant="primary" size="lg" loading={loading} className="flex-1">
            提交申請
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              取消
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default LeaveForm;
