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
   * @param {Object} params - 查詢參數
   * @param {number} params.page - 頁碼
   * @param {number} params.page_size - 每頁筆數
   * @param {string} params.search - 搜尋（員工編號、姓名）
   * @param {number} params.department - 部門 ID
   * @param {string} params.role - 角色
   * @param {boolean} params.is_active - 是否在職
   */
  getEmployees: async (params = {}) => {
    const response = await api.get('/hr/employees/', { params });
    return response.data;
  },

  /**
   * 新增員工
   * @param {Object} data - 員工資料
   */
  createEmployee: async (data) => {
    const response = await api.post('/hr/employees/create/', data);
    return response.data;
  },

  /**
   * 更新員工資料
   * @param {string} employeeId - 員工編號
   * @param {Object} data - 更新資料
   */
  updateEmployee: async (employeeId, data) => {
    const response = await api.patch(`/hr/employees/${employeeId}/`, data);
    return response.data;
  },

  /**
   * 指派主管
   * @param {string} employeeId - 員工編號
   * @param {string} managerId - 主管員工編號
   */
  assignManager: async (employeeId, managerId) => {
    const response = await api.patch(`/hr/employees/${employeeId}/assign-manager/`, {
      manager_id: managerId
    });
    return response.data;
  },

  // =====================================================
  // 假別額度管理
  // =====================================================

  /**
   * 批次設定假別額度
   * @param {string[]} employeeIds - 員工編號陣列
   * @param {number} year - 年度
   * @param {string} leaveType - 假別
   * @param {number} totalHours - 總額度
   */
  batchSetLeaveBalances: async (employeeIds, year, leaveType, totalHours) => {
    const response = await api.post('/hr/leave-balances/batch-set/', {
      employee_ids: employeeIds,
      year,
      leave_type: leaveType,
      total_hours: totalHours
    });
    return response.data;
  },

  // =====================================================
  // 部門管理
  // =====================================================

  /**
   * 取得部門列表
   * @param {number} companyId - 公司 ID（選填）
   */
  getDepartments: async (companyId) => {
    const params = companyId ? { company_id: companyId } : {};
    const response = await api.get('/hr/departments/', { params });
    return response.data;
  },

  /**
   * 建立部門
   * @param {Object} data - 部門資料
   */
  createDepartment: async (data) => {
    const response = await api.post('/hr/departments/create/', data);
    return response.data;
  },

  /**
   * 更新部門
   * @param {number} departmentId - 部門 ID
   * @param {Object} data - 更新資料
   */
  updateDepartment: async (departmentId, data) => {
    const response = await api.patch(`/hr/departments/${departmentId}/`, data);
    return response.data;
  },

  /**
   * 刪除部門
   * @param {number} departmentId - 部門 ID
   */
  deleteDepartment: async (departmentId) => {
    const response = await api.delete(`/hr/departments/${departmentId}/delete/`);
    return response.data;
  },
};

export default hrService;
