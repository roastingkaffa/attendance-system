/**
 * exportService - 資料匯出 API 服務
 * Phase 3 新增
 */
import api from './api';

const exportService = {
  /**
   * 匯出出勤記錄
   * @param {string} dateFrom - 開始日期（YYYY-MM-DD）
   * @param {string} dateTo - 結束日期（YYYY-MM-DD）
   * @param {string} format - 格式（csv/xlsx）
   * @param {string[]} employeeIds - 員工編號陣列（選填，HR 專用）
   */
  exportAttendance: async (dateFrom, dateTo, format = 'csv', employeeIds = []) => {
    const response = await api.post('/export/attendance/', {
      date_from: dateFrom,
      date_to: dateTo,
      format,
      employee_ids: employeeIds
    }, {
      responseType: 'blob'
    });

    // 觸發下載
    const blob = new Blob([response.data], {
      type: format === 'xlsx'
        ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        : 'text/csv;charset=utf-8'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attendance_export_${dateFrom}_${dateTo}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  },

  /**
   * 匯出請假記錄
   * @param {string} dateFrom - 開始日期
   * @param {string} dateTo - 結束日期
   * @param {string} format - 格式
   */
  exportLeave: async (dateFrom, dateTo, format = 'csv') => {
    const response = await api.post('/export/leave/', {
      date_from: dateFrom,
      date_to: dateTo,
      format
    }, {
      responseType: 'blob'
    });

    // 觸發下載
    const blob = new Blob([response.data], {
      type: 'text/csv;charset=utf-8'
    });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `leave_export_${dateFrom}_${dateTo}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true };
  },
};

export default exportService;
