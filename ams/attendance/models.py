from django.db import models
from django.contrib.auth.models import AbstractUser
from datetime import time
from decimal import Decimal


# Phase 3 新增：角色選項
ROLE_CHOICES = [
    ('employee', '一般員工'),
    ('manager', '部門主管'),
    ('hr_admin', 'HR 管理員'),
    ('ceo', '總經理'),
    ('system_admin', '系統管理員'),
]


class Employees(AbstractUser):
    employee_id = models.CharField(verbose_name="員工編號", max_length=20, unique=True, primary_key=True)
    phone = models.TextField(verbose_name="員工電話", blank=True, null=True)
    address = models.TextField(verbose_name="員工地址", blank=True, null=True)
    email = models.EmailField(verbose_name="員工電子郵件", blank=True, null=True)

    # Phase 3 新增：角色與部門
    role = models.CharField(
        verbose_name="角色",
        max_length=20,
        choices=ROLE_CHOICES,
        default='employee'
    )
    department = models.ForeignKey(
        'Departments',
        on_delete=models.SET_NULL,
        verbose_name="所屬部門",
        related_name="employees",
        null=True,
        blank=True
    )

    # 設定 employee_id 作為唯一識別
    USERNAME_FIELD = 'employee_id'
    REQUIRED_FIELDS = ['username', 'password']

    class Meta:
        verbose_name_plural = "員工"

    def __str__(self):
        return self.employee_id

    def get_permissions(self):
        """取得角色對應的權限"""
        permissions = {
            'view_own_attendance': True,
            'apply_leave': True,
            'apply_overtime': True,
            'apply_makeup': True,
            'view_department_attendance': self.role in ['manager', 'hr_admin', 'ceo', 'system_admin'],
            'approve_subordinates': self.role in ['manager', 'hr_admin', 'ceo', 'system_admin'],
            'batch_approve': self.role in ['manager', 'hr_admin', 'ceo', 'system_admin'],
            'manage_employees': self.role in ['hr_admin', 'ceo', 'system_admin'],
            'manage_leave_balances': self.role in ['hr_admin', 'ceo', 'system_admin'],
            'manage_departments': self.role in ['hr_admin', 'ceo', 'system_admin'],
            'manage_policies': self.role in ['hr_admin', 'ceo', 'system_admin'],
            'export_data': self.role in ['manager', 'hr_admin', 'ceo', 'system_admin'],
            'system_admin': self.role == 'system_admin',
        }
        return permissions

    def is_manager_of(self, employee):
        """檢查是否為某員工的主管"""
        # 檢查直屬主管關係
        relations = EmpCompanyRel.objects.filter(employee_id=employee)
        for rel in relations:
            if rel.direct_manager == self:
                return True
        # 檢查部門主管關係
        if self.role == 'manager' and self.department and employee.department == self.department:
            return True
        return False
        

class Companies(models.Model):
    name = models.CharField(verbose_name=("公司名稱"), max_length=50)
    # 注意：欄位名為 address（與資料庫匹配），待遷移時改為 location
    address = models.TextField(verbose_name=("公司地址"))
    # 🔧 修正：使用 FloatField 以相容 SQLite（精確度足夠 GPS 座標）
    latitude = models.FloatField(
        verbose_name=("公司位置緯度"),
        help_text="緯度範圍：-90 到 90"
    )
    longitude = models.FloatField(
        verbose_name=("公司位置經度"),
        help_text="經度範圍：-180 到 180"
    )
    radius = models.FloatField(verbose_name=("GPS合法範圍半徑"), default=2000.0)

    class Meta:
        verbose_name_plural = "公司"


# =====================================================
# Phase 3 新增：部門管理模型
# =====================================================

class Departments(models.Model):
    """部門模型 - Phase 3 新增"""

    name = models.CharField(
        verbose_name="部門名稱",
        max_length=100
    )
    company_id = models.ForeignKey(
        Companies,
        on_delete=models.CASCADE,
        verbose_name="所屬公司",
        related_name="departments"
    )
    manager = models.ForeignKey(
        'Employees',
        on_delete=models.SET_NULL,
        verbose_name="部門主管",
        related_name="managed_departments",
        null=True,
        blank=True
    )
    parent_department = models.ForeignKey(
        'self',
        on_delete=models.SET_NULL,
        verbose_name="上級部門",
        related_name="sub_departments",
        null=True,
        blank=True
    )
    description = models.TextField(
        verbose_name="部門描述",
        blank=True,
        null=True
    )
    is_active = models.BooleanField(
        verbose_name="是否啟用",
        default=True
    )
    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="建立時間"
    )
    updated_at = models.DateTimeField(
        auto_now=True,
        verbose_name="更新時間"
    )

    class Meta:
        verbose_name = "部門"
        verbose_name_plural = "部門"
        ordering = ['company_id', 'name']
        unique_together = ['company_id', 'name']
        indexes = [
            models.Index(fields=['company_id', 'is_active']),
        ]

    def __str__(self):
        return f"{self.company_id.name} - {self.name}"

    def get_all_employees(self):
        """取得部門內所有員工"""
        return self.employees.filter(is_active=True)

    def get_employee_count(self):
        """取得部門員工數量"""
        return self.employees.count()


class WorkSchedule(models.Model):
    """工時設定表 - Phase 1 新增"""

    company_id = models.ForeignKey(
        Companies,
        on_delete=models.CASCADE,
        verbose_name="公司",
        related_name="work_schedules"
    )
    name = models.CharField(
        verbose_name="班表名稱",
        max_length=50,
        default="標準班"
    )
    work_start_time = models.TimeField(
        verbose_name="上班時間",
        default=time(9, 0)  # 09:00
    )
    work_end_time = models.TimeField(
        verbose_name="下班時間",
        default=time(18, 0)  # 18:00
    )
    standard_work_hours = models.DecimalField(
        verbose_name="標準工時（小時）",
        max_digits=4,
        decimal_places=2,
        default=Decimal('8.00')
    )
    lunch_break_minutes = models.IntegerField(
        verbose_name="午休時間（分鐘）",
        default=60
    )
    grace_period_minutes = models.IntegerField(
        verbose_name="遲到寬限時間（分鐘）",
        default=10,
        help_text="在此時間內打卡不算遲到"
    )
    is_default = models.BooleanField(
        verbose_name="是否為預設班表",
        default=False
    )
    is_active = models.BooleanField(
        verbose_name="是否啟用",
        default=True
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    class Meta:
        verbose_name_plural = "工時設定"
        ordering = ['company_id', 'name']
        unique_together = ['company_id', 'name']

    def __str__(self):
        return f"{self.company_id.name} - {self.name} ({self.work_start_time}-{self.work_end_time})"


class EmpCompanyRel(models.Model):
    employee_id = models.ForeignKey(Employees, on_delete=models.CASCADE, verbose_name=("員工編號"), related_name="employee", to_field="employee_id") # 設定反向關聯名稱
    company_id = models.ForeignKey(Companies, on_delete=models.CASCADE, verbose_name=("公司編號"), related_name="company")
    employment_status = models.BooleanField(verbose_name=("在職狀態"))
    hire_date = models.DateField(verbose_name=("入職日期"))
    leave_date = models.DateField(verbose_name=("離職日期"), null=True, blank=True)
    direct_manager = models.ForeignKey(
        Employees,
        on_delete=models.SET_NULL,
        verbose_name="直屬主管",
        related_name="direct_reports",
        to_field="employee_id",
        null=True,
        blank=True,
        help_text="由 HR 或總經理指定"
    )
    # Phase 1 新增：員工專屬班表
    work_schedule = models.ForeignKey(
        'WorkSchedule',
        on_delete=models.SET_NULL,
        verbose_name="員工班表",
        related_name="employees",
        null=True,
        blank=True,
        help_text="員工專屬班表，留空則使用公司預設"
    )

    class Meta:
        verbose_name_plural = "員工與公司關係"

class LeaveRecords(models.Model):
    """請假記錄表 - Phase 2 Week 4 增強版"""

    # 假別選項
    LEAVE_TYPES = [
        ('annual', '特休假'),
        ('sick', '病假'),
        ('personal', '事假'),
        ('marriage', '婚假'),
        ('bereavement', '喪假'),
        ('maternity', '產假'),
        ('paternity', '陪產假'),
        ('compensatory', '補休'),
    ]

    # 審批狀態
    STATUS_CHOICES = [
        ('pending', '待審批'),
        ('approved', '已批准'),
        ('rejected', '已拒絕'),
        ('cancelled', '已取消'),
    ]

    relation_id = models.ForeignKey(
        EmpCompanyRel,
        on_delete=models.CASCADE,
        verbose_name="關聯編號",
        related_name="leave_records"
    )
    leave_type = models.CharField(
        verbose_name="假別",
        max_length=20,
        choices=LEAVE_TYPES,
        default='annual'
    )
    start_time = models.DateTimeField(verbose_name="請假開始時間")
    end_time = models.DateTimeField(verbose_name="請假結束時間")
    leave_hours = models.DecimalField(
        verbose_name="請假總時數",
        max_digits=5,
        decimal_places=2
    )
    leave_reason = models.TextField(verbose_name="請假原因", blank=True, null=True)
    substitute_employee_id = models.ForeignKey(
        Employees,
        on_delete=models.SET_NULL,
        verbose_name="職務代理人",
        related_name="substitute_leaves",
        to_field="employee_id",
        blank=True,
        null=True
    )
    status = models.CharField(
        verbose_name="審批狀態",
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    attachments = models.JSONField(
        verbose_name="附件",
        blank=True,
        null=True,
        help_text="醫生證明、證書等附件的 URL 列表"
    )
    created_at = models.DateTimeField(verbose_name="建立時間", auto_now_add=True)
    updated_at = models.DateTimeField(verbose_name="更新時間", auto_now=True)

    class Meta:
        verbose_name_plural = "請假紀錄"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['relation_id', 'status']),
            models.Index(fields=['start_time']),
        ]

    def __str__(self):
        return f"{self.relation_id} - {self.get_leave_type_display()} - {self.start_time.date()}"


class AttendanceRecords(models.Model):
    relation_id = models.ForeignKey(EmpCompanyRel, on_delete=models.CASCADE, verbose_name=("關聯編號"), related_name="attendance_records")
    date = models.DateField(verbose_name=("考勤日期"))
    checkin_time = models.DateTimeField(verbose_name=("上班打卡時間"))
    checkout_time = models.DateTimeField(verbose_name=("下班打卡時間"))
    checkin_location = models.TextField(verbose_name=("上班打卡位置"))
    checkout_location = models.TextField(verbose_name=("下班打卡位置"))
    work_hours = models.DecimalField(verbose_name=("上班總時數"), max_digits=5, decimal_places=2)

    # Phase 1 新增：班表與遲到/早退欄位
    schedule = models.ForeignKey(
        'WorkSchedule',
        on_delete=models.SET_NULL,
        verbose_name="適用班表",
        related_name="attendance_records",
        null=True,
        blank=True
    )
    is_late = models.BooleanField(
        verbose_name="是否遲到",
        default=False
    )
    late_minutes = models.IntegerField(
        verbose_name="遲到分鐘數",
        default=0
    )
    is_early_leave = models.BooleanField(
        verbose_name="是否早退",
        default=False
    )
    early_leave_minutes = models.IntegerField(
        verbose_name="早退分鐘數",
        default=0
    )
    is_makeup = models.BooleanField(
        verbose_name="是否為補打卡",
        default=False,
        help_text="此記錄是否由補打卡產生/修改"
    )

    class Meta:
        verbose_name_plural = "出缺勤紀錄"
        indexes = [
            models.Index(fields=['relation_id', 'date']),
            models.Index(fields=['is_late']),
        ]


class ApprovalRecords(models.Model):
    """審批記錄表 - Phase 2 Week 4 新增"""

    # 審批狀態
    STATUS_CHOICES = [
        ('pending', '待審批'),
        ('approved', '已批准'),
        ('rejected', '已拒絕'),
    ]

    leave_id = models.ForeignKey(
        LeaveRecords,
        on_delete=models.CASCADE,
        verbose_name="請假 ID",
        related_name="approvals"
    )
    approver_id = models.ForeignKey(
        Employees,
        on_delete=models.CASCADE,
        verbose_name="審批人",
        related_name="approval_records",
        to_field="employee_id"
    )
    approval_level = models.IntegerField(
        verbose_name="審批層級",
        default=1,
        help_text="1=主管, 2=HR, 3=總經理"
    )
    status = models.CharField(
        verbose_name="審批狀態",
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    comment = models.TextField(verbose_name="審批意見", blank=True, null=True)
    approved_at = models.DateTimeField(verbose_name="審批時間", blank=True, null=True)
    created_at = models.DateTimeField(verbose_name="建立時間", auto_now_add=True)

    class Meta:
        verbose_name_plural = "審批記錄"
        ordering = ['approval_level', '-created_at']
        indexes = [
            models.Index(fields=['leave_id']),
            models.Index(fields=['approver_id', 'status']),
        ]

    def __str__(self):
        return f"審批 #{self.id} - {self.get_status_display()} - Level {self.approval_level}"


class LeaveBalances(models.Model):
    """假別額度表 - Phase 2 Week 4 新增"""

    employee_id = models.ForeignKey(
        Employees,
        on_delete=models.CASCADE,
        verbose_name="員工編號",
        related_name="leave_balances",
        to_field="employee_id"
    )
    year = models.IntegerField(verbose_name="年度")
    leave_type = models.CharField(
        verbose_name="假別",
        max_length=20,
        choices=LeaveRecords.LEAVE_TYPES
    )
    total_hours = models.DecimalField(
        verbose_name="總額度（小時）",
        max_digits=6,
        decimal_places=2,
        default=0.00
    )
    used_hours = models.DecimalField(
        verbose_name="已使用（小時）",
        max_digits=6,
        decimal_places=2,
        default=0.00
    )
    remaining_hours = models.DecimalField(
        verbose_name="剩餘（小時）",
        max_digits=6,
        decimal_places=2,
        default=0.00
    )
    updated_at = models.DateTimeField(verbose_name="更新時間", auto_now=True)

    class Meta:
        verbose_name_plural = "假別額度"
        unique_together = ['employee_id', 'year', 'leave_type']
        ordering = ['year', 'leave_type']
        indexes = [
            models.Index(fields=['employee_id', 'year']),
        ]

    def __str__(self):
        return f"{self.employee_id} - {self.year} - {self.get_leave_type_display()}"

    def save(self, *args, **kwargs):
        """覆寫 save 方法，自動計算剩餘時數"""
        self.remaining_hours = self.total_hours - self.used_hours
        super().save(*args, **kwargs)


class ManagerialRelationship(models.Model):
    """主管關係表 - 用於建立員工與主管的階層關係"""

    employee_id = models.ForeignKey(
        Employees,
        on_delete=models.CASCADE,
        verbose_name="員工",
        related_name="manager_relationships",
        to_field="employee_id"
    )
    manager_id = models.ForeignKey(
        Employees,
        on_delete=models.CASCADE,
        verbose_name="直屬主管",
        related_name="subordinates",
        to_field="employee_id"
    )
    company_id = models.ForeignKey(
        Companies,
        on_delete=models.CASCADE,
        verbose_name="公司",
        null=True,
        blank=True
    )
    effective_date = models.DateField(verbose_name="生效日期")
    end_date = models.DateField(verbose_name="結束日期", null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    created_by = models.ForeignKey(
        Employees,
        on_delete=models.SET_NULL,
        related_name="created_relationships",
        to_field="employee_id",
        null=True,
        verbose_name="建立者"
    )

    class Meta:
        verbose_name_plural = "主管關係"
        ordering = ['-effective_date']
        indexes = [
            models.Index(fields=['employee_id', 'effective_date']),
        ]

    def __str__(self):
        return f"{self.employee_id.username} → {self.manager_id.username}"


class ApprovalPolicy(models.Model):
    """審批政策表 - 定義不同請假天數的審批層級規則"""

    policy_name = models.CharField(verbose_name="政策名稱", max_length=100)
    company_id = models.ForeignKey(
        Companies,
        on_delete=models.CASCADE,
        verbose_name="適用公司",
        null=True,
        blank=True,
        help_text="留空表示適用所有公司"
    )
    min_days = models.FloatField(
        verbose_name="最小天數",
        help_text="包含此天數"
    )
    max_days = models.FloatField(
        verbose_name="最大天數",
        null=True,
        blank=True,
        help_text="包含此天數，留空表示無上限"
    )
    approval_levels = models.JSONField(
        verbose_name="審批層級",
        help_text='例如：[{"level": 1, "role": "manager", "description": "直屬主管"}, {"level": 2, "role": "hr", "description": "人資部門"}]'
    )
    is_active = models.BooleanField(default=True, verbose_name="是否啟用")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")
    created_by = models.ForeignKey(
        Employees,
        on_delete=models.SET_NULL,
        to_field="employee_id",
        null=True,
        verbose_name="建立者"
    )

    class Meta:
        verbose_name_plural = "審批政策"
        ordering = ['min_days']

    def __str__(self):
        max_text = f"{self.max_days}" if self.max_days else "無上限"
        return f"{self.policy_name} ({self.min_days}-{max_text} 天)"


# =====================================================
# Phase 1 新增：補打卡相關模型
# =====================================================

class MakeupClockRequest(models.Model):
    """補打卡申請表 - Phase 1 新增"""

    MAKEUP_TYPE_CHOICES = [
        ('checkin', '補上班打卡'),
        ('checkout', '補下班打卡'),
        ('both', '補全日打卡'),
    ]

    STATUS_CHOICES = [
        ('pending', '待審批'),
        ('approved', '已批准'),
        ('rejected', '已拒絕'),
    ]

    relation_id = models.ForeignKey(
        EmpCompanyRel,
        on_delete=models.CASCADE,
        verbose_name="員工-公司關聯",
        related_name="makeup_requests"
    )
    date = models.DateField(verbose_name="補打卡日期")
    makeup_type = models.CharField(
        verbose_name="補打卡類型",
        max_length=20,
        choices=MAKEUP_TYPE_CHOICES,
        default='checkin'
    )
    original_checkin_time = models.DateTimeField(
        verbose_name="原上班打卡時間",
        null=True,
        blank=True
    )
    original_checkout_time = models.DateTimeField(
        verbose_name="原下班打卡時間",
        null=True,
        blank=True
    )
    requested_checkin_time = models.DateTimeField(
        verbose_name="申請的上班時間",
        null=True,
        blank=True
    )
    requested_checkout_time = models.DateTimeField(
        verbose_name="申請的下班時間",
        null=True,
        blank=True
    )
    reason = models.TextField(verbose_name="補打卡原因")
    status = models.CharField(
        verbose_name="審批狀態",
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    attendance_record = models.ForeignKey(
        AttendanceRecords,
        on_delete=models.SET_NULL,
        verbose_name="關聯的打卡記錄",
        related_name="makeup_requests",
        null=True,
        blank=True
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="申請時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    class Meta:
        verbose_name_plural = "補打卡申請"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['relation_id', 'status']),
            models.Index(fields=['date']),
        ]

    def __str__(self):
        return f"{self.relation_id.employee_id.username} - {self.date} - {self.get_makeup_type_display()}"


class MakeupClockApproval(models.Model):
    """補打卡審批記錄 - Phase 1 新增"""

    STATUS_CHOICES = [
        ('pending', '待審批'),
        ('approved', '已批准'),
        ('rejected', '已拒絕'),
    ]

    request_id = models.ForeignKey(
        MakeupClockRequest,
        on_delete=models.CASCADE,
        verbose_name="補打卡申請",
        related_name="approvals"
    )
    approver_id = models.ForeignKey(
        Employees,
        on_delete=models.CASCADE,
        verbose_name="審批人",
        related_name="makeup_approvals",
        to_field="employee_id"
    )
    approval_level = models.IntegerField(
        verbose_name="審批層級",
        default=1,
        help_text="1=主管"
    )
    status = models.CharField(
        verbose_name="審批狀態",
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    comment = models.TextField(verbose_name="審批意見", blank=True, null=True)
    approved_at = models.DateTimeField(verbose_name="審批時間", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")

    class Meta:
        verbose_name_plural = "補打卡審批記錄"
        ordering = ['approval_level', '-created_at']

    def __str__(self):
        return f"補打卡審批 #{self.id} - {self.get_status_display()}"


class MakeupClockQuota(models.Model):
    """補打卡年度額度 - Phase 1 新增"""

    employee_id = models.ForeignKey(
        Employees,
        on_delete=models.CASCADE,
        verbose_name="員工",
        related_name="makeup_quotas",
        to_field="employee_id"
    )
    year = models.IntegerField(verbose_name="年度")
    total_count = models.IntegerField(
        verbose_name="年度總額度",
        default=24,
        help_text="每年可補打卡次數上限"
    )
    used_count = models.IntegerField(
        verbose_name="已使用次數",
        default=0
    )
    remaining_count = models.IntegerField(
        verbose_name="剩餘次數",
        default=24
    )
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    class Meta:
        verbose_name_plural = "補打卡額度"
        unique_together = ['employee_id', 'year']

    def save(self, *args, **kwargs):
        """自動計算剩餘次數"""
        self.remaining_count = self.total_count - self.used_count
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.employee_id.username} - {self.year} 年 ({self.remaining_count}/{self.total_count})"


# =====================================================
# Phase 2 新增：加班管理模型
# =====================================================

class OvertimeRecords(models.Model):
    """加班記錄表 - Phase 2 新增"""

    COMPENSATION_CHOICES = [
        ('pay', '加班費'),
        ('compensatory', '補休'),
        ('mixed', '混合'),
    ]

    STATUS_CHOICES = [
        ('pending', '待審批'),
        ('approved', '已批准'),
        ('rejected', '已拒絕'),
        ('cancelled', '已取消'),
    ]

    relation_id = models.ForeignKey(
        EmpCompanyRel,
        on_delete=models.CASCADE,
        verbose_name="員工-公司關聯",
        related_name="overtime_records"
    )
    date = models.DateField(verbose_name="加班日期")
    start_time = models.TimeField(verbose_name="開始時間")
    end_time = models.TimeField(verbose_name="結束時間")
    overtime_hours = models.DecimalField(
        verbose_name="加班時數",
        max_digits=5,
        decimal_places=2
    )
    reason = models.TextField(verbose_name="加班原因")
    compensation_type = models.CharField(
        verbose_name="補償方式",
        max_length=20,
        choices=COMPENSATION_CHOICES,
        default='compensatory'
    )
    compensatory_hours = models.DecimalField(
        verbose_name="補休時數",
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="選擇補休時的時數"
    )
    pay_hours = models.DecimalField(
        verbose_name="加班費時數",
        max_digits=5,
        decimal_places=2,
        default=0,
        help_text="選擇加班費的時數"
    )
    status = models.CharField(
        verbose_name="審批狀態",
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="申請時間")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新時間")

    class Meta:
        verbose_name = "加班記錄"
        verbose_name_plural = "加班記錄"
        ordering = ['-date', '-created_at']
        indexes = [
            models.Index(fields=['relation_id', 'status'], name='overtime_rel_status_idx'),
            models.Index(fields=['date'], name='overtime_date_idx'),
        ]

    def __str__(self):
        return f"{self.relation_id.employee_id.username} - {self.date} ({self.overtime_hours}h)"


class OvertimeApproval(models.Model):
    """加班審批記錄 - Phase 2 新增"""

    STATUS_CHOICES = [
        ('pending', '待審批'),
        ('approved', '已批准'),
        ('rejected', '已拒絕'),
    ]

    overtime_id = models.ForeignKey(
        OvertimeRecords,
        on_delete=models.CASCADE,
        verbose_name="加班記錄",
        related_name="approvals"
    )
    approver_id = models.ForeignKey(
        Employees,
        on_delete=models.CASCADE,
        verbose_name="審批人",
        related_name="overtime_approvals",
        to_field="employee_id"
    )
    approval_level = models.IntegerField(
        verbose_name="審批層級",
        default=1,
        help_text="1=主管"
    )
    status = models.CharField(
        verbose_name="審批狀態",
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending'
    )
    comment = models.TextField(verbose_name="審批意見", blank=True, null=True)
    approved_at = models.DateTimeField(verbose_name="審批時間", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")

    class Meta:
        verbose_name = "加班審批記錄"
        verbose_name_plural = "加班審批記錄"
        ordering = ['approval_level', '-created_at']

    def __str__(self):
        return f"審批 #{self.id} - {self.overtime_id} ({self.get_status_display()})"


# =====================================================
# Phase 2 新增：通知系統模型
# =====================================================

class Notifications(models.Model):
    """通知記錄表 - Phase 2 新增"""

    NOTIFICATION_TYPES = [
        ('approval_pending', '待審批通知'),
        ('approval_result', '審批結果通知'),
        ('leave_balance_warning', '假別額度警告'),
        ('clock_reminder', '打卡提醒'),
        ('overtime_reminder', '加班提醒'),
        ('system', '系統通知'),
    ]

    recipient_id = models.ForeignKey(
        Employees,
        on_delete=models.CASCADE,
        verbose_name="接收人",
        related_name="notifications",
        to_field="employee_id"
    )
    notification_type = models.CharField(
        verbose_name="通知類型",
        max_length=30,
        choices=NOTIFICATION_TYPES
    )
    title = models.CharField(verbose_name="標題", max_length=200)
    content = models.TextField(verbose_name="內容")
    related_model = models.CharField(
        verbose_name="關聯模型",
        max_length=50,
        blank=True,
        null=True,
        help_text="如：LeaveRecords, OvertimeRecords"
    )
    related_id = models.IntegerField(
        verbose_name="關聯 ID",
        blank=True,
        null=True
    )
    is_read = models.BooleanField(verbose_name="是否已讀", default=False)
    read_at = models.DateTimeField(verbose_name="讀取時間", blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="建立時間")

    class Meta:
        verbose_name = "通知"
        verbose_name_plural = "通知記錄"
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['recipient_id', 'is_read'], name='notification_read_idx'),
            models.Index(fields=['notification_type'], name='notification_type_idx'),
        ]

    def __str__(self):
        return f"{self.recipient_id.username} - {self.title} ({'已讀' if self.is_read else '未讀'})"

