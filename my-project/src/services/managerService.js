/**
 * managerService - 主管功能 API 服務
 * Phase 3 新增
 */
import api from './api';

const managerService = {
  /**
   * 取得主管儀表板資訊
   * @param {string} date - 查詢日期（YYYY-MM-DD）
   */
  getDashboard: async (date) => {
    const params = date ? { date } : {};
    const response = await api.get('/manager/dashboard/', { params });
    return response.data;
  },

  /**
   * 取得部門出勤報表
   * @param {number} year - 年份
   * @param {number} month - 月份
   */
  getDepartmentReport: async (year, month) => {
    const response = await api.get('/manager/reports/department/', {
      params: { year, month }
    });
    return response.data;
  },

  /**
   * 批次審批
   * @param {string} approvalType - 審批類型（leave/overtime/makeup）
   * @param {number[]} approvalIds - 審批記錄 ID 陣列
   * @param {string} action - 動作（approve/reject）
   * @param {string} comment - 審批意見
   */
  batchApprove: async (approvalType, approvalIds, action, comment = '') => {
    const response = await api.post('/approval/batch/', {
      approval_type: approvalType,
      approval_ids: approvalIds,
      action,
      comment
    });
    return response.data;
  },
};

export default managerService;
