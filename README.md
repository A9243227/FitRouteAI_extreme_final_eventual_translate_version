# FitRouteAI - 智慧自行車運動智能助手

## 概述

FitRouteAI 是一個基於前端互動式導向設計的智慧自行車訓練助手，旨在幫助使用者更有效地達成訓練目標。它整合了 Strava 的訓練紀錄，並利用 XGBoost 模型預估騎乘路段所需功率，結合蒙地卡羅決策樹 (MCTS) 預估路段拆分時間，協助使用者進行訓練排程。此外，它還整合了 Google Maps API，提供天氣預報、路線規劃、即時天氣、空氣品質等資訊，並支援即時訓練路線 GPS 紀錄、語音輸入資訊整合，以及由 Gemma 3B 支援的自行車運動助手，提供使用者建議。

## 主要功能

*   **訓練紀錄分析：** 整合 Strava 訓練紀錄，用於模型訓練。
*   **功率預估：** 使用 XGBoost 模型預估騎乘路段所需功率。
*   **路段時間預估：** 藉由蒙地卡羅決策樹 (MCTS) 預估路段拆分時間。
*   **Google Maps API 整合：** 提供天氣預報、路線規劃、即時天氣、空氣品質等資訊。
*   **即時 GPS 紀錄：** 記錄即時訓練路線 GPS 數據。
*   **語音輸入整合：** 支援語音輸入資訊。
*   **Gemma 3B 支援的自行車運動助手：** 提供使用者建議。

## 安裝要求

*   **Python:** 3.10（由 `.python-version` 指定，uv 會自動下載）
*   **套件管理：** [uv](https://docs.astral.sh/uv/)。相依套件定義於 `pyproject.toml`，實際版本鎖在 `uv.lock`
*   **模型：** 由於模型大小為2GB 請至`https://reurl.cc/Rkn5Xr`下載 並將`gemma-3-4b-it-Q4_K_M.gguf`放置於`model`資料夾

## 安裝步驟

1.  **安裝 uv**（只需一次）：

    ```bash
    powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
    ```

2.  **建立環境並安裝套件：** uv 會依 `uv.lock` 安裝完全一致的版本，需要的話也會自動下載 Python 3.10。

    ```bash
    uv sync
    ```

3.  **設定環境變數：** 複製 `key.env.example` 為 `key.env` 並填入 `SECRET_KEY` 與 `GOOGLE_MAPS_API_KEY`。

## 使用方法

1.  **啟動應用程式：** 在專案目錄執行（`uv run` 會自動使用專案的虛擬環境，不必手動 activate）：

    ```bash
    uv run python app.py
    ```

    首次啟動時，請耐心等待 llama-cpp 載入。當您看到彩虹貓咪出現時，表示應用程式已成功啟動。
2.  **訪問應用程式：** 在您的瀏覽器中，訪問 `127.0.0.1:5000` (或應用程式啟動時顯示的端口)。

## 套件管理備忘

*   新增套件：`uv add <套件名>`（會同時更新 `pyproject.toml` 與 `uv.lock`）
*   移除套件：`uv remove <套件名>`
*   更新鎖定版本：`uv lock --upgrade`
*   `requirements.txt` 由下列指令產生，僅供不使用 uv 的環境參考，請勿手動編輯：

    ```bash
    uv export --format requirements-txt --no-hashes --no-annotate -o requirements.txt
    ```

    產生後需手動補回檔案開頭的 `--extra-index-url`（`uv export` 不會輸出 index 設定）。

> **注意事項**
>
> *   `xgboost` 釘在 `2.1.4`，因為 `model/xgb_model.pkl` 是用該版本序列化的，
>     XGBoost 不保證 pickle 跨大版本相容。
> *   `llama-cpp-python` 從官方預編譯 wheel index 安裝（見 `pyproject.toml`）。
>     PyPI 上只有原始碼，Windows 上會因為缺少 CMake / MSVC 而編譯失敗。
>     需要 GPU 版本的話把 index 網址結尾的 `/cpu` 換成對應的 CUDA 版本。

## 故障排除

*   **啟動問題：** 如果應用程式無法啟動，請檢查您的 Python 版本和套件是否已正確安裝。
*   **Llama-cpp 載入：** 首次啟動時，llama-cpp 載入可能需要一些時間。請耐心等待。
*   **套件安裝錯誤：** 如果在安裝套件時遇到錯誤，請檢查 `requirements.txt` 文件中的套件名稱和版本是否正確。

## 更多資訊

*   **專案程式碼：** [GitHub 連結](https://github.com/A9243227/FitRouteAI_extreme_final_eventual_translate_version.git)
*   **聯絡方式：** [martinhsiao92102@gmail.com](mailto:martinhsiao92102@gmail.com)
