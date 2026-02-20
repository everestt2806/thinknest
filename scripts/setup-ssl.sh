#!/bin/bash
# ============================================
# Setup SSL for thinknest.everestt28.dev
# Chay 1 lan sau khi DNS da tro xong
# Usage: chmod +x scripts/setup-ssl.sh && ./scripts/setup-ssl.sh
# ============================================

set -e

DOMAIN="thinknest.everestt28.dev"
EMAIL="admin@everestt28.dev"

echo "==> Kiem tra DNS..."
RESOLVED_IP=$(dig +short $DOMAIN)
VPS_IP=$(curl -s ifconfig.me)

if [ "$RESOLVED_IP" != "$VPS_IP" ]; then
    echo "WARNING: DNS chua tro dung!"
    echo "  Domain tro toi: $RESOLVED_IP"
    echo "  VPS IP: $VPS_IP"
    echo "  Hay doi DNS cap nhat roi chay lai."
    exit 1
fi

echo "==> DNS OK! $DOMAIN -> $RESOLVED_IP"

echo "==> Dang xin SSL cert tu Let's Encrypt..."
docker compose run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    --email $EMAIL \
    --agree-tos \
    --no-eff-email \
    -d $DOMAIN

echo "==> Cap nhat nginx config cho HTTPS..."
cat > nginx/nginx.conf << 'NGINXEOF'
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 20M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml
        application/rss+xml
        image/svg+xml;

    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;

    # HTTP -> HTTPS redirect
    server {
        listen 80;
        server_name thinknest.everestt28.dev;

        location /.well-known/acme-challenge/ {
            root /var/www/certbot;
        }

        location / {
            return 301 https://$host$request_uri;
        }
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name thinknest.everestt28.dev;

        ssl_certificate /etc/letsencrypt/live/thinknest.everestt28.dev/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/thinknest.everestt28.dev/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        add_header Strict-Transport-Security "max-age=63072000" always;
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;

        location / {
            limit_req zone=general burst=20 nodelay;

            proxy_pass http://app:3000;
            proxy_http_version 1.1;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";

            proxy_buffering off;
            proxy_cache off;
        }

        location /_next/static {
            proxy_pass http://app:3000;
            proxy_cache_valid 200 365d;
            add_header Cache-Control "public, max-age=31536000, immutable";
        }
    }
}
NGINXEOF

echo "==> Restart nginx..."
docker compose restart nginx

echo ""
echo "========================================="
echo "  SSL da cai thanh cong!"
echo "  Truy cap: https://thinknest.everestt28.dev"
echo "========================================="
