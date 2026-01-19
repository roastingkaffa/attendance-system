#!/usr/bin/env python3
"""
考勤與請假管理系統 - 簡化版 QA 測試腳本
使用 Django ORM 直接測試，避免 HTTP 問題
"""

import os
import sys
import json
import django
from datetime import datetime, timedelta
from decimal import Decimal

# Django 環境設定
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'ams.settings')
os.environ['DB_ENGINE'] = 'django.db.backends.sqlite3'
os.environ['DB_NAME'] = 'db_test.sqlite3'
django.setup()

from attendance.models import *
from django.db import models as django_models


class SimpleQATest:
    """簡化版 QA 測試"""

    def __init__(self):
        self.results = {
            'pass': [],
            'fail': [],
            'warning': []
        }
        self.start_time = datetime.now()

    def add_result(self, status, category, test, message=""):
        """記錄測試結果"""
        emoji = {"pass": "✅", "fail": "❌", "warning": "⚠️"}
        self.results[status].append({
            'category': category,
            'test': test,
            'message': message
        })
        print(f"{emoji[status]} [{status.upper()}] {category} > {test}")
        if message:
            print(f"   {message}")

    def run_all(self):
        """執行所有測試"""
        print("="*80)
        print("考勤與請假管理系統 - QA 測試報告")
        print("="*80 + "\n")

        self.test_database()
        self.test_employees()
        self.test_companies()
        self.test_relationships()
        self.test_leave_records()
        self.test_approval_system()
        self.test_leave_balances()
        self.test_data_integrity()

        self.generate_report()

    def test_database(self):
        """測試資料庫完整性"""
        print("\n[1] 資料庫完整性測試")
        print("-"*80)

        # 測試所有模型是否可存取
        models_to_test = [
            ('Employees', Employees),
            ('Companies', Companies),
            ('EmpCompanyRel', EmpCompanyRel),
            ('LeaveRecords', LeaveRecords),
            ('ApprovalRecords', ApprovalRecords),
            ('LeaveBalances', LeaveBalances),
            ('ManagerialRelationship', ManagerialRelationship),
            ('ApprovalPolicy', ApprovalPolicy),
            ('AttendanceRecords', AttendanceRecords),
        ]

        for name, model in models_to_test:
            try:
                count = model.objects.count()
                self.add_result('pass', '資料庫完整性', f'{name} 資料表', f'{count} 筆資料')
            except Exception as e:
                self.add_result('fail', '資料庫完整性', f'{name} 資料表', str(e))

    def test_employees(self):
        """測試員工資料"""
        print("\n[2] 員工資料測試")
        print("-"*80)

        employees = Employees.objects.all()

        # 測試員工數量
        if employees.count() >= 4:
            self.add_result('pass', '員工資料', '員工數量', f'共 {employees.count()} 名員工')
        else:
            self.add_result('warning', '員工資料', '員工數量', f'只有 {employees.count()} 名，建議至少 4 名')

        # 檢查員工角色
        roles = {
            'EMP': employees.filter(employee_id__startswith='EMP').count(),
            'MGR': employees.filter(employee_id__startswith='MGR').count(),
            'HR': employees.filter(employee_id__startswith='HR').count(),
            'CEO': employees.filter(employee_id__startswith='CEO').count(),
        }

        for role, count in roles.items():
            if count > 0:
                self.add_result('pass', '員工資料', f'{role} 角色存在', f'{count} 名')
            else:
                self.add_result('warning', '員工資料', f'{role} 角色不存在')

        # 檢查必要欄位
        for emp in employees:
            if not emp.employee_id:
                self.add_result('fail', '員工資料', f'員工 {emp.id} 缺少 employee_id')
            if not emp.username:
                self.add_result('warning', '員工資料', f'員工 {emp.employee_id} 缺少 username')

    def test_companies(self):
        """測試公司資料"""
        print("\n[3] 公司資料測試")
        print("-"*80)

        companies = Companies.objects.all()

        if companies.count() >= 1:
            self.add_result('pass', '公司資料', '公司數量', f'共 {companies.count()} 間公司')
        else:
            self.add_result('fail', '公司資料', '公司數量', '沒有公司資料')
            return

        for company in companies:
            # 檢查 GPS 座標
            if company.latitude and company.longitude:
                self.add_result('pass', '公司資料', f'{company.name} GPS 座標',
                    f'({company.latitude}, {company.longitude})')
            else:
                self.add_result('fail', '公司資料', f'{company.name} 缺少 GPS 座標')

            # 檢查打卡範圍
            if company.radius:
                if company.radius > 0:
                    self.add_result('pass', '公司資料', f'{company.name} 打卡範圍', f'{company.radius} 公尺')
                else:
                    self.add_result('warning', '公司資料', f'{company.name} 打卡範圍為 0')
            else:
                self.add_result('warning', '公司資料', f'{company.name} 未設定打卡範圍')

    def test_relationships(self):
        """測試關聯資料"""
        print("\n[4] 關聯資料測試")
        print("-"*80)

        # 測試員工公司關係
        relations = EmpCompanyRel.objects.all()
        self.add_result('pass', '關聯資料', 'EmpCompanyRel', f'{relations.count()} 筆關聯')

        for rel in relations:
            # 檢查外鍵完整性
            if not rel.employee_id:
                self.add_result('fail', '關聯資料', f'關聯 #{rel.id} 缺少員工')
            if not rel.company_id:
                self.add_result('fail', '關聯資料', f'關聯 #{rel.id} 缺少公司')

            # 檢查主管設定
            if rel.direct_manager:
                self.add_result('pass', '關聯資料',
                    f'{rel.employee_id.employee_id} 的主管',
                    f'{rel.direct_manager.employee_id}')

        # 測試主管關係表
        mgr_rels = ManagerialRelationship.objects.all()
        self.add_result('pass', '關聯資料', 'ManagerialRelationship', f'{mgr_rels.count()} 筆關係')

        for mgr_rel in mgr_rels:
            if mgr_rel.employee_id and mgr_rel.manager_id:
                # 檢查是否形成循環
                if mgr_rel.employee_id.employee_id == mgr_rel.manager_id.employee_id:
                    self.add_result('fail', '關聯資料', '主管關係循環',
                        f'{mgr_rel.employee_id} 的主管是自己')
                else:
                    self.add_result('pass', '關聯資料', '主管關係正常',
                        f'{mgr_rel.employee_id.username} → {mgr_rel.manager_id.username}')

    def test_leave_records(self):
        """測試請假記錄"""
        print("\n[5] 請假記錄測試")
        print("-"*80)

        leaves = LeaveRecords.objects.all()
        self.add_result('pass', '請假記錄', '記錄數量', f'{leaves.count()} 筆')

        # 統計各狀態的請假記錄
        status_count = {}
        for leave in leaves:
            status_count[leave.status] = status_count.get(leave.status, 0) + 1

        for status, count in status_count.items():
            self.add_result('pass', '請假記錄', f'狀態 {status}', f'{count} 筆')

        # 檢查請假記錄的完整性
        for leave in leaves:
            # 檢查時間邏輯
            if leave.end_time <= leave.start_time:
                self.add_result('fail', '請假記錄', f'請假 #{leave.id} 時間邏輯錯誤',
                    '結束時間早於或等於開始時間')

            # 檢查請假時數
            expected_hours = (leave.end_time - leave.start_time).total_seconds() / 3600
            if abs(float(leave.leave_hours) - expected_hours) > 0.5:
                self.add_result('warning', '請假記錄', f'請假 #{leave.id} 時數可能不準確',
                    f'記錄: {leave.leave_hours}h, 計算: {expected_hours:.2f}h')

    def test_approval_system(self):
        """測試審批系統"""
        print("\n[6] 審批系統測試")
        print("-"*80)

        # 測試審批政策
        policies = ApprovalPolicy.objects.filter(is_active=True)
        self.add_result('pass', '審批系統', '審批政策', f'{policies.count()} 筆')

        # 檢查政策覆蓋範圍
        policy_ranges = []
        for policy in policies:
            policy_ranges.append((policy.min_days, policy.max_days, policy.policy_name))
            # 檢查 approval_levels 格式
            try:
                levels = policy.approval_levels if isinstance(policy.approval_levels, list) else json.loads(policy.approval_levels)
                self.add_result('pass', '審批系統', f'政策 {policy.policy_name}',
                    f'{len(levels)} 層審批')
            except Exception as e:
                self.add_result('fail', '審批系統', f'政策 {policy.policy_name} 格式錯誤', str(e))

        # 檢查是否覆蓋常見天數
        has_1day = any(p[0] <= 1 and (p[1] is None or p[1] >= 1) for p in policy_ranges)
        has_2to3day = any(p[0] <= 2 and (p[1] is None or p[1] >= 3) for p in policy_ranges)
        has_4plus = any(p[0] <= 4 for p in policy_ranges)

        if has_1day:
            self.add_result('pass', '審批系統', '1天請假政策存在')
        else:
            self.add_result('warning', '審批系統', '缺少 1天請假政策')

        if has_2to3day:
            self.add_result('pass', '審批系統', '2-3天請假政策存在')
        else:
            self.add_result('warning', '審批系統', '缺少 2-3天請假政策')

        if has_4plus:
            self.add_result('pass', '審批系統', '4天以上請假政策存在')
        else:
            self.add_result('warning', '審批系統', '缺少 4天以上請假政策')

        # 測試審批記錄
        approvals = ApprovalRecords.objects.all()
        self.add_result('pass', '審批系統', '審批記錄', f'{approvals.count()} 筆')

        # 統計審批狀態
        approval_status = {}
        for approval in approvals:
            approval_status[approval.status] = approval_status.get(approval.status, 0) + 1

        for status, count in approval_status.items():
            self.add_result('pass', '審批系統', f'審批狀態 {status}', f'{count} 筆')

    def test_leave_balances(self):
        """測試假別額度"""
        print("\n[7] 假別額度測試")
        print("-"*80)

        balances = LeaveBalances.objects.all()
        self.add_result('pass', '假別額度', '額度記錄', f'{balances.count()} 筆')

        # 檢查額度計算
        errors = []
        for balance in balances:
            expected = balance.total_hours - balance.used_hours
            if balance.remaining_hours != expected:
                errors.append(f'#{balance.id}: Expected {expected}, Got {balance.remaining_hours}')

        if not errors:
            self.add_result('pass', '假別額度', '額度計算正確', f'檢查 {balances.count()} 筆')
        else:
            for error in errors:
                self.add_result('fail', '假別額度', '額度計算錯誤', error)

        # 按員工統計額度
        employee_balances = {}
        for balance in balances:
            emp_id = balance.employee_id.employee_id
            if emp_id not in employee_balances:
                employee_balances[emp_id] = {
                    'total': Decimal('0'),
                    'used': Decimal('0'),
                    'remaining': Decimal('0'),
                    'types': 0
                }
            employee_balances[emp_id]['total'] += balance.total_hours
            employee_balances[emp_id]['used'] += balance.used_hours
            employee_balances[emp_id]['remaining'] += balance.remaining_hours
            employee_balances[emp_id]['types'] += 1

        for emp_id, stats in employee_balances.items():
            self.add_result('pass', '假別額度', f'員工 {emp_id}',
                f'{stats["types"]} 種假別, 總額 {stats["total"]}h, 已用 {stats["used"]}h, 剩餘 {stats["remaining"]}h')

    def test_data_integrity(self):
        """測試資料完整性"""
        print("\n[8] 資料完整性測試")
        print("-"*80)

        # 檢查審批記錄與請假記錄的對應
        approvals = ApprovalRecords.objects.all()
        for approval in approvals:
            if not approval.leave_id:
                self.add_result('fail', '資料完整性', f'審批記錄 #{approval.id} 缺少請假記錄')
            else:
                leave = approval.leave_id
                # 檢查狀態一致性
                if approval.status == 'approved' and leave.status == 'rejected':
                    self.add_result('warning', '資料完整性', f'審批 #{approval.id} 與請假 #{leave.id} 狀態不一致')

        self.add_result('pass', '資料完整性', '審批與請假記錄關聯', f'檢查 {approvals.count()} 筆')

        # 檢查假別額度扣除
        approved_leaves = LeaveRecords.objects.filter(status='approved')
        for leave in approved_leaves:
            employee = leave.relation_id.employee_id
            year = leave.start_time.year
            balance = LeaveBalances.objects.filter(
                employee_id=employee,
                year=year,
                leave_type=leave.leave_type
            ).first()

            if balance:
                # 檢查已使用時數是否合理
                if balance.used_hours > balance.total_hours:
                    self.add_result('warning', '資料完整性',
                        f'員工 {employee.employee_id} 的 {leave.get_leave_type_display()} 超額使用',
                        f'已用 {balance.used_hours}h > 總額 {balance.total_hours}h')
            else:
                self.add_result('warning', '資料完整性',
                    f'員工 {employee.employee_id} 缺少 {year} 年 {leave.get_leave_type_display()} 額度記錄')

        self.add_result('pass', '資料完整性', '假別額度扣除', f'檢查 {approved_leaves.count()} 筆已批准請假')

    def generate_report(self):
        """生成測試報告"""
        end_time = datetime.now()
        duration = (end_time - self.start_time).total_seconds()

        print("\n" + "="*80)
        print("測試摘要")
        print("="*80)

        total = len(self.results['pass']) + len(self.results['fail']) + len(self.results['warning'])
        pass_count = len(self.results['pass'])
        fail_count = len(self.results['fail'])
        warning_count = len(self.results['warning'])

        print(f"執行時間: {self.start_time.strftime('%Y-%m-%d %H:%M:%S')} ~ {end_time.strftime('%H:%M:%S')}")
        print(f"總耗時: {duration:.2f} 秒")
        print(f"總測試數: {total}")
        print(f"✅ 通過: {pass_count} ({pass_count/total*100:.1f}%)")
        print(f"❌ 失敗: {fail_count} ({fail_count/total*100:.1f}%)")
        print(f"⚠️  警告: {warning_count} ({warning_count/total*100:.1f}%)")

        # 按類別統計
        print("\n按類別統計:")
        categories = {}
        for status in ['pass', 'fail', 'warning']:
            for item in self.results[status]:
                cat = item['category']
                if cat not in categories:
                    categories[cat] = {'pass': 0, 'fail': 0, 'warning': 0}
                categories[cat][status] += 1

        for cat, stats in sorted(categories.items()):
            total_cat = stats['pass'] + stats['fail'] + stats['warning']
            print(f"  {cat}: {stats['pass']}/{total_cat} 通過, {stats['fail']} 失敗, {stats['warning']} 警告")

        # 列出失敗項目
        if fail_count > 0:
            print("\n失敗的測試項目:")
            for item in self.results['fail']:
                print(f"  ❌ {item['category']} > {item['test']}")
                if item['message']:
                    print(f"     {item['message']}")

        # 列出警告項目
        if warning_count > 0:
            print("\n警告的測試項目:")
            for item in self.results['warning']:
                print(f"  ⚠️  {item['category']} > {item['test']}")
                if item['message']:
                    print(f"     {item['message']}")

        print("\n" + "="*80)

        # 儲存 JSON 報告
        report_file = f"QA_REPORT_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_data = {
            'summary': {
                'total': total,
                'passed': pass_count,
                'failed': fail_count,
                'warnings': warning_count,
                'pass_rate': f"{pass_count/total*100:.1f}%",
                'duration': f"{duration:.2f}s",
                'start_time': self.start_time.isoformat(),
                'end_time': end_time.isoformat()
            },
            'results': self.results
        }

        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2, default=str)

        print(f"詳細報告已儲存至: {report_file}\n")

        return fail_count == 0


def main():
    tester = SimpleQATest()
    success = tester.run_all()
    sys.exit(0 if success else 1)


if __name__ == '__main__':
    main()
