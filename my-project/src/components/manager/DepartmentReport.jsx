/**
 * DepartmentReport - 部門出勤報表
 * Phase 3 新增
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import managerService from '../../services/managerService';
import Button from '../common/Button';

const DepartmentReport = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);

  // 取得報表資料
  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await managerService.getDepartmentReport(year, month);
      if (response.success) {
        setData(response.data);
      }
    } catch (error) {
      console.error('取得報表失敗:', error);
      toast.error('取得報表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [year, month]);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 篩選器 */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">年份：</label>
          <select
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {[2024, 2025, 2026].map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700">月份：</label>
          <select
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
          >
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>{m} 月</option>
            ))}
          </select>
        </div>
        <Button variant="secondary" size="sm" onClick={fetchReport}>
          查詢
        </Button>
      </div>

      {/* 期間資訊 */}
      {data && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-700">
            查詢期間：{data.period.start_date} ~ {data.period.end_date}
            （共 {data.employee_count} 位員工）
          </p>
        </div>
      )}

      {/* 報表表格 */}
      {data && data.employees && (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    員工
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    部門
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    出勤天數
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    遲到
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    早退
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    工時
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    請假
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    加班
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.employees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div>
                        <p className="font-medium text-gray-900">{emp.username}</p>
                        <p className="text-xs text-gray-500">{emp.employee_id}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                      {emp.department || '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {emp.attendance.total_days}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {emp.attendance.late_count > 0 ? (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                          {emp.attendance.late_count} 次
                          <span className="block text-[10px]">
                            ({emp.attendance.late_minutes_total} 分)
                          </span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      {emp.attendance.early_leave_count > 0 ? (
                        <span className="px-2 py-1 text-xs bg-orange-100 text-orange-700 rounded">
                          {emp.attendance.early_leave_count} 次
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {emp.attendance.total_work_hours} h
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {emp.leave_hours > 0 ? (
                        <span className="text-blue-600">{emp.leave_hours} h</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-sm">
                      {emp.overtime_hours > 0 ? (
                        <span className="text-purple-600">{emp.overtime_hours} h</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 空狀態 */}
      {data && data.employees && data.employees.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          沒有找到員工資料
        </div>
      )}
    </div>
  );
};

export default DepartmentReport;
