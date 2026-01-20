# Phase 1: 工時設定與補打卡功能
# Generated manually for Phase 1 implementation

import datetime
from decimal import Decimal
from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0006_phase2_week4_approval_system'),
    ]

    operations = [
        # =====================================================
        # 1. 建立 WorkSchedule 模型（工時設定）
        # =====================================================
        migrations.CreateModel(
            name='WorkSchedule',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(default='標準班', max_length=50, verbose_name='班表名稱')),
                ('work_start_time', models.TimeField(default=datetime.time(9, 0), verbose_name='上班時間')),
                ('work_end_time', models.TimeField(default=datetime.time(18, 0), verbose_name='下班時間')),
                ('standard_work_hours', models.DecimalField(decimal_places=2, default=Decimal('8.00'), max_digits=4, verbose_name='標準工時（小時）')),
                ('lunch_break_minutes', models.IntegerField(default=60, verbose_name='午休時間（分鐘）')),
                ('grace_period_minutes', models.IntegerField(default=10, help_text='在此時間內打卡不算遲到', verbose_name='遲到寬限時間（分鐘）')),
                ('is_default', models.BooleanField(default=False, verbose_name='是否為預設班表')),
                ('is_active', models.BooleanField(default=True, verbose_name='是否啟用')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='建立時間')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新時間')),
                ('company_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='work_schedules',
                    to='attendance.companies',
                    verbose_name='公司'
                )),
            ],
            options={
                'verbose_name_plural': '工時設定',
                'ordering': ['company_id', 'name'],
                'unique_together': {('company_id', 'name')},
            },
        ),

        # =====================================================
        # 2. AttendanceRecords 新增遲到/早退欄位
        # =====================================================
        migrations.AddField(
            model_name='attendancerecords',
            name='schedule',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='attendance_records',
                to='attendance.workschedule',
                verbose_name='適用班表'
            ),
        ),
        migrations.AddField(
            model_name='attendancerecords',
            name='is_late',
            field=models.BooleanField(default=False, verbose_name='是否遲到'),
        ),
        migrations.AddField(
            model_name='attendancerecords',
            name='late_minutes',
            field=models.IntegerField(default=0, verbose_name='遲到分鐘數'),
        ),
        migrations.AddField(
            model_name='attendancerecords',
            name='is_early_leave',
            field=models.BooleanField(default=False, verbose_name='是否早退'),
        ),
        migrations.AddField(
            model_name='attendancerecords',
            name='early_leave_minutes',
            field=models.IntegerField(default=0, verbose_name='早退分鐘數'),
        ),
        migrations.AddField(
            model_name='attendancerecords',
            name='is_makeup',
            field=models.BooleanField(default=False, help_text='此記錄是否由補打卡產生/修改', verbose_name='是否為補打卡'),
        ),

        # =====================================================
        # 3. EmpCompanyRel 新增員工班表關聯
        # =====================================================
        migrations.AddField(
            model_name='empcompanyrel',
            name='work_schedule',
            field=models.ForeignKey(
                blank=True, null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='employees',
                to='attendance.workschedule',
                verbose_name='員工班表',
                help_text='員工專屬班表，留空則使用公司預設'
            ),
        ),

        # =====================================================
        # 4. 建立 MakeupClockRequest 模型（補打卡申請）
        # =====================================================
        migrations.CreateModel(
            name='MakeupClockRequest',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('date', models.DateField(verbose_name='補打卡日期')),
                ('makeup_type', models.CharField(
                    choices=[('checkin', '補上班打卡'), ('checkout', '補下班打卡'), ('both', '補全日打卡')],
                    default='checkin', max_length=20, verbose_name='補打卡類型'
                )),
                ('original_checkin_time', models.DateTimeField(blank=True, null=True, verbose_name='原上班打卡時間')),
                ('original_checkout_time', models.DateTimeField(blank=True, null=True, verbose_name='原下班打卡時間')),
                ('requested_checkin_time', models.DateTimeField(blank=True, null=True, verbose_name='申請的上班時間')),
                ('requested_checkout_time', models.DateTimeField(blank=True, null=True, verbose_name='申請的下班時間')),
                ('reason', models.TextField(verbose_name='補打卡原因')),
                ('status', models.CharField(
                    choices=[('pending', '待審批'), ('approved', '已批准'), ('rejected', '已拒絕')],
                    default='pending', max_length=20, verbose_name='審批狀態'
                )),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='申請時間')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新時間')),
                ('relation_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='makeup_requests',
                    to='attendance.empcompanyrel',
                    verbose_name='員工-公司關聯'
                )),
                ('attendance_record', models.ForeignKey(
                    blank=True, null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='makeup_requests',
                    to='attendance.attendancerecords',
                    verbose_name='關聯的打卡記錄'
                )),
            ],
            options={
                'verbose_name_plural': '補打卡申請',
                'ordering': ['-created_at'],
            },
        ),

        # =====================================================
        # 5. 建立 MakeupClockApproval 模型（補打卡審批）
        # =====================================================
        migrations.CreateModel(
            name='MakeupClockApproval',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('approval_level', models.IntegerField(default=1, help_text='1=主管', verbose_name='審批層級')),
                ('status', models.CharField(
                    choices=[('pending', '待審批'), ('approved', '已批准'), ('rejected', '已拒絕')],
                    default='pending', max_length=20, verbose_name='審批狀態'
                )),
                ('comment', models.TextField(blank=True, null=True, verbose_name='審批意見')),
                ('approved_at', models.DateTimeField(blank=True, null=True, verbose_name='審批時間')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='建立時間')),
                ('request_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='approvals',
                    to='attendance.makeupclockrequest',
                    verbose_name='補打卡申請'
                )),
                ('approver_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='makeup_approvals',
                    to=settings.AUTH_USER_MODEL,
                    to_field='employee_id',
                    verbose_name='審批人'
                )),
            ],
            options={
                'verbose_name_plural': '補打卡審批記錄',
                'ordering': ['approval_level', '-created_at'],
            },
        ),

        # =====================================================
        # 6. 建立 MakeupClockQuota 模型（補打卡額度）
        # =====================================================
        migrations.CreateModel(
            name='MakeupClockQuota',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField(verbose_name='年度')),
                ('total_count', models.IntegerField(default=24, help_text='每年可補打卡次數上限', verbose_name='年度總額度')),
                ('used_count', models.IntegerField(default=0, verbose_name='已使用次數')),
                ('remaining_count', models.IntegerField(default=24, verbose_name='剩餘次數')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新時間')),
                ('employee_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='makeup_quotas',
                    to=settings.AUTH_USER_MODEL,
                    to_field='employee_id',
                    verbose_name='員工'
                )),
            ],
            options={
                'verbose_name_plural': '補打卡額度',
                'unique_together': {('employee_id', 'year')},
            },
        ),

        # =====================================================
        # 7. 新增索引
        # =====================================================
        migrations.AddIndex(
            model_name='attendancerecords',
            index=models.Index(fields=['relation_id', 'date'], name='attendance__rel_date_idx'),
        ),
        migrations.AddIndex(
            model_name='attendancerecords',
            index=models.Index(fields=['is_late'], name='attendance__is_late_idx'),
        ),
        migrations.AddIndex(
            model_name='makeupclockrequest',
            index=models.Index(fields=['relation_id', 'status'], name='makeup_req_rel_status_idx'),
        ),
        migrations.AddIndex(
            model_name='makeupclockrequest',
            index=models.Index(fields=['date'], name='makeup_req_date_idx'),
        ),
    ]
