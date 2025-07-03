# FitRouteAI - 智慧自行車運動智能助手

## 概述

FitRouteAI 是一個基於 Python 的智慧自行車訓練助手，旨在幫助使用者更有效地達成訓練目標。它整合了 Strava 的訓練紀錄，並利用 XGBoost 模型預估騎乘路段所需功率，結合蒙地卡羅決策樹 (MCTS) 預估路段拆分時間，協助使用者進行訓練排程。此外，它還整合了 Google Maps API，提供天氣預報、路線規劃、即時天氣、空氣品質等資訊，並支援即時訓練路線 GPS 紀錄、語音輸入資訊整合，以及由 Gemma 3B 支援的自行車運動助手，提供使用者建議。

## 主要功能

*   **訓練紀錄分析：** 整合 Strava 訓練紀錄，用於模型訓練。
*   **功率預估：** 使用 XGBoost 模型預估騎乘路段所需功率。
*   **路段時間預估：** 藉由蒙地卡羅決策樹 (MCTS) 預估路段拆分時間。
*   **Google Maps API 整合：** 提供天氣預報、路線規劃、即時天氣、空氣品質等資訊。
*   **即時 GPS 紀錄：** 記錄即時訓練路線 GPS 數據。
*   **語音輸入整合：** 支援語音輸入資訊。
*   **Gemma 3B 支援的自行車運動助手：** 提供使用者建議。

## 安裝要求

*   **Python:** 3.10.16
*   **套件：** 所有的 Python 套件需求列於 `requirements.txt` 文件中。

## 安裝步驟

1.  **安裝 Python:** 確保您已安裝 Python 3.10.16。
2.  **安裝套件：** 使用命令提示字元 (CMD) 或 PowerShell (PWSH) 執行以下指令，安裝 `requirements.txt` 中列出的所有套件：

    ```bash
    pip install -r requirements.txt
    ```

## 使用方法

1.  **啟動應用程式：** 在 CMD 或 PWSH 中，導航到專案目錄，然後執行以下指令：

    ```bash
    python app.py
    ```

    首次啟動時，請耐心等待 llama-cpp 載入。當您看到彩虹貓咪出現時，表示應用程式已成功啟動。
2.  **訪問應用程式：** 在您的瀏覽器中，訪問 `127.0.0.1:5000` (或應用程式啟動時顯示的端口)。

## 故障排除

*   **啟動問題：** 如果應用程式無法啟動，請檢查您的 Python 版本和套件是否已正確安裝。
*   **Llama-cpp 載入：** 首次啟動時，llama-cpp 載入可能需要一些時間。請耐心等待。
*   **套件安裝錯誤：** 如果在安裝套件時遇到錯誤，請檢查 `requirements.txt` 文件中的套件名稱和版本是否正確。

## 更多資訊

*   **專案程式碼：** [GitHub 連結](https://github.com/A9243227/FitRouteAI_extreme_final_eventual_translate_version.git)
*   **聯絡方式：** [martinhsiao92102@gmail.com](mailto:martinhsiao92102@gmail.com)
