# 📦 Integration Setup Guide: onetapweb_t3 ↔ Coolify

ไฟล์อ้างอิงที่เตรียมไว้ใน Coolify repo (นำไปใช้ในโปรเจกต์ T3):

| ไฟล์ใน Coolify repo | วางที่ใน onetapweb_t3 |
|---|---|
| `PORTAL_COOLIFY_API_SERVICE.ts` | `lib/services/coolify.service.ts` |
| `PORTAL_T3_WEBHOOK_RECEIVER.ts` | `app/api/webhooks/coolify/route.ts` |
| `PORTAL_T3_SERVER_ACTION.ts` | `app/actions/site.actions.ts` |
| `PORTAL_T3_PRISMA_SCHEMA.prisma` | เพิ่มใน `prisma/schema.prisma` |
| `PORTAL_T3_ENV_EXAMPLE.env` | เพิ่มใน `.env.local` |

---

## Step 1: สร้าง Coolify API Token

1. เปิด Coolify Dashboard → **Security** → **API Tokens**
2. กด **Create Token**
3. ตั้งชื่อ: `onetapweb-t3-integration`
4. เลือก Permissions: ✅ `read` ✅ `write` ✅ `deploy`
5. Copy Token → วางใน `.env.local` ของ T3:
   ```
   COOLIFY_API_TOKEN=<token ที่ได้มา>
   ```

## Step 2: หา Server & Destination UUID

1. ไปที่ **Servers** → เลือก Server หลัก
2. ดู URL ของหน้านั้น: `coolify.yourdomain.com/server/<SERVER_UUID>`
3. ใต้ Server → **Destinations** → Copy UUID ของ Network
4. วางใน `.env.local`:
   ```
   COOLIFY_SERVER_UUID=<server uuid>
   COOLIFY_DESTINATION_UUID=<destination uuid>
   ```

## Step 3: คัดลอกไฟล์เข้า T3

```bash
# รันจาก terminal ในโฟลเดอร์ onetapweb_t3
mkdir -p lib/services app/api/webhooks/coolify app/actions

cp /path/to/coolify/PORTAL_COOLIFY_API_SERVICE.ts    lib/services/coolify.service.ts
cp /path/to/coolify/PORTAL_T3_WEBHOOK_RECEIVER.ts    app/api/webhooks/coolify/route.ts
cp /path/to/coolify/PORTAL_T3_SERVER_ACTION.ts       app/actions/site.actions.ts
```

## Step 4: อัปเดต Prisma Schema

เปิด `prisma/schema.prisma` แล้วเพิ่ม Model จาก `PORTAL_T3_PRISMA_SCHEMA.prisma` จากนั้นรัน:

```bash
npx prisma migrate dev --name add_customer_sites
npx prisma generate
```

## Step 5: ตั้งค่า Webhook บน Coolify

1. ไปที่ Coolify → **Settings** → **Notifications**
2. เลือก **Custom Webhook**
3. กรอก URL: `https://your-t3.onetapweb.com/api/webhooks/coolify`
4. กรอก Header: `Authorization: Bearer <COOLIFY_WEBHOOK_SECRET>`
5. เลือก Events: ✅ Deployment Success ✅ Deployment Failed ✅ Status Changed

## Step 6: ทดสอบ End-to-End

```bash
# ทดสอบ Webhook ด้วย curl
curl -X POST https://your-t3.onetapweb.com/api/webhooks/coolify \
  -H "Authorization: Bearer <COOLIFY_WEBHOOK_SECRET>" \
  -H "Content-Type: application/json" \
  -d '{"uuid":"test-123","status":"finished","name":"test-site"}'

# ควรได้ Response: {"received":true,"status":"ACTIVE"}
```

---

## ✅ Checklist สรุป

- [ ] สร้าง API Token บน Coolify
- [ ] Copy ไฟล์ทั้งหมดเข้า T3
- [ ] Fill in `.env.local` ให้ครบ 5 ค่า
- [ ] Run `prisma migrate dev`
- [ ] ตั้งค่า Webhook URL บน Coolify
- [ ] ทดสอบ curl → ได้ `{"received":true}`
- [ ] ทดสอบสร้างเว็บ WordPress จริงผ่าน Server Action
