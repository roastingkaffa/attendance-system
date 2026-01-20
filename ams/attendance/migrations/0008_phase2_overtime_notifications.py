# Phase 2: 加班管理與通知系統
# Generated manually for Phase 2 implementation

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0007_phase1_work_schedule_and_makeup'),
    ]

    operations = [
        # =====================================================
        # 1. 建立 OvertimeRecords 模型（加班記錄）
        # =====================================================
        migrations.CreateModel(
            name='OvertimeRecords',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(verbose_name='加班日期')),
                ('start_time', models.TimeField(verbose_name='開始時間')),
                ('end_time', models.TimeField(verbose_name='結束時間')),
                ('overtime_hours', models.DecimalField(decimal_places=2, max_digits=5, verbose_name='加班時數')),
                ('reason', models.TextField(verbose_name='加班原因')),
                ('compensation_type', models.CharField(
                    choices=[('pay', '加班費'), ('compensatory', '補休'), ('mixed', '混合')],
                    default='compensatory',
                    max_length=20,
                    verbose_name='補償方式'
                )),
                ('compensatory_hours', models.DecimalField(
                    decimal_places=2,
                    default=0,
                    help_text='選擇補休時的時數',
                    max_digits=5,
                    verbose_name='補休時數'
                )),
                ('pay_hours', models.DecimalField(
                    decimal_places=2,
                    default=0,
                    help_text='選擇加班費的時數',
                    max_digits=5,
                    verbose_name='加班費時數'
                )),
                ('status', models.CharField(
                    choices=[('pending', '待審批'), ('approved', '已批准'), ('rejected', '已拒絕'), ('cancelled', '已取消')],
                    default='pending',
                    max_length=20,
                    verbose_name='審批狀態'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='申請時間')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新時間')),
                ('relation_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='overtime_records',
                    to='attendance.empcompanyrel',
                    verbose_name='員工-公司關聯'
                )),
            ],
            options={
                'verbose_name': '加班記錄',
                'verbose_name_plural': '加班記錄',
                'ordering': ['-date', '-created_at'],
            },
        ),

        # =====================================================
        # 2. 建立 OvertimeApproval 模型（加班審批）
        # =====================================================
        migrations.CreateModel(
            name='OvertimeApproval',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('approval_level', models.IntegerField(default=1, help_text='1=主管', verbose_name='審批層級')),
                ('status', models.CharField(
                    choices=[('pending', '待審批'), ('approved', '已批准'), ('rejected', '已拒絕')],
                    default='pending',
                    max_length=20,
                    verbose_name='審批狀態'
                )),
                ('comment', models.TextField(blank=True, null=True, verbose_name='審批意見')),
                ('approved_at', models.DateTimeField(blank=True, null=True, verbose_name='審批時間')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='建立時間')),
                ('approver_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='overtime_approvals',
                    to=settings.AUTH_USER_MODEL,
                    to_field='employee_id',
                    verbose_name='審批人'
                )),
                ('overtime_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='approvals',
                    to='attendance.overtimerecords',
                    verbose_name='加班記錄'
                )),
            ],
            options={
                'verbose_name': '加班審批記錄',
                'verbose_name_plural': '加班審批記錄',
                'ordering': ['approval_level', '-created_at'],
            },
        ),

        # =====================================================
        # 3. 建立 Notifications 模型（通知）
        # =====================================================
        migrations.CreateModel(
            name='Notifications',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('notification_type', models.CharField(
                    choices=[
                        ('approval_pending', '待審批通知'),
                        ('approval_result', '審批結果通知'),
                        ('leave_balance_warning', '假別額度警告'),
                        ('clock_reminder', '打卡提醒'),
                        ('overtime_reminder', '加班提醒'),
                        ('system', '系統通知'),
                    ],
                    max_length=30,
                    verbose_name='通知類型'
                )),
                ('title', models.CharField(max_length=200, verbose_name='標題')),
                ('content', models.TextField(verbose_name='內容')),
                ('related_model', models.CharField(
                    blank=True,
                    help_text='如：LeaveRecords, OvertimeRecords',
                    max_length=50,
                    null=True,
                    verbose_name='關聯模型'
                )),
                ('related_id', models.IntegerField(blank=True, null=True, verbose_name='關聯 ID')),
                ('is_read', models.BooleanField(default=False, verbose_name='是否已讀')),
                ('read_at', models.DateTimeField(blank=True, null=True, verbose_name='讀取時間')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='建立時間')),
                ('recipient_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='notifications',
                    to=settings.AUTH_USER_MODEL,
                    to_field='employee_id',
                    verbose_name='接收人'
                )),
            ],
            options={
                'verbose_name': '通知',
                'verbose_name_plural': '通知記錄',
                'ordering': ['-created_at'],
            },
        ),

        # =====================================================
        # 4. 新增索引
        # =====================================================
        migrations.AddIndex(
            model_name='overtimerecords',
            index=models.Index(fields=['relation_id', 'status'], name='overtime_rel_status_idx'),
        ),
        migrations.AddIndex(
            model_name='overtimerecords',
            index=models.Index(fields=['date'], name='overtime_date_idx'),
        ),
        migrations.AddIndex(
            model_name='notifications',
            index=models.Index(fields=['recipient_id', 'is_read'], name='notification_read_idx'),
        ),
        migrations.AddIndex(
            model_name='notifications',
            index=models.Index(fields=['notification_type'], name='notification_type_idx'),
        ),
    ]
