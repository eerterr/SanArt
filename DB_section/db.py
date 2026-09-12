import pandas as pd
from pathlib import Path
import sqlite3

BASE_DIR = Path(__file__).parent.resolve()
DB_NAME = str(BASE_DIR / 'sanart.db')  # абсолютный путь — не зависит от текущей рабочей директории
DATA_DIR = BASE_DIR.parent / 'data'  # папка ../data

def get_events_dataframe():
    with sqlite3.connect(DB_NAME) as conn:
        return pd.read_sql("SELECT * FROM events_synthetic", conn)

def get_user_by_id(user_id: int):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        # ВАЖНО: параметры передавать только через знак вопроса (защита от инъекций и багов)
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        return cursor.fetchone()  # Вернет tuple или None

def add_event(event_name: str, metric_value: float):
    with sqlite3.connect(DB_NAME) as conn:
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO events_synthetic (event_name, capacity) VALUES (?, ?)",
            (event_name, metric_value)
        )
        conn.commit()  # Без этого изменения не сохранятся

def init_database():
    # Имена таблиц = имена csv-файлов в ../data
    tables = [
        'institutions_official',
        'events_synthetic',
        'attendance_synthetic',
        'audience_synthetic',
        'feedback_synthetic',
        'data_sources',
        'future_event_template',
        'venues_synthetic',
        'visitor_events_synthetic'
    ]

    with sqlite3.connect(DB_NAME) as conn:
        for table_name in tables:
            csv_path = DATA_DIR / f"{table_name}.csv"
            try:
                if not csv_path.exists():
                    raise FileNotFoundError(f"Файл не найден: {csv_path}")

                # utf-8-sig корректно съедает BOM, если он есть
                df = pd.read_csv(csv_path, encoding='utf-8-sig')

                # Заливаем в SQLite
                df.to_sql(table_name, conn, if_exists='replace', index=False)
                print(f"[OK] Таблица {table_name} загружена ({len(df)} строк).")
            except Exception as e:
                print(f"[FAIL] Ошибка с таблицей {table_name}: {e}")

if __name__ == "__main__":
    init_database()