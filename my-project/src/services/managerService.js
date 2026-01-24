/**
 * managerService - 主管功能 API 服務
 * Phase 3 新增
 */
import api from './api';

const managerService = {
  /**
   * 取得主管儀表板資訊
   * 注意：api.get 已透過 interceptor 返回 response.data
   */
  getDashboard: async (date) => {
    const params = date ? { date } : {};
    return await api.get('/manager/dashboard/', { params });
  },

  /**
   * 取得部門出勤報表
   */
  getDepartmentReport: async (year, month) => {
    return await api.get('/manager/reports/department/', {
      params: { year, month }
    });
  },

  /**
   * 批次審批
   */
  batchApprove: async (approvalType, approvalIds, action, comment = '') => {
    return await api.post('/approval/batch/', {
      approval_type: approvalType,
      approval_ids: approvalIds,
      action,
      comment
    });
  },
};

export default managerService;
