/**
 * 補打卡服務 (Makeup Clock Service)
 * 處理所有補打卡相關的 API 呼叫
 * Phase 1 新增
 */
import apiClient from './api';

const makeupClockService = {
  /**
   * 申請補打卡
   * @param {Object} data - 申請資料
   * @param {string} data.date - 補打卡日期 (YYYY-MM-DD)
   * @param {string} data.makeup_type - 補打卡類型 (checkin/checkout/both)
   * @param {string} data.requested_checkin_time - 申請的上班時間 (ISO format, 選填)
   * @param {string} data.requested_checkout_time - 申請的下班時間 (ISO format, 選填)
   * @param {string} data.reason - 補打卡原因
   * @returns {Promise} API 回應
   */
  apply: async (data) => {
    const response = await apiClient.post('/makeup-clock/apply/', data);
    return response;
  },

  /**
   * 取得我的補打卡申請記錄
   * @param {Object} params - 查詢參數
   * @param {string} params.status - 狀態篩選 (pending/approved/rejected)
   * @param {number} params.days - 查詢天數
   * @returns {Promise} API 回應
   */
  getMyRequests: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `/makeup-clock/my-requests/?${queryString}` : '/makeup-clock/my-requests/';
    const response = await apiClient.get(url);
    return response;
  },

  /**
   * 查詢補打卡額度
   * @returns {Promise} API 回應
   */
  getQuota: async () => {
    const response = await apiClient.get('/makeup-clock/quota/');
    return response;
  },

  /**
   * 取得待審批的補打卡申請（主管用）
   * @returns {Promise} API 回應
   */
  getPendingApprovals: async () => {
    const response = await apiClient.get('/makeup-clock/pending/');
    return response;
  },

  /**
   * 批准補打卡申請（主管用）
   * @param {number} approvalId - 審批記錄 ID
   * @param {string} comment - 審批意見（選填）
   * @returns {Promise} API 回應
   */
  approve: async (approvalId, comment = '') => {
    const response = await apiClient.post(`/makeup-clock/approve/${approvalId}/`, { comment });
    return response;
  },

  /**
   * 拒絕補打卡申請（主管用）
   * @param {number} approvalId - 審批記錄 ID
   * @param {string} comment - 拒絕原因（必填）
   * @returns {Promise} API 回應
   */
  reject: async (approvalId, comment) => {
    const response = await apiClient.post(`/makeup-clock/reject/${approvalId}/`, { comment });
    return response;
  },

  /**
   * 取得我的班表
   * @returns {Promise} API 回應
   */
  getMySchedule: async () => {
    const response = await apiClient.get('/schedule/my-schedule/');
    return response;
  },
};

export default makeupClockService;
