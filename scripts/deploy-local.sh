#!/bin/bash

# 🏗️ Proxmox Local Build & Deploy Script
# สำหรับการสร้าง Image จากซอร์สโค้ดปัจจุบัน (Customized Overlay)

echo "🏗️ Starting Customized Coolify Build Process..."

# 1. แก้ไข docker-compose.prod.yml ชั่วคราวเพื่อให้ Build จาก Source
# (หรือจะใช้ Dockerfile ตรงๆ ก็ได้)
echo "🔧 Configuring Docker Compose for local build..."

# เราจะใช้เทคนิค docker compose build เพื่อสร้าง image ชื่อ colabsio/coolify:latest ในเครื่องเราเอง
# ก่อนที่จะรัน compose up
docker build -t coollabsio/coolify:latest -f docker/production/Dockerfile .

# 2. รันระบบพร้อม Database และ Redis
echo "🚀 Deploying containers..."
docker compose -f docker-compose.prod.yml up -d

# 3. จัดการ Laravel Optimized
echo "🧹 Clearing Laravel caches..."
docker exec coolify php artisan optimize:clear
docker exec coolify php artisan view:clear

echo "✨ Deployment Complete! Access your portal at http://<proxmox-ip>:8000/portal"
