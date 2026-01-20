/**
 * AttendanceSummary 元件
 * 出勤摘要報表
 * Phase 2
 */
import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import Button from '../common/Button';

const AttendanceSummary = () => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 查詢參數
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  // 載入報表
  const fetchSummary = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await reportService.getAttendanceSummary({ year, month });
      console.log('出勤摘要 API 回應:', response);
      if (response.success) {
        setSummary(response.data);
      } else {
        setError(response.message || '取得報表失敗');
      }
    } catch (err) {
      console.error('取得出勤摘要失敗:', err);
      setError(err.message || '取得報表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [year, month]);

  // 年份選項（前後 2 年）
  const yearOptions = [];
  for (let y = currentDate.getFullYear() - 2; y <= currentDate.getFullYear(); y++) {
    yearOptions.push(y);
  }

  // 月份選項
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">出勤摘要報表</h2>
            <p className="text-sm text-gray-600 mt-1">查看個人出勤統計</p>
          </div>
          <div className="flex gap-2">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y} 年
                </option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m} 月
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="text-center py-8 text-gray-500">載入中...</div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && summary && (
          <div className="space-y-6">
            {/* 統計卡片 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-600 font-medium">出勤天數</p>
                <p className="text-3xl font-bold text-blue-700 mt-2">
                  {summary.attendance_days || 0} 天
                </p>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-600 font-medium">工作時數</p>
                <p className="text-3xl font-bold text-green-700 mt-2">
                  {summary.total_work_hours || 0} h
                </p>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-sm text-red-600 font-medium">遲到次數</p>
                <p className="text-3xl font-bold text-red-700 mt-2">
                  {summary.late_count || 0} 次
                </p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                <p className="text-sm text-orange-600 font-medium">早退次數</p>
                <p className="text-3xl font-bold text-orange-700 mt-2">
                  {summary.early_leave_count || 0} 次
                </p>
              </div>
            </div>

            {/* 請假統計 */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <p className="text-sm text-purple-600 font-medium">請假次數</p>
                <p className="text-3xl font-bold text-purple-700 mt-2">
                  {summary.leave_count || 0} 次
                </p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-600 font-medium">請假時數</p>
                <p className="text-3xl font-bold text-yellow-700 mt-2">
                  {summary.leave_hours || 0} h
                </p>
              </div>
              <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                <p className="text-sm text-indigo-600 font-medium">加班時數</p>
                <p className="text-3xl font-bold text-indigo-700 mt-2">
                  {summary.overtime_hours || 0} h
                </p>
              </div>
            </div>

            {/* 異常明細 */}
            {summary.anomalies && summary.anomalies.length > 0 && (
              <div className="border border-gray-200 rounded-lg p-4">
                <h4 className="text-lg font-semibold mb-4">本月異常記錄</h4>
                <div className="space-y-2">
                  {summary.anomalies.map((anomaly, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center text-sm border-b border-gray-100 pb-2"
                    >
                      <span className="font-medium">{anomaly.date}</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        anomaly.type === 'late' ? 'bg-red-100 text-red-700' :
                        anomaly.type === 'early_leave' ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {anomaly.description}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && !error && !summary && (
          <p className="text-gray-500 text-center py-8">無出勤資料</p>
        )}
      </div>
    </div>
  );
};

export default AttendanceSummary;
