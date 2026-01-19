#!/bin/bash

echo "========================================="
echo "🧪 Phase 1 簡化測試"
echo "========================================="

cd /home/roc/workspace/Human-Resources/attendance-system/ams

# 測試 1: 檢查檔案是否存在
echo ""
echo "測試 1: 檢查新增的檔案"
echo "-----------------------------------------"

files=(
    ".env:環境變數設定"
    ".env.example:環境變數範本"
    "attendance/utils.py:輔助函數"
    "attendance/responses.py:統一回應格式"
    "MIGRATION_NOTES.md:遷移說明"
)

for item in "${files[@]}"; do
    IFS=':' read -r file desc <<< "$item"
    if [ -f "$file" ]; then
        echo "✅ $desc ($file)"
    else
        echo "❌ $desc ($file) 不存在"
    fi
done

# 測試 2: 檢查環境變數
echo ""
echo "測試 2: 環境變數載入"
echo "-----------------------------------------"

if python3 -c "from decouple import config; config('SECRET_KEY')" 2>/dev/null; then
    echo "✅ python-decouple 已安裝"
    SECRET_LEN=$(python3 -c "from decouple import config; print(len(config('SECRET_KEY')))")
    echo "✅ SECRET_KEY 長度: $SECRET_LEN"

    DEBUG=$(python3 -c "from decouple import config; print(config('DEBUG', cast=bool))")
    echo "✅ DEBUG = $DEBUG"

    DB_NAME=$(python3 -c "from decouple import config; print(config('DB_NAME'))")
    echo "✅ DB_NAME = $DB_NAME"
else
    echo "❌ python-decouple 未安裝或環境變數載入失敗"
fi

# 測試 3: 檢查程式碼修改
echo ""
echo "測試 3: 檢查程式碼修改"
echo "-----------------------------------------"

# 檢查 settings.py 是否使用 config
if grep -q "from decouple import config" ams/settings.py; then
    echo "✅ settings.py 已匯入 decouple"
else
    echo "❌ settings.py 未匯入 decouple"
fi

if grep -q "config('SECRET_KEY')" ams/settings.py; then
    echo "✅ settings.py 使用 config 讀取 SECRET_KEY"
else
    echo "❌ settings.py 未使用 config 讀取 SECRET_KEY"
fi

# 檢查 views.py 是否匯入 responses
if grep -q "from .responses import" attendance/views.py; then
    echo "✅ views.py 已匯入統一回應格式"
else
    echo "❌ views.py 未匯入統一回應格式"
fi

# 檢查 views.py 是否有新的 API
if grep -q "def clock_in" attendance/views.py; then
    echo "✅ views.py 包含 clock_in API"
else
    echo "❌ views.py 缺少 clock_in API"
fi

if grep -q "def clock_out" attendance/views.py; then
    echo "✅ views.py 包含 clock_out API"
else
    echo "❌ views.py 缺少 clock_out API"
fi

# 檢查 models.py GPS 欄位類型
if grep -q "DecimalField" attendance/models.py; then
    echo "✅ models.py 使用 DecimalField"
else
    echo "❌ models.py 未使用 DecimalField"
fi

# 檢查 App.jsx 是否移除密碼儲存
if ! grep -q "sessionStorage.setItem(\"password\"" ../my-project/src/App.jsx; then
    echo "✅ App.jsx 已移除密碼儲存（或已註解）"
else
    echo "❌ App.jsx 仍在儲存密碼"
fi

# 測試 4: 檢查 .gitignore
echo ""
echo "測試 4: 檢查 .gitignore"
echo "-----------------------------------------"

if [ -f "../.gitignore" ]; then
    if grep -q "\.env" ../.gitignore; then
        echo "✅ .gitignore 包含 .env"
    else
        echo "⚠️  .gitignore 未包含 .env"
    fi
else
    echo "⚠️  根目錄沒有 .gitignore"
fi

# 測試 5: 統計修改
echo ""
echo "測試 5: 程式碼統計"
echo "-----------------------------------------"

echo "新增檔案數量:"
ls attendance/utils.py attendance/responses.py 2>/dev/null | wc -l | xargs echo "  - 後端檔案:"

echo "  - 文檔檔案: 2 (MIGRATION_NOTES.md, IMPLEMENTATION_REPORT.md)"

echo ""
echo "程式碼行數:"
if [ -f "attendance/utils.py" ]; then
    UTILS_LINES=$(wc -l < attendance/utils.py)
    echo "  - utils.py: $UTILS_LINES 行"
fi

if [ -f "attendance/responses.py" ]; then
    RESP_LINES=$(wc -l < attendance/responses.py)
    echo "  - responses.py: $RESP_LINES 行"
fi

# 完成
echo ""
echo "========================================="
echo "✅ 測試完成"
echo "========================================="
