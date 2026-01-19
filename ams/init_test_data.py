#!/usr/bin/env python3
"""
初始化測試資料腳本
Phase 2 Week 4 - Approval System Testing
"""

import os
import sys
import django
from datetime import datetime, date

# 設置 Django 環境
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ams.settings')
sys.path.insert(0, '/home/roc/workspace/Human-Resources/attendance-system/ams')

# 使用 SQLite 測試資料庫
os.environ['DJANGO_SETTINGS_MODULE'] = 'test_settings'
sys.path.insert(0, '/tmp')

django.setup()

from attendance.models import Employees, Companies, EmpCompanyRel, LeaveBalances

def create_test_data():
    """建立測試資料"""

    print("=" * 50)
    print("開始建立測試資料...")
    print("=" * 50)

    # 1. 建立公司
    print("\n1. 建立測試公司...")
    company, created = Companies.objects.get_or_create(
        name='宏全國際',
        defaults={
            'address': '台北市信義區信義路五段7號',
            'latitude': 25.033408,
            'longitude': 121.564099,
            'radius': 100.00,
        }
    )
    print(f"   公司: {company.name} {'(新建)' if created else '(已存在)'}")

    # 2. 建立測試員工
    print("\n2. 建立測試員工...")

    # 員工 (申請人)
    emp1, created = Employees.objects.get_or_create(
        employee_id='EMP001',
        defaults={
            'username': '張小明',
            'phone': '0912345678',
            'address': '台北市中山區',
            'email': 'emp001@example.com',
        }
    )
    if created:
        emp1.set_password('password123')
        emp1.save()
    print(f"   員工: {emp1.username} (EMP001) {'(新建)' if created else '(已存在)'}")

    # 主管 (Level 1 審批人)
    mgr1, created = Employees.objects.get_or_create(
        employee_id='MGR001',
        defaults={
            'username': '王經理',
            'phone': '0922222222',
            'address': '台北市大安區',
            'email': 'mgr001@example.com',
        }
    )
    if created:
        mgr1.set_password('password123')
        mgr1.save()
    print(f"   主管: {mgr1.username} (MGR001) {'(新建)' if created else '(已存在)'}")

    # HR (Level 2 審批人)
    hr1, created = Employees.objects.get_or_create(
        employee_id='HR001',
        defaults={
            'username': '李人資',
            'phone': '0933333333',
            'address': '台北市松山區',
            'email': 'hr001@example.com',
        }
    )
    if created:
        hr1.set_password('password123')
        hr1.save()
    print(f"   HR: {hr1.username} (HR001) {'(新建)' if created else '(已存在)'}")

    # CEO (Level 3 審批人)
    ceo1, created = Employees.objects.get_or_create(
        employee_id='CEO001',
        defaults={
            'username': '陳總經理',
            'phone': '0944444444',
            'address': '台北市信義區',
            'email': 'ceo001@example.com',
        }
    )
    if created:
        ceo1.set_password('password123')
        ceo1.save()
    print(f"   CEO: {ceo1.username} (CEO001) {'(新建)' if created else '(已存在)'}")

    # 3. 建立員工-公司關係
    print("\n3. 建立員工-公司關係...")

    rel1, created = EmpCompanyRel.objects.get_or_create(
        employee_id=emp1,
        company_id=company,
        defaults={
            'employment_status': True,
            'hire_date': date(2024, 1, 1),
        }
    )
    print(f"   {emp1.username} <-> {company.name} {'(新建)' if created else '(已存在)'}")

    rel_mgr, created = EmpCompanyRel.objects.get_or_create(
        employee_id=mgr1,
        company_id=company,
        defaults={
            'employment_status': True,
            'hire_date': date(2023, 1, 1),
        }
    )
    print(f"   {mgr1.username} <-> {company.name} {'(新建)' if created else '(已存在)'}")

    rel_hr, created = EmpCompanyRel.objects.get_or_create(
        employee_id=hr1,
        company_id=company,
        defaults={
            'employment_status': True,
            'hire_date': date(2022, 1, 1),
        }
    )
    print(f"   {hr1.username} <-> {company.name} {'(新建)' if created else '(已存在)'}")

    rel_ceo, created = EmpCompanyRel.objects.get_or_create(
        employee_id=ceo1,
        company_id=company,
        defaults={
            'employment_status': True,
            'hire_date': date(2020, 1, 1),
        }
    )
    print(f"   {ceo1.username} <-> {company.name} {'(新建)' if created else '(已存在)'}")

    # 4. 初始化假別額度
    print("\n4. 初始化假別額度...")

    current_year = datetime.now().year
    employees = [emp1, mgr1, hr1, ceo1]

    leave_types = [
        ('annual', 80.00),      # 特休 10 天
        ('sick', 240.00),       # 病假 30 天
        ('personal', 112.00),   # 事假 14 天
    ]

    for employee in employees:
        for leave_type, total_hours in leave_types:
            balance, created = LeaveBalances.objects.get_or_create(
                employee_id=employee,
                year=current_year,
                leave_type=leave_type,
                defaults={
                    'total_hours': total_hours,
                    'used_hours': 0.00,
                    'remaining_hours': total_hours,
                }
            )
            if created:
                print(f"   {employee.username}: {balance.get_leave_type_display()} {total_hours}h")

    print("\n" + "=" * 50)
    print("測試資料建立完成！")
    print("=" * 50)

    print("\n📋 測試帳號資訊：")
    print("-" * 50)
    print(f"員工 (申請人):    EMP001 / password123 ({emp1.username})")
    print(f"主管 (Level 1):  MGR001 / password123 ({mgr1.username})")
    print(f"HR (Level 2):    HR001 / password123 ({hr1.username})")
    print(f"CEO (Level 3):   CEO001 / password123 ({ceo1.username})")
    print("-" * 50)

    print(f"\n✅ Relation ID: {rel1.id}")
    print(f"✅ Company ID: {company.id}")
    print(f"✅ 假別額度已初始化（{current_year} 年度）")

    return {
        'company': company,
        'emp1': emp1,
        'mgr1': mgr1,
        'hr1': hr1,
        'ceo1': ceo1,
        'rel1': rel1,
    }

if __name__ == '__main__':
    try:
        data = create_test_data()
        sys.exit(0)
    except Exception as e:
        print(f"\n❌ 錯誤: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
