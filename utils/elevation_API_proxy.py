import os
import requests
from flask import Blueprint, request, jsonify

# 載入 API 金鑰（建議從環境變數或 config 讀取）
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', 'AIzaSyBkChog68-PM96LHebsFoRx3kybDwocur4')

google_proxy = Blueprint('google_proxy', __name__)

@google_proxy.route('/api/elevation', methods=['GET'])
def get_elevation():
    lat_str = request.args.get('lat')
    lng_str = request.args.get('lng')
    try:
        if lat_str is None or lng_str is None:
            raise TypeError("lat or lng parameter is missing")
        lat = float(lat_str)
        lng = float(lng_str)
    except (TypeError, ValueError):
        return jsonify({"error": "Invalid lat or lng parameter"}), 400

    api_key = GOOGLE_MAPS_API_KEY  # 使用環境變數中的 Google API 金鑰
    url = f"https://maps.googleapis.com/maps/api/elevation/json?locations={lat},{lng}&key={'AIzaSyBpaGk99xhHsaCL2QRI2y2Mx786brPJUTg'}"

    try:
        response = requests.get(url)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500