from airflow import DAG
from airflow.decorators import task
from datetime import datetime, timedelta
import pandas as pd
import clickhouse_connect
import os
import sys

# Add dags directory to path so we can import etl_modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from etl_modules.fetcher import fetch_news

# CONFIG
STOCKS = ["HPG", "VCB", "VNM", "FPT", "MWG"]
CLICKHOUSE_HOST = os.getenv("CLICKHOUSE_HOST", "clickhouse-server")
CLICKHOUSE_PORT = int(os.getenv("CLICKHOUSE_PORT", 8123))
CLICKHOUSE_USER = os.getenv("CLICKHOUSE_USER", "default")
CLICKHOUSE_PASSWORD = os.getenv("CLICKHOUSE_PASSWORD", "")

default_args = {
    "owner": "data_engineer",
    "retries": 2,
    "retry_delay": timedelta(minutes=5),
}

with DAG(
    dag_id="daily_news_fetch",
    default_args=default_args,
    schedule_interval="0 7 * * *",  # 7 AM Daily
    start_date=datetime(2024, 1, 1),
    catchup=False,
    tags=["news", "clickhouse"],
) as dag:

    @task
    def extract_news():
        news_data = []
        print("Fetching daily news...")

        for ticker in STOCKS:
            df = fetch_news(ticker)
            if not df.empty:
                news_data.append(df)

        if news_data:
            final_df = pd.concat(news_data)
            # Convert timestamp to string or ensure it's compatible if needed,
            # but ClickHouse connect handles datetime objects usually.
            return final_df.to_dict("records")
        return []

    @task
    def load_news(data):
        if not data:
            print("No news data to load.")
            return

        print(f"Connecting to ClickHouse at {CLICKHOUSE_HOST}:{CLICKHOUSE_PORT}...")
        client = clickhouse_connect.get_client(
            host=CLICKHOUSE_HOST,
            port=CLICKHOUSE_PORT,
            username=CLICKHOUSE_USER,
            password=CLICKHOUSE_PASSWORD,
        )

        print(f"Inserting {len(data)} news rows...")
        cols = [
            "ticker",
            "publish_date",
            "title",
            "source",
            "price_at_publish",
            "price_change",
            "price_change_ratio",
            "rsi",
            "rs",
            "news_id",
        ]
        tuples = []
        for row in data:
            tuples.append([row.get(c) for c in cols])

        client.insert("market_dwh.fact_news", tuples, column_names=cols)
        print("News insertion complete.")
        client.command("OPTIMIZE TABLE market_dwh.fact_news FINAL")

    # Orchestration
    news_records = extract_news()
    load_news(news_records)
