# Generated manually for Phase 2 Week 4 - Approval System
# Date: 2025-11-21

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0005_alter_attendancerecords_options_and_more'),
    ]

    operations = [
        # 修改 LeaveRecords 模型
        migrations.AddField(
            model_name='leaverecords',
            name='leave_type',
            field=models.CharField(
                choices=[('annual', '特休假'), ('sick', '病假'), ('personal', '事假'),
                        ('marriage', '婚假'), ('bereavement', '喪假'), ('maternity', '產假'),
                        ('paternity', '陪產假'), ('compensatory', '補休')],
                default='annual',
                max_length=20,
                verbose_name='假別'
            ),
        ),
        migrations.AddField(
            model_name='leaverecords',
            name='status',
            field=models.CharField(
                choices=[('pending', '待審批'), ('approved', '已批准'),
                        ('rejected', '已拒絕'), ('cancelled', '已取消')],
                default='pending',
                max_length=20,
                verbose_name='審批狀態'
            ),
        ),
        migrations.AddField(
            model_name='leaverecords',
            name='substitute_employee_id',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='substitute_leaves',
                to=settings.AUTH_USER_MODEL,
                to_field='employee_id',
                verbose_name='職務代理人'
            ),
        ),
        migrations.AddField(
            model_name='leaverecords',
            name='attachments',
            field=models.JSONField(
                blank=True,
                null=True,
                help_text='醫生證明、證書等附件的 URL 列表',
                verbose_name='附件'
            ),
        ),
        migrations.AddField(
            model_name='leaverecords',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, verbose_name='建立時間', null=True),
        ),
        migrations.AddField(
            model_name='leaverecords',
            name='updated_at',
            field=models.DateTimeField(auto_now=True, verbose_name='更新時間'),
        ),

        # 添加索引
        migrations.AddIndex(
            model_name='leaverecords',
            index=models.Index(fields=['relation_id', 'status'], name='attendance_l_relatio_idx'),
        ),
        migrations.AddIndex(
            model_name='leaverecords',
            index=models.Index(fields=['start_time'], name='attendance_l_start_t_idx'),
        ),

        # 修改 LeaveRecords 的 ordering
        migrations.AlterModelOptions(
            name='leaverecords',
            options={'ordering': ['-created_at'], 'verbose_name_plural': '請假紀錄'},
        ),

        # 新增 ApprovalRecords 模型
        migrations.CreateModel(
            name='ApprovalRecords',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('approval_level', models.IntegerField(default=1, help_text='1=主管, 2=HR, 3=總經理', verbose_name='審批層級')),
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
                    related_name='approval_records',
                    to=settings.AUTH_USER_MODEL,
                    to_field='employee_id',
                    verbose_name='審批人'
                )),
                ('leave_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='approvals',
                    to='attendance.leaverecords',
                    verbose_name='請假 ID'
                )),
            ],
            options={
                'verbose_name_plural': '審批記錄',
                'ordering': ['approval_level', '-created_at'],
            },
        ),

        # 添加 ApprovalRecords 索引
        migrations.AddIndex(
            model_name='approvalrecords',
            index=models.Index(fields=['leave_id'], name='attendance_a_leave_i_idx'),
        ),
        migrations.AddIndex(
            model_name='approvalrecords',
            index=models.Index(fields=['approver_id', 'status'], name='attendance_a_approve_idx'),
        ),

        # 新增 LeaveBalances 模型
        migrations.CreateModel(
            name='LeaveBalances',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField(verbose_name='年度')),
                ('leave_type', models.CharField(
                    choices=[('annual', '特休假'), ('sick', '病假'), ('personal', '事假'),
                            ('marriage', '婚假'), ('bereavement', '喪假'), ('maternity', '產假'),
                            ('paternity', '陪產假'), ('compensatory', '補休')],
                    max_length=20,
                    verbose_name='假別'
                )),
                ('total_hours', models.DecimalField(decimal_places=2, default=0.0, max_digits=6, verbose_name='總額度（小時）')),
                ('used_hours', models.DecimalField(decimal_places=2, default=0.0, max_digits=6, verbose_name='已使用（小時）')),
                ('remaining_hours', models.DecimalField(decimal_places=2, default=0.0, max_digits=6, verbose_name='剩餘（小時）')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新時間')),
                ('employee_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='leave_balances',
                    to=settings.AUTH_USER_MODEL,
                    to_field='employee_id',
                    verbose_name='員工編號'
                )),
            ],
            options={
                'verbose_name_plural': '假別額度',
                'ordering': ['year', 'leave_type'],
                'unique_together': {('employee_id', 'year', 'leave_type')},
            },
        ),

        # 添加 LeaveBalances 索引
        migrations.AddIndex(
            model_name='leavebalances',
            index=models.Index(fields=['employee_id', 'year'], name='attendance_l_employe_idx'),
        ),
    ]
