let map;
let routeCoords = [];
let userCoords = [];
let userMarker = null;
let routePolyline, userPolyline;
let isTracking = false;
let watchId = null;
let startTime = null;
let sessionStartTime = null;
let elapsedSeconds = 0;
let timerInterval = null;
let isTimerRunning = false;
let totalDistance = 0;
let averageSpeed = 0;

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
  document.getElementById('toggleBtn').textContent = isTracking ? translate('stop') : translate('start');
}

window.initMap = function () {
  const polylineStr = localStorage.getItem("direction_polyline");
  if (!polylineStr) {
    updateStatus(translate('cannot_find_route_polyline_data'));
    return;
  }

  const decodedPath = google.maps.geometry.encoding.decodePath(polylineStr);
  if (decodedPath.length < 2) {
    updateStatus(translate('no_valid_route_data_found'));
    return;
  }

  routeCoords = decodedPath.map(latlng => ({ lat: latlng.lat(), lng: latlng.lng() }));

  map = new google.maps.Map(document.getElementById("map"), {
    center: decodedPath[0],
    zoom: 15
  });

  routePolyline = new google.maps.Polyline({
    path: decodedPath,
    map: map,
    strokeColor: '#FF0000',
    strokeOpacity: 0.9,
    strokeWeight: 7
  });

  const bounds = new google.maps.LatLngBounds();
  decodedPath.forEach(p => bounds.extend(p));
  map.fitBounds(bounds);

  new google.maps.Marker({
    position: decodedPath[0],
    map: map,
    label: translate('start'),
    icon: "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
  });

  new google.maps.Marker({
    position: decodedPath[decodedPath.length - 1],
    map: map,
    label: translate('end_point'),
    icon: "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
  });

  navigator.geolocation.getCurrentPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    const position = new google.maps.LatLng(latitude, longitude);
    userMarker = new google.maps.Marker({
      position,
      map,
      title: translate('your_location'),
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeWeight: 2,
        strokeColor: 'white',
      }
    });
  }, (err) => {
    updateStatus(translate('failed_to_locate_position') + "：" + err.message);
  });
};

let hasConfirmedNoPlan = false;

function toggleTracking() {
  const course = document.getElementById('courseSelect');
  if (course && course.value === "" && !hasConfirmedNoPlan) {
    const proceed = confirm(translate('confirm_no_plan_save'));
    if (!proceed) return;
    hasConfirmedNoPlan = true;
  }
  isTracking = !isTracking;
  document.getElementById('toggleBtn').textContent = isTracking ? translate('stop') : translate('start');
  document.getElementById('endBtn').style.display = 'inline-block';
  isTracking ? startTracking() : stopTracking();
}

function startTracking() {
  updateStatus(translate('locating'));

  if (userCoords.length === 0) {
    sessionStartTime = getLocalTimeString();
    elapsedSeconds = 0;
    totalDistance = 0;
    document.getElementById("elapsedTime").textContent = '0';
    document.getElementById("totalDistance").textContent = '0.0';
    document.getElementById("avgSpeed").textContent = '0.0';
  }

  if (!userPolyline) {
    userPolyline = new google.maps.Polyline({
      path: [],
      map,
      strokeColor: "#0000FF",
      strokeOpacity: 1.0,
      strokeWeight: 2,
    });
  }

  if (!isTimerRunning) {
    startTime = Date.now();
    timerInterval = setInterval(() => {
      const now = Date.now();
      const currentDuration = Math.floor((now - startTime) / 1000);
      const totalElapsed = elapsedSeconds + currentDuration;

      document.getElementById("elapsedTime").textContent = totalElapsed;
      const avg = totalDistance / totalElapsed;
      averageSpeed = avg * 3.6;
      document.getElementById("avgSpeed").textContent = averageSpeed.toFixed(1);
    }, 1000);
    isTimerRunning = true;
  }

  watchId = navigator.geolocation.watchPosition((pos) => {
    const { latitude, longitude } = pos.coords;
    const position = new google.maps.LatLng(latitude, longitude);
    userCoords.push(position);
    userPolyline.setPath(userCoords);

    if (!userMarker) {
      userMarker = new google.maps.Marker({
        position,
        map,
        title: translate('your_location'),
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 8,
          fillColor: '#4285F4',
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: 'white',
        }
      });
    } else {
      userMarker.setPosition(position);
    }

    if (userCoords.length >= 2) {
      const prev = userCoords[userCoords.length - 2];
      const dist = google.maps.geometry.spherical.computeDistanceBetween(prev, position);
      if (dist > 1) {
        totalDistance += dist;
        document.getElementById("totalDistance").textContent = totalDistance.toFixed(1);
      }
    }

    const onRoute = google.maps.geometry.poly.isLocationOnEdge(position, routePolyline, 0.0001);
    updateStatus(onRoute ? translate('on_route') : translate('off_course'));
  }, (err) => {
    updateStatus(translate('positioning_error') + "：" + err.message);
  }, {
    enableHighAccuracy: true,
    maximumAge: 1000,
    timeout: 5000
  });
}

function stopTracking() {
  if (watchId) {
    navigator.geolocation.clearWatch(watchId);
    watchId = null;
  }
  if (timerInterval) {
    const pausedAt = Date.now();
    const duration = Math.floor((pausedAt - startTime) / 1000);
    elapsedSeconds += duration;

    clearInterval(timerInterval);
    timerInterval = null;
    isTimerRunning = false;
  }
}

function endSession() {
  const confirmEnd = window.confirm(translate('confirm_end_training'));
  if (!confirmEnd) return;

  if (!sessionStartTime) {
    location.href = '/';
    return;
  }

  stopTracking();

  // 取得目前選擇的訓練計畫
  const planSelect = document.getElementById('courseSelect');
  const plan = planSelect ? planSelect.value : "";

  // 新增：如果沒有選擇課程就不回傳json檔
  if (planSelect && planSelect.value === "") {
    location.href = '/';
    return;
  }

  const endTime = new Date();
  const filename = sessionStartTime.replace(/[: ]/g, '-');

  const durationMs = endTime - parseLocalTime(sessionStartTime);
  const durationSec = Math.floor(durationMs / 1000);

  const startValue = localStorage.getItem('startValue') || "";
  const endValue = localStorage.getItem('endValue') || "";

  const data = {
    start_time: sessionStartTime,
    duration: durationSec,
    distance: totalDistance,
    average_speed: averageSpeed,
    plan: plan,
    start: startValue,
    end: endValue
  };

  fetch('/save_ride', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ filename, data })
  }).then(res => {
    console.log('saved:', res);
    location.href = '/';
  });
}

function updateStatus(text) {
  const statusEl = document.getElementById("status");
  if (statusEl) statusEl.textContent = text;
}

function getLocalTimeString() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const MM = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${yyyy}-${MM}-${dd} ${hh}:${mm}:${ss}`;
}

function parseLocalTime(timeStr) {
  const [datePart, timePart] = timeStr.split(' ');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute, second] = timePart.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, second);
}

// 讓 HTML onclick 找得到
window.toggleTracking = toggleTracking;
window.endSession = endSession;
