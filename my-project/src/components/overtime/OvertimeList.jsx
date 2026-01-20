/**
 * OvertimeList 元件
 * 顯示加班記錄列表
 * Phase 2
 */
import React, { useState, useEffect } from 'react';
import overtimeService from '../../services/overtimeService';
import Button from '../common/Button';

const OvertimeList = ({ onRefresh }) => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 載入加班記錄
  const fetchRecords = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await overtimeService.getMyOvertimeRecords({ days: 60 });
      console.log('加班記錄 API 回應:', response);
      setRecords(response.data?.records || []);
    } catch (err) {
      console.error('取得加班記錄失敗:', err);
      setError('取得加班記錄失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  // 取消加班申請
  const handleCancel = async (overtimeId) => {
    if (!window.confirm('確定要取消此加班申請嗎？')) return;

    try {
      const response = await overtimeService.cancelOvertime(overtimeId);
      if (response.success) {
        alert('已取消加班申請');
        fetchRecords();
        if (onRefresh) onRefresh();
      } else {
        alert(response.message || '取消失敗');
      }
    } catch (err) {
      console.error('取消加班申請失敗:', err);
      alert(err.message || '取消時發生錯誤');
    }
  };

  // 狀態標籤樣式
  const getStatusStyle = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-700',
      approved: 'bg-green-100 text-green-700',
      rejected: 'bg-red-100 text-red-700',
      cancelled: 'bg-gray-100 text-gray-700',
    };
    return styles[status] || 'bg-gray-100 text-gray-700';
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
        <h3 className="text-lg font-semibold mb-4">我的加班記錄</h3>
        <div className="text-center py-8 text-gray-500">載入中...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">我的加班記錄</h3>
        <Button variant="outline" size="sm" onClick={fetchRecords}>
          重新整理
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {records.length > 0 ? (
        <div className="space-y-4">
          {records.map((record) => (
            <div
              key={record.id}
              className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50"
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium text-gray-900">{record.date}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusStyle(record.status)}`}>
                      {record.status_display}
                    </span>
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded text-xs">
                      {getCompensationLabel(record.compensation_type)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">
                    {record.start_time} - {record.end_time}
                    <span className="ml-2 font-medium text-orange-600">
                      ({record.overtime_hours} 小時)
                    </span>
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{record.reason}</p>
                </div>
                {record.status === 'pending' && (
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleCancel(record.id)}
                  >
                    取消
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 text-center py-8">無加班記錄</p>
      )}
    </div>
  );
};

export default OvertimeList;
