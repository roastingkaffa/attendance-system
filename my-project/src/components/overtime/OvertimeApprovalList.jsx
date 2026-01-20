/**
 * OvertimeApprovalList 元件
 * 加班審批列表（主管用）
 * Phase 2
 */
import React, { useState, useEffect } from 'react';
import overtimeService from '../../services/overtimeService';
import Button from '../common/Button';

const OvertimeApprovalList = ({ onRefresh }) => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [processingId, setProcessingId] = useState(null);

  // 載入待審批列表
  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await overtimeService.getPendingApprovals();
      console.log('待審批加班列表 API 回應:', response);
      setApprovals(response.data?.approvals || []);
    } catch (err) {
      console.error('取得待審批列表失敗:', err);
      setError('取得待審批列表失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // 批准
  const handleApprove = async (approvalId) => {
    if (!window.confirm('確定要批准此加班申請嗎？')) return;

    try {
      setProcessingId(approvalId);
      const response = await overtimeService.approveOvertime(approvalId, '');
      if (response.success) {
        alert('已批准加班申請');
        fetchApprovals();
        if (onRefresh) onRefresh();
      } else {
        alert(response.message || '審批失敗');
      }
    } catch (err) {
      console.error('批准失敗:', err);
      alert(err.message || '審批時發生錯誤');
    } finally {
      setProcessingId(null);
    }
  };

  // 拒絕
  const handleReject = async (approvalId) => {
    const comment = window.prompt('請輸入拒絕原因：');
    if (comment === null) return; // 取消
    if (!comment.trim()) {
      alert('請輸入拒絕原因');
      return;
    }

    try {
      setProcessingId(approvalId);
      const response = await overtimeService.rejectOvertime(approvalId, comment);
      if (response.success) {
        alert('已拒絕加班申請');
        fetchApprovals();
        if (onRefresh) onRefresh();
      } else {
        alert(response.message || '審批失敗');
      }
    } catch (err) {
      console.error('拒絕失敗:', err);
      alert(err.message || '審批時發生錯誤');
    } finally {
      setProcessingId(null);
    }
  };

  // 補償方式顯示
  const getCompensationLabel = (type) => {
    const labels = {
      pay: '加班費',
      compensatory: '補休',
      mixed: '混合',
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">待審批加班申請</h3>
        <div className="text-center py-8 text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">待審批加班申請</h3>
        <Button variant="outline" size="sm" onClick={fetchApprovals}>
          重新整理
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {approvals.length > 0 ? (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.id}
              className="border border-orange-200 rounded-lg p-4 bg-orange-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">
                      {approval.overtime_info?.applicant || '未知'}
                    </span>
                    <span className="text-gray-500">申請加班</span>
                  </div>
                  <p className="text-sm text-gray-700">
                    日期：{approval.overtime_info?.date}
                  </p>
                  <p className="text-sm text-gray-700">
                    時間：{approval.overtime_info?.start_time} - {approval.overtime_info?.end_time}
                    <span className="ml-2 font-medium text-orange-600">
                      ({approval.overtime_info?.overtime_hours} 小時)
                    </span>
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    補償方式：{getCompensationLabel(approval.overtime_info?.compensation_type)}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    原因：{approval.overtime_info?.reason}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="success"
                    size="sm"
                    onClick={() => handleApprove(approval.id)}
                    disabled={processingId === approval.id}
                  >
                    批准
                  </Button>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleReject(approval.id)}
                    disabled={processingId === approval.id}
                  >
                    拒絕
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">目前沒有待審批的加班申請</p>
      )}
    </div>
  );
};

export default OvertimeApprovalList;
