/**
 * AnomalyList 元件
 * 出勤異常清單
 * Phase 2
 */
import React, { useState, useEffect } from 'react';
import reportService from '../../services/reportService';
import Button from '../common/Button';

const AnomalyList = () => {
  const [anomalies, setAnomalies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 查詢參數
  const currentDate = new Date();
  const [year, setYear] = useState(currentDate.getFullYear());
  const [month, setMonth] = useState(currentDate.getMonth() + 1);

  // 載入異常清單
  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await reportService.getAnomalyList({ year, month });
      console.log('異常清單 API 回應:', response);
      if (response.success) {
        setAnomalies(response.data?.anomalies || []);
      } else {
        setError(response.message || '取得異常清單失敗');
      }
    } catch (err) {
      console.error('取得異常清單失敗:', err);
      setError(err.message || '取得異常清單失敗');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, [year, month]);

  // 年份選項（前後 2 年）
  const yearOptions = [];
  for (let y = currentDate.getFullYear() - 2; y <= currentDate.getFullYear(); y++) {
    yearOptions.push(y);
  }

  // 月份選項
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  // 異常類型樣式
  const getAnomalyStyle = (type) => {
    const styles = {
      late: { bg: 'bg-red-100', text: 'text-red-700', label: '遲到' },
      early_leave: { bg: 'bg-orange-100', text: 'text-orange-700', label: '早退' },
      missing_checkout: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '未打下班卡' },
      missing_checkin: { bg: 'bg-purple-100', text: 'text-purple-700', label: '未打上班卡' },
    };
    return styles[type] || { bg: 'bg-gray-100', text: 'text-gray-700', label: type };
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-900">出勤異常清單</h2>
            <p className="text-sm text-gray-600 mt-1">查看遲到、早退、缺卡等異常記錄</p>
          </div>
          <div className="flex gap-2">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y} 年
                </option>
              ))}
            </select>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              {monthOptions.map((m) => (
                <option key={m} value={m}>
                  {m} 月
                </option>
              ))}
            </select>
          </div>
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

        {!loading && !error && anomalies.length > 0 && (
          <div className="space-y-4">
            {/* 統計摘要 */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-700">
                  {anomalies.filter((a) => a.type === 'late').length}
                </p>
                <p className="text-sm text-red-600">遲到</p>
              </div>
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-orange-700">
                  {anomalies.filter((a) => a.type === 'early_leave').length}
                </p>
                <p className="text-sm text-orange-600">早退</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700">
                  {anomalies.filter((a) => a.type === 'missing_checkout').length}
                </p>
                <p className="text-sm text-yellow-600">未打下班卡</p>
              </div>
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-purple-700">
                  {anomalies.filter((a) => a.type === 'missing_checkin').length}
                </p>
                <p className="text-sm text-purple-600">未打上班卡</p>
              </div>
            </div>

            {/* 異常列表 */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      日期
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      類型
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      說明
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {anomalies.map((anomaly, index) => {
                    const style = getAnomalyStyle(anomaly.type);
                    return (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                          {anomaly.date}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${style.bg} ${style.text}`}>
                            {style.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {anomaly.description || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && !error && anomalies.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">👍</div>
            <p className="text-gray-500">本月無出勤異常記錄</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnomalyList;
