/**
 * 報表服務 (Report Service)
 * 處理所有報表相關的 API 呼叫
 * Phase 2
 */
import apiClient from './api';

const reportService = {
  /**
   * 取得出勤摘要報表
   * @param {Object} params - 查詢參數
   * @param {number} params.year - 年度
   * @param {number} params.month - 月份
   * @returns {Promise} API 回應
   */
  getAttendanceSummary: async (params) => {
    const response = await apiClient.get('/reports/attendance-summary/', { params });
    return response;
  },

  /**
   * 取得異常清單
   * @param {Object} params - 查詢參數
   * @param {number} params.year - 年度
   * @param {number} params.month - 月份
   * @returns {Promise} API 回應
   */
  getAnomalyList: async (params) => {
    const response = await apiClient.get('/reports/anomaly-list/', { params });
    return response;
  },

  /**
   * 取得特休資格明細
   * @returns {Promise} API 回應
   */
  getAnnualLeaveEntitlement: async () => {
    const response = await apiClient.get('/leave/annual-entitlement/');
    return response;
  },

  /**
   * 計算並更新特休額度
   * @returns {Promise} API 回應
   */
  calculateAnnualLeave: async () => {
    const response = await apiClient.post('/leave/calculate-annual/');
    return response;
  },
};

export default reportService;
