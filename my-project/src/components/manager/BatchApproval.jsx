/**
 * BatchApproval - 批次審批元件
 * Phase 3 新增
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import managerService from '../../services/managerService';
import leaveService from '../../services/leaveService';
import overtimeService from '../../services/overtimeService';
import makeupClockService from '../../services/makeupClockService';
import Button from '../common/Button';

const BatchApproval = ({ onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState('leave');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);

  // 各類型的待審批清單
  const [leaveApprovals, setLeaveApprovals] = useState([]);
  const [overtimeApprovals, setOvertimeApprovals] = useState([]);
  const [makeupApprovals, setMakeupApprovals] = useState([]);

  // 選取狀態
  const [selectedIds, setSelectedIds] = useState([]);
  const [rejectComment, setRejectComment] = useState('');

  // 取得待審批清單
  const fetchApprovals = async () => {
    try {
      setLoading(true);

      const [leaveRes, overtimeRes, makeupRes] = await Promise.all([
        leaveService.getPendingApprovals().catch(() => ({ data: { approvals: [] } })),
        overtimeService.getPendingApprovals().catch(() => ({ data: { approvals: [] } })),
        makeupClockService.getPendingApprovals().catch(() => ({ data: { approvals: [] } })),
      ]);

      setLeaveApprovals(leaveRes.data?.approvals || []);
      setOvertimeApprovals(overtimeRes.data?.approvals || []);
      setMakeupApprovals(makeupRes.data?.approvals || []);
    } catch (error) {
      console.error('取得待審批清單失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // 取得當前 Tab 的清單
  const getCurrentList = () => {
    switch (activeTab) {
      case 'leave':
        return leaveApprovals;
      case 'overtime':
        return overtimeApprovals;
      case 'makeup':
        return makeupApprovals;
      default:
        return [];
    }
  };

  // 切換選取
  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // 全選/取消全選
  const toggleSelectAll = () => {
    const currentList = getCurrentList();
    if (selectedIds.length === currentList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(currentList.map((item) => item.id));
    }
  };

  // 批次審批
  const handleBatchAction = async (action) => {
    if (selectedIds.length === 0) {
      toast.error('請選擇要審批的項目');
      return;
    }

    if (action === 'reject' && !rejectComment.trim()) {
      toast.error('拒絕時請填寫原因');
      return;
    }

    try {
      setProcessing(true);

      const response = await managerService.batchApprove(
        activeTab,
        selectedIds,
        action,
        rejectComment
      );

      if (response.success) {
        toast.success(response.message);
        setSelectedIds([]);
        setRejectComment('');
        fetchApprovals();
        if (onSuccess) onSuccess();
      }
    } catch (error) {
      console.error('批次審批失敗:', error);
      toast.error('審批失敗，請稍後再試');
    } finally {
      setProcessing(false);
    }
  };

  // 切換 Tab
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSelectedIds([]);
    setRejectComment('');
  };

  const currentList = getCurrentList();

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => handleTabChange('leave')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'leave'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          請假 ({leaveApprovals.length})
        </button>
        <button
          onClick={() => handleTabChange('overtime')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'overtime'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          加班 ({overtimeApprovals.length})
        </button>
        <button
          onClick={() => handleTabChange('makeup')}
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            activeTab === 'makeup'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          補打卡 ({makeupApprovals.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : currentList.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          沒有待審批的項目
        </div>
      ) : (
        <>
          {/* 工具列 */}
          <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={selectedIds.length === currentList.length && currentList.length > 0}
                onChange={toggleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm text-gray-600">
                全選 ({selectedIds.length}/{currentList.length})
              </span>
            </label>
            <div className="flex items-center gap-2">
              <Button
                variant="success"
                size="sm"
                onClick={() => handleBatchAction('approve')}
                disabled={processing || selectedIds.length === 0}
              >
                批次核准
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleBatchAction('reject')}
                disabled={processing || selectedIds.length === 0}
              >
                批次拒絕
              </Button>
            </div>
          </div>

          {/* 拒絕原因輸入 */}
          <div>
            <input
              type="text"
              value={rejectComment}
              onChange={(e) => setRejectComment(e.target.value)}
              placeholder="拒絕原因（拒絕時必填）"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {/* 清單 */}
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {currentList.map((item) => (
              <div
                key={item.id}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  selectedIds.includes(item.id)
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:bg-gray-50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(item.id)}
                  onChange={() => toggleSelect(item.id)}
                  className="rounded border-gray-300"
                />
                <div className="flex-1 min-w-0">
                  {activeTab === 'leave' && item.leave_info && (
                    <>
                      <p className="font-medium truncate">
                        {item.leave_info.applicant} - {item.leave_info.leave_type}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Date(item.leave_info.start_time).toLocaleDateString('zh-TW')} ~{' '}
                        {new Date(item.leave_info.end_time).toLocaleDateString('zh-TW')}
                        （{item.leave_info.leave_hours}h）
                      </p>
                    </>
                  )}
                  {activeTab === 'overtime' && item.overtime_info && (
                    <>
                      <p className="font-medium truncate">
                        {item.overtime_info.applicant} - {item.overtime_info.date}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.overtime_info.start_time} ~ {item.overtime_info.end_time}
                        （{item.overtime_info.overtime_hours}h）
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.overtime_info.reason}
                      </p>
                    </>
                  )}
                  {activeTab === 'makeup' && item.request_info && (
                    <>
                      <p className="font-medium truncate">
                        {item.request_info.applicant} - {item.request_info.date}
                      </p>
                      <p className="text-sm text-gray-600">
                        {item.request_info.makeup_type}
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {item.request_info.reason}
                      </p>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default BatchApproval;
