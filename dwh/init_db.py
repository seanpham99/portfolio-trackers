import os
import requests
import psycopg2
from psycopg2.extras import execute_values

# Database connection parameters
DB_HOST = os.getenv("POSTGRES_HOST", "postgres-dw")
DB_PORT = os.getenv("POSTGRES_PORT", "5432")
DB_NAME = os.getenv("POSTGRES_DB", "market_data_db")
DB_USER = os.getenv("POSTGRES_USER", "admin")
DB_PASSWORD = os.getenv("POSTGRES_PASSWORD", "admin_password")

API_URL = "https://cafef1.mediacdn.vn/Search/company.json"
HEADERS = {
    "accept": "*/*",
    "accept-language": "en,vi-VN;q=0.9,vi;q=0.8,fr-FR;q=0.7,fr;q=0.6,en-US;q=0.5",
    "priority": "u=1, i",
    "sec-ch-ua": '"Chromium";v="142", "Google Chrome";v="142", "Not_A Brand";v="99"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "cross-site",
    "referrer": "https://cafef.vn/",
    "mode": "cors",
}


def get_db_connection():
    conn = psycopg2.connect(
        host=DB_HOST, port=DB_PORT, dbname=DB_NAME, user=DB_USER, password=DB_PASSWORD
    )
    return conn


def create_table(conn):
    create_table_query = """
    CREATE TABLE IF NOT EXISTS company (
        id SERIAL PRIMARY KEY,
        symbol TEXT,
        title TEXT,
        description TEXT,
        CONSTRAINT unique_symbol UNIQUE (symbol)
    );
    """
    with conn.cursor() as cur:
        cur.execute(create_table_query)
    conn.commit()
    print("Table 'company' created or already exists.")


def fetch_data():
    print(f"Fetching data from {API_URL}...")
    response = requests.get(API_URL, headers=HEADERS)
    response.raise_for_status()
    return response.json()


def insert_data(conn, data):
    insert_query = """
    INSERT INTO company (symbol, title, description)
    VALUES %s
    ON CONFLICT (symbol) DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description;
    """

    values = [
        (
            item.get("Symbol"),
            item.get("Title"),
            item.get("Description"),
        )
        for item in data
    ]

    with conn.cursor() as cur:
        execute_values(cur, insert_query, values)
    conn.commit()
    print(f"Inserted/Updated {len(values)} records.")


def main():
    try:
        conn = get_db_connection()
        print("Connected to database.")

        create_table(conn)

        data = fetch_data()
        if data:
            insert_data(conn, data)
        else:
            print("No data received from API.")

        conn.close()
        print("Initialization complete.")

    except Exception as e:
        print(f"An error occurred: {e}")


if __name__ == "__main__":
    main()
