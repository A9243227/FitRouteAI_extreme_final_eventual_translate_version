// 本地翻譯函數
function localTranslate(key) {
  // 如果全域翻譯函數存在且不是當前函數，使用它
  if (typeof window.translate === 'function' && window.translate !== localTranslate) {
    return window.translate(key);
  }
  
  // 備用翻譯對照表
  const fallbackTranslations = {
    'Mood': '心情',
    'Energy': '精力', 
    'Hydration': '水分',
    'Fatigue': '勞累程度',
    'Sad': '傷心',
    'Neutral': '中性',
    'Happy': '快樂',
    'Sleepy': '疲累',
    'Medium': '普通',
    'Energized': '充滿活力',
    'Thirsty': '口渴',
    'Okay': '良好',
    'Hydrated': '水分充足',
    'Fresh': '精神飽滿',
    'Normal': '正常',
    'Exhausted': '精疲力盡'
  };
  
  return fallbackTranslations[key] || key;
}

// 更新滑桿顯示的函數
function updateSliderDisplay(slider, emoji, status, levels) {
  const value = slider.value;
  if (value < 33) {
    emoji.textContent = levels.low.icon + ' ' + levels.label;
    status.textContent = levels.low.text;
  } else if (value < 66) {
    emoji.textContent = levels.medium.icon + ' ' + levels.label;
    status.textContent = levels.medium.text;
  } else {
    emoji.textContent = levels.high.icon + ' ' + levels.label;
    status.textContent = levels.high.text;
  }
}

function setupSlider(sliderId, emojiId, statusId, levels) {
  const slider = document.getElementById(sliderId);
  const emoji = document.getElementById(emojiId);
  const status = document.getElementById(statusId);

  // 頁面載入時設置初始值
  updateSliderDisplay(slider, emoji, status, levels);

  slider.addEventListener('input', () => {
    updateSliderDisplay(slider, emoji, status, levels);
  });

  slider.addEventListener('mouseup', () => {
    const value = slider.value;
    console.log(sliderId + ' value: ' + value); // Debug: Display slider value
    sendSliderValue(sliderId, value);
  });

  // Send initial slider values on page load
  sendSliderValue(sliderId, slider.value);
}

function sendSliderValue(sliderId, value) {
  // Use the passed value instead of reading from the DOM
  const moodValue = document.getElementById('mood-slider').value;
  const energyValue = document.getElementById('energy-slider').value;
  const hydrationValue = document.getElementById('hydration-slider').value;
  const fatigueValue = document.getElementById('fatigue-slider').value;

  console.log('Frontend slider values:');
  console.log('mood:', moodValue);
  console.log('energy:', energyValue);
  console.log('hydration:', hydrationValue);
  console.log('fatigue:', fatigueValue);

  fetch('/api/update_slider', {
    method: 'POST',
    credentials: 'include',  // 這一行才能讓 cookie 一起傳過來
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      mood: moodValue,
      energy: energyValue,
      hydration: hydrationValue,
      fatigue: fatigueValue
    })
  })
  .then(response => {
    // Store slider values in cookies
    document.cookie = `mood=${moodValue}; path=/`;
    document.cookie = `energy=${energyValue}; path=/`;
    document.cookie = `hydration=${hydrationValue}; path=/`;
    document.cookie = `fatigue=${fatigueValue}; path=/`;
  });
}

// 等待 DOM 和翻譯載入完成
document.addEventListener('DOMContentLoaded', function() {
  // 確保翻譯已載入
  if (typeof loadTranslations === 'function') {
    const currentLang = localStorage.getItem('language') || 'zh';
    loadTranslations(currentLang).then(() => {
      initializeSliders();
    });
  } else {
    // 如果翻譯函數不可用，直接初始化滑桿
    initializeSliders();
  }
});

// 監聽語言變更事件
document.addEventListener('languageChanged', function() {
  // 重新初始化滑桿以更新文本
  initializeSliders();
});

function initializeSliders() {
  setupSlider('mood-slider', 'mood-emoji', 'mood-status', {
    label: localTranslate('Mood'),
    low: { icon: '😢', text: localTranslate('Sad') },
    medium: { icon: '😐', text: localTranslate('Neutral') },
    high: { icon: '😄', text: localTranslate('Happy') }
  });

  setupSlider('energy-slider', 'energy-emoji', 'energy-status', {
    label: localTranslate('Energy'),
    low: { icon: '🥱', text: localTranslate('Sleepy') },
    medium: { icon: '⚡', text: localTranslate('Medium') },
    high: { icon: '🔥', text: localTranslate('Energized') }
  });

  setupSlider('hydration-slider', 'hydration-emoji', 'hydration-status', {
    label: localTranslate('Hydration'),
    low: { icon: '🥵', text: localTranslate('Thirsty') },
    medium: { icon: '💧', text: localTranslate('Okay') },
    high: { icon: '🌊', text: localTranslate('Hydrated') }
  });

  setupSlider('fatigue-slider', 'fatigue-emoji', 'fatigue-status', {
    label: localTranslate('Fatigue'),
    low: { icon: '😎', text: localTranslate('Fresh') },
    medium: { icon: '☀️', text: localTranslate('Normal') },
    high: { icon: '😵‍💫', text: localTranslate('Exhausted') }
  });
}

// 等待 DOM 載入完成後設置提交按鈕事件
document.addEventListener('DOMContentLoaded', function() {
  const submitBtn = document.getElementById('submit-btn');
  const feelingCard = document.getElementById('feeling-card');
  const resultMessage = document.getElementById('result-message');

  if (submitBtn) {
    submitBtn.addEventListener('click', (event) => {
      event.preventDefault();

      const moodSlider = document.getElementById('mood-slider');
      const energySlider = document.getElementById('energy-slider');
      const hydrationSlider = document.getElementById('hydration-slider');
      const fatigueSlider = document.getElementById('fatigue-slider');

      const moodValue = moodSlider.value;
      const energyValue = energySlider.value;
      const hydrationValue = hydrationSlider.value;
      const fatigueValue = fatigueSlider.value;

      console.log('Frontend slider values:');
      console.log('mood:', moodValue);
      console.log('energy:', energyValue);
      console.log('hydration:', hydrationValue);
      console.log('fatigue:', fatigueValue);

      sendSliderValue();

      fetch('/segment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          mood: moodValue,
          energy: energyValue,
          hydration: hydrationValue,
          fatigue: fatigueValue
        })
      })
      .then(response => {
        if (response.ok) {
          console.log('Slider values updated successfully!');
          window.location.href = '/segment';
        } else {
          console.error('Failed to submit form');
        }
      });
    });
  }
});
