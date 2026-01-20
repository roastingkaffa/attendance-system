/**
 * OvertimeForm 元件
 * 加班申請表單
 * Phase 2
 */
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import overtimeService from '../../services/overtimeService';
import Button from '../common/Button';

const OvertimeForm = ({ onSuccess, onCancel }) => {
  const { relationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 表單資料
  const [formData, setFormData] = useState({
    date: '',
    start_time: '18:00',
    end_time: '21:00',
    reason: '',
    compensation_type: 'compensatory',
  });

  // 加班時數（自動計算）
  const [overtimeHours, setOvertimeHours] = useState(0);

  // 補償方式選項
  const compensationTypes = [
    { value: 'compensatory', label: '補休' },
    { value: 'pay', label: '加班費' },
    { value: 'mixed', label: '混合（補休+加班費）' },
  ];

  // 計算加班時數
  useEffect(() => {
    if (formData.start_time && formData.end_time) {
      const [startH, startM] = formData.start_time.split(':').map(Number);
      const [endH, endM] = formData.end_time.split(':').map(Number);

      let startMinutes = startH * 60 + startM;
      let endMinutes = endH * 60 + endM;

      // 處理跨夜情況
      if (endMinutes < startMinutes) {
        endMinutes += 24 * 60;
      }

      const diffHours = (endMinutes - startMinutes) / 60;
      setOvertimeHours(Math.max(diffHours, 0).toFixed(2));
    } else {
      setOvertimeHours(0);
    }
  }, [formData.start_time, formData.end_time]);

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

    // 驗證 relationId
    if (!relationId) {
      setError('員工資料未載入，請重新登入');
      return;
    }

    // 驗證
    if (!formData.date) {
      setError('請選擇加班日期');
      return;
    }

    if (overtimeHours <= 0) {
      setError('加班時數必須大於 0');
      return;
    }

    if (!formData.reason.trim()) {
      setError('請輸入加班原因');
      return;
    }

    try {
      setLoading(true);

      const requestData = {
        relation_id: parseInt(relationId, 10),
        date: formData.date,
        start_time: formData.start_time,
        end_time: formData.end_time,
        reason: formData.reason,
        compensation_type: formData.compensation_type,
      };

      console.log('提交加班申請:', requestData);

      const response = await overtimeService.applyOvertime(requestData);

      if (response.success) {
        alert('加班申請已送出，等待主管審批');
        // 重置表單
        setFormData({
          date: '',
          start_time: '18:00',
          end_time: '21:00',
          reason: '',
          compensation_type: 'compensatory',
        });
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setError(response.message || '申請失敗');
      }
    } catch (err) {
      console.error('加班申請錯誤:', err);
      setError(err.message || '申請時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">加班申請</h2>
        <p className="text-sm text-gray-600 mt-1">填寫加班資訊並送出申請</p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* 錯誤訊息 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 加班日期 */}
        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-2">
            加班日期
          </label>
          <input
            type="date"
            id="date"
            name="date"
            value={formData.date}
            onChange={handleChange}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={loading}
          />
        </div>

        {/* 加班時間 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="start_time" className="block text-sm font-medium text-gray-700 mb-2">
              開始時間
            </label>
            <input
              type="time"
              id="start_time"
              name="start_time"
              value={formData.start_time}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="end_time" className="block text-sm font-medium text-gray-700 mb-2">
              結束時間
            </label>
            <input
              type="time"
              id="end_time"
              name="end_time"
              value={formData.end_time}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              disabled={loading}
            />
          </div>
        </div>

        {/* 加班時數（自動計算） */}
        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">加班時數</span>
            <span className="text-2xl font-bold text-orange-600">{overtimeHours} 小時</span>
          </div>
        </div>

        {/* 補償方式 */}
        <div>
          <label htmlFor="compensation_type" className="block text-sm font-medium text-gray-700 mb-2">
            補償方式
          </label>
          <select
            id="compensation_type"
            name="compensation_type"
            value={formData.compensation_type}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            disabled={loading}
          >
            {compensationTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            補休：加班時數 1:1 轉為補休時數 | 加班費：依勞基法計算
          </p>
        </div>

        {/* 加班原因 */}
        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-2">
            加班原因
          </label>
          <textarea
            id="reason"
            name="reason"
            value={formData.reason}
            onChange={handleChange}
            required
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder="請輸入加班原因（如：專案趕工、客戶需求等）"
            disabled={loading}
          />
        </div>

        {/* 按鈕 */}
        <div className="flex gap-4">
          <Button type="submit" variant="warning" size="lg" loading={loading} className="flex-1">
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

export default OvertimeForm;
