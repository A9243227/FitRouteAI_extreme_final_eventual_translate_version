let translations = {};
let currentLanguage = localStorage.getItem('language') || 'zh'; // 預設語言改為 'zh'

async function loadTranslations(lang) {
    try {
        // 確保 lang 參數有效
        if (!lang) {
            lang = 'zh';
        }
        
        // 修正語言檔案路徑，確保 zh 對應到 zh-TW.json
        const filename = lang === 'zh' ? 'zh-TW' : lang;
        console.log(`正在載入翻譯檔案: ${filename}.json`);
        
        const response = await fetch(`/static/locales/${filename}.json`);
        if (!response.ok) {
            throw new Error(`無法載入翻譯檔案: ${filename}.json (HTTP ${response.status})`);
        }
        
        translations = await response.json();
        currentLanguage = lang;
        localStorage.setItem('language', lang);
        
        // 將變數設為全域可用
        window.currentLanguage = lang;
        window.translations = translations;
        
        console.log(`翻譯已載入: ${lang}`, translations);
        
        // 應用翻譯到 DOM 元素
        applyTranslationsToDOM();
        
        return true;
    } catch (error) {
        console.error('載入翻譯失敗:', error);
        translations = {}; // 載入失敗時清空翻譯
        return false;
    }
}

function translate(key) {
    // 避免無限遞迴調用
    if (typeof window._translating === 'boolean' && window._translating) {
        return key;
    }
    
    // 設置標記，表示正在翻譯中
    window._translating = true;
    
    // 備用翻譯對照表，確保即使翻譯文件沒有載入也能顯示中文
    const fallbackTranslations = {
        "chatbot_welcome_message": "嗨！需要幫忙嗎？我在這裡喔 😊",
        "send": "送出",
        "type_message": "輸入您的訊息...",
        "chatbot_header": "FitRoute AI 助理",
        "chatbot_tooltip": "需要健身計畫的幫助嗎？",
        "How_are_you_feeling_today": "您今天感覺如何",
        "Mood": "心情",
        "Neutral": "中性",
        "Sad": "傷心",
        "Happy": "快樂",
        "Energy": "精力",
        "Energized": "充滿活力",
        "Medium": "普通",
        "Sleepy": "疲累",
        "Hydration": "水分",
        "Hydrated": "水分充足",
        "Okay": "良好",
        "Thirsty": "口渴",
        "Fatigue": "勞累程度",
        "Normal": "正常",
        "Exhausted": "精疲力盡",
        "Fresh": "精神飽滿",
        "hello": "您好",
        "happy_to_see_you": "很高興見到您！"
    };
    
    // 嘗試從翻譯對象中獲取翻譯，如果找不到則從備用翻譯對照表中獲取，如果還是找不到則返回 key 本身
    const result = translations[key] || fallbackTranslations[key] || key;
    
    // 清除標記
    window._translating = false;
    
    return result;
}

// 將翻譯應用到 DOM 元素
function applyTranslationsToDOM() {
    // 翻譯帶有 data-i18n 屬性的元素
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (key && translations[key]) {
            element.textContent = translations[key];
        }
    });
    
    // 翻譯帶有 data-i18n-placeholder 屬性的元素
    document.querySelectorAll('[data-i18n-placeholder]').forEach(element => {
        const key = element.getAttribute('data-i18n-placeholder');
        if (key && translations[key]) {
            element.placeholder = translations[key];
        }
    });
    
    // 翻譯帶有 data-i18n-value 屬性的元素
    document.querySelectorAll('[data-i18n-value]').forEach(element => {
        const key = element.getAttribute('data-i18n-value');
        if (key && translations[key]) {
            element.value = translations[key];
        }
    });
    
    // 翻譯帶有 data-i18n-title 屬性的元素
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        if (key && translations[key]) {
            element.title = translations[key];
        }
    });
}

// 切換語言
function switchLanguage(lang) {
    loadTranslations(lang).then(success => {
        if (success) {
            // 發送 POST 請求到後端，更新 session 中的語言設定
            fetch('/set_language', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: `language=${lang}`,
            }).catch(error => {
                console.error('更新語言設定失敗:', error);
            });
            
            // 觸發語言變更事件，通知其他組件
            const event = new CustomEvent('languageChanged', { detail: { language: lang } });
            document.dispatchEvent(event);
        }
    });
}

// 將函數設為全域可用
window.loadTranslations = loadTranslations;
window.translate = translate;
window.applyTranslationsToDOM = applyTranslationsToDOM;
window.switchLanguage = switchLanguage;

// 初始載入語言
document.addEventListener('DOMContentLoaded', function() {
    loadTranslations(currentLanguage);
});
