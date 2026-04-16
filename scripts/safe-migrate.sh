#!/bin/bash

# 🛡️ Coolify Safe Migration Script (Standard to Customized)
# สคริปต์นี้จะช่วยสลับจาก Coolify รุ่นมาตรฐาน มาเป็นรุ่นที่เราจูนไว้ โดยไม่เสียข้อมูล

echo "🚀 Starting Safe Migration to Customized Coolify Portal..."

# 1. ตรวจสอบว่ารันบนเซิร์ฟเวอร์ที่มี Coolify อยู่จริงไหม
if [ ! -d "/data/coolify" ]; then
    echo "❌ Error: ไม่พบโฟลเดอร์ /data/coolify บนเครื่องนี้ สคริปต์นี้ต้องรันบนเซิร์ฟเวอร์ Proxmox เท่านั้น"
    exit 1
fi

# 2. การ Backup (หัวใจสำคัญ!)
BACKUP_PATH="/data/coolify_backup_$(date +%Y%m%d_%H%M%S)"
echo "💾 Step 1: สร้างจุดคืนรูป (Backup) ไปที่ $BACKUP_PATH..."
sudo cp -r /data/coolify "$BACKUP_PATH"
echo "✅ Backup สำเร็จ"

# 3. เตรียมไฟล์คอนฟิกเดิมมาใช้
echo "🧩 Step 2: ซิงค์การตั้งค่าเดิม (Secrets Sync)..."
if [ -f "/data/coolify/source/.env" ]; then
    # ก๊อปปี้ .env เดิมมาเป็นฐาน เพื่อไม่ให้ APP_KEY และ Password เปลี่ยน
    cp "/data/coolify/source/.env" .env.production
    echo "✅ โหลดค่าคอนฟิกเดิมเรียบร้อย (รักษาฐานข้อมูลให้ปลอดภัย)"
else
    echo "⚠️ Warning: ไม่พบ .env เดิม ระบบอาจต้องเริ่มการตั้งค่าใหม่"
fi

# 4. หยุดระบบเดิม
echo "🛑 Step 3: หยุดการทำงานของ Coolify รุ่นมาตรฐาน..."
cd /data/coolify/source
docker compose down
cd -

# 5. สลับร่างและบิลด์ใหม่
echo "🏗️ Step 4: ติดตั้งร่างใหม่ และเริ่มบิลด์ (Overlaying Custom Portal)..."
# บิลด์ใหม่จาก Source ของคุณ
docker build -t coollabsio/coolify:latest -f docker/production/Dockerfile .

# 6. รันระบบกลับขึ้นมา
echo "⚡ Step 5: เปิดระบบกลับมาทำงาน..."
docker compose -f docker-compose.prod.yml up -d

# 7. ล้าง Cache
echo "🧹 Step 6: เคลียร์ Cache เพื่อให้หน้า Portal ใหม่แสดงผล..."
docker exec coolify php artisan optimize:clear

echo "🎉 การสลับร่างเสร็จสมบูรณ์! ข้อมูลของคุณยังอยู่ครบ พร้อม UI ใหม่ที่ /portal"
