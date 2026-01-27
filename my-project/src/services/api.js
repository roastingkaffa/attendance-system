/**
 * Axios 基礎配置
 * 處理 API 請求的統一配置
 */
import axios from 'axios';

// API Base URL
// 開發環境使用 /api 代理（解決 HTTPS 前端呼叫 HTTP 後端的 Mixed Content 問題）
// 生產環境從環境變數讀取
const BASE_URL = import.meta.env.DEV ? '/api' : (import.meta.env.VITE_API_URL || '');

/**
 * 從 Cookie 中取得 CSRF Token
 */
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let cookie of cookies) {
      cookie = cookie.trim();
      if (cookie.startsWith(name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

/**
 * 建立 Axios 實例
 */
const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // 自動帶上 Cookies（Session）
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Request Interceptor
 * 自動加上 CSRF Token
 */
apiClient.interceptors.request.use(
  (config) => {
    const csrftoken = getCookie('csrftoken');
    if (csrftoken) {
      config.headers['X-CSRFToken'] = csrftoken;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * 統一處理回應和錯誤
 */
apiClient.interceptors.response.use(
  (response) => {
    // 成功回應：直接返回 data
    return response.data;
  },
  (error) => {
    // 錯誤處理
    if (error.response) {
      // 伺服器回應錯誤（4xx, 5xx）
      const { status, data } = error.response;

      // 401 未授權：跳轉登入頁
      if (status === 401) {
        localStorage.removeItem('userId');
        window.location.href = '/';
      }

      // 返回統一錯誤格式
      return Promise.reject({
        status,
        message: data?.error?.message || data?.message || '請求失敗',
        code: data?.error?.code || 'UNKNOWN_ERROR',
        details: data?.error?.details || null,
      });
    } else if (error.request) {
      // 請求已發送但沒有收到回應（網路錯誤）
      return Promise.reject({
        status: 0,
        message: '網路連線失敗，請檢查網路狀態',
        code: 'NETWORK_ERROR',
      });
    } else {
      // 其他錯誤
      return Promise.reject({
        status: 0,
        message: error.message || '未知錯誤',
        code: 'UNKNOWN_ERROR',
      });
    }
  }
);

export default apiClient;
