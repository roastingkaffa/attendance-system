# Generated manually for Phase 3

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('attendance', '0008_phase2_overtime_notifications'),
    ]

    operations = [
        # 1. 建立 Departments 模型
        migrations.CreateModel(
            name='Departments',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(max_length=100, verbose_name='部門名稱')),
                ('description', models.TextField(blank=True, null=True, verbose_name='部門描述')),
                ('is_active', models.BooleanField(default=True, verbose_name='是否啟用')),
                ('created_at', models.DateTimeField(auto_now_add=True, verbose_name='建立時間')),
                ('updated_at', models.DateTimeField(auto_now=True, verbose_name='更新時間')),
                ('company_id', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='departments',
                    to='attendance.companies',
                    verbose_name='所屬公司'
                )),
                ('parent_department', models.ForeignKey(
                    blank=True,
                    null=True,
                    on_delete=django.db.models.deletion.SET_NULL,
                    related_name='sub_departments',
                    to='attendance.departments',
                    verbose_name='上級部門'
                )),
            ],
            options={
                'verbose_name': '部門',
                'verbose_name_plural': '部門',
                'ordering': ['company_id', 'name'],
            },
        ),

        # 2. 新增 Employees.role 欄位
        migrations.AddField(
            model_name='employees',
            name='role',
            field=models.CharField(
                choices=[
                    ('employee', '一般員工'),
                    ('manager', '部門主管'),
                    ('hr_admin', 'HR 管理員'),
                    ('ceo', '總經理'),
                    ('system_admin', '系統管理員'),
                ],
                default='employee',
                max_length=20,
                verbose_name='角色'
            ),
        ),

        # 3. 新增 Employees.department 欄位
        migrations.AddField(
            model_name='employees',
            name='department',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='employees',
                to='attendance.departments',
                verbose_name='所屬部門'
            ),
        ),

        # 4. 新增 Departments.manager 欄位
        migrations.AddField(
            model_name='departments',
            name='manager',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='managed_departments',
                to='attendance.employees',
                verbose_name='部門主管'
            ),
        ),

        # 5. 新增 unique_together 約束
        migrations.AlterUniqueTogether(
            name='departments',
            unique_together={('company_id', 'name')},
        ),

        # 6. 新增索引
        migrations.AddIndex(
            model_name='departments',
            index=models.Index(fields=['company_id', 'is_active'], name='attendance__company_99c3f1_idx'),
        ),
    ]
