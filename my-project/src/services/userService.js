/**
 * userService - 使用者資訊 API 服務
 * Phase 3 新增
 */
import api from './api';

const userService = {
  /**
   * 取得當前使用者完整資訊（含角色、權限）
   * 注意：api.get 已經透過 interceptor 返回 response.data
   */
  getProfile: async () => {
    return await api.get('/user/profile/');
  },
};

export default userService;
