# In-App 瀏覽器與自簽 SSL 憑證限制

## 問題描述

在內網開發環境使用 mkcert 自簽 HTTPS 憑證時，從 LINE、Facebook Messenger 等應用程式的內建瀏覽器（WebView）開啟網址會出現錯誤：

> 「無法開啟頁面。請確認網路連線狀況後，再試一次」

但網路連線實際上是正常的，且相同網址在 Safari 或 Chrome 可以正常開啟。

## 原因

| 環境 | Safari/Chrome | LINE/FB 內建瀏覽器 |
|------|:-------------:|:-----------------:|
| 自簽憑證 (mkcert) | ✅ 可手動信任 | ❌ 無法信任 |
| 內網 IP (192.168.x.x) | ✅ | ⚠️ 受限 |
| 非標準埠號 (5173) | ✅ | ⚠️ 受限 |

**根本原因**：In-App 瀏覽器（WebView）的安全策略較嚴格，無法接受自簽 HTTPS 憑證，且沒有「繼續前往不安全網站」的選項。

## 受影響的應用程式

- LINE 內建瀏覽器
- Facebook Messenger 內建瀏覽器
- Instagram 內建瀏覽器
- 其他使用 WebView 的應用程式

## 解決方案

### 開發/測試環境

#### 方案 1：從 In-App 開啟外部瀏覽器（推薦）
在 LINE 內點擊連結後：
1. 點右下角 **「⋯」** 選單
2. 選擇 **「在 Safari 中開啟」** 或 **「在瀏覽器中開啟」**

#### 方案 2：複製連結到外部瀏覽器
長按連結 → 複製 → 貼到 Safari/Chrome 開啟

#### 方案 3：使用 ngrok 取得公開 HTTPS 網址
```bash
# 安裝 ngrok
brew install ngrok  # macOS
# 或下載: https://ngrok.com/download

# 建立隧道
ngrok http 5173

# 會得到類似 https://xxxx.ngrok.io 的公開網址
# 這個網址有正式 SSL 憑證，In-App 瀏覽器可正常開啟
```

### 生產環境

使用正式 SSL 憑證（如 Let's Encrypt）部署到公開網域，所有瀏覽器都能正常存取。

```bash
# 使用 certbot 取得免費 SSL 憑證
sudo certbot --nginx -d yourdomain.com
```

## 總結

| 情境 | 可行性 |
|------|:------:|
| Safari/Chrome 直接開啟 | ✅ |
| LINE「在 Safari 中開啟」 | ✅ |
| LINE 內建瀏覽器 (自簽憑證) | ❌ |
| LINE 內建瀏覽器 (正式 SSL) | ✅ |
| ngrok 公開網址 | ✅ |

## 相關標籤

- HTTPS
- SSL/TLS
- mkcert
- WebView
- LINE
- In-App Browser
- Mixed Content
- 內網開發
