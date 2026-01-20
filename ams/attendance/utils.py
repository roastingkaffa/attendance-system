"""
出勤系統輔助函數
"""
from math import radians, cos, sin, asin, sqrt
from decimal import Decimal


def calculate_distance(lat1, lon1, lat2, lon2):
    """
    計算兩個 GPS 座標之間的距離（公尺）
    使用 Haversine 公式

    Args:
        lat1: 第一點緯度
        lon1: 第一點經度
        lat2: 第二點緯度
        lon2: 第二點經度

    Returns:
        float: 兩點之間的距離（公尺）
    """
    # 將 Decimal 轉換為 float
    lat1 = float(lat1) if isinstance(lat1, Decimal) else lat1
    lon1 = float(lon1) if isinstance(lon1, Decimal) else lon1
    lat2 = float(lat2) if isinstance(lat2, Decimal) else lat2
    lon2 = float(lon2) if isinstance(lon2, Decimal) else lon2

    # 轉換為弧度
    lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])

    # Haversine 公式
    dlon = lon2 - lon1
    dlat = lat2 - lat1
    a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
    c = 2 * asin(sqrt(a))

    # 地球半徑（公尺）
    r = 6371000

    return c * r


def calculate_work_hours(checkin_time, checkout_time):
    """
    計算工作時數

    Args:
        checkin_time: 上班打卡時間（datetime）
        checkout_time: 下班打卡時間（datetime）

    Returns:
        Decimal: 工作時數（保留兩位小數）
    """
    if not checkin_time or not checkout_time:
        return Decimal('0.00')

    # 計算時間差（秒）
    time_diff = checkout_time - checkin_time

    # 轉換為小時
    hours = time_diff.total_seconds() / 3600

    # 返回 Decimal 保留兩位小數
    return Decimal(str(round(hours, 2)))


def calculate_annual_leave_days(hire_date, target_date=None):
    """
    根據勞基法計算特休天數

    勞基法規定：
    - 6個月以上1年未滿：3天
    - 1年以上2年未滿：7天
    - 2年以上3年未滿：10天
    - 3年以上5年未滿：14天
    - 5年以上10年未滿：15天
    - 10年以上：每年加1天，最多30天

    Args:
        hire_date: 入職日期（date 對象）
        target_date: 計算基準日期（預設為今天）

    Returns:
        dict: {
            'days': 特休天數,
            'hours': 特休時數（以8小時/天計算）,
            'years': 年資（年）,
            'months': 年資（月）,
            'description': 說明文字
        }
    """
    from datetime import date

    if target_date is None:
        target_date = date.today()

    # 計算年資（月份）
    months = (target_date.year - hire_date.year) * 12 + (target_date.month - hire_date.month)

    # 調整：如果當月還沒到入職日，減一個月
    if target_date.day < hire_date.day:
        months -= 1

    # 計算年資（年）
    years = months // 12

    # 計算特休天數
    if months < 6:
        days = 0
        description = "年資未滿6個月，尚無特休"
    elif months < 12:
        days = 3
        description = "年資6個月以上未滿1年，特休3天"
    elif years < 2:
        days = 7
        description = "年資1年以上未滿2年，特休7天"
    elif years < 3:
        days = 10
        description = "年資2年以上未滿3年，特休10天"
    elif years < 5:
        days = 14
        description = "年資3年以上未滿5年，特休14天"
    elif years < 10:
        days = 15
        description = "年資5年以上未滿10年，特休15天"
    else:
        # 10年以上，每年加1天，最多30天
        extra_days = years - 10
        days = min(15 + extra_days, 30)
        description = f"年資{years}年，特休{days}天（上限30天）"

    # 計算時數（每天8小時）
    hours = days * 8

    return {
        'days': days,
        'hours': hours,
        'years': years,
        'months': months,
        'description': description
    }
