/**
 * ManagerDashboard - 主管儀表板
 * Phase 3 新增
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import managerService from '../../services/managerService';
import Button from '../common/Button';

const ManagerDashboard = ({ onClose }) => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // 取得儀表板資料
  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const response = await managerService.getDashboard(selectedDate);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('取得儀表板失敗:', error);
      toast.error('取得資料失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, [selectedDate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center p-8 text-gray-500">
        無法取得資料
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 日期選擇 */}
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium text-gray-700">查詢日期：</label>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <Button variant="secondary" size="sm" onClick={fetchDashboard}>
          重新整理
        </Button>
      </div>

      {/* 摘要卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-600 font-medium">部門總人數</p>
          <p className="text-3xl font-bold text-blue-700 mt-1">
            {data.summary.total_employees}
          </p>
        </div>
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-600 font-medium">已打卡</p>
          <p className="text-3xl font-bold text-green-700 mt-1">
            {data.summary.checked_in}
          </p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-red-600 font-medium">遲到</p>
          <p className="text-3xl font-bold text-red-700 mt-1">
            {data.summary.late_count}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-orange-600 font-medium">早退</p>
          <p className="text-3xl font-bold text-orange-700 mt-1">
            {data.summary.early_leave_count}
          </p>
        </div>
      </div>

      {/* 待審批 */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">待審批申請</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <span className="text-sm text-yellow-700">請假</span>
            <span className="text-xl font-bold text-yellow-800">
              {data.pending_approvals.leave}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
            <span className="text-sm text-purple-700">加班</span>
            <span className="text-xl font-bold text-purple-800">
              {data.pending_approvals.overtime}
            </span>
          </div>
          <div className="flex items-center justify-between p-3 bg-cyan-50 rounded-lg">
            <span className="text-sm text-cyan-700">補打卡</span>
            <span className="text-xl font-bold text-cyan-800">
              {data.pending_approvals.makeup}
            </span>
          </div>
        </div>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
          <span className="text-gray-600">待審批總數：</span>
          <span className="text-2xl font-bold text-gray-800 ml-2">
            {data.pending_approvals.total}
          </span>
        </div>
      </div>

      {/* 未打卡名單 */}
      {data.not_checked_in_list && data.not_checked_in_list.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 text-red-600">
            未打卡人員 ({data.summary.not_checked_in} 人)
          </h3>
          <div className="flex flex-wrap gap-2">
            {data.not_checked_in_list.map((emp) => (
              <span
                key={emp.employee_id}
                className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-sm"
              >
                {emp.username}
              </span>
            ))}
            {data.summary.not_checked_in > 10 && (
              <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                ... 還有 {data.summary.not_checked_in - 10} 人
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;
