/**
 * ChangePasswordForm 元件
 * 修改密碼表單
 */
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

const ChangePasswordForm = ({ onSuccess, onCancel }) => {
  const { changePassword, loading } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // 驗證新密碼
    if (newPassword.length < 6) {
      setError('新密碼長度至少 6 個字元');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('新密碼與確認密碼不一致');
      return;
    }

    const result = await changePassword(oldPassword, newPassword);
    if (result.success) {
      // 清空表單
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      if (onSuccess) {
        onSuccess();
      }
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">修改密碼</h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 錯誤訊息 */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 舊密碼 */}
        <div>
          <label htmlFor="oldPassword" className="block text-sm font-medium text-gray-700 mb-2">
            舊密碼
          </label>
          <input
            id="oldPassword"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="請輸入舊密碼"
            disabled={loading}
          />
        </div>

        {/* 新密碼 */}
        <div>
          <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
            新密碼
          </label>
          <input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="至少 6 個字元"
            disabled={loading}
          />
        </div>

        {/* 確認新密碼 */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            確認新密碼
          </label>
          <input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="請再次輸入新密碼"
            disabled={loading}
          />
        </div>

        {/* 按鈕群組 */}
        <div className="flex gap-4">
          <Button
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            className="flex-1"
          >
            確認修改
          </Button>
          {onCancel && (
            <Button
              type="button"
              variant="secondary"
              size="lg"
              onClick={onCancel}
              disabled={loading}
              className="flex-1"
            >
              取消
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default ChangePasswordForm;
