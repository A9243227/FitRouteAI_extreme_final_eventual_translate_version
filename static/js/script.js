// === 成就動畫樣式 + 渲染函式 ===
const achievementMap = {
  century: { icon: "🏆", title: "Century Rider", desc: "Ride 100km" },
  early_bird: { icon: "🌅", title: "Early Bird", desc: "Before 6AM" },
  consistent: { icon: "🔄", title: "Consistent Rider", desc: "Ride 3x this week" },
  speed_demon: { icon: "💨", title: "Speed Demon", desc: "35km/h avg speed" }
};

function renderAchievementsGrid(unlocked = []) {
  const grid = document.getElementById("achievements-grid");
  if (!grid) return;
  let html = "";
  for (const [key, info] of Object.entries(achievementMap)) {
    const achieved = unlocked.includes(key);
    html += `
      <div class="achievement-card ${achieved ? 'unlocked' : ''}">
        ${info.icon}<br><strong style="color: #3b82f6;">${info.title}</strong><br>
        <small>${achieved ? '✅ Completed' : '🔒 Locked'} - ${info.desc}</small>
      </div>
    `;
  }
  grid.innerHTML = html;
}

// 插入動畫樣式
const style = document.createElement('style');
style.textContent = `
.achievement-card {
  text-align: center;
  padding: 10px;
  border-radius: 12px;
  border: 2px solid #ccc;
  transition: all 0.3s ease;
}
.achievement-card.unlocked {
  border-color: gold;
  animation: glow 1.5s infinite alternate;
  background:rgba(255, 255, 255, 0.49);
}
@keyframes glow {
  from { box-shadow: 0 0 5px gold; }
  to { box-shadow: 0 0 20px gold; }
}`;
document.head.appendChild(style);

const app = document.getElementById('app');
const navItems = document.querySelectorAll('.nav-item');

navItems.forEach(item => {
  item.addEventListener('click', () => {
    navItems.forEach(i => i.classList.remove('active'));
    item.classList.add('active');
    const page = item.dataset.page;
    loadPage(page);
  });
});

function loadPage(page) {
  if (page === 'home') renderHome();
  else if (page === 'plans') renderPlans();
  else if (page === 'progress') renderProgress();
  else if (page === 'profile') renderProfile();
  else renderComingSoon(page);
}

// --- Home 頁 ---
function renderHome() {
  // 本地翻譯函數
  function localTranslate(key) {
    // 如果全域翻譯函數存在且不是當前函數，使用它
    if (typeof window.translate === 'function' && window.translate !== localTranslate) {
      return window.translate(key);
    }
    
    // 備用翻譯對照表
    const fallbackTranslations = {
      'hello': '您好',
      'happy_to_see_you': '很高興見到您！'
    };
    
    return fallbackTranslations[key] || key;
  }

  app.innerHTML = `
    
    <div class="logo">
      <img src="/static/images/FIT logo2.png" alt="Fit Logo" class="logo-img"><span>Route AI</span>
    </div>

    <div class="hero-box">
     <!-- 文字區塊 -->
      <div class="welcome-text">
        <h2>${localTranslate('hello')}, ${user_name || 'Guest'}!</h2>
        <p>${localTranslate('happy_to_see_you')}</p>
      </div>

       <!-- 人物圖片 -->
      <div class="hero-image-container">
        <img src="/static/images/hero-bike.png" alt="Cyclist Hero" class="hero-image" />
      </div>

       <!-- START 按鈕 -->
      <div class="start-button-wrapper">
        <div class="activity-card activity-start" onclick="location.href='/mood'">
          <img src="/static/images/start-icon.png" alt="Start" />
        </div>
      </div>
    </div>
  `;
}


// --- Plans 頁 ---
function renderPlans() {
  // 本地翻譯函數
  function localTranslate(key) {
    // 如果全域翻譯函數存在且不是當前函數，使用它
    if (typeof window.translate === 'function' && window.translate !== localTranslate) {
      return window.translate(key);
    }
    
    // 備用翻譯對照表
    const fallbackTranslations = {
      'training_plans': '訓練計畫',
      'week': '週',
      'custom': '自訂',
      'pacing': '配速'
    };
    
    return fallbackTranslations[key] || key;
  }

  app.innerHTML = `
    <div class="plans-header"><h2>${localTranslate('training_plans')}</h2></div>
    <div class="tabs">
      <div class="tab active" onclick="switchTab('week')">${localTranslate('week')}</div>
      <div class="tab" onclick="switchTab('custom')">${localTranslate('custom')}</div>
      <div class="tab" onclick="switchTab('pacing')">${localTranslate('pacing')}</div>
    </div>
    <div id="plan-content"></div>
  `;
  renderWeek();
}

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelector(`.tab[onclick*="${tab}"]`).classList.add('active');
  if (tab === 'week') renderWeek();
  else if (tab === 'pacing') renderPacing();
  else renderCustom();
}

// 新增 fetchAndRenderPlan，改為 renderWeek 內容
function renderWeek() {
  // 本地翻譯函數
  function localTranslate(key) {
    // 如果全域翻譯函數存在且不是當前函數，使用它
    if (typeof window.translate === 'function' && window.translate !== localTranslate) {
      return window.translate(key);
    }
    
    // 備用翻譯對照表
    const fallbackTranslations = {
      'match_date': '比賽日期',
      'target_hours': '目標時數',
      'training_days': '訓練日',
      'training_plan': '訓練計畫'
    };
    
    return fallbackTranslations[key] || key;
  }

  const container = document.getElementById("plan-content");
  container.innerHTML = `
    <div class="plan-form">
      <label>${localTranslate('match_date')}（YYYY-MM-DD）：<input type="date" id="race-date-input" value="2025-07-10" /></label><br>
      <label>${localTranslate('target_hours')}：<input type="number" id="target-hours-input" value="20" min="1" /></label><br>
      <label>${localTranslate('training_days')}：</label>
      <label><input type="checkbox" class="training-day" value="Mon"> Mon</label>
      <label><input type="checkbox" class="training-day" value="Tue" checked> Tue</label>
      <label><input type="checkbox" class="training-day" value="Wed" checked> Wed</label>
      <label><input type="checkbox" class="training-day" value="Thu" checked> Thu</label>
      <label><input type="checkbox" class="training-day" value="Fri" checked> Fri</label>
      <label><input type="checkbox" class="training-day" value="Sat" checked> Sat</label>
      <label><input type="checkbox" class="training-day" value="Sun" checked> Sun</label><br>
      <button onclick="renderWeekResult()">${localTranslate('training_plan')}</button>
    </div>
    <div id="plan-result"></div>
  `;
}

function renderWeekResult() {
  const dateInput = document.getElementById("race-date-input");
  const targetHoursInput = document.getElementById("target-hours-input");
  const checkboxes = document.querySelectorAll(".training-day:checked");

  console.log("dateInput:", dateInput);
  console.log("targetHoursInput:", targetHoursInput);
  console.log("checkboxes checked count:", checkboxes.length);

  // 原本寫的是 !targetHoursInput（永遠為 false，等於沒檢查到目標時數）
  if (!dateInput || !targetHoursInput ||
      !dateInput.value || !targetHoursInput.value || checkboxes.length === 0) {
    alert("請完整填寫比賽日期、目標時數與訓練日");
    return;
  }

  const raceDateParts = dateInput.value.split("-");
  const trainingDays = Array.from(checkboxes).map(cb => cb.value);
  const targetHours = parseFloat(targetHoursInput.value);


  fetch('/api/plan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      race_date: raceDateParts.map(Number),
      training_days: trainingDays,
      target_hours: targetHours
    })
  })
    .then(response => response.json())
    .then(data => {
      const resultContainer = document.getElementById("plan-result");

      if (data.error) {
        resultContainer.innerHTML = `<div class="error">${data.error}</div>`;
        return;
      }

      const rollingWeekDates = data.rolling_week_dates;

      if (!rollingWeekDates) {
        resultContainer.innerHTML = `<div class="error">無法取得日期資料。</div>`;
        return;
      }

      let html = `<div class="phase-title">Cycle Phase</div>`;
      html += `<div class="week-plan-grid">`;

      // 將 { day: date } 轉成 [ [day, date], ... ] 並依日期排序
      const dayDatePairs = Object.entries(rollingWeekDates).sort(
        (a, b) => new Date(a[1]) - new Date(b[1])
      );

      for (const [day, dateStr] of dayDatePairs) {
        const sessions = data.weekly_plan[day] || [];
        const segments = sessions.map(seg => `${seg.name} (${seg.duration} min)`).join(' + ');
        const totalMins = sessions.reduce((sum, s) => sum + (s.duration || 0), 0);
        html += `<div class="day-card">
          <h4>${day}</h4>
          <div class="date">${dateStr}</div> 
          <div class="types">${segments}</div><br><br>
          <div class="duration-badge">${totalMins}min</div>
        </div>`;
      }

      html += `</div>`;  // 對應上面的 <div class="week-plan-grid">，原本誤寫成 </ul>
      resultContainer.innerHTML = html;
    })
    .catch(error => {
      console.error('取得訓練計畫失敗：', error);
      const resultContainer = document.getElementById("plan-result");
      if (resultContainer) {
        resultContainer.innerHTML = `<div class="error">無法取得訓練計畫，請稍後再試。</div>`;
      }
    });
}
function renderPacing() {
  // 本地翻譯函數
  function localTranslate(key) {
    // 如果全域翻譯函數存在且不是當前函數，使用它
    if (typeof window.translate === 'function' && window.translate !== localTranslate) {
      return window.translate(key);
    }
    
    // 備用翻譯對照表
    const fallbackTranslations = {
      'generate_pacing_strategy': '產生配速策略',
      'choose_segment_id': '選擇路段 ID',
      'show_chart': '顯示圖表'
    };
    
    return fallbackTranslations[key] || key;
  }

  const container = document.getElementById("plan-content");
  if (!container) {
    console.warn("⚠️ 找不到 plan-content 容器，無法渲染 pacing tab");
    return;
  }

  // 範例下拉選單 options，可改成動態載入
  const segmentOptions = [
    { id: "7047153", name: "劍南路 (由北安路上)" },
    { id: "1761462", name: "中社路 full climb" },
    { id: "3907879", name: "混元宮到明德宮" },
    { id: "641218", name: "TAS: WanLi Bridge-FongGueiZuei (5.4k)" },
    { id: "802344", name: "WZS:大湖街上五指山(拉瓦那咖啡)" },
    { id: "2965631", name: "Neverstop Wulin" },
    { id: "5782274", name: "大禹嶺 --> 武嶺" },
    { id: "4928093", name: "136 正上" },
    { id: "13202808", name: "華山路" },
    { id: "4916176", name: "白毛山 國姓正上" },
  ];

  container.innerHTML = `
  <div id="pacing-generator">
    <h2>${localTranslate('generate_pacing_strategy')}</h2>
    <select id="segmentIdSelect" class="setting-input" style="width: 350px; margin-top: 1rem;">
      <option value="">${localTranslate('choose_segment_id')}</option>
      ${segmentOptions.map(opt => `<option value="${opt.id}">${opt.name}</option>`).join("")}
    </select>
    <button id="generateBtn">${localTranslate('show_chart')}</button>
    <br />

    <!-- 載入中動畫 -->
    <div id="loadingIndicator" style="display: none; margin-top: 1rem; text-align: center;">
      <div class="spinner"></div>
    </div>

    <!-- 圖片：預設隱藏 -->
    <img id="pacingChart" src="" alt="Pacing Strategy Chart" style="max-width: 100%; margin-top: 1rem; display: none;" />
  </div>

  <!-- Spinner CSS -->
  <style>
    .spinner {
      width: 32px;
      height: 32px;
      border: 4px solid #ccc;
      border-top-color: #007bff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: auto;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
`;

  // 綁定按鈕事件
  document.getElementById("generateBtn").addEventListener("click", async () => {
    const selectedSegmentId = document.getElementById("segmentIdSelect").value;
    const loadingIndicator = document.getElementById("loadingIndicator");
    const pacingChart = document.getElementById("pacingChart");

    if (!selectedSegmentId) {
      alert("請選擇 Segment ID！");
      return;
    }

    // 顯示 loading，隱藏圖片
    loadingIndicator.style.display = "block";
    pacingChart.style.display = "none";

    try {
      const response = await fetch("/api/pacing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ segmentID: selectedSegmentId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert("錯誤：" + errorData.error);
        return;
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);

      // 顯示圖片
      pacingChart.src = imageUrl;
      pacingChart.style.display = "block";
    } catch (error) {
      alert("發生錯誤：" + error.message);
    } finally {
      // 不論成功失敗都關掉 loading
      loadingIndicator.style.display = "none";
    }
  });
}


function renderCustom() {
  // 本地翻譯函數
  function localTranslate(key) {
    // 如果全域翻譯函數存在且不是當前函數，使用它
    if (typeof window.translate === 'function' && window.translate !== localTranslate) {
      return window.translate(key);
    }
    
    // 備用翻譯對照表
    const fallbackTranslations = {
      'custom_plan_setup': '自訂計畫設定',
      'weight': '體重',
      'avg_power': '平均功率',
      'distance': '距離',
      'avg_grade': '平均坡度',
      'season': '季節',
      'spring': '春季',
      'summer': '夏季',
      'fall': '秋季',
      'winter': '冬季',
      'simulate': '模擬',
      'predicted_time': '預測時間',
      'power_to_weight_ratio': '功率重量比',
      'route_difficulty': '路線難度',
      'climb_classification': '爬坡分級'
    };
    
    return fallbackTranslations[key] || key;
  }

  document.getElementById('plan-content').innerHTML = `
    <div class="custom-plan-wrapper">
      <form id="custom-form" class="custom-form-container">
        <h2 class="custom-form-title">💪 ${localTranslate('custom_plan_setup')}</h2>

        <div class="custom-grid">
          <div class="custom-field">
            <label for="weight_kg">⚖️ ${localTranslate('weight')} (kg)</label>
            <input type="number" id="weight_kg" name="weight_kg" placeholder="e.g. 60" required step="0.1">
          </div>

          <div class="custom-field">
            <label for="avg_power_w">⚡ ${localTranslate('avg_power')} (W)</label>
            <input type="number" id="avg_power_w" name="avg_power_w" placeholder="e.g. 180" required step="1">
          </div>

          <div class="custom-field">
            <label for="distance_m">📏 ${localTranslate('distance')} (m)</label>
            <input type="number" id="distance_m" name="distance_m" placeholder="e.g. 5000" required step="1">
          </div>

          <div class="custom-field">
            <label for="avg_grade">⛰️ ${localTranslate('avg_grade')} (%)</label>
            <input type="number" id="avg_grade" name="avg_grade" placeholder="e.g. 2.5" required step="0.1">
          </div>

          <div class="custom-field full-width">
            <label for="season">🌤️ ${localTranslate('season')}</label>
            <!-- 原本沒有 name，FormData 收不到 season；也沒有 value，
                 中文介面下會把「春季」送到後端而不是 "Spring" -->
            <select id="season" name="season" required>
              <option value="Spring">${localTranslate('spring')}</option>
              <option value="Summer">${localTranslate('summer')}</option>
              <option value="Fall">${localTranslate('fall')}</option>
              <option value="Winter">${localTranslate('winter')}</option>
            </select>
          </div>
        </div>

        <!-- ✅ 這一段是新的按鈕區塊 -->
        <div class="form-row full-width">
          <div class="button-wrapper center">
            <button type="submit" class="simulate-btn">🚀 ${localTranslate('simulate')}</button>
          </div>
        </div>
      </form>

      <div id="prediction-result" class="prediction-output"></div>
    </div>
  `;


  function computeWPerKg(weight, power) {
    return (power / weight);
  }

  function computeDifficulty(distance, grade) {
    return (distance * grade) * Math.pow(grade, 3 / 2) / 10000;
  }

  function classifyClimb(difficulty) {
    let level;

    if (difficulty < 20) {
      level = "Cat 4";
    } else if (difficulty <= 50) {
      level = "Cat 3";
    } else if (difficulty <= 120) {
      level = "Cat 2";
    } else if (difficulty <= 200) {
      level = "Cat 1";
    } else {
      level = "HC (Hors Catégorie)";
    }

    return level;
  }

  function secondsToHHMMSS(seconds) {
    const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
    const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
    const s = Math.floor(seconds % 60).toString().padStart(2, '0');
    return `${h}:${m}:${s}`;
  }

  document.getElementById('custom-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const payload = { mode: "custom" };

    let weight = parseFloat(formData.get("weight_kg"));
    let power = parseFloat(formData.get("avg_power_w"));
    let distance = parseFloat(formData.get("distance_m"));
    let grade = parseFloat(formData.get("avg_grade"));

    const wPerKg = computeWPerKg(weight, power);
    const difficulty = computeDifficulty(distance, grade);
    const climbClass = classifyClimb(difficulty);

    formData.forEach((value, key) => {
      payload[key] = isNaN(value) ? value : parseFloat(value);
    });

    payload["w_per_kg"] = parseFloat(wPerKg.toFixed(2));
    payload["difficulty"] = parseFloat(difficulty.toFixed(2));

    const response = await fetch('/api/plan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const result = await response.json();

    if (result.error) {
      document.getElementById('prediction-result').innerHTML =
        `<div class="error">Error：${result.error}</div>`;
    } else {
      const hhmmss = secondsToHHMMSS(result.predicted_time);
      document.getElementById('prediction-result').innerHTML = `
        <div class="result-box">
          <p>🕒 <strong>${localTranslate('predicted_time')}:</strong> ${hhmmss}</p>
          <p>⚖️ <strong>${localTranslate('power_to_weight_ratio')}:</strong> ${wPerKg.toFixed(2)} W/kg</p>
          <p>📈 <strong>${localTranslate('route_difficulty')}:</strong> ${difficulty.toFixed(2)}</p>
          <p>⛰️ <strong>${localTranslate('climb_classification')}:</strong> ${climbClass}</p>
        </div>`;
    }
  });
}


function viewDetail(title) {
  app.innerHTML = `
    <div class="plan-detail">
      <h2>${title}</h2>
      <p>Details about the plan: training instructions, goals, and expectations.</p>
      <button class="submit-btn" onclick="loadPage('plans')">Back to Plans</button>
    </div>
  `;
}

// --- Progress頁 ---
function renderProgress() {
  // 本地翻譯函數
  function localTranslate(key) {
    // 如果全域翻譯函數存在且不是當前函數，使用它
    if (typeof window.translate === 'function' && window.translate !== localTranslate) {
      return window.translate(key);
    }
    
    // 備用翻譯對照表
    const fallbackTranslations = {
      'activity_statistics': '活動統計',
      'week': '週',
      'month': '月',
      'year': '年',
      'total_distance': '總距離',
      'total_duration': '總時長',
      'average_speed': '平均速度',
      'weekly_distance': '每週距離',
      'weekly_trend': '每週趨勢',
      'monthly_trend': '每月趨勢',
      'yearly_trend': '每年趨勢',
      'recent_trend': '近期趨勢',
    };
    
    return fallbackTranslations[key] || key;
  }

  app.innerHTML = `
    <div class="plans-header"><h2>${localTranslate('activity_statistics')}</h2></div>

    <div class="tabs">
      <div class="tab active" data-type="week">${localTranslate('week')}</div>
      <div class="tab" data-type="month">${localTranslate('month')}</div>
      <div class="tab" data-type="year">${localTranslate('year')}</div>
    </div>

    <!-- Summary cards (distance, avg speed, etc) -->
    <div id="summary-cards" class="activity-grid" style="grid-template-columns: repeat(2, 1fr); margin: 20px 0;">
      <!-- JS will inject cards like:
      <div class="plan-card" style="text-align: center;">
        <div style="font-size: 24px; color: #3b82f6;">85 km</div>
        <small>Distance</small><br><small style="color:green;">+12% from last week</small>
      </div>
      -->
    </div>

    <!-- Weekly trend bar chart -->
    <div class="plans-header" style="margin-top: 30px;"><h3>${localTranslate('weekly_distance')}</h3></div>
    <div id="trend-section" class="plan-card" style="text-align: center;">
      <!-- JS will inject bar chart like:
      <small>Last 4 Weeks</small>
      <div style="display: flex; align-items: flex-end; justify-content: space-around; margin-top: 10px; height: 80px;">
        <div style="width: 15px; height: 60%; background: linear-gradient(#93c5fd, #3b82f6); border-radius: 8px;"></div>
        ...
      </div>
      <small>Distance trend chart</small>
      -->
    </div>

    <!-- Achievements -->
    <div class="activity-grid" id="achievements-grid" style="grid-template-columns: repeat(2, 1fr);">
    </div>

    <!-- Recent Activities -->
    <div class="plans-header" style="margin-top: 30px;">
    </div>
    <div class="activity-grid" id="recent-activity-grid" style="grid-template-columns: 1fr;">
      <!-- JS will inject activities like:
      <div class="plan-card" style="display:flex; align-items:center; gap:10px;">...</div>
      -->
    </div>

  `;

  fetch('/get_stats')
    .then(response => response.json())
    .then(rawData => {
      const data = rawData.statistics || {};
      let recent = Array.isArray(rawData.recent_activities) ? rawData.recent_activities.slice() : [];
      const planDescriptionMap = {
        a: "Recovery Ride",
        b: "Endurance",
        c: "Tempo",
        d: "Threshold",
        e: "VO2 Max",
        f: "Anaerobic/Sprint"
      };
      const titlePlanMap = Object.fromEntries(Object.entries(planDescriptionMap).map(([k, v]) => [v, k]));

      if (Array.isArray(recent)) {
        recent = recent.map(act => {
          let newAct = { ...act };
          if (act.start && act.end) {
            newAct.title = `${act.start} to ${act.end}`;
          }
          if (act.plan && planDescriptionMap[act.plan]) {
            newAct.description = planDescriptionMap[act.plan];
          }
          return newAct;
        });
      }

      recent.sort((a, b) => {
        const parse = d => {
          if (!d.date) return 0;
          const parts = d.date.split("-");
          if (parts.length === 6) {
            return Date.parse(`${parts[0]}-${parts[1]}-${parts[2]}T${parts[3]}:${parts[4]}:${parts[5]}`);
          }
          return Date.parse(d.date);
        };
        return parse(b) - parse(a);
      });

      // 用於暫存本次 session 內的 title 變更
      let editedTitlesSession = {};

      const formatDuration = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h}h ${m}m ${s}s`;
      };

      const formatDurationDiff = (current, previous) => {
        if (!previous || previous === 0) return '<span style="color:gray;">—</span>';
        const diff = current - previous;
        const color = diff > 0 ? 'green' : diff < 0 ? 'red' : 'gray';
        const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
        const abs = Math.abs(diff);
        const h = Math.floor(abs / 3600);
        const m = Math.floor((abs % 3600) / 60);
        const s = abs % 60;
        const parts = [
          h > 0 ? `${h}h` : '',
          m > 0 || h > 0 ? `${m}m` : '',
          `${s}s`
        ].filter(Boolean).join(' ');
        return `<span style="color:${color};">${sign}${parts}</span>`;
      };

      const formatDiff = (cur, prev, unit, digits = 1) => {
        if (!prev || prev === 0) return '<span style="color:gray;">—</span>';
        const diff = cur - prev;
        const sign = diff > 0 ? '+' : diff < 0 ? '−' : '';
        const color = diff > 0 ? 'green' : diff < 0 ? 'red' : 'gray';
        return `<span style="color:${color};">${sign}${Math.abs(diff).toFixed(digits)}${unit}</span>`;
      };

      const getWeekNumber = (date) => {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
      };

      function getMondayOfWeek(year, week) {
        const simple = new Date(year, 0, 1 + (week - 1) * 7);
        const dow = simple.getDay();
        const monday = new Date(simple);
        if (dow <= 4)
          monday.setDate(simple.getDate() - simple.getDay() + 1);
        else
          monday.setDate(simple.getDate() + 8 - simple.getDay());
        return monday;
      }

      function formatMonthDay(date) {
        return `${date.getMonth() + 1}/${date.getDate()}`;
      }

      function getMonthName(month) {
        const names = [
          "January", "February", "March", "April", "May", "June",
          "July", "August", "September", "October", "November", "December"
        ];
        return names[month - 1];
      }

      const getCurrent = (type) => {
        const now = new Date();
        const year = now.getFullYear();
        if (type === 'week') {
          const week = getWeekNumber(now);
          return { key: `${year}_w${week}`, label: `W${week}`, year, number: week };
        } else if (type === 'month') {
          const month = now.getMonth() + 1;
          return { key: `${year}_m${month}`, label: `M${month}`, year, number: month };
        } else if (type === 'year') {
          return { key: `${year}_y`, label: `${year}`, year };
        }
      };

      const getPrevious = (type, current) => {
        if (type === 'week') {
          let y = current.year, w = current.number - 1;
          if (w < 1) {
            y--;
            const dec31 = new Date(`${y}-12-31`);
            w = getWeekNumber(dec31);
          }
          return { key: `${y}_w${w}` };
        } else if (type === 'month') {
          let y = current.year, m = current.number - 1;
          if (m < 1) {
            y--;
            m = 12;
          }
          return { key: `${y}_m${m}` };
        } else if (type === 'year') {
          return { key: `${current.year - 1}_y` };
        }
      };

      const extractTrend = (type) => {
        const now = new Date();
        const trend = [];

        if (type === 'week') {
          const current = getCurrent('week');
          let y = current.year;
          let w = current.number;
          for (let i = 0; i < 4; i++) {
            const key = `${y}_w${w}`;
            if (data[`${key}_distance`] !== undefined) {
              const monday = getMondayOfWeek(y, w);
              const sunday = new Date(monday);
              sunday.setDate(monday.getDate() + 6);
              trend.unshift({
                label: `${formatMonthDay(monday)}~${formatMonthDay(sunday)}`,
                distance: data[`${key}_distance`],
                duration: data[`${key}_duration`],
                average_speed: data[`${key}_avg_speed`],
                date: monday
              });
            }
            w--;
            if (w < 1) {
              y--;
              const dec31 = new Date(`${y}-12-31`);
              w = getWeekNumber(dec31);
            }
          }
        } else if (type === 'month') {
          const current = getCurrent('month');
          let y = current.year;
          let m = current.number;
          for (let i = 0; i < 4; i++) {
            const key = `${y}_m${m}`;
            if (data[`${key}_distance`] !== undefined) {
              const monthName = new Date(y, m - 1).toLocaleString('en-US', { month: 'short' });
              trend.unshift({
                label: monthName,
                distance: data[`${key}_distance`],
                duration: data[`${key}_duration`],
                average_speed: data[`${key}_avg_speed`]
              });
            }
            m -= 1;
            if (m === 0) {
              m = 12;
              y -= 1;
            }
          }
        } else if (type === 'year') {
          const thisYear = now.getFullYear();
          for (let y = thisYear - 3; y <= thisYear; y++) {
            const key = `${y}_y`;
            if (data[`${key}_distance`] !== undefined) {
              trend.push({
                label: `${y}`,
                distance: data[`${key}_distance`],
                duration: data[`${key}_duration`],
                average_speed: data[`${key}_avg_speed`]
              });
            }
          }
        }

        return trend;
      };

      const createBarChart = (values) => {
        const max = Math.max(...values.map(v => v.distance)) || 1;
        return values.map(val => {
          const h = Math.round((val.distance / max) * 100);
          return `
            <div style="width: 60px; text-align: center; margin: 0 15px;">
              <div style="height: ${h}px; background: linear-gradient(#93c5fd, #3b82f6); border-radius: 8px;"
                title="${val.label}\n${val.distance.toFixed(1)} km\n${formatDuration(val.duration)}\n${val.average_speed.toFixed(1)} km/h">
              </div>
              <div style="margin-top: 6px; font-size: 13px; font-weight: bold;">${val.label}</div>
              <div style="font-size: 12px; color: #2563eb;">${val.distance.toFixed(1)} km</div>
            </div>
          `;
        }).join('');
      };

      let showAll = false;
      let currentPage = 1;
      const pageSize = 10;

      function renderRecentActivities() {
        const grid = document.getElementById('recent-activity-grid');
        const pagination = document.getElementById('recent-activity-pagination');
        let html = '';
        let total = recent.length;
        let pageCount = Math.ceil(total / pageSize);
        let displayCount = showAll ? Math.min(pageSize, total - (currentPage - 1) * pageSize) : Math.min(5, total);

        let startIdx = showAll ? (currentPage - 1) * pageSize : 0;
        let endIdx = showAll ? Math.min(startIdx + pageSize, total) : displayCount;

        for (let i = startIdx; i < endIdx; i++) {
          const act = recent[i];
          if (act) {
            html += `
          <div class="plan-card" style="display:flex; align-items:center; gap:10px;">
            <div style="font-size:24px;">${act.icon || '🚴'}</div>
            <div style="flex-grow:1;">
          <div style="font-weight:bold; font-size:16px;">${act.title || '-'}</div>
          <br>
          <small>
            ${act.distance ? (act.distance / 1000).toFixed(1) : '-'} km ・ 
            ${act.avg_speed ? act.avg_speed.toFixed(1) + ' km/h ・ ' : ''}
            ${act.date || '-'} ・ 
            <span style="color:green;">${act.diff_text || ''}</span>
          </small>
          ${act.description ? `<div style="font-size:12px;color:#c23f3f;margin-top:4px;">${act.description}</div>` : ''}
            </div>
            <div style="font-weight:bold;">${act.duration ? formatDuration(act.duration) : '-'}</div>
          </div>
        `;
          } else {
            html += `
          <div class="plan-card" style="display:flex; align-items:center; gap:10px; opacity:0.5;">
            <div style="font-size:24px;">—</div>
            <div style="flex-grow:1;">
          <div style="font-weight:bold; font-size:16px;">—</div>
          <br>
          <small>—</small>
            </div>
            <div style="font-weight:bold;">—</div>
          </div>
        `;
          }
        }
        if (grid) {
          grid.innerHTML = html;
        }

        // 分頁按鈕
        if (pagination) {
          if (showAll && pageCount > 1) {
            let pageBtns = '';
            for (let p = 1; p <= pageCount; p++) {
              pageBtns += `<button class="page-btn" data-page="${p}" style="margin:0 4px; min-width:38px; min-height:38px; font-size:18px; border-radius:8px;${p === currentPage ? 'background:#3b82f6;color:#fff;' : ''}">${p}</button>`;
            }
            pagination.innerHTML = pageBtns;
            pagination.querySelectorAll('.page-btn').forEach(btn => {
              btn.addEventListener('click', function () {
                currentPage = parseInt(this.dataset.page, 10);
                renderRecentActivities();
                document.getElementById('recent-activity-grid').scrollIntoView({ behavior: 'smooth', block: 'start' });
              });
            });
          } else {
            pagination.innerHTML = '';
          }
        }
      }

      function showSaveBar() {
        // 已無下拉式選單，不需顯示 save bar
        const saveBar = document.getElementById('recent-activity-savebar');
        if (saveBar) saveBar.innerHTML = "";
      }

      const updateTrend = (type) => {
        const current = getCurrent(type);
        const previous = getPrevious(type, current);

        const d = data[`${current.key}_distance`] || 0;
        const t = data[`${current.key}_duration`] || 0;
        const s = data[`${current.key}_avg_speed`] || 0;

        const dPrev = data[`${previous.key}_distance`] || 0;
        const tPrev = data[`${previous.key}_duration`] || 0;
        const sPrev = data[`${previous.key}_avg_speed`] || 0;

        const trendData = extractTrend(type);

        // 設定 title
        let title = '';
        if (type === 'week') {
          title = localTranslate('weekly_trend');
        } else if (type === 'month') {
          title = localTranslate('monthly_trend');
        } else if (type === 'year') {
          title = localTranslate('yearly_trend');
        }

        const summaryCards = document.getElementById("summary-cards");
        if (summaryCards) {
          summaryCards.innerHTML =
            `<div class="plan-card" style="text-align: center;">
          <div style="font-size: 24px; color: #3b82f6;">${(d).toFixed(1)} km</div>
          <small>${localTranslate('total_distance')}</small><br><small>${formatDiff(d, dPrev, ' km')}</small>
        </div>
        <div class="plan-card" style="text-align: center;">
          <div style="font-size: 24px; color: #3b82f6;">${formatDuration(t)}</div>
          <small>${localTranslate('total_duration')}</small><br><small>${formatDurationDiff(t, tPrev)}</small>
        </div>
        <div class="plan-card" style="text-align: center;">
          <div style="font-size: 24px; color: #3b82f6;">${(s).toFixed(1)} km/h</div>
          <small>${localTranslate('average_speed')}</small><br><small>${formatDiff(s, sPrev, ' km/h')}</small>
        </div>`;
        }

        const trendSection = document.getElementById("trend-section");
        if (trendSection) {
          trendSection.innerHTML =
            `<div class="plans-header" style="margin-top: 30px;"><h3 id="trend-title">${title}</h3></div>
        <div class="plan-card" style="text-align: center;">
          <small>${localTranslate('recent_trend')}</small>
          <div id="trend-bars" style="display: flex; align-items: flex-end; justify-content: space-around; margin-top: 20px; height: 120px;">
            ${createBarChart(trendData)}
          </div>
        </div>`;
        }

        renderRecentActivities();
      };

      document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', function () {
          document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
          this.classList.add('active');
          updateTrend(this.dataset.type);
        });
      });


      updateTrend('week');
      renderAchievementsGrid(rawData.achievements_unlocked || []);
    })
    .catch(error => {
      console.error('無法取得統計資料：', error);
    });
}

// --- Profile頁 ---
function renderProfile() {
  // 本地翻譯函數
  function localTranslate(key) {
    // 如果全域翻譯函數存在且不是當前函數，使用它
    if (typeof window.translate === 'function' && window.translate !== localTranslate) {
      return window.translate(key);
    }
    
    // 備用翻譯對照表
    const fallbackTranslations = {
      'profile': '個人檔案',
      'personal_information': '個人資訊',
      'voice_input': '語音輸入',
      'age': '年齡',
      'years': '歲',
      'gender': '性別',
      'height': '身高',
      'cm': '公分',
      'weight': '體重',
      'kg': '公斤',
      'fitness_goals': '健身目標',
      'edit': '編輯',
      'primary_goal': '主要目標',
      'weekly_distance': '每週距離',
      'weekly_rides': '每週騎乘次數',
      'rides': '次',
      'endurance': '耐力',
      'race': '競賽',
      'fat_loss': '減脂',
      'save': '儲存',
      'account_settings': '帳戶設定',
      'app_settings': '應用程式設定'
    };
    
    return fallbackTranslations[key] || key;
  }

  const fitnessGoals = {
    goal: "---",
    distance: "---",
    rides: "---"
  };

  document.getElementById("app").innerHTML = `
    <div class="plans-header"><h2>${localTranslate('profile')}</h2></div>
    <div class="plan-card" style="text-align: center; padding: 20px;" id="userDisplay">
      <div id="avatar" style="font-size: 40px;">👤</div>
      <h3 style="margin: 10px 0;">${user_name || 'Guest'}</h3>
      <p style="color: #888;">${user_email || '---'}</p>
    </div>
    
    <!-- Personal Info -->
 <div class="plans-header-with-voice" style="margin-top: 30px;">
  <h3 class="section-title">${localTranslate('personal_information')}</h3>
  <button type="button" id="voice-btn" onmousedown="startListening()" onmouseup="stopListening()">
    🎤 ${localTranslate('voice_input')}
  </button>
</div>



  <div class="plan-card" style="padding: 15px;" id="personalDisplay">
    <p>${localTranslate('age')}: <strong id="ageVal">---</strong> ${localTranslate('years')}</p>
    <p>${localTranslate('gender')}: <strong id="genderVal">---</strong></p>
    <p>${localTranslate('height')}: <strong id="heightVal">---</strong> ${localTranslate('cm')}</p>
    <p>${localTranslate('weight')}: <strong id="weightVal">---</strong> ${localTranslate('kg')}</p>
  </div>


    <!-- Fitness Goals -->
    <div class="plans-header" style="margin-top: 30px;">
      <h3>${localTranslate('fitness_goals')} 
        <span onclick="toggleEdit('fitnessForm')" style="float:right; cursor:pointer; color:#1f4c8a;">${localTranslate('edit')} ✏️</span>
      </h3>
    </div>
    <div class="plan-card" style="padding: 15px;" id="fitnessDisplay">
      <p>${localTranslate('primary_goal')}: <strong>${fitnessGoals.goal}</strong></p>
      <p>${localTranslate('weekly_distance')}: <strong>${fitnessGoals.distance} km</strong></p>
      <p>${localTranslate('weekly_rides')}: <strong>${fitnessGoals.rides} ${localTranslate('rides')}</strong></p>
    </div>
    <form id="fitnessForm" style="display:none; padding:15px;" onsubmit="event.preventDefault(); saveFitnessGoals();">
      ${localTranslate('primary_goal')}: <select id="goal">
        <option value="Endurance">${localTranslate('endurance')}</option>
        <option value="Race">${localTranslate('race')}</option>
        <option value="Fat Loss">${localTranslate('fat_loss')}</option>
      </select><br><br>
      ${localTranslate('weekly_distance')} (km): <input type="text" id="distance" value="${fitnessGoals.distance}"><br><br>
      ${localTranslate('weekly_rides')}: <input type="text" id="rides" value="${fitnessGoals.rides}"><br><br>
      <button type="submit">${localTranslate('save')}</button>
    </form>
    
    <div class="plans-header" style="margin-top: 30px;">
      <h3>${localTranslate('account_settings')}</h3>
    </div>


    <button class="link-card">${localTranslate('app_settings')} ➔</button>
  `;

  // 函式掛到全域
  window.toggleEdit = function (id) {
    const form = document.getElementById(id);
    form.style.display = form.style.display === "none" ? "block" : "none";
  };

  // --- 語音輸入區塊 ---
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition) {
    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-TW';
    recognition.continuous = false;
    recognition.interimResults = false;

    window.startListening = function () {
      recognition.start();
      document.getElementById("voice-btn").innerText = "🎤 辨識中...";
    };

    window.stopListening = function () {
      recognition.stop();
      document.getElementById("voice-btn").innerText = "🎤 Voice Input ";
    };

    recognition.onresult = function (event) {
      const transcript = event.results[0][0].transcript;
      console.log("語音結果：", transcript);

      const fuzzyWords = ["大概", "可能", "差不多", "應該", "左右", "好像"];
      const clean = transcript.replace(new RegExp(fuzzyWords.join("|"), "g"), "");

      const ageMatch = clean.match(/(\d+)\s*歲/);
      const heightMatch = clean.match(/(身高|高).*?(\d+)\s*(公分|cm)?/);
      const weightMatch = clean.match(/(體重|重).*?(\d+)\s*(公斤|kg)?/);
      const genderMatch = clean.match(/(男|女|男性|女性)/);
      const profile = {};

      if (ageMatch) {
        const age = ageMatch[1];
        document.getElementById("ageVal").innerText = age;
        profile.age = age;
      }

      if (heightMatch) {
        const height = heightMatch[2];
        document.getElementById("heightVal").innerText = height;
        profile.height = height;
      }

      if (weightMatch) {
        const weight = weightMatch[2];
        document.getElementById("weightVal").innerText = weight;
        profile.weight = weight;
      }
      if (genderMatch) {
        const gender = genderMatch[1];
        const isMale = gender === "男" || gender === "男性";
        document.getElementById("genderVal").innerText = isMale ? "Male" : "Female";
        document.getElementById("avatar").innerText = isMale ? "👨" : "👩";
        profile.gender = isMale ? "Male" : "Female";
      }
      // 🔄 傳送到後端，記得攜帶 cookie！
      fetch("/update_profile", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include", // ⬅️ ⬅️ ⬅️ ⬅️ ⬅️ 一定要加上這行！
        body: JSON.stringify(profile)
      });

    };

    recognition.onerror = function (event) {
      alert("語音辨識錯誤：" + event.error);
    };
  } else {
    // 原本這裡直接 alert，每次切到 Profile 分頁都會跳一次；
    // 而且沒有定義 startListening/stopListening，按下按鈕會 ReferenceError。
    window.startListening = function () {};
    window.stopListening = function () {};
    const voiceBtn = document.getElementById("voice-btn");
    if (voiceBtn) {
      voiceBtn.disabled = true;
      voiceBtn.title = "此瀏覽器不支援語音辨識（建議使用 Chrome）";
    }
    console.warn("此瀏覽器不支援語音辨識（建議用 Chrome）");
  }


  window.saveFitnessGoals = function () {
    const goal = document.getElementById("goal").value;
    const distance = document.getElementById("distance").value;
    const rides = document.getElementById("rides").value;

    document.getElementById("fitnessDisplay").innerHTML = `
      <p>${localTranslate('primary_goal')}: <strong>${goal}</strong></p>
      <p>${localTranslate('weekly_distance')}: <strong>${distance} km</strong></p>
      <p>${localTranslate('weekly_rides')}: <strong>${rides} ${localTranslate('rides')}</strong></p>
    `;
    // 將資料送到後端
    fetch("/update_fitness", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        goal: goal,
      })
    });

    toggleEdit("fitnessForm");
  };
}
// 初始化主題（讀取 localStorage）
function initTheme() {
  const savedTheme = localStorage.getItem("theme") || "light";
  applyTheme(savedTheme);

  // 若已渲染過 settings 頁面，則同步 select 的值
  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) themeSelect.value = savedTheme;
}

// 套用主題
function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
}

// 渲染 App Settings 頁面
function renderSettings() {
  // 本地翻譯函數
  function localTranslate(key) {
    // 如果全域翻譯函數存在且不是當前函數，使用它
    if (typeof window.translate === 'function' && window.translate !== localTranslate) {
      return window.translate(key);
    }
    
    // 備用翻譯對照表
    const fallbackTranslations = {
      'app_settings': '應用程式設定',
      'theme': '主題',
      'light': '淺色',
      'dark': '深色',
      'language': '語言',
      'subscription_status': '訂閱狀態',
      'free_version': '免費版本'
    };
    
    return fallbackTranslations[key] || key;
  }

  app.innerHTML = `
    <div class="settings-page">
      <h2 class="settings-title">${localTranslate('app_settings')}</h2>

      <div class="setting-block">
        <label for="themeSelect">🌗 ${localTranslate('theme')}</label>
        <select id="themeSelect" class="setting-input">
          <option value="light">${localTranslate('light')}</option>
          <option value="dark">${localTranslate('dark')}</option>
        </select>
      </div>

      <div class="setting-block">
        <label for="langSelect">🌐 ${localTranslate('language')}</label>
        <select id="langSelect" class="setting-input">
        <option value="en">English</option>
          <option value="zh">繁體中文</option>
        </select>
      </div>

      <div class="setting-block">
        <label>💎 ${localTranslate('subscription_status')}</label>
        <div class="subscription-status">${localTranslate('free_version')}</div>
      </div>
    </div>
  `;

  // 初始化主題選擇器的值
  const savedTheme = localStorage.getItem("theme") || "light";
  document.getElementById("themeSelect").value = savedTheme;
  
  // 初始化語言選擇器的值
  const savedLang = localStorage.getItem("language") || "zh";
  document.getElementById("langSelect").value = savedLang;
}

// 點擊 App Settings 按鈕事件
document.addEventListener("click", function (e) {
  if (e.target && (e.target.textContent.includes("App Settings") || e.target.textContent.includes("應用程式設定"))) {
    renderSettings();
    initTheme(); // 每次切換頁面都重新套用主題
  }
});

// 切換主題和語言事件
document.addEventListener("change", function (e) {
  if (e.target && e.target.id === "themeSelect") {
    const theme = e.target.value;
    localStorage.setItem("theme", theme); // 儲存主題
    applyTheme(theme); // 套用主題
  }
  
  // 切換語言事件
  if (e.target && e.target.id === "langSelect") {
    const lang = e.target.value;
    if (typeof window.switchLanguage === 'function') {
      window.switchLanguage(lang); // 調用 i18n.js 中的 switchLanguage 函數
    }
  }
});

// 首次進入網站時套用主題
initTheme();

// 監聽語言變更事件，重新渲染當前頁面
document.addEventListener('languageChanged', function(event) {
  // 獲取當前活躍的頁面
  const activeNavItem = document.querySelector('.nav-item.active');
  if (activeNavItem) {
    const currentPage = activeNavItem.dataset.page;
    loadPage(currentPage);
  } else {
    // 如果沒有活躍的導航項目，預設載入 Home
    renderHome();
  }
});

// 等待 DOM 載入完成後再初始化
document.addEventListener('DOMContentLoaded', function() {
  // 等待翻譯系統載入完成後再渲染首頁
  const checkTranslationsLoaded = () => {
    if (typeof window.translate === 'function' && window.translations) {
      // 翻譯系統已載入，渲染首頁
      renderHome();
    } else {
      // 翻譯系統尚未載入，等待 100ms 後再檢查
      setTimeout(checkTranslationsLoaded, 100);
    }
  };
  
  // 開始檢查翻譯系統是否載入
  checkTranslationsLoaded();
});
