"""
СанАрт — простой бэкенд (Flask + SQLite).

Отдаёт реальные метрики фронтенду: institutions_official (реальные данные)
+ events/attendance/audience/feedback_synthetic (синтетика для демо ML/аналитики).
База — sanart.db, собранная из data/*.csv через DB_section/db.py.

Для демо показываем 2 реальных учреждения из датасета как организации из
Казани (это единственное, что "подставлено" — все метрики по ним настоящие,
посчитаны из исходных таблиц).

Запуск: python app.py  (поднимается на http://localhost:5000)
"""

import sys
from pathlib import Path

import pandas as pd
from flask import Flask, jsonify, request

sys.path.append(str(Path(__file__).parent.parent / "DB_section"))
from db import DB_NAME, init_database  # noqa: E402

KAZAN_ORGS = {
    "INST_014": {"name": "Казанский центр современного искусства", "city": "Казань", "role": "Owner"},
    "INST_007": {"name": "Казанская филармония", "city": "Казань", "role": "Organizer"},
}

AGE_GROUP_LABELS = {
    "school": "Школьники",
    "young": "Молодёжь",
    "adult": "Взрослые",
    "mature": "Средний возраст",
    "senior": "Старшее поколение",
}

# Длина окна в днях для каждой вкладки периода + подпись сравнения (как было
# в оригинальном референсе: "чем вчера" / "чем на прошлой неделе" и т.д.).
# "yesterday" — то же окно в 1 день, сдвинутое на день назад от "today".
PERIOD_WINDOWS = {
    "today": (1, 0),
    "yesterday": (1, 1),
    "week": (7, 0),
    "month": (30, 0),
    "quarter": (90, 0),
}
PERIOD_CAPTIONS = {
    "today": "чем вчера",
    "yesterday": "чем позавчера",
    "week": "чем на прошлой неделе",
    "month": "чем в прошлом месяце",
    "quarter": "чем в прошлом квартале",
}

app = Flask(__name__)


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    return response


def read_sql(query, params=()):
    import sqlite3

    if not Path(DB_NAME).exists():
        init_database()
    with sqlite3.connect(DB_NAME) as conn:
        return pd.read_sql(query, conn, params=params)


def require_known_institution(institution_id):
    return institution_id in KAZAN_ORGS


@app.route("/api/institutions")
def institutions():
    df = read_sql("SELECT institution_id, institution_type FROM institutions_official")
    result = []
    for inst_id, meta in KAZAN_ORGS.items():
        row = df[df["institution_id"] == inst_id].iloc[0]
        result.append(
            {
                "id": inst_id,
                "name": meta["name"],
                "city": meta["city"],
                "role": meta["role"],
                "type": row["institution_type"],
            }
        )
    return jsonify(result)


@app.route("/api/dashboard")
def dashboard():
    institution_id = request.args.get("institution_id", "")
    if not require_known_institution(institution_id):
        return jsonify({"error": "unknown institution_id"}), 404

    events = read_sql(
        "SELECT event_id, event_name, event_type, date FROM events_synthetic WHERE institution_id = ?",
        (institution_id,),
    )
    attendance = read_sql(
        """
        SELECT a.event_id, a.visitors, a.new_visitors, a.fill_rate_pct
        FROM attendance_synthetic a
        JOIN events_synthetic e ON e.event_id = a.event_id
        WHERE e.institution_id = ?
        """,
        (institution_id,),
    )

    kpis = {
        "visitors": int(attendance["visitors"].sum()) if len(attendance) else 0,
        "newVisitors": int(attendance["new_visitors"].sum()) if len(attendance) else 0,
        "eventsHeld": int(len(events)),
        "avgFillRatePct": round(float(attendance["fill_rate_pct"].mean()), 1) if len(attendance) else 0,
    }

    merged = events.merge(attendance, on="event_id")

    attendance_series_df = merged.groupby("date")["visitors"].sum().reset_index().sort_values("date")
    attendance_series = [
        {"date": row["date"], "value": int(row["visitors"])} for _, row in attendance_series_df.iterrows()
    ]

    total_events = len(events) or 1
    type_counts = events["event_type"].value_counts()
    event_types = [
        {"label": event_type, "pct": round(count / total_events * 100, 1)}
        for event_type, count in type_counts.items()
    ]

    top_events = (
        merged.sort_values("visitors", ascending=False)
        .head(5)[["event_name", "visitors"]]
        .rename(columns={"event_name": "label", "visitors": "value"})
        .to_dict("records")
    )

    visitor_ids = read_sql(
        "SELECT DISTINCT visitor_id FROM visitor_events_synthetic WHERE institution_id = ?",
        (institution_id,),
    )["visitor_id"].tolist()

    age_groups = []
    if visitor_ids:
        placeholders = ",".join("?" for _ in visitor_ids)
        audience = read_sql(
            f"SELECT age_group FROM audience_synthetic WHERE visitor_id IN ({placeholders})",
            visitor_ids,
        )
        counts = audience["age_group"].value_counts()
        total_visitors = len(audience) or 1
        for key, label in AGE_GROUP_LABELS.items():
            if key in counts:
                age_groups.append({"label": label, "pct": round(int(counts[key]) / total_visitors * 100, 1)})

    institutions_df = read_sql("SELECT institution_id, data_quality FROM institutions_official")
    flagged = int((institutions_df["data_quality"] != "OK").sum())
    own_row = institutions_df[institutions_df["institution_id"] == institution_id].iloc[0]
    own_quality = own_row["data_quality"]

    return jsonify(
        {
            "kpis": kpis,
            "attendanceSeries": attendance_series,
            "eventTypes": event_types,
            "topEvents": top_events,
            "ageGroups": age_groups,
            "dataQuality": {
                "institutionsFlagged": flagged,
                "institutionsTotal": int(len(institutions_df)),
                "ownStatus": own_quality,
                "ownIsOk": own_quality == "OK",
            },
            "dateRange": {
                "min": events["date"].min() if len(events) else None,
                "max": events["date"].max() if len(events) else None,
            },
        }
    )


@app.route("/api/kpis")
def kpis_by_period():
    institution_id = request.args.get("institution_id", "")
    period = request.args.get("period", "today")
    if not require_known_institution(institution_id) or period not in PERIOD_WINDOWS:
        return jsonify({"error": "bad request"}), 400

    events = read_sql(
        "SELECT event_id, date FROM events_synthetic WHERE institution_id = ?",
        (institution_id,),
    )
    attendance = read_sql(
        """
        SELECT a.event_id, a.visitors, a.new_visitors, a.fill_rate_pct
        FROM attendance_synthetic a
        JOIN events_synthetic e ON e.event_id = a.event_id
        WHERE e.institution_id = ?
        """,
        (institution_id,),
    )
    merged = events.merge(attendance, on="event_id")
    merged["date"] = pd.to_datetime(merged["date"])

    def window_metrics(frame):
        return {
            "visitors": int(frame["visitors"].sum()),
            "newVisitors": int(frame["new_visitors"].sum()),
            "eventsHeld": int(frame["event_id"].nunique()),
            "avgFillRatePct": round(float(frame["fill_rate_pct"].mean()), 1) if len(frame) else 0.0,
        }

    empty = {"visitors": 0, "newVisitors": 0, "eventsHeld": 0, "avgFillRatePct": 0.0}
    if merged.empty:
        cur_metrics = prev_metrics = empty
    else:
        length, shift_windows = PERIOD_WINDOWS[period]
        anchor = merged["date"].max()

        cur_end = anchor - pd.Timedelta(days=shift_windows * length)
        cur_start = cur_end - pd.Timedelta(days=length - 1)
        prev_end = cur_start - pd.Timedelta(days=1)
        prev_start = prev_end - pd.Timedelta(days=length - 1)

        cur_metrics = window_metrics(merged[(merged["date"] >= cur_start) & (merged["date"] <= cur_end)])
        prev_metrics = window_metrics(merged[(merged["date"] >= prev_start) & (merged["date"] <= prev_end)])

    def build_kpi(key):
        cur_v = cur_metrics[key]
        prev_v = prev_metrics[key]
        if prev_v:
            delta_pct = round((cur_v - prev_v) / prev_v * 100, 1)
            return {"value": cur_v, "deltaPct": delta_pct, "deltaDir": "up" if delta_pct >= 0 else "down", "caption": PERIOD_CAPTIONS[period]}
        return {"value": cur_v, "deltaPct": None, "deltaDir": None, "caption": "нет данных за пред. период"}

    return jsonify(
        {
            "visitors": build_kpi("visitors"),
            "newVisitors": build_kpi("newVisitors"),
            "eventsHeld": build_kpi("eventsHeld"),
            "avgFillRatePct": build_kpi("avgFillRatePct"),
        }
    )


@app.route("/api/events")
def events_list():
    institution_id = request.args.get("institution_id", "")
    if not require_known_institution(institution_id):
        return jsonify({"error": "unknown institution_id"}), 404

    events = read_sql(
        """
        SELECT event_id AS id, event_name AS name, event_type AS type, date,
               start_time AS startTime, duration_min AS durationMin,
               capacity, price_rub AS price
        FROM events_synthetic
        WHERE institution_id = ?
        ORDER BY date
        """,
        (institution_id,),
    )
    attendance = read_sql(
        "SELECT event_id AS id, visitors, fill_rate_pct AS fillRatePct FROM attendance_synthetic"
    )
    feedback = read_sql("SELECT event_id AS id, rating FROM feedback_synthetic")
    rating_by_event = feedback.groupby("id")["rating"].mean().round(1)

    merged = events.merge(attendance, on="id", how="left")
    merged["avgRating"] = merged["id"].map(rating_by_event)
    merged["avgRating"] = merged["avgRating"].where(merged["avgRating"].notna(), None)

    return jsonify(merged.to_dict("records"))


@app.route("/api/events/<event_id>")
def event_detail(event_id):
    event_df = read_sql(
        """
        SELECT event_id AS id, event_name AS name, event_type AS type, date,
               start_time AS startTime, duration_min AS durationMin,
               capacity, price_rub AS price, target_age_min AS targetAgeMin,
               target_age_max AS targetAgeMax
        FROM events_synthetic WHERE event_id = ?
        """,
        (event_id,),
    )
    if event_df.empty:
        return jsonify({"error": "not found"}), 404

    attendance_df = read_sql(
        """
        SELECT registered, visitors, repeat_visitors AS repeatVisitors,
               new_visitors AS newVisitors, fill_rate_pct AS fillRatePct,
               no_show_rate_pct AS noShowRatePct
        FROM attendance_synthetic WHERE event_id = ?
        """,
        (event_id,),
    )
    feedback_df = read_sql("SELECT rating FROM feedback_synthetic WHERE event_id = ?", (event_id,))

    result = event_df.iloc[0].to_dict()
    if not attendance_df.empty:
        result.update(attendance_df.iloc[0].to_dict())
    result["feedbackCount"] = int(len(feedback_df))
    result["avgRating"] = round(float(feedback_df["rating"].mean()), 1) if len(feedback_df) else None

    return jsonify(result)


if __name__ == "__main__":
    if not Path(DB_NAME).exists():
        init_database()
    app.run(port=5000, debug=True)
