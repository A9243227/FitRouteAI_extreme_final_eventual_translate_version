# --- Flask 基礎模組 ---
from flask import (
    Flask, render_template, request, Response, redirect,
    url_for, session, jsonify, send_file,
    stream_with_context, make_response
)
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS

# --- 工具類 ---
from werkzeug.security import generate_password_hash, check_password_hash
from dotenv import load_dotenv
import os, re, json, time
from datetime import date, datetime
from collections import defaultdict
from colorama import Style
import colorsys
import threading


# --- 專案內 utils 模組 ---
from utils.ride_tips import generate_ride_inputs, call_llm_stream, build_user_prompt
from utils.training_plan import generate_week_plan_json
from utils.simulation import simulate_ride
from utils.elevation_API_proxy import google_proxy
from utils.pacing_opt import generate_pacing_strategy, parse_svg_path
from utils.i18n_utils import translate, get_user_language

# --- LLM 模型 ---
from llama_cpp import Llama

art='''
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣿⣿⡷⣄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣴⣿⡿⠋⠈⠻⣮⣳⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣠⣴⣾⡿⠋⠀⠀⠀⠀⠙⣿⣿⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣤⣶⣿⡿⠟⠛⠉⠀⠀⠀⠀⠀⠀⠀⠈⠛⠛⠿⠿⣿⣷⣶⣤⣄⣀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣾⡿⠟⠋⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠛⠻⠿⣿⣶⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⣀⣠⣤⣤⣀⡀⠀⠀⣀⣴⣿⡿⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⣿⣷⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣤⣄⠀⠀
⢀⣤⣾⡿⠟⠛⠛⢿⣿⣶⣾⣿⠟⠉⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠛⠿⣿⣷⣦⣀⣀⣤⣶⣿⡿⠿⢿⣿⡀⠀
⣿⣿⠏⠀⢰⡆⠀⠀⠉⢿⣿⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠻⢿⡿⠟⠋⠁⠀⠀⢸⣿⠇⠀
⣿⡟⠀⣀⠈⣀⡀⠒⠃⠀⠙⣿⡆⠀⠀⠀⠀⠀⠀⠀⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢸⣿⠇⠀
⣿⡇⠀⠛⢠⡋⢙⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⣿⠄⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⠀⠀
⣿⣧⠀⠀⠀⠓⠛⠁⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⠛⠋⠀⠀⢸⣧⣤⣤⣶⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⡿⠀⠀
⣿⣿⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠉⠻⣷⣶⣶⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣿⣿⠁⠀⠀
⠈⠛⠻⠿⢿⣿⣷⣶⣦⣤⣄⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣴⣿⣷⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣾⣿⡏⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠉⠙⠛⠻⠿⢿⣿⣷⣶⣦⣤⣄⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⠿⠛⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⢿⣿⡄⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠙⠛⠻⠿⢿⣿⣷⣶⣦⣤⣄⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⣿⡄⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠛⠛⠿⠿⣿⣷⣶⣶⣤⣤⣀⡀⠀⠀⠀⢀⣴⡆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⢿⡿⣄
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⠉⠛⠛⠿⠿⣿⣷⣶⡿⠋⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⣿⣹
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢀⣀⣀⠀⠀⠀⠀⠀⠀⢸⣧
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢻⣿⣆⠀⠀⠀⠀⠀⠀⢀⣀⣠⣤⣶⣾⣿⣿⣿⣿⣤⣄⣀⡀⠀⠀⠀⣿
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠻⢿⣻⣷⣶⣾⣿⣿⡿⢯⣛⣛⡋⠁⠀⠀⠉⠙⠛⠛⠿⣿⣿⡷⣶⣿'''


# 讀取 .env 環境設定
load_dotenv('key.env')

app = Flask(__name__)
CORS(app)

# 若 key.env 不存在或缺欄位，這裡若為 None 會讓 session 在執行期才炸掉，
# 因此提早給預設值並提示。
app.secret_key = os.getenv('SECRET_KEY')
if not app.secret_key:
    print("⚠️ 找不到 SECRET_KEY（請檢查 key.env），暫時使用隨機金鑰，重啟後 session 會失效。")
    app.secret_key = os.urandom(32)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///users.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# 註冊 Blueprint
app.register_blueprint(google_proxy)

# --- LLM 延遲載入 ---
# 原本 llm 只在 `if __name__ == '__main__'` 內建立，改用 gunicorn / flask run
# 等其他入口啟動時 /chat_stream 會直接 NameError。改成延遲載入 + 鎖，
# 讓任何啟動方式都能取得同一個實例。
MODEL_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)),
                          "model", "gemma-3-4b-it-Q4_K_M.gguf")
_llm = None
_llm_lock = threading.Lock()


def get_llm():
    global _llm
    if _llm is None:
        with _llm_lock:
            if _llm is None:
                _llm = Llama(
                    model_path=MODEL_PATH,
                    n_gpu_layers=0,
                    n_threads=16,
                    n_ctx=2048,
                    verbose=True
                )
    return _llm

# 使用者模型
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)

    def __init__(self, name, email, password):
        self.name = name
        self.email = email
        self.password = password

# 初始化資料庫
with app.app_context():
    db.create_all()


# 首頁
@app.route('/')
def index():
    if not session.get("has_seen_splash"):
        session["has_seen_splash"] = True
        return redirect(url_for("splash"))
    
    user_email = session.get('user_email') if 'user_email' in session else None
    
    return render_template('index.html', user_email=user_email)


@app.route('/splash')
def splash():
    return render_template('splash.html')

@app.route('/mood')
def mood():
    return render_template('mood.html')

# 註冊
@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name'].strip()
        email = request.form['email'].strip()
        password = generate_password_hash(request.form['password'])

        # 驗證 email 格式
        email_regex = r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$'
        if not re.match(email_regex, email):
            return "Invalid email format."

        if User.query.filter_by(email=email).first():
            return "Email already exists."

        new_user = User(name=name, email=email, password=password)
        db.session.add(new_user)
        db.session.commit()

        session['user_id'] = new_user.id
        session['user_name'] = new_user.name
        session['user_email'] = new_user.email
        session['logged_in'] = True

        return redirect(url_for('index'))

    return render_template('register.html')

# 登入
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        email = request.form['email'].strip()
        password = request.form['password']

        user = User.query.filter_by(email=email).first()
        if user and check_password_hash(user.password, password):
            session['user_id'] = user.id
            session['user_name'] = user.name
            session['user_email'] = user.email
            session['logged_in'] = True
            return redirect(url_for('index'))
        else:
            return "Login failed. Invalid credentials."

    return render_template('login.html')

@app.route('/api/check_login')
def check_login():
    return {'logged_in': session.get('logged_in', False)}


@app.route('/api/plan', methods=['POST'])
def get_plan():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    mode = data.get('mode', 'plan')
    if mode == 'custom':
        try:
            weight_kg = data['weight_kg']
            avg_power_w = data['avg_power_w']
            w_per_kg = data['w_per_kg']
            distance_m = data['distance_m']
            avg_grade = data['avg_grade']
            difficulty = data['difficulty']
            season = data.get('season', 'Spring')

            predicted_time = simulate_ride(
                weight_kg, avg_power_w, w_per_kg,
                distance_m, avg_grade, difficulty, season
            )
            
            return jsonify({
                "predicted_time": predicted_time,
                "unit": "seconds"
            })

        except Exception as e:
            print("❌ Error in simulate_ride:", e)
            return jsonify({"error": str(e)}), 400
    # default: weekly training plan
    try:
        race_date_parts = data.get('race_date')  # e.g. [2025, 7, 10]
        training_days = data.get('training_days')  # e.g. ['Tue','Wed','Thu']
        target_hours = data.get('target_hours')  # e.g. 10.0

        race_date = date(*race_date_parts)
        plan_json = generate_week_plan_json(race_date, training_days, target_hours)
        return jsonify(plan_json)
    except Exception as e:
        print("❌ Error in week plan:", e)
        return jsonify({"error": str(e)}), 400
    
@app.route('/logout')
def logout():
    session.clear()
    return redirect(url_for('index'))

def safe_float(val, default=50):
    try:
        return float(val)
    except (TypeError, ValueError):
        return default

@app.route("/update_fitness", methods=["POST"])
def update_fitness():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"status": "error", "message": "Invalid JSON body"}), 400

    resp = make_response(jsonify({"status": "ok"}))

    # 設定 cookie 以便之後 generate_ride_inputs() 使用
    for key in ["goal"]:
        if key in data:
            resp.set_cookie(key, str(data[key]))

    return resp

@app.route("/update_profile", methods=["POST"])
def update_profile():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"status": "error", "message": "Invalid JSON body"}), 400

    resp = make_response(jsonify({"status": "ok"}))

    for key in ["age", "height", "weight", "gender"]:
        if key in data:
            resp.set_cookie(key, str(data[key]))

    return resp

@app.route("/api/update_slider", methods=["POST"])
def update_slider():
    """接收 mood 頁面的四個滑桿數值，存進 session 供 generate_ride_inputs() 使用。

    先前前端 mood.js 一直呼叫這個端點，但後端沒有對應的路由，
    每次拖動滑桿都會收到 404。
    """
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"status": "error", "message": "Invalid JSON body"}), 400

    slider_values = {
        key: data[key]
        for key in ("mood", "energy", "hydration", "fatigue")
        if key in data
    }
    session["ride_inputs"] = {**session.get("ride_inputs", {}), **slider_values}

    resp = make_response(jsonify({"status": "ok"}))
    for key, value in slider_values.items():
        resp.set_cookie(key, str(value))
    return resp

@app.route("/update_segment", methods=["POST"])
def update_segment():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"status": "error", "message": "Invalid JSON body"}), 400

    # 檢查收到的資料
    print("📦 Received segment data:", data)

    # 將收到的 distance_km, elevation_gain 存入 session
    session["ride_inputs"] = {
        **session.get("ride_inputs", {}),  # 保留舊資料（如 mood, hydration 等）
        **data  # 合併新資料
    }

    return jsonify(success=True)
@app.route('/segment', methods=['GET', 'POST'])
def segment():
    inputs = generate_ride_inputs(request)

    # GET 進來時 form 是空的；用 '' 而不是 None，否則樣板會印出字串 "None"
    start = request.values.get('start', '')
    end = request.values.get('end', '')
    return render_template('segment.html',
        start=start, end=end, inputs=inputs)

@app.route("/segment_stream")
def segment_stream():
    inputs = generate_ride_inputs(request)
    prompt = build_user_prompt(inputs)
    def generate():
        yield 'retry: 300\n\n'
        try:
            for chunk in call_llm_stream(prompt):
                text = chunk.replace("\n", "").replace("\r", "")
                if not text:
                    continue
                yield f"data: {text}\n\n"
                time.sleep(0.05)
        except Exception as e:
            print("❌ Error in segment_stream:", e)
            yield f"event: error\ndata: {e}\n\n"
        yield "event: done\ndata: [DONE]\n\n"

    # mimetype 不該帶參數，charset 要放在 content_type 才不會重複附加
    return Response(stream_with_context(generate()),
                    content_type="text/event-stream; charset=utf-8")

@app.route("/route")
def route_page():
    # 這是 GET-only 的路由，request.form 永遠是空的，要讀 query string
    start = request.args.get('start', '')
    end = request.args.get('end', '')
    distance = request.args.get("distance")
    return render_template("route.html", start=start, end=end, distance=distance)
DATA_DIR = "user_data"
os.makedirs(DATA_DIR, exist_ok=True)

# 只允許英數、底線與連字號的檔名（實際格式為 2025-07-28-20-30-00），
# 避免 "../../app" 這類輸入寫到 user_data 以外的位置。
SAFE_FILENAME_RE = re.compile(r'^[A-Za-z0-9_-]{1,64}$')


def safe_data_path(name):
    """把使用者提供的檔名限制在 DATA_DIR 底下，不合法時回傳 None。"""
    if not isinstance(name, str) or not SAFE_FILENAME_RE.match(name):
        return None
    return os.path.join(DATA_DIR, f"{name}.json")


@app.route('/save_ride', methods=['POST'])
def save_ride():
    content = request.get_json(silent=True)
    if not isinstance(content, dict) or "filename" not in content or "data" not in content:
        return jsonify({"status": "error", "message": "Invalid input"}), 400

    filepath = safe_data_path(content.get("filename"))
    if filepath is None:
        return jsonify({"status": "error", "message": "Invalid filename"}), 400

    data = content.get("data")

    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False)

    return jsonify({"status": "success", "file": os.path.basename(filepath)})

@app.route('/get_stats', methods=['GET'])
def get_stats():
    # 計算統計
    stats = defaultdict(lambda: {'distance': 0, 'duration': 0})

    for filename in os.listdir(DATA_DIR):
        if not filename.endswith('.json'):
            continue
        filepath = os.path.join(DATA_DIR, filename)
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                ride = json.load(f)
        except Exception as e:
            print(f'read error {filename}: {e}')
            continue

        try:
            dt = datetime.strptime(ride['start_time'], "%Y-%m-%d %H:%M:%S")  # 修改時間格式
            distance = ride.get('distance', 0)
            duration = ride.get('duration', 0)
        except Exception as e:
            print(f"time parsing error {filename}: {e}")
            continue

        year = dt.year
        week = dt.isocalendar().week
        month = dt.month

        # 曆週
        key_w = f'{year}_w{week}'
        stats[key_w]['distance'] += distance
        stats[key_w]['duration'] += duration

        # 曆月
        key_m = f'{year}_m{month}'
        stats[key_m]['distance'] += distance
        stats[key_m]['duration'] += duration

        # 曆年
        key_y = f'{year}_y'
        stats[key_y]['distance'] += distance
        stats[key_y]['duration'] += duration

    # 產出最終格式（單位轉換與加欄位命名）
    final_stats = {}
    for key, val in stats.items():
        d_km = val['distance'] / 1000.0  # 公尺 → 公里
        t_sec = val['duration']          # 秒
        s_kph = (d_km / (t_sec / 3600)) if t_sec > 0 else 0  # km/h

        final_stats[f'{key}_distance'] = round(d_km, 1)
        final_stats[f'{key}_duration'] = int(t_sec)
        final_stats[f'{key}_avg_speed'] = round(s_kph, 1)

    # 讀取全部的 json 檔案作為 recent_activities
    try:
        files = os.listdir(DATA_DIR)
        json_files = [f for f in files if f.endswith('.json')]

        recent_activities = []
        for file in json_files:
            file_path = os.path.join(DATA_DIR, file)
            with open(file_path, 'r', encoding='utf-8') as f:
                ride = json.load(f)
                recent_activities.append({
                    'date': file.split('.')[0],  # 取檔案名稱作為日期
			'start_time': ride.get('start_time'),
                    'distance': ride.get('distance', 0),
                    'duration': ride.get('duration', 0),
                    'avg_speed': ride.get('average_speed', 0),
                    'plan': ride.get('plan', None),
                    'start': ride.get('start', None),
                    'end': ride.get('end', None)
                })
    except Exception as e:
        print(f"Error reading activities: {e}")
        recent_activities = []

    # 回傳統計資料和所有活動資料
    # --- 自動判斷成就邏輯 ---
    achievement_flags = {
        "century": False,
        "early_bird": False,
        "consistent": False,
        "speed_demon": False
    }
    activity_days = set()

    for ride in recent_activities:
        try:
            dt = datetime.strptime(ride['start_time'], "%Y-%m-%d %H:%M:%S")
            distance = ride.get("distance", 0)
            avg_speed = ride.get("avg_speed", 0)
            if distance >= 100000:
                achievement_flags["century"] = True
            if dt.hour < 6:
                achievement_flags["early_bird"] = True
            if avg_speed >= 35:
                achievement_flags["speed_demon"] = True
            activity_days.add(dt.weekday())
        except Exception as e:
            print(f"skip ride for achievement: {e}")

    if len(activity_days) >= 3:
        achievement_flags["consistent"] = True

    unlocked = [k for k, v in achievement_flags.items() if v]
    return jsonify({
        "statistics": final_stats,
        "achievements_unlocked": unlocked,
        "recent_activities": recent_activities
    })

@app.route('/user_data', methods=['POST'])
def update_user_data():
    payload = request.get_json(silent=True)
    if not isinstance(payload, dict):
        return jsonify({"status": "error", "message": "Invalid JSON body"}), 400

    updates = payload.get("updates", [])
    for upd in updates:
        if not isinstance(upd, dict):
            continue
        # 注意：這裡不要用 `date` 當變數名，會遮蔽 datetime.date
        ride_date = upd.get("date")
        plan = upd.get("plan")
        if not ride_date or plan is None:
            continue
        filepath = safe_data_path(ride_date)
        if filepath is None or not os.path.exists(filepath):
            continue
        with open(filepath, "r", encoding="utf-8") as f:
            data = json.load(f)
        data["plan"] = plan
        with open(filepath, "w", encoding="utf-8") as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    return jsonify(success=True)

@app.route('/set_language', methods=['GET', 'POST'])
def set_language():
    """設置用戶界面語言"""
    # 前端 i18n.js 送的是 'zh'／'en'，但後端翻譯檔是 zh-TW.json，
    # 統一在這裡正規化，避免 <html lang> 與 translate() 用到無效的語言碼。
    supported = {'zh': 'zh-TW', 'zh-TW': 'zh-TW', 'en': 'en'}

    if request.method == 'POST':
        language = supported.get(request.form.get('language', 'zh-TW'), 'zh-TW')
        session['language'] = language
        # 如果有 referer，則返回之前的頁面
        referer = request.headers.get('Referer')
        if referer:
            return redirect(referer)
        return redirect(url_for('index'))
    
    # GET 請求時，返回當前語言
    language = session.get('language', 'zh-TW')
    return jsonify({'language': language})

@app.context_processor
def inject_i18n_functions():
    """將翻譯函數注入到所有模板中"""
    return {
        'translate': translate,
        'get_user_language': get_user_language
    }


# @app.route('/chat')
# def chat():
#     return render_template('chat_stream.html')

@app.route('/chat_stream', methods=['POST'])
def chat_stream():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        return jsonify({"error": "Invalid JSON body"}), 400

    messages = data.get("messages", [])
    llm = get_llm()

    def generate():
        for chunk in llm.create_chat_completion(
            messages=messages,
            stream=True
        ):
            # 串流的第一個 chunk 只有 role，沒有 content
            content = chunk["choices"][0].get("delta", {}).get("content", "")
            if content:
                yield content

    return Response(generate(), content_type='text/plain; charset=utf-8')


# 從 segment_paths.py 載入 segment_svg_paths 字典
from utils.segment_paths import segment_svg_paths
@app.route("/api/pacing", methods=["POST"])
def pacing_strategy():
    data = request.get_json(silent=True)
    if not isinstance(data, dict) or "segmentID" not in data:
        return jsonify({"error": "Missing 'segmentID' in JSON"}), 400

    segment_id = data["segmentID"]
    # 原本用 segment_svg_paths[segment_id]，未知的 ID 會先丟 KeyError 變成 500，
    # 根本走不到下面的 404 分支
    path_html = segment_svg_paths.get(segment_id)

    if not path_html:
        return jsonify({"error": f"Segment ID '{segment_id}' not found"}), 404

    try:
        x_axis, gradients = parse_svg_path(path_html)
        best_plan, img_buf = generate_pacing_strategy(x_axis, gradients)
    except Exception as e:
        print("❌ Error in pacing_strategy:", e)
        return jsonify({"error": str(e)}), 400

    return send_file(img_buf, mimetype='image/png')


# 將 HSV 轉成 ANSI 顏色
def hsv_to_ansi(h, s=1, v=1):
    r, g, b = colorsys.hsv_to_rgb(h, s, v)
    return f"\033[38;2;{int(r*255)};{int(g*255)};{int(b*255)}m"

# 動畫函式
def rainbow_animation(ascii_art, stop_flag, start_line=1):
    lines = ascii_art.splitlines()
    frame = 0
    height = len(lines)
    
    while not stop_flag['stop']:
        hue_base = (frame * 0.02) % 1.0
        for i, line in enumerate(lines):
            hue = (hue_base + i * 0.015) % 1.0
            color = hsv_to_ansi(hue)
            # ✅ 每行都用 ANSI 指定「第幾行」顯示，避免覆蓋其他區
            print(f"\033[{start_line + i};0H" + color + line + Style.RESET_ALL)
        
        frame += 1
        time.sleep(0.05)

        # ✅ 游標移到底部，讓主程式的 print 自然從下面開始捲動
        print(f"\033[{start_line + height + 2};0H", end='')



# ====== 主程式入口 ======
if __name__ == '__main__':

    # 載入 GGUF 模型（確保已下載並配置好）
    get_llm()

    # 3. 啟動動畫執行緒（從第 8 行開始畫動畫，避免蓋到標題）
    stop_flag = {'stop': False}
    anim_thread = threading.Thread(target=rainbow_animation, args=(art, stop_flag), daemon=True)
    anim_thread.start()

    # 4. 執行 Flask 應用，輸出會在動畫下方繼續
    app.run(debug=False)

    # 5. Flask 結束時關閉動畫
    stop_flag['stop'] = True
    anim_thread.join()
