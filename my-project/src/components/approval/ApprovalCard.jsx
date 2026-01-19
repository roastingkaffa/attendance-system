/**
 * ApprovalCard 元件
 * 單個審批項目卡片，包含批准/拒絕操作
 * Phase 2 Week 4
 */
import React, { useState } from 'react';
import approvalService from '../../services/approvalService';
import Button from '../common/Button';

const ApprovalCard = ({ approval, onApprovalComplete }) => {
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState('');
  const [approveComment, setApproveComment] = useState('');
  const [error, setError] = useState('');

  // 格式化日期時間
  const formatDateTime = (dateTimeStr) => {
    const date = new Date(dateTimeStr);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 批准請假
  const handleApprove = async () => {
    if (!window.confirm('確定要批准此請假申請嗎？')) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await approvalService.approveLeave(approval.id, {
        comment: approveComment || undefined,
      });

      if (response.success) {
        alert('已批准請假申請');
        if (onApprovalComplete) {
          onApprovalComplete();
        }
      } else {
        setError(response.message || '批准失敗');
      }
    } catch (err) {
      setError(err.message || '批准時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 拒絕請假
  const handleReject = async () => {
    if (!rejectComment.trim()) {
      alert('請輸入拒絕原因');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await approvalService.rejectLeave(approval.id, {
        comment: rejectComment,
      });

      if (response.success) {
        alert('已拒絕請假申請');
        setShowRejectModal(false);
        setRejectComment('');
        if (onApprovalComplete) {
          onApprovalComplete();
        }
      } else {
        setError(response.message || '拒絕失敗');
      }
    } catch (err) {
      setError(err.message || '拒絕時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 審批層級標籤
  const getLevelBadge = (level) => {
    const levels = {
      1: { label: 'L1 主管', color: 'bg-blue-100 text-blue-800 border-blue-200' },
      2: { label: 'L2 HR', color: 'bg-purple-100 text-purple-800 border-purple-200' },
      3: { label: 'L3 總經理', color: 'bg-red-100 text-red-800 border-red-200' },
    };

    const levelInfo = levels[level] || levels[1];

    return (
      <span
        className={`px-2 py-1 text-xs font-medium border rounded-full ${levelInfo.color}`}
      >
        {levelInfo.label}
      </span>
    );
  };

  const { leave_info } = approval;

  return (
    <>
      <div className="p-4 border border-gray-200 rounded-lg hover:shadow-lg transition-shadow bg-white">
        {/* 錯誤訊息 */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 標題列 */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="text-lg font-bold text-gray-900">
              {leave_info.leave_type}
            </span>
            {getLevelBadge(approval.approval_level)}
          </div>
          <span className="text-sm text-gray-500">
            申請時間：{formatDateTime(approval.created_at)}
          </span>
        </div>

        {/* 申請人資訊 */}
        <div className="mb-3 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm">
            <span className="font-medium text-gray-700">申請人：</span>
            <span className="text-gray-900 font-bold">{leave_info.applicant}</span>
          </div>
        </div>

        {/* 時間資訊 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">開始：</span>
            <span className="text-gray-600">
              {formatDateTime(leave_info.start_time)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">結束：</span>
            <span className="text-gray-600">
              {formatDateTime(leave_info.end_time)}
            </span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="font-medium text-gray-700">時數：</span>
            <span className="font-bold text-blue-600">
              {leave_info.leave_hours} 小時
            </span>
          </div>
        </div>

        {/* 審批意見輸入（批准時） */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            審批意見（選填）
          </label>
          <textarea
            value={approveComment}
            onChange={(e) => setApproveComment(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
            placeholder="可輸入審批意見..."
            disabled={loading}
          />
        </div>

        {/* 操作按鈕 */}
        <div className="flex gap-3">
          <Button
            onClick={handleApprove}
            variant="success"
            size="md"
            loading={loading}
            className="flex-1"
          >
            批准
          </Button>
          <Button
            onClick={() => setShowRejectModal(true)}
            variant="danger"
            size="md"
            disabled={loading}
            className="flex-1"
          >
            拒絕
          </Button>
        </div>
      </div>

      {/* 拒絕原因 Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">拒絕請假申請</h3>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                拒絕原因（必填）
              </label>
              <textarea
                value={rejectComment}
                onChange={(e) => setRejectComment(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none resize-none"
                placeholder="請輸入拒絕原因..."
                disabled={loading}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                onClick={handleReject}
                variant="danger"
                size="md"
                loading={loading}
                className="flex-1"
              >
                確認拒絕
              </Button>
              <Button
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectComment('');
                  setError('');
                }}
                variant="secondary"
                size="md"
                disabled={loading}
                className="flex-1"
              >
                取消
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default ApprovalCard;
