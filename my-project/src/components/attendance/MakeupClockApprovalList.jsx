/**
 * MakeupClockApprovalList.jsx - 補打卡審批列表（主管用）
 * Phase 1 新增
 */
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import makeupClockService from '../../services/makeupClockService';
import Button from '../common/Button';

const MakeupClockApprovalList = ({ onRefresh }) => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [rejectComment, setRejectComment] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    setLoading(true);
    try {
      const response = await makeupClockService.getPendingApprovals();
      setApprovals(response.data?.approvals || []);
    } catch (error) {
      console.error('載入待審批記錄失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (approvalId) => {
    setProcessing(approvalId);
    try {
      await makeupClockService.approve(approvalId);
      toast.success('已批准補打卡申請');
      fetchPendingApprovals();
      onRefresh?.();
    } catch (error) {
      toast.error(error.message || '操作失敗');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (approvalId) => {
    if (!rejectComment.trim()) {
      toast.error('請填寫拒絕原因');
      return;
    }
    setProcessing(approvalId);
    try {
      await makeupClockService.reject(approvalId, rejectComment);
      toast.success('已拒絕補打卡申請');
      setShowRejectModal(null);
      setRejectComment('');
      fetchPendingApprovals();
      onRefresh?.();
    } catch (error) {
      toast.error(error.message || '操作失敗');
    } finally {
      setProcessing(null);
    }
  };

  const getMakeupTypeLabel = (type) => {
    const types = {
      checkin: '補上班打卡',
      checkout: '補下班打卡',
      both: '補全日打卡',
    };
    return types[type] || type;
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">待審批補打卡申請</h3>
        <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
          {approvals.length} 件待處理
        </span>
      </div>

      {approvals.length > 0 ? (
        <div className="space-y-4">
          {approvals.map((approval) => {
            const request = approval.request_info;
            return (
              <div
                key={approval.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-lg">{request?.applicant}</span>
                      <span className="text-sm text-gray-500">
                        {request?.date}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                        {getMakeupTypeLabel(request?.makeup_type)}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 space-y-1">
                      {request?.requested_checkin_time && (
                        <p>
                          申請上班時間：
                          <span className="font-medium">
                            {new Date(request.requested_checkin_time).toLocaleTimeString('zh-TW', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </p>
                      )}
                      {request?.requested_checkout_time && (
                        <p>
                          申請下班時間：
                          <span className="font-medium">
                            {new Date(request.requested_checkout_time).toLocaleTimeString('zh-TW', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </p>
                      )}
                      <p className="mt-2 p-2 bg-gray-50 rounded">
                        <span className="text-gray-500">原因：</span>
                        {request?.reason}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 ml-4">
                    <Button
                      variant="success"
                      size="sm"
                      onClick={() => handleApprove(approval.id)}
                      disabled={processing === approval.id}
                    >
                      {processing === approval.id ? '處理中...' : '批准'}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => setShowRejectModal(approval.id)}
                      disabled={processing === approval.id}
                    >
                      拒絕
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">目前沒有待審批的補打卡申請</p>
      )}

      {/* 拒絕原因 Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h4 className="text-lg font-semibold mb-4">拒絕補打卡申請</h4>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                拒絕原因 <span className="text-red-500">*</span>
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={3}
                placeholder="請說明拒絕原因..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <Button
                variant="danger"
                className="flex-1"
                onClick={() => handleReject(showRejectModal)}
                disabled={processing}
              >
                {processing ? '處理中...' : '確認拒絕'}
              </Button>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectComment('');
                }}
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MakeupClockApprovalList;
