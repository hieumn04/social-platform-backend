#!/usr/bin/env bash
set -e  # Dừng script nếu có lỗi

# --- 1. Chuyển file sang LF (Unix) ---
echo "[INFO] Converting files to LF format..."
if command -v dos2unix >/dev/null 2>&1; then
  dos2unix ../.env.development >/dev/null 2>&1 || true
  dos2unix ./start.sh >/dev/null 2>&1 || true
else
  sed -i 's/\r$//' ../.env.development || true
  sed -i 's/\r$//' ./start.sh || true
fi

# --- 2. Load biến môi trường ---
echo "[INFO] Loading environment variables from ../.env.development"
set -a
source ../.env.development
set +a

# --- 3. Kiểm tra file template và generate JSON ---
TEMPLATE_JSON="./config/definitions.json"
OUTPUT_JSON="./config/definitions.generated.json"

if [ -f "$TEMPLATE_JSON" ]; then
  envsubst < "$TEMPLATE_JSON" > "$OUTPUT_JSON"
  echo "[INFO] Generated $OUTPUT_JSON from template $TEMPLATE_JSON"
else
  echo "[ERROR] Template JSON $TEMPLATE_JSON not found! Exiting."
  exit 1
fi

# --- 4. Chạy Docker Compose ---
echo "[INFO] Starting RabbitMQ container via Docker Compose..."
docker compose --env-file ../.env.development up -d

# --- 5. Kiểm tra RabbitMQ health ---
echo "[INFO] Waiting for RabbitMQ to become healthy..."
for i in {1..30}; do
  STATUS=$(docker inspect --format='{{.State.Health.Status}}' rabbitmq 2>/dev/null || echo "none")
  if [ "$STATUS" = "healthy" ]; then
    echo "[INFO] RabbitMQ container is healthy!"
    exit 0
  else
    echo "[INFO] Waiting... ($i/30)"
    sleep 2
  fi
done

echo "[WARN] RabbitMQ container did not become healthy in time. Check logs with: docker logs rabbitmq"
exit 1
