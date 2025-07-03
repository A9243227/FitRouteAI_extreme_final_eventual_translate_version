const apiKey = 'AIzaSyBkChog68-PM96LHebsFoRx3kybDwocur4';

// 等待 DOM 和翻譯載入完成
document.addEventListener('DOMContentLoaded', function() {
  // 確保翻譯已載入
  if (typeof loadTranslations === 'function') {
    const currentLang = localStorage.getItem('language') || 'zh';
    loadTranslations(currentLang).then(() => {
      // 翻譯載入完成後初始化頁面
      initializeUI();
    });
  } else {
    // 如果翻譯函數不可用，直接初始化頁面
    initializeUI();
  }
});

// 監聽語言變更事件
document.addEventListener('languageChanged', function() {
  // 重新初始化UI以更新文本
  initializeUI();
});

function initializeUI() {
  // 更新頁面上的靜態文本
  updateStaticTexts();
}

function updateStaticTexts() {
  // 這裡可以更新一些不是通過 data-i18n 屬性設置的文本
  // 例如動態生成的內容或警告訊息
}

function isDarkMode() {
  return document.documentElement.getAttribute('data-theme') === 'dark';
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#242f3e' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'poi',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#d59563' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#38414e' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#212a37' }]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#9ca5b3' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#17263c' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#515c6d' }]
  },
  {
    featureType: 'water',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#17263c' }]
  }
];
function parseDurationTextToMinutes(durationText) {
  // 解析像 "1 小時 15 分鐘" 或 "20 分鐘" 的字串，轉成總分鐘數
  let hours = 0, minutes = 0;
  const hourMatch = durationText.match(/(\d+)\s*小時/);
  if (hourMatch) hours = parseInt(hourMatch[1], 10);
  const minuteMatch = durationText.match(/(\d+)\s*分鐘/);
  if (minuteMatch) minutes = parseInt(minuteMatch[1], 10);
  return hours * 60 + minutes;
}

function calculateRideMetrics({ distanceKm, durationMin }) {
  // 建議速度 = 距離（km） / 時間（小時）
  const suggestedSpeed = distanceKm / (durationMin / 60);
  // 建議熱量和水分只跟距離有關
  const suggestedCalories = Math.round(distanceKm * 35);  // 可調整系數
  const suggestedWaterMl = Math.round(distanceKm * 200);   // 可調整系數

  return {
    suggestedSpeed: suggestedSpeed.toFixed(1),
    suggestedCalories,
    suggestedWaterMl
  };
}

async function initMap() {
  const start = document.getElementById("start-input").value;
  const end = document.getElementById("end-input").value;

  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 12,
    center: { lat: 25.033, lng: 121.5654 }
  });

  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer({
    polylineOptions: {
      strokeColor: '#0033CC',
      strokeOpacity: 0.9,
      strokeWeight: 7
    }
  });
  directionsRenderer.setMap(map);

  directionsService.route({
    origin: start,
    destination: end,
    travelMode: google.maps.TravelMode.BICYCLING
  }, async (response, status) => {
    if (status === "OK") {
      directionsRenderer.setDirections(response);
      const leg = response.routes[0].legs[0];

      // 路線距離、時間顯示（時間顯示保留）
      document.getElementById("distance-info").textContent = `${translate('distance')}：${leg.distance.text}`;
      document.getElementById("duration-info").textContent = `${translate('time')}：${leg.duration.text}`;

      const startLatLng = leg.start_location;
      const endLatLng = leg.end_location;

      const [startElev, endElev] = await Promise.all([
        getElevation(startLatLng),
        getElevation(endLatLng)
      ]);

      const slope = (((endElev - startElev) / leg.distance.value) * 100).toFixed(2);
      
      const elevationInfoEl = document.getElementById("elevation-info");
      const slopeInfoEl = document.getElementById("slope-info");

      elevationInfoEl.textContent = `${translate('start_elevation')}：${startElev} m，${translate('end_elevation')}：${endElev} m`;
      slopeInfoEl.textContent = `${translate('estimate_slope')}：${slope}%`;

      // Make the elements visible
      elevationInfoEl.style.display = 'block';
      slopeInfoEl.style.display = 'block';
      // 取得距離 (km) 和時間 (分鐘數)
      const distanceKm = leg.distance.value / 1000;
      const durationMin = parseDurationTextToMinutes(leg.duration.text);
      const elevationGain = Math.max(0, endElev - startElev).toFixed(1);  // 若有下坡不變成負數
            
      const segmentData = {
        distance_km: parseFloat(distanceKm),
        elevation_gain: parseFloat(elevationGain)
      };

      // 傳給後端
      fetch("/update_segment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(segmentData)
      }).then(() => {
        // 傳完路線資訊後再呼叫 LLM
        startTipStreaming();
      });

      // 呼叫計算函式
      const metrics = calculateRideMetrics({ distanceKm, durationMin });

      // 更新頁面建議速度、熱量、水分
      document.getElementById("suggested_speed").textContent = `${metrics.suggestedSpeed} ${translate('km_per_h')}`;
      document.getElementById("suggested_calories").textContent = `${metrics.suggestedCalories} kcal`;
      document.getElementById("suggested_water_ml").textContent = `${metrics.suggestedWaterMl} ml`;

      // 刪除 estimated_time_min 的顯示 (不顯示預估時間)
      // 如果你的 HTML 有 <div id="estimated_time_min">，可以隱藏它
      const estimatedTimeEl = document.getElementById("estimated_time_min");
      if (estimatedTimeEl) estimatedTimeEl.style.display = 'none';

      // 顯示天氣與空氣品質（以起點為主）
      getWeatherInfo(startLatLng.lat(), startLatLng.lng());
      getAirQualityInfo(startLatLng.lat(), startLatLng.lng());

	// ✅ 儲存 polyline 供 /route 使用
    const route = response.routes[0];
    let polylineStr = null;
    const op = route.overview_polyline;

    if (typeof op === 'string') {
      polylineStr = op;
    } else if (op && typeof op.points === 'string') {
      polylineStr = op.points;
    }
    if (polylineStr) {
      localStorage.setItem("direction_polyline", polylineStr);
      console.log("✅ polyline 已儲存至 localStorage:", polylineStr);
    } else {
      console.warn("❌ 無法解析 polyline 格式：", op);
    }
    } else {
      alert(translate('cannot_get_route_info'));
    }
  });
}

async function getElevation(latLng) {
  const url = `/api/elevation?lat=${latLng.lat()}&lng=${latLng.lng()}`;
  const res = await fetch(url);
  const data = await res.json();
  return data.results[0]?.elevation.toFixed(1);
}

async function getWeatherInfo(lat, lng) {
  // 模擬資料（如有真實 Weather API，請替換此段）
  const content = `
    <p>${translate('temperature')}: ${(20 + Math.random() * 10).toFixed(1)}°C</p>
    <p>${translate('condition_sunny')}</p>
    <p>${translate('moisture')}: ${(50 + Math.random() * 30).toFixed(0)}%</p>
    <small>(${translate('simulated_data')})</small>
  `;
  updateInfoPanel('weather-info',`${content}`);
}

async function getAirQualityInfo(lat, lng) {
  const url = `https://airquality.googleapis.com/v1/currentConditions:lookup?key=${apiKey}`;
  const params = {
    location: { latitude: lat, longitude: lng }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    });
    const data = await res.json();
    const uaqi = data.indexes?.find(i => i.code === 'uaqi');

    if (uaqi) {
      const content = `
        <p>${translate('aqi')}：${uaqi.aqiDisplay}（${uaqi.category}）</p>
        <p>${translate('pollutants')}：${uaqi.dominantPollutant || translate('unknown')}</p>
        <div style="width: 100%; height: 10px; background-color: ${uaqi.color?.hex || '#ccc'}; border-radius: 4px;"></div>
      `;
      updateInfoPanel('air-quality-info', `${content}`);
    } else {
      updateInfoPanel('air-quality-info', `<p>${translate('cannot_get_data')}</p>`);
    }

  } catch (error) {
    console.error('Air Quality API Error:', error);
    updateInfoPanel('air-quality-info', `<p>${translate('load_failed')}</p>`);
  }
}

function updateInfoPanel(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function startWorkout() {
  const distEl = document.getElementById("distance-info");

  if (!distEl) {
    alert(translate('route_info_not_loaded'));
    return;
  }

  const text = distEl.textContent;
  const match = text.match(/：([\d.]+)\s*公里/);
  const distanceKm = match ? parseFloat(match[1]) : null;

  if (!distanceKm) {
    alert(translate('cannot_parse_distance'));
    return;
  }
  const startValue = document.getElementById("start-input").value;
  const endValue = document.getElementById("end-input").value;
  localStorage.setItem("startValue", startValue);
  localStorage.setItem("endValue", endValue);
  localStorage.setItem("segment_distance_km", distanceKm);
  console.log(`${translate('distance_saved')}: ${distanceKm} km`);

  location.href = "/route";
}
// 如果有其他頁籤改了 localStorage.theme，本頁也即時更新
window.addEventListener("storage", (event) => {
  if (event.key === "theme") {
    applyTheme(event.newValue);
  }
});

// 讓 HTML onclick 找得到
window.startWorkout = startWorkout;
window.initMap = initMap;
