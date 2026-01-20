/**
 * AnnualLeaveCalculator 元件
 * 特休計算器（顯示勞基法特休資格）
 * Phase 2
 */
import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import Button from '../common/Button';

const AnnualLeaveCalculator = () => {
  const [entitlement, setEntitlement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);

  // 載入特休資格
  const fetchEntitlement = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await reportService.getAnnualLeaveEntitlement();
      console.log('特休資格 API 回應:', response);
      if (response.success) {
        setEntitlement(response.data);
      } else {
        setError(response.message || '取得特休資格失敗');
      }
    } catch (err) {
      console.error('取得特休資格失敗:', err);
      setError(err.message || '取得特休資格失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntitlement();
  }, []);

  // 計算並更新特休額度
  const handleCalculate = async () => {
    if (!window.confirm('確定要重新計算特休額度嗎？這將根據您的年資更新特休時數。')) {
      return;
    }

    try {
      setCalculating(true);
      const response = await reportService.calculateAnnualLeave();
      if (response.success) {
        alert('特休額度已更新！');
        fetchEntitlement();
      } else {
        alert(response.message || '計算失敗');
      }
    } catch (err) {
      console.error('計算特休失敗:', err);
      alert(err.message || '計算時發生錯誤');
    } finally {
      setCalculating(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">特休資格</h2>
            <p className="text-sm text-gray-600 mt-1">依勞基法計算的特休天數</p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleCalculate}
            disabled={calculating}
          >
            {calculating ? '計算中...' : '重新計算'}
          </Button>
        </div>
      </div>

      <div className="p-6">
        {loading && (
          <div className="text-center py-8 text-gray-500">載入中...</div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {!loading && !error && entitlement && (
          <div className="space-y-6">
            {/* 年資資訊 */}
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm opacity-80">年資</p>
                  <p className="text-3xl font-bold mt-1">
                    {entitlement.years || 0} 年 {entitlement.months % 12 || 0} 個月
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm opacity-80">特休天數</p>
                  <p className="text-3xl font-bold mt-1">
                    {entitlement.days || 0} 天
                  </p>
                </div>
              </div>
              <p className="text-sm mt-4 opacity-90">
                {entitlement.description}
              </p>
            </div>

            {/* 特休額度 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                <p className="text-sm text-green-600 font-medium">總時數</p>
                <p className="text-2xl font-bold text-green-700 mt-1">
                  {entitlement.hours || 0} h
                </p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <p className="text-sm text-blue-600 font-medium">已使用</p>
                <p className="text-2xl font-bold text-blue-700 mt-1">
                  {entitlement.used_hours || 0} h
                </p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 text-center">
                <p className="text-sm text-purple-600 font-medium">剩餘</p>
                <p className="text-2xl font-bold text-purple-700 mt-1">
                  {entitlement.remaining_hours || 0} h
                </p>
              </div>
            </div>

            {/* 勞基法說明 */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="font-semibold text-gray-700 mb-3">勞基法特休規定</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• 6個月～未滿1年：3天</p>
                <p>• 1年～未滿2年：7天</p>
                <p>• 2年～未滿3年：10天</p>
                <p>• 3年～未滿5年：14天</p>
                <p>• 5年～未滿10年：15天</p>
                <p>• 10年以上：每年加1天，最多30天</p>
              </div>
            </div>

            {/* 入職日期 */}
            {entitlement.hire_date && (
              <div className="text-sm text-gray-500 text-center">
                入職日期：{entitlement.hire_date}
              </div>
            )}
          </div>
        )}

        {!loading && !error && !entitlement && (
          <p className="text-gray-500 text-center py-8">無法取得特休資格資訊</p>
        )}
      </div>
    </div>
  );
};

export default AnnualLeaveCalculator;
