/**
 * 審批服務 (Approval Service)
 * 處理所有審批相關的 API 呼叫
 * Phase 2 Week 4
 */
import apiClient from './api';

const approvalService = {
  /**
   * 批准請假申請
   * @param {number} approvalId - 審批記錄 ID
   * @param {Object} approvalData - 審批資料
   * @param {string} [approvalData.comment] - 審批意見 (選填)
   * @returns {Promise} API 回應
   * @example
   * const result = await approvalService.approveLeave(123, {
   *   comment: '同意請假'
   * });
   */
  approveLeave: async (approvalId, approvalData = {}) => {
    const response = await apiClient.post(
      `/approval/approve/${approvalId}/`,
      approvalData
    );
    return response;
  },

  /**
   * 拒絕請假申請
   * @param {number} approvalId - 審批記錄 ID
   * @param {Object} approvalData - 審批資料
   * @param {string} approvalData.comment - 拒絕原因 (必填)
   * @returns {Promise} API 回應
   * @example
   * const result = await approvalService.rejectLeave(123, {
   *   comment: '該時段部門人力不足，無法批准'
   * });
   */
  rejectLeave: async (approvalId, approvalData) => {
    const response = await apiClient.post(
      `/approval/reject/${approvalId}/`,
      approvalData
    );
    return response;
  },

  /**
   * 查詢待我審批的申請
   * @returns {Promise} API 回應
   * @example
   * const pendingApprovals = await approvalService.getPendingApprovals();
   */
  getPendingApprovals: async () => {
    const response = await apiClient.get('/approval/pending/');
    return response;
  },

  /**
   * 查詢審批歷史
   * (注意：此功能需要另外實作後端 API)
   * @param {Object} params - 查詢參數
   * @param {number} [params.days=30] - 查詢最近 N 天的記錄
   * @param {string} [params.status] - 篩選狀態 (approved, rejected)
   * @returns {Promise} API 回應
   */
  getApprovalHistory: async (params = {}) => {
    const response = await apiClient.get('/approval/history/', { params });
    return response;
  },

  /**
   * 查詢單一審批記錄詳情
   * (注意：此功能需要另外實作後端 API)
   * @param {number} approvalId - 審批記錄 ID
   * @returns {Promise} API 回應
   */
  getApprovalDetail: async (approvalId) => {
    const response = await apiClient.get(`/approval/detail/${approvalId}/`);
    return response;
  },

  /**
   * 批量審批
   * (注意：此功能需要另外實作後端 API)
   * @param {Array<number>} approvalIds - 審批記錄 ID 列表
   * @param {string} action - 動作 (approve, reject)
   * @param {string} comment - 批註
   * @returns {Promise} API 回應
   */
  batchApproval: async (approvalIds, action, comment) => {
    const response = await apiClient.post('/approval/batch/', {
      approval_ids: approvalIds,
      action,
      comment,
    });
    return response;
  },
};

export default approvalService;
