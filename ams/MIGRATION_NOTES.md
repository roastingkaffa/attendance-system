# 資料庫遷移說明

## GPS 座標欄位類型修正

### 修改內容
將 `Companies` 模型的 `latitude` 和 `longitude` 欄位從 `TextField` 改為 `DecimalField`。

### 執行步驟

1. **生成 migration 檔案**
```bash
cd /home/roc/workspace/Human-Resources/attendance-system/ams
python manage.py makemigrations
```

2. **檢查 migration**
```bash
python manage.py showmigrations
```

3. **執行 migration**
```bash
python manage.py migrate
```

### 注意事項

⚠️ **重要**：這個修改會影響現有資料！

如果資料庫中已有公司資料，需要確保：
- 現有的 latitude/longitude 值是有效的數字格式
- 值在合法範圍內（緯度：-90 到 90，經度：-180 到 180）

### 資料備份

在執行 migration 前，建議先備份資料庫：

```bash
mysqldump -u root -p ams > ams_backup_$(date +%Y%m%d).sql
```

### 可能的錯誤

如果遇到資料轉換錯誤，可能需要：

1. 手動清理無效資料
2. 或使用自訂 migration 腳本進行資料轉換

### 測試驗證

Migration 完成後，測試：
1. 新增公司時使用 Decimal 格式
2. 確認打卡功能正常運作
3. 檢查 GPS 距離計算是否正確
