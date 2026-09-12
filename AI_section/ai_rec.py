from pathlib import Path
import requests
import urllib3
import uuid
import pandas as pd
import json
import re
import os
from typing import Union
from dotenv import load_dotenv

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

BASE_DIR = Path(__file__).parent.resolve()

load_dotenv(BASE_DIR / ".env")
AUTH_KEY = os.getenv("GIGACHAT_AUTH_KEY")

if not AUTH_KEY:
    raise ValueError("Токен не найден. Проверь наличие файла .env по пути {BASE_DIR}")

# GigaChat — российский домен Сбера, системный прокси (если он настроен в ОС,
# например для обхода блокировок) для него не нужен и часто ломает запрос:
# requests по умолчанию наследует прокси из окружения (trust_env), а если это
# SOCKS-прокси без установленного PySocks — падает с "Missing dependencies for
# SOCKS support" вместо реального ответа. Поэтому явно идём напрямую.
NO_PROXY = {"http": None, "https": None}

def get_access_token() -> str:
    url = "https://ngw.devices.sberbank.ru:9443/api/v2/oauth"
    payload = {'scope': 'GIGACHAT_API_PERS'}
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
        'RqUID': str(uuid.uuid4()),
        'Authorization': f'Basic {AUTH_KEY}'
    }

    response = requests.post(url, headers=headers, data=payload, verify=False, proxies=NO_PROXY)
    response.raise_for_status()
    return response.json()['access_token']

def generate_text(prompt: str, system_prompt: str = "") -> str:
    token = get_access_token()
    
    url = "https://gigachat.devices.sberbank.ru/api/v1/chat/completions"
    headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': f'Bearer {token}'
    }
    
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": "GigaChat", 
        "messages": messages,
        "temperature": 0.1,
    }

    response = requests.post(url, headers=headers, json=payload, verify=False, proxies=NO_PROXY)
    response.raise_for_status()

    return response.json()['choices'][0]['message']['content']

# Тут могут в будущем полететь пути, пока что необходимо держать их в одной папке с кодом.
def get_recommendation_json(event_input: Union[pd.DataFrame, str], rules_path: Path = BASE_DIR / "audience_rules.txt", schema_path: Path = BASE_DIR / "llm_output_schema.json") -> dict:
    # 1. Читаем схему
    try:
        with open(schema_path, "r", encoding="utf-8") as f:
            target_schema = json.load(f)
        schema_str = json.dumps(target_schema, indent=4, ensure_ascii=False)
    except FileNotFoundError:
        return {"error": f"Файл {schema_path} не найден."}
    except json.JSONDecodeError:
        return {"error": f"Файл {schema_path} содержит невалидный JSON."}

    # 1,5. Читаем инструкции
    instructions = ""
    try:
        with open(rules_path, "r", encoding="utf-8") as f:
            instructions = f.read()
    except FileNotFoundError:
        print(f"Ошибка: Файл {rules_path} не найден. LLM будет выдумывать правила на ходу.")

    # 2. Обработка зоопарка форматов на входе
    if isinstance(event_input, pd.DataFrame):
        try:
            event_details = event_input.to_json(orient="records", force_ascii=False)
        except Exception as e:
            return {"error": f"Ошибка парсинга датафрейма: {e}"}
    elif isinstance(event_input, str):
        # Оборачиваем сырой текст, чтобы LLM понимала, что это
        event_details = f"Свободное описание от пользователя: {event_input.strip()}"
    else:
        return {"error": "Неизвестный тип данных. Функция ждет DataFrame или строку."}

    # 3. Собираем промпты
    system_prompt = f"""Ты строгий аналитик форматов мероприятий. 
Твоя задача — проверить адекватность заявленного мероприятия (время, тема, формат) для указанной целевой аудитории, строго опираясь на переданные инструкции.
Выведи ответ СТРОГО в формате валидного JSON. Блок ```json ... ``` использовать НЕЛЬЗЯ, выводи только сам объект.

Ожидаемая структура ответа:
{schema_str}
"""

    user_prompt = f"""
ЦЕЛЕВОЕ МЕРОПРИЯТИЕ:
{event_details}

ИНСТРУКЦИИ (ПРАВИЛА ПО АУДИТОРИИ):
{instructions}
"""

    # 4. Вызываем API
    raw_response = generate_text(prompt=user_prompt, system_prompt=system_prompt)
    
    # 5. Парсим ответ
    cleaned_response = re.sub(r'^```(json)?\s*', '', raw_response, flags=re.IGNORECASE)
    cleaned_response = re.sub(r'\s*```$', '', cleaned_response).strip()
    
    try:
        return json.loads(cleaned_response)
    except json.JSONDecodeError as e:
        return {
            "error": "LLM сошла с ума и сломала JSON",
            "raw_text": raw_response,
            "details": str(e)
        }

if __name__ == "__main__":
    # df_current_event = pd.DataFrame([{
    #     "title": "Математика диффузионных моделей и SDE",
    #     "date": "2026-09-15",
    #     "time": "10:00",
    #     "audience": "Школьники 5-7 классов",
    #     "format": "Трехчасовая лекция"
    # }])
    user_text = "хочу провести в субботу мероприятие для детей про субд"
    
    # result = get_recommendation_json(df_current_event)
    result = get_recommendation_json(user_text)
    print(json.dumps(result, indent=4, ensure_ascii=False))