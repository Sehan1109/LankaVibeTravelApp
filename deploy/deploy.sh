#!/usr/bin/env bash
# Deployment helper script for a DigitalOcean droplet (Ubuntu)
# Run as a user with sudo privileges.

set -euo pipefail

# Adjust these variables to match your server layout
APP_DIR="/home/deploy/LankaVibe-AI_Travel_planner"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"
WEB_ROOT="/var/www/lankavibe"
SYSTEMD_UNIT="/etc/systemd/system/lankavibe-backend.service"
NGINX_SITE="/etc/nginx/sites-available/lankavibe"

echo "Building frontend..."
cd "$FRONTEND_DIR"
npm ci
npm run build

echo "Copying frontend build to $WEB_ROOT (requires sudo)..."
sudo mkdir -p "$WEB_ROOT"
sudo rm -rf "$WEB_ROOT"/* || true
sudo cp -r dist/* "$WEB_ROOT/"
sudo chown -R $USER:$USER "$WEB_ROOT"

echo "Installing backend dependencies..."
cd "$BACKEND_DIR"
npm ci

echo "Deploying systemd service (requires sudo)..."
sudo cp "$APP_DIR/deploy/lankavibe-backend.service" "$SYSTEMD_UNIT"
sudo systemctl daemon-reload
sudo systemctl enable --now lankavibe-backend.service

echo "Installing nginx site (requires sudo)..."
sudo cp "$APP_DIR/deploy/nginx.lankavibe.conf" "$NGINX_SITE"
sudo ln -sf "$NGINX_SITE" /etc/nginx/sites-enabled/lankavibe
sudo nginx -t
sudo systemctl reload nginx

echo "Deployment complete."
echo "Reminder: set real domain in deploy/nginx.lankavibe.conf and backend .env file at $BACKEND_DIR/.env"
