/**
 * MakeupClockList.jsx - 補打卡申請記錄列表
 * Phase 1 新增
 */
import React, { useState, useEffect } from 'react';
import makeupClockService from '../../services/makeupClockService';

const MakeupClockList = ({ onRefresh }) => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const response = await makeupClockService.getMyRequests();
      setRequests(response.data?.requests || []);
    } catch (error) {
      console.error('載入補打卡記錄失敗:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '待審批' },
      approved: { bg: 'bg-green-100', text: 'text-green-700', label: '已批准' },
      rejected: { bg: 'bg-red-100', text: 'text-red-700', label: '已拒絕' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    );
  };

  const getMakeupTypeLabel = (type) => {
    const types = {
      checkin: '補上班打卡',
      checkout: '補下班打卡',
      both: '補全日打卡',
    };
    return types[type] || type;
  };

  const filteredRequests = filter === 'all'
    ? requests
    : requests.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">我的補打卡申請</h3>
        <div className="flex gap-2">
          {['all', 'pending', 'approved', 'rejected'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1 rounded text-sm ${
                filter === status
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {status === 'all' ? '全部' :
               status === 'pending' ? '待審批' :
               status === 'approved' ? '已批准' : '已拒絕'}
            </button>
          ))}
        </div>
      </div>

      {filteredRequests.length > 0 ? (
        <div className="space-y-4">
          {filteredRequests.map((request) => (
            <div
              key={request.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium">{request.date}</span>
                    <span className="text-sm text-gray-500">
                      {getMakeupTypeLabel(request.makeup_type)}
                    </span>
                    {getStatusBadge(request.status)}
                  </div>
                  <div className="text-sm text-gray-600 space-y-1">
                    {request.requested_checkin_time && (
                      <p>
                        申請上班時間：
                        {new Date(request.requested_checkin_time).toLocaleTimeString('zh-TW', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                    {request.requested_checkout_time && (
                      <p>
                        申請下班時間：
                        {new Date(request.requested_checkout_time).toLocaleTimeString('zh-TW', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    )}
                    <p className="text-gray-500">原因：{request.reason}</p>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>申請時間</p>
                  <p>{new Date(request.created_at).toLocaleDateString('zh-TW')}</p>
                </div>
              </div>
              {request.status === 'rejected' && request.approvals?.[0]?.comment && (
                <div className="mt-3 p-3 bg-red-50 rounded-lg">
                  <p className="text-sm text-red-700">
                    拒絕原因：{request.approvals[0].comment}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">無補打卡申請記錄</p>
      )}
    </div>
  );
};

export default MakeupClockList;
