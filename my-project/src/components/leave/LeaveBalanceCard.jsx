/**
 * LeaveBalanceCard 元件
 * 顯示假別額度卡片
 * Phase 2 Week 4
 */
import React, { useEffect, useState } from 'react';
import leaveService from '../../services/leaveService';
import Loading from '../common/Loading';

const LeaveBalanceCard = ({ year }) => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBalances();
  }, [year]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await leaveService.getLeaveBalances(
        year ? { year } : {}
      );

      if (response.success) {
        setBalances(response.data.balances);
      } else {
        setError(response.message || '查詢額度失敗');
      }
    } catch (err) {
      setError(err.message || '查詢額度時發生錯誤');
    } finally {
      setLoading(false);
    }
  };

  // 計算進度條百分比
  const getProgressPercentage = (used, total) => {
    if (total === 0) return 0;
    return Math.min((used / total) * 100, 100);
  };

  // 根據使用率決定顏色
  const getProgressColor = (percentage) => {
    if (percentage < 50) return 'bg-green-500';
    if (percentage < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-red-600 text-center">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">假別額度</h2>
        <p className="text-sm text-gray-600 mt-1">
          {year || new Date().getFullYear()} 年度
        </p>
      </div>

      <div className="p-6">
        {balances.length === 0 ? (
          <p className="text-gray-500 text-center py-4">尚無假別額度資料</p>
        ) : (
          <div className="space-y-4">
            {balances.map((balance, index) => {
              const usedPercentage = getProgressPercentage(
                balance.used_hours,
                balance.total_hours
              );
              const progressColor = getProgressColor(usedPercentage);

              return (
                <div
                  key={index}
                  className="p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  {/* 假別名稱和時數 */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {balance.leave_type_display}
                    </span>
                    <span className="text-sm text-gray-600">
                      剩餘 <span className="font-bold text-blue-600">
                        {balance.remaining_hours}
                      </span>{' '}
                      / {balance.total_hours} 小時
                    </span>
                  </div>

                  {/* 進度條 */}
                  <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-300 ${progressColor}`}
                      style={{ width: `${usedPercentage}%` }}
                    />
                  </div>

                  {/* 已使用說明 */}
                  <div className="mt-1 text-xs text-gray-500 text-right">
                    已使用 {balance.used_hours} 小時 ({usedPercentage.toFixed(1)}%)
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaveBalanceCard;
