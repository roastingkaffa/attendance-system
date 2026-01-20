/**
 * 通知服務 (Notification Service)
 * 處理所有通知相關的 API 呼叫
 * Phase 2
 */
import apiClient from './api';

const notificationService = {
  /**
   * 取得通知列表
   * @param {Object} params - 查詢參數
   * @param {boolean} [params.unread_only=false] - 是否只顯示未讀
   * @param {number} [params.limit=20] - 每頁筆數
   * @param {number} [params.offset=0] - 起始位置
   * @returns {Promise} API 回應
   */
  getNotifications: async (params = {}) => {
    const response = await apiClient.get('/notifications/', { params });
    return response;
  },

  /**
   * 取得未讀通知數量
   * @returns {Promise} API 回應
   */
  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count/');
    return response;
  },

  /**
   * 標記單一通知為已讀
   * @param {number} notificationId - 通知 ID
   * @returns {Promise} API 回應
   */
  markAsRead: async (notificationId) => {
    const response = await apiClient.post(`/notifications/mark-read/${notificationId}/`);
    return response;
  },

  /**
   * 標記全部通知為已讀
   * @returns {Promise} API 回應
   */
  markAllAsRead: async () => {
    const response = await apiClient.post('/notifications/mark-all-read/');
    return response;
  },
};

export default notificationService;
