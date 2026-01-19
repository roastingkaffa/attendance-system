/**
 * 請假服務 (Leave Service)
 * 處理所有請假相關的 API 呼叫
 * Phase 2 Week 4
 */
import apiClient from './api';

const leaveService = {
  /**
   * 申請請假
   * @param {Object} leaveData - 請假資料
   * @param {number} leaveData.relation_id - 員工-公司關聯 ID
   * @param {string} leaveData.leave_type - 假別 (annual, sick, personal, etc.)
   * @param {string} leaveData.start_time - 請假開始時間 (ISO 8601 格式)
   * @param {string} leaveData.end_time - 請假結束時間 (ISO 8601 格式)
   * @param {number} leaveData.leave_hours - 請假時數
   * @param {string} leaveData.leave_reason - 請假原因
   * @param {string} [leaveData.substitute_employee_id] - 職務代理人 (選填)
   * @param {Array} [leaveData.attachments] - 附件 URL 列表 (選填)
   * @returns {Promise} API 回應
   * @example
   * const result = await leaveService.applyLeave({
   *   relation_id: 1,
   *   leave_type: 'annual',
   *   start_time: '2025-11-25T08:30:00',
   *   end_time: '2025-11-25T17:30:00',
   *   leave_hours: 8.0,
   *   leave_reason: '家庭事務',
   * });
   */
  applyLeave: async (leaveData) => {
    const response = await apiClient.post('/leave/apply/', leaveData);
    return response;
  },

  /**
   * 查詢我的請假記錄
   * @param {Object} params - 查詢參數
   * @param {number} [params.days=30] - 查詢最近 N 天的記錄
   * @param {string} [params.status] - 篩選狀態 (pending, approved, rejected, cancelled)
   * @returns {Promise} API 回應
   * @example
   * // 查詢最近 30 天的記錄
   * const records = await leaveService.getMyLeaveRecords();
   *
   * // 查詢最近 60 天的待審批記錄
   * const pendingRecords = await leaveService.getMyLeaveRecords({
   *   days: 60,
   *   status: 'pending'
   * });
   */
  getMyLeaveRecords: async (params = {}) => {
    const response = await apiClient.get('/leave/my-records/', { params });
    return response;
  },

  /**
   * 查詢我的假別額度
   * @param {Object} params - 查詢參數
   * @param {number} [params.year] - 年度 (預設為當前年度)
   * @returns {Promise} API 回應
   * @example
   * // 查詢當前年度額度
   * const balances = await leaveService.getLeaveBalances();
   *
   * // 查詢 2024 年度額度
   * const balances2024 = await leaveService.getLeaveBalances({ year: 2024 });
   */
  getLeaveBalances: async (params = {}) => {
    const response = await apiClient.get('/leave/balances/', { params });
    return response;
  },

  /**
   * 取消請假申請
   * (注意：此功能需要另外實作後端 API)
   * @param {number} leaveId - 請假記錄 ID
   * @param {string} reason - 取消原因
   * @returns {Promise} API 回應
   */
  cancelLeave: async (leaveId, reason) => {
    const response = await apiClient.post(`/leave/cancel/${leaveId}/`, {
      reason,
    });
    return response;
  },

  /**
   * 查詢單一請假記錄詳情
   * (注意：此功能需要另外實作後端 API)
   * @param {number} leaveId - 請假記錄 ID
   * @returns {Promise} API 回應
   */
  getLeaveDetail: async (leaveId) => {
    const response = await apiClient.get(`/leave/detail/${leaveId}/`);
    return response;
  },
};

export default leaveService;
