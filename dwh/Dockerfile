FROM python:3.9-slim

WORKDIR /app

RUN pip install requests psycopg2-binary

COPY init_db.py .

CMD ["python", "init_db.py"]
