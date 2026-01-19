# 審批管理系統使用指南

## 📋 系統概述

本系統提供靈活的多層級審批管理功能，支援：
- HR 和總經理設定員工的直屬主管
- 根據請假天數自動套用不同審批政策
- 支援多層級審批流程（主管 → HR → 總經理）

## 🔐 權限控制

### 可管理審批設定的人員
- **HR（員工編號以 HR 開頭）**
- **總經理（員工編號以 CEO 開頭）**
- **系統管理員（Superuser）**

### 權限範圍
✅ 可以設定主管關係
✅ 可以新增/修改/刪除審批政策
✅ 可以指定員工的直屬主管

## 📊 資料表結構

### 1. 主管關係表 (ManagerialRelationship)

記錄員工與主管的階層關係。

**欄位說明**：
- `employee_id`: 員工
- `manager_id`: 直屬主管
- `company_id`: 所屬公司（選填，可用於多公司場景）
- `effective_date`: 生效日期
- `end_date`: 結束日期（選填，用於主管變更歷史）
- `created_by`: 建立者（HR 或總經理）

**範例**：
```python
ManagerialRelationship.objects.create(
    employee_id=Employees.objects.get(employee_id='EMP001'),
    manager_id=Employees.objects.get(employee_id='MGR001'),
    company_id=Companies.objects.get(id=1),
    effective_date=datetime.now().date(),
    created_by=request.user
)
```

### 2. 審批政策表 (ApprovalPolicy)

定義不同請假天數的審批層級規則。

**欄位說明**：
- `policy_name`: 政策名稱
- `company_id`: 適用公司（選填，留空表示適用所有公司）
- `min_days`: 最小天數（包含）
- `max_days`: 最大天數（包含，留空表示無上限）
- `approval_levels`: 審批層級（JSON 格式）
- `is_active`: 是否啟用

**approval_levels JSON 格式**：
```json
[
    {
        "level": 1,
        "role": "manager",
        "description": "直屬主管"
    },
    {
        "level": 2,
        "role": "hr",
        "description": "人資部門"
    },
    {
        "level": 3,
        "role": "ceo",
        "description": "總經理"
    }
]
```

**role 可選值**：
- `manager`: 直屬主管（自動從員工的主管關係取得）
- `hr`: 人資部門（employee_id 以 HR 開頭）
- `ceo`: 總經理（employee_id 以 CEO 開頭）

### 3. 員工-公司關係 (EmpCompanyRel)

新增欄位 `direct_manager`，用於快速查詢員工的直屬主管。

**欄位**：
- `direct_manager`: 直屬主管（ForeignKey to Employees）

## 🎯 使用流程

### 步驟 1：設定主管關係

**方式 1：透過 Django Admin 後台**

1. 登入後台：http://localhost:8000/admin/
2. 進入「主管關係」(ManagerialRelationship)
3. 點擊「新增主管關係」
4. 填寫以下資訊：
   - 員工：選擇員工
   - 直屬主管：選擇主管
   - 公司：選擇公司（選填）
   - 生效日期：設定生效日期
5. 點擊「儲存」

**方式 2：透過 Python Shell**

```python
python3 manage.py shell

from attendance.models import Employees, Companies, ManagerialRelationship
from datetime import date

# 設定 EMP001 的主管為 MGR001
ManagerialRelationship.objects.create(
    employee_id=Employees.objects.get(employee_id='EMP001'),
    manager_id=Employees.objects.get(employee_id='MGR001'),
    company_id=Companies.objects.get(id=1),
    effective_date=date.today(),
    created_by=Employees.objects.get(employee_id='CEO001')
)
```

**注意事項**：
- 建立主管關係後，系統會自動同步更新 `EmpCompanyRel` 的 `direct_manager` 欄位
- 可以設定歷史記錄（透過 end_date）追蹤主管變更

### 步驟 2：設定審批政策

**已預設政策**：
1. **1 天以內請假**：只需直屬主管審批
2. **2-3 天請假**：直屬主管 → HR
3. **4 天以上請假**：直屬主管 → HR → 總經理

**新增自訂政策**：

1. 登入 Django Admin
2. 進入「審批政策」(ApprovalPolicy)
3. 點擊「新增審批政策」
4. 填寫資訊：
   - 政策名稱：例如「緊急假別審批」
   - 適用公司：選擇公司或留空（適用所有）
   - 最小天數：例如 0.5（半天）
   - 最大天數：例如 1.5
   - 審批層級：JSON 格式（參考上方範例）
   - 是否啟用：勾選
5. 點擊「儲存」

**範例政策 JSON**：

```json
[
    {
        "level": 1,
        "role": "manager",
        "description": "直屬主管"
    }
]
```

### 步驟 3：員工申請請假

當員工透過前台申請請假時：

1. 系統計算請假天數
2. 查找適用的審批政策（根據天數和公司）
3. 根據政策的 `approval_levels` 自動建立審批記錄
4. 依序建立每個層級的審批記錄（status='pending'）

**系統自動判斷流程**：
```
請假 0.5 天 → Level 1 (主管)
請假 2 天   → Level 1 (主管) → Level 2 (HR)
請假 5 天   → Level 1 (主管) → Level 2 (HR) → Level 3 (總經理)
```

### 步驟 4：主管審批

1. 主管登入系統
2. 查看待審批的請假申請
3. 點擊「批准」或「拒絕」

**審批邏輯**：
- 當 Level 1 批准後，請假記錄仍保持 `pending` 狀態
- 當所有層級都批准後，請假記錄才會變成 `approved`
- 批准後自動扣除假別額度
- 任何層級拒絕，請假記錄立即變成 `rejected`

## 🔍 審批流程查詢

### 查詢員工的直屬主管

```python
from attendance.models import EmpCompanyRel, ManagerialRelationship

# 方法 1：從 EmpCompanyRel 查詢
rel = EmpCompanyRel.objects.get(employee_id='EMP001', company_id=1)
manager = rel.direct_manager
print(f"直屬主管: {manager.username}")

# 方法 2：從 ManagerialRelationship 查詢歷史記錄
mgr_rel = ManagerialRelationship.objects.filter(
    employee_id__employee_id='EMP001',
    effective_date__lte=datetime.now().date(),
    end_date__isnull=True
).first()
print(f"主管: {mgr_rel.manager_id.username}")
```

### 查詢適用的審批政策

```python
from attendance.models import ApprovalPolicy

# 查詢 2.5 天請假的審批政策
leave_days = 2.5
policy = ApprovalPolicy.objects.filter(
    is_active=True,
    min_days__lte=leave_days
).filter(
    Q(max_days__gte=leave_days) | Q(max_days__isnull=True)
).first()

print(f"適用政策: {policy.policy_name}")
print(f"審批層級: {policy.approval_levels}")
```

### 查詢員工的下屬

```python
from attendance.models import ManagerialRelationship

# 查詢 MGR001 的所有下屬
subordinates = ManagerialRelationship.objects.filter(
    manager_id__employee_id='MGR001',
    end_date__isnull=True
)

for sub in subordinates:
    print(f"下屬: {sub.employee_id.username}")
```

## 📝 常見問題

### Q1: 如何變更員工的主管？

**A**: 有兩種方式：
1. **設定結束日期**：將舊的主管關係設定 `end_date`，然後新增一筆新的主管關係
2. **直接修改**：在 Django Admin 中編輯現有的主管關係

### Q2: 如果員工沒有設定主管會怎樣？

**A**: 系統會自動使用備援邏輯：
1. 先從 `direct_manager` 欄位取得
2. 再從 `ManagerialRelationship` 查詢
3. 最後使用預設主管（employee_id 以 MGR 開頭的第一位）

### Q3: 可以針對不同公司設定不同政策嗎？

**A**: 可以！在 `ApprovalPolicy` 的 `company_id` 欄位指定公司即可。系統會優先使用公司專屬政策。

### Q4: 如何停用某個審批政策？

**A**: 在 Django Admin 中將 `is_active` 設為 False 即可。

### Q5: 審批政策的優先順序？

**A**: 系統會依以下順序查找政策：
1. 指定公司的政策（優先）
2. 全域政策（company_id 為空）
3. 按 `min_days` 排序取最接近的

## 🚀 進階功能

### 1. 支援多公司場景

如果您的系統有多個公司，可以為每個公司設定專屬的審批政策：

```python
ApprovalPolicy.objects.create(
    policy_name='A 公司 4 天以上假別',
    company_id=Companies.objects.get(id=1),
    min_days=4.0,
    max_days=None,
    approval_levels='[...]',
    is_active=True
)
```

### 2. 臨時代理主管

如果主管請假，可以設定臨時代理主管：

```python
# 設定臨時主管（有結束日期）
ManagerialRelationship.objects.create(
    employee_id=Employees.objects.get(employee_id='EMP001'),
    manager_id=Employees.objects.get(employee_id='MGR002'),
    effective_date=date(2025, 12, 1),
    end_date=date(2025, 12, 15),
    created_by=Employees.objects.get(employee_id='HR001')
)
```

### 3. 自訂審批角色

如果需要更複雜的審批邏輯，可以在 `views.py` 的 `apply_leave` 函數中擴展：

```python
elif role == 'department_head':
    # 自訂邏輯：找部門主管
    approver = Employees.objects.filter(
        department='IT',
        position='Head'
    ).first()
```

## 📱 前台使用說明

當員工在前台申請請假時：
1. 填寫請假資訊（假別、時間、原因）
2. 點擊「提交申請」
3. 系統自動計算天數並套用審批政策
4. 顯示需要幾層審批和審批人資訊
5. 等待審批人依序批准

**顯示範例**：
```
✅ 請假申請已提交，需要 2 層審批

審批流程：
Level 1: 王經理 (MGR001) - 待審批
Level 2: 李人資 (HR001) - 待審批

適用政策：2-3 天請假
```

## 🛠️ 故障排除

### 問題：審批記錄沒有自動建立

**檢查**：
1. 確認審批政策的 `is_active` 為 True
2. 確認請假天數符合政策的天數範圍
3. 檢查 `approval_levels` JSON 格式是否正確

### 問題：找不到審批人

**檢查**：
1. 確認員工有設定直屬主管
2. 確認 HR/CEO 員工編號格式正確
3. 查看後端日誌確認錯誤訊息

### 問題：權限被拒絕

**檢查**：
1. 確認登入者的 employee_id 是否以 HR 或 CEO 開頭
2. 或者確認是否為 Superuser

---

## 📞 技術支援

如有任何問題，請聯繫系統管理員或 HR 部門。
