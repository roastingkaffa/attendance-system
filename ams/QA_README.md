# 考勤與請假管理系統 - QA 測試說明

本目錄包含完整的 QA 測試工具和報告。

---

## 📋 文件清單

### 測試報告
1. **QA_EXECUTIVE_SUMMARY.md** (8.4 KB)
   - 執行摘要
   - 系統評級
   - 上線建議

2. **QA_COMPREHENSIVE_TEST_REPORT.md** (18 KB)
   - 詳細測試報告
   - 各模組測試結果
   - 功能評估

3. **QA_ISSUES_AND_RECOMMENDATIONS.md** (16 KB)
   - 問題清單
   - 改進建議
   - 實施優先級

4. **QA_REPORT_20251122_162331.json** (5.7 KB)
   - JSON 格式測試結果
   - 原始測試資料

### 測試腳本
1. **test_qa_simple.py** (18 KB)
   - 簡化版測試腳本
   - 資料庫層級測試
   - **推薦使用**

2. **test_comprehensive_qa.py** (37 KB)
   - 完整版測試腳本
   - 包含 API 測試
   - 需要修正測試環境

---

## 🚀 快速開始

### 執行簡化版測試

```bash
cd /home/roc/workspace/Human-Resources/attendance-system/ams
python3 test_qa_simple.py
```

### 預期輸出

```
================================================================================
考勤與請假管理系統 - QA 測試報告
================================================================================

[1] 資料庫完整性測試
--------------------------------------------------------------------------------
✅ [PASS] 資料庫完整性 > Employees 資料表
   4 筆資料
✅ [PASS] 資料庫完整性 > Companies 資料表
   1 筆資料
...

================================================================================
測試摘要
================================================================================
總測試數: 42
✅ 通過: 40 (95.2%)
❌ 失敗: 0 (0.0%)
⚠️  警告: 2 (4.8%)
```

---

## 📊 測試範圍

### 1. 資料庫完整性測試
- ✅ 資料表結構驗證
- ✅ 外鍵關聯檢查
- ✅ 索引可用性測試
- ✅ 測試資料完整性

### 2. 員工資料測試
- ✅ 員工數量驗證
- ✅ 角色分佈檢查
- ✅ 必要欄位驗證

### 3. 公司資料測試
- ✅ 公司基本資料驗證
- ✅ GPS 座標檢查
- ✅ 打卡範圍驗證

### 4. 關聯資料測試
- ✅ 員工公司關係驗證
- ✅ 主管關係檢查
- ✅ 循環依賴檢測

### 5. 請假記錄測試
- ✅ 請假記錄完整性
- ✅ 時間邏輯驗證
- ⚠️  時數計算檢查（有警告）

### 6. 審批系統測試
- ✅ 審批政策驗證
- ✅ 審批流程檢查
- ✅ 多層級審批測試

### 7. 假別額度測試
- ✅ 額度計算驗證
- ✅ 額度扣除檢查
- ✅ 按員工統計

### 8. 資料完整性測試
- ✅ 關聯完整性
- ✅ 邏輯一致性

---

## 📈 測試結果解讀

### ✅ 通過 (PASS)
表示測試項目完全符合預期，功能正常。

### ❌ 失敗 (FAIL)
表示測試項目未通過，需要立即修正。
**目前狀態: 0 個失敗項目**

### ⚠️ 警告 (WARNING)
表示測試項目有輕微問題或需要注意的地方，但不影響核心功能。
**目前狀態: 2 個警告項目**
- 請假記錄 #1 時數計算差異
- 請假記錄 #2 時數計算差異

---

## 🔧 測試環境設定

### 資料庫設定
測試腳本會自動使用 SQLite 測試資料庫：
```python
os.environ['DB_ENGINE'] = 'django.db.backends.sqlite3'
os.environ['DB_NAME'] = 'db_test.sqlite3'
```

### Django 設定
確保 Django 環境正確設定：
```python
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ams.settings')
django.setup()
```

---

## 🐛 常見問題

### Q1: 測試腳本無法執行
**A**: 確認 Python 版本和套件安裝
```bash
python3 --version  # 應為 3.8+
pip3 list | grep django  # 確認 Django 已安裝
```

### Q2: 資料庫連線錯誤
**A**: 確認資料庫檔案存在
```bash
ls -lh db_test.sqlite3
```

### Q3: 測試結果與預期不符
**A**: 檢查測試資料是否正確
```bash
python3 -c "
import sqlite3
conn = sqlite3.connect('db_test.sqlite3')
cursor = conn.cursor()
cursor.execute('SELECT COUNT(*) FROM attendance_employees')
print('員工數:', cursor.fetchone()[0])
"
```

---

## 📝 測試報告說明

### 測試報告結構

```
QA_EXECUTIVE_SUMMARY.md          ← 先看這個（執行摘要）
    ├── 測試結果總覽
    ├── 系統評級
    ├── 上線建議
    └── 風險評估

QA_COMPREHENSIVE_TEST_REPORT.md  ← 詳細資料在這裡
    ├── 各模組測試結果
    ├── 功能完整性評估
    ├── 安全性評估
    └── 效能評估

QA_ISSUES_AND_RECOMMENDATIONS.md ← 改進建議看這個
    ├── 問題清單（優先級分類）
    ├── 改進建議（功能增強）
    └── 實施優先級建議
```

---

## 🎯 測試最佳實踐

### 定期執行測試
建議在以下情況執行測試：
- ✅ 每次新功能開發後
- ✅ 修正 bug 後
- ✅ 資料庫結構變更後
- ✅ 部署到正式環境前

### 測試資料管理
- 保持測試資料的一致性
- 定期備份測試資料庫
- 測試後恢復初始狀態

### 測試結果追蹤
- 儲存每次測試的 JSON 報告
- 比較不同時間點的測試結果
- 追蹤問題修正進度

---

## 🔄 持續整合建議

### 建立 CI/CD 流程
```yaml
# .github/workflows/test.yml
name: QA Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Set up Python
        uses: actions/setup-python@v2
        with:
          python-version: 3.8
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
      - name: Run QA Tests
        run: |
          python3 test_qa_simple.py
```

---

## 📞 支援

如有任何問題或需要協助，請參考：
- 詳細報告: `QA_COMPREHENSIVE_TEST_REPORT.md`
- 問題清單: `QA_ISSUES_AND_RECOMMENDATIONS.md`
- 執行摘要: `QA_EXECUTIVE_SUMMARY.md`

---

## 📄 授權

本測試工具為考勤與請假管理系統的一部分。

---

**最後更新**: 2025-11-22
**版本**: 1.0
**維護者**: QA 測試團隊
