from django.db import models
from django.contrib.auth.models import AbstractUser


class Employees(AbstractUser):
    employee_id = models.CharField(verbose_name="員工編號", max_length=20, unique=True, primary_key=True)
    phone = models.TextField(verbose_name="員工電話", blank=True, null=True)
    address = models.TextField(verbose_name="員工地址", blank=True, null=True)
    email = models.EmailField(verbose_name="員工電子郵件", blank=True, null=True)

    # 設定 employee_id 作為唯一識別
    USERNAME_FIELD = 'employee_id'
    REQUIRED_FIELDS = ['username', 'password']

    class Meta:
        verbose_name_plural = "員工"

    def __str__(self):
        return self.employee_id
        

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

    class Meta:
        verbose_name_plural = "出缺勤紀錄"


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

