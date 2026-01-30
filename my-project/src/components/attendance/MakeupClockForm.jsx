/**
 * MakeupClockForm.jsx - 補打卡申請表單
 * Phase 1 新增
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import makeupClockService from '../../services/makeupClockService';
import Button from '../common/Button';

const MakeupClockForm = ({ relationId, onSuccess, onCancel, attendanceRecords = [] }) => {
  const [formData, setFormData] = useState({
    date: '',
    makeup_type: 'checkin',
    requested_checkin_time: '',
    requested_checkout_time: '',
    reason: '',
  });
  const [quota, setQuota] = useState(null);
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState(null);

  // 載入額度和班表資訊
  useEffect(() => {
    fetchQuotaAndSchedule();
  }, []);

  // 當日期改變時，查找對應的出勤記錄
  useEffect(() => {
    if (formData.date && attendanceRecords.length > 0) {
      const record = attendanceRecords.find((r) => r.date === formData.date);
      setSelectedRecord(record || null);
    } else {
      setSelectedRecord(null);
    }
  }, [formData.date, attendanceRecords]);

  const fetchQuotaAndSchedule = async () => {
    try {
      const [quotaRes, scheduleRes] = await Promise.all([
        makeupClockService.getQuota(),
        makeupClockService.getMySchedule(),
      ]);
      setQuota(quotaRes.data);
      setSchedule(scheduleRes.data?.schedule);
    } catch (error) {
      console.error('載入額度/班表失敗:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // 計算可選日期範圍（7 天內）
  const getMinDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date.toISOString().split('T')[0];
  };

  const getMaxDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 1); // 不能補今天
    return date.toISOString().split('T')[0];
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 驗證
    if (!formData.date) {
      toast.error('請選擇補打卡日期');
      return;
    }
    if (!formData.reason.trim()) {
      toast.error('請填寫補打卡原因');
      return;
    }
    if (quota && quota.remaining_count <= 0) {
      toast.error('補打卡額度已用完');
      return;
    }

    // 根據類型驗證時間
    if (formData.makeup_type === 'checkin' || formData.makeup_type === 'both') {
      if (!formData.requested_checkin_time) {
        toast.error('請填寫上班打卡時間');
        return;
      }
    }
    if (formData.makeup_type === 'checkout' || formData.makeup_type === 'both') {
      if (!formData.requested_checkout_time) {
        toast.error('請填寫下班打卡時間');
        return;
      }
    }

    // 驗證 relationId
    if (!relationId) {
      toast.error('無法取得員工資料，請重新登入');
      return;
    }

    setLoading(true);
    try {
      // 組合日期和時間為 ISO 格式
      const data = {
        relation_id: parseInt(relationId, 10),
        date: formData.date,
        makeup_type: formData.makeup_type,
        reason: formData.reason,
      };

      // 後端期望 HH:MM 格式，不需要加日期
      if (formData.requested_checkin_time) {
        data.requested_checkin_time = formData.requested_checkin_time;
      }
      if (formData.requested_checkout_time) {
        data.requested_checkout_time = formData.requested_checkout_time;
      }

      await makeupClockService.apply(data);
      toast.success('補打卡申請已送出，等待主管審批');
      onSuccess?.();
    } catch (error) {
      toast.error(error.message || '申請失敗');
    } finally {
      setLoading(false);
    }
  };

  const makeupTypeOptions = [
    { value: 'checkin', label: '補上班打卡' },
    { value: 'checkout', label: '補下班打卡' },
    { value: 'both', label: '補全日打卡' },
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 額度提示 */}
      {quota && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex justify-between items-center">
            <span className="text-blue-700 font-medium">今年剩餘補打卡額度</span>
            <span className="text-2xl font-bold text-blue-600">
              {quota.remaining_count} / {quota.total_count} 次
            </span>
          </div>
          {quota.remaining_count <= 3 && (
            <p className="text-sm text-orange-600 mt-2">
              額度即將用完，請謹慎使用
            </p>
          )}
        </div>
      )}

      {/* 班表資訊 */}
      {schedule && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">
            您的班表：{schedule.name} ({schedule.work_start_time} - {schedule.work_end_time})
          </p>
        </div>
      )}

      {/* 日期選擇 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          補打卡日期 <span className="text-red-500">*</span>
        </label>
        <input
          type="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          min={getMinDate()}
          max={getMaxDate()}
          required
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <p className="text-sm text-gray-500 mt-1">
          只能申請 7 天內的補打卡
        </p>
      </div>

      {/* 當日打卡記錄 */}
      {selectedRecord && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="font-medium text-yellow-800 mb-2">當日已有打卡記錄：</p>
          <div className="text-sm text-yellow-700">
            <p>上班：{selectedRecord.checkin_time ? new Date(selectedRecord.checkin_time).toLocaleTimeString('zh-TW') : '未打卡'}</p>
            <p>下班：{selectedRecord.checkout_time ? new Date(selectedRecord.checkout_time).toLocaleTimeString('zh-TW') : '未打卡'}</p>
          </div>
        </div>
      )}

      {/* 補打卡類型 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          補打卡類型 <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-3 gap-3">
          {makeupTypeOptions.map((option) => (
            <label
              key={option.value}
              className={`flex items-center justify-center px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                formData.makeup_type === option.value
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name="makeup_type"
                value={option.value}
                checked={formData.makeup_type === option.value}
                onChange={handleChange}
                className="sr-only"
              />
              {option.label}
            </label>
          ))}
        </div>
      </div>

      {/* 上班時間 */}
      {(formData.makeup_type === 'checkin' || formData.makeup_type === 'both') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            上班打卡時間 <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            name="requested_checkin_time"
            value={formData.requested_checkin_time}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      )}

      {/* 下班時間 */}
      {(formData.makeup_type === 'checkout' || formData.makeup_type === 'both') && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            下班打卡時間 <span className="text-red-500">*</span>
          </label>
          <input
            type="time"
            name="requested_checkout_time"
            value={formData.requested_checkout_time}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
      )}

      {/* 原因 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          補打卡原因 <span className="text-red-500">*</span>
        </label>
        <textarea
          name="reason"
          value={formData.reason}
          onChange={handleChange}
          rows={3}
          required
          placeholder="請詳細說明未能正常打卡的原因..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
        />
      </div>

      {/* 送出按鈕 */}
      <div className="flex gap-4 pt-4">
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="flex-1"
          disabled={loading || (quota && quota.remaining_count <= 0)}
        >
          {loading ? '送出中...' : '送出申請'}
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="lg"
          onClick={onCancel}
          className="flex-1"
        >
          取消
        </Button>
      </div>
    </form>
  );
};

export default MakeupClockForm;
