/**
 * hrService - HR 管理 API 服務
 * Phase 3 新增
 */
import api from './api';

const hrService = {
  // =====================================================
  // 員工管理
  // =====================================================

  /**
   * 取得員工列表
   * 注意：api.get 已透過 interceptor 返回 response.data
   */
  getEmployees: async (params = {}) => {
    return await api.get('/hr/employees/', { params });
  },

  /**
   * 新增員工
   */
  createEmployee: async (data) => {
    return await api.post('/hr/employees/create/', data);
  },

  /**
   * 更新員工資料
   */
  updateEmployee: async (employeeId, data) => {
    return await api.patch(`/hr/employees/${employeeId}/`, data);
  },

  /**
   * 指派主管
   */
  assignManager: async (employeeId, managerId) => {
    return await api.patch(`/hr/employees/${employeeId}/assign-manager/`, {
      manager_id: managerId
    });
  },

  // =====================================================
  // 假別額度管理
  // =====================================================

  /**
   * 批次設定假別額度
   */
  batchSetLeaveBalances: async (employeeIds, year, leaveType, totalHours) => {
    return await api.post('/hr/leave-balances/batch-set/', {
      employee_ids: employeeIds,
      year,
      leave_type: leaveType,
      total_hours: totalHours
    });
  },

  // =====================================================
  // 部門管理
  // =====================================================

  /**
   * 取得部門列表
   */
  getDepartments: async (companyId) => {
    const params = companyId ? { company_id: companyId } : {};
    return await api.get('/hr/departments/', { params });
  },

  /**
   * 建立部門
   */
  createDepartment: async (data) => {
    return await api.post('/hr/departments/create/', data);
  },

  /**
   * 更新部門
   */
  updateDepartment: async (departmentId, data) => {
    return await api.patch(`/hr/departments/${departmentId}/`, data);
  },

  /**
   * 刪除部門
   */
  deleteDepartment: async (departmentId) => {
    return await api.delete(`/hr/departments/${departmentId}/delete/`);
  },
};

export default hrService;
