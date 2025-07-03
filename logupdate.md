0512-S
更新:
將註冊登入系統整合進0428原檔
login/ log out 按鈕已加入
底部navbar自適應+固定不動
各頁面空間保留滑到最下方空間(不會被遮擋)

問題:
http://127.0.0.1:5000進入後無法正常跳轉-->泰宇已解決，因跳轉CSS連結未寫完整。

0513-宇
更新 : 
註冊系統整合, Profile加入語音辨識以及填寫表單
mood.html跳轉不順利, 需再研究如何調整。

0514-宇
release note : 
-mood.html跳轉報錯解決。
-新增segment初版介面。

0515-S
更新:
新增mood.html頁面路段起點與終點按鈕
Back to home按鈕尺寸修改
segment.html頁面新增三個按鈕:[Reset Filters],[Return to Home],[Start Workout!]

0517-S
更新:
調整LOGO樣式大小以及位置(下一版會貼齊頂部)
HOME頁按鈕調整為兩個，新增ICON
PROFILE頁語音輸入按鈕樣式美化

0519-宇
release note:
項目plans隱藏, 會員登入才會顯示並可使用
Fitness Goals移除Intensity欄位
Fitness Goals新增Primary Goal下拉式選單(Endurance/Race/Fat Loss)
新增route.js及route.html(計算導航位移時間), 尚未執行, 待map完成會再測試

0520-宇,任,非
release note:
地圖顯示完成, 且也配合表單送出建議配速資料等等。
plans頁面Custom初版設計:輸入體重, FTP, 路段距離等等, 依照train的模型判斷難度, 預計完成時間, 速率等等。

0521-Jacky
release note:
新增位移導航頁面以及儲存使用者運動紀錄。

0522-cafe
update:
bae on ver. 0520-con
update training plan logic and display

0522-蕭任
update:
static/js/segment.js
- **修改**: 在成功取得海拔資料後，將 `id="elevation-info"` 和 `id="slope-info"` 這兩個元素的 `display` 樣式從 `none` 改為 `block`，使其在頁面上可見。
- **修改**: 將 `getElevation` 函數中呼叫後端 API 的 URL 從 `/get_elevation` 修改為 `/api/elevation`，以使用正確的代理路由。

app.py
- **刪除**: 移除了重複定義的 `/get_elevation` 路由及其相關程式碼。
- **新增**: 導入了 `utils.elevation_API_proxy.py` 中的 `google_proxy` blueprint。
- **新增**: 註冊了 `google_proxy` blueprint (`app.register_blueprint(google_proxy)`)，以便 Flask 應用程式能夠處理 `/api/elevation` 的請求。

templates/segment.html
- **檢查**: 確認了 `id="elevation-info"` 和 `id="slope-info"` 這兩個元素存在，並且初始設定為隱藏 (`display: none;`)。沒有對此檔案進行修改。

0522-Jacky
update:
segment.html：<button class="btn btn-pink" onclick="startWorkout()">Start Workout!</button> (原本沒連到startWorkout)
route.html跟.js修正左上角距離顯示壞掉的問題，地圖上增加起點終點，更正結束訓練鈕的bug且加上"是否結束訓練"
script.js裡renderProgress()還沒改完，改完再寫更新日誌

0522-Sally
update:
全部語言修改為統一英文(除語音辨識)
修改點擊custom按鈕後的頁面美化
Setting按鈕點擊後出現:模式選擇下拉選單(深色/淺色)、語言選擇下拉選單(英文/中文)、訂閱模式檢視(免費/付費)
新增深色模式+全頁面CSS統一

0525
release note:
統合所有update, 修正一些設計與執行上的bug
-導入training plan規劃, custom模型分析
-地圖導入坡度及海拔高度
-修正導航顯示
-網頁介面語言顯示統一, 優化custom功能頁面
-新增Setting功能, 可選擇頁面背景(深色/淺色), 語言(英文/中文)等等
-修正login按鈕登入後變為logout(紅色), 且移除Profile裡Log out

0527-Sally
release note:
新增入場動畫頁面-splash.html
新增AI聊天機器人ICON+動畫+對話框+chatbot.css
串聯完整聊天機器人API(可非的Chat_stream.html+app route)

0528
update :
聊天機器人API回覆字數限定100以內
Progress紀錄修正為英文
頁面背景(深/淺)修正所有頁面都套用

0529
update :
Progress Achievement顯示串接歷程紀錄
新增Pacing頁面, 主要為十個Strava熱門路段的功率配速表(較專業)

0603
update:
更改 App Settings 頁面語言為英文
修正 Road Section Information 樣式
深淺模式 week/custom 樣式調整
調整腳踏車主體人物位置與大小
深色模式 mood 樣式調整
調整 feeling 方框樣式
新增白色半透明背景 + logo 樣式以及位置
修正深色模式下 start 按鈕的顏色
start 圓形按鈕淺色模式樣式更新, 變更 start 按鈕為圓形
刪除跑步按鈕，新增淺色和深色背景圖，custom plan setup 按鈕調整
Achievements更新, 根據當周期程紀錄判斷是否達成, 有達成會有動畫,沒達成會上鎖

0605
Release note:
優化Pacing圖表較平滑
調整Chatbot自行車專家文本
調整Ride tips建議, 改為LLM模型生成
CSS格式微調, 修正一些背景深淺切換的bug
新增Fit Logo

0607
Release note:
CSS深淺背景整理優化
新增智能小幫手動畫
終端機有一隻大貓咪(可非)


