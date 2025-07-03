from flask import request, session
import requests

def safe_float(value, default=50.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def build_user_prompt(inputs: dict) -> str:
    lines = ["以下是騎乘者目前的狀況，請給出簡潔、活潑、有用的建議，限100字內："]
    for key, val in inputs.items():
        if val is not None:
            label = {
                "mood": "心情",
                "energy": "能量",
                "hydration": "水分",
                "fatigue": "疲勞",
                "goal": "訓練目標",
                "bmi": "BMI",
                "distance_km": "今日預計騎乘距離 (km)",
                "weather": "天氣",
                "climb_difficulty": "爬坡難度指數"
            }.get(key, key)
            lines.append(f"{label}：{val}")
    return "\n".join(lines)


def call_llm_stream(prompt: str):
    url = "http://localhost:5000/chat_stream"
    headers = {"Content-Type": "application/json"}
    payload = {
        "messages": [
            {"role": "system", "content": "你只回答自行車相關問題，身為 FitRoute AI 的自行車訓練專家，語氣活潑內容深入淺出，字數在100以內。"},
            {"role": "user", "content": prompt}
        ]
    }

    with requests.post(url, headers=headers, json=payload, stream=True) as response:
        for line in response.iter_lines(decode_unicode=False):
            line = line.decode('utf-8')
            if line:
                yield line



def generate_ride_inputs(req) -> dict:
    # ⬇️ 優先從 session 中讀取最新資料
    session_inputs = session.get("ride_inputs", {})
    data = req.form or req.args or {}
    
    def get_val(key, default):
        return safe_float(data.get(key, session_inputs.get(key, req.cookies.get(key))), default)

    
    mood = get_val('mood', 50)
    energy = get_val('energy', 50)
    hydration = get_val('hydration', 50)
    fatigue = get_val('fatigue', 50)
    height_cm = get_val('height', 170)
    weight_kg = get_val('weight', 70)
    goal = data.get('goal') or session_inputs.get('goal') or req.cookies.get('goal', 'Endurance')

    distance_km = get_val('distance_km', 50)
    elevation = get_val('elevation_gain', 500)
    weather = data.get('weather') or session_inputs.get('weather') or 'Sunny'

    climb_difficulty = elevation**(5/2)* distance_km / 10
    height_m = height_cm / 100
    bmi = weight_kg / (height_m ** 2) if height_m else 0

    inputs = {
        "mood": mood,
        "energy": energy,
        "hydration": hydration,
        "fatigue": fatigue,
        "goal": goal,
        "bmi": round(bmi, 1),
        "distance_km": distance_km,
        "weather": weather,
        "climb_difficulty": round(climb_difficulty, 2)
    }
    print(f"Generated ride inputs: {inputs}")
    return inputs
