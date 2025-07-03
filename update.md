# 2025/6/9 更新記錄

## 1. 修復 i18n_utils.py 中的 Pylance 類型錯誤

**檔案名稱**: `FitRouteAI_extreme_final_eventual_version/utils/i18n_utils.py`

**檔案內容**: 
```python
# 讀取翻譯檔案
file_path = os.path.join(current_app.static_folder, 'locales', f'{language}.json')
with open(file_path, 'r', encoding='utf-8') as f:
    translations = json.load(f)
return translations
```

**段落位置**: `load_translations` 函數中的第 21 行

**修改原因**: 
- Pylance 錯誤: "join" 沒有任何多載符合提供的引數
- Pylance 錯誤: 類型 "str | None" 的引數不能指派至函式 "join" 中類型 "StrPath" 的參數 "path"
- `current_app.static_folder` 的類型是 `str | None`，但 `os.path.join` 函數需要確定的 `str` 類型

**修改方式**:
添加了對 `current_app.static_folder` 的檢查，如果為 `None` 則拋出明確的錯誤訊息：

```python
# 確保 static_folder 不為 None
if current_app.static_folder is None:
    raise ValueError("Flask 應用程式的 static_folder 未設定")
    
# 讀取翻譯檔案
file_path = os.path.join(current_app.static_folder, 'locales', f'{language}.json')
with open(file_path, 'r', encoding='utf-8') as f:
    translations = json.load(f)
return translations
```

## 2. 修復前端翻譯功能問題

**檔案名稱**: `FitRouteAI_extreme_final_eventual_version/static/js/mood.js` 和其他前端 JS 檔案

**檔案內容**: 
```javascript
// 直接使用全域 translate 函數
const welcomeText = translate("welcome_text");
```

**段落位置**: 各個頁面渲染函數中

**修改原因**: 
- 直接使用 `translate` 函數可能導致無限遞迴調用
- 當全域翻譯函數不可用時，頁面無法顯示中文

**修改方式**:
添加了本地翻譯函數 `localTranslate`，避免依賴全局翻譯函數，並提供備用翻譯對照表：

```javascript
// 本地翻譯函數
function localTranslate(key) {
  // 如果全域翻譯函數存在且不是當前函數，使用它
  if (typeof window.translate === 'function' && window.translate !== localTranslate) {
    return window.translate(key);
  }
  
  // 備用翻譯對照表
  const fallbackTranslations = {
    'welcome_text': '歡迎',
    // 其他翻譯...
  };
  
  return fallbackTranslations[key] || key;
}
```

## 3. 修復 App Settings 按鈕無法作動的問題

**檔案名稱**: `FitRouteAI_extreme_final_eventual_version/static/js/script.js`

**檔案內容**: 
```javascript
// 點擊 App Settings 按鈕事件
document.addEventListener("click", function (e) {
  if (e.target && e.target.textContent.includes("App Settings")) {
    renderSettings();
    initTheme(); // 每次切換頁面都重新套用主題
  }
});
```

**段落位置**: 事件監聽器部分

**修改原因**: 
- App Settings 按鈕點擊事件只檢查英文文字 "App Settings"
- 但按鈕顯示的是中文 "應用程式設定"，導致點擊無反應

**修改方式**:
修改事件監聽器，同時檢查英文和中文文字：

```javascript
// 點擊 App Settings 按鈕事件
document.addEventListener("click", function (e) {
  if (e.target && (e.target.textContent.includes("App Settings") || e.target.textContent.includes("應用程式設定"))) {
    renderSettings();
    initTheme(); // 每次切換頁面都重新套用主題
  }
});
```

## 4. 修復應用程式啟動時翻譯載入問題

**檔案名稱**: `FitRouteAI_extreme_final_eventual_version/static/js/i18n.js` 和 `script.js`

**檔案內容**: 
```javascript
// 首次進入網站時套用主題
initTheme();

// 預設載入 Home
renderHome();
```

**段落位置**: `script.js` 初始化部分

**修改原因**: 
- 應用程式啟動時，翻譯系統可能還沒有完全載入
- 導致首頁顯示英文鍵值 "hello" 和 "happy_to_see_you" 而不是中文翻譯

**修改方式**:
1. 在 `i18n.js` 的備用翻譯對照表中添加了缺少的鍵值：
```javascript
const fallbackTranslations = {
  // 其他翻譯...
  "hello": "您好",
  "happy_to_see_you": "很高興見到您！"
};
```

2. 修改了初始化順序，確保翻譯系統載入完成後再渲染首頁：
```javascript
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
```

3. 添加了語言變更事件監聽器，確保切換語言時重新渲染當前頁面：
```javascript
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
```

## 5. 修復所有頁面響應 i18n 問題

**檔案名稱**: `FitRouteAI_extreme_final_eventual_version/static/js/script.js`

**檔案內容**: 各個頁面渲染函數

**段落位置**: `renderHome`、`renderProfile`、`renderProgress`、`renderPlans`、`renderWeek`、`renderPacing`、`renderCustom` 和 `renderSettings` 函數

**修改原因**: 
- 各個頁面中的英文文字沒有使用翻譯函數
- 導致即使切換語言，頁面上的文字仍然顯示英文

**修改方式**:
在所有頁面渲染函數中添加了本地翻譯函數和完整的備用翻譯對照表：

1. **Home 頁面**:
   - 翻譯了歡迎文字：`hello` → 您好，`happy_to_see_you` → 很高興見到您！

2. **Profile 頁面**:
   - 翻譯了所有介面文字，包括：個人檔案、個人資訊、語音輸入、年齡、性別、身高、體重等
   - 修復了 `saveFitnessGoals` 函數中的英文文字

3. **Progress 頁面**:
   - 翻譯了所有文字，包括：活動統計、週、月、年、總距離、總時長、平均速度等
   - 修復了 "Weekly Distance" 標題

4. **Plans 頁面**:
   - 翻譯了所有標籤、按鈕、表單欄位和結果顯示

5. **App Settings 頁面**:
   - 翻譯了所有文字，包括：應用程式設定、主題、淺色、深色、語言、訂閱狀態、免費版本

## 6. 修復 AI 助理發送兩次歡迎訊息的問題

**檔案名稱**: `FitRouteAI_extreme_final_eventual_version/static/js/chatbot.js`

**檔案內容**: 
```javascript
// === 初始化 ===
loadMessages();

// 每次載入頁面都顯示歡迎訊息，確保使用正確的語言
sessionStorage.removeItem("fitroute_greeted");
sessionStorage.removeItem(MESSAGES_KEY);
showWelcome();

// 添加語言切換事件監聽器，當語言改變時更新界面文字
document.addEventListener("languageChanged", function() {
  // 清除聊天歷史，重新顯示歡迎訊息
  body.innerHTML = "";
  sessionStorage.removeItem("fitroute_greeted");
  sessionStorage.removeItem(MESSAGES_KEY);
  showWelcome();
  
  // 更新其他界面元素的文字
  // ...
});
```

**段落位置**: 初始化部分

**修改原因**: 
- 在頁面載入時，`DOMContentLoaded` 事件觸發，執行 `showWelcome()`
- 當語言切換事件 `languageChanged` 觸發時，又執行了一次 `showWelcome()`
- 當頁面初始化時，i18n 系統載入完成後會觸發 `languageChanged` 事件
- 導致歡迎訊息被顯示兩次

**修改方式**:
重構了初始化邏輯，添加了狀態追蹤，確保歡迎訊息只顯示一次：

```javascript
// === 初始化 ===
let isInitialized = false;

function initializeChatbot() {
  if (isInitialized) return;
  
  loadMessages();
  
  // 檢查是否已經有聊天歷史，如果沒有才顯示歡迎訊息
  const saved = sessionStorage.getItem(MESSAGES_KEY);
  if (!saved || JSON.parse(saved).length === 0) {
    sessionStorage.removeItem("fitroute_greeted");
    sessionStorage.removeItem(MESSAGES_KEY);
    showWelcome();
  }
  
  isInitialized = true;
}

// 等待翻譯系統載入完成後再初始化
function checkTranslationsAndInit() {
  if (typeof window.translate === 'function' && window.translations) {
    initializeChatbot();
  } else {
    setTimeout(checkTranslationsAndInit, 100);
  }
}

// 開始檢查翻譯系統
checkTranslationsAndInit();

// 添加語言切換事件監聽器，當語言改變時更新界面文字
document.addEventListener("languageChanged", function() {
  // 只有在聊天機器人已經初始化後才處理語言切換
  if (!isInitialized) return;
  
  // 清除聊天歷史，重新顯示歡迎訊息
  body.innerHTML = "";
  sessionStorage.removeItem("fitroute_greeted");
  sessionStorage.removeItem(MESSAGES_KEY);
  showWelcome();
  
  // 更新其他界面元素的文字
  // ...
});
