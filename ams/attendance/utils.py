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
