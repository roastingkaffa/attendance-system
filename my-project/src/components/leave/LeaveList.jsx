/**
 * LeaveList 元件
 * 我的請假記錄列表
 * Phase 2 Week 4
 */
import React, { useEffect, useState } from 'react';
import leaveService from '../../services/leaveService';
import Loading from '../common/Loading';
import Button from '../common/Button';

const LeaveList = ({ refreshTrigger }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 篩選條件
  const [filter, setFilter] = useState({
    days: 30,
    status: '',
  });

  useEffect(() => {
    fetchRecords();
  }, [filter, refreshTrigger]);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');

      const params = { days: filter.days };
      if (filter.status) {
        params.status = filter.status;
      }

      const response = await leaveService.getMyLeaveRecords(params);

      console.log('📋 LeaveList API 回應:', response);

      // API response interceptor 已經解包，直接訪問 data.records
      if (response.data && response.data.records) {
        setRecords(response.data.records);
      } else if (Array.isArray(response)) {
        // 如果返回的是陣列（相容性處理）
        setRecords(response);
      } else {
        setError('資料格式錯誤');
      }
    } catch (err) {
      setError(err.message || '查詢記錄時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 狀態標籤樣式
  const getStatusBadge = (status, statusDisplay) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200',
      cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
    };

    return (
      <span
        className={`px-3 py-1 text-xs font-medium border rounded-full ${
          styles[status] || styles.pending
        }`}
      >
        {statusDisplay}
      </span>
    );
  };

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

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">我的請假記錄</h2>
            <p className="text-sm text-gray-600 mt-1">查看和管理您的請假申請</p>
          </div>

          {/* 篩選控制 */}
          <div className="flex gap-2">
            <select
              value={filter.days}
              onChange={(e) => setFilter({ ...filter, days: Number(e.target.value) })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value={30}>最近 30 天</option>
              <option value={60}>最近 60 天</option>
              <option value={90}>最近 90 天</option>
              <option value={365}>本年度</option>
            </select>

            <select
              value={filter.status}
              onChange={(e) => setFilter({ ...filter, status: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">全部狀態</option>
              <option value="pending">待審批</option>
              <option value="approved">已批准</option>
              <option value="rejected">已拒絕</option>
              <option value="cancelled">已取消</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {loading ? (
          <Loading />
        ) : error ? (
          <div className="text-center py-8">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={fetchRecords} variant="primary" size="sm">
              重新載入
            </Button>
          </div>
        ) : records.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">尚無請假記錄</p>
          </div>
        ) : (
          <div className="space-y-4">
            {records.map((record) => (
              <div
                key={record.id}
                className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
              >
                {/* 標題列 */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-gray-900">
                      {record.leave_type_display}
                    </span>
                    {getStatusBadge(record.status, record.status_display)}
                  </div>
                  <span className="text-sm text-gray-500">
                    申請時間：{formatDateTime(record.created_at)}
                  </span>
                </div>

                {/* 時間資訊 */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">開始：</span>
                    <span className="text-gray-600">
                      {formatDateTime(record.start_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">結束：</span>
                    <span className="text-gray-600">
                      {formatDateTime(record.end_time)}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-700">時數：</span>
                    <span className="font-bold text-blue-600">
                      {record.leave_hours} 小時
                    </span>
                  </div>
                </div>

                {/* 請假原因 */}
                {record.leave_reason && (
                  <div className="mb-3">
                    <span className="text-sm font-medium text-gray-700">請假原因：</span>
                    <p className="text-sm text-gray-600 mt-1">{record.leave_reason}</p>
                  </div>
                )}

                {/* 職務代理人 */}
                {record.substitute_name && (
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">職務代理人：</span>
                    {record.substitute_name}
                  </div>
                )}

                {/* 審批進度（TODO: 待實作 ApprovalProgress 元件） */}
                {record.status === 'pending' && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <p className="text-sm text-yellow-600">審批中...</p>
                  </div>
                )}

                {/* 拒絕原因（如果有） */}
                {record.status === 'rejected' && record.rejection_reason && (
                  <div className="mt-3 pt-3 border-t border-gray-200">
                    <span className="text-sm font-medium text-red-700">拒絕原因：</span>
                    <p className="text-sm text-red-600 mt-1">{record.rejection_reason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveList;
