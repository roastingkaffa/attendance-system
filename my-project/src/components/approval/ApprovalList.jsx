/**
 * ApprovalList 元件
 * 待審批列表
 * Phase 2 Week 4
 */
import React, { useEffect, useState } from 'react';
import approvalService from '../../services/approvalService';
import ApprovalCard from './ApprovalCard';
import Loading from '../common/Loading';
import Button from '../common/Button';

const ApprovalList = ({ refreshTrigger }) => {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchApprovals();
  }, [refreshTrigger]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      setError('');

      const response = await approvalService.getPendingApprovals();

      if (response.success) {
        setApprovals(response.data.approvals);
      } else {
        setError(response.message || '查詢待審批列表失敗');
      }
    } catch (err) {
      setError(err.message || '查詢待審批列表時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 審批完成後重新載入
  const handleApprovalComplete = () => {
    fetchApprovals();
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">待審批申請</h2>
            <p className="text-sm text-gray-600 mt-1">
              您有 <span className="font-bold text-blue-600">{approvals.length}</span> 筆待審批申請
            </p>
          </div>

          {/* 重新整理按鈕 */}
          <Button
            onClick={fetchApprovals}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            重新整理
          </Button>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchApprovals} variant="primary" size="sm">
              重新載入
            </Button>
          </div>
        ) : approvals.length === 0 ? (
          <div className="text-center py-8">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-gray-500 text-lg">目前沒有待審批申請</p>
            <p className="text-gray-400 text-sm mt-2">所有申請都已處理完畢</p>
          </div>
        ) : (
          <div className="space-y-4">
            {approvals.map((approval) => (
              <ApprovalCard
                key={approval.id}
                approval={approval}
                onApprovalComplete={handleApprovalComplete}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ApprovalList;
