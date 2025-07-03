import numpy as np
import random
import pandas as pd
import joblib
from io import BytesIO
import matplotlib
matplotlib.use('Agg')  # 設為非 GUI backend，再 import pyplot
import matplotlib.pyplot as plt
import re

# === 你的 path_html 原始 SVG path 資料，請貼完整 ===
target_distance_m = 6130

path_html = """
<path class="fill" d="M0,110.909090909090...957370132,200,1.1948448624417685,200S0.7663487738419618,200,0.5273798013536081,200Q0.36806715302803894,200,0,200Z"></path>
"""

def resample_points_equal_distance(points, num_samples=1000):
    # points: list of (x,y) tuples

    # 1. 計算累積距離
    distances = [0]
    for i in range(1, len(points)):
        dx = points[i][0] - points[i-1][0]
        dy = points[i][1] - points[i-1][1]
        dist = np.sqrt(dx*dx + dy*dy)
        distances.append(distances[-1] + dist)
    
    total_length = distances[-1]
    if total_length == 0:
        return points  # 全都重合，直接回傳

    # 2. 產生等距點距離
    interval = total_length / (num_samples - 1)
    target_distances = [i * interval for i in range(num_samples)]

    # 3. 線性插值函數
    xs, ys = zip(*points)
    xs = np.array(xs)
    ys = np.array(ys)
    distances = np.array(distances)

    resampled_xs = np.interp(target_distances, distances, xs)
    resampled_ys = np.interp(target_distances, distances, ys)

    resampled_points = list(zip(resampled_xs, resampled_ys))
    return resampled_points

def parse_svg_path(path_html, num_samples=800, points_per_segment=15, rounding_digits=3):
    # 取得 d 屬性字串
    if path_html.startswith('M') or path_html.startswith('m'):
        d_str = path_html.strip()
    else:
        d_match = re.search(r'd="([^"]+)"', path_html)
        if not d_match:
            raise ValueError("找不到 d 屬性")
        d_str = d_match.group(1)

    # 擷取所有數字，組成點列
    numbers = list(map(float, re.findall(r"[-+]?\d*\.\d+|\d+", d_str)))
    points = [(numbers[i], numbers[i+1]) for i in range(0, len(numbers)-1, 2)]

    # 等距重取樣
    sampled_points = resample_points_equal_distance(points, num_samples=num_samples)

    # 用重取樣點計算梯度和距離
    route = []
    for i in range(0, len(sampled_points) - points_per_segment, points_per_segment):
        segment = sampled_points[i:i + points_per_segment]
        if len(segment) < 2:
            continue

        x_start, y_start = segment[0]
        x_end, y_end = segment[-1]
        dx = x_end - x_start
        dy = y_end - y_start

        if dx <= 0:
            continue  # 避免 x 軸往回

        gradient = dy / dx

        if abs(gradient) > 10 or abs(dy) > 50:
            continue

        route.append((round(gradient, rounding_digits), round(dx, rounding_digits)))

    gradients = [g for g, d in route]
    distances = [d for g, d in route]
    x_axis = np.cumsum(distances).tolist()

    return x_axis, gradients




# 載入 XGBoost 模型
xgb_model = joblib.load("model/xgb_model.pkl")

# 模型預測時間函數
def simulate_ride(weight_kg, avg_power_w, w_per_kg,
                  distance_m, avg_grade, difficulty, season='Spring'):
    input_df = pd.DataFrame([{
        'estimated_weight_kg': weight_kg,
        'avg_power_w': avg_power_w,
        'w_per_kg': w_per_kg,
        'segment_distance_m': distance_m,
        'segment_avg_grade': avg_grade,
        'segment_difficulty': difficulty,
        'season_Fall': 1 if season == 'Fall' else 0,
        'season_Spring': 1 if season == 'Spring' else 0,
        'season_Summer': 1 if season == 'Summer' else 0,
        'season_Winter': 1 if season == 'Winter' else 0,
    }])
    pred_time_sec = float(xgb_model.predict(input_df)[0])
    return pred_time_sec

def model_predict_time(power, gradient, distance):
    weight_kg = 70
    w_per_kg = power / weight_kg
    difficulty = 1.0
    season = 'Spring'
    
    return simulate_ride(
        weight_kg=weight_kg,
        avg_power_w=power,
        w_per_kg=w_per_kg,
        distance_m=distance,
        avg_grade=gradient,
        difficulty=difficulty,
        season=season
    )

# 功率時間限制（秒）
power_limits = {
    200: 9999,
    205: 9999,
    210: 9999,
    215: 9999,
    220: 9999,
    225: 9999,
    230: 9999,
    235: 9999,
    240: 3600,
}


# 節點定義
class Node:
    def __init__(self, state, parent=None):
        self.state = state
        self.parent = parent
        self.children = []
        self.visits = 0
        self.total_time = 0.0

    def expand(self, power_options):
        if self.children:
            return
        for p in power_options:
            new_state = self.state + [p]
            self.children.append(Node(new_state, parent=self))

    def is_fully_expanded(self, power_options):
        return len(self.children) == len(power_options)

    def best_child(self, c_param=1.4):
        choices_weights = [
            (c.total_time / (c.visits + 1e-6)) - c_param * np.sqrt(2 * np.log(self.visits + 1) / (c.visits + 1e-6))
            for c in self.children
        ]
        return self.children[np.argmin(choices_weights)]

    def get_best_path(self, total_segments, power_options):
        node = self
        path = node.state.copy()
        while len(path) < total_segments:
            if not node.children:
                path += random.choices(power_options, k=total_segments - len(path))
                break
            node = min(node.children, key=lambda c: c.total_time / (c.visits + 1e-6))
            path = node.state
        return path

# 模擬總時間並檢查功率使用時間限制


def smoothness_penalty(state):
    penalty = 0
    for i in range(1, len(state)):
        delta = state[i] - state[i - 1]
        penalty += (delta ** 2)  # 使用平方懲罰
    return penalty

def simulate_with_power_limit(state, route, model_predict, power_limits, smooth_weight=5.0):
    total_time = 0.0
    power_duration = {p: 0.0 for p in power_limits}
    for i, power in enumerate(state):
        gradient, distance = route[i]
        time = model_predict(power, gradient, distance)
        power_duration[power] += time
        total_time += time
        if power_duration[power] > power_limits.get(power, 9999):
            return 1e9, power_duration
    #total_time += smooth_weight * smoothness_penalty(state)  # 平滑懲罰加權
    return total_time, power_duration
    return total_time, power_duration



# MCTS 主程式
def mcts(route, power_options, power_limits, max_iter=1000):
    weights = [1 + (p - min(power_options)) / 100 for p in power_options]
    root = Node(state=[])

    for _ in range(max_iter):
        node = root
        while node.children and len(node.state) < len(route):
            node = node.best_child(c_param=1.0)
        if len(node.state) < len(route) and not node.is_fully_expanded(power_options):
            node.expand(power_options)
            node = random.choice(node.children)
        full_state = node.state + [
            random.choices(power_options, weights=weights)[0] for _ in range(len(route) - len(node.state))
        ]
        total_time, _ = simulate_with_power_limit(full_state, route, model_predict_time, power_limits)
        while node:
            node.visits += 1
            node.total_time += total_time
            node = node.parent

    best_plan = root.get_best_path(len(route), power_options)
    return best_plan

# 繪圖函數（回傳 BytesIO）
def plot_pacing_strategy(pacing, x_axis):
    tick_interval = max(len(x_axis) // 10, 1)
    tick_indices = list(range(0, len(x_axis), tick_interval))
    tick_labels = [f"{x_axis[i]:.0f}" for i in tick_indices]

    fig, ax = plt.subplots(figsize=(10, 5))
    from scipy.interpolate import make_interp_spline
    smooth_x = np.linspace(min(x_axis), max(x_axis), 500)
    spline = make_interp_spline(x_axis, pacing, k=3)
    smooth_y = spline(smooth_x)
    ax.plot(smooth_x, smooth_y, linestyle='-', color='b')

    # ✅ 動態計算範圍但排除 0 與 800
    filtered = [p for p in pacing if p != 0 and p != 800]
    y_min = min(filtered)
    y_max = max(filtered)
    ax.set_ylim(y_min - 20, y_max + 20)

    ax.set_title("Pacing Optimizer (Power vs. Distance)")
    ax.set_xlabel("Distance (m)")
    ax.set_xlim(0, max(x_axis))
    ax.set_ylabel("Power (W)")
    ax.set_xticks([x_axis[i] for i in tick_indices])
    ax.set_xticklabels(tick_labels)
    ax.grid(True)
    fig.tight_layout()

    img_buf = BytesIO()
    fig.savefig(img_buf, format='png')
    plt.close(fig)
    img_buf.seek(0)
    return img_buf
    ax.set_title("Pacing Optimizer (Power vs. Distance)")
    ax.set_xlabel("Distance (m)")
    ax.set_xlim(0, 1000)
    ax.set_ylabel("Power (W)")
    ax.set_xticks([x_axis[i] for i in tick_indices])
    ax.set_xticklabels(tick_labels)
    ax.grid(True)
    fig.tight_layout()

    img_buf = BytesIO()
    fig.savefig(img_buf, format='png')
    plt.close(fig)  # ✅ 關閉該 figure，避免疊圖
    img_buf.seek(0)
    #print('abc',x_axis)


    return img_buf


# 整合主函數
def generate_pacing_strategy(x_axis, gradients, max_iter=1000):
    route = list(zip(gradients, x_axis))
    power_options = list(power_limits.keys())
    best_plan = mcts(route, power_options, power_limits, max_iter=max_iter)
    img_buf = plot_pacing_strategy(best_plan, x_axis)
    return best_plan, img_buf
