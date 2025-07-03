import pandas as pd
from flask import jsonify
import xgboost as xgb
import os
import joblib
# Load model at module level so it's loaded only once

xgb_model = joblib.load("model/xgb_model.pkl")

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
    return  pred_time_sec
    
