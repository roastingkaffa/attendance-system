/**
 * userService - 使用者資訊 API 服務
 * Phase 3 新增
 */
import api from './api';

const userService = {
  /**
   * 取得當前使用者完整資訊（含角色、權限）
   */
  getProfile: async () => {
    const response = await api.get('/user/profile/');
    return response.data;
  },
};

export default userService;
