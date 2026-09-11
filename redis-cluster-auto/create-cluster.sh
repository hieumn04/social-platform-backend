#!/bin/bash
# FIX: Ensure LF line endings for WSL/Linux
set -euo pipefail

# 1. Load config
ENV_FILE="../.redis-cluster.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "❌ Error: $ENV_FILE not found"
    exit 1
fi

echo "[INFO] Loading variables from $ENV_FILE"
set -a
# Làm sạch file env khỏi ký tự \r trước khi load
source <(tr -d '\r' < "$ENV_FILE")
set +a

# 2. Cleanup
echo "[INFO] Cleaning old resources..."
# Dọn dẹp theo compose
docker compose down -v 2>/dev/null || true
# Dọn dẹp mạng cũ nếu có (bắt buộc để đổi subnet)
docker network rm redis-cluster-net 2>/dev/null || true
# Dọn dẹp bổ sung theo tên (phòng trường hợp các container cũ chạy bằng docker run)
for i in {1..6}; do
    docker rm -f "redis-node$i" >/dev/null 2>&1 || true
done
# Xóa dữ liệu cũ
rm -rf ./data/*
mkdir -p ./conf ./data

# 3. Create Redis configs
echo "[INFO] Generating Redis configurations..."
# Đảm bảo NODE_ARRAY không chứa ký tự \r
REDIS_NODES_CLEAN=$(echo "$REDIS_NODES" | tr -d '\r')
IFS=',' read -ra NODE_ARRAY <<< "$REDIS_NODES_CLEAN"

for node in "${NODE_ARRAY[@]}"; do
    name=${node%%:*}
    port=${node##*:}
    bus_port=$((port + 10000))

    # Xác định IP tĩnh tương ứng với từng node để khai báo announce-ip
    case $name in
        "redis-node1") node_ip="172.30.0.11" ;;
        "redis-node2") node_ip="172.30.0.12" ;;
        "redis-node3") node_ip="172.30.0.13" ;;
        "redis-node4") node_ip="172.30.0.14" ;;
        "redis-node5") node_ip="172.30.0.15" ;;
        "redis-node6") node_ip="172.30.0.16" ;;
    esac

    cat > "./conf/$name.conf" <<EOF
port $port
cluster-enabled yes
cluster-config-file nodes.conf
cluster-node-timeout 5000
appendonly yes
repl-diskless-sync yes
repl-diskless-load swapdb
bind 0.0.0.0
protected-mode no
requirepass $REDIS_CLUSTER_PASSWORD
masterauth $REDIS_CLUSTER_PASSWORD
# Best Practice: Khai báo IP tĩnh cho cluster
cluster-announce-ip $node_ip
cluster-announce-port $port
cluster-announce-bus-port $bus_port
EOF
done

# 4. Start nodes
echo "[INFO] Starting Redis containers via Docker Compose..."
docker compose up -d

# 5. Wait for nodes to be PING-able
echo "[INFO] Waiting for nodes to be ready..."
for node in "${NODE_ARRAY[@]}"; do
    name=${node%%:*}
    port=${node##*:}
    until docker exec "$name" redis-cli -p "$port" -a "$REDIS_CLUSTER_PASSWORD" ping | grep -q PONG; do
        echo "⏳ Waiting for $name..."
        sleep 1
    done
    echo "✅ $name is UP"
done

# 6. Create Cluster
echo "[INFO] Creating Redis Cluster..."
# We use static IPs here to bypass Docker DNS lag for high performance
IP_NODE_LIST="172.30.0.11:7100 172.30.0.12:7101 172.30.0.13:7102 172.30.0.14:7103 172.30.0.15:7104 172.30.0.16:7105"

yes yes | docker exec -i redis-node1 \
    redis-cli -p 7100 -a "$REDIS_CLUSTER_PASSWORD" \
    --cluster create $IP_NODE_LIST \
    --cluster-replicas "$REPLICAS"

# 7. Final check
echo "[INFO] Waiting for cluster to stabilize..."
sleep 5
docker exec redis-node1 redis-cli -p 7100 -a "$REDIS_CLUSTER_PASSWORD" cluster info

echo "🎉 Redis Cluster is READY (Standard/Static IP mode)"
