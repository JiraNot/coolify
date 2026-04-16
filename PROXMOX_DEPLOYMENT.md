# 🚀 Proxmox Deployment Guide (Personalized Overlay)

คู่มือนี้สำหรับติดตั้ง Coolify Portal ที่คุณปรับแต่งแล้วลงบน Proxmox VM โดยเฉพาะ

---

## 1. เตรียมความพร้อมบน Proxmox (VM หรือ CT)
ให้ใช้ Ubuntu 24.04 และรันคำสั่งเหล่านี้เพื่อเตรียมสภาพแวดล้อม:

### ⚠️ สำหรับ Proxmox CT (LXC) - *สำคัญมาก*
หากคุณรันบน CT ต้องตั้งค่าที่ตัว Proxmox Host ดังนี้ก่อนรันสคริปต์สลับร่าง:
1. ไปที่ **CT ของคุณ > Options > Features**
2. คลิก Edit และติ๊กถูกที่ **Nesting** (เพื่อให้ Docker ใน CT ทำงานได้)
3. ติ๊กถูกที่ **keyctl** (เพื่อให้ระบบ Authentication ของ Laravel ทำงานได้ปกติ)

```bash
# ติดตั้ง Docker และเครื่องมือที่จำเป็น
sudo apt update && sudo apt install -y docker.io docker-compose-v2 git rsync

# อนุญาตให้ user ปัจจุบันใช้ docker ได้ (ไม่ต้องใช้ sudo ทุกครั้ง)
sudo usermod -aG docker $USER
newgrp docker
```

## 2. การย้ายโค้ดไปที่เซิร์ฟเวอร์
เลือกวิธีที่คุณสะดวกที่สุด:

### วิธี A: ผ่าน Git (แนะนำ)
```bash
git clone https://github.com/JiraNot/coolify.git
cd coolify
git checkout feature/shared-hosting # เปลี่ยนเป็นกิ่งที่คุณทำงานอยู่
```

### วิธี B: ผ่าน Rsync (จากเครื่อง local)
```bash
rsync -avz --exclude 'node_modules' --exclude 'vendor' /home/jiranot/coolify user@proxmox-ip:/home/user/
```

---

## 3. การบิลด์และรันระบบ (The Overlay Order)

### ขั้นตอนที่ 1: เตรียม Environment
สร้างไฟล์ `.env` สำหรับ Production:
```bash
mkdir -p /data/coolify/source
cp .env.production /data/coolify/source/.env
```

### ขั้นตอนที่ 2: รันการบิลด์
ใช้คำสั่งพิเศษเพื่อ Build จาก Source ของคุณเอง:
```bash
# รันผ่านสคริปต์ที่เราเตรียมไว้
chmod +x scripts/deploy-local.sh
./scripts/deploy-local.sh
```

---

## 🛠️ กรณีที่ 2: ติดตั้ง Coolify รุ่นมาตรฐานไปแล้ว (Migration)

หากคุณติดตั้ง Coolify ไปแล้วและกังวลว่าข้อมูลจะหาย ให้ใช้สคริปต์กู้ชีพที่เราเตรียมไว้:

```bash
# 1. รันสคริปต์สลับร่างอย่างปลอดภัย
chmod +x scripts/safe-migrate.sh
sudo ./scripts/safe-migrate.sh
```

**สิ่งที่สคริปต์นี้จะทำ:**
- **Backup**: ก๊อปปี้ `/data/coolify` เก็บไว้ป้องกันเหตุสุดวิสัย
- **Logic Sync**: ดึง `APP_KEY` เดิมมาใช้เพื่อให้ฐานข้อมูลเดิมยังอ่านได้ปกติ
- **Overlay**: บิลด์ระบบ Portal ใหม่ทับลงไปบนฐานข้อมูลเดิม

---

## 4. คำสั่งจัดการหลังการติดตั้ง

- **ดู Log**: `docker logs -f coolify`
- **ล้าง Cache**: `docker exec coolify php artisan optimize:clear`
- **ดูสถานะ**: `docker ps`

---

> [!IMPORTANT]
> **อย่าลืม!** ตั้งค่า `SESSION_DRIVER=redis` ใน `.env` เพื่อประสิทธิภาพสูงสุดตาม Master Plan
