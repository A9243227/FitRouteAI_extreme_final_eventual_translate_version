import os
import requests
from flask import Blueprint, request, jsonify

# 載入 API 金鑰（請放在 key.env 的 GOOGLE_MAPS_API_KEY）
GOOGLE_MAPS_API_KEY = os.getenv('GOOGLE_MAPS_API_KEY', '')

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

    # 原本這行把金鑰直接寫死在 f-string 裡，讓上面的 api_key（環境變數）完全沒作用
    api_key = GOOGLE_MAPS_API_KEY
    if not api_key:
        return jsonify({"error": "GOOGLE_MAPS_API_KEY is not configured"}), 500

    url = ("https://maps.googleapis.com/maps/api/elevation/json"
           f"?locations={lat},{lng}&key={api_key}")

    try:
        response = requests.get(url, timeout=10)
        response.raise_for_status()
        return jsonify(response.json())
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500