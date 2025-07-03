// === Chatbot Popup 聊天串接 GGUF Streaming ===
document.addEventListener("DOMContentLoaded", () => {
  const icon = document.getElementById("chatbot-button");
  const popup = document.getElementById("chatbot-popup");
  const sendBtn = popup.querySelector("button");
  const input = popup.querySelector("input");
  const body = popup.querySelector(".chat-body");
  const MESSAGES_KEY = "fitroute_chat_history";

  // 本地翻譯函數
  function localTranslate(key) {
    // 如果全域翻譯函數存在且不是當前函數，使用它
    if (typeof window.translate === 'function' && window.translate !== localTranslate) {
      return window.translate(key);
    }
    
    // 備用翻譯對照表
    const fallbackTranslations = {
      "chatbot_welcome_message": "嗨！需要幫忙嗎？我在這裡喔 😊",
      "send": "送出",
      "type_message": "輸入您的訊息...",
      "chatbot_header": "FitRoute AI 助理",
      "chatbot_tooltip": "需要健身計畫的幫助嗎？"
    };
    
    return fallbackTranslations[key] || key;
  }

  // === 歡迎訊息 ===
  function showWelcome() {
    // 使用本地翻譯函數，確保即使全域翻譯函數不可用也能顯示中文
    const welcomeText = localTranslate("chatbot_welcome_message");

    const row = document.createElement("div");
    row.className = "message-row bot";

    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = "/static/images/bot-avatar.png";

    const welcome = document.createElement("div");
    welcome.className = "message bot";
    welcome.textContent = welcomeText;

    row.appendChild(avatar);
    row.appendChild(welcome);
    body.appendChild(row);

    saveMessage("bot", welcomeText);
    scrollToBottom();
  }

  // === 載入 sessionStorage 的訊息 ===
  function loadMessages() {
    const saved = sessionStorage.getItem(MESSAGES_KEY);
    if (!saved) return;
    const messages = JSON.parse(saved);
    messages.forEach(msg => {
      if (msg.from === "user") {
        const userMsg = document.createElement("div");
        userMsg.className = "message user";
        userMsg.textContent = msg.text;
        body.appendChild(userMsg);
      } else if (msg.from === "bot") {
        const row = document.createElement("div");
        row.className = "message-row bot";

        const avatar = document.createElement("img");
        avatar.className = "avatar";
        avatar.src = "/static/images/bot-avatar.png";

        const botMsg = document.createElement("div");
        botMsg.className = "message bot";
        botMsg.textContent = msg.text;

        row.appendChild(avatar);
        row.appendChild(botMsg);
        body.appendChild(row);
      }
    });  
  function getRandomInterval(minSec, maxSec) {
        return (Math.random() * (maxSec - minSec) + minSec) * 1000;
      }

      // 隨機換圖，持續3秒，然後換回預設圖，並在隨機30~60秒後再觸發
  function triggerRandomImageChange() {
        const randomIndex = Math.floor(Math.random() * images.length);
        icon.src = images[randomIndex];

        setTimeout(() => {
          icon.src = defaultIcon;
        }, 3000);

        setTimeout(triggerRandomImageChange, getRandomInterval(30, 60));
      }

      // 隨機觸發向左移動動畫，動畫持續1秒，然後移除class，並在隨機30~60秒後再觸發
  function triggerRandomMoveLeft() {
        wrapper.classList.add('move-left');
        setTimeout(() => {
          wrapper.classList.remove('move-left');
        }, 3000);

        setTimeout(triggerRandomMoveLeft, getRandomInterval(30, 60));
      }

      // 啟動兩個獨立流程
  setTimeout(triggerRandomImageChange, getRandomInterval(30, 60));
  setTimeout(triggerRandomMoveLeft, getRandomInterval(30, 60));

  const wrapper = document.querySelector('.chatbot-icon-wrapper');
  const icon = document.getElementById('chatbot-icon');

  const images = [
    '/static/images/fluffy.png',
    
  ];
  const defaultIcon = '/static/images/chatbot-icon.png';


  scrollToBottom();
  }

  function saveMessage(from, text) {
    const current = JSON.parse(sessionStorage.getItem(MESSAGES_KEY) || "[]");
    current.push({ from, text });
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(current));
  }

  function scrollToBottom() {
    body.scrollTop = body.scrollHeight;
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    const userMsg = document.createElement("div");
    userMsg.className = "message user";
    userMsg.textContent = text;
    body.appendChild(userMsg);
    saveMessage("user", text);
    input.value = "";
    scrollToBottom();

    // --- 串接  GGUF 模型串流 API ---
    const row = document.createElement("div");
    row.className = "message-row bot";

    const avatar = document.createElement("img");
    avatar.className = "avatar";
    avatar.src = "/static/images/bot-avatar.png";

    const botMsg = document.createElement("div");
    botMsg.className = "message bot";
    botMsg.textContent = "";

    row.appendChild(avatar);
    row.appendChild(botMsg);
    body.appendChild(row);
    scrollToBottom();

    const response = await fetch("/chat_stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "你必須根據使用者語言用一樣的語言輸出，你是專業自行車顧問，僅回應公路車、登山車、訓練、配件、維修、比賽、營養與功率訓練。禁止醫療診斷與法律違規操作，僅能建議就醫。禁止仇恨、暴力、不當內容與商業偏見。回答需白話、語氣活潑、準確、不說廢話，80字內。避免主觀詞（如「最好」），改用中性描述。若問題模糊請引導補充資訊。每次互動回應一次問題即可。保持內容穩定、中立、可重現。" },
          { role: "user", content: text }
        ]
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let done = false;
    let fullText = "";

    while (!done) {
      const { value, done: doneReading } = await reader.read();
      done = doneReading;
      if (value) {
        const chunk = decoder.decode(value);
        fullText += chunk;


        let safeText = fullText
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

        safeText = safeText.replace(/\*\*(.+?)\*\*/g, '<b>$1</b>');
        botMsg.innerHTML = safeText;
        scrollToBottom();
      }
    }

    saveMessage("bot", fullText);
  }

  // 點擊 chatbot icon 開關 popup
  icon.addEventListener("click", () => {
    popup.classList.toggle("hidden");
    if (!popup.classList.contains("hidden")) {
      input.focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  sendBtn.addEventListener("click", sendMessage);

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
    const sendBtn = popup.querySelector("button");
    if (sendBtn) sendBtn.textContent = localTranslate("send");
    
    const input = popup.querySelector("input");
    if (input) input.placeholder = localTranslate("type_message");
    
    const header = popup.querySelector(".chat-header");
    if (header) header.textContent = localTranslate("chatbot_header");
    
    const tooltip = document.querySelector(".chat-tooltip");
    if (tooltip) tooltip.textContent = localTranslate("chatbot_tooltip");
  });
});
