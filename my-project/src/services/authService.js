/**
 * 認證服務 (Authentication Service)
 * 處理所有認證相關的 API 呼叫
 */
import apiClient from './api';

const authService = {
  /**
   * 登入
   * @param {string} userId - 使用者帳號
   * @param {string} password - 密碼
   * @returns {Promise} API 回應
   */
  login: async (userId, password) => {
    const response = await apiClient.post('/login/', {
      userId,
      password,
    });
    return response;
  },

  /**
   * 登出
   * @returns {Promise} API 回應
   */
  logout: async () => {
    const response = await apiClient.post('/logout/');
    return response;
  },

  /**
   * 修改密碼
   * @param {string} oldPassword - 舊密碼
   * @param {string} newPassword - 新密碼
   * @returns {Promise} API 回應
   */
  changePassword: async (oldPassword, newPassword) => {
    const response = await apiClient.post('/change_password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
    return response;
  },

  /**
   * 忘記密碼
   * @param {string} email - Email 地址
   * @returns {Promise} API 回應
   */
  forgotPassword: async (email) => {
    const response = await apiClient.post('/forgot_password/', {
      email,
    });
    return response;
  },
};

export default authService;
