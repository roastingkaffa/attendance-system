/**
 * 加班服務 (Overtime Service)
 * 處理所有加班相關的 API 呼叫
 * Phase 2
 */
import apiClient from './api';

const overtimeService = {
  /**
   * 申請加班
   * @param {Object} overtimeData - 加班資料
   * @param {number} overtimeData.relation_id - 員工-公司關聯 ID
   * @param {string} overtimeData.date - 加班日期 (YYYY-MM-DD)
   * @param {string} overtimeData.start_time - 開始時間 (HH:MM)
   * @param {string} overtimeData.end_time - 結束時間 (HH:MM)
   * @param {string} overtimeData.reason - 加班原因
   * @param {string} overtimeData.compensation_type - 補償方式 (pay/compensatory/mixed)
   * @returns {Promise} API 回應
   */
  applyOvertime: async (overtimeData) => {
    const response = await apiClient.post('/overtime/apply/', overtimeData);
    return response;
  },

  /**
   * 查詢我的加班記錄
   * @param {Object} params - 查詢參數
   * @param {number} [params.days=30] - 查詢最近 N 天的記錄
   * @param {string} [params.status] - 篩選狀態 (pending, approved, rejected, cancelled)
   * @returns {Promise} API 回應
   */
  getMyOvertimeRecords: async (params = {}) => {
    const response = await apiClient.get('/overtime/my-records/', { params });
    return response;
  },

  /**
   * 取得待審批的加班申請列表（主管用）
   * @returns {Promise} API 回應
   */
  getPendingApprovals: async () => {
    const response = await apiClient.get('/overtime/pending/');
    return response;
  },

  /**
   * 批准加班申請
   * @param {number} approvalId - 審批記錄 ID
   * @param {string} [comment] - 審批備註
   * @returns {Promise} API 回應
   */
  approveOvertime: async (approvalId, comment = '') => {
    const response = await apiClient.post(`/overtime/approve/${approvalId}/`, {
      comment,
    });
    return response;
  },

  /**
   * 拒絕加班申請
   * @param {number} approvalId - 審批記錄 ID
   * @param {string} comment - 拒絕原因
   * @returns {Promise} API 回應
   */
  rejectOvertime: async (approvalId, comment) => {
    const response = await apiClient.post(`/overtime/reject/${approvalId}/`, {
      comment,
    });
    return response;
  },

  /**
   * 取消加班申請
   * @param {number} overtimeId - 加班記錄 ID
   * @returns {Promise} API 回應
   */
  cancelOvertime: async (overtimeId) => {
    const response = await apiClient.post(`/overtime/cancel/${overtimeId}/`);
    return response;
  },
};

export default overtimeService;
