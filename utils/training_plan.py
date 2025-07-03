import random
from datetime import date, timedelta, datetime


# 一、訓練模板（分鐘範圍）
training_templates = {
    'a': {'name': 'Recovery Ride',    'duration_range': (30, 45)},
    'b': {'name': 'Endurance',        'duration_range': (120, 240)},
    'c': {'name': 'Tempo',            'duration_range': (90, 120)},
    'd': {'name': 'Threshold',        'duration_range': (60, 90)},
    'e': {'name': 'VO2 Max',          'duration_range': (45, 60)},
    'f': {'name': 'Anaerobic/Sprint', 'duration_range': (45, 60)},
    'g': {'name': 'Rest',             'duration_range': (0, 0)},
}

def sample_duration(code: str) -> int:
    lo, hi = training_templates[code]['duration_range']
    m = random.uniform(lo, hi)
    if code == 'b':
        return int(round(m / 30) * 30)
    else:
        return int(round(m / 10) * 10)

# 二、週期階段判斷
def determine_training_phase(current_date: date, race_date: date | None) -> str:
    if not race_date:
        return 'no_race'
    weeks_left = (race_date - current_date).days // 7
    if weeks_left > 12:
        return 'base_early'
    elif 9 <= weeks_left <= 12:
        return 'base_late'
    elif 6 <= weeks_left <= 8:
        return 'build_early'
    elif 3 <= weeks_left <= 5:
        return 'build_late'
    elif weeks_left <= 2:
        return 'peak'
    else:
        return 'no_race'

# 三、各階段 min/max 限制
def get_blocks_limits(phase: str, target_hours: float, training_days: list[str]) -> dict:

    if phase in ('base_early', 'base_late'):
        limits = {'a':{'min':0,'max':1}, 'b':{'min':2,'max':4},
                  'c':{'min':1,'max':2}, 'd':{'min':0,'max':1},
                  'e':{'min':0,'max':0}, 'f':{'min':0,'max':0}}
    elif phase in ('build_early','build_late'):
        limits = {'a':{'min':0,'max':1}, 'b':{'min':1,'max':3},
                  'c':{'min':1,'max':2}, 'd':{'min':1,'max':2},
                  'e':{'min':0,'max':1}, 'f':{'min':0,'max':1}}
    elif phase == 'peak':
        limits = {'a':{'min':0,'max':1}, 'b':{'min':1,'max':2},
                  'c':{'min':0,'max':2}, 'd':{'min':1,'max':2},
                  'e':{'min':1,'max':2}, 'f':{'min':0,'max':1}}
    else:
        limits = {'a':{'min':0,'max':2}, 'b':{'min':1,'max':3},
                  'c':{'min':0,'max':2}, 'd':{'min':0,'max':1},
                  'e':{'min':0,'max':0}, 'f':{'min':0,'max':0}}
    
    # ➕ 加入這段邏輯
    if target_hours < 10:
        limits['a']['max'] = 0
    limits['g'] = {'min': 0, 'max': len(training_days)}  # Rest 限制

    return limits

# 四、產生週計劃並逐步放寬限制
def generate_plan_with_relax(training_days: list[str],
                             blocks_limits: dict,
                             target_hours: float,
                             tolerance: float = 30,
                             max_attempts: int = 1000) -> dict | None:

    target_min = int(target_hours * 60)
    if not (300 <= target_min <= 1200):
        raise ValueError("每週訓練時數必須介於 5–20 小時之間")

    week_days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    non_train = [d for d in week_days if d not in training_days]
    intensity = {'c','d','e','f'}

    # 硬性條件
    def hard_total_range(plan):
        total = sum(sum(seg[1] for seg in plan[d]) for d in training_days)
        return 300 <= total <= 1200

    def hard_total_within(plan):
        total = sum(sum(seg[1] for seg in plan[d]) for d in training_days)
        return abs(total - target_min) <= tolerance

    hard_constraints = [
        ('時數硬性 300–1200 分鐘', hard_total_range),
        ('時數必須在目標 ± 容差',   hard_total_within),
    ]

    # 可放寬限制
    def max_intensity(plan):
        return sum(1 for d in training_days if plan[d][0][0] in intensity) <= 3

    def max_recovery(plan):
        return sum(1 for d in training_days if plan[d][0][0]=='a') <= 1

    def no_four_consec(plan):
        consec = 0
        for d in week_days:
            code = plan[d][0][0]
            if code in ('g','a'):
                consec = 0
            else:
                consec += 1
                if consec > 3:
                    return False
        return True

    relaxable = [
        ('最多三天強度日',   max_intensity),
        ('最多一次Recovery',max_recovery),
        ('不超過3天連續',    no_four_consec),
    ]

    for r in range(len(relaxable)+1):
        active = hard_constraints + relaxable[:len(relaxable)-r]
        def valid(plan):
            return all(fn(plan) for _, fn in active)

        for _ in range(max_attempts):
            counts = {k: blocks_limits[k].get('min',0) for k in blocks_limits}
            slots = len(training_days) - sum(counts.values())
            if slots < 0:
                break

            avail = [k for k in blocks_limits if counts[k] < blocks_limits[k]['max']]
            for _ in range(slots):
                if not avail: break
                k = random.choice(avail)
                counts[k] += 1
                if counts[k] >= blocks_limits[k]['max']:
                    avail.remove(k)

            mods = []
            for code, cnt in counts.items():
                mods += [code]*cnt
            random.shuffle(mods)

            plan = {}
            for day, code in zip(training_days, mods):
                segs = [(code, sample_duration(code))]
                if code in intensity and random.random() < 0.5:
                    segs.append(('b', sample_duration('b')))
                plan[day] = segs
            for day in non_train:
                plan[day] = [('g', 0)]

            if valid(plan):
                if r > 0:
                    print(f"⚠️ 已放寬 {r} 項限制")
                return plan

    if any(v['min'] > 0 for v in blocks_limits.values()):
        print("🔁 初次嘗試失敗，放寬 min 限制重新嘗試...")
        relaxed_limits = {
            k: {'min': 0, 'max': v['max']}
            for k, v in blocks_limits.items()
        }
        return generate_plan_with_relax(training_days, relaxed_limits, target_hours, tolerance, max_attempts)
    else:
        return None

# 五、週計劃 JSON 產生函式（整合輸出格式）


def get_dates_for_week(start_date=None):
    if not start_date:
        start_date = date.today()
    monday = start_date - timedelta(days=start_date.weekday())  # 本週一
    return {
        (monday + timedelta(days=i)).strftime("%a"): (monday + timedelta(days=i))
        for i in range(7)
    }
def filter_training_days_by_date(training_days, today=None):
    if not today:
        today = datetime.today().date()

    valid_days = []
    this_week_dates = get_dates_for_week(today)

    for day_name, date_obj in this_week_dates.items():
        if date_obj >= today and day_name in training_days:
            valid_days.append(day_name)

    return list(dict.fromkeys(valid_days))  # 去重複，保留順序

def get_rolling_week_dates(start_date=None):
    """從 start_date 開始的連續 7 天日期與星期縮寫字典，依序循環"""
    if not start_date:
        start_date = date.today()
    days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']
    result = {}
    for i in range(7):
        dt = start_date + timedelta(days=i)
        # 找對應的星期字
        weekday_str = days[dt.weekday()]
        result[weekday_str] = dt
    # 按照開始日期那天的weekday排序循環
    # 這樣確保順序是從 start_date 星期開始，依序7天
    sorted_result = {}
    start_idx = start_date.weekday()
    for i in range(7):
        idx = (start_idx + i) % 7
        day_str = days[idx]
        sorted_result[day_str] = result[day_str]
    return sorted_result

def generate_week_plan_json(race_date: date,
                            training_days: list[str],
                            target_hours: float) -> dict:
    today = date.today()

    if race_date < today:
        return {"error": "❌ 選定日期早於今日，無法排課"}

    # ➕ 判斷是否在 7 天內（含今天）
    days_until_race = (race_date - today).days
    race_within_7_days = 0 <= days_until_race <= 6

    this_week_dates = get_rolling_week_dates(today)

    race_day_name = None
    for day_name, dt in this_week_dates.items():
        # print("day_name:", day_name, "dt:", dt)
        # print(this_week_dates.items())
        if dt == race_date:
            race_day_name = day_name
            # print(f"⚠️ 本週比賽日：{day_name}，課表已排定")
            break
    if race_within_7_days:
        # ➕ 若比賽 7 天內，排 race，且移除比賽日後的所有訓練日
        filtered_training_days = []
        rolling_week = get_rolling_week_dates(today)
        race_day_minus_1 = race_date - timedelta(days=1)
        for day, dt in rolling_week.items():
            # 保留今天到比賽日前一天的訓練日 (dt < race_date)
            if today <= dt < race_day_minus_1 and day in training_days:
                filtered_training_days.append(day)
        # 不包含比賽日與之後的天數

    elif race_date in this_week_dates.values():
        # 本週比賽（但不在 7 天內），只過濾比賽當天與前一天
        filtered_training_days = filter_training_days_by_date(training_days, today)

        # 移除比賽日
        if race_day_name and race_day_name in filtered_training_days:
            filtered_training_days.remove(race_day_name)

        # 找出比賽日前一天的日期名稱，然後移除
        # 假設 this_week_dates 是 dict: {day_name: date_obj}
        # 找到 race_date 的前一天
        race_date_prev = race_date - timedelta(days=1)
        prev_day_name = None
        for day_name, dt in this_week_dates.items():
            if dt == race_date_prev:
                prev_day_name = day_name
                break

        if prev_day_name and prev_day_name in filtered_training_days:
            filtered_training_days.remove(prev_day_name)

    else:
        # 非本週、也不在 7 天內，保留所有使用者勾選的訓練日
        filtered_training_days = training_days

    rolling_week_dates = get_rolling_week_dates(today)
    phase = determine_training_phase(today, race_date)
    limits = get_blocks_limits(phase, target_hours, filtered_training_days)
    plan = generate_plan_with_relax(filtered_training_days, limits, target_hours)

    if not plan:
        return {"error": "❌ 無法產生符合所有硬性條件的課表"}

    week_plan = {}
    for d in plan:
        # 若今天到 7 天內比賽，指定比賽日為 Race
        if race_within_7_days and str(d) == race_day_name:
            week_plan[d] = [{"code": "race", "name": "Race Day", "duration": 0}]
            # print(f"⚠️ 本週比賽日：{d}，課表已排定")
            
            continue

        segs = plan[d]
        week_plan[d] = [
            {
                "code": code,
                "name": training_templates[code]['name'],
                "duration": duration
            }
            for code, duration in segs
        ]

    return {
        "phase": phase,
        "weekly_plan": week_plan,
        "rolling_week_dates": {k: v.isoformat() for k, v in rolling_week_dates.items()}
    }
