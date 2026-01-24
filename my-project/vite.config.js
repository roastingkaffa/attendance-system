import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// 檢查是否存在 mkcert 憑證
const certPath = path.resolve(__dirname, 'localhost+2.pem')
const keyPath = path.resolve(__dirname, 'localhost+2-key.pem')
const httpsConfig = fs.existsSync(certPath) && fs.existsSync(keyPath)
  ? {
      key: fs.readFileSync(keyPath),
      cert: fs.readFileSync(certPath),
    }
  : false

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    // 如果有憑證就啟用 HTTPS，否則用 HTTP
    https: httpsConfig,
  },
})
