#!/bin/bash
# ============================================
# THINKNEST - VPS Setup Script (Ubuntu)
# Chay 1 lan duy nhat tren VPS moi
# Usage: chmod +x vps-setup.sh && ./vps-setup.sh
# ============================================

set -e

REPO_URL="https://github.com/YOUR_USERNAME/thinknest.git"  # <-- THAY BANG REPO CUA BAN
APP_DIR="$HOME/thinknest"

echo "========================================="
echo " THINKNEST VPS Setup"
echo "========================================="

# 1. Update system
echo "[1/5] Updating system..."
sudo apt update && sudo apt upgrade -y

# 2. Install Docker
echo "[2/5] Installing Docker..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    sudo usermod -aG docker "$USER"
    echo "  -> Docker installed. You may need to re-login for group changes."
else
    echo "  -> Docker already installed."
fi

# 3. Install Docker Compose plugin
echo "[3/5] Checking Docker Compose..."
if ! docker compose version &> /dev/null; then
    sudo apt install -y docker-compose-plugin
    echo "  -> Docker Compose installed."
else
    echo "  -> Docker Compose already installed."
fi

# 4. Clone repo
echo "[4/5] Cloning repository..."
if [ -d "$APP_DIR" ]; then
    echo "  -> Directory exists, pulling latest..."
    cd "$APP_DIR" && git pull origin main
else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# 5. Create env file
echo "[5/5] Setting up environment..."
if [ ! -f "$APP_DIR/.env.local" ]; then
    cat > "$APP_DIR/.env.local" << 'EOF'
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
EOF
    echo "  -> Created .env.local - EDIT THIS FILE with your real Supabase credentials!"
    echo "     nano $APP_DIR/.env.local"
else
    echo "  -> .env.local already exists."
fi

echo ""
echo "========================================="
echo " Setup complete!"
echo "========================================="
echo ""
echo " Next steps:"
echo ""
echo " 1. Edit .env.local with your Supabase credentials:"
echo "    nano $APP_DIR/.env.local"
echo ""
echo " 2. Start the app:"
echo "    cd $APP_DIR && docker compose up --build -d"
echo ""
echo " 3. Check status:"
echo "    docker compose ps"
echo "    docker compose logs -f app"
echo ""
echo " 4. Setup SSL (optional, if you have a domain):"
echo "    sudo apt install certbot"
echo "    sudo certbot certonly --standalone -d your-domain.com"
echo "    cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/certs/"
echo "    cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/certs/"
echo "    # Then uncomment HTTPS block in nginx/nginx.conf"
echo "    docker compose restart nginx"
echo ""
echo " 5. Setup GitHub Actions CI/CD:"
echo "    Add these secrets in GitHub repo > Settings > Secrets:"
echo "    - VPS_HOST       = your VPS IP address"
echo "    - VPS_USER       = your SSH username (e.g. root)"
echo "    - VPS_SSH_KEY    = your private SSH key (cat ~/.ssh/id_rsa)"
echo "    - SUPABASE_URL   = your Supabase project URL"
echo "    - SUPABASE_ANON_KEY = your Supabase anon key"
echo ""
