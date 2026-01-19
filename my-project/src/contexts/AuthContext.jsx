/**
 * AuthContext - 認證狀態管理
 * 提供全域的使用者認證狀態和相關操作
 */
import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from 'sonner';
import authService from '../services/authService';
import attendanceService from '../services/attendanceService';

// 建立 Context
const AuthContext = createContext(null);

/**
 * AuthProvider 元件
 * 包裹整個應用程式，提供認證狀態
 */
export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('userId')
  );
  const [userId, setUserId] = useState(
    localStorage.getItem('userId') || ''
  );
  const [relationId, setRelationId] = useState(
    localStorage.getItem('relationId') || ''
  );
  const [loading, setLoading] = useState(false);

  /**
   * 登入函數
   */
  const login = async (userId, password) => {
    try {
      setLoading(true);

      // 呼叫登入 API
      const response = await authService.login(userId, password);

      // 儲存使用者 ID
      localStorage.setItem('userId', userId);
      setUserId(userId);
      setIsAuthenticated(true);

      // 取得員工-公司關聯 ID
      try {
        const relationResponse = await attendanceService.getRelation(userId);
        if (relationResponse && relationResponse.length > 0) {
          const relId = relationResponse[0].id;
          localStorage.setItem('relationId', relId);
          setRelationId(relId);
        }
      } catch (error) {
        console.error('獲取 relationId 時出錯:', error);
        toast.error('獲取員工資料失敗');
      }

      toast.success(response.message || '登入成功');
      return { success: true };
    } catch (error) {
      console.error('登入失敗:', error);
      toast.error(error.message || '登入失敗，請檢查帳號密碼');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 登出函數
   */
  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();

      // 清除本地儲存
      localStorage.removeItem('userId');
      localStorage.removeItem('relationId');
      setUserId('');
      setRelationId('');
      setIsAuthenticated(false);

      toast.success('登出成功');
      return { success: true };
    } catch (error) {
      console.error('登出失敗:', error);
      toast.error(error.message || '登出失敗');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 修改密碼函數
   */
  const changePassword = async (oldPassword, newPassword) => {
    try {
      setLoading(true);
      const response = await authService.changePassword(oldPassword, newPassword);
      toast.success(response.message || '密碼已更新');
      return { success: true };
    } catch (error) {
      console.error('修改密碼失敗:', error);
      toast.error(error.message || '修改密碼失敗');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  /**
   * 忘記密碼函數
   */
  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await authService.forgotPassword(email);
      toast.success(response.message || '臨時密碼已寄出');
      return { success: true };
    } catch (error) {
      console.error('忘記密碼失敗:', error);
      toast.error(error.message || '發送失敗');
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Context 值
  const value = {
    isAuthenticated,
    userId,
    relationId,
    loading,
    login,
    logout,
    changePassword,
    forgotPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * 方便取得認證狀態和操作
 */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth 必須在 AuthProvider 內使用');
  }
  return context;
};

export default AuthContext;
