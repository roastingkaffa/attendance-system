/**
 * LoginForm 元件
 * 登入表單
 */
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../common/Button';

const LoginForm = ({ onSuccess, onForgotPassword }) => {
  const { login, loading } = useAuth();
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId || !password) {
      return;
    }

    const result = await login(userId, password);
    if (result.success && onSuccess) {
      onSuccess();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-8 bg-white rounded-2xl shadow-lg">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">禾一系統出勤系統</h1>
        <p className="text-gray-600 mt-2">請輸入帳號密碼登入</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 帳號輸入 */}
        <div>
          <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-2">
            帳號
          </label>
          <input
            id="userId"
            type="text"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="請輸入帳號"
            disabled={loading}
          />
        </div>

        {/* 密碼輸入 */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
            密碼
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
            placeholder="請輸入密碼"
            disabled={loading}
          />
        </div>

        {/* 忘記密碼連結 */}
        {onForgotPassword && (
          <div className="text-right">
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-sm text-blue-600 hover:text-blue-800 underline"
              disabled={loading}
            >
              忘記密碼？
            </button>
          </div>
        )}

        {/* 登入按鈕 */}
        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={loading}
          className="w-full"
        >
          登入
        </Button>
      </form>
    </div>
  );
};

export default LoginForm;
