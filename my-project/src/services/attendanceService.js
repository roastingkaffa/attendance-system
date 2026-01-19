/**
 * 出勤服務 (Attendance Service)
 * 處理所有出勤打卡相關的 API 呼叫
 */
import apiClient from './api';

const attendanceService = {
  /**
   * 上班打卡（使用新的後端驗證 API）
   * @param {Object} data - 打卡資料
   * @param {number} data.qr_latitude - QR Code 緯度
   * @param {number} data.qr_longitude - QR Code 經度
   * @param {number} data.user_latitude - 使用者緯度
   * @param {number} data.user_longitude - 使用者經度
   * @param {number} data.relation_id - 員工-公司關聯 ID
   * @returns {Promise} API 回應
   */
  clockIn: async (data) => {
    const response = await apiClient.post('/clock-in/', {
      qr_latitude: data.qr_latitude,
      qr_longitude: data.qr_longitude,
      user_latitude: data.user_latitude,
      user_longitude: data.user_longitude,
      relation_id: data.relation_id,
    });
    return response;
  },

  /**
   * 下班打卡（使用新的後端驗證 API）
   * @param {number} recordId - 打卡記錄 ID
   * @param {Object} data - 打卡資料
   * @param {number} data.qr_latitude - QR Code 緯度
   * @param {number} data.qr_longitude - QR Code 經度
   * @param {number} data.user_latitude - 使用者緯度
   * @param {number} data.user_longitude - 使用者經度
   * @returns {Promise} API 回應
   */
  clockOut: async (recordId, data) => {
    const response = await apiClient.patch(`/clock-out/${recordId}/`, {
      qr_latitude: data.qr_latitude,
      qr_longitude: data.qr_longitude,
      user_latitude: data.user_latitude,
      user_longitude: data.user_longitude,
    });
    return response;
  },

  /**
   * 取得打卡記錄列表
   * @param {Object} params - 查詢參數
   * @param {string} params.employee_id - 員工 ID
   * @param {number} params.days - 查詢天數
   * @param {string} params.date - 日期篩選 (例如: 'today')
   * @returns {Promise} API 回應
   */
  getRecords: async (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    const response = await apiClient.get(`/attendance/?${queryString}`);
    return response;
  },

  /**
   * 取得員工-公司關聯資料
   * @param {string} employeeId - 員工 ID
   * @returns {Promise} API 回應
   */
  getRelation: async (employeeId) => {
    const response = await apiClient.get(`/relation/?employee_id=${employeeId}`);
    return response;
  },

  /**
   * 取得公司資訊
   * @param {number} companyId - 公司 ID
   * @returns {Promise} API 回應
   */
  getCompany: async (companyId) => {
    const response = await apiClient.get(`/companies/${companyId}/`);
    return response;
  },
};

export default attendanceService;
