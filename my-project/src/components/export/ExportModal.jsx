/**
 * ExportModal - 資料匯出對話框
 * Phase 3 新增
 */
import React, { useState } from 'react';
import { toast } from 'sonner';
import exportService from '../../services/exportService';
import Button from '../common/Button';

const ExportModal = ({ onClose }) => {
  const [exportType, setExportType] = useState('attendance');
  const [format, setFormat] = useState('csv');
  const [dateFrom, setDateFrom] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1)
      .toISOString()
      .split('T')[0]
  );
  const [dateTo, setDateTo] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState(false);

  // 執行匯出
  const handleExport = async () => {
    if (!dateFrom || !dateTo) {
      toast.error('請選擇日期範圍');
      return;
    }

    if (new Date(dateFrom) > new Date(dateTo)) {
      toast.error('開始日期不能晚於結束日期');
      return;
    }

    try {
      setLoading(true);

      if (exportType === 'attendance') {
        await exportService.exportAttendance(dateFrom, dateTo, format);
      } else if (exportType === 'leave') {
        await exportService.exportLeave(dateFrom, dateTo, format);
      }

      toast.success('匯出成功');
    } catch (error) {
      console.error('匯出失敗:', error);
      toast.error('匯出失敗，請稍後再試');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h3 className="text-xl font-bold">資料匯出</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* 匯出類型 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              匯出類型
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="attendance"
                  checked={exportType === 'attendance'}
                  onChange={(e) => setExportType(e.target.value)}
                  className="text-blue-600"
                />
                <span>出勤記錄</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="exportType"
                  value="leave"
                  checked={exportType === 'leave'}
                  onChange={(e) => setExportType(e.target.value)}
                  className="text-blue-600"
                />
                <span>請假記錄</span>
              </label>
            </div>
          </div>

          {/* 匯出格式 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              匯出格式
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === 'csv'}
                  onChange={(e) => setFormat(e.target.value)}
                  className="text-blue-600"
                />
                <span>CSV</span>
              </label>
              {exportType === 'attendance' && (
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="format"
                    value="xlsx"
                    checked={format === 'xlsx'}
                    onChange={(e) => setFormat(e.target.value)}
                    className="text-blue-600"
                  />
                  <span>Excel (XLSX)</span>
                </label>
              )}
            </div>
          </div>

          {/* 日期範圍 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                開始日期
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                結束日期
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          {/* 快速選擇 */}
          <div>
            <p className="text-sm text-gray-500 mb-2">快速選擇</p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setDateFrom(
                    new Date(now.getFullYear(), now.getMonth(), 1)
                      .toISOString()
                      .split('T')[0]
                  );
                  setDateTo(now.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                本月
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  const lastMonth = new Date(
                    now.getFullYear(),
                    now.getMonth() - 1,
                    1
                  );
                  const lastMonthEnd = new Date(
                    now.getFullYear(),
                    now.getMonth(),
                    0
                  );
                  setDateFrom(lastMonth.toISOString().split('T')[0]);
                  setDateTo(lastMonthEnd.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                上月
              </button>
              <button
                type="button"
                onClick={() => {
                  const now = new Date();
                  setDateFrom(
                    new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
                  );
                  setDateTo(now.toISOString().split('T')[0]);
                }}
                className="px-3 py-1 text-sm bg-gray-100 hover:bg-gray-200 rounded"
              >
                今年
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={loading}
          >
            {loading ? '匯出中...' : '開始匯出'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;
