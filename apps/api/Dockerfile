FROM python:3.12-slim

WORKDIR /app

COPY apps/api/requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY apps/api /app
RUN chmod +x /app/start.sh

EXPOSE 8000
CMD ["/app/start.sh"]
