import json
import os
from flask import session, current_app

def load_translations(language='zh-TW'):
    """
    載入指定語言的翻譯檔案
    
    Args:
        language (str): 語言代碼，例如 'en' 或 'zh-TW'
        
    Returns:
        dict: 翻譯字典
    """
    try:
        # 確保語言代碼有效
        if language not in ['en', 'zh-TW']:
            language = 'zh-TW'  # 預設使用繁體中文
            
        # 讀取翻譯檔案
        static_folder = current_app.static_folder
        if static_folder is None:
            raise ValueError("應用程式的 static_folder 未設定")
        file_path = os.path.join(static_folder, 'locales', f'{language}.json')
        with open(file_path, 'r', encoding='utf-8') as f:
            translations = json.load(f)
        return translations
    except Exception as e:
        current_app.logger.error(f"載入翻譯檔案失敗: {e}")
        return {}

def translate(key, language=None):
    """
    翻譯指定的鍵值
    
    Args:
        key (str): 翻譯鍵值
        language (str, optional): 語言代碼，如果未提供則使用 session 中的語言設定
        
    Returns:
        str: 翻譯後的文字，如果找不到翻譯則返回鍵值本身
    """
    # 如果未提供語言代碼，則使用 session 中的語言設定
    if language is None:
        language = session.get('language', 'zh-TW')
        
    # 載入翻譯
    translations = load_translations(language)
    
    # 返回翻譯，如果找不到則返回鍵值本身
    return translations.get(key, key)

def get_user_language():
    """
    獲取用戶當前的語言設定
    
    Returns:
        str: 語言代碼，例如 'en' 或 'zh-TW'
    """
    return session.get('language', 'zh-TW')
