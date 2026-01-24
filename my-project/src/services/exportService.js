/**
 * exportService - 資料匯出 API 服務
 * Phase 3 新增
 */
import api from './api';

const exportService = {
  /**
   * 匯出出勤記錄
   * 注意：api interceptor 已返回 response.data（對於 blob 就是 blob 本身）
   */
  exportAttendance: async (dateFrom, dateTo, format = 'csv', employeeIds = []) => {
    const blobData = await api.post('/export/attendance/', {
      date_from: dateFrom,
      date_to: dateTo,
      format,
      employee_ids: employeeIds
    }, {
      responseType: 'blob'
    });

    // 觸發下載
    const blob = new Blob([blobData], {
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
   */
  exportLeave: async (dateFrom, dateTo, format = 'csv') => {
    const blobData = await api.post('/export/leave/', {
      date_from: dateFrom,
      date_to: dateTo,
      format
    }, {
      responseType: 'blob'
    });

    // 觸發下載
    const blob = new Blob([blobData], {
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
